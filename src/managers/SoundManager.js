/**
 * 音效管理器
 * 目前使用 Web Audio API 生成合成音效
 * 以后替换成真实音效文件只需修改此文件
 *
 * 替换方法：
 * 1. 在 GameScene.preload() 里加载音效文件
 *    this.load.audio('coin', 'assets/sounds/coin.wav');
 * 2. 把对应方法改成：
 *    this.scene.sound.play('coin');
 */
export default class SoundManager {
  constructor(scene) {
    this.scene = scene;

    // 创建 Web Audio Context
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  /**
   * 底层合成音效方法
   * @param {number} frequency  音调（Hz）
   * @param {string} type       波形类型：sine / square / sawtooth / triangle
   * @param {number} duration   持续时间（秒）
   * @param {number} volume     音量 0~1
   * @param {string} shape      音量包络：'decay'（衰减）| 'blip'（短促）| 'rise'（上升）
   */
  playTone(frequency, type = 'square', duration = 0.1, volume = 0.3, shape = 'decay') {
    const ctx = this.audioCtx;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // 音量包络
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    if (shape === 'decay') {
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    } else if (shape === 'blip') {
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 0.5);
    } else if (shape === 'rise') {
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + duration * 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  /**
   * 收集金币音效
   * 两个快速上升音调
   */
  playCoin() {
    this.playTone(880, 'sine', 0.1, 0.3, 'blip');
    setTimeout(() => this.playTone(1320, 'sine', 0.15, 0.3, 'decay'), 80);
  }

  /**
   * 跳跃音效
   * 上升的音调
   */
  playJump() {
    const ctx = this.audioCtx;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  /**
   * 踩敌人音效
   * 低沉的撞击声
   */
  playStomp() {
    this.playTone(150, 'square', 0.1, 0.4, 'decay');
    setTimeout(() => this.playTone(80, 'sawtooth', 0.15, 0.3, 'decay'), 50);
  }

  /**
   * 受伤音效
   * 下降的音调
   */
  playHurt() {
    const ctx = this.audioCtx;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  /**
   * 关卡完成音效
   * 欢快的上升音阶
   */
  playWin() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.4, 'decay'), i * 150);
    });
  }

  /**
   * 游戏结束音效
   * 下降的悲伤音阶
   */
  playGameOver() {
    const notes = [392, 330, 294, 262]; // G4 E4 D4 C4
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.3, 0.3, 'decay'), i * 200);
    });
  }
}