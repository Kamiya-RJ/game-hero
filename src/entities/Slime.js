import Phaser from 'phaser';
import {
  SLIME_SPEED, SLIME_SCALE, SLIME_BODY_WIDTH, SLIME_BODY_HEIGHT,
  SLIME_BODY_OFFSET_X, SLIME_BODY_OFFSET_Y, PLATFORM_WIDTH, SLIME_PATROL_MARGIN
} from '../constants.js';

/**
 * 史莱姆敌人类
 * 继承自 Phaser.Physics.Arcade.Sprite
 * 在平台上来回巡逻，碰到边缘或墙壁时反向
 */
export default class Slime extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'slime_run');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(SLIME_SCALE);
    this.setCollideWorldBounds(true);
    this.setVelocityX(SLIME_SPEED);

    // 巡逻方向：1 向右，-1 向左
    this.direction = 1;

    // 记录出生点，用于计算巡逻范围
    this.startX = x;

    // 缩小物理体，避免超出平台边缘
    this.body.setSize(SLIME_BODY_WIDTH, SLIME_BODY_HEIGHT);
    this.body.setOffset(SLIME_BODY_OFFSET_X, SLIME_BODY_OFFSET_Y);

    this.play('slime_run');
  }

  /**
   * 每帧更新巡逻逻辑
   * 优先检测世界边界，其次检测平台边缘范围
   */
  update() {
    // 碰到世界边界时反向
    if (this.body.blocked.right) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.body.blocked.left) {
      this.direction = 1;
      this.setFlipX(false);
    }

    // 超出平台巡逻范围时反向
    const patrolRange = PLATFORM_WIDTH / 2 - SLIME_PATROL_MARGIN;
    if (this.x > this.startX + patrolRange) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.x < this.startX - patrolRange) {
      this.direction = 1;
      this.setFlipX(false);
    }

    this.setVelocityX(SLIME_SPEED * this.direction);
  }

  /**
   * 被踩死时触发
   * 立刻停止移动，播放受击动画后销毁
   */
  die() {
    this.setVelocityX(0);
    this.setActive(false);
    this.play('slime_hit');
    this.once('animationcomplete', () => {
      this.destroy();
    });
  }
}