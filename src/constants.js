// ============================================================
// 游戏全局常量
// 所有硬编码数字都应在此定义，方便统一调整游戏参数
// ============================================================

// 世界
export const WORLD_WIDTH_MULTIPLIER = 4;  // 世界宽度是屏幕宽度的倍数
export const GRAVITY = 1000;               // 全局重力加速度

// ============================================================
// 玩家
// ============================================================
export const PLAYER_SCALE = 2;                          // 玩家精灵缩放比例
export const PLAYER_WIDTH = 32 * PLAYER_SCALE;          // 玩家渲染宽度
export const PLAYER_HEIGHT = 32 * PLAYER_SCALE;         // 玩家渲染高度
export const PLAYER_SPEED = 250;                        // 普通移动速度
export const PLAYER_SPEED_SPRINT = 500;                 // Ctrl加速时的移动速度
export const PLAYER_JUMP_VELOCITY = -600;               // 跳跃初速度（负数向上）
export const PLAYER_JUMP_HOLD_FRAMES = 15;              // 长按跳跃最多持续帧数
export const PLAYER_JUMP_HOLD_FORCE = 20;               // 长按每帧额外向上的力
export const PLAYER_JUMP_MIN_VELOCITY = -200;           // 短按松开后的最小跳跃速度
export const PLAYER_STOMP_BOUNCE = -400;                // 踩敌人后的弹起速度
export const PLAYER_INITIAL_LIVES = 3;                  // 初始生命数
export const PLAYER_INVINCIBLE_DURATION = 2000;         // 被碰后无敌时间（毫秒）
export const PLAYER_KNOCKBACK_X = 200;                  // 水平击退速度
export const PLAYER_KNOCKBACK_Y = -300;                 // 垂直击退速度


// ============================================================
// 地面
// ============================================================
export const GROUND_HEIGHT = 32;  // 地面高度（像素）

// ============================================================
// 平台
// ============================================================
export const PLATFORM_WIDTH = 150;                          // 平台宽度
export const PLATFORM_HEIGHT = 20;                          // 平台高度
export const PLATFORM_HALF_HEIGHT = PLATFORM_HEIGHT / 2;    // 平台高度一半，用于坐标计算

// ============================================================
// 金币
// ============================================================
export const COIN_FRAME_SIZE = 16;      // 金币单帧尺寸
export const COIN_SCALE = 2;            // 金币缩放比例
export const COIN_FRAMES = 4;           // 金币动画总帧数（0~4）
export const COIN_SPIN_FRAMERATE = 10;  // 金币旋转动画帧率
export const COIN_SCORE_VALUE = 10;     // 收集金币得分
export const COIN_PLATFORM_OFFSET = 80; // 金币距平台顶部的偏移

// ============================================================
// 史莱姆敌人
// ============================================================
export const SLIME_SPEED = 80;            // 移动速度
export const SLIME_SCALE = 1.5;           // 缩放比例
export const SLIME_FRAME_WIDTH = 44;      // 精灵帧宽度
export const SLIME_FRAME_HEIGHT = 30;     // 精灵帧高度
export const SLIME_BODY_WIDTH = 36;       // 物理体宽度（小于精灵宽度）
export const SLIME_BODY_HEIGHT = 24;      // 物理体高度
export const SLIME_BODY_OFFSET_X = 4;     // 物理体水平偏移
export const SLIME_BODY_OFFSET_Y = 6;     // 物理体垂直偏移
export const SLIME_PATROL_MARGIN = 20;    // 巡逻时距平台边缘的安全距离
export const SLIME_RUN_FRAMES = 9;        // 跑步动画帧数（0~9）
export const SLIME_HIT_FRAMES = 4;        // 受击动画帧数（0~4）
export const SLIME_FRAMERATE = 10;        // 动画帧率
export const SLIME_SCORE_VALUE = 50;      // 踩死史莱姆得分
export const SLIME_SPAWN_OFFSET_Y = 30;   // 生成位置距平台顶部的偏移

// ============================================================
// 城堡
// ============================================================
export const CASTLE_MAIN_W = 160;           // 主楼宽度
export const CASTLE_MAIN_H = 200;           // 主楼高度
export const CASTLE_TOWER_W = 50;           // 侧塔宽度
export const CASTLE_TOWER_H = 260;          // 侧塔高度
export const CASTLE_CENTER_TOWER_W = 60;    // 中央塔宽度
export const CASTLE_CENTER_TOWER_H = 300;   // 中央塔高度
export const CASTLE_DOOR_W = 40;            // 拱门宽度
export const CASTLE_DOOR_H = 60;            // 拱门高度

// ============================================================
// 旗子
// ============================================================
export const FLAG_POLE_HEIGHT = 80;  // 旗杆高度
export const FLAG_POLE_WIDTH = 4;    // 旗杆宽度
export const FLAG_WIDTH = 28;        // 旗帜宽度
export const FLAG_HEIGHT = 25;       // 旗帜高度

// ============================================================
// 刺猬敌人
// ============================================================
export const HEDGEHOG_SPEED = 60;                // 巡逻速度
export const HEDGEHOG_SCALE = 1.5;               // 缩放比例
export const HEDGEHOG_FRAME_WIDTH = 44;          // 精灵帧宽度
export const HEDGEHOG_FRAME_HEIGHT = 26;         // 精灵帧高度
export const HEDGEHOG_BODY_WIDTH = 34;           // 物理体宽度
export const HEDGEHOG_BODY_HEIGHT = 20;          // 物理体高度
export const HEDGEHOG_BODY_OFFSET_X = 5;         // 物理体水平偏移
export const HEDGEHOG_BODY_OFFSET_Y = 6;         // 物理体垂直偏移
export const HEDGEHOG_PATROL_HALF = 120;         // 巡逻范围（出生点左右各120px）
export const HEDGEHOG_SPIKE_INTERVAL = 3000;     // 出刺间隔（毫秒）
export const HEDGEHOG_SPIKE_DURATION = 2000;     // 出刺持续时间（毫秒）
export const HEDGEHOG_SCORE_VALUE = 80;          // 踩死得分
export const HEDGEHOG_FRAMERATE = 10;            // 动画帧率
export const HEDGEHOG_IDLE1_FRAMES = 13;         // idle1 动画帧数（0~13）
export const HEDGEHOG_IDLE2_FRAMES = 13;         // idle2 动画帧数（0~13）
export const HEDGEHOG_SPIKES_OUT_FRAMES = 7;     // 出刺过渡帧数（0~7）
export const HEDGEHOG_SPIKES_IN_FRAMES = 7;      // 收刺过渡帧数（0~7）
export const HEDGEHOG_HIT_FRAMES = 4;            // 受击动画帧数（0~4）

// ============================================================
// 沟（地面空缺）
// ============================================================
export const PIT_DEATH_Y_OFFSET = 50; // 玩家 Y 超过地面底部多少像素判定掉坑

// ============================================================
// 移动平台
// ============================================================
export const MOVING_PLATFORM_WIDTH  = 120;   // 宽度
export const MOVING_PLATFORM_HEIGHT = 16;    // 高度
export const MOVING_PLATFORM_SPEED  = 80;    // 默认移动速度（px/s）

// ============================================================
// 砖块
// ============================================================
export const BRICK_SIZE          = 32;    // 砖块边长（正方形）
export const BRICK_SCORE_VALUE   = 5;     // 击碎得分
export const BRICK_COIN_VALUE    = 10;    // 砖块内金币得分（若含金币）

// ============================================================
// 宝箱
// ============================================================
export const CHEST_SIZE          = 32;    // 宝箱边长
export const CHEST_SCORE_VALUE   = 20;    // 击中宝箱得分
export const CHEST_COIN_COUNT    = 3;     // 宝箱弹出金币数量
export const CHEST_HEAL_VALUE    = 1;     // 宝箱加血量

// ============================================================
// 关卡主题配色
// ============================================================
export const THEMES = {
  grassland: {
    skyTop:      0x87CEEB,  // 天空顶部（浅蓝）
    skyBottom:   0xE0F4FF,  // 天空底部（更浅）
    groundColor: 0x228B22,  // 地面绿色
    groundEdge:  0x32CD32,  // 地面边缘亮绿
    platformColor: 0x228B22,
    bgStars:     false,
    bgClouds:    true,
  },
  cave: {
    skyTop:      0x0a0a1a,
    skyBottom:   0x1a1a2e,
    groundColor: 0x555566,
    groundEdge:  0x7777aa,
    platformColor: 0x444455,
    bgStars:     false,
    bgClouds:    false,
    bgTorches:   true,
  },
  snow: {
    skyTop:      0xaad4f5,
    skyBottom:   0xddeeff,
    groundColor: 0xddeeff,
    groundEdge:  0xffffff,
    platformColor: 0xaaccee,
    bgStars:     false,
    bgClouds:    true,
    bgSnow:      true,
  },
  lava: {
    skyTop:      0x0d0005,
    skyBottom:   0x2a0010,
    groundColor: 0x333333,
    groundEdge:  0xff4400,
    platformColor: 0x442200,
    bgStars:     false,
    bgClouds:    false,
    bgLava:      true,
  },
};

// ============================================================
// 关卡结算界面
// ============================================================
export const LEVEL_CLEAR_FONT_LARGE  = '42px';
export const LEVEL_CLEAR_FONT_MEDIUM = '26px';
export const LEVEL_CLEAR_FONT_SMALL  = '20px';
export const LEVEL_CLEAR_DELAY       = 500;   // 出现延迟（ms）
export const LEVEL_CLEAR_LINE_GAP    = 44;    // 结算行间距（px）

// ============================================================
// HUD 界面
// ============================================================
export const HUD_FONT_SIZE = '24px';        // HUD 字体大小
export const HUD_SCORE_COLOR = '#FFD700';   // 分数颜色（金色）
export const HUD_LIVES_COLOR = '#ff4444';   // 生命值颜色（红色）
export const HUD_STROKE_COLOR = '#000000';  // 文字描边颜色
export const HUD_STROKE_THICKNESS = 4;      // 文字描边厚度
export const WIN_FONT_SIZE = '48px';        // 胜利场景标题字体
export const GAMEOVER_FONT_SIZE = '52px';   // GameOver 场景标题字体
export const BTN_FONT_SIZE = '32px';        // 按钮字体大小


// ============================================================
// 难度设置
// ============================================================
export const DIFFICULTY = {
  easy:   { label: '容易', lives: 10, description: '10条命' },
  normal: { label: '一般', lives: 3,  description: '3条命' },
  hard:   { label: '困难', lives: 1,  description: '1条命' },
};
export const CONTINUE_COUNTDOWN = 10; // 续关倒计时秒数

