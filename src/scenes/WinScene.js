import Phaser from 'phaser';
import SoundManager from '../managers/SoundManager.js';
import {
  HUD_STROKE_COLOR, HUD_STROKE_THICKNESS, WIN_FONT_SIZE, BTN_FONT_SIZE
} from '../constants.js';

/**
 * 最终胜利场景
 * 显示通关祝贺、累计总得分和返回菜单按钮
 */
export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create(data) {
    const W = this.scale.width;
    const H = this.scale.height;

    const totalScore = data?.totalScore ?? 0;
    const lives = data?.lives ?? 0;

    // 播放胜利音乐
    const soundManager = new SoundManager(this);
    soundManager.playWin();

    // 渐变背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x0f3460, 0x16213e, 0x228B22, 1);
    bg.fillRect(0, 0, W, H);

    // 星星装饰
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.Between(1, 3);
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
    }

    // 标题
    this.add.text(W / 2, H * 0.20, '🎉 恭喜通关！', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5);

    // 副标题
    this.add.text(W / 2, H * 0.30, '你拯救了这个世界！', {
      fontSize: '24px',
      color: '#aaddff',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // 总得分
    this.add.text(W / 2, H * 0.42, `最终得分：${totalScore}`, {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS
    }).setOrigin(0.5);

    // 剩余血量
    if (lives > 0) {
      this.add.text(W / 2, H * 0.52, `剩余血量：${'❤️'.repeat(lives)}`, {
        fontSize: '28px',
        color: '#ff6666'
      }).setOrigin(0.5);
    }

    // 感谢文字
    this.add.text(W / 2, H * 0.63, '感谢游玩！', {
      fontSize: '22px',
      color: '#cccccc'
    }).setOrigin(0.5);

    // 返回菜单按钮
    const btn = this.add.text(W / 2, H * 0.78, '🏠 返回菜单', {
      fontSize: BTN_FONT_SIZE,
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#228B22',
      padding: { x: 28, y: 12 },
      stroke: HUD_STROKE_COLOR,
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#32CD32' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#228B22' }));
    btn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // 键盘快捷返回
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}