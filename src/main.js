import './style.css';
import Phaser from 'phaser';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#5c94fc',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

let player;
let cursors;
let platforms;

const PLAYER_SCALE = 2;
const PLAYER_WIDTH = 32 * PLAYER_SCALE;
const PLAYER_HEIGHT = 32 * PLAYER_SCALE;
const GROUND_HEIGHT = 32;

function preload() {
  this.load.spritesheet('idle', 'assets/Dude_Monster/Dude_Monster_Idle_4.png', { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('run',  'assets/Dude_Monster/Dude_Monster_Run_6.png',  { frameWidth: 32, frameHeight: 32 });
  this.load.spritesheet('jump', 'assets/Dude_Monster/Dude_Monster_Jump_8.png', { frameWidth: 32, frameHeight: 32 });

  // 创建绿色平台纹理
  const g = this.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x228B22, 1);
  g.fillRect(0, 0, 150, 20);
  g.generateTexture('platform', 150, 20);
  g.destroy();

  // 创建绿色地面纹理
  const g2 = this.make.graphics({ x: 0, y: 0, add: false });
  g2.fillStyle(0x228B22, 1);
  g2.fillRect(0, 0, window.innerWidth, GROUND_HEIGHT);
  g2.generateTexture('ground', window.innerWidth, GROUND_HEIGHT);
  g2.destroy();
}

function create() {
  const W = this.scale.width;
  const H = this.scale.height;

  // --- Ground ---
  platforms = this.physics.add.staticGroup();
  const ground = platforms.create(W / 2, H - GROUND_HEIGHT / 2, 'ground');
  ground.setDisplaySize(W, GROUND_HEIGHT);
  ground.setTint(0x228B22);
  ground.refreshBody();

  // --- 浮动平台 ---
  const platformData = [
    { x: W * 0.2,  y: H - 150 },
    { x: W * 0.5,  y: H - 250 },
    { x: W * 0.75, y: H - 180 },
    { x: W * 0.4,  y: H - 380 },
  ];

  platformData.forEach(({ x, y }) => {
    const p = platforms.create(x, y, 'platform');
    p.setDisplaySize(150, 20);
    p.setTint(0x228B22);
    p.refreshBody();
  });

  // --- Player ---
  player = this.physics.add.sprite(100, H - GROUND_HEIGHT - PLAYER_HEIGHT / 2, 'idle');
  player.setScale(PLAYER_SCALE);
  player.setCollideWorldBounds(true);

  // --- Animations ---
  this.anims.create({
    key: 'anim_idle',
    frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
  });

  this.anims.create({
    key: 'anim_run',
    frames: this.anims.generateFrameNumbers('run', { start: 0, end: 5 }),
    frameRate: 12,
    repeat: -1
  });

  this.anims.create({
    key: 'anim_jump',
    frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 7 }),
    frameRate: 12,
    repeat: 0
  });

  player.play('anim_idle');

  // --- Collider ---
  this.physics.add.collider(player, platforms);

  // --- Keyboard ---
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  const onGround = player.body.blocked.down;

  // Left / Right
  if (cursors.left.isDown) {
    player.setVelocityX(-250);
    player.setFlipX(true);
    if (onGround) player.play('anim_run', true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(250);
    player.setFlipX(false);
    if (onGround) player.play('anim_run', true);
  } else {
    player.setVelocityX(0);
    if (onGround) player.play('anim_idle', true);
  }

  // Jump
  if (Phaser.Input.Keyboard.JustDown(cursors.space) && onGround) {
    player.setVelocityY(-600);
    player.play('anim_jump', true);
  }
}