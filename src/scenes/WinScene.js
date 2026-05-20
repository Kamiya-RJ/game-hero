import Phaser from 'phaser';
import SoundManager from '../managers/SoundManager.js';
import { WIN_FONT_SIZE, BTN_FONT_SIZE } from '../constants.js';

/**
 * 关卡完成场景
 * 玩家进入城堡后触发
 * 显示恭喜信息和重玩按钮
 */
export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create(data) {
    const soundManager = new SoundManager(this);
    soundManager.playWin();

    const W = this.scale.width;
    const H = this.scale.height;
    const score = data?.score ?? 0;

    // 半透明黑色遮罩
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);

    // 标题
    this.add.text(W / 2, H / 2 - 100, '🎉 关卡完成！', {
      fontSize: WIN_FONT_SIZE,
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 得分
    this.add.text(W / 2, H / 2 - 20, `得分：${score}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 重玩按钮
    const btn = this.add.text(W / 2, H / 2 + 60, '再来一次', {
      fontSize: BTN_FONT_SIZE,
      color: '#ffffff',
      backgroundColor: '#228B22',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => btn.setStyle({ color: '#FFD700' }));
    btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}