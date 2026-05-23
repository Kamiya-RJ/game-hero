# 冒险小勇士 Changelog — 多关卡系统

---

## 新增文件

### `src/config/levels.js`
4关完整关卡配置，数据驱动核心。

**数据结构：**
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 关卡编号 |
| `theme` | string | 主题名（grassland / cave / snow / lava） |
| `worldWidthMultiplier` | number | 世界宽度倍数（均为8，原来的2倍） |
| `platforms` | array | 静态平台列表，坐标用 xW/yH 比例表示 |
| `movingPlatforms` | array | 移动平台，含 type / range / speed |
| `pits` | array | 沟的位置，startW/endW 比例 |
| `bricks` | array | 砖块，含 hasCoin 标记 |
| `chests` | array | 宝箱，含 reward（coin/heal） |
| `enemies.slimes` | array | 史莱姆，platformIndex 指向平台 |
| `enemies.hedgehogs` | array | 刺猬，xW 比例指定地面位置 |
| `endX` | number | 终点城堡 X 比例 |
| `hasBoss` | boolean | 第4关专用，标记有 Boss |

**4关主题：**
| 关卡 | 主题 | 难度 | 特点 |
|------|------|------|------|
| 第1关 | 白天草地 | 入门 | 沟较窄，敌人少，移动平台简单 |
| 第2关 | 夜晚洞穴 | 中等 | 沟更宽，敌人更多，平台更快 |
| 第3关 | 雪地 | 较难 | 多段移动平台组合，沟最宽 |
| 第4关 | 熔岩最终关 | 最难 | 预留 Boss 接入点，大城堡结局 |

---

### `src/scenes/LevelClearScene.js`
关卡结算场景，通关后进入（第4关除外，第4关进入 WinScene）。

**接收数据（data）：**
| 字段 | 说明 |
|------|------|
| `levelId` | 当前关卡编号 |
| `score` | 本关得分 |
| `totalScore` | 累计总得分 |
| `lives` | 剩余血量（传入下一关） |
| `collectedCoins` | 本关收集金币数 |
| `totalCoins` | 本关金币总数 |

**UI 特性：**
- 结算项目逐行延迟淡入（每项间隔 200ms）
- 显示：本关得分 / 金币收集（X/总数）/ 剩余血量 / 累计总得分
- 最后一关显示「返回菜单」，其余显示「下一关 ▶」
- 空格 / 回车快捷键继续

---

### `src/objects/MovingPlatform.js`
移动平台类，继承自 `Phaser.Physics.Arcade.Image`。

- 支持 `horizontal`（左右）和 `vertical`（上下）两种模式
- 以初始位置为中心，移动 ±range px
- 用 Phaser Tween 驱动，`onUpdate` 同步静态物理体位置（`body.reset`）
- 顶部高光 + 底部暗边纹理，按主题色生成
- 玩家站上后自动随平台移动（Arcade Physics 自动处理）

---

### `src/objects/Brick.js`
可击碎砖块，继承自 `Phaser.Physics.Arcade.Image`。

**触发条件：** 玩家从下方跳起，`body.velocity.y < 0 && body.blocked.up`

| 状态 | 行为 |
|------|------|
| `hasCoin = true` | 弹出金币动画（黄圆向上飞），砖块变灰（已用完），加分 +10 |
| `hasCoin = false` | 4块碎片飞散动画后销毁，加分 +5 |

- 撞击时有弹动效果（向上 8px 再回弹）
- 防重复触发（`used` 标记）

---

### `src/objects/Chest.js`
宝箱，继承自 `Phaser.Physics.Arcade.Image`。

**触发条件：** 同砖块，从下方撞击

| reward | 行为 |
|--------|------|
| `coin` | 弹出 3 枚金币（散开飞出），每枚 +10 分 |
| `heal` | 弹出爱心，玩家加 1 血（不超过初始上限） |

- 关闭/打开两种纹理状态（盖子翻开效果）
- 撞击弹动动画
- 加 +20 基础分

---

## 修改文件

### `src/scenes/GameScene.js`（完全重构）

#### 核心变化：数据驱动
`create(data)` 接收跨关数据：
```js
{
  levelId:    1,   // 关卡编号
  totalScore: 0,   // 累计总得分
  lives:      3,   // 跨关保留血量
}
```

#### 新增方法

| 方法 | 说明 |
|------|------|
| `createBackground()` | 根据主题生成背景（渐变天空 + 视差滚动） |
| `_createClouds()` | 草地/雪地主题云朵 |
| `_createTorches()` | 洞穴主题火把光晕（脉冲 Tween） |
| `_createSnow()` | 雪地主题飘雪粒子 |
| `_createLavaGlow()` | 熔岩主题地面光带 |
| `createMovingPlatforms()` | 从 levelCfg 生成移动平台 |
| `createBricks()` | 从 levelCfg 生成砖块 |
| `createChests()` | 从 levelCfg 生成宝箱 |
| `_registerSlimeAnims()` | 史莱姆动画注册（抽取为独立方法） |
| `_registerHedgehogAnims()` | 刺猬动画注册（抽取为独立方法） |
| `_updateScore()` | 同时更新本关得分和累计总分显示 |
| `_levelComplete()` | 防重复触发，传递完整结算数据到 LevelClearScene |

#### HUD 变化
- 新增关卡标识（屏幕顶部中央）
- 新增累计总分显示（`Total: xxx`，本关得分下方）
- BGM 按钮下移至 y=70 避免遮挡

#### 碰撞新增
- 玩家 vs 移动平台（collider）
- 敌人 vs 移动平台（collider）
- 玩家头部 vs 砖块（overlap，检测 `velocity.y < 0 && blocked.up`）
- 玩家头部 vs 宝箱（同上）

#### 跨关数据流
```
GameScene → LevelClearScene → GameScene（下一关）
              传递：levelId+1, totalScore, lives
```
GameOver 时传入累计总分（`totalScore + score`）。

---

### `src/constants.js`

新增常量分组：

**移动平台（3个）**
| 常量 | 值 |
|------|----|
| `MOVING_PLATFORM_WIDTH` | 120 |
| `MOVING_PLATFORM_HEIGHT` | 16 |
| `MOVING_PLATFORM_SPEED` | 80 |

**砖块（3个）**
| 常量 | 值 |
|------|----|
| `BRICK_SIZE` | 32 |
| `BRICK_SCORE_VALUE` | 5 |
| `BRICK_COIN_VALUE` | 10 |

**宝箱（4个）**
| 常量 | 值 |
|------|----|
| `CHEST_SIZE` | 32 |
| `CHEST_SCORE_VALUE` | 20 |
| `CHEST_COIN_COUNT` | 3 |
| `CHEST_HEAL_VALUE` | 1 |

**主题配色（THEMES 对象）**
4个主题（grassland / cave / snow / lava），每个含：
`skyTop` / `skyBottom` / `groundColor` / `groundEdge` / `platformColor` / `bgClouds` / `bgTorches` / `bgSnow` / `bgLava`

**关卡结算（3个）**
| 常量 | 值 |
|------|----|
| `LEVEL_CLEAR_FONT_LARGE` | 42px |
| `LEVEL_CLEAR_FONT_MEDIUM` | 26px |
| `LEVEL_CLEAR_FONT_SMALL` | 20px |
| `LEVEL_CLEAR_DELAY` | 500ms |
| `LEVEL_CLEAR_LINE_GAP` | 44px |

---

## 接入步骤

### 1. 文件放置
```
src/
├── config/
│   └── levels.js
├── scenes/
│   └── LevelClearScene.js
├── objects/
│   ├── MovingPlatform.js
│   ├── Brick.js
│   └── Chest.js
```

### 2. main.js 注册场景
```js
import LevelClearScene from './scenes/LevelClearScene.js';

const config = {
  scene: [MenuScene, GameScene, LevelClearScene, WinScene, GameOverScene],
};
```

### 3. 待接入（第4关 Boss）
第4关配置中已预留 `hasBoss: true` 和 `bossX` 字段，Boss 战逻辑在获取素材后单独接入 `BossScene.js`。
