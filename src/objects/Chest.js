import Phaser from 'phaser';
import { CHEST_SIZE, CHEST_SCORE_VALUE, CHEST_COIN_COUNT, CHEST_HEAL_VALUE } from '../constants.js';

/**
 * 宝箱
 *
 * 玩家从下方撞击时触发：
 *   reward='coin' → 弹出多枚金币，加分
 *   reward='heal' → 弹出爱心，玩家加血（不超过初始上限）
 *
 * 触发后宝箱盖子打开（视觉变化），变为已用完状态
 */
export default class Chest extends Phaser.Physics.Arcade.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {'coin'|'heal'} reward
   * @param {number} color  宝箱主色
   */
  constructor(scene, x, y, reward = 'coin', color = 0xFFAA00) {
    const texKey = `chest_closed_${color}`;
    if (!scene.textures.exists(texKey)) {
      Chest._makeTexture(scene, texKey, color, false);
    }

    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.reward  = reward;
    this.used    = false;
    this._color  = color;
  }

  /** 被玩家从下方撞击时调用 */
  hit(gameScene) {
    if (this.used) return;
    this.used = true;

    // 切换为开盖纹理
    const openKey = `chest_open_${this._color}`;
    if (!gameScene.textures.exists(openKey)) {
      Chest._makeTexture(gameScene, openKey, this._color, true);
    }
    this.setTexture(openKey);
    this.body.reset(this.x, this.y);

    // 撞击弹动
    const origY = this.y;
    gameScene.tweens.add({
      targets: this,
      y: origY - 10,
      duration: 90,
      yoyo: true,
      onUpdate: () => { this.body.reset(this.x, this.y); }
    });

    if (this.reward === 'coin') {
      this._popCoins(gameScene);
    } else {
      this._popHeal(gameScene);
    }

    gameScene.score += CHEST_SCORE_VALUE;
    gameScene.scoreText.setText('Score: ' + gameScene.score);
  }

  /** 弹出金币：多枚金币向上散开 */
  _popCoins(gameScene) {
    for (let i = 0; i < CHEST_COIN_COUNT; i++) {
      const coin = gameScene.add.circle(
        this.x + Phaser.Math.Between(-10, 10),
        this.y - CHEST_SIZE,
        7, 0xFFD700
      );
      gameScene.tweens.add({
        targets: coin,
        x: coin.x + Phaser.Math.Between(-40, 40),
        y: coin.y - Phaser.Math.Between(40, 90),
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        delay: i * 80,
        onComplete: () => coin.destroy()
      });

      gameScene.score += 10;
      gameScene.totalCoins += 1;
      gameScene.collectedCoins += 1;
    }
    gameScene.scoreText.setText('Score: ' + gameScene.score);
  }

  /** 弹出爱心：爱心向上飞，玩家加血 */
  _popHeal(gameScene) {
    const heart = gameScene.add.text(this.x, this.y - CHEST_SIZE, '❤️', {
      fontSize: '24px'
    }).setOrigin(0.5);

    gameScene.tweens.add({
      targets: heart,
      y: heart.y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => heart.destroy()
    });

    // 加血，不超过初始上限
    const maxLives = gameScene.initialLives;
    if (gameScene.lives < maxLives) {
      gameScene.lives = Math.min(gameScene.lives + CHEST_HEAL_VALUE, maxLives);
      gameScene.livesText.setText('❤️ x' + gameScene.lives);
    }
  }

  /** 生成宝箱纹理（关闭/打开两种状态） */
  static _makeTexture(scene, key, color, open) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const S = CHEST_SIZE;

    // 箱体
    g.fillStyle(color, 1);
    g.fillRect(0, S * 0.35, S, S * 0.65);

    // 箱体暗边
    g.fillStyle(0x000000, 0.25);
    g.fillRect(0, S - 4, S, 4);
    g.fillRect(S - 4, S * 0.35, 4, S * 0.65);

    // 锁扣
    g.fillStyle(0xccaa00, 1);
    g.fillRect(S * 0.38, S * 0.55, S * 0.24, S * 0.22);

    if (open) {
      // 打开：盖子向后翻（用梯形近似）
      g.fillStyle(color, 1);
      g.fillRect(0, 0, S, S * 0.30);
      g.fillStyle(0x000000, 0.15);
      g.fillRect(0, S * 0.28, S, 4);
      // 内部黑色
      g.fillStyle(0x111111, 1);
      g.fillRect(2, S * 0.35, S - 4, S * 0.18);
    } else {
      // 关闭：完整盖子
      g.fillStyle(color, 1);
      g.fillRect(0, 0, S, S * 0.38);
      // 盖子暗边
      g.fillStyle(0x000000, 0.2);
      g.fillRect(0, S * 0.35, S, 4);
      // 盖子顶部高光
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(0, 0, S, 4);
    }

    // 外框线
    g.lineStyle(2, 0x000000, 0.5);
    g.strokeRect(0, 0, S, S);

    g.generateTexture(key, S, S);
    g.destroy();
  }
}
