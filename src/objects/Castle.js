import Phaser from 'phaser';
import {
  CASTLE_MAIN_W, CASTLE_MAIN_H,
  CASTLE_TOWER_W, CASTLE_TOWER_H,
  CASTLE_CENTER_TOWER_W, CASTLE_CENTER_TOWER_H,
  CASTLE_DOOR_W, CASTLE_DOOR_H
} from '../constants.js';

/**
 * 城堡类
 * 用 Phaser Graphics 绘制完整城堡
 * 包括主楼、左右塔楼、中央高塔、窗户、拱门
 * 拱门处设置 zone 物理体，用于触发关卡完成
 * depth = -1 确保渲染在玩家后面
 */
export default class Castle {
  constructor(scene, x, y) {
    const g = scene.add.graphics();
    g.setDepth(-1);

    const baseX = x - CASTLE_MAIN_W / 2;  // 主楼左边缘
    const baseY = y;                        // 地面位置

    // =====================
    // 主楼
    // =====================
    g.fillStyle(0x999999, 1);
    g.fillRect(baseX, baseY - CASTLE_MAIN_H, CASTLE_MAIN_W, CASTLE_MAIN_H);

    // 主楼城垛（6个）
    for (let i = 0; i < 6; i++) {
      g.fillRect(baseX + i * 28, baseY - CASTLE_MAIN_H - 30, 18, 30);
    }

    // =====================
    // 左侧塔楼
    // =====================
    const leftTowerX = baseX - CASTLE_TOWER_W + 10;
    g.fillStyle(0x888888, 1);
    g.fillRect(leftTowerX, baseY - CASTLE_TOWER_H, CASTLE_TOWER_W, CASTLE_TOWER_H);

    // 左塔城垛（3个）
    for (let i = 0; i < 3; i++) {
      g.fillRect(leftTowerX + i * 18, baseY - CASTLE_TOWER_H - 25, 12, 25);
    }

    // 左塔尖顶
    g.fillStyle(0xcc2222, 1);
    g.fillTriangle(
      leftTowerX - 5, baseY - CASTLE_TOWER_H - 25,
      leftTowerX + CASTLE_TOWER_W + 5, baseY - CASTLE_TOWER_H - 25,
      leftTowerX + CASTLE_TOWER_W / 2, baseY - CASTLE_TOWER_H - 70
    );

    // =====================
    // 右侧塔楼
    // =====================
    const rightTowerX = baseX + CASTLE_MAIN_W - 10;
    g.fillStyle(0x888888, 1);
    g.fillRect(rightTowerX, baseY - CASTLE_TOWER_H, CASTLE_TOWER_W, CASTLE_TOWER_H);

    // 右塔城垛（3个）
    for (let i = 0; i < 3; i++) {
      g.fillRect(rightTowerX + i * 18, baseY - CASTLE_TOWER_H - 25, 12, 25);
    }

    // 右塔尖顶
    g.fillStyle(0xcc2222, 1);
    g.fillTriangle(
      rightTowerX - 5, baseY - CASTLE_TOWER_H - 25,
      rightTowerX + CASTLE_TOWER_W + 5, baseY - CASTLE_TOWER_H - 25,
      rightTowerX + CASTLE_TOWER_W / 2, baseY - CASTLE_TOWER_H - 70
    );

    // =====================
    // 中央高塔
    // =====================
    const centerTowerX = x - CASTLE_CENTER_TOWER_W / 2;
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(centerTowerX, baseY - CASTLE_CENTER_TOWER_H, CASTLE_CENTER_TOWER_W, CASTLE_CENTER_TOWER_H);

    // 中央塔城垛（4个）
    for (let i = 0; i < 4; i++) {
      g.fillRect(centerTowerX + i * 16, baseY - CASTLE_CENTER_TOWER_H - 30, 10, 30);
    }

    // 中央塔尖顶
    g.fillStyle(0xcc2222, 1);
    g.fillTriangle(
      centerTowerX - 5, baseY - CASTLE_CENTER_TOWER_H - 30,
      centerTowerX + CASTLE_CENTER_TOWER_W + 5, baseY - CASTLE_CENTER_TOWER_H - 30,
      x, baseY - CASTLE_CENTER_TOWER_H - 90
    );

    // =====================
    // 旗帜（中央塔顶）
    // =====================
    g.fillStyle(0xffff00, 1);
    g.fillRect(x - 2, baseY - CASTLE_CENTER_TOWER_H - 90, 3, 50);  // 旗杆
    g.fillStyle(0xff0000, 1);
    g.fillTriangle(
      x + 1, baseY - CASTLE_CENTER_TOWER_H - 90,
      x + 1, baseY - CASTLE_CENTER_TOWER_H - 65,
      x + 25, baseY - CASTLE_CENTER_TOWER_H - 78
    );

    // =====================
    // 窗户
    // =====================
    g.fillStyle(0x334455, 1);
    g.fillRect(baseX + 25, baseY - CASTLE_MAIN_H + 40, 25, 35);                    // 主楼左窗
    g.fillRect(baseX + CASTLE_MAIN_W - 50, baseY - CASTLE_MAIN_H + 40, 25, 35);   // 主楼右窗
    g.fillRect(x - 12, baseY - CASTLE_CENTER_TOWER_H + 40, 24, 30);               // 中央塔下窗
    g.fillRect(x - 12, baseY - CASTLE_CENTER_TOWER_H + 100, 24, 30);              // 中央塔上窗

    // =====================
    // 拱门入口
    // =====================
    const doorX = x - CASTLE_DOOR_W / 2;
    const doorY = baseY - CASTLE_DOOR_H;
    g.fillStyle(0x222222, 1);
    g.fillRect(doorX, doorY, CASTLE_DOOR_W, CASTLE_DOOR_H);   // 门身
    g.fillCircle(x, doorY, CASTLE_DOOR_W / 2);                 // 拱形圆顶
    g.lineStyle(3, 0x555555, 1);
    g.strokeRect(doorX - 3, doorY - 3, CASTLE_DOOR_W + 6, CASTLE_DOOR_H + 3); // 门框

    // =====================
    // 碰撞触发区域（拱门内）
    // 玩家进入此区域触发关卡完成
    // =====================
    this.zone = scene.add.zone(x, baseY - CASTLE_DOOR_H / 2, CASTLE_DOOR_W, CASTLE_DOOR_H);
    scene.physics.add.existing(this.zone, true);
  }
}