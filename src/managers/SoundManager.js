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
   * 内部：调度一整轮 BGM，结束前自动触发下一轮循环
   *
   * ╔══════════════════════════════════════════════════════╗
   * ║  曲目结构（AABCA'B'C' 形式，约 15.5 秒一循环）        ║
   * ║  A  段：主题句    — 活泼上行，建立角色               ║
   * ║  A  段：主题重复  — 加入颤音装饰                     ║
   * ║  B  段：副歌      — 情绪推高，大跳音程               ║
   * ║  C  段：桥接句    — 小调色彩，短暂转暗               ║
   * ║  A' 段：主题变奏  — 高八度，节奏加密                 ║
   * ║  B' 段：副歌强化  — 和声加厚，力度最强               ║
   * ║  C' 段：尾句      — 下行解决，引回循环               ║
   * ╚══════════════════════════════════════════════════════╝
   *
   * 音符格式：[频率Hz, 时值秒]，0 = 休止符
   *
   * 四层音色：
   *   旋律层   square   — 主旋律，芯片经典音色
   *   和声层   sine     — 旋律三度上方，柔和加厚
   *   低音层   triangle — 分解和弦托底
   *   打击层   sawtooth — 模拟底鼓 + 踩镲节奏
   */
  _scheduleBGM() {
    if (!this.bgmPlaying) return;

    const ctx = this.audioCtx;
    const q = 0.125;  // 十六分音符时值（秒），BPM=120
    const e = q * 2;  // 八分音符
    const h = q * 4;  // 四分音符（一拍）
    const dh = q * 6; // 附点四分音符

    // ── 旋律各段 ──────────────────────────────────────────
    // A段：主题句（C大调，欢快上行跳跃）
    const A = [
      [523, e], [659, e], [784, e], [880, h],
      [784, e], [659, q], [523, q], [0,   e],
      [659, e], [784, e], [880, e], [1047,h],
      [880, e], [784, e], [659, e], [523, h], [0, e],
    ];

    // A段重复（加入短促颤音：快速交替相邻音）
    const A2 = [
      [523, e], [659, e], [784, e], [880, h],
      [784, q], [880, q], [784, e], [659, q], [0, q],
      [659, e], [784, e], [880, e], [1047,h],
      [1047,q],[880, q], [784, e], [523, h], [0, e],
    ];

    // B段：副歌（情绪高涨，大跳+附点节奏）
    const B = [
      [1047,e], [784, e], [880, dh],[659, q],
      [784, e], [523, e], [659, dh],[440, q],
      [523, e], [659, e], [784, e], [880, e], [1047,h],
      [880, e], [1047,e],[784, e], [659, h], [0,   e],
    ];

    // C段：桥接（降A大调色彩，情绪转暗）
    const C = [
      [415, e], [523, e], [622, e], [740, h],
      [622, e], [523, e], [466, e], [415, h], [0, e],
      [466, e], [523, e], [587, e], [659, h],
      [587, e], [523, e], [494, e], [523, h], [0, e],
    ];

    // A'段：主题高八度变奏（节奏加密，十六分音符点缀）
    const A3 = [
      [1047,e],[1319,e],[1568,q],[1319,q],[1047,e],[0, q],
      [1319,q],[1047,q],[880, e],[784, e],[880, q],[0, q],
      [1047,e],[880, e],[784, q],[659, q],[784, e],[880, e],
      [1047,h],[880, e],[784, e],[659, h],[0,    e],
    ];

    // B'段：副歌强化（旋律同B，力度最强）
    const B2 = B.map(([f, d]) => [f, d]); // 结构相同，由和声层加厚区分

    // C'段：尾句（下行解决，引回A循环）
    const Cend = [
      [784, e], [659, e], [587, e], [523, h],
      [494, e], [440, e], [392, e], [349, h], [0, e],
      [392, e], [440, e], [494, e], [523, e], [659, h],
      [784, h], [523, h], [0,   h],
    ];

    const melody = [...A, ...A2, ...B, ...C, ...A3, ...B2, ...Cend];
    const totalDur = melody.reduce((s, [, d]) => s + d, 0);

    // ── 和声层（旋律三度上方，只跟主题段） ───────────────
    const harmonyMelody = [...A, ...A2].map(([f, d]) => {
      if (f === 0) return [0, d];
      return [f * 1.2599, d]; // 小三度（×2^(4/12)）
    });

    // ── 低音和弦表（每段对应的根音循环） ─────────────────
    // 格式：[根音Hz, 时值秒]，循环铺满对应段落
    const bassMap = [
      // A×2：C - G - Am - F 循环
      { dur: [...A, ...A2].reduce((s,[,d])=>s+d,0), pattern: [[130.81,h],[196.00,h],[110.00,h],[174.61,h]] },
      // B×2：F - G - C - Am
      { dur: [...B, ...B2].reduce((s,[,d])=>s+d,0),  pattern: [[174.61,h],[196.00,h],[130.81,h],[110.00,h]] },
      // C：Fm - C - G - C
      { dur: C.reduce((s,[,d])=>s+d,0),              pattern: [[103.83,h],[130.81,h],[196.00,h],[130.81,h]] },
      // A'：C - Am - F - G
      { dur: A3.reduce((s,[,d])=>s+d,0),             pattern: [[130.81,h],[110.00,h],[174.61,h],[196.00,h]] },
      // C'：Am - F - C - G - C
      { dur: Cend.reduce((s,[,d])=>s+d,0),           pattern: [[110.00,h],[174.61,h],[130.81,h],[196.00,h],[130.81,h]] },
    ];

    // ── 开始调度 ──────────────────────────────────────────
    const T = ctx.currentTime + 0.02;
    this._bgmNodes = [];

    // 辅助：生成一个振荡器节点并返回（自动推入 _bgmNodes）
    const makeOsc = (type, freq, vol, startT, endT, freqRamp) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startT);
      if (freqRamp) osc.frequency.exponentialRampToValueAtTime(freqRamp[0], startT + freqRamp[1]);
      gain.gain.setValueAtTime(vol, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, endT);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(endT + 0.01);
      this._bgmNodes.push(osc);
    };

    // 1. 旋律层（square，短促衰减，留 20% 间隙）
    let t = T;
    melody.forEach(([freq, dur]) => {
      if (freq !== 0) makeOsc('square', freq, 0.08, t, t + dur * 0.8);
      t += dur;
    });

    // 2. 和声层（sine，仅 A+A2 段，音量柔和）
    let ht = T;
    harmonyMelody.forEach(([freq, dur]) => {
      if (freq !== 0) makeOsc('sine', freq, 0.03, ht, ht + dur * 0.75);
      ht += dur;
    });

    // 3. 低音层（triangle，分解根音+五音交替）
    let bt = T;
    bassMap.forEach(({ dur: segDur, pattern }) => {
      const segEnd = bt + segDur;
      let pi = 0;
      let cursor = bt;
      while (cursor < segEnd - 0.01) {
        const [rootFreq, beatDur] = pattern[pi % pattern.length];
        const fifth = rootFreq * 1.498; // 纯五度
        const remaining = segEnd - cursor;
        if (remaining < 0.05) break;
        const d = Math.min(beatDur, remaining);
        // 根音
        makeOsc('triangle', rootFreq, 0.05, cursor, cursor + d * 0.85);
        // 五音（半拍后，若剩余时间足够）
        if (d > e + 0.01) {
          makeOsc('triangle', fifth, 0.03, cursor + d * 0.5, cursor + d * 0.9);
        }
        cursor += d;
        pi++;
      }
      bt += segDur;
    });

    // 4. 打击节奏层
    //    底鼓（低频 sawtooth 下扫）：每四分音符一次
    //    踩镲（高频 sine 极短）：每八分音符弱拍
    let dt = T;
    while (dt < T + totalDur) {
      // 底鼓
      makeOsc('sawtooth', 100, 0.07, dt, dt + 0.07, [30, 0.06]);
      // 踩镲（弱拍，错开半拍）
      if (dt + h < T + totalDur) {
        makeOsc('sine', 6000, 0.02, dt + h, dt + h + 0.03);
      }
      dt += h * 2; // 每两拍循环
    }

    // 提前 120ms 调度下一轮，确保无缝循环
    this._bgmTimeout = setTimeout(
      () => this._scheduleBGM(),
      (totalDur - 0.12) * 1000
    );
  }
}