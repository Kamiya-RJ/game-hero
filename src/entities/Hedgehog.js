import Phaser from 'phaser';
import {
  HEDGEHOG_SPEED, HEDGEHOG_SCALE,
  HEDGEHOG_BODY_WIDTH, HEDGEHOG_BODY_HEIGHT,
  HEDGEHOG_BODY_OFFSET_X, HEDGEHOG_BODY_OFFSET_Y,
  HEDGEHOG_PATROL_HALF, HEDGEHOG_SPIKE_INTERVAL,
  HEDGEHOG_SPIKE_DURATION, HEDGEHOG_SCORE_VALUE,
  HEDGEHOG_FRAMERATE
} from '../constants.js';

/**
 * 刺猬地面敌人
 *
 * 行为逻辑（方案C）：
 *   巡逻：在出生点左右 HEDGEHOG_PATROL_HALF 像素内来回走
 *   伸缩刺：每隔 HEDGEHOG_SPIKE_INTERVAL 毫秒出刺，
 *           持续 HEDGEHOG_SPIKE_DURATION 毫秒后收刺
 *
 * 状态说明：
 *   spiked = false → Idle_1（安全），玩家可以踩死
 *   spiked = true  → Idle_2（危险），玩家踩到会受伤
 *   transition     → Spikes_in / Spikes_out 过渡动画，期间同 spiked 状态
 *
 * 动画键名：
 *   hedgehog_idle1    收刺待机
 *   hedgehog_idle2    出刺待机
 *   hedgehog_spikes_out  收→出刺过渡
 *   hedgehog_spikes_in   出→收刺过渡
 *   hedgehog_hit      受击/死亡
 */
export default class Hedgehog extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hedgehog_idle1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(HEDGEHOG_SCALE);
    this.setCollideWorldBounds(true);

    // 物理体尺寸
    this.body.setSize(HEDGEHOG_BODY_WIDTH, HEDGEHOG_BODY_HEIGHT);
    this.body.setOffset(HEDGEHOG_BODY_OFFSET_X, HEDGEHOG_BODY_OFFSET_Y);

    // 巡逻起点
    this.startX = x;
    // 随机初始方向
    this.direction = Math.random() > 0.5 ? 1 : -1;
    // 随机速度微调，让每个刺猬移动节奏不同
    this.moveSpeed = HEDGEHOG_SPEED * (0.7 + Math.random() * 0.6);

    // 刺状态
    this.spiked = false;       // 当前是否处于出刺危险状态
    this.transitioning = false; // 是否正在播放过渡动画

    this.setVelocityX(this.moveSpeed * this.direction);
    // 向右时翻转（素材默认朝左，眼睛朝右需要 flip）
    this.setFlipX(this.direction === 1);
    this.play('hedgehog_idle1');

    // 启动刺猬出刺定时器
    this._startSpikeTimer(scene);
  }

  /**
   * 启动出刺 / 收刺定时循环
   * 用 scene.time.addEvent 而非 setInterval，确保随场景生命周期一起清理
   * 每个刺猬初始延迟随机，避免同步出刺
   */
  _startSpikeTimer(scene) {
    const initialDelay = Phaser.Math.Between(0, HEDGEHOG_SPIKE_INTERVAL);
    scene.time.addEvent({
      delay: HEDGEHOG_SPIKE_INTERVAL,
      loop: true,
      callback: () => {
        if (!this.active) return;
        if (!this.spiked) {
          this._extendSpikes();
        }
      },
      startAt: initialDelay
    });
  }

  /** 出刺：播放 spikes_out 过渡后切换到 idle2 */
  _extendSpikes() {
    if (this.transitioning || !this.active) return;
    this.transitioning = true;

    this.play('hedgehog_spikes_out');
    this.once('animationcomplete-hedgehog_spikes_out', () => {
      if (!this.active) return;
      this.spiked = true;
      this.transitioning = false;
      this.play('hedgehog_idle2');

      // 出刺持续一段时间后自动收刺
      this.scene.time.delayedCall(HEDGEHOG_SPIKE_DURATION, () => {
        this._retractSpikes();
      });
    });
  }

  /** 收刺：播放 spikes_in 过渡后切换到 idle1 */
  _retractSpikes() {
    if (this.transitioning || !this.active) return;
    this.transitioning = true;

    this.play('hedgehog_spikes_in');
    this.once('animationcomplete-hedgehog_spikes_in', () => {
      if (!this.active) return;
      this.spiked = false;
      this.transitioning = false;
      this.play('hedgehog_idle1');
    });
  }

  /**
   * 每帧更新
   * 处理巡逻方向和动画朝向
   */
  update() {
    if (!this.active) return;

    // 碰墙反向
    if (this.body.blocked.right) {
      this.direction = -1;
      this.setFlipX(false); // 向左，不翻转
    } else if (this.body.blocked.left) {
      this.direction = 1;
      this.setFlipX(true);  // 向右，翻转素材
    }

    // 超出巡逻范围反向
    if (this.x > this.startX + HEDGEHOG_PATROL_HALF) {
      this.direction = -1;
      this.setFlipX(false);
    } else if (this.x < this.startX - HEDGEHOG_PATROL_HALF) {
      this.direction = 1;
      this.setFlipX(true);
    }

    this.setVelocityX(this.moveSpeed * this.direction);
  }

  /**
   * 被踩死（仅在 spiked=false 时允许调用）
   * 停止移动，播放受击动画后消失
   */
  die() {
    this.setVelocityX(0);
    this.setActive(false);
    this.body.enable = false;
    this.play('hedgehog_hit');

    // 闪烁后消失
    this.scene.time.addEvent({
      delay: 100,
      repeat: 3,
      callback: () => { this.setVisible(!this.visible); }
    });
    this.scene.time.delayedCall(400, () => {
      this.destroy();
    });
  }
}