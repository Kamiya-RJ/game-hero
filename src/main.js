import './style.css';
import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import WinScene from './scenes/WinScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import LevelClearScene from './scenes/LevelClearScene.js';
import { GRAVITY } from './constants.js';


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
    arcade: { gravity: { y: GRAVITY }, debug: false }
  },

  scene: [MenuScene, GameScene, LevelClearScene, WinScene, GameOverScene]
};

new Phaser.Game(config);