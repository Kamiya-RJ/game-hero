import Phaser from 'phaser';
import SoundManager from '../managers/SoundManager.js';
import { DIFFICULTY } from '../constants.js';

/**
 * 游戏主菜单场景
 * 游戏启动和通关/失败后返回时显示
 * 包含游戏标题、难度选择和开始游戏按钮
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 默认难度
    if (!this.registry.get('difficulty')) {
      this.registry.set('difficulty', 'normal');
    }
    if (this.registry.get('bgmMuted') === undefined) {
      this.registry.set('bgmMuted', false);
    }

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

    // ==========================================
    // 标题
    // ==========================================
    this.add.text(W / 2, H * 0.10, '冒险小勇士', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.19, 'Adventure Little Hero', {
      fontSize: '16px',
      color: '#aaddff',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // ==========================================
    // 操作说明
    // ==========================================
    const helpBg = this.add.rectangle(W / 2, H * 0.33, 400, 65, 0x000000, 0.4)
      .setStrokeStyle(1, 0x444444);
    this.add.text(W / 2, H * 0.33, [
      '⇐ ⇒ 移动     ⇑ 跳跃    Ctrl 加速',
      '踩头消灭敌人    收集金币通关',
    ].join('\n'), {
      fontSize: '15px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);



    // ==========================================
    // 难度选择
    // ==========================================
    this.add.text(W / 2, H * 0.43, '🎮 难度选择', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const diffKeys = Object.keys(DIFFICULTY);
    const cardW = 130;
    const cardH = 55;
    const cardGap = 20;
    const totalCardsW = diffKeys.length * cardW + (diffKeys.length - 1) * cardGap;
    const cardStartX = W / 2 - totalCardsW / 2 + cardW / 2;
    const cardY = H * 0.50;

    this.diffCards = [];

    diffKeys.forEach((key, i) => {
      const d = DIFFICULTY[key];
      const isActive = this.registry.get('difficulty') === key;
      const cx = cardStartX + i * (cardW + cardGap);

      // 卡片背景
      const card = this.add.rectangle(cx, cardY, cardW, cardH, isActive ? 0x3366cc : 0x222244)
        .setStrokeStyle(2, isActive ? 0x6699ff : 0x444466)
        .setInteractive({ useHandCursor: true });

      // 卡片标签
      const label = this.add.text(cx, cardY - 8, d.label, {
        fontSize: '20px',
        color: isActive ? '#ffffff' : '#999999',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // 血量图标
      const hearts = '❤️'.repeat(d.lives > 5 ? 5 : d.lives);
      const livesText = this.add.text(cx, cardY + 14, hearts, {
        fontSize: '12px'
      }).setOrigin(0.5);

      card.on('pointerdown', () => {
        this.registry.set('difficulty', key);
        this._updateDifficultyUI();
      });

      card.on('pointerover', () => {
        if (!isActive) {
          card.setFillStyle(0x334477);
          card.setStrokeStyle(2, 0x5577aa);
          label.setColor('#dddddd');
        }
      });

      card.on('pointerout', () => {
        if (this.registry.get('difficulty') !== key) {
          card.setFillStyle(0x222244);
          card.setStrokeStyle(2, 0x444466);
          label.setColor('#999999');
        }
      });

      this.diffCards.push({ card, label, livesText, key });
    });

    // 难度描述
    const initialDiff = DIFFICULTY[this.registry.get('difficulty')];
    this.diffDesc = this.add.text(W / 2, H * 0.57, `❤️ x${initialDiff.lives}   —   ${initialDiff.description}`, {
      fontSize: '18px',
      color: '#ff9966',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ==========================================
    // 开始按钮
    // ==========================================
    const btn = this.add.text(W / 2, H * 0.68, '▶  开 始 游 戏', {
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#228B22',
      padding: { x: 40, y: 16 },
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: btn,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    btn.on('pointerover', () => {
      btn.setStyle({ backgroundColor: '#32CD32' });
      btn.setScale(1.1);
    });
    btn.on('pointerout', () => {
      btn.setStyle({ backgroundColor: '#228B22' });
      btn.setScale(1);
    });
    btn.on('pointerdown', () => {
      const diffKey = this.registry.get('difficulty');
      const lives = DIFFICULTY[diffKey].lives;
      this.scene.start('GameScene', {
        levelId: 1,
        totalScore: 0,
        lives: lives
      });
    });

    // ==========================================
    // BGM 开关
    // ==========================================
    const bgmMuted = this.registry.get('bgmMuted');
    this.bgmBtn = this.add.text(W / 2, H * 0.78, bgmMuted ? '🔇 音乐：关' : '🔊 音乐：开', {
      fontSize: '15px',
      color: '#aaaaaa',
      backgroundColor: '#222222',
      padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.bgmBtn.on('pointerdown', () => {
      const muted = !this.registry.get('bgmMuted');
      this.registry.set('bgmMuted', muted);
      this.bgmBtn.setText(muted ? '🔇 音乐：关' : '🔊 音乐：开');
    });

    this.bgmBtn.on('pointerover', () => this.bgmBtn.setStyle({ color: '#ffffff' }));
    this.bgmBtn.on('pointerout', () => this.bgmBtn.setStyle({ color: '#aaaaaa' }));

    // ==========================================
    // 底部
    // ==========================================
    this.add.text(W / 2, H - 16, '按空格键也可开始', {
      fontSize: '13px',
      color: '#555555'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      const diffKey = this.registry.get('difficulty');
      const lives = DIFFICULTY[diffKey].lives;
      this.scene.start('GameScene', {
        levelId: 1,
        totalScore: 0,
        lives: lives
      });
    });
  }

  /**
   * 更新难度选择 UI：高亮选中卡片，更新描述文字
   */
  _updateDifficultyUI() {
    const diffKey = this.registry.get('difficulty');
    const d = DIFFICULTY[diffKey];

    this.diffCards.forEach(({ card, label, livesText, key }) => {
      const active = key === diffKey;
      card.setFillStyle(active ? 0x3366cc : 0x222244);
      card.setStrokeStyle(2, active ? 0x6699ff : 0x444466);
      label.setColor(active ? '#ffffff' : '#999999');
      label.setFontStyle(active ? 'bold' : 'normal');
      const hearts = '❤️'.repeat(DIFFICULTY[key].lives > 5 ? 5 : DIFFICULTY[key].lives);
      livesText.setText(hearts);
    });

    this.diffDesc.setText(`❤️ x${d.lives}   —   ${d.description}`);
  }
}