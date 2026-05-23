/**
 * 音效管理器
 * 使用 Web Audio API 生成合成音效与背景音乐
 * 后续替换真实音频文件只需修改此文件
 *
 * 背景音乐根据关卡主题自动切换：
 *   grassland — 魂斗罗式军队进行曲（原版，保留）
 *   cave      — 低沉洞穴回声，神秘氛围
 *   snow      — 清脆雪地旋律，空灵感
 *   lava      — 快节奏紧迫旋律，压迫感
 */
export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
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
    if (ctx.state === 'suspended') ctx.resume();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

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

  // ──────────── 音效方法（不变）────────────
  playCoin() {
    this.playTone(880, 'sine', 0.1, 0.3, 'blip');
    setTimeout(() => this.playTone(1320, 'sine', 0.15, 0.3, 'decay'), 80);
  }

  playJump() {
    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
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

  playStomp() {
    this.playTone(150, 'square', 0.1, 0.4, 'decay');
    setTimeout(() => this.playTone(80, 'sawtooth', 0.15, 0.3, 'decay'), 50);
  }

  playHurt() {
    const ctx = this.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
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

  playWin() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.4, 'decay'), i * 150);
    });
  }

  playGameOver() {
    const notes = [392, 330, 294, 262]; // G4 E4 D4 C4
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.3, 0.3, 'decay'), i * 200);
    });
  }

  // ──────────── 背景音乐系统 ────────────

  /**
   * 播放背景音乐（根据关卡主题自动切换）
   * @param {string} theme 关卡主题：grassland / cave / snow / lava
   */
  playBGM(theme = 'grassland') {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this._bgmNodes = [];
    this._bgmTheme = theme; // 记录当前主题以便循环时重新调度

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
   */
  stopBGM() {
    this.bgmPlaying = false;
    if (this._bgmTimeout) {
      clearTimeout(this._bgmTimeout);
      this._bgmTimeout = null;
    }
    if (this._bgmNodes) {
      this._bgmNodes.forEach(n => { try { n.stop(); } catch (e) { } });
      this._bgmNodes = [];
    }
  }

  /**
   * 内部调度：根据当前主题选择对应的音乐生成函数
   */
  _scheduleBGM() {
    if (!this.bgmPlaying) return;
    switch (this._bgmTheme) {
      case 'cave': this._scheduleCaveBGM(); break;
      case 'snow': this._scheduleSnowBGM(); break;
      case 'lava': this._scheduleLavaBGM(); break;
      default: this._scheduleGrasslandBGM(); break;
    }
  }

  // ═══════════════════════════════════════════════
  // 草原（第1关）— 原版魂斗罗式进行曲
  // ═══════════════════════════════════════════════
  /**
   * 内部：调度一整轮 BGM，结束前自动触发下一轮循环
   *
   * ╔══════════════════════════════════════════════════════╗
   * ║  风格：魂斗罗式军队进行曲，D大调，BPM=160            ║
   * ║  曲目结构（约 28 秒一循环）                          ║
   * ║  Intro — 鼓点引入，铺垫进场感                       ║
   * ║  A     — 主题句：D大调进行曲旋律，刚劲上行           ║
   * ║  A'    — 主题重复：切分装饰，节奏更紧               ║
   * ║  B     — 副歌：高音区大跳，英雄感                   ║
   * ║  C     — 过渡句：半音阶下行序列，蓄力               ║
   * ║  A''   — 主题高八度：冲刺感，最强力度               ║
   * ║  Outro — 收尾回落，无缝引回 Intro                   ║
   * ╚══════════════════════════════════════════════════════╝
   *
   * 音符格式：[频率Hz, 时值秒]，0 = 休止符
   *
   * 四层音色：
   *   主旋律层   square   — NES 经典芯片音色
   *   对位声部   triangle — B段+A''段三度下方，加厚和声
   *   低音线     triangle — 进行曲步伐律动（强-弱-强-弱）
   *   打击层     sawtooth — 底鼓 + 军鼓 snare + 踩镲
   */
  _scheduleGrasslandBGM() {
    if (!this.bgmPlaying) return;

    const ctx = this.audioCtx;

    // ── 节拍单位（BPM=160，军队进行曲节奏）────────────────
    const s = 60 / 160;        // 一拍（秒）
    const q = s / 2;           // 八分音符
    const qq = s / 4;           // 十六分音符
    const h = s;               // 四分音符（一拍）
    const dh = s * 1.5;         // 附点四分
    const W = s * 2;           // 二分音符

    // ── 音符频率常量（D大调，NES 魂斗罗风格）──────────────
    // D大调：D E F# G A B C# D
    const D4 = 293.66, E4 = 329.63, Fs4 = 369.99, G4 = 392.00,
      A4 = 440.00, B4 = 493.88, Cs5 = 554.37,
      D5 = 587.33, E5 = 659.25, Fs5 = 739.99, G5 = 783.99,
      A5 = 880.00, B5 = 987.77, D6 = 1174.66,
      D3 = 146.83, LA3 = 220.00, G3 = 196.00, Fs3 = 184.99,
      E3 = 164.81, B3 = 246.94, Cs4 = 277.18;

    // ── 曲目结构 ────────────────────────────────────────────
    //  Intro  — 4拍鼓点引入，铺垫进场感
    //  A      — 主题句：D大调进行曲旋律，刚劲上行
    //  A'     — 主题重复：加切分装饰，节奏更紧
    //  B      — 副歌：大跳音程，英雄感爆棚
    //  C      — 过渡句：下行序列，蓄力
    //  A''    — 主题高八度：冲刺感，最强力度
    //  Outro  — 收尾回落，无缝引回 Intro

    const Intro = [
      // 4拍空旋律，让鼓点先建立节奏感
      [0, h], [0, h], [0, h], [0, h],
    ];

    const A = [
      // 主题句：刚劲的 D大调进行曲上行
      [D4, q], [D4, q], [A4, h], [A4, q], [G4, q],
      [Fs4, q], [E4, q], [D4, h], [0, h],

      [E4, q], [E4, q], [A4, h], [A4, q], [G4, q],
      [Fs4, q], [E4, q], [D4, dh], [0, q],

      // 第二句：跳跃感，五度大跳
      [D4, q], [Fs4, q], [A4, q], [D5, q], [Cs5, q], [B4, q], [A4, h],
      [G4, q], [A4, q], [B4, q], [A4, q], [G4, q], [Fs4, q], [E4, h],

      [D4, q], [Fs4, q], [A4, h], [D5, q], [Cs5, q],
      [B4, dh], [A4, q], [D5, W],
    ];

    const A2 = [
      // 主题重复：加切分，节奏更紧迫
      [D4, qq], [0, qq], [D4, q], [A4, h], [A4, q], [G4, q],
      [Fs4, q], [E4, q], [D4, h], [0, h],

      [E4, qq], [0, qq], [E4, q], [A4, h], [A4, q], [G4, q],
      [Fs4, q], [E4, q], [D4, dh], [0, q],

      [D4, q], [Fs4, q], [A4, q], [D5, qq], [Cs5, qq], [D5, q], [Cs5, q], [B4, q], [A4, h],
      [G4, q], [A4, q], [B4, q], [A4, q], [G4, qq], [Fs4, qq], [G4, q], [Fs4, h],

      [D4, q], [Fs4, q], [A4, h], [D5, q], [0, q],
      [B4, q], [A4, q], [Fs4, h], [D4, W],
    ];

    const B = [
      // 副歌：高音区大跳，英雄感
      [D5, h], [A5, h], [G5, q], [Fs5, q], [E5, q], [D5, q],
      [Cs5, dh], [B4, q], [A4, h], [0, h],

      [B4, q], [D5, q], [Fs5, h], [E5, q], [D5, q],
      [Cs5, q], [B4, q], [A4, dh], [0, q],

      // 副歌第二句：更强力
      [D5, q], [E5, q], [Fs5, q], [G5, q], [A5, h], [G5, q], [Fs5, q],
      [E5, q], [D5, q], [Cs5, q], [B4, q], [A4, W],

      [Fs4, q], [A4, q], [D5, h], [Fs5, q], [E5, q],
      [D5, dh], [Cs5, q], [D5, W],
    ];

    const C = [
      // 过渡句：下行序列蓄力，为高八度主题铺垫
      [A5, q], [G5, q], [Fs5, q], [E5, q], [D5, q], [Cs5, q], [B4, q], [A4, q],
      [G4, q], [Fs4, q], [E4, q], [D4, q], [Cs4, q], [B3, q], [LA3, q], [0, q],

      [D4, q], [E4, q], [Fs4, q], [G4, q], [A4, q], [B4, q], [Cs5, q], [D5, q],
      [E5, h], [Fs5, h], [G5, h], [0, h],
    ];

    const A3 = [
      // 主题高八度：冲刺感，最强力度
      [D5, qq], [0, qq], [D5, q], [A5, h], [A5, q], [G5, q],
      [Fs5, q], [E5, q], [D5, h], [0, h],

      [E5, qq], [0, qq], [E5, q], [A5, h], [G5, q], [Fs5, q],
      [E5, q], [D5, q], [Cs5, dh], [0, q],

      [D5, q], [Fs5, q], [A5, q], [D6, qq], [0, qq], [D6, q], [A5, q], [G5, q], [Fs5, h],
      [E5, q], [Fs5, q], [G5, q], [Fs5, q], [E5, q], [D5, q], [Cs5, h],

      [D5, q], [Fs5, q], [A5, h], [D6, q], [0, q],
      [B5, q], [A5, q], [Fs5, h], [D5, W],
    ];

    const Outro = [
      // 收尾：英雄姿态落地，引回循环
      [D5, h], [A4, h], [Fs4, h], [D4, h],
      [E4, q], [Fs4, q], [G4, q], [A4, q], [B4, q], [A4, q], [G4, q], [Fs4, q],
      [E4, dh], [D4, q], [D4, W],
    ];

    const melody = [...Intro, ...A, ...A2, ...B, ...C, ...A3, ...Outro];
    const totalDur = melody.reduce((s, [, d]) => s + d, 0);

    // ── 对位声部（NES 第二音轨，三度下方跟随）──────────────
    // 只跟 B段 和 A3段，制造和声厚度
    const counterSection = [...B, ...A3];
    const counterMelody = counterSection.map(([f, d]) => {
      if (f === 0) return [0, d];
      return [f * 0.7937, d]; // 小三度下方（÷2^(4/12)）
    });
    const counterOffset = [...Intro, ...A, ...A2].reduce((s, [, d]) => s + d, 0);

    // ── 低音線（进行曲特征：强-弱-强-弱 律动）──────────────
    // D大调低音：D - A - G - A 循环（强力进行曲步伐）
    const bassPattern = [
      [D3, h], [LA3, q], [0, q],   // 强拍
      [G3, h], [LA3, q], [0, q],   // 弱拍
    ];

    // ── 开始调度 ──────────────────────────────────────────
    const T = ctx.currentTime + 0.02;
    this._bgmNodes = [];

    const makeOsc = (type, freq, vol, startT, endT, freqRamp) => {
      const osc = ctx.createOscillator();
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

    // 1. 主旋律（square，NES 经典音色）
    let t = T;
    melody.forEach(([freq, dur]) => {
      if (freq !== 0) makeOsc('square', freq, 0.07, t, t + dur * 0.85);
      t += dur;
    });

    // 2. 对位声部（triangle，柔和三度，B段+A3段）
    let ct = T + counterOffset;
    counterMelody.forEach(([freq, dur]) => {
      if (freq !== 0) makeOsc('triangle', freq, 0.04, ct, ct + dur * 0.8);
      ct += dur;
    });

    // 3. 低音线（triangle，进行曲步伐律动）
    let bt = T;
    let bi = 0;
    while (bt < T + totalDur - 0.05) {
      const [freq, dur] = bassPattern[bi % bassPattern.length];
      if (freq !== 0 && bt + dur <= T + totalDur) {
        makeOsc('triangle', freq, 0.10, bt, bt + dur * 0.9);
        // 八度上方加厚
        makeOsc('triangle', freq * 2, 0.04, bt, bt + dur * 0.7);
      }
      bt += dur;
      bi++;
    }

    // 4. 打击节奏（进行曲：强力底鼓 + 军鼓 snare）
    let dt = T;
    while (dt < T + totalDur) {
      // 底鼓（每一拍）
      makeOsc('sawtooth', 150, 0.09, dt, dt + 0.07, [30, 0.065]);

      // 军鼓 snare（每两拍的第二拍，进行曲特征）
      if (dt + h < T + totalDur) {
        makeOsc('sawtooth', 300, 0.06, dt + h, dt + h + 0.04, [100, 0.035]);
        makeOsc('square', 6000, 0.025, dt + h, dt + h + 0.035);
      }

      // 踩镲（每半拍，轻）
      makeOsc('square', 8000, 0.012, dt + q, dt + q + 0.02);
      if (dt + h + q < T + totalDur)
        makeOsc('square', 8000, 0.012, dt + h + q, dt + h + q + 0.02);

      dt += W; // 每两拍一个完整节奏型
    }

    // 提前 120ms 调度下一轮
    this._bgmTimeout = setTimeout(
      () => this._scheduleBGM(),
      (totalDur - 0.12) * 1000
    );
  }

  // ═══════════════════════════════════════════════
  // 洞穴（第2关）— 低沉神秘，回声感
  // ═══════════════════════════════════════════════
  _scheduleCaveBGM() {
    if (!this.bgmPlaying) return;
    const ctx = this.audioCtx;
    const s = 0.5; // 慢节奏
    const q = s / 2;
    const h = s;

    // 洞穴旋律：E弗里几亚调式，低沉起伏
    const E3 = 164.81, G3 = 196.00, B3 = 246.94, E4 = 329.63, F4 = 349.23, A4 = 440.00, B4 = 493.88;
    const melody = [
      [E4, h], [0, q], [B3, q], [E4, h], [F4, q], [0, q], [E4, h], [B3, h],
      [E4, q], [G4, q], [A4, q], [B4, q], [A4, h], [G4, h], [E4, h], [0, h],
      [E4, h], [B3, q], [0, q], [E4, h], [F4, q], [0, q], [E4, h], [G4, h],
      [A4, h], [B4, q], [G4, q], [E4, h], [B3, h], [E4, h],
    ];

    const totalDur = melody.reduce((s, [, d]) => s + d, 0);
    const T = ctx.currentTime + 0.02;
    this._bgmNodes = [];

    const makeOsc = (type, freq, vol, startT, endT) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(vol, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, endT);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(endT + 0.01);
      this._bgmNodes.push(osc);
    };

    // 主旋律用 triangle + 轻微回声（延迟副本）
    let t = T;
    melody.forEach(([freq, dur]) => {
      if (freq !== 0) {
        makeOsc('triangle', freq, 0.06, t, t + dur * 0.9);
        // 回声：延迟 0.2s，低音量
        makeOsc('triangle', freq, 0.03, t + 0.2, t + dur * 0.7 + 0.2);
      }
      t += dur;
    });

    // 低音：缓慢的根音持续
    let bt = T;
    const bassNotes = [[E3, s * 2], [B3, s * 2], [G3, s * 2], [E3, s * 2]];
    let bi = 0;
    while (bt < T + totalDur) {
      const [f, d] = bassNotes[bi % bassNotes.length];
      makeOsc('sine', f, 0.08, bt, bt + d);
      bt += d;
      bi++;
    }

    // 打击：极简，类似水滴回声
    let dt = T;
    while (dt < T + totalDur) {
      makeOsc('sine', 1200, 0.03, dt, dt + 0.1); // 叮咚
      dt += s * 2;
    }

    this._bgmTimeout = setTimeout(() => this._scheduleBGM(), (totalDur - 0.12) * 1000);
  }

  // ═══════════════════════════════════════════════
  // 雪地（第3关）— 清脆空灵，跳跃感
  // ═══════════════════════════════════════════════
  _scheduleSnowBGM() {
    if (!this.bgmPlaying) return;
    const ctx = this.audioCtx;
    const s = 0.4; // 轻快
    const q = s / 2;
    const h = s;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880.00, C6 = 1046.5;
    const melody = [
      [E5, q], [0, q], [C5, q], [D5, q], [E5, h], [G5, q], [A5, q],
      [E5, h], [0, q], [C6, q], [D5, q], [C5, h], [D5, q], [0, q],
      [E5, q], [G5, q], [A5, q], [E5, q], [D5, q], [C5, h], [0, h],
      [C6, q], [A5, q], [G5, q], [E5, q], [D5, q], [C5, h], [C5, h],
    ];

    const totalDur = melody.reduce((s, [, d]) => s + d, 0);
    const T = ctx.currentTime + 0.02;
    this._bgmNodes = [];

    const makeOsc = (type, freq, vol, startT, endT) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(vol, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, endT);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(endT + 0.01);
      this._bgmNodes.push(osc);
    };

    // 主旋律：清脆 sine + 短促triangle点缀
    let t = T;
    melody.forEach(([freq, dur]) => {
      if (freq !== 0) {
        makeOsc('sine', freq, 0.08, t, t + dur * 0.8);
        makeOsc('triangle', freq * 2, 0.03, t, t + dur * 0.5);
      }
      t += dur;
    });

    // 低音：柔和 sustain
    let bt = T;
    const bass = [[C5 / 2, s * 2], [G5 / 2, s * 2], [A5 / 2, s * 2], [E5 / 2, s * 2]];
    let bi = 0;
    while (bt < T + totalDur) {
      const [f, d] = bass[bi % bass.length];
      makeOsc('sine', f, 0.06, bt, bt + d);
      bt += d;
      bi++;
    }

    // 打击：轻快叮铃声
    let dt = T;
    while (dt < T + totalDur) {
      makeOsc('sine', 1400, 0.02, dt, dt + 0.08);
      makeOsc('sine', 1800, 0.02, dt + 0.1, dt + 0.18);
      dt += s * 1.5;
    }

    this._bgmTimeout = setTimeout(() => this._scheduleBGM(), (totalDur - 0.12) * 1000);
  }

  // ═══════════════════════════════════════════════
  // 熔岩（第4关）— 紧迫，快节奏，压迫感
  // ═══════════════════════════════════════════════
  _scheduleLavaBGM() {
    if (!this.bgmPlaying) return;
    const ctx = this.audioCtx;
    const s = 0.25; // 极快
    const q = s / 2;
    const h = s;
    const C4 = 261.63, Eb4 = 311.13, F4 = 349.23, G4 = 392.00, Ab4 = 415.30, Bb4 = 466.16, C5 = 523.25;
    const melody = [
      [C5, q], [0, q], [Bb4, q], [Ab4, q], [G4, q], [F4, q], [Eb4, q], [C4, q],
      [C5, q], [0, q], [Bb4, q], [Ab4, q], [G4, h], [F4, q], [Eb4, q],
      [C4, q], [Eb4, q], [F4, q], [G4, q], [Ab4, q], [Bb4, q], [C5, h],
      [C5, q], [Bb4, q], [Ab4, q], [G4, q], [F4, q], [Eb4, q], [C4, h],
    ];

    const totalDur = melody.reduce((s, [, d]) => s + d, 0);
    const T = ctx.currentTime + 0.02;
    this._bgmNodes = [];

    const makeOsc = (type, freq, vol, startT, endT) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(vol, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, endT);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(endT + 0.01);
      this._bgmNodes.push(osc);
    };

    // 主旋律：刺耳的 sawtooth，压迫感
    let t = T;
    melody.forEach(([freq, dur]) => {
      if (freq !== 0) makeOsc('sawtooth', freq, 0.09, t, t + dur * 0.8);
      t += dur;
    });

    // 低音：快速 pulsating
    let bt = T;
    const bass = [[C4, q], [C4, q], [G4, q], [Ab4, q]];
    let bi = 0;
    while (bt < T + totalDur) {
      const [f, d] = bass[bi % bass.length];
      makeOsc('sawtooth', f, 0.08, bt, bt + d);
      bt += d;
      bi++;
    }

    // 打击：快速底鼓+军鼓，营造紧张
    let dt = T;
    while (dt < T + totalDur) {
      makeOsc('sawtooth', 100, 0.08, dt, dt + 0.06); // 底鼓
      makeOsc('square', 400, 0.05, dt + q, dt + q + 0.04); // 军鼓
      makeOsc('square', 6000, 0.015, dt, dt + 0.04); // 踩镲
      dt += s * 2;
    }

    this._bgmTimeout = setTimeout(() => this._scheduleBGM(), (totalDur - 0.08) * 1000);
  }
}

