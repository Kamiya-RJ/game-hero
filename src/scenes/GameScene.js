import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Flag from '../objects/Flag.js';
import Castle from '../objects/Castle.js';
import Coin from '../objects/Coin.js';
import Slime from '../entities/Slime.js';
import Hedgehog from '../entities/Hedgehog.js';
import SoundManager from '../managers/SoundManager.js';
import {
  GRAVITY, GROUND_HEIGHT, WORLD_WIDTH_MULTIPLIER,
  PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_JUMP_VELOCITY,
  PLAYER_INITIAL_LIVES, PLAYER_INVINCIBLE_DURATION, PLAYER_STOMP_BOUNCE,
  PLAYER_KNOCKBACK_X, PLAYER_KNOCKBACK_Y,
  PLATFORM_WIDTH, PLATFORM_HEIGHT, PLATFORM_HALF_HEIGHT,
  COIN_FRAMES, COIN_SPIN_FRAMERATE, COIN_PLATFORM_OFFSET, COIN_SCORE_VALUE,
  SLIME_RUN_FRAMES, SLIME_HIT_FRAMES, SLIME_FRAMERATE, SLIME_SCORE_VALUE, SLIME_SPAWN_OFFSET_Y,
  HEDGEHOG_FRAMERATE, HEDGEHOG_IDLE1_FRAMES, HEDGEHOG_IDLE2_FRAMES,
  HEDGEHOG_SPIKES_OUT_FRAMES, HEDGEHOG_SPIKES_IN_FRAMES, HEDGEHOG_HIT_FRAMES,
  HEDGEHOG_SCORE_VALUE,
  PIT_DEATH_Y_OFFSET,
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
    this.load.spritesheet('hedgehog_idle1',     'assets/Enemies/Hedgehog/Idle_1__44x26_.png',     { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_idle2',     'assets/Enemies/Hedgehog/Idle_2__44x26_.png',     { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_spikes_out','assets/Enemies/Hedgehog/Spikes_out__44x26_.png', { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_spikes_in', 'assets/Enemies/Hedgehog/Spikes_in__44x26_.png',  { frameWidth: 44, frameHeight: 26 });
    this.load.spritesheet('hedgehog_hit',       'assets/Enemies/Hedgehog/Hit__44x26_.png',        { frameWidth: 44, frameHeight: 26 });
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

    // 第5~8参数：left, right, top, bottom 是否碰撞
    // 关掉底部碰撞，让玩家能真正掉进沟里
    this.physics.world.setBounds(0, 0, this.WORLD_WIDTH, this.H, true, true, true, false);
    this.soundManager = new SoundManager(this); // 必须在 createPlayer 之前，Player 构造时需要引用
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
    // 地面纹理在 createGround() 里按段生成
  }

  /**
   * 创建多段地面，中间留沟
   * 沟的位置用世界宽度比例定义，方便将来调整
   * groundSegments 存为实例变量，供掉坑检测复用
   *
   * 沟的位置（worldX 比例）：
   *   沟1：W*1.35 ~ W*1.55  宽约 W*0.20，需要跳跃越过
   *   沟2：W*2.15 ~ W*2.45  宽约 W*0.30，需要借助平台越过
   *   沟3：W*3.10 ~ W*3.25  宽约 W*0.15，靠近终点的小沟
   */
  createGround() {
    const { H, W, WORLD_WIDTH } = this;
    this.platforms = this.physics.add.staticGroup();

    // 沟的定义：[起始X比例, 结束X比例]（相对世界宽度）
    this.pitRanges = [
      { start: W * 1.35, end: W * 1.55 },
      { start: W * 2.15, end: W * 2.45 },
      { start: W * 3.10, end: W * 3.25 },
    ];

    // 从沟的位置反推地面段落
    const segmentXs = [0, ...this.pitRanges.flatMap(p => [p.start, p.end]), WORLD_WIDTH];

    // 每两个 X 值为一段地面（奇数索引为沟，跳过）
    for (let i = 0; i < segmentXs.length - 1; i += 2) {
      const x1 = segmentXs[i];
      const x2 = segmentXs[i + 1];
      const segW = x2 - x1;
      if (segW <= 0) continue;

      // 为每段生成独立纹理（宽度不同）
      const texKey = `ground_seg_${i}`;
      if (!this.textures.exists(texKey)) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x228B22, 1);
        g.fillRect(0, 0, segW, GROUND_HEIGHT);
        g.generateTexture(texKey, segW, GROUND_HEIGHT);
        g.destroy();
      }

      const seg = this.platforms.create(x1 + segW / 2, H - GROUND_HEIGHT / 2, texKey);
      seg.setDisplaySize(segW, GROUND_HEIGHT);
      seg.refreshBody();
    }
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
      { x: W * 1.45, y: H - 200 },  // 从pit大跳
      { x: W * 1.65, y: H - 200 },  // 从地面跳
      { x: W * 2.25, y: H - 240 },  // 从pit大跳
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
    // 注册史莱姆动画
    if (!this.anims.exists('slime_run')) {
      this.anims.create({
        key: 'slime_run',
        frames: this.anims.generateFrameNumbers('slime_run', { start: 0, end: SLIME_RUN_FRAMES }),
        frameRate: SLIME_FRAMERATE,
        repeat: -1
      });
    }
    if (!this.anims.exists('slime_hit')) {
      this.anims.create({
        key: 'slime_hit',
        frames: this.anims.generateFrameNumbers('slime_hit', { start: 0, end: SLIME_HIT_FRAMES }),
        frameRate: SLIME_FRAMERATE,
        repeat: 0
      });
    }

    // 注册刺猬动画
    if (!this.anims.exists('hedgehog_idle1')) {
      this.anims.create({
        key: 'hedgehog_idle1',
        frames: this.anims.generateFrameNumbers('hedgehog_idle1', { start: 0, end: HEDGEHOG_IDLE1_FRAMES }),
        frameRate: HEDGEHOG_FRAMERATE,
        repeat: -1
      });
    }
    if (!this.anims.exists('hedgehog_idle2')) {
      this.anims.create({
        key: 'hedgehog_idle2',
        frames: this.anims.generateFrameNumbers('hedgehog_idle2', { start: 0, end: HEDGEHOG_IDLE2_FRAMES }),
        frameRate: HEDGEHOG_FRAMERATE,
        repeat: -1
      });
    }
    if (!this.anims.exists('hedgehog_spikes_out')) {
      this.anims.create({
        key: 'hedgehog_spikes_out',
        frames: this.anims.generateFrameNumbers('hedgehog_spikes_out', { start: 0, end: HEDGEHOG_SPIKES_OUT_FRAMES }),
        frameRate: HEDGEHOG_FRAMERATE,
        repeat: 0
      });
    }
    if (!this.anims.exists('hedgehog_spikes_in')) {
      this.anims.create({
        key: 'hedgehog_spikes_in',
        frames: this.anims.generateFrameNumbers('hedgehog_spikes_in', { start: 0, end: HEDGEHOG_SPIKES_IN_FRAMES }),
        frameRate: HEDGEHOG_FRAMERATE,
        repeat: 0
      });
    }
    if (!this.anims.exists('hedgehog_hit')) {
      this.anims.create({
        key: 'hedgehog_hit',
        frames: this.anims.generateFrameNumbers('hedgehog_hit', { start: 0, end: HEDGEHOG_HIT_FRAMES }),
        frameRate: HEDGEHOG_FRAMERATE,
        repeat: 0
      });
    }

    this.enemies = this.physics.add.group();

    // 史莱姆：平台上（奇数索引）
    const slimePlatforms = [1, 3, 5, 7, 9];
    slimePlatforms.forEach(i => {
      const { x, y } = this.platformData[i];
      const slime = new Slime(this, x, y - PLATFORM_HALF_HEIGHT - SLIME_SPAWN_OFFSET_Y);
      this.enemies.add(slime);
    });

    // 刺猬：地面上，放在沟与沟之间的地面段
    // 避开沟的位置，放在安全的地面区域
    const { H } = this;
    const groundY = H - GROUND_HEIGHT - 20; // 地面上方，留出刺猬高度
    const hedgehogSpawns = [
      W => W * 0.20,   // 第一段地面中部
      W => W * 0.75,   // 第一段地面右侧
      W => W * 1.70,   // 第二段地面左侧（沟1和沟2之间）
      W => W * 1.95,   // 第二段地面右侧
      W => W * 2.70,   // 第三段地面中部（沟2和沟3之间）
      W => W * 3.50,   // 第四段地面（沟3之后）
    ];
    hedgehogSpawns.forEach(xFn => {
      const x = xFn(this.W);
      const hog = new Hedgehog(this, x, groundY);
      this.enemies.add(hog);
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
      this.soundManager.stopBGM();
      this.scene.start('WinScene', { score: this.score });
    });

    // 玩家与敌人交互
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (!enemy.active) return;
      if (this.isInvincible) return;

      const isHedgehog = enemy instanceof Hedgehog;
      const stomping = player.body.velocity.y > 0 && player.y < enemy.y - 10;

      if (stomping) {
        // 刺猬出刺状态下踩到 → 玩家受伤
        if (isHedgehog && enemy.spiked) {
          this.hitByEnemy();
          return;
        }
        // 正常踩死
        const scoreValue = isHedgehog ? HEDGEHOG_SCORE_VALUE : SLIME_SCORE_VALUE;
        enemy.die();
        this.score += scoreValue;
        this.scoreText.setText('Score: ' + this.score);
        player.setVelocityY(PLAYER_STOMP_BOUNCE);
        this.soundManager.playStomp();
      } else {
        // 侧面碰到：受伤
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
      this.soundManager.stopBGM();
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }

    this._startInvincible();
  }

  /**
   * 开启无敌状态 + 闪烁效果
   * hitByEnemy 和 _fallIntoPit 共用
   */
  _startInvincible() {
    this.isInvincible = true;
    const flashCount = (PLAYER_INVINCIBLE_DURATION / 100) - 1;
    this.flashTimer = this.time.addEvent({
      delay: 100,
      repeat: flashCount,
      callback: () => { this.player.setVisible(!this.player.visible); }
    });
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
    // 气球救援期间：只允许左右移动，忽略跳跃，重力已关闭
    if (this.isBalloonRescue) {
      const speed = 180;
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
        this.player.setFlipX(false);
      } else {
        this.player.setVelocityX(0);
      }
      this.player.play('anim_idle', true);
      // 敌人逻辑必须继续运行，否则物理引擎会把平台敌人拉下来
      this.enemies.getChildren().forEach(enemy => {
        if (enemy.active) enemy.update();
      });
      return;
    }

    this.player.update(this.cursors);
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update();
    });

    // 掉坑检测
    if (this.player.y > this.H + PIT_DEATH_Y_OFFSET) {
      this._fallIntoPit();
    }
  }

  /**
   * 掉入沟中的处理（马里奥气球救援版）
   *
   * 流程：
   *   1. 扣一条命（无敌期间掉坑不触发）
   *   2. 生命归零 → GameOver
   *   3. 生命剩余 → 气球从屏幕下方飘上来救玩家
   *      - 玩家被气球托起，重力暂时关闭
   *      - 玩家可左右移动，选择降落位置
   *      - 3 秒后气球消失，重力恢复，玩家正常下落
   *      - 无敌状态持续到落地稳定后
   */
  _fallIntoPit() {
    if (this.isInvincible) return;

    this.lives -= 1;
    this.livesText.setText('❤️ x' + this.lives);
    this.soundManager.playHurt();

    if (this.lives <= 0) {
      this.soundManager.stopBGM();
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }

    this._rescueWithBalloon();
  }

  /**
   * 气球救援动画与逻辑
   *
   * 气球用 Graphics 绘制：圆形气球 + 绳子 + 高光
   * 气球跟随玩家 X，从屏幕底部飘上来
   * 托住玩家后，玩家重力关闭，可左右自由移动
   * 3 秒后气球飘走（向上消失），重力恢复
   */
  _rescueWithBalloon() {
    // 立刻开启无敌，防止气球飘起途中被敌人碰到
    this.isInvincible = true;

    // 把玩家传送到当前 X、屏幕底部外，准备被气球托起
    const rescueX = Phaser.Math.Clamp(this.player.x, 60, this.WORLD_WIDTH - 60);
    const startY  = this.H + 40;
    const floatY  = this.H * 0.45; // 气球托起后悬停的高度

    this.player.setPosition(rescueX, startY);
    this.player.setVelocity(0, 0);
    this.player.body.setGravityY(-this.physics.world.gravity.y); // 抵消重力
    this.player.setVisible(true);

    // ── 绘制气球 ──────────────────────────────────────────
    const balloon = this.add.graphics();
    const drawBalloon = (x, y) => {
      balloon.clear();
      // 绳子
      balloon.lineStyle(2, 0xdddddd, 1);
      balloon.beginPath();
      balloon.moveTo(x, y);
      balloon.lineTo(x, y + 36);
      balloon.strokePath();
      // 气球主体
      balloon.fillStyle(0xff3366, 1);
      balloon.fillCircle(x, y, 18);
      // 高光
      balloon.fillStyle(0xff99bb, 0.6);
      balloon.fillCircle(x - 6, y - 6, 7);
      // 气球底部小尖
      balloon.fillStyle(0xff3366, 1);
      balloon.fillTriangle(x - 4, y + 16, x + 4, y + 16, x, y + 22);
    };

    // 气球初始位置：玩家正上方
    let balloonX = rescueX;
    let balloonY = startY - 50;
    drawBalloon(balloonX, balloonY);

    // ── 阶段1：气球飘上来（tween 到 floatY）─────────────
    const FLOAT_DURATION = 3000; // 悬浮时间（毫秒）

    this.tweens.add({
      targets: { val: balloonY },
      val: floatY - 50,
      duration: 800,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        balloonY = tween.targets[0].val;
        balloonX = this.player.x;
        // 玩家跟着气球上升
        this.player.setY(balloonY + 50);
        drawBalloon(balloonX, balloonY);
      },
      onComplete: () => {
        // ── 阶段2：悬浮，玩家可左右移动 ────────────────
        this.player.setY(floatY);
        this.isBalloonRescue = true;

        // 倒计时提示：屏幕中央显示 "🎈 3...2...1..."
        const hint = this.add.text(
          this.cameras.main.scrollX + this.scale.width / 2,
          floatY - 60,
          '🎈', { fontSize: '32px' }
        ).setOrigin(0.5);

        let countdown = 3;
        const countTimer = this.time.addEvent({
          delay: 1000,
          repeat: 2,
          callback: () => {
            countdown--;
            if (countdown > 0) {
              hint.setText('🎈 ' + countdown);
              // 气球轻微摇晃
              this.tweens.add({
                targets: { dx: 0 },
                dx: 8,
                duration: 150,
                yoyo: true,
                repeat: 1,
                onUpdate: (t) => {
                  balloonX = this.player.x + t.targets[0].dx;
                  drawBalloon(balloonX, balloonY);
                }
              });
            }
          }
        });

        // ── 阶段3：FLOAT_DURATION 后气球飘走 ────────────
        this.time.delayedCall(FLOAT_DURATION, () => {
          this.isBalloonRescue = false;
          hint.destroy();
          countTimer.remove();

          // 气球向上飘走
          this.tweens.add({
            targets: { val: balloonY },
            val: -100,
            duration: 600,
            ease: 'Sine.easeIn',
            onUpdate: (tween) => {
              balloonY = tween.targets[0].val;
              drawBalloon(this.player.x, balloonY);
            },
            onComplete: () => {
              balloon.destroy();
            }
          });

          // 恢复重力，玩家正常下落
          this.player.body.setGravityY(0);

          // 无敌保护持续到落地后再多 1 秒
          this.time.delayedCall(1200, () => {
            this.isInvincible = false;
            this.player.setVisible(true);
          });

          // 落地期间玩家闪烁提示
          const flashCount = 10;
          this.time.addEvent({
            delay: 100,
            repeat: flashCount,
            callback: () => { this.player.setVisible(!this.player.visible); }
          });
        });
      }
    });
  }
}