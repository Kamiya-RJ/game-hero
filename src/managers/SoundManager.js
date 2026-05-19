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

  /**
   * 播放背景音乐
   * 欢快的 C 大调芯片风旋律，自动循环
   * 旋律层用 square 波，低音层用 triangle 波
   *
   * 浏览器自动播放策略：AudioContext 在用户交互前处于 suspended 状态
   * 先尝试 resume，若仍被挂起则监听首次按键/点击后再启动
   */
  playBGM() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this._bgmNodes = [];

    const tryStart = () => {
      if (this.audioCtx.state === 'running') {
        this._scheduleBGM();
        return;
      }
      this.audioCtx.resume().then(() => {
        if (this.bgmPlaying) this._scheduleBGM();
      });
    };

    if (this.audioCtx.state === 'running') {
      tryStart();
    } else {
      // 等待首次用户交互（键盘或鼠标）来解锁 AudioContext
      const unlock = () => {
        document.removeEventListener('keydown', unlock);
        document.removeEventListener('pointerdown', unlock);
        tryStart();
      };
      document.addEventListener('keydown', unlock, { once: true });
      document.addEventListener('pointerdown', unlock, { once: true });
    }
  }

  /**
   * 停止背景音乐
   * 清除所有已调度的振荡器和定时器
   */
  stopBGM() {
    this.bgmPlaying = false;
    if (this._bgmTimeout) {
      clearTimeout(this._bgmTimeout);
      this._bgmTimeout = null;
    }
    if (this._bgmNodes) {
      this._bgmNodes.forEach(n => { try { n.stop(); } catch (e) {} });
      this._bgmNodes = [];
    }
  }

  /**
   * 内部：调度一轮 BGM 旋律，结束前自动触发下一轮循环
   *
   * 旋律序列：[频率Hz, 时值秒]
   * 低音序列与旋律同步铺底，循环填满整段时值
   */
  _scheduleBGM() {
    if (!this.bgmPlaying) return;

    const ctx = this.audioCtx;

    // 旋律：C 大调跳跃短句，约 2.85 秒一循环
    const melody = [
      [523.25, 0.15], [659.25, 0.15], [783.99, 0.15], [1046.50, 0.20],
      [783.99, 0.10], [880.00, 0.15], [783.99, 0.15], [659.25, 0.20],
      [523.25, 0.15], [440.00, 0.15], [392.00, 0.15], [349.23, 0.20],
      [392.00, 0.10], [440.00, 0.15], [523.25, 0.15], [659.25, 0.30],
    ];

    // 低音：每 0.30s 一拍，填满旋律总长度
    const bassPattern = [
      [130.81, 0.30], [164.81, 0.30], [196.00, 0.30], [164.81, 0.30],
    ];

    const startTime = ctx.currentTime + 0.02; // 微小偏移避免爆音
    this._bgmNodes = [];

    // 播放旋律层
    let t = startTime;
    melody.forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      this._bgmNodes.push(osc);
      t += dur;
    });

    const totalDur = melody.reduce((sum, [, d]) => sum + d, 0);

    // 播放低音层（循环填满旋律时长）
    let bt = startTime;
    const bassEnd = startTime + totalDur;
    let bi = 0;
    while (bt < bassEnd) {
      const [freq, dur] = bassPattern[bi % bassPattern.length];
      const actualDur = Math.min(dur, bassEnd - bt);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, bt);
      gain.gain.setValueAtTime(0.04, bt);
      gain.gain.exponentialRampToValueAtTime(0.001, bt + actualDur * 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(bt);
      osc.stop(bt + actualDur);
      this._bgmNodes.push(osc);
      bt += dur;
      bi++;
    }

    // 提前 80ms 调度下一轮，确保无缝循环
    this._bgmTimeout = setTimeout(
      () => this._scheduleBGM(),
      (totalDur - 0.08) * 1000
    );
  }
}