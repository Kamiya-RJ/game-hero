# 冒险小勇士 Changelog — 完整提交记录

---

## 新增文件

### `src/entities/Hedgehog.js`
地面刺猬敌人，继承自 `Phaser.Physics.Arcade.Sprite`。

**行为（方案C：巡逻 + 定时伸缩刺）**

| 状态 | 动画 | 可踩死 | 碰到玩家 |
|------|------|--------|---------|
| 收刺待机 | `hedgehog_idle1` | ✅ | 侧面受伤 |
| 出刺过渡 | `hedgehog_spikes_out` | ❌ | 受伤 |
| 出刺待机 | `hedgehog_idle2` | ❌ | 受伤 |
| 收刺过渡 | `hedgehog_spikes_in` | ❌ | 受伤 |
| 受击死亡 | `hedgehog_hit` | — | — |

**时序：** 每 3 秒出刺，持续 2 秒后收刺，过渡动画完整播放后切换状态。
**巡逻：** 出生点左右各 120px，碰墙或超范围自动反向，速度 60px/s。

---

### `src/scenes/MenuScene.js`
游戏主菜单场景，游戏启动和通关/失败后返回时显示。

- 渐变夜空背景 + 60 颗随机闪烁星星
- 游戏标题「冒险小勇士」+ 英文副标题
- 操作说明文字
- 上下浮动的「▶ 开始游戏」按钮
- 按任意键也可直接开始

---

## 修改文件

### `src/constants.js`
新增常量：

**刺猬（18个）**

| 常量 | 值 | 说明 |
|------|----|------|
| `HEDGEHOG_SPEED` | 60 | 巡逻速度 |
| `HEDGEHOG_SCALE` | 1.5 | 缩放比例 |
| `HEDGEHOG_FRAME_WIDTH` | 44 | 精灵帧宽度 |
| `HEDGEHOG_FRAME_HEIGHT` | 26 | 精灵帧高度 |
| `HEDGEHOG_BODY_WIDTH` | 34 | 物理体宽度 |
| `HEDGEHOG_BODY_HEIGHT` | 20 | 物理体高度 |
| `HEDGEHOG_BODY_OFFSET_X` | 5 | 物理体水平偏移 |
| `HEDGEHOG_BODY_OFFSET_Y` | 6 | 物理体垂直偏移 |
| `HEDGEHOG_PATROL_HALF` | 120 | 巡逻半径（px） |
| `HEDGEHOG_SPIKE_INTERVAL` | 3000 | 出刺间隔（ms） |
| `HEDGEHOG_SPIKE_DURATION` | 2000 | 出刺持续时间（ms） |
| `HEDGEHOG_SCORE_VALUE` | 80 | 踩死得分 |
| `HEDGEHOG_FRAMERATE` | 10 | 动画帧率 |
| `HEDGEHOG_IDLE1_FRAMES` | 13 | idle1 末帧索引 |
| `HEDGEHOG_IDLE2_FRAMES` | 13 | idle2 末帧索引 |
| `HEDGEHOG_SPIKES_OUT_FRAMES` | 7 | spikes_out 末帧索引 |
| `HEDGEHOG_SPIKES_IN_FRAMES` | 7 | spikes_in 末帧索引 |
| `HEDGEHOG_HIT_FRAMES` | 4 | hit 末帧索引 |

**沟（1个）**

| 常量 | 值 | 说明 |
|------|----|------|
| `PIT_DEATH_Y_OFFSET` | 50 | 玩家 Y 超过地面底部多少像素判定掉坑 |

---

### `src/scenes/GameScene.js`

#### `preload()`
新增加载 5 张刺猬精灵表（路径：`assets/Enemies/Hedgehog/`）。

#### `createTextures()`
移除整体地面纹理，改由 `createGround()` 按段动态生成。

#### `createGround()`（重写）
地面从一整块改为多段拼接，定义 3 个沟：

| 沟 | 起始 X | 结束 X | 特点 |
|----|--------|--------|------|
| 沟1 | W×1.35 | W×1.55 | 需跳跃越过 |
| 沟2 | W×2.15 | W×2.45 | 较宽，需借助平台 |
| 沟3 | W×3.10 | W×3.25 | 靠近终点小沟 |

#### `physics.world.setBounds()`
第8参数改为 `false`，关闭底部物理边界，玩家可真正掉进沟里。

#### `createEnemies()`
- 注册刺猬 5 组动画
- 在 6 个地面安全位置生成刺猬（W×0.20 / 0.75 / 1.70 / 1.95 / 2.70 / 3.50）

#### `createColliders()`
刺猬踩踏逻辑：收刺可踩死（80分），出刺踩到受伤。

#### `hitByEnemy()`
修复生命归零后未 `return` 的 bug，提取无敌逻辑为 `_startInvincible()`。

#### 新增方法

| 方法 | 说明 |
|------|------|
| `_startInvincible()` | 开启无敌状态 + 闪烁，供多处共用 |
| `_fallIntoPit()` | 掉坑入口：扣血，生命归零则 GameOver，否则触发气球救援 |
| `_rescueWithBalloon()` | 气球救援完整实现（见下） |

#### `_rescueWithBalloon()` 详细流程

```
掉坑
 └─ 扣血 + 开启无敌
     └─ 玩家传送到屏幕底部
         └─ 气球从下方飘上来（800ms，Sine.easeOut）
             └─ 悬浮 3 秒
             │   ├─ 重力关闭
             │   ├─ 玩家可左右移动（180px/s）选择落点
             │   └─ 屏幕显示 🎈 倒计时
             └─ 气球向上飘走（600ms）
                 └─ 重力恢复，玩家下落
                     └─ 无敌再持续 1.2 秒 + 闪烁
```

气球用 `Graphics` 程序化绘制（红色圆形 + 高光 + 绳子 + 底部小尖），每帧跟随玩家 X 更新，无需额外素材。

#### `update()`
- 气球救援期间处理左右移动输入并提前返回
- **关键修复**：`return` 前保留敌人 `update()` 调用，防止平台敌人因巡逻速度未设置而被重力拉落地面

---

### `src/scenes/WinScene.js`
- `create(data)` 接收得分参数，显示「得分：xxx」
- 按钮跳转改为 `MenuScene`

### `src/scenes/GameOverScene.js`
- `create(data)` 接收得分参数，显示「得分：xxx」
- 按钮跳转改为 `MenuScene`
- 修复生命归零时未传 score 参数的问题

### `src/entities/Player.js`
`setCollideWorldBounds(true, 1, 1, false)` — 只碰左右边界，底部不碰，确保玩家能掉进沟里。

### `src/managers/SoundManager.js`
- BGM 重写为魂斗罗风格军队进行曲（D大调，BPM=160）
- 修复 AudioContext autoplay 策略导致 BGM 不播放的问题
- 修复跳跃音效在 BGM 解锁前无声的问题（`playTone`/`playJump`/`playHurt` 加 `resume()` guard）
- 修复变量名冲突（`A3` 频率常量改为 `LA3`）

---

## 素材目录要求

```
public/assets/Enemies/Hedgehog/
├── Idle_1__44x26_.png
├── Idle_2__44x26_.png
├── Spikes_out__44x26_.png
├── Spikes_in__44x26_.png
└── Hit__44x26_.png
```

## 需要在 `main.js` 注册 MenuScene

```js
import MenuScene from './scenes/MenuScene.js';

const config = {
  scene: [MenuScene, GameScene, WinScene, GameOverScene], // MenuScene 放第一个
};
```
