import Phaser from 'phaser';
import {
  PLAYER_SCALE, PLAYER_SPEED, PLAYER_SPEED_SPRINT, PLAYER_JUMP_VELOCITY,
  PLAYER_JUMP_HOLD_FRAMES, PLAYER_JUMP_HOLD_FORCE, PLAYER_JUMP_MIN_VELOCITY
} from '../constants.js';

/**
 * 玩家角色类
 * 继承自 Phaser.Physics.Arcade.Sprite
 * 负责玩家的移动、跳跃和动画
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.soundManager = scene.soundManager;

    this.setScale(PLAYER_SCALE);

    // 碰撞体：宽度缩到 10px（边缘敏感），高度保持 26px，底部留 6px 空隙
    // 这样脚底实际碰撞区域只有底部一小块在平台上，边缘一超出就掉
    // 但头顶能正常撞平台，从下方跳跃不会穿过
    this.body.setSize(10, 26);
    this.body.setOffset(11, 6);

    // 只碰左右边界，不碰底部，确保玩家能掉进沟里
    this.setCollideWorldBounds(true, 1, 1, false);

    // 跳跃状态
    this.isJumping = false;
    this.jumpTime = 0;

    this.createAnimations(scene);
  }

  /**
   * 注册玩家所有动画
   * idle: 站立, run: 跑步, jump: 跳跃
   */
  createAnimations(scene) {
    if (!scene.anims.exists('anim_idle')) {
      scene.anims.create({
        key: 'anim_idle',
        frames: scene.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!scene.anims.exists('anim_run')) {
      scene.anims.create({
        key: 'anim_run',
        frames: scene.anims.generateFrameNumbers('run', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1
      });
    }

    if (!scene.anims.exists('anim_jump')) {
      scene.anims.create({
        key: 'anim_jump',
        frames: scene.anims.generateFrameNumbers('jump', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: 0
      });
    }

    this.play('anim_idle');
  }

  /**
   * 每帧更新玩家状态
   * 处理左右移动、动画切换和可变跳跃
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors 键盘输入
   */
  update(cursors) {
    const onGround = this.body.blocked.down;
    const speed = cursors.ctrl.isDown ? PLAYER_SPEED_SPRINT : PLAYER_SPEED;

    // 左右移动
    if (cursors.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
      if (onGround) this.play('anim_run', true);
    } else if (cursors.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false);
      if (onGround) this.play('anim_run', true);
    } else {
      this.setVelocityX(0);
      if (onGround) this.play('anim_idle', true);
    }

    // 可变跳跃：按下空格触发跳跃
    const jumpKey = cursors.up;
    if (Phaser.Input.Keyboard.JustDown(jumpKey) && onGround) {
      this.setVelocityY(PLAYER_JUMP_VELOCITY);
      this.isJumping = true;
      this.jumpTime = 0;
      this.play('anim_jump', true);
      if (this.soundManager) this.soundManager.playJump();
    }

    // 长按空格持续向上施力（大跳）
    if (jumpKey.isDown && this.isJumping) {
      this.jumpTime += 1;
      if (this.jumpTime < PLAYER_JUMP_HOLD_FRAMES) {
        this.setVelocityY(this.body.velocity.y - PLAYER_JUMP_HOLD_FORCE);
      }
    }

    // 松开空格截断跳跃速度（小跳）
    if (Phaser.Input.Keyboard.JustUp(jumpKey)) {
      if (this.body.velocity.y < PLAYER_JUMP_MIN_VELOCITY) {
        this.setVelocityY(PLAYER_JUMP_MIN_VELOCITY);
      }
      this.isJumping = false;
    }

    // 落地时重置跳跃状态
    if (onGround) {
      this.isJumping = false;
      this.jumpTime = 0;
    }
  }
}