import Phaser from 'phaser';
import SoundManager from '../managers/SoundManager.js';
import {
  GAMEOVER_FONT_SIZE, BTN_FONT_SIZE, HUD_STROKE_COLOR, HUD_STROKE_THICKNESS
} from '../constants.js';

/**
 * 游戏结束场景
 * 玩家生命归零后触发
 * 显示 Game Over 信息和重玩按钮
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const soundManager = new SoundManager(this);
    soundManager.playGameOver();

    const W = this.scale.width;
    const H = this.scale.height;

    // 半透明黑色遮罩
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);

    // 标题
    this.add.text(W / 2, H / 2 - 100, '💀 Game Over', {
      fontSize: GAMEOVER_FONT_SIZE,
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS * 1.5
    }).setOrigin(0.5);

    // 重玩按钮
    const btn = this.add.text(W / 2, H / 2 + 20, '再来一次', {
      fontSize: BTN_FONT_SIZE,
      color: '#ffffff',
      backgroundColor: '#cc2222',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => btn.setStyle({ color: '#FFD700' }));
    btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
    btn.on('pointerdown', () => this.scene.start('GameScene'));
  }
}