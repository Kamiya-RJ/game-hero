import Phaser from 'phaser';
import { GROUND_HEIGHT } from '../constants.js';

export default class Flag {
  constructor(scene, x, y) {
    const graphics = scene.add.graphics();

    graphics.setDepth(-1); // 确保旗子在玩家和平台下方

    // 旗杆
    graphics.fillStyle(0xaaaaaa, 1);
    graphics.fillRect(x - 2, y - 80, 4, 80);

    // 三角旗
    graphics.fillStyle(0xff0000, 1);
    graphics.fillTriangle(
      x + 2, y - 80,  // 顶点
      x + 2, y - 55,  // 底部
      x + 28, y - 68  // 右侧
    );
  }
}