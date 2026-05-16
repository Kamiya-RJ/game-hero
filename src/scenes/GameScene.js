import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Flag from '../objects/Flag.js';
import Castle from '../objects/Castle.js';
import Coin from '../objects/Coin.js';
import Slime from '../entities/Slime.js';
import {
  GRAVITY, GROUND_HEIGHT, WORLD_WIDTH_MULTIPLIER, PLAYER_HEIGHT, PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY, PLAYER_INITIAL_LIVES, PLATFORM_HEIGHT, PLATFORM_WIDTH
} from '../constants.js';



export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * 预加载所有游戏资源
   * 包括角色动画帧和金币动画帧
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
  }

  /**
   * 生成地面和平台的纹理
   * 用 Graphics 绘制纯色矩形并转成纹理，供后续 create 使用
   */
  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x228B22, 1);
    g.fillRect(0, 0, 150, 20);
    g.generateTexture('platform', 150, 20);
    g.destroy();

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
   * 创建所有金币
   * 包括三种类型：
   * - 平台上方金币：每个平台正上方
   * - 空中金币：需要从地面或平台大跳才能触到
   * - 抛物线金币：从最后平台右边缘跳起，沿跳跃轨迹排列
   */
  createCoins() {
    const { W, H } = this;

    // 注册金币旋转动画
    this.anims.create({
      key: 'coin_spin',
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: -1
    });

    // 创建金币物理组，关闭重力和移动
    this.coins = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // 平台上方金币
    this.platformData.forEach(({ x, y }) => {
      this.coins.add(new Coin(this, x, y - 40));
    });

    // 空中金币
    const airCoinData = [
      { x: W * 0.35, y: H - 270 },  // 从地面大跳
      { x: W * 0.75, y: H - 520 },  // 从平台大跳
      { x: W * 1.15, y: H - 420 },  // 从平台大跳
      { x: W * 1.65, y: H - 260 },  // 从地面大跳
      { x: W * 2.25, y: H - 430 },  // 从平台大跳
      { x: W * 2.95, y: H - 440 },  // 从平台大跳
    ];

    airCoinData.forEach(({ x, y }) => {
      this.coins.add(new Coin(this, x, y));
    });

    // 抛物线金币，自动取最后一个平台的坐标
    const lastPlatform = this.platformData[this.platformData.length - 1];
    this.spawnArcCoins(
      lastPlatform.x + 75,
      lastPlatform.y,
      PLAYER_SPEED,
      PLAYER_JUMP_VELOCITY,
      GRAVITY,
      7,
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
   * 创建敌人
   * 在部分平台上放置史莱姆
   */
  createEnemies() {
    // 注册史莱姆动画
    this.anims.create({
      key: 'slime_run',
      frames: this.anims.generateFrameNumbers('slime_run', { start: 0, end: 9 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'slime_hit',
      frames: this.anims.generateFrameNumbers('slime_hit', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: 0
    });

    // 在部分平台上放敌人
    this.enemies = this.physics.add.group();
    const enemyPlatforms = [1, 3, 5, 7, 9]; // platformData 的索引
    enemyPlatforms.forEach(i => {
      const { x, y } = this.platformData[i];
      console.log(`平台${i}: x=${x}, y=${y}, 敌人y=${y - 20}`);
      const slime = new Slime(this, x, y - PLATFORM_HEIGHT / 2 - 20);
      this.enemies.add(slime);
    });

  }

  /**
   * 创建生命值 HUD
   * 显示3个爱心在屏幕右上角
   */
  createLives() {
    this.lives = PLAYER_INITIAL_LIVES;
    this.livesText = this.add.text(this.scale.width - 16, 16, `❤️ x${this.lives}`, {
      fontSize: '24px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0).setScrollFactor(0);
  }

  /**
   * 创建场景装饰物
   * 包括世界中点的旗子和终点城堡
   */
  createDecorations() {
    const { WORLD_WIDTH, H } = this;
    const groundY = H - GROUND_HEIGHT;
    this.flag = new Flag(this, WORLD_WIDTH / 2 - 200, groundY);
    this.castle = new Castle(this, WORLD_WIDTH - 100, groundY);
  }

  /**
   * 注册所有物理碰撞和重叠检测
   * - 玩家与平台：碰撞
   * - 玩家与金币：重叠触发计分
   * - 玩家与城门：重叠触发关卡完成
   */
  createColliders() {
    this.physics.add.collider(this.player, this.platforms);
    // 敌人与平台碰撞
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.player, this.coins, (player, coin) => {
      coin.destroy();
      this.score += 10;
      this.scoreText.setText('Score: ' + this.score);
    });

    this.physics.add.overlap(this.player, this.castle.zone, () => {
      this.scene.start('WinScene');
    });

    // 玩家踩敌人（从上方）
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      // 确保敌人还活着（在平台上）
      if (!enemy.active) return;

      if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
        enemy.die(this);
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
        player.setVelocityY(-400); // 踩敌人后弹起
      } else {
        this.hitByEnemy();
      }
    });
  }


  /**
   * 玩家被敌人碰到
   * 扣一条命，归零则跳转 GameOver
   */
  hitByEnemy() {
    this.lives -= 1;
    this.livesText.setText('❤️ x' + this.lives);

    // 短暂无敌闪烁
    this.player.setTint(0xff0000);
    this.time.delayedCall(1000, () => {
      this.player.clearTint();
    });

    if (this.lives <= 0) {
      this.scene.start('GameOverScene');
    }
  }


  /**
   * 设置摄像机跟随玩家
   * 限制摄像机在世界边界内移动
   */
  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  /**
   * 创建 HUD 界面
   * 包括固定在屏幕左上角的分数显示
   */
  createHUD() {
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setScrollFactor(0);
  }

  /**
   * 注册键盘输入
   * 包括方向键、空格跳跃、Ctrl 加速
   */
  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cursors.ctrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
  }

  /**
   * 沿抛物线轨迹生成一串金币
   * 根据物理公式计算每个金币的位置：
   * x(t) = startX + vx * t
   * y(t) = startY + vy * t + 0.5 * gravity * t²
   * @param {number} startX   起跳点 X
   * @param {number} startY   起跳点 Y
   * @param {number} vx       水平速度
   * @param {number} vy       跳跃初速度（负数向上）
   * @param {number} gravity  重力加速度
   * @param {number} count    金币数量
   * @param {number} interval 时间间隔（秒）
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
   * 将键盘输入传给玩家处理
   * 更新所有敌人状态（移动和动画）
   */
  update() {
    this.player.update(this.cursors);

    this.enemies.getChildren().forEach(enemy => enemy.update());
  }

}