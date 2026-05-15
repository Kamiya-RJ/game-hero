import Phaser from 'phaser';

export default class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'coin');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(2);
    this.play('coin_spin');
  }
}