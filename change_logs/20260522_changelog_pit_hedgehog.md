# 冒险小勇士 Changelog — 沟 + 刺猬地面敌人

## 新增文件

### `Hedgehog.js`（`src/entities/Hedgehog.js`）

全新地面敌人类，继承自 `Phaser.Physics.Arcade.Sprite`。

#### 行为逻辑（方案C：巡逻 + 定时伸缩刺）

| 状态 | 动画 | 玩家可踩死？ | 玩家碰到？ |
|------|------|-------------|-----------|
| 收刺待机 | `hedgehog_idle1` | ✅ 可踩死 | 侧面受伤 |
| 出刺过渡 | `hedgehog_spikes_out` | ❌ 不可踩 | 受伤 |
| 出刺待机 | `hedgehog_idle2` | ❌ 不可踩 | 受伤 |
| 收刺过渡 | `hedgehog_spikes_in` | ❌ 不可踩 | 受伤 |
| 受击死亡 | `hedgehog_hit` | — | — |

#### 时序
```
收刺待机 ──(每隔3秒)──► spikes_out过渡 ──► 出刺待机
出刺待机 ──(持续2秒后)──► spikes_in过渡 ──► 收刺待机
```

#### 巡逻
- 在出生点左右各 120px 范围内来回走
- 碰墙或超出范围自动反向
- 速度：60 px/s

---

## 修改文件

### `constants.js`

#### 新增刺猬常量（18个）

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
| `HEDGEHOG_SPIKE_INTERVAL` | 3000 | 出刺间隔（毫秒） |
| `HEDGEHOG_SPIKE_DURATION` | 2000 | 出刺持续时间（毫秒） |
| `HEDGEHOG_SCORE_VALUE` | 80 | 踩死得分 |
| `HEDGEHOG_FRAMERATE` | 10 | 动画帧率 |
| `HEDGEHOG_IDLE1_FRAMES` | 13 | idle1 末帧索引 |
| `HEDGEHOG_IDLE2_FRAMES` | 13 | idle2 末帧索引 |
| `HEDGEHOG_SPIKES_OUT_FRAMES` | 7 | spikes_out 末帧索引 |
| `HEDGEHOG_SPIKES_IN_FRAMES` | 7 | spikes_in 末帧索引 |
| `HEDGEHOG_HIT_FRAMES` | 4 | hit 末帧索引 |

#### 新增沟常量（1个）

| 常量 | 值 | 说明 |
|------|----|------|
| `PIT_DEATH_Y_OFFSET` | 50 | 玩家 Y 超过地面底部多少像素判定掉坑 |

---

### `GameScene.js`

#### `preload()`
新增加载 5 张刺猬精灵表：
```
assets/Enemies/Hedgehog/Idle_1__44x26_.png
assets/Enemies/Hedgehog/Idle_2__44x26_.png
assets/Enemies/Hedgehog/Spikes_out__44x26_.png
assets/Enemies/Hedgehog/Spikes_in__44x26_.png
assets/Enemies/Hedgehog/Hit__44x26_.png
```

#### `createTextures()`
移除整体地面纹理生成（`ground`），改为在 `createGround()` 中按段动态生成。

#### `createGround()`（重写）
地面从一整块改为**多段拼接**，中间留沟。

沟的位置（相对屏幕宽度 W）：

| 沟编号 | 起始 X | 结束 X | 宽度 | 特点 |
|--------|--------|--------|------|------|
| 沟1 | W × 1.35 | W × 1.55 | W × 0.20 | 需跳跃越过 |
| 沟2 | W × 2.15 | W × 2.45 | W × 0.30 | 较宽，需借助平台 |
| 沟3 | W × 3.10 | W × 3.25 | W × 0.15 | 靠近终点的小沟 |

#### `createEnemies()`
- 注册刺猬 5 组动画
- 在 6 个地面安全位置生成刺猬（避开沟区域）

| 位置 | X（相对W） | 所在地面段 |
|------|-----------|-----------|
| 1 | W × 0.20 | 第一段中部 |
| 2 | W × 0.75 | 第一段右侧 |
| 3 | W × 1.70 | 第二段左侧 |
| 4 | W × 1.95 | 第二段右侧 |
| 5 | W × 2.70 | 第三段中部 |
| 6 | W × 3.50 | 第四段（终点段） |

#### `createColliders()`
刺猬踩踏逻辑：
- `spiked = false`（收刺）→ 可踩死，得 80 分
- `spiked = true`（出刺）→ 踩到玩家受伤

#### `hitByEnemy()`
重构：提取无敌逻辑为 `_startInvincible()`，同时修复了生命归零后未 `return` 的 bug。

#### 新增方法

| 方法 | 说明 |
|------|------|
| `_startInvincible()` | 开启无敌状态 + 闪烁效果，供多处共用 |
| `_fallIntoPit()` | 掉坑：扣血 → 找复活点 → 传送 → 开启无敌 |
| `_findRespawnX(x)` | 根据掉坑前 X 找最近地面段边缘作为复活点 |

#### `update()`
新增掉坑检测：
```js
if (this.player.y > this.H + PIT_DEATH_Y_OFFSET) {
  this._fallIntoPit();
}
```

---

## 素材目录要求

刺猬素材放置路径：
```
public/assets/Enemies/Hedgehog/
├── Idle_1__44x26_.png
├── Idle_2__44x26_.png
├── Spikes_out__44x26_.png
├── Spikes_in__44x26_.png
└── Hit__44x26_.png
```
