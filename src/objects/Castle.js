import Phaser from 'phaser';
import { GROUND_HEIGHT } from '../constants.js';

export default class Castle {
  constructor(scene, x, y) {
    const g = scene.add.graphics();    
    const castleColor = 0x888888;
    const darkColor = 0x555555;

    const W = 120;
    const H = 140;
    const baseY = y;
    const baseX = x - W / 2;

    // 城墙主体
    g.setDepth(-1); // 确保城堡在玩家和平台下方
    g.fillStyle(castleColor, 1);
    g.fillRect(baseX, baseY - H, W, H);

    // 城垛 (5个)
    const merlonW = 18;
    const merlonH = 20;
    const merlonGap = 6;
    for (let i = 0; i < 5; i++) {
      g.fillRect(baseX + i * (merlonW + merlonGap), baseY - H - merlonH, merlonW, merlonH);
    }

    // 拱门
    const doorW = 36;
    const doorH = 50;
    const doorX = x - doorW / 2;
    const doorY = baseY - doorH;

    g.fillStyle(darkColor, 1);
    g.fillRect(doorX, doorY, doorW, doorH);

    // 拱门圆顶
    g.fillCircle(x, doorY, doorW / 2);

    // 城堡物理体（用于碰撞检测）
    this.zone = scene.add.zone(x, baseY - H / 2, doorW, H);
    scene.physics.add.existing(this.zone, true);
  }
}