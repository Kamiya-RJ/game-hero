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
    // AudioContext 可能因浏览器自动播放策略而挂起，确保恢复后再播放
    if (ctx.state === 'suspended') ctx.resume();
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
  _scheduleBGM() {
    if (!this.bgmPlaying) return;

    const ctx = this.audioCtx;

    // ── 节拍单位（BPM=160，军队进行曲节奏）────────────────
    const s  = 60 / 160;        // 一拍（秒）
    const q  = s / 2;           // 八分音符
    const qq = s / 4;           // 十六分音符
    const h  = s;               // 四分音符（一拍）
    const dh = s * 1.5;         // 附点四分
    const W  = s * 2;           // 二分音符

    // ── 音符频率常量（D大调，NES 魂斗罗风格）──────────────
    // D大调：D E F# G A B C# D
    const D4=293.66, E4=329.63, Fs4=369.99, G4=392.00,
          A4=440.00, B4=493.88, Cs5=554.37,
          D5=587.33, E5=659.25, Fs5=739.99, G5=783.99,
          A5=880.00, B5=987.77, D6=1174.66,
          D3=146.83, A3=220.00, G3=196.00, Fs3=184.99,
          E3=164.81, B3=246.94, Cs4=277.18;

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
      [0,h],[0,h],[0,h],[0,h],
    ];

    const A = [
      // 主题句：刚劲的 D大调进行曲上行
      [D4,q],[D4,q],[A4,h],[A4,q],[G4,q],
      [Fs4,q],[E4,q],[D4,h],[0,h],

      [E4,q],[E4,q],[A4,h],[A4,q],[G4,q],
      [Fs4,q],[E4,q],[D4,dh],[0,q],

      // 第二句：跳跃感，五度大跳
      [D4,q],[Fs4,q],[A4,q],[D5,q],[Cs5,q],[B4,q],[A4,h],
      [G4,q],[A4,q],[B4,q],[A4,q],[G4,q],[Fs4,q],[E4,h],

      [D4,q],[Fs4,q],[A4,h],[D5,q],[Cs5,q],
      [B4,dh],[A4,q],[D5,W],
    ];

    const A2 = [
      // 主题重复：加切分，节奏更紧迫
      [D4,qq],[0,qq],[D4,q],[A4,h],[A4,q],[G4,q],
      [Fs4,q],[E4,q],[D4,h],[0,h],

      [E4,qq],[0,qq],[E4,q],[A4,h],[A4,q],[G4,q],
      [Fs4,q],[E4,q],[D4,dh],[0,q],

      [D4,q],[Fs4,q],[A4,q],[D5,qq],[Cs5,qq],[D5,q],[Cs5,q],[B4,q],[A4,h],
      [G4,q],[A4,q],[B4,q],[A4,q],[G4,qq],[Fs4,qq],[G4,q],[Fs4,h],

      [D4,q],[Fs4,q],[A4,h],[D5,q],[0,q],
      [B4,q],[A4,q],[Fs4,h],[D4,W],
    ];

    const B = [
      // 副歌：高音区大跳，英雄感
      [D5,h],[A5,h],[G5,q],[Fs5,q],[E5,q],[D5,q],
      [Cs5,dh],[B4,q],[A4,h],[0,h],

      [B4,q],[D5,q],[Fs5,h],[E5,q],[D5,q],
      [Cs5,q],[B4,q],[A4,dh],[0,q],

      // 副歌第二句：更强力
      [D5,q],[E5,q],[Fs5,q],[G5,q],[A5,h],[G5,q],[Fs5,q],
      [E5,q],[D5,q],[Cs5,q],[B4,q],[A4,W],

      [Fs4,q],[A4,q],[D5,h],[Fs5,q],[E5,q],
      [D5,dh],[Cs5,q],[D5,W],
    ];

    const C = [
      // 过渡句：下行序列蓄力，为高八度主题铺垫
      [A5,q],[G5,q],[Fs5,q],[E5,q],[D5,q],[Cs5,q],[B4,q],[A4,q],
      [G4,q],[Fs4,q],[E4,q],[D4,q],[Cs4,q],[B3,q],[A3,q],[0,q],

      [D4,q],[E4,q],[Fs4,q],[G4,q],[A4,q],[B4,q],[Cs5,q],[D5,q],
      [E5,h],[Fs5,h],[G5,h],[0,h],
    ];

    const A3 = [
      // 主题高八度：冲刺感，最强力度
      [D5,qq],[0,qq],[D5,q],[A5,h],[A5,q],[G5,q],
      [Fs5,q],[E5,q],[D5,h],[0,h],

      [E5,qq],[0,qq],[E5,q],[A5,h],[G5,q],[Fs5,q],
      [E5,q],[D5,q],[Cs5,dh],[0,q],

      [D5,q],[Fs5,q],[A5,q],[D6,qq],[0,qq],[D6,q],[A5,q],[G5,q],[Fs5,h],
      [E5,q],[Fs5,q],[G5,q],[Fs5,q],[E5,q],[D5,q],[Cs5,h],

      [D5,q],[Fs5,q],[A5,h],[D6,q],[0,q],
      [B5,q],[A5,q],[Fs5,h],[D5,W],
    ];

    const Outro = [
      // 收尾：英雄姿态落地，引回循环
      [D5,h],[A4,h],[Fs4,h],[D4,h],
      [E4,q],[Fs4,q],[G4,q],[A4,q],[B4,q],[A4,q],[G4,q],[Fs4,q],
      [E4,dh],[D4,q],[D4,W],
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
    const counterOffset = [...Intro,...A,...A2].reduce((s,[,d])=>s+d,0);

    // ── 低音線（进行曲特征：强-弱-强-弱 律动）──────────────
    // D大调低音：D - A - G - A 循环（强力进行曲步伐）
    const bassPattern = [
      [D3, h], [A3, q], [0, q],   // 强拍
      [G3, h], [A3, q], [0, q],   // 弱拍
    ];

    // ── 开始调度 ──────────────────────────────────────────
    const T = ctx.currentTime + 0.02;
    this._bgmNodes = [];

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
        makeOsc('sawtooth', 300, 0.06, dt+h, dt+h+0.04, [100, 0.035]);
        makeOsc('square',  6000, 0.025,dt+h, dt+h+0.035);
      }

      // 踩镲（每半拍，轻）
      makeOsc('square', 8000, 0.012, dt+q, dt+q+0.02);
      if (dt+h+q < T + totalDur)
        makeOsc('square', 8000, 0.012, dt+h+q, dt+h+q+0.02);

      dt += W; // 每两拍一个完整节奏型
    }

    // 提前 120ms 调度下一轮
    this._bgmTimeout = setTimeout(
      () => this._scheduleBGM(),
      (totalDur - 0.12) * 1000
    );
  }

    // ── 旋律（A小调，紧张不安）────────────────────────────
    //
    // 曲目结构：
    //   Intro  — 低沉切分，铺垫紧张
    //   A      — 主题：急促下行，带不稳定减音程
    //   B      — 爬升段：半音阶上行，压迫感逐步增强
    //   A'     — 主题高八度变奏：更尖锐，节奏加密
    //   C      — 危机顶点：密集切分 + 大跳，最紧张
    //   Outro  — 下行收尾，回到 Intro 准备循环
    //
    // 音符格式：[频率Hz, 时值秒]，0 = 休止符
    // A小调音阶：A B C D E F G（自然小调）
    //            加入 G#（和声小调导音）制造更强的紧张感

    const Intro = [
      // 低沉切分节奏，奠定不安气氛
      [220, q], [0, q], [220, q], [233, q], [0, e], [220, q], [0, q],
      [208, q], [0, q], [196, q], [0, q],   [185, q],[196, q],[0, e],
      [220, q], [0, q], [220, q], [246, q], [0, e], [220, q], [0, q],
      [233, W],
    ];

    const A = [
      // 主题：急促下行 Am 旋律，G#导音制造紧张
      [880, q], [831, q], [880, e], [0, q],
      [784, q], [740, q], [784, e], [0, q],
      [659, q], [622, q], [659, q], [0, q], [622, q], [587, q],
      [659, dh],[0, q],

      // 第二句：跳跃下行，减音程制造不稳定
      [880, e], [587, e], [0, q],  [659, q], [622, q],
      [587, e], [523, e], [0, q],  [494, q], [466, q],
      [440, q], [466, q], [494, q],[523, q], [587, q], [0, q],
      [622, dh],[0, q],
    ];

    const B = [
      // 爬升段：半音阶上行，压迫感逐步增强
      [440, e], [466, e], [494, e], [523, e],
      [554, e], [587, e], [622, e], [659, e],
      [698, e], [740, e], [784, e], [831, e],
      [880, h], [0, e],

      // 反向下行，情绪不肯解决
      [831, q], [784, q], [740, q], [698, q],
      [659, q], [0, q],   [587, q], [0, q],
      [554, q], [523, q], [494, q], [466, q],
      [440, dh],[0, q],
    ];

    const A2 = [
      // 主题高八度，节奏更密，更尖锐
      [1760,q], [1661,q],[1760,e], [0, q],
      [1568,q], [1480,q],[1568,e], [0, q],
      [1319,q], [1245,q],[1319,q], [0, q],[1245,q],[1175,q],
      [1319,dh],[0, q],

      [1760,e], [1175,e],[0, q],  [1319,q],[1245,q],
      [1175,e], [1047,e],[0, q],  [988, q],[932, q],
      [880, q], [932, q],[988, q],[1047,q],[1175,q],[0, q],
      [1245,dh],[0, q],
    ];

    const C = [
      // 危机顶点：密集切分 + 大跳，最紧张
      [880, q], [0, q], [1047,q],[0, q],[1175,q],[0, q],[1319,q],[0, q],
      [1480,q], [0, q], [1319,q],[1175,q],[1047,q],[880,q],[831,q],[0,q],

      // 切分重音，节奏错位营造慌乱感
      [880,e],[831,q],[880,e],[0,q],[784,q],[831,q],
      [784,e],[740,q],[784,e],[0,q],[698,q],[740,q],
      [659,q],[698,q],[740,q],[784,q],[831,q],[880,q],[0,e],

      // 顶点后短暂的喘息（增加戏剧性）
      [440, W], [0, W],
    ];

    const Outro = [
      // 下行收尾，情绪未解决，制造循环感
      [880, e], [784, e], [698, e], [659, e],
      [587, e], [523, e], [466, e], [440, e],
      [392, e], [0, q],   [440, e], [0, q],
      [466, dh],[0, q],
      [440, q], [0, q],   [415, q], [0, q],
      [392, W],
    ];

    const melody = [...Intro, ...A, ...B, ...A2, ...C, ...Outro];
    const totalDur = melody.reduce((s, [, d]) => s + d, 0);

    // ── 低音层（持续律动，Am 和弦进行）───────────────────
    // 每段对应的和弦根音，用律动低音（ostinato）铺底
    // Am - G - F - E（经典小调下行）循环
    const bassPattern = [
      [55.00, h],  // Am 根音（低八度 A）
      [49.00, h],  // G
      [43.65, h],  // F
      [41.20, h],  // E（和声小调，增加紧张）
    ];

    // ── 开始调度 ──────────────────────────────────────────
    const T = ctx.currentTime + 0.02;
    this._bgmNodes = [];

    // 辅助：生成振荡器节点（自动推入 _bgmNodes）
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

    // 1. 旋律层（square，留 15% 间隙，粒度更强）
    let t = T;
    melody.forEach(([freq, dur]) => {
      if (freq !== 0) makeOsc('square', freq, 0.07, t, t + dur * 0.85);
      t += dur;
    });

    // 2. 旋律暗影层（sawtooth，低半音，制造不和谐摩擦）
    //    只在 C段（危机顶点）叠加，音量极低
    let shadowT = T + [...Intro,...A,...B,...A2].reduce((s,[,d])=>s+d,0);
    C.forEach(([freq, dur]) => {
      if (freq !== 0) {
        // 叠加低半音（×0.9439 = 降半音）
        makeOsc('sawtooth', freq * 0.9439, 0.02, shadowT, shadowT + dur * 0.6);
      }
      shadowT += dur;
    });

    // 3. 低音律动层（triangle，持续律动 ostinato）
    let bt = T;
    let bi = 0;
    while (bt < T + totalDur) {
      const [rootFreq, beatDur] = bassPattern[bi % bassPattern.length];
      if (bt + beatDur > T + totalDur) break;
      // 根音
      makeOsc('triangle', rootFreq, 0.09, bt, bt + beatDur * 0.9);
      // 八度上方（加厚低音）
      makeOsc('triangle', rootFreq * 2, 0.04, bt, bt + beatDur * 0.7);
      bt += beatDur;
      bi++;
    }

    // 4. 打击节奏层（紧张风格：底鼓密集 + 强力重音）
    let dt = T;
    while (dt < T + totalDur) {
      // 底鼓：每半拍一次（比之前快一倍，紧迫感）
      makeOsc('sawtooth', 120, 0.08, dt, dt + 0.06, [25, 0.055]);
      // 弱拍踩镲
      if (dt + e < T + totalDur) {
        makeOsc('square', 8000, 0.015, dt + e, dt + e + 0.025);
      }
      // 每两拍的重音（snare 模拟）
      if (dt + h < T + totalDur) {
        makeOsc('sawtooth', 200, 0.06, dt + h, dt + h + 0.05, [80, 0.045]);
        makeOsc('square',  8000, 0.02, dt + h, dt + h + 0.03);
      }
      dt += h; // 每一拍循环
    }

    // 提前 120ms 调度下一轮，确保无缝循环
    this._bgmTimeout = setTimeout(
      () => this._scheduleBGM(),
      (totalDur - 0.12) * 1000
    );
  }
}