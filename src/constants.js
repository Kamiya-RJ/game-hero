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



