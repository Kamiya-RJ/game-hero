import Phaser from 'phaser';
import { GROUND_HEIGHT } from '../constants.js';

export default class Castle {
  constructor(scene, x, y) {
    const g = scene.add.graphics();
    g.setDepth(-1);

    const baseX = x - 80;  // 城堡总宽160
    const baseY = y;        // 地面位置

    // =====================
    // 主楼
    // =====================
    const mainW = 160;
    const mainH = 200;
    g.fillStyle(0x999999, 1);
    g.fillRect(baseX, baseY - mainH, mainW, mainH);

    // 主楼城垛 (6个)
    g.fillStyle(0x999999, 1);
    for (let i = 0; i < 6; i++) {
      g.fillRect(baseX + i * 28, baseY - mainH - 30, 18, 30);
    }

    // =====================
    // 左侧塔楼
    // =====================
    const towerW = 50;
    const towerH = 260;
    const leftTowerX = baseX - towerW + 10;
    g.fillStyle(0x888888, 1);
    g.fillRect(leftTowerX, baseY - towerH, towerW, towerH);

    // 左塔城垛 (3个)
    for (let i = 0; i < 3; i++) {
      g.fillRect(leftTowerX + i * 18, baseY - towerH - 25, 12, 25);
    }

    // 左塔尖顶（三角形）
    g.fillStyle(0xcc2222, 1);
    g.fillTriangle(
      leftTowerX - 5, baseY - towerH - 25,
      leftTowerX + towerW + 5, baseY - towerH - 25,
      leftTowerX + towerW / 2, baseY - towerH - 70
    );

    // =====================
    // 右侧塔楼
    // =====================
    const rightTowerX = baseX + mainW - 10;
    g.fillStyle(0x888888, 1);
    g.fillRect(rightTowerX, baseY - towerH, towerW, towerH);

    // 右塔城垛 (3个)
    for (let i = 0; i < 3; i++) {
      g.fillRect(rightTowerX + i * 18, baseY - towerH - 25, 12, 25);
    }

    // 右塔尖顶（三角形）
    g.fillStyle(0xcc2222, 1);
    g.fillTriangle(
      rightTowerX - 5, baseY - towerH - 25,
      rightTowerX + towerW + 5, baseY - towerH - 25,
      rightTowerX + towerW / 2, baseY - towerH - 70
    );

    // =====================
    // 主楼中央塔
    // =====================
    const centerTowerW = 60;
    const centerTowerH = 300;
    const centerTowerX = x - centerTowerW / 2;
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(centerTowerX, baseY - centerTowerH, centerTowerW, centerTowerH);

    // 中央塔城垛 (4个)
    g.fillStyle(0xaaaaaa, 1);
    for (let i = 0; i < 4; i++) {
      g.fillRect(centerTowerX + i * 16, baseY - centerTowerH - 30, 10, 30);
    }

    // 中央塔尖顶
    g.fillStyle(0xcc2222, 1);
    g.fillTriangle(
      centerTowerX - 5, baseY - centerTowerH - 30,
      centerTowerX + centerTowerW + 5, baseY - centerTowerH - 30,
      x, baseY - centerTowerH - 90
    );

    // =====================
    // 旗帜（中央塔顶）
    // =====================
    g.fillStyle(0xffff00, 1);
    g.fillRect(x - 2, baseY - centerTowerH - 90, 3, 50);
    g.fillStyle(0xff0000, 1);
    g.fillTriangle(
      x + 1, baseY - centerTowerH - 90,
      x + 1, baseY - centerTowerH - 65,
      x + 25, baseY - centerTowerH - 78
    );

    // =====================
    // 窗户
    // =====================
    g.fillStyle(0x334455, 1);
    // 主楼窗户
    g.fillRect(baseX + 25, baseY - mainH + 40, 25, 35);
    g.fillRect(baseX + mainW - 50, baseY - mainH + 40, 25, 35);
    // 中央塔窗户
    g.fillRect(x - 12, baseY - centerTowerH + 40, 24, 30);
    g.fillRect(x - 12, baseY - centerTowerH + 100, 24, 30);

    // =====================
    // 拱门入口
    // =====================
    const doorW = 40;
    const doorH = 60;
    const doorX = x - doorW / 2;
    const doorY = baseY - doorH;

    g.fillStyle(0x222222, 1);
    g.fillRect(doorX, doorY, doorW, doorH);
    g.fillCircle(x, doorY, doorW / 2);

    // 门框装饰
    g.lineStyle(3, 0x555555, 1);
    g.strokeRect(doorX - 3, doorY - 3, doorW + 6, doorH + 3);

    // =====================
    // 城堡物理碰撞区域（门口）
    // =====================
    this.zone = scene.add.zone(x, baseY - doorH / 2, doorW, doorH);
    scene.physics.add.existing(this.zone, true);
  }
}