import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Flag from '../objects/Flag.js';
import Castle from '../objects/Castle.js';
import Coin from '../objects/Coin.js';
import Slime from '../entities/Slime.js';
import Hedgehog from '../entities/Hedgehog.js';
import MovingPlatform from '../objects/MovingPlatform.js';
import Brick from '../objects/Brick.js';
import Chest from '../objects/Chest.js';
import SoundManager from '../managers/SoundManager.js';
import { LEVELS } from '../config/levels.js';
import {
  GRAVITY, GROUND_HEIGHT,
  PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_JUMP_VELOCITY,
  PLAYER_INITIAL_LIVES, PLAYER_INVINCIBLE_DURATION, PLAYER_STOMP_BOUNCE,
  PLAYER_KNOCKBACK_X, PLAYER_KNOCKBACK_Y,
  PLATFORM_WIDTH, PLATFORM_HEIGHT, PLATFORM_HALF_HEIGHT,
  COIN_FRAMES, COIN_SPIN_FRAMERATE, COIN_PLATFORM_OFFSET, COIN_SCORE_VALUE,
  SLIME_RUN_FRAMES, SLIME_HIT_FRAMES, SLIME_FRAMERATE, SLIME_SCORE_VALUE, SLIME_SPAWN_OFFSET_Y,
  HEDGEHOG_FRAMERATE, HEDGEHOG_IDLE1_FRAMES, HEDGEHOG_IDLE2_FRAMES,
  HEDGEHOG_SPIKES_OUT_FRAMES, HEDGEHOG_SPIKES_IN_FRAMES, HEDGEHOG_HIT_FRAMES,
  HEDGEHOG_SCORE_VALUE,
  MOVING_PLATFORM_WIDTH, MOVING_PLATFORM_HEIGHT,
  PIT_DEATH_Y_OFFSET,
  THEMES,
  HUD_FONT_SIZE, HUD_SCORE_COLOR, HUD_LIVES_COLOR, HUD_STROKE_COLOR, HUD_STROKE_THICKNESS
} from '../constants.js';

/**
 * 主游戏场景 — 数据驱动版
 *
 * 通过 LEVELS 配置文件支持多关卡，所有关卡共用同一场景。
 * 关卡数据在 src/config/levels.js 中定义。
 *
 * create(data) 接收跨关数据：
 *   levelId      关卡编号（默认 1）
 *   totalScore   累计总得分（默认 0）
 *   lives        跨关保留血量（默认 PLAYER_INITIAL_LIVES）
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.spritesheet('idle', 'assets/Dude_Monster/Dude_Monster_Idle_4.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('run', 'assets/Dude_Monster/Dude_Monster_Run_6.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/Dude_Monster/Dude_Monster_Jump_8.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('coin', 'assets/Coin_Gems/MonedaD.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('slime_run', 'assets/Enemies/Slime/Idle-Run (44x30).png', { frameWidth: 44, frameHeight: 30 });
    this.load.spritesheet('slime_hit', 'assets/Enemies/Slime/Hit (44x30).png', { frameWidth: 44, frameHeight: 30 });
    this.load.spritesheet('hedgehog_idle1', 'assets/Enemies/Hedgehog/Idle_1__44x26_.png', { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_idle2', 'assets/Enemies/Hedgehog/Idle_2__44x26_.png', { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_spikes_out', 'assets/Enemies/Hedgehog/Spikes_out__44x26_.png', { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_spikes_in', 'assets/Enemies/Hedgehog/Spikes_in__44x26_.png', { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_hit', 'assets/Enemies/Hedgehog/Hit__44x26_.png', { frameWidth: 44, frameHeight: 26 });
  }

  /**
   * create(data) — 接收跨关数据
   */
  create(data = {}) {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;

    // ── 关卡配置 ──────────────────────────────────────────
    this.levelId = data.levelId ?? 1;
    this.totalScore = data.totalScore ?? 0;
    this.levelCfg = LEVELS[this.levelId - 1];
    this.theme = THEMES[this.levelCfg.theme];

    this.WORLD_WIDTH = W * this.levelCfg.worldWidthMultiplier;

    // ── 跨关数据 ──────────────────────────────────────────
    this.score = 0;
    this.collectedCoins = 0;
    this.totalCoins = 0;        // 由 createCoins/createBricks/createChests 累计
    this.initialLives = data.lives ?? PLAYER_INITIAL_LIVES;
    this._levelDone = false;     // 重置关卡完成标志
    // 重置所有运行时状态，防止从其他场景带入（无敌、气球等）
    this.isInvincible = false;
    this.isBalloonFloating = false;

    // ── 世界物理 ──────────────────────────────────────────
    this.physics.world.setBounds(0, 0, this.WORLD_WIDTH, H, true, true, true, false);

    // ── 按顺序创建 ────────────────────────────────────────
    this.soundManager = new SoundManager(this);
    this.createBackground();
    this.createTextures();
    this.createGround();
    this.createPlatforms();
    this.createMovingPlatforms();
    this.createBricks();
    this.createChests();
    this.createCoins();
    this.createPlayer();
    this.createEnemies();
    this.createLives();
    this.createDecorations();
    this.createColliders();
    this.createCamera();
    this.createHUD();
    this.createInput();
    this.soundManager.playBGM(this.levelCfg.theme);
    this.createBGMToggle();
  }

  // ══════════════════════════════════════════════════════════
  // 背景
  // ══════════════════════════════════════════════════════════

  /**
   * 根据主题绘制背景
   * grassland: 渐变天空 + 云朵
   * cave:      暗色背景 + 火把光晕
   * snow:      浅蓝天空 + 雪花粒子
   * lava:      深红背景 + 熔岩光效
   */
  createBackground() {
    const { W, H } = this;
    const t = this.theme;

    // 渐变天空：固定在屏幕上（scrollFactor=0），depth=-10 确保在最底层
    const steps = 8;
    const topC = Phaser.Display.Color.IntegerToColor(t.skyTop);
    const botC = Phaser.Display.Color.IntegerToColor(t.skyBottom);
    for (let i = 0; i < steps; i++) {
      const r = Phaser.Math.Linear(topC.red, botC.red, i / steps);
      const g = Phaser.Math.Linear(topC.green, botC.green, i / steps);
      const b = Phaser.Math.Linear(topC.blue, botC.blue, i / steps);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      this.add.rectangle(W / 2, (H / steps) * (i + 0.5), W, H / steps + 1, color)
        .setScrollFactor(0)
        .setDepth(-10);
    }

    if (t.bgClouds) this._createClouds();
    if (t.bgTorches) this._createTorches();
    if (t.bgSnow) this._createSnow();
    if (t.bgLava) this._createLavaGlow();
  }

  _createClouds() {
    const { WORLD_WIDTH, H } = this;
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(0, WORLD_WIDTH);
      const y = Phaser.Math.Between(H * 0.05, H * 0.45);
      const s = Phaser.Math.FloatBetween(0.6, 1.4);
      const g = this.add.graphics().setDepth(-9);

      // 大椭圆：完全不透明
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(x, y, 90 * s, 40 * s);

      // 小椭圆：半透明，保持柔和感
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(x - 28 * s, y + 8 * s, 60 * s, 30 * s);
      g.fillEllipse(x + 28 * s, y + 8 * s, 60 * s, 30 * s);
    }
  }

  _createTorches() {
    const { WORLD_WIDTH, H } = this;
    const groundY = H - GROUND_HEIGHT;
    for (let x = 200; x < WORLD_WIDTH; x += Phaser.Math.Between(280, 420)) {
      const g = this.add.graphics().setDepth(-5);
      g.fillStyle(0x996633, 1);
      g.fillRect(x - 3, groundY - 60, 6, 50);
      g.fillStyle(0xcc8800, 1);
      g.fillRect(x - 6, groundY - 66, 12, 12);

      const glow = this.add.circle(x, groundY - 70, 20, 0xff6600, 0.3).setDepth(-5);
      this.tweens.add({
        targets: glow, scaleX: 1.4, scaleY: 1.4, alpha: 0.1,
        duration: Phaser.Math.Between(400, 700),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 300)
      });
    }
  }

  _createSnow() {
    const { WORLD_WIDTH, H } = this;
    for (let i = 0; i < 80; i++) {
      const flake = this.add.circle(
        Phaser.Math.Between(0, WORLD_WIDTH),
        Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.4, 0.9)
      ).setDepth(-5);

      this.tweens.add({
        targets: flake,
        y: H + 20,
        x: flake.x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        onRepeat: () => {
          flake.setY(-10);
          flake.setX(Phaser.Math.Between(0, WORLD_WIDTH));
        }
      });
    }
  }

  _createLavaGlow() {
    const { WORLD_WIDTH, H } = this;
    for (let x = 0; x < WORLD_WIDTH; x += 120) {
      const glow = this.add.rectangle(x, H - GROUND_HEIGHT / 2, 80, 6, 0xff4400, 0.5).setDepth(-5);
      this.tweens.add({
        targets: glow, alpha: 0.1,
        duration: Phaser.Math.Between(300, 800),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 500)
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 地面 & 平台
  // ══════════════════════════════════════════════════════════

  createTextures() {
    const platColor = this.theme.platformColor;
    const texKey = `platform_${platColor}`;
    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(platColor, 1);
      g.fillRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(0, 0, PLATFORM_WIDTH, 3);
      g.generateTexture(texKey, PLATFORM_WIDTH, PLATFORM_HEIGHT);
      g.destroy();
    }
    this._platformTexKey = texKey;
  }

  createGround() {
    const { H, W, WORLD_WIDTH } = this;
    this.platforms = this.physics.add.staticGroup();

    // 沟的位置（比例转绝对坐标）
    this.pitRanges = (this.levelCfg.pits || []).map(p => ({
      start: p.startW * W,
      end: p.endW * W,
    }));

    // 从沟反推地面段
    const segXs = [0, ...this.pitRanges.flatMap(p => [p.start, p.end]), WORLD_WIDTH];
    const groundColor = this.theme.groundColor;
    const edgeColor = this.theme.groundEdge;

    for (let i = 0; i < segXs.length - 1; i += 2) {
      const x1 = segXs[i];
      const x2 = segXs[i + 1];
      const segW = x2 - x1;
      if (segW <= 0) continue;

      const texKey = `ground_seg_${i}_${groundColor}`;
      if (!this.textures.exists(texKey)) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(groundColor, 1);
        g.fillRect(0, 0, segW, GROUND_HEIGHT);
        g.fillStyle(edgeColor, 1);
        g.fillRect(0, 0, segW, 4);
        g.generateTexture(texKey, segW, GROUND_HEIGHT);
        g.destroy();
      }
      const seg = this.platforms.create(x1 + segW / 2, H - GROUND_HEIGHT / 2, texKey);
      seg.setDisplaySize(segW, GROUND_HEIGHT);
      seg.refreshBody();
    }
  }

  createPlatforms() {
    const { W, H } = this;
    this.platformData = (this.levelCfg.platforms || []).map(p => ({
      x: p.xW * W,
      y: p.yH * H,
    }));

    this.platformData.forEach(({ x, y }) => {
      const p = this.platforms.create(x, y, this._platformTexKey);
      p.refreshBody();
    });
  }

  createMovingPlatforms() {
    const { W, H } = this;
    this.movingPlatforms = []; // 普通数组，不用 physics.add.group()

    // 移动平台专属颜色
    const mpColor = 0xffaa00; // 橙色

    (this.levelCfg.movingPlatforms || []).forEach(cfg => {
      const mp = new MovingPlatform(
        this,
        cfg.xW * W,
        cfg.yH * H,
        cfg.type,
        cfg.range,
        cfg.speed,
        cfg.color || mpColor
      );
      this.movingPlatforms.push(mp);
    });
  }

  // ══════════════════════════════════════════════════════════
  // 砖块 & 宝箱
  // ══════════════════════════════════════════════════════════

  createBricks() {
    const { W, H } = this;
    this.bricks = this.add.group(); // 普通 group，物理体在 Brick 构造函数里已设为 static

    const brickColors = {
      grassland: 0xcc7733,
      cave: 0x776655,
      snow: 0xaabbcc,
      lava: 0x883322,
    };
    const color = brickColors[this.levelCfg.theme] || 0xcc7733;

    (this.levelCfg.bricks || []).forEach(b => {
      const brick = new Brick(this, b.xW * W, b.yH * H, b.hasCoin, color);
      this.bricks.add(brick);
      if (b.hasCoin) this.totalCoins += 1;
    });
  }

  createChests() {
    const { W, H } = this;
    this.chests = this.add.group(); // 普通 group，物理体在 Chest 构造函数里已设为 static

    const chestColors = {
      grassland: 0xFFAA00,
      cave: 0xcc8800,
      snow: 0x88aacc,
      lava: 0xcc4400,
    };
    const color = chestColors[this.levelCfg.theme] || 0xFFAA00;

    (this.levelCfg.chests || []).forEach(c => {
      const chest = new Chest(this, c.xW * W, c.yH * H, c.reward, color);
      this.chests.add(chest);
      if (c.reward === 'coin') this.totalCoins += 3;
    });
  }

  // ══════════════════════════════════════════════════════════
  // 金币
  // ══════════════════════════════════════════════════════════

  createCoins() {
    const { W, H } = this;

    if (!this.anims.exists('coin_spin')) {
      this.anims.create({
        key: 'coin_spin',
        frames: this.anims.generateFrameNumbers('coin', { start: 0, end: COIN_FRAMES }),
        frameRate: COIN_SPIN_FRAMERATE,
        repeat: -1
      });
    }

    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });

    // 平台正上方各一枚金币
    this.platformData.forEach(({ x, y }) => {
      this.coins.add(new Coin(this, x, y - COIN_PLATFORM_OFFSET));
      this.totalCoins += 1;
    });

    // levels.js 里额外定义的金币
    (this.levelCfg.coins || []).forEach(c => {
      this.coins.add(new Coin(this, c.xW * W, c.yH * H));
      this.totalCoins += 1;
    });
  }

  // ══════════════════════════════════════════════════════════
  // 玩家
  // ══════════════════════════════════════════════════════════

  createPlayer() {
    this.player = new Player(this, 100, this.H - GROUND_HEIGHT - PLAYER_HEIGHT / 2);
  }

  // ══════════════════════════════════════════════════════════
  // 敌人
  // ══════════════════════════════════════════════════════════

  createEnemies() {
    this._registerSlimeAnims();
    this._registerHedgehogAnims();

    this.enemies = this.physics.add.group();

    const { W, H } = this;
    const groundY = H - GROUND_HEIGHT - 20;

    // 史莱姆（平台上）
    (this.levelCfg.enemies?.slimes || []).forEach(cfg => {
      const pd = this.platformData[cfg.platformIndex];
      if (!pd) return;
      const slime = new Slime(this, pd.x, pd.y - PLATFORM_HALF_HEIGHT - SLIME_SPAWN_OFFSET_Y);
      this.enemies.add(slime);
    });

    // 刺猬（地面上）
    (this.levelCfg.enemies?.hedgehogs || []).forEach(cfg => {
      const hog = new Hedgehog(this, cfg.xW * W, groundY);
      this.enemies.add(hog);
    });
  }

  _registerSlimeAnims() {
    if (!this.anims.exists('slime_run')) {
      this.anims.create({ key: 'slime_run', frames: this.anims.generateFrameNumbers('slime_run', { start: 0, end: SLIME_RUN_FRAMES }), frameRate: SLIME_FRAMERATE, repeat: -1 });
    }
    if (!this.anims.exists('slime_hit')) {
      this.anims.create({ key: 'slime_hit', frames: this.anims.generateFrameNumbers('slime_hit', { start: 0, end: SLIME_HIT_FRAMES }), frameRate: SLIME_FRAMERATE, repeat: 0 });
    }
  }

  _registerHedgehogAnims() {
    const defs = [
      { key: 'hedgehog_idle1', tex: 'hedgehog_idle1', end: HEDGEHOG_IDLE1_FRAMES, repeat: -1 },
      { key: 'hedgehog_idle2', tex: 'hedgehog_idle2', end: HEDGEHOG_IDLE2_FRAMES, repeat: -1 },
      { key: 'hedgehog_spikes_out', tex: 'hedgehog_spikes_out', end: HEDGEHOG_SPIKES_OUT_FRAMES, repeat: 0 },
      { key: 'hedgehog_spikes_in', tex: 'hedgehog_spikes_in', end: HEDGEHOG_SPIKES_IN_FRAMES, repeat: 0 },
      { key: 'hedgehog_hit', tex: 'hedgehog_hit', end: HEDGEHOG_HIT_FRAMES, repeat: 0 },
    ];
    defs.forEach(({ key, tex, end, repeat }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end }), frameRate: HEDGEHOG_FRAMERATE, repeat });
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // HUD & 生命
  // ══════════════════════════════════════════════════════════

  createLives() {
    this.lives = this.initialLives;
    this.livesText = this.add.text(this.scale.width - 16, 16, `❤️ x${this.lives}`, {
      fontSize: HUD_FONT_SIZE,
      color: HUD_LIVES_COLOR,
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS
    }).setOrigin(1, 0).setScrollFactor(0);
  }

  createHUD() {
    // 关卡标识
    this.add.text(this.scale.width / 2, 16, `第 ${this.levelId} 关`, {
      fontSize: HUD_FONT_SIZE,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS
    }).setOrigin(0.5, 0).setScrollFactor(0);

    // 本关得分
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: HUD_FONT_SIZE,
      color: HUD_SCORE_COLOR,
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS
    }).setScrollFactor(0);

    // 累计总分
    this.totalScoreText = this.add.text(16, 44, `Total: ${this.totalScore}`, {
      fontSize: '18px',
      color: '#aaffaa',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: 2
    }).setScrollFactor(0);

    // 气球倒计时（初始隐藏）—— 放在 HUD 顶部中央
    this.balloonTimerText = this.add.text(this.scale.width / 2, 44, '', {
      fontSize: '28px',
      color: '#ff9966',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0).setScrollFactor(0).setVisible(false);
  }

  createBGMToggle() {
    this.bgmMuted = this.registry.get('bgmMuted') || false;
    this.bgmToggleBtn = this.add.text(16, 70, this.bgmMuted ? '🔇 BGM' : '🔊 BGM', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS,
      backgroundColor: '#00000055',
      padding: { x: 6, y: 3 }
    })
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.bgmToggleBtn.setAlpha(0.75))
      .on('pointerout', () => this.bgmToggleBtn.setAlpha(1))
      .on('pointerdown', () => {
        this.bgmMuted = !this.bgmMuted;
        this.registry.set('bgmMuted', this.bgmMuted);
        if (this.bgmMuted) {
          this.soundManager.stopBGM();
          this.bgmToggleBtn.setText('🔇 BGM');
        } else {
          // 在 bgmToggleBtn 的 pointerdown 事件中，恢复 BGM
          this.soundManager.playBGM(this.levelCfg.theme);
          this.bgmToggleBtn.setText('🔊 BGM');
        }
      });

    // 如果菜单关闭了 BGM，进入关卡时也不播放
    if (this.bgmMuted) {
      this.soundManager.stopBGM();
    }
  }

  // ══════════════════════════════════════════════════════════
  // 装饰物（旗子 + 城堡）
  // ══════════════════════════════════════════════════════════

  createDecorations() {
    const { WORLD_WIDTH, H, W } = this;
    const groundY = H - GROUND_HEIGHT;
    // 旗子放在世界中点附近
    this.flag = new Flag(this, WORLD_WIDTH / 2 - 200, groundY);
    // 城堡/终点
    const endX = (this.levelCfg.endX || 7.7) * W;
    this.castle = new Castle(this, endX, groundY);
  }

  // ══════════════════════════════════════════════════════════
  // 碰撞
  // ══════════════════════════════════════════════════════════

  createColliders() {
    const { player, platforms, enemies, coins, bricks, chests, castle } = this;

    // 玩家与静态平台/地面
    this.physics.add.collider(player, platforms);

    // 玩家与移动平台（逐个添加）
    this.movingPlatforms.forEach(mp => {
      this.physics.add.collider(player, mp);
      this.physics.add.collider(enemies, mp);
    });

    // 敌人与静态平台/地面
    this.physics.add.collider(enemies, platforms);

    // 玩家收集金币
    this.physics.add.overlap(player, coins, (p, coin) => {
      coin.destroy();
      this.score += COIN_SCORE_VALUE;
      this.collectedCoins += 1;
      this._updateScore();
      this.soundManager.playCoin();
    });

    // 玩家头部撞砖块/宝箱（从下方跳起撞击）
    this.physics.add.overlap(player, bricks, (p, brick) => {
      if (p.body.velocity.y < 0 && p.body.blocked.up) {
        brick.hit(this);
      }
    });
    this.physics.add.overlap(player, chests, (p, chest) => {
      if (p.body.velocity.y < 0 && p.body.blocked.up) {
        chest.hit(this);
      }
    });

    // 玩家进入城门
    this.physics.add.overlap(player, castle.zone, () => {
      this._levelComplete();
    });

    // 玩家与敌人的碰撞逻辑：
    this.physics.add.overlap(player, enemies, (p, enemy) => {
      if (!enemy.active || this.isBalloonFloating) return;
      const stomping = p.body.velocity.y > 0 && p.y < enemy.y - 10;
      const isHedgehog = enemy instanceof Hedgehog;

      if (stomping) {
        if (isHedgehog && enemy.spiked) {
          if (!this.isInvincible) this.hitByEnemy();
          return;
        }
        const val = isHedgehog ? HEDGEHOG_SCORE_VALUE : SLIME_SCORE_VALUE;
        enemy.die();
        this.score += val;
        this._updateScore();
        p.setVelocityY(PLAYER_STOMP_BOUNCE);
        this.soundManager.playStomp();
      } else {
        if (!this.isInvincible) this.hitByEnemy();
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // 摄像机 & 输入
  // ══════════════════════════════════════════════════════════

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cursors.ctrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
  }

  // ══════════════════════════════════════════════════════════
  // 得分 & 关卡完成
  // ══════════════════════════════════════════════════════════

  _updateScore() {
    this.scoreText.setText('Score: ' + this.score);
    this.totalScoreText.setText('Total: ' + (this.totalScore + this.score));
  }

  _levelComplete() {
    if (this._levelDone) return;
    this._levelDone = true;
    this.soundManager.stopBGM();

    this.scene.start('LevelClearScene', {
      levelId: this.levelId,
      score: this.score,
      totalScore: this.totalScore + this.score,
      lives: this.lives,
      collectedCoins: this.collectedCoins,
      totalCoins: this.totalCoins,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 受伤 & 掉坑
  // ══════════════════════════════════════════════════════════

  hitByEnemy() {
    if (this.isInvincible) return;
    this.lives -= 1;
    this.livesText.setText('❤️ x' + this.lives);
    this.soundManager.playHurt();

    const knockbackX = this.player.flipX ? PLAYER_KNOCKBACK_X : -PLAYER_KNOCKBACK_X;
    this.player.setVelocityX(knockbackX);
    this.player.setVelocityY(PLAYER_KNOCKBACK_Y);

    if (this.lives <= 0) {
      this.soundManager.stopBGM();
      this.scene.start('GameOverScene', {
        score: this.totalScore + this.score,
        levelId: this.levelId
      });
      return;
    }

    this._startInvincible();
  }

  _startInvincible() {
    this.isInvincible = true;
    const flashCount = (PLAYER_INVINCIBLE_DURATION / 100) - 1;
    this.time.addEvent({
      delay: 100, repeat: flashCount,
      callback: () => { this.player.setVisible(!this.player.visible); }
    });
    this.time.delayedCall(PLAYER_INVINCIBLE_DURATION, () => {
      this.isInvincible = false;
      this.player.setVisible(true);
    });
  }

  _fallIntoPit() {
    if (this.isBalloonFloating) return;

    // 记录玩家掉坑前的 X 坐标，气球将飘回这里
    this.rescueTargetX = this.player.x;

    // 找到最近的沟外安全地面（左边缘或右边缘），偏移 20px 确保落在地面上
    if (this.pitRanges && this.pitRanges.length > 0) {
      for (const pit of this.pitRanges) {
        if (this.player.x >= pit.start && this.player.x <= pit.end) {
          const distToStart = this.player.x - pit.start;
          const distToEnd = pit.end - this.player.x;
          if (distToStart < distToEnd) {
            this.rescueTargetX = pit.start - 20; // 左侧地面
          } else {
            this.rescueTargetX = pit.end + 20;   // 右侧地面
          }
          break;
        }
      }
    }

    this.rescueTargetX = Phaser.Math.Clamp(this.rescueTargetX, 60, this.WORLD_WIDTH - 60);

    this.lives -= 1;
    this.livesText.setText('❤️ x' + this.lives);
    this.soundManager.playHurt();

    if (this.lives <= 0) {
      this.soundManager.stopBGM();
      this.scene.start('GameOverScene', {
        score: this.totalScore + this.score,
        levelId: this.levelId
      });
      return;
    }
    this._rescueWithBalloon();
  }

  _rescueWithBalloon() {
    if (this.balloonGraphic) {
      this.balloonGraphic.destroy();
      this.balloonGraphic = null;
    }
    // 禁用物理体
    this.player.body.enable = false;
    this.player.setVelocity(0, 0);

    const startY = this.H + 40;
    const floatY = this.H * 0.45;

    this.player.setPosition(this.player.x, startY);
    this.player.setVisible(true);

    this.balloonGraphic = this.add.graphics();
    const drawBalloon = (x, y) => {
      this.balloonGraphic.clear();
      this.balloonGraphic.lineStyle(2, 0xdddddd, 1);
      this.balloonGraphic.beginPath(); this.balloonGraphic.moveTo(x, y); this.balloonGraphic.lineTo(x, y + 36); this.balloonGraphic.strokePath();
      this.balloonGraphic.fillStyle(0xff3366, 1);
      this.balloonGraphic.fillCircle(x, y, 18);
      this.balloonGraphic.fillStyle(0xff99bb, 0.6);
      this.balloonGraphic.fillCircle(x - 6, y - 6, 7);
      this.balloonGraphic.fillStyle(0xff3366, 1);
      this.balloonGraphic.fillTriangle(x - 4, y + 16, x + 4, y + 16, x, y + 22);
    };

    let balloonY = startY - 50;
    drawBalloon(this.rescueTargetX, balloonY);

    this.tweens.add({
      targets: { val: balloonY },
      val: floatY - 50,
      duration: 800,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        balloonY = tween.targets[0].val;
        this.player.setY(balloonY + 50);
        drawBalloon(this.player.x, balloonY);
      },
      onComplete: () => {
        this.player.setY(floatY);
        // 开始漂浮状态
        this.isBalloonFloating = true;
        this.balloonTimer = 3;
        this.balloonTimerText.setVisible(true);
        this.balloonTimerText.setText('🎈 ' + this.balloonTimer);
        this.balloonFloatingStartY = floatY;

        // 气球自动水平飘向 rescueTargetX（已经在目标点则不需移动）
        const targetX = this.rescueTargetX;
        const currentX = this.player.x;
        const distance = targetX - currentX;
        if (Math.abs(distance) > 2) {
          this.balloonTween = this.tweens.add({
            targets: this.player,
            x: targetX,
            duration: 2200,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
              drawBalloon(this.player.x, balloonY);
            }
          });
        }

        // 每秒更新倒计时
        this.balloonTimerEvent = this.time.addEvent({
          delay: 1000,
          repeat: 2,
          callback: () => {
            this.balloonTimer--;
            if (this.balloonTimer > 0) {
              this.balloonTimerText.setText('🎈 ' + this.balloonTimer);
            }
          }
        });

        // 3秒后自动脱离
        this.time.delayedCall(3000, () => {
          if (this.isBalloonFloating) {
            this._performBalloonDetach();
          }
        });
      }
    });
  }

  _performBalloonDetach() {
    this.isBalloonFloating = false;
    this.balloonTimerText.setVisible(false);
    if (this.balloonTimerEvent) this.balloonTimerEvent.destroy();
    if (this.balloonTween) this.balloonTween.stop();

    // 清除气球绘制
    if (this.balloonGraphic) {
      this.balloonGraphic.destroy();
      this.balloonGraphic = null;
    }

    // 恢复物理体，设置重力
    this.player.body.enable = true;
    this.player.body.reset(this.player.x, this.player.y);
    this.player.body.setAllowGravity(true);
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(true);

    // 短暂无敌闪烁（防止落下后立刻受伤）
    this.isInvincible = true;
    this.player.setVisible(true);
    this.time.delayedCall(1500, () => {
      this.isInvincible = false;
    });
  }


  // ══════════════════════════════════════════════════════════
  // Update
  // ══════════════════════════════════════════════════════════

  update() {
    if (this.isBalloonFloating) {
      // 漂浮状态：玩家不能控制，但可按左右键脱离
      if (this.cursors.left.isDown || this.cursors.right.isDown) {
        this._performBalloonDetach();
        return; // 跳出本帧，让后续处理接管
      }
      this.player.play('anim_idle', true);
      this.enemies.getChildren().forEach(e => { if (e.active) e.update(); });
      return;
    }

    this.player.update(this.cursors);

    this.enemies.getChildren().forEach(e => { if (e.active) e.update(); });

    // 更新移动平台
    if (this.movingPlatforms) {
      this.movingPlatforms.forEach(mp => {
        if (mp.active) mp.update();
      });
    }

    if (this.player.y > this.H + PIT_DEATH_Y_OFFSET) {
      this._fallIntoPit();
    }
  }
}