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

    // ── 节拍单位（BPM=150，紧张急促）──────────────────────
    const q = 0.1;      // 十六分音符
    const e = q * 2;    // 八分音符
    const h = q * 4;    // 四分音符
    const dh = q * 6;   // 附点四分音符
    const W = q * 8;    // 二分音符

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