import Phaser from 'phaser';
import { BRICK_SIZE, BRICK_SCORE_VALUE, BRICK_COIN_VALUE } from '../constants.js';

/**
 * 可击碎砖块
 *
 * 玩家从下方跳起撞击砖块底部时触发：
 *   hasCoin=true  → 弹出一枚金币动画，加分，然后砖块变灰（已用完）
 *   hasCoin=false → 砖块碎裂动画后销毁
 *
 * 碰撞检测在 GameScene.createColliders() 里用 overlap 处理，
 * 判断条件：玩家头部（body.blocked.up）碰到砖块底部
 */
export default class Brick extends Phaser.Physics.Arcade.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {boolean} hasCoin  是否含金币
   * @param {number} color     砖块颜色
   */
  constructor(scene, x, y, hasCoin = false, color = 0xcc6633) {
    const texKey = `brick_${color}`;
    if (!scene.textures.exists(texKey)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      // 主体
      g.fillStyle(color, 1);
      g.fillRect(0, 0, BRICK_SIZE, BRICK_SIZE);
      // 砖缝横线
      g.lineStyle(1, 0x000000, 0.3);
      g.beginPath(); g.moveTo(0, BRICK_SIZE / 2); g.lineTo(BRICK_SIZE, BRICK_SIZE / 2); g.strokePath();
      // 砖缝竖线（错位）
      g.beginPath(); g.moveTo(BRICK_SIZE / 2, 0); g.lineTo(BRICK_SIZE / 2, BRICK_SIZE / 2); g.strokePath();
      g.beginPath(); g.moveTo(BRICK_SIZE / 4, BRICK_SIZE / 2); g.lineTo(BRICK_SIZE / 4, BRICK_SIZE); g.strokePath();
      g.beginPath(); g.moveTo(BRICK_SIZE * 3 / 4, BRICK_SIZE / 2); g.lineTo(BRICK_SIZE * 3 / 4, BRICK_SIZE); g.strokePath();
      // 顶部高光
      g.fillStyle(0xffffff, 0.15);
      g.fillRect(0, 0, BRICK_SIZE, 4);
      g.generateTexture(texKey, BRICK_SIZE, BRICK_SIZE);
      g.destroy();
    }

    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // 静态体

    this.hasCoin   = hasCoin;
    this.used      = false;   // 已触发过，防止重复触发
    this._color    = color;
    this._texKey   = texKey;
  }

  /**
   * 被玩家从下方撞击时调用（由 GameScene 触发）
   * @param {GameScene} gameScene
   */
  hit(gameScene) {
    if (this.used) return;
    this.used = true;

    if (this.hasCoin) {
      this._popCoin(gameScene);
    } else {
      this._shatter(gameScene);
    }
  }

  /** 弹出金币效果：金币向上飞出后消失，砖块变灰 */
  _popCoin(gameScene) {
    // 弹出金币动画（小圆点向上飞）
    const coin = gameScene.add.circle(this.x, this.y - BRICK_SIZE, 8, 0xFFD700);
    gameScene.tweens.add({
      targets: coin,
      y: this.y - BRICK_SIZE * 3,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => coin.destroy()
    });

    // 加分
    gameScene.score += BRICK_COIN_VALUE;
    gameScene.scoreText.setText('Score: ' + gameScene.score);
    gameScene.totalCoins += 1;
    gameScene.collectedCoins += 1;

    // 砖块变灰（已用完状态）
    const usedKey = `brick_used`;
    if (!gameScene.textures.exists(usedKey)) {
      const g = gameScene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x888888, 1);
      g.fillRect(0, 0, BRICK_SIZE, BRICK_SIZE);
      g.lineStyle(1, 0x000000, 0.3);
      g.beginPath(); g.moveTo(0, BRICK_SIZE / 2); g.lineTo(BRICK_SIZE, BRICK_SIZE / 2); g.strokePath();
      g.generateTexture(usedKey, BRICK_SIZE, BRICK_SIZE);
      g.destroy();
    }
    this.setTexture(usedKey);

    // 撞击弹动
    this._bounce(gameScene);
  }

  /** 砖块碎裂：4块碎片飞散后销毁 */
  _shatter(gameScene) {
    gameScene.score += BRICK_SCORE_VALUE;
    gameScene.scoreText.setText('Score: ' + gameScene.score);

    // 生成4块碎片
    const offsets = [[-8,-8],[8,-8],[-8,8],[8,8]];
    offsets.forEach(([dx, dy]) => {
      const frag = gameScene.add.rectangle(
        this.x + dx, this.y + dy,
        BRICK_SIZE / 2 - 2, BRICK_SIZE / 2 - 2,
        this._color
      );
      gameScene.tweens.add({
        targets: frag,
        x: frag.x + dx * 4 + Phaser.Math.Between(-20, 20),
        y: frag.y + dy * 4 - Phaser.Math.Between(20, 50),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => frag.destroy()
      });
    });

    this.destroy();
  }

  /** 撞击时的弹动效果 */
  _bounce(gameScene) {
    const origY = this.y;
    gameScene.tweens.add({
      targets: this,
      y: origY - 8,
      duration: 80,
      yoyo: true,
      onUpdate: () => { this.body.reset(this.x, this.y); }
    });
  }
}
