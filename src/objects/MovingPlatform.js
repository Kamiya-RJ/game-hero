import Phaser from 'phaser';
import { MOVING_PLATFORM_WIDTH, MOVING_PLATFORM_HEIGHT, MOVING_PLATFORM_SPEED } from '../constants.js';

export default class MovingPlatform extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, type = 'horizontal', range = 100, speed = MOVING_PLATFORM_SPEED, color = 0x228B22) {
    const texKey = `moving_platform_${color}_${Math.floor(Math.random() * 999999)}`;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, MOVING_PLATFORM_WIDTH, MOVING_PLATFORM_HEIGHT);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(0, 0, MOVING_PLATFORM_WIDTH, 3);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(0, MOVING_PLATFORM_HEIGHT - 3, MOVING_PLATFORM_WIDTH, 3);
    g.generateTexture(texKey, MOVING_PLATFORM_WIDTH, MOVING_PLATFORM_HEIGHT);
    g.destroy();

    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this); // ← dynamic body（不加 true）

    // 关键：不受重力，不可推动，但可以有速度
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.startX = x;
    this.startY = y;
    this.moveRange = range;
    this.moveSpeed = speed;
    this.moveType = type;

    // 初始方向
    this._moveDir = 1;
  }

  update() {
    // 根据类型设置速度
    if (this.moveType === 'horizontal') {
      this.body.setVelocityX(this.moveSpeed * this._moveDir);

      // 到达边界反转方向
      if (this._moveDir === 1 && this.x >= this.startX + this.moveRange) {
        this._moveDir = -1;
        this.x = this.startX + this.moveRange; // 防止超出
      } else if (this._moveDir === -1 && this.x <= this.startX - this.moveRange) {
        this._moveDir = 1;
        this.x = this.startX - this.moveRange;
      }
    } else {
      this.body.setVelocityY(this.moveSpeed * this._moveDir);

      if (this._moveDir === 1 && this.y >= this.startY + this.moveRange) {
        this._moveDir = -1;
        this.y = this.startY + this.moveRange;
      } else if (this._moveDir === -1 && this.y <= this.startY - this.moveRange) {
        this._moveDir = 1;
        this.y = this.startY - this.moveRange;
      }
    }
  }
}