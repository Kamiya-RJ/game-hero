/**
 * 关卡配置文件
 *
 * 所有坐标使用比例值（相对屏幕宽度 W 和高度 H），
 * 在 GameScene 里乘以实际尺寸使用，适配不同分辨率。
 *
 * 世界宽度 = W * worldWidthMultiplier
 *
 * ─────────────────────────────────────────────────────────
 * 数据结构说明：
 *
 * platforms: [{ xW, yH }]
 *   静态浮空平台，xW/yH 为相对比例
 *
 * movingPlatforms: [{ xW, yH, type, range, speed }]
 *   type: 'horizontal' | 'vertical'
 *   range: 移动范围（px）
 *   speed: 移动速度（px/s），不填用默认值
 *
 * pits: [{ startW, endW }]
 *   地面空缺（沟），startW/endW 为相对 W 的比例
 *
 * bricks: [{ xW, yH, hasCoin }]
 *   可击碎砖块，hasCoin=true 则击中弹出金币
 *
 * chests: [{ xW, yH, reward }]
 *   reward: 'coin' | 'heal'
 *
 * enemies:
 *   slimes: [{ xW, platformIndex }]  platformIndex 指向 platforms 数组索引
 *   hedgehogs: [{ xW, onGround: true }]  地面刺猬，yH 自动设为地面
 *
 * coins: [{ xW, yH }]  额外金币（平台金币在 GameScene 自动生成）
 *
 * endX: W 比例，终点城堡/Boss 的 X 位置
 * ─────────────────────────────────────────────────────────
 */

export const LEVELS = [

  // ══════════════════════════════════════════════════════════
  // 第1关：白天草地
  // 难度：入门，沟较窄，敌人少，移动平台简单
  // ══════════════════════════════════════════════════════════
  {
    id: 1,
    theme: 'grassland',
    worldWidthMultiplier: 8,

    platforms: [
      { xW: 0.50, yH: 0.72 },
      { xW: 0.90, yH: 0.62 },
      { xW: 1.20, yH: 0.75 },
      { xW: 1.55, yH: 0.60 },
      { xW: 1.90, yH: 0.75 },
      { xW: 2.20, yH: 0.65 },
      { xW: 2.55, yH: 0.78 },
      { xW: 2.90, yH: 0.60 },
      { xW: 3.30, yH: 0.72 },
      { xW: 3.70, yH: 0.65 },
      { xW: 4.10, yH: 0.75 },
      { xW: 4.50, yH: 0.60 },
      { xW: 4.90, yH: 0.70 },
      { xW: 5.30, yH: 0.62 },
      { xW: 5.70, yH: 0.75 },
      { xW: 6.10, yH: 0.65 },
      { xW: 6.50, yH: 0.60 },
      { xW: 6.90, yH: 0.72 },
    ],

    movingPlatforms: [
      { xW: 1.10, yH: 0.50, type: 'horizontal', range: 120, speed: 70 },
      { xW: 2.80, yH: 0.48, type: 'vertical',   range: 80,  speed: 60 },
      { xW: 4.30, yH: 0.52, type: 'horizontal', range: 100, speed: 80 },
      { xW: 5.90, yH: 0.45, type: 'vertical',   range: 90,  speed: 65 },
    ],

    pits: [
      { startW: 1.35, endW: 1.50 },
      { startW: 2.40, endW: 2.58 },
      { startW: 3.50, endW: 3.65 },
      { startW: 4.70, endW: 4.88 },
      { startW: 5.80, endW: 5.95 },
      { startW: 6.70, endW: 6.82 },
    ],

    bricks: [
      { xW: 0.60, yH: 0.55, hasCoin: true  },
      { xW: 0.63, yH: 0.55, hasCoin: false },
      { xW: 0.66, yH: 0.55, hasCoin: false },
      { xW: 1.80, yH: 0.52, hasCoin: true  },
      { xW: 1.83, yH: 0.52, hasCoin: false },
      { xW: 3.10, yH: 0.55, hasCoin: true  },
      { xW: 3.13, yH: 0.55, hasCoin: false },
      { xW: 4.60, yH: 0.50, hasCoin: true  },
      { xW: 5.50, yH: 0.53, hasCoin: false },
      { xW: 5.53, yH: 0.53, hasCoin: true  },
      { xW: 6.30, yH: 0.52, hasCoin: false },
    ],

    chests: [
      { xW: 1.00, yH: 0.52, reward: 'coin' },
      { xW: 2.60, yH: 0.50, reward: 'heal' },
      { xW: 4.80, yH: 0.48, reward: 'coin' },
      { xW: 6.60, yH: 0.52, reward: 'heal' },
    ],

    enemies: {
      slimes:    [
        { platformIndex: 1  },
        { platformIndex: 3  },
        { platformIndex: 5  },
        { platformIndex: 8  },
        { platformIndex: 11 },
        { platformIndex: 14 },
        { platformIndex: 16 },
      ],
      hedgehogs: [
        { xW: 0.25  },
        { xW: 0.80  },
        { xW: 1.70  },
        { xW: 2.20  },
        { xW: 3.20  },
        { xW: 4.00  },
        { xW: 5.10  },
        { xW: 6.00  },
        { xW: 7.00  },
      ],
    },

    endX: 7.70,  // 小城堡 X（相对 W）
  },

  // ══════════════════════════════════════════════════════════
  // 第2关：夜晚洞穴
  // 难度：中等，沟更宽，敌人更多，移动平台更快
  // ══════════════════════════════════════════════════════════
  {
    id: 2,
    theme: 'cave',
    worldWidthMultiplier: 8,

    platforms: [
      { xW: 0.45, yH: 0.70 },
      { xW: 0.85, yH: 0.58 },
      { xW: 1.15, yH: 0.73 },
      { xW: 1.50, yH: 0.58 },
      { xW: 1.85, yH: 0.70 },
      { xW: 2.20, yH: 0.60 },
      { xW: 2.60, yH: 0.75 },
      { xW: 3.00, yH: 0.58 },
      { xW: 3.40, yH: 0.70 },
      { xW: 3.80, yH: 0.62 },
      { xW: 4.20, yH: 0.73 },
      { xW: 4.60, yH: 0.58 },
      { xW: 5.00, yH: 0.68 },
      { xW: 5.40, yH: 0.60 },
      { xW: 5.80, yH: 0.73 },
      { xW: 6.20, yH: 0.62 },
      { xW: 6.60, yH: 0.58 },
      { xW: 7.00, yH: 0.70 },
    ],

    movingPlatforms: [
      { xW: 0.70, yH: 0.47, type: 'horizontal', range: 130, speed: 90  },
      { xW: 1.70, yH: 0.45, type: 'vertical',   range: 100, speed: 80  },
      { xW: 2.90, yH: 0.48, type: 'horizontal', range: 150, speed: 100 },
      { xW: 4.00, yH: 0.43, type: 'vertical',   range: 110, speed: 85  },
      { xW: 5.20, yH: 0.47, type: 'horizontal', range: 120, speed: 95  },
      { xW: 6.40, yH: 0.44, type: 'vertical',   range: 100, speed: 90  },
    ],

    pits: [
      { startW: 1.28, endW: 1.48 },
      { startW: 2.35, endW: 2.58 },
      { startW: 3.30, endW: 3.52 },
      { startW: 4.45, endW: 4.68 },
      { startW: 5.55, endW: 5.78 },
      { startW: 6.65, endW: 6.85 },
    ],

    bricks: [
      { xW: 0.55, yH: 0.53, hasCoin: true  },
      { xW: 0.58, yH: 0.53, hasCoin: false },
      { xW: 0.61, yH: 0.53, hasCoin: true  },
      { xW: 1.70, yH: 0.50, hasCoin: false },
      { xW: 1.73, yH: 0.50, hasCoin: true  },
      { xW: 2.80, yH: 0.53, hasCoin: true  },
      { xW: 2.83, yH: 0.53, hasCoin: false },
      { xW: 4.00, yH: 0.48, hasCoin: true  },
      { xW: 5.30, yH: 0.51, hasCoin: false },
      { xW: 5.33, yH: 0.51, hasCoin: true  },
      { xW: 6.50, yH: 0.50, hasCoin: true  },
      { xW: 6.53, yH: 0.50, hasCoin: false },
    ],

    chests: [
      { xW: 0.90, yH: 0.50, reward: 'coin' },
      { xW: 2.50, yH: 0.48, reward: 'heal' },
      { xW: 4.50, yH: 0.46, reward: 'coin' },
      { xW: 6.70, yH: 0.50, reward: 'heal' },
    ],

    enemies: {
      slimes: [
        { platformIndex: 1  },
        { platformIndex: 3  },
        { platformIndex: 5  },
        { platformIndex: 7  },
        { platformIndex: 9  },
        { platformIndex: 12 },
        { platformIndex: 14 },
        { platformIndex: 16 },
      ],
      hedgehogs: [
        { xW: 0.22  },
        { xW: 0.72  },
        { xW: 1.65  },
        { xW: 2.10  },
        { xW: 2.85  },
        { xW: 3.60  },
        { xW: 4.30  },
        { xW: 5.05  },
        { xW: 5.85  },
        { xW: 6.55  },
        { xW: 7.20  },
      ],
    },

    endX: 7.65,
  },

  // ══════════════════════════════════════════════════════════
  // 第3关：雪地
  // 难度：较难，多段移动平台组合，沟更宽，敌人密度更高
  // ══════════════════════════════════════════════════════════
  {
    id: 3,
    theme: 'snow',
    worldWidthMultiplier: 8,

    platforms: [
      { xW: 0.40, yH: 0.68 },
      { xW: 0.80, yH: 0.56 },
      { xW: 1.10, yH: 0.72 },
      { xW: 1.45, yH: 0.57 },
      { xW: 1.80, yH: 0.68 },
      { xW: 2.15, yH: 0.58 },
      { xW: 2.55, yH: 0.73 },
      { xW: 2.95, yH: 0.56 },
      { xW: 3.35, yH: 0.68 },
      { xW: 3.75, yH: 0.60 },
      { xW: 4.15, yH: 0.72 },
      { xW: 4.55, yH: 0.56 },
      { xW: 4.95, yH: 0.66 },
      { xW: 5.35, yH: 0.58 },
      { xW: 5.75, yH: 0.72 },
      { xW: 6.15, yH: 0.60 },
      { xW: 6.55, yH: 0.56 },
      { xW: 6.95, yH: 0.68 },
    ],

    movingPlatforms: [
      { xW: 0.65, yH: 0.45, type: 'horizontal', range: 140, speed: 100 },
      { xW: 1.30, yH: 0.43, type: 'vertical',   range: 110, speed: 90  },
      { xW: 2.35, yH: 0.46, type: 'horizontal', range: 160, speed: 110 },
      { xW: 3.15, yH: 0.42, type: 'vertical',   range: 120, speed: 95  },
      { xW: 4.35, yH: 0.45, type: 'horizontal', range: 150, speed: 105 },
      { xW: 5.15, yH: 0.43, type: 'vertical',   range: 130, speed: 100 },
      { xW: 6.35, yH: 0.44, type: 'horizontal', range: 140, speed: 110 },
    ],

    pits: [
      { startW: 1.22, endW: 1.44 },
      { startW: 2.28, endW: 2.53 },
      { startW: 3.22, endW: 3.48 },
      { startW: 4.38, endW: 4.65 },
      { startW: 5.48, endW: 5.75 },
      { startW: 6.45, endW: 6.68 },
      { startW: 7.10, endW: 7.28 },
    ],

    bricks: [
      { xW: 0.50, yH: 0.52, hasCoin: true  },
      { xW: 0.53, yH: 0.52, hasCoin: true  },
      { xW: 0.56, yH: 0.52, hasCoin: false },
      { xW: 1.65, yH: 0.49, hasCoin: true  },
      { xW: 1.68, yH: 0.49, hasCoin: false },
      { xW: 2.75, yH: 0.52, hasCoin: true  },
      { xW: 2.78, yH: 0.52, hasCoin: false },
      { xW: 2.81, yH: 0.52, hasCoin: true  },
      { xW: 3.90, yH: 0.47, hasCoin: false },
      { xW: 3.93, yH: 0.47, hasCoin: true  },
      { xW: 5.20, yH: 0.50, hasCoin: true  },
      { xW: 5.23, yH: 0.50, hasCoin: false },
      { xW: 6.40, yH: 0.49, hasCoin: true  },
      { xW: 6.43, yH: 0.49, hasCoin: true  },
    ],

    chests: [
      { xW: 0.85, yH: 0.48, reward: 'coin' },
      { xW: 2.20, yH: 0.46, reward: 'heal' },
      { xW: 4.20, yH: 0.44, reward: 'coin' },
      { xW: 5.80, yH: 0.46, reward: 'heal' },
      { xW: 7.00, yH: 0.48, reward: 'coin' },
    ],

    enemies: {
      slimes: [
        { platformIndex: 1  },
        { platformIndex: 3  },
        { platformIndex: 5  },
        { platformIndex: 7  },
        { platformIndex: 9  },
        { platformIndex: 11 },
        { platformIndex: 13 },
        { platformIndex: 15 },
        { platformIndex: 17 },
      ],
      hedgehogs: [
        { xW: 0.30  },
        { xW: 0.65  },
        { xW: 1.60  },
        { xW: 2.05  },
        { xW: 2.80  },
        { xW: 3.55  },
        { xW: 4.25  },
        { xW: 5.00  },
        { xW: 5.80  },
        { xW: 6.50  },
        { xW: 7.15  },
        { xW: 7.55  },
      ],
    },

    endX: 7.60,
  },

  // ══════════════════════════════════════════════════════════
  // 第4关：熔岩最终关
  // 难度：最难，Boss战在终点前，大城堡结局
  // 注意：Boss 数据单独在 BossScene 处理，这里只配置关卡地形和通往 Boss 的路
  // ══════════════════════════════════════════════════════════
  {
    id: 4,
    theme: 'lava',
    worldWidthMultiplier: 8,
    hasBoss: true,

    platforms: [
      { xW: 0.38, yH: 0.67 },
      { xW: 0.78, yH: 0.55 },
      { xW: 1.08, yH: 0.70 },
      { xW: 1.42, yH: 0.55 },
      { xW: 1.78, yH: 0.67 },
      { xW: 2.12, yH: 0.57 },
      { xW: 2.52, yH: 0.72 },
      { xW: 2.92, yH: 0.55 },
      { xW: 3.32, yH: 0.67 },
      { xW: 3.72, yH: 0.58 },
      { xW: 4.12, yH: 0.70 },
      { xW: 4.52, yH: 0.55 },
      { xW: 4.92, yH: 0.65 },
      { xW: 5.32, yH: 0.57 },
      { xW: 5.72, yH: 0.70 },
      { xW: 6.12, yH: 0.58 },
      { xW: 6.52, yH: 0.55 },
    ],

    movingPlatforms: [
      { xW: 0.62, yH: 0.43, type: 'horizontal', range: 150, speed: 110 },
      { xW: 1.25, yH: 0.41, type: 'vertical',   range: 120, speed: 100 },
      { xW: 2.30, yH: 0.44, type: 'horizontal', range: 170, speed: 120 },
      { xW: 3.12, yH: 0.40, type: 'vertical',   range: 130, speed: 110 },
      { xW: 4.32, yH: 0.43, type: 'horizontal', range: 160, speed: 115 },
      { xW: 5.12, yH: 0.41, type: 'vertical',   range: 140, speed: 105 },
      { xW: 6.00, yH: 0.38, type: 'horizontal', range: 150, speed: 120 },
      { xW: 6.80, yH: 0.42, type: 'vertical',   range: 120, speed: 115 },
    ],

    pits: [
      { startW: 1.18, endW: 1.40 },
      { startW: 2.22, endW: 2.50 },
      { startW: 3.18, endW: 3.45 },
      { startW: 4.32, endW: 4.60 },
      { startW: 5.42, endW: 5.70 },
      { startW: 6.38, endW: 6.62 },
      { startW: 6.95, endW: 7.10 },
    ],

    bricks: [
      { xW: 0.48, yH: 0.50, hasCoin: true  },
      { xW: 0.51, yH: 0.50, hasCoin: true  },
      { xW: 0.54, yH: 0.50, hasCoin: true  },
      { xW: 1.62, yH: 0.48, hasCoin: false },
      { xW: 1.65, yH: 0.48, hasCoin: true  },
      { xW: 2.70, yH: 0.50, hasCoin: true  },
      { xW: 2.73, yH: 0.50, hasCoin: false },
      { xW: 2.76, yH: 0.50, hasCoin: true  },
      { xW: 3.85, yH: 0.46, hasCoin: true  },
      { xW: 3.88, yH: 0.46, hasCoin: false },
      { xW: 5.15, yH: 0.48, hasCoin: true  },
      { xW: 5.18, yH: 0.48, hasCoin: true  },
      { xW: 6.30, yH: 0.47, hasCoin: false },
      { xW: 6.33, yH: 0.47, hasCoin: true  },
      { xW: 6.36, yH: 0.47, hasCoin: false },
    ],

    chests: [
      { xW: 0.82, yH: 0.47, reward: 'coin' },
      { xW: 2.18, yH: 0.45, reward: 'heal' },
      { xW: 4.18, yH: 0.43, reward: 'heal' },  // 通往Boss前给加血
      { xW: 5.78, yH: 0.45, reward: 'coin' },
      { xW: 6.85, yH: 0.46, reward: 'heal' },  // Boss前最后一个加血
    ],

    enemies: {
      slimes: [
        { platformIndex: 1  },
        { platformIndex: 3  },
        { platformIndex: 5  },
        { platformIndex: 7  },
        { platformIndex: 9  },
        { platformIndex: 11 },
        { platformIndex: 13 },
        { platformIndex: 15 },
      ],
      hedgehogs: [
        { xW: 0.25  },
        { xW: 0.62  },
        { xW: 1.55  },
        { xW: 2.00  },
        { xW: 2.75  },
        { xW: 3.50  },
        { xW: 4.20  },
        { xW: 4.95  },
        { xW: 5.75  },
        { xW: 6.45  },
        { xW: 7.00  },
        { xW: 7.40  },
      ],
    },

    bossX: 7.20,    // Boss 出现位置（相对 W）
    endX:  7.75,    // 大城堡位置（Boss 死后才能进入）
  },
];
