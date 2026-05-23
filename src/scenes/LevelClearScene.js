import Phaser from 'phaser';
import { LEVELS } from '../config/levels.js';
import {
  LEVEL_CLEAR_FONT_LARGE, LEVEL_CLEAR_FONT_MEDIUM, LEVEL_CLEAR_FONT_SMALL,
  LEVEL_CLEAR_DELAY, LEVEL_CLEAR_LINE_GAP,
  HUD_STROKE_COLOR, HUD_STROKE_THICKNESS, BTN_FONT_SIZE
} from '../constants.js';

/**
 * 关卡结算场景
 *
 * 接收 data：
 *   levelId       当前关卡编号（1~4）
 *   score         本关得分
 *   totalScore    累计总得分（含之前关卡）
 *   lives         剩余血量
 *   collectedCoins 本关收集金币数
 *   totalCoins    本关金币总数
 */
export default class LevelClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelClearScene' });
  }

  create(data) {
    const W = this.scale.width;
    const H = this.scale.height;

    const {
      levelId = 1,
      score = 0,
      totalScore = 0,
      lives = 3,
      collectedCoins = 0,
      totalCoins = 0,
    } = data;

    const isLastLevel = levelId >= LEVELS.length;

    // 半透明深色遮罩
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75);

    // 标题
    this.add.text(W / 2, H * 0.18, `🏆 第 ${levelId} 关完成！`, {
      fontSize: LEVEL_CLEAR_FONT_LARGE,
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS,
    }).setOrigin(0.5);

    // 结算项目，逐行延迟出现
    const items = [
      { label: '本关得分', value: score, color: '#FFD700' },
      { label: '金币收集', value: `${collectedCoins} / ${totalCoins}`, color: '#FFD700' },
      { label: '剩余血量', value: '❤️'.repeat(lives), color: '#ff6666' },
      { label: '累计总得分', value: totalScore, color: '#aaffaa' },
    ];

    const startY = H * 0.35;
    items.forEach((item, i) => {
      const y = startY + i * LEVEL_CLEAR_LINE_GAP;
      const delay = LEVEL_CLEAR_DELAY + i * 200;

      // 标签
      const label = this.add.text(W * 0.28, y, item.label + '：', {
        fontSize: LEVEL_CLEAR_FONT_MEDIUM,
        color: '#cccccc',
      }).setOrigin(0, 0.5).setAlpha(0);

      // 数值
      const value = this.add.text(W * 0.72, y, String(item.value), {
        fontSize: LEVEL_CLEAR_FONT_MEDIUM,
        color: item.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5).setAlpha(0);

      // 淡入
      this.time.delayedCall(delay, () => {
        this.tweens.add({ targets: [label, value], alpha: 1, duration: 300 });
      });
    });

    // 分隔线
    const lineY = startY + items.length * LEVEL_CLEAR_LINE_GAP + 10;
    const line = this.add.rectangle(W / 2, lineY, W * 0.6, 2, 0x888888).setAlpha(0);
    this.time.delayedCall(LEVEL_CLEAR_DELAY + items.length * 200, () => {
      this.tweens.add({ targets: line, alpha: 1, duration: 300 });
    });

    // 按钮
    const btnY = lineY + 60;
    const btnDelay = LEVEL_CLEAR_DELAY + items.length * 200 + 400;

    const btnLabel = isLastLevel ? '🏆 查看总成绩' : '下一关 ▶';
    const btnColor = isLastLevel ? '#cc8800' : '#1a6fcc';

    const btn = this.add.text(W / 2, btnY, btnLabel, {
      fontSize: BTN_FONT_SIZE,
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: btnColor,
      padding: { x: 28, y: 12 },
      stroke: HUD_STROKE_COLOR,
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.time.delayedCall(btnDelay, () => {
      this.tweens.add({ targets: btn, alpha: 1, duration: 400 });
    });

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', () => {
      if (isLastLevel) {
        // 跳转到最终胜利场景
        this.scene.start('WinScene', {
          totalScore: totalScore,
          lives: lives
        });
      } else {
        // 进入下一关
        this.scene.start('GameScene', {
          levelId: levelId + 1,
          totalScore: totalScore,
          lives: lives,
        });
      }
    });

    // 空格/回车快捷键
    this.input.keyboard.once('keydown-SPACE', () => btn.emit('pointerdown'));
    this.input.keyboard.once('keydown-ENTER', () => btn.emit('pointerdown'));
  }
}
