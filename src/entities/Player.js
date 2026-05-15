import Phaser from 'phaser';
import { PLAYER_SCALE, PLAYER_HEIGHT, GROUND_HEIGHT } from '../constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(PLAYER_SCALE);
    this.setCollideWorldBounds(true);

    this.createAnimations(scene);
  }

  createAnimations(scene) {
    scene.anims.create({
      key: 'anim_idle',
      frames: scene.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'anim_run',
      frames: scene.anims.generateFrameNumbers('run', { start: 0, end: 5 }),
      frameRate: 12,
      repeat: -1
    });

    scene.anims.create({
      key: 'anim_jump',
      frames: scene.anims.generateFrameNumbers('jump', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: 0
    });

    this.play('anim_idle');
  }

  update(cursors) {
    const onGround = this.body.blocked.down;
    const speed = cursors.ctrl.isDown ? 500 : 250;

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

    if (Phaser.Input.Keyboard.JustDown(cursors.space) && onGround) {
      this.setVelocityY(-600);
      this.play('anim_jump', true);
    }
  }
}