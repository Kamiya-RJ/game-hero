# 冒险小勇士 BGM 改动说明

## 改动文件

- `SoundManager.js` — 重写 `_scheduleBGM()`
- `GameScene.js` — 新增 `createBGMToggle()`，并在 `create()` 中调用

---

## SoundManager.js — 新 `_scheduleBGM()`

### 曲目结构（AABCA'B'C'，约 15.5 秒一循环）

| 段落 | 名称 | 特点 |
|------|------|------|
| A    | 主题句     | 活泼上行，建立角色感 |
| A    | 主题重复   | 加入颤音装饰（快速交替相邻音） |
| B    | 副歌       | 情绪推高，大跳音程 + 附点节奏 |
| C    | 桥接句     | 降 A 大调色彩，情绪短暂转暗 |
| A'   | 主题变奏   | 高八度，节奏加密（十六分音符点缀） |
| B'   | 副歌强化   | 结构同 B，由和声层加厚区分 |
| C'   | 尾句       | 下行解决，引回循环 |

### 四层音色

| 层次 | 波形 | 作用 |
|------|------|------|
| 旋律层 | `square`   | 主旋律，带 20% 间隙增加颗粒感，芯片经典音色 |
| 和声层 | `sine`     | 仅 A+A2 段，旋律三度上方，柔和加厚音色 |
| 低音层 | `triangle` | 根音 + 五音交替，跟随和弦进行（C-G-Am-F 等） |
| 打击层 | `sawtooth` | 底鼓（低频下扫）+ 踩镲（弱拍高频短音） |

### 和弦进行

| 段落 | 和弦 |
|------|------|
| A × 2 | C — G — Am — F |
| B × 2 | F — G — C — Am |
| C     | Fm — C — G — C |
| A'    | C — Am — F — G |
| C'    | Am — F — C — G — C |

---

## GameScene.js — BGM 开关按钮

### 新增方法 `createBGMToggle()`

- 在屏幕左上角分数下方显示 `🔊 BGM` 按钮
- 点击切换静音状态：
  - `🔊 BGM` → 点击 → `🔇 BGM`（调用 `soundManager.stopBGM()`）
  - `🔇 BGM` → 点击 → `🔊 BGM`（调用 `soundManager.playBGM()`）
- 鼠标悬停时按钮透明度降低，提供视觉反馈
- `setScrollFactor(0)` 固定在屏幕上，不随摄像机移动

### `create()` 调用顺序

```js
this.soundManager = new SoundManager(this);
this.soundManager.playBGM(); // 启动背景音乐
this.createBGMToggle();      // BGM 开关按钮（需在 soundManager 后创建）
```

### 场景切换时停止 BGM

| 触发条件 | 位置 |
|----------|------|
| 玩家进入城门 | `createColliders()` → WinScene 前 |
| 生命归零     | `hitByEnemy()` → GameOverScene 前 |
