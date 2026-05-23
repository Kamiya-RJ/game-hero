import Phaser from 'phaser';
import SoundManager from '../managers/SoundManager.js';
import {
  GAMEOVER_FONT_SIZE, BTN_FONT_SIZE, HUD_STROKE_COLOR, HUD_STROKE_THICKNESS,
  DIFFICULTY, CONTINUE_COUNTDOWN
} from '../constants.js';

/**
 * 游戏结束场景
 * 玩家生命归零后触发
 * 显示 Game Over 信息、续关倒计时和重玩按钮
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data) {
    const soundManager = new SoundManager(this);
    soundManager.playGameOver();

    const W = this.scale.width;
    const H = this.scale.height;
    const score = data?.score ?? 0;
    const levelId = data?.levelId ?? 1;
    const difficulty = this.registry.get('difficulty') || 'normal';

    // 半透明黑色遮罩
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);

    // 标题
    this.add.text(W / 2, H / 2 - 130, '💀 Game Over', {
      fontSize: GAMEOVER_FONT_SIZE,
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS * 1.5
    }).setOrigin(0.5);

    // 得分
    this.add.text(W / 2, H / 2 - 50, `得分：${score}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ── 续关倒计时 ──
    const diffCfg = DIFFICULTY[difficulty];
    this.countdown = CONTINUE_COUNTDOWN;
    this.continueText = this.add.text(W / 2, H / 2 + 10, '', {
      fontSize: '22px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this._updateContinueText(diffCfg);

    // 倒计时事件
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: CONTINUE_COUNTDOWN - 1,
      callback: () => {
        this.countdown--;
        if (this.countdown > 0) {
          this._updateContinueText(diffCfg);
        } else {
          this._hideContinue();
        }
      }
    });

    // ── 续关按钮 ──
    this.continueBtn = this.add.text(W / 2 - 100, H / 2 + 55, '🔄 续关', {
      fontSize: BTN_FONT_SIZE,
      color: '#ffffff',
      backgroundColor: '#cc8800',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.continueBtn.on('pointerover', () => this.continueBtn.setStyle({ color: '#FFD700' }));
    this.continueBtn.on('pointerout', () => this.continueBtn.setStyle({ color: '#ffffff' }));
    this.continueBtn.on('pointerdown', () => {
      if (this.countdown <= 0) return;
      this.countdownTimer.destroy();
      // 续关：恢复满血，从当前关卡重新开始
      this.scene.start('GameScene', {
        levelId: levelId,
        totalScore: score,
        lives: diffCfg.lives
      });
    });

    // ── 不续关按钮 ──
    this.quitBtn = this.add.text(W / 2 + 100, H / 2 + 55, '🏠 返回标题', {
      fontSize: BTN_FONT_SIZE,
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.quitBtn.on('pointerover', () => this.quitBtn.setStyle({ color: '#FFD700' }));
    this.quitBtn.on('pointerout', () => this.quitBtn.setStyle({ color: '#ffffff' }));
    this.quitBtn.on('pointerdown', () => {
      this.countdownTimer.destroy();
      this.scene.start('MenuScene');
    });

    // 底部提示
    this.add.text(W / 2, H - 30, '按空格续关  |  按 ESC 返回标题', {
      fontSize: '13px',
      color: '#666666'
    }).setOrigin(0.5);

    // 键盘快捷键
    this.input.keyboard.once('keydown-SPACE', () => this.continueBtn.emit('pointerdown'));
    this.input.keyboard.once('keydown-ESC', () => this.quitBtn.emit('pointerdown'));
  }

  _updateContinueText(diffCfg) {
    this.continueText.setText(
      `续关倒计时：${this.countdown}秒（${diffCfg.label}难度，${diffCfg.lives}条命）`
    );
  }

  _hideContinue() {
    this.continueText.setText('续关时间结束');
    this.continueText.setColor('#ff4444');
    this.continueBtn.setAlpha(0.3);
    this.continueBtn.disableInteractive();
  }
}