import Phaser from 'phaser';
import { COIN_SCALE } from '../constants.js';

/**
 * 金币类
 * 继承自 Phaser.Physics.Arcade.Sprite
 * 创建时自动播放旋转动画
 * 物理属性由 GameScene 的 group 统一管理（无重力、不可移动）
 */
export default class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'coin');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(COIN_SCALE);
    this.play('coin_spin');
  }
}