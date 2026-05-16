import Phaser from 'phaser';
import { FLAG_POLE_HEIGHT, FLAG_POLE_WIDTH, FLAG_WIDTH, FLAG_HEIGHT } from '../constants.js';

/**
 * 旗子类
 * 用 Phaser Graphics 绘制旗杆和三角旗
 * 放置在世界中点，作为关卡进度标记
 * depth = -1 确保渲染在玩家后面
 */
export default class Flag {
  constructor(scene, x, y) {
    const graphics = scene.add.graphics();
    graphics.setDepth(-1);

    // 旗杆（灰色竖线）
    graphics.fillStyle(0xaaaaaa, 1);
    graphics.fillRect(x - FLAG_POLE_WIDTH / 2, y - FLAG_POLE_HEIGHT, FLAG_POLE_WIDTH, FLAG_POLE_HEIGHT);

    // 三角旗（红色）
    graphics.fillStyle(0xff0000, 1);
    graphics.fillTriangle(
      x + FLAG_POLE_WIDTH / 2, y - FLAG_POLE_HEIGHT,               // 左上顶点
      x + FLAG_POLE_WIDTH / 2, y - FLAG_POLE_HEIGHT + FLAG_HEIGHT, // 左下顶点
      x + FLAG_POLE_WIDTH / 2 + FLAG_WIDTH, y - FLAG_POLE_HEIGHT + FLAG_HEIGHT / 2 // 右侧顶点
    );
  }
}