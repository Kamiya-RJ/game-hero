import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Flag from '../objects/Flag.js';
import Castle from '../objects/Castle.js';
import Coin from '../objects/Coin.js';
import Slime from '../entities/Slime.js';
import SoundManager from '../managers/SoundManager.js';
import {
  GRAVITY, GROUND_HEIGHT, WORLD_WIDTH_MULTIPLIER,
  PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_JUMP_VELOCITY,
  PLAYER_INITIAL_LIVES, PLAYER_INVINCIBLE_DURATION, PLAYER_STOMP_BOUNCE,
  PLAYER_KNOCKBACK_X, PLAYER_KNOCKBACK_Y,
  PLATFORM_WIDTH, PLATFORM_HEIGHT, PLATFORM_HALF_HEIGHT,
  COIN_FRAMES, COIN_SPIN_FRAMERATE, COIN_PLATFORM_OFFSET, COIN_SCORE_VALUE,
  SLIME_RUN_FRAMES, SLIME_HIT_FRAMES, SLIME_FRAMERATE, SLIME_SCORE_VALUE, SLIME_SPAWN_OFFSET_Y,
  HUD_FONT_SIZE, HUD_SCORE_COLOR, HUD_LIVES_COLOR, HUD_STROKE_COLOR, HUD_STROKE_THICKNESS
} from '../constants.js';

/**
 * 主游戏场景
 * 负责整个游戏世界的创建和更新
 * 包括地面、平台、金币、玩家、敌人、装饰物、碰撞、摄像机和 HUD
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * 预加载所有游戏资源
   * 包括玩家、金币、史莱姆的精灵帧
   */
  preload() {
    this.load.spritesheet('idle', 'assets/Dude_Monster/Dude_Monster_Idle_4.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('run', 'assets/Dude_Monster/Dude_Monster_Run_6.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/Dude_Monster/Dude_Monster_Jump_8.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('coin', 'assets/Coin_Gems/MonedaD.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('slime_run', 'assets/Enemies/Slime/Idle-Run (44x30).png', { frameWidth: 44, frameHeight: 30 });
    this.load.spritesheet('slime_hit', 'assets/Enemies/Slime/Hit (44x30).png', { frameWidth: 44, frameHeight: 30 });
  }

  /**
   * 场景初始化入口
   * 按顺序创建世界中的所有元素
   * 顺序很重要：平台必须在敌人和金币之前创建，玩家必须在碰撞检测之前创建
   */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;
    this.WORLD_WIDTH = W * WORLD_WIDTH_MULTIPLIER;

    this.physics.world.setBounds(0, 0, this.WORLD_WIDTH, H);
    this.createTextures();
    this.createGround();
    this.createPlatforms();
    this.createCoins();
    this.createPlayer();
    this.createEnemies();
    this.createLives();
    this.createDecorations();
    this.createColliders();
    this.createCamera();
    this.createHUD();
    this.createInput();
    this.soundManager = new SoundManager(this);
    this.soundManager.playBGM(); // 启动背景音乐
    this.createBGMToggle();      // BGM 开关按钮（需在 soundManager 后创建）
  }

  /**
   * 生成地面和平台的纹理
   * 用 Graphics 绘制纯色矩形并转成可复用纹理
   * 必须在 createGround 和 createPlatforms 之前调用
   */
  createTextures() {
    // 平台纹理
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x228B22, 1);
    g.fillRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
    g.generateTexture('platform', PLATFORM_WIDTH, PLATFORM_HEIGHT);
    g.destroy();

    // 地面纹理（宽度覆盖整个世界）
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x228B22, 1);
    g2.fillRect(0, 0, this.WORLD_WIDTH, GROUND_HEIGHT);
    g2.generateTexture('ground', this.WORLD_WIDTH, GROUND_HEIGHT);
    g2.destroy();
  }

  /**
   * 创建贯穿整个世界的地面
   * 使用静态物理组，不受重力影响
   */
  createGround() {
    this.platforms = this.physics.add.staticGroup();
    const ground = this.platforms.create(this.WORLD_WIDTH / 2, this.H - GROUND_HEIGHT / 2, 'ground');
    ground.setDisplaySize(this.WORLD_WIDTH, GROUND_HEIGHT);
    ground.refreshBody();
  }

  /**
   * 创建所有浮动平台
   * 坐标使用屏幕宽度比例，适配不同屏幕尺寸
   * platformData 存为实例变量，供 createCoins 和 createEnemies 复用
   */
  createPlatforms() {
    const { W, H } = this;
    this.platformData = [
      { x: W * 0.5, y: H - 200 },
      { x: W * 0.9, y: H - 300 },
      { x: W * 1.2, y: H - 180 },
      { x: W * 1.5, y: H - 320 },
      { x: W * 1.8, y: H - 200 },
      { x: W * 2.1, y: H - 280 },
      { x: W * 2.4, y: H - 150 },
      { x: W * 2.7, y: H - 320 },
      { x: W * 3.0, y: H - 200 },
      { x: W * 3.3, y: H - 250 },
    ];

    this.platformData.forEach(({ x, y }) => {
      const p = this.platforms.create(x, y, 'platform');
      p.refreshBody();
    });
  }

  /**
   * 创建所有金币，分三种类型：
   * 1. 平台上方金币 — 每个平台正上方，容易收集
   * 2. 空中金币 — 需要从地面或平台大跳才能触到
   * 3. 抛物线金币 — 从最后平台右边缘跳起，沿跳跃轨迹排列
   */
  createCoins() {
    const { W, H } = this;

    // 注册金币旋转动画
    if (!this.anims.exists('coin_spin')) {
      this.anims.create({
        key: 'coin_spin',
        frames: this.anims.generateFrameNumbers('coin', { start: 0, end: COIN_FRAMES }),
        frameRate: COIN_SPIN_FRAMERATE,
        repeat: -1
      });
    }

    // 金币物理组：关闭重力，设为不可移动
    this.coins = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // 1. 平台上方金币
    this.platformData.forEach(({ x, y }) => {
      this.coins.add(new Coin(this, x, y - COIN_PLATFORM_OFFSET));
    });

    // 2. 空中金币（需要大跳才能触到）
    const airCoinData = [
      { x: W * 0.35, y: H - 270 },  // 从地面大跳
      { x: W * 0.70, y: H - 520 },  // 从平台大跳
      { x: W * 0.75, y: H - 520 },  // 从平台大跳
      { x: W * 1.05, y: H - 420 },  // 从平台大跳
      { x: W * 1.65, y: H - 200 },  // 从地面跳
      { x: W * 2.20, y: H - 430 },  // 从平台大跳
      { x: W * 2.25, y: H - 460 },  // 从平台大跳
      { x: W * 2.30, y: H - 430 },  // 从平台大跳
      { x: W * 2.85, y: H - 440 },  // 从平台大跳
    ];

    airCoinData.forEach(({ x, y }) => {
      this.coins.add(new Coin(this, x, y));
    });

    // 3. 抛物线金币：自动取最后一个平台坐标，从右边缘起跳
    const lastPlatform = this.platformData[this.platformData.length - 1];
    this.spawnArcCoins(
      lastPlatform.x + PLATFORM_WIDTH / 2,  // 平台右边缘
      lastPlatform.y - 60,  // 平台顶部
      PLAYER_SPEED,
      PLAYER_JUMP_VELOCITY,
      GRAVITY,
      6,
      0.22
    );
  }

  /**
   * 创建玩家角色
   * 初始位置在地面左侧
   */
  createPlayer() {
    this.player = new Player(this, 100, this.H - GROUND_HEIGHT - PLAYER_HEIGHT / 2);
  }

  /**
   * 创建史莱姆敌人
   * 注册动画，并在部分平台上生成敌人
   * 敌人生成位置 = 平台中心Y - 平台半高 - 敌人偏移
   */
  createEnemies() {
    // 注册史莱姆跑步动画
    if (!this.anims.exists('slime_run')) {
      this.anims.create({
        key: 'slime_run',
        frames: this.anims.generateFrameNumbers('slime_run', { start: 0, end: SLIME_RUN_FRAMES }),
        frameRate: SLIME_FRAMERATE,
        repeat: -1
      });
    }

    // 注册史莱姆受击动画
    if (!this.anims.exists('slime_hit')) {
      this.anims.create({
        key: 'slime_hit',
        frames: this.anims.generateFrameNumbers('slime_hit', { start: 0, end: SLIME_HIT_FRAMES }),
        frameRate: SLIME_FRAMERATE,
        repeat: 0
      });
    }

    this.enemies = this.physics.add.group();

    // 选取部分平台放置敌人（奇数索引）
    const enemyPlatforms = [1, 3, 5, 7, 9];
    enemyPlatforms.forEach(i => {
      const { x, y } = this.platformData[i];
      const slime = new Slime(this, x, y - PLATFORM_HALF_HEIGHT - SLIME_SPAWN_OFFSET_Y);
      this.enemies.add(slime);
    });
  }

  /**
   * 创建生命值 HUD
   * 显示爱心在屏幕右上角，setScrollFactor(0) 固定在屏幕上不随摄像机移动
   */
  createLives() {
    this.lives = PLAYER_INITIAL_LIVES;
    this.livesText = this.add.text(this.scale.width - 16, 16, `❤️ x${this.lives}`, {
      fontSize: HUD_FONT_SIZE,
      color: HUD_LIVES_COLOR,
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS
    }).setOrigin(1, 0).setScrollFactor(0);
  }

  /**
   * 创建场景装饰物
   * 旗子放在世界中点，城堡放在世界最右端
   */
  createDecorations() {
    const { WORLD_WIDTH, H } = this;
    const groundY = H - GROUND_HEIGHT;
    this.flag = new Flag(this, WORLD_WIDTH / 2 - 200, groundY);
    this.castle = new Castle(this, WORLD_WIDTH - 100, groundY);
  }

  /**
   * 注册所有物理碰撞和重叠检测
   * 必须在 createPlayer、createEnemies、createCoins、createDecorations 之后调用
   *
   * - 玩家 vs 平台：物理碰撞，玩家站在平台上
   * - 敌人 vs 平台：物理碰撞，敌人站在平台上
   * - 玩家 vs 金币：重叠触发计分并销毁金币
   * - 玩家 vs 城门：重叠触发关卡完成
   * - 玩家 vs 敌人：从上方踩死得分，从侧面碰到扣血
   */
  createColliders() {
    // 玩家与平台碰撞
    this.physics.add.collider(this.player, this.platforms);

    // 敌人与平台碰撞
    this.physics.add.collider(this.enemies, this.platforms);

    // 玩家收集金币
    this.physics.add.overlap(this.player, this.coins, (player, coin) => {
      coin.destroy();
      this.score += COIN_SCORE_VALUE;
      this.scoreText.setText('Score: ' + this.score);
      this.soundManager.playCoin();
    });

    // 玩家进入城门触发关卡完成
    this.physics.add.overlap(this.player, this.castle.zone, () => {
      this.soundManager.stopBGM(); // 停止背景音乐
      this.scene.start('WinScene');
    });

    // 玩家与敌人交互
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (!enemy.active) return;
      if (this.isInvincible) return; // 无敌期间跳过所有敌人碰撞

      // 从上方踩到敌人：敌人死亡，玩家弹起得分
      if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
        enemy.die();
        this.score += SLIME_SCORE_VALUE;
        this.scoreText.setText('Score: ' + this.score);
        player.setVelocityY(PLAYER_STOMP_BOUNCE);
        this.soundManager.playStomp();
      } else {
        // 从侧面碰到敌人：扣血
        this.hitByEnemy();
      }

    });

  }

  /**
   * 玩家被敌人从侧面碰到时触发
   * 扣一条命并短暂变红（无敌时间）
   * 生命归零则跳转 GameOver 场景
   */
  hitByEnemy() {
    if (this.isInvincible) return;

    this.lives -= 1;
    this.livesText.setText('❤️ x' + this.lives);
    this.soundManager.playHurt();

    // 击退：向反方向弹开
    const knockbackX = this.player.flipX ? PLAYER_KNOCKBACK_X : -PLAYER_KNOCKBACK_X;
    this.player.setVelocityX(knockbackX);
    this.player.setVelocityY(PLAYER_KNOCKBACK_Y);

    if (this.lives <= 0) {
      this.soundManager.stopBGM(); // 停止背景音乐
      this.scene.start('GameOverScene');
      return;
    }

    // 开启无敌状态
    this.isInvincible = true;

    // 闪烁次数 = 无敌时间 / 每次切换间隔 - 1
    const flashCount = (PLAYER_INVINCIBLE_DURATION / 100) - 1;
    // 闪烁效果
    this.flashTimer = this.time.addEvent({
      delay: 100,
      repeat: flashCount,
      callback: () => {
        this.player.setVisible(!this.player.visible);
      }
    });

    // 无敌时间结束
    this.time.delayedCall(PLAYER_INVINCIBLE_DURATION, () => {
      this.isInvincible = false;
      this.player.setVisible(true);
    });
  }

  /**
   * 设置摄像机跟随玩家
   * 限制摄像机在世界边界内，lerp 参数控制跟随平滑度
   */
  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  /**
   * 创建分数 HUD
   * 固定在屏幕左上角，setScrollFactor(0) 不随摄像机移动
   */
  createHUD() {
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: HUD_FONT_SIZE,
      color: HUD_SCORE_COLOR,
      fontStyle: 'bold',
      stroke: HUD_STROKE_COLOR,
      strokeThickness: HUD_STROKE_THICKNESS
    }).setScrollFactor(0);
  }

  /**
   * 创建 BGM 开关按钮
   * 显示在屏幕左上角分数下方
   * 点击切换静音，同时更新图标
   * 必须在 soundManager 初始化之后调用
   */
  createBGMToggle() {
    this.bgmMuted = false;
    this.bgmToggleBtn = this.add.text(16, 44, '🔊 BGM', {
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
      .on('pointerout',  () => this.bgmToggleBtn.setAlpha(1))
      .on('pointerdown', () => {
        this.bgmMuted = !this.bgmMuted;
        if (this.bgmMuted) {
          this.soundManager.stopBGM();
          this.bgmToggleBtn.setText('🔇 BGM');
        } else {
          this.soundManager.playBGM();
          this.bgmToggleBtn.setText('🔊 BGM');
        }
      });
  }

  /**
   * 注册键盘输入
   * createCursorKeys 包含方向键和空格
   * 额外注册 Ctrl 键用于加速跑
   */
  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cursors.ctrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
  }

  /**
   * 沿抛物线轨迹生成一串金币
   * 根据物理公式计算每个金币的位置：
   *   x(t) = startX + vx * t
   *   y(t) = startY + vy * t + 0.5 * gravity * t²
   *
   * @param {number} startX    起跳点 X
   * @param {number} startY    起跳点 Y
   * @param {number} vx        水平速度（px/s）
   * @param {number} vy        跳跃初速度（负数向上）
   * @param {number} gravity   重力加速度
   * @param {number} count     金币数量
   * @param {number} interval  时间间隔（秒）
   */
  spawnArcCoins(startX, startY, vx, vy, gravity, count, interval) {
    for (let i = 1; i <= count; i++) {
      const t = i * interval;
      const cx = startX + vx * t;
      const cy = startY + vy * t + 0.5 * gravity * t * t;
      this.coins.add(new Coin(this, cx, cy));
    }
  }

  /**
   * 每帧更新
   * 将键盘输入传给玩家
   * 更新所有活跃敌人的巡逻逻辑
   */
  update() {
    this.player.update(this.cursors);
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update();
    });
  }
}