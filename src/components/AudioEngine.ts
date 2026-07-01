// ══════════════════════════════════════════════════════════════
//  AUDIO ENGINE — Uses /sounds/... + Web Audio API SFX
// ══════════════════════════════════════════════════════════════

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sGain: GainNode | null = null;
  
  private bgAudio: HTMLAudioElement | null = null;
  private undergroundAudio: HTMLAudioElement | null = null;
  private explosionAudio: HTMLAudioElement | null = null;
  
  private jumpAudio: HTMLAudioElement | null = null;
  private coinAudio: HTMLAudioElement | null = null;
  private blockBreakAudio: HTMLAudioElement | null = null;
  private dieAudio: HTMLAudioElement | null = null;
  private flagpoleAudio: HTMLAudioElement | null = null;
  private gameoverAudio: HTMLAudioElement | null = null;
  private stageClearAudio: HTMLAudioElement | null = null;
  private fireworksAudio: HTMLAudioElement | null = null;

  private _muted = false;
  private _playing = false;
  private currentTheme: 'overworld' | 'underground' = 'overworld';

  get muted() { return this._muted; }
  get playing() { return this._playing; }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.sGain = this.ctx.createGain();
    this.sGain.gain.value = 0.85;
    this.sGain.connect(this.ctx.destination);

    // Setup HTML Audio
    if (!this.bgAudio) {
      this.bgAudio = new Audio('/sounds/bg.ogg');
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.95;

      this.undergroundAudio = new Audio('/sounds/underground_bgm.ogg');
      this.undergroundAudio.loop = true;
      this.undergroundAudio.volume = 0.95;
      
      this.explosionAudio = new Audio('/explosion.mp3');
      this.explosionAudio.volume = 0.85;

      this.jumpAudio = new Audio('/sounds/jump.wav');
      this.coinAudio = new Audio('/sounds/coin.wav');
      this.blockBreakAudio = new Audio('/sounds/blockbrak.wav');
      this.dieAudio = new Audio('/sounds/die.wav');
      this.flagpoleAudio = new Audio('/sounds/flagpole.wav');
      this.gameoverAudio = new Audio('/sounds/gameover.wav');
      this.stageClearAudio = new Audio('/sounds/stage_clear.wav');
      this.fireworksAudio = new Audio('/sounds/fireworks.wav');
    }

    const resumeOnInteraction = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this._playing && !this._muted) {
        const track = this.currentTheme === 'underground' ? this.undergroundAudio : this.bgAudio;
        if (track && track.paused) {
          track.play().catch(() => {});
        }
      }
    };
    window.addEventListener('click', resumeOnInteraction, { once: true });
    window.addEventListener('keydown', resumeOnInteraction, { once: true });
    window.addEventListener('touchstart', resumeOnInteraction, { once: true });
  }

  /* ── Play / Stop music ───────────────────────────────── */
  startMusic(theme: 'overworld' | 'underground' = 'overworld') {
    this.init();
    this.currentTheme = theme;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    
    // Stop any playing music first
    this.stopMusic();

    const track = theme === 'underground' ? this.undergroundAudio : this.bgAudio;
    if (track) {
      track.currentTime = 0;
      track.play().catch(() => {});
      this._playing = true;
    }
  }

  stopMusic() {
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.currentTime = 0;
    }
    if (this.undergroundAudio) {
      this.undergroundAudio.pause();
      this.undergroundAudio.currentTime = 0;
    }
    this._playing = false;
  }

  ensurePlaying() {
    if (this._playing && !this._muted) {
      const track = this.currentTheme === 'underground' ? this.undergroundAudio : this.bgAudio;
      if (track && track.paused) {
        track.play().catch(() => {});
      }
    }
  }

  /* ── Mute toggle ─────────────────────────────────────── */
  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.bgAudio) this.bgAudio.volume = this._muted ? 0 : 0.95;
    if (this.undergroundAudio) this.undergroundAudio.volume = this._muted ? 0 : 0.95;
    if (this.explosionAudio) this.explosionAudio.volume = this._muted ? 0 : 0.85;
    if (this.sGain) this.sGain.gain.value = this._muted ? 0 : 0.85;
    if (this.stageClearAudio) this.stageClearAudio.volume = this._muted ? 0 : 0.95;
    if (this.fireworksAudio) this.fireworksAudio.volume = this._muted ? 0 : 0.85;
    return this._muted;
  }

  private playSfx(audio: HTMLAudioElement | null, volume: number = 0.85) {
    if (this._muted || !audio) return;
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = volume;
    clone.play().catch(() => {});
  }

  /* ── Low-level note ──────────────────────────────────── */
  private note(
    freq: number, t: number, dur: number,
    type: OscillatorType = 'square', vol = 0.6,
  ) {
    if (!this.ctx || !this.sGain || freq <= 0 || this._muted) return;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.92);
    osc.connect(g);
    g.connect(this.sGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /* ── SFX ─────────────────────────────────────────────── */
  sfxJump() {
    this.playSfx(this.jumpAudio, 0.8);
  }

  sfxCoin() {
    this.playSfx(this.coinAudio, 0.9);
  }

  sfxStomp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.note(200, t, 0.06, 'square', 0.8);
    this.note(100, t + 0.06, 0.1, 'square', 0.6);
  }

  sfxDeath() {
    this.stopMusic();
    this.playSfx(this.dieAudio, 0.95);
  }

  sfxGameOver() {
    this.stopMusic();
    this.playSfx(this.gameoverAudio, 0.95);
  }

  sfxBlockHit() {
    this.playSfx(this.blockBreakAudio, 0.8);
  }

  sfxPowerup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392,494,587,784,1047].forEach((f,i) => {
      this.note(f, t + i * 0.08, 0.1, 'square', 0.6);
    });
  }

  sfxPipe() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [1047, 784, 587, 494, 392].forEach((f,i) => {
      this.note(f, t + i * 0.06, 0.1, 'square', 0.6);
    });
  }

  sfxSkillReveal() {
    this.playSfx(this.coinAudio, 0.9);
  }

  sfxLevelClear() {
    this.stopMusic();
    this.playSfx(this.flagpoleAudio, 0.95);
  }

  sfxFlagpole() {
    this.stopMusic();
    this.playSfx(this.flagpoleAudio, 0.95);
  }

  sfxStageClear() {
    this.stopMusic();
    this.playSfx(this.stageClearAudio, 0.95);
  }

  sfxFireworks() {
    this.playSfx(this.fireworksAudio, 0.95);
  }

  sfxExplosion() {
    if (!this.ctx || !this.sGain) return;
    const t = this.ctx.currentTime;
    
    // Simulate explosion using noise burst
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter to muffle noise (sounds more like boom)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(10, t + 0.4);
    
    // Volume envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(1.0 * (this.sGain.gain.value), t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    
    noise.connect(filter);
    filter.connect(env);
    
    // Actually connect to sGain to respect mute
    env.connect(this.sGain);
    
    noise.start(t);
  }
}
