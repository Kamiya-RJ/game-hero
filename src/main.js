import './style.css';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import WinScene from './scenes/WinScene.js';


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
  scene: [GameScene, WinScene]
};

new Phaser.Game(config);