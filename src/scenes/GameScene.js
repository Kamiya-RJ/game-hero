import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Flag from '../objects/Flag.js';
import Castle from '../objects/Castle.js';
import { GROUND_HEIGHT, WORLD_WIDTH_MULTIPLIER, PLAYER_HEIGHT } from '../constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.spritesheet('idle', 'assets/Dude_Monster/Dude_Monster_Idle_4.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('run',  'assets/Dude_Monster/Dude_Monster_Run_6.png',  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('jump', 'assets/Dude_Monster/Dude_Monster_Jump_8.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const WORLD_WIDTH = W * WORLD_WIDTH_MULTIPLIER;

    // --- 世界边界 ---
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, H);

    // --- 纹理 ---
    this.createTextures(WORLD_WIDTH);

    // --- Ground ---
    this.platforms = this.physics.add.staticGroup();
    const ground = this.platforms.create(WORLD_WIDTH / 2, H - GROUND_HEIGHT / 2, 'ground');
    ground.setDisplaySize(WORLD_WIDTH, GROUND_HEIGHT);
    ground.refreshBody();

    // --- 浮动平台 ---
    const platformData = [
      { x: W * 0.2,  y: H - 150 },
      { x: W * 0.5,  y: H - 250 },
      { x: W * 0.75, y: H - 180 },
      { x: W * 0.4,  y: H - 380 },
    ];

    platformData.forEach(({ x, y }) => {
      const p = this.platforms.create(x, y, 'platform');
      p.refreshBody();
    });

    // --- Player ---
    this.player = new Player(this, 100, H - GROUND_HEIGHT - PLAYER_HEIGHT / 2);

    // --- Collider ---
    this.physics.add.collider(this.player, this.platforms);

    // --- 摄像机 ---
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // --- 世界中点旗子和城堡 ---
    const midX = WORLD_WIDTH / 2;
    const groundY = H - GROUND_HEIGHT;
    
    this.flag = new Flag(this, midX - 200, groundY);
    this.castle = new Castle(this, WORLD_WIDTH - 100, groundY);
    
    // --- 进入城门触发关卡完成 ---
    this.physics.add.overlap(
      this.player,
      this.castle.zone,
      () => {
        this.scene.start('WinScene');
      }
    );

    // --- Keyboard ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cursors.ctrl = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    
  }

  createTextures(WORLD_WIDTH) {
    // 平台纹理
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x228B22, 1);
    g.fillRect(0, 0, 150, 20);
    g.generateTexture('platform', 150, 20);
    g.destroy();

    // 地面纹理
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x228B22, 1);
    g2.fillRect(0, 0, WORLD_WIDTH, GROUND_HEIGHT);
    g2.generateTexture('ground', WORLD_WIDTH, GROUND_HEIGHT);
    g2.destroy();
  }

  update() {
    this.player.update(this.cursors);
  }
}