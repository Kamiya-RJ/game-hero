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
    scene.physics.add.existing(this, true); // static body

    this.setImmovable(true);

    const duration = (range / speed) * 1000;

    if (type === 'horizontal') {
      scene.tweens.add({
        targets: this,
        x: x + range,
        duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          // static body 没有 reset 方法，直接更新 position
          this.body.position.x = this.x - this.width / 2;
          this.body.position.y = this.y - this.height / 2;
        }
      });
    } else {
      scene.tweens.add({
        targets: this,
        y: y + range,
        duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          this.body.position.x = this.x - this.width / 2;
          this.body.position.y = this.y - this.height / 2;
        }
      });
    }
  }
}