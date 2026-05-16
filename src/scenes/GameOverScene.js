import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 背景遮罩
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);

    // 标题
    this.add.text(W / 2, H / 2 - 100, '💀 Game Over', {
      fontSize: '52px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // 重来按钮
    const btn = this.add.text(W / 2, H / 2 + 20, '再来一次', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#cc2222',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => btn.setStyle({ color: '#FFD700' }));
    btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
    btn.on('pointerdown', () => this.scene.start('GameScene'));
  }
}