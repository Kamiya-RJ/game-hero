import Phaser from 'phaser';
import SoundManager from '../managers/SoundManager.js';

/**
 * 游戏主菜单场景
 * 游戏启动和通关/失败后返回时显示
 * 包含游戏标题和开始游戏按钮
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 渐变背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
    bg.fillRect(0, 0, W, H);

    // 装饰星星
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.75);
      const r = Phaser.Math.FloatBetween(1, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.4, 1);
      const star = this.add.circle(x, y, r, 0xffffff, alpha);
      // 随机闪烁
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500)
      });
    }

    // 地面装饰色块
    this.add.rectangle(W / 2, H - 40, W, 80, 0x228B22);
    this.add.rectangle(W / 2, H - 85, W, 10, 0x32CD32);

    // 游戏标题
    this.add.text(W / 2, H / 2 - 160, '冒险小勇士', {
      fontSize: '52px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);

    // 副标题
    this.add.text(W / 2, H / 2 - 95, 'Adventure Little Hero', {
      fontSize: '20px',
      color: '#aaddff',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // 操作说明
    this.add.text(W / 2, H / 2 - 10, [
      '← → 移动    ↑ 跳跃',
      'Ctrl 加速跑    踩头消灭敌人',
    ].join('\n'), {
      fontSize: '15px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // 开始按钮
    const btn = this.add.text(W / 2, H / 2 + 80, '▶  开始游戏', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#228B22',
      padding: { x: 32, y: 14 },
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // 按钮动画：轻微上下浮动
    this.tweens.add({
      targets: btn,
      y: btn.y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    btn.on('pointerover', () => {
      btn.setStyle({ backgroundColor: '#32CD32' });
      this.tweens.getTweensOf(btn).forEach(t => t.pause());
      btn.setScale(1.05);
    });
    btn.on('pointerout', () => {
      btn.setStyle({ backgroundColor: '#228B22' });
      this.tweens.getTweensOf(btn).forEach(t => t.resume());
      btn.setScale(1);
    });
    btn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // 底部版权
    this.add.text(W / 2, H - 16, '按任意键也可开始', {
      fontSize: '13px',
      color: '#666666'
    }).setOrigin(0.5);

    // 键盘快捷启动
    this.input.keyboard.once('keydown', () => {
      this.scene.start('GameScene');
    });
  }
}
