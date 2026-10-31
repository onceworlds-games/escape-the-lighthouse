// Synthesized sound: rain, wind, thunder, creaks, clicks, chimes and a quiet tense music bed. No files.
export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicOn = true;
    this.level = 0.6;
  }
  start() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.level;
        this.master.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain();
        this.sfx.connect(this.master);
        this.bed = this.ctx.createGain();
        this.bed.gain.value = 0.0;
        this.bed.connect(this.master);
        this.noiseBuf = this.makeNoise();
        this.ambience();
        this.music();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      this.ctx = null;
    }
  }
  makeNoise() {
    const n = this.ctx.sampleRate * 3;
    const b = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  noise(dest, type, freq, q = 0.7, gain = 1) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    s.connect(f).connect(g).connect(dest);
    s.start();
    return { s, f, g };
  }
  ambience() {
    const c = this.ctx;
    this.amb = c.createGain();
    this.amb.gain.value = 0.55;
    this.amb.connect(this.master);
    this.noise(this.amb, 'highpass', 2400, 0.4, 0.12);
    this.noise(this.amb, 'bandpass', 1200, 0.5, 0.06);
    const wind = this.noise(this.amb, 'bandpass', 420, 1.4, 0.2);
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.11;
    const lg = c.createGain();
    lg.gain.value = 260;
    lfo.connect(lg).connect(wind.f.frequency);
    lfo.start();
    const lfo2 = c.createOscillator();
    lfo2.frequency.value = 0.07;
    const lg2 = c.createGain();
    lg2.gain.value = 0.12;
    lfo2.connect(lg2).connect(wind.g.gain);
    lfo2.start();
    this.noise(this.amb, 'lowpass', 140, 0.7, 0.28);
  }
  setAmbience(v) {
    if (this.amb) this.amb.gain.value = v;
  }
  tone(freq, dur, { type = 'sine', gain = 0.2, attack = 0.005, slide = 0, delay = 0, dest = null } = {}) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  burst(type, freq, dur, gain = 0.3, { delay = 0, q = 1, slide = 0 } = {}) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.sfx);
    s.start(t, Math.random() * 2);
    s.stop(t + dur + 0.05);
  }
  play(name, arg) {
    if (!this.ctx) return;
    const m = this[name];
    if (typeof m === 'function') m.call(this, arg);
  }
  // ---- the effects ----
  click() { this.tone(1800, 0.04, { type: 'square', gain: 0.07 }); this.burst('highpass', 3000, 0.03, 0.12); }
  tap() { this.tone(520, 0.07, { type: 'triangle', gain: 0.12, slide: -160 }); }
  whoosh() { this.burst('bandpass', 400, 0.7, 0.13, { slide: 1400, q: 0.8 }); }
  creak() { this.tone(180, 0.7, { type: 'sawtooth', gain: 0.05, slide: 70 }); this.tone(260, 0.5, { type: 'sawtooth', gain: 0.025, slide: -120, delay: 0.1 }); }
  pickup() { [660, 880, 1320].forEach((f, i) => this.tone(f, 0.28, { type: 'sine', gain: 0.14, delay: i * 0.07 })); }
  note() { this.burst('highpass', 2500, 0.18, 0.1); this.burst('highpass', 4000, 0.12, 0.08, { delay: 0.1 }); }
  snap() { this.tone(240, 0.09, { type: 'square', gain: 0.1 }); this.tone(1100, 0.2, { type: 'triangle', gain: 0.16, delay: 0.06 }); this.tone(1650, 0.3, { type: 'sine', gain: 0.1, delay: 0.1 }); }
  reject() { this.tone(150, 0.2, { type: 'sawtooth', gain: 0.1, slide: -50 }); }
  buzz() { this.tone(110, 0.38, { type: 'sawtooth', gain: 0.16 }); this.tone(116, 0.38, { type: 'square', gain: 0.08 }); }
  open() { this.tone(300, 0.08, { type: 'square', gain: 0.1 }); this.tone(900, 0.5, { type: 'triangle', gain: 0.18, delay: 0.08 }); this.tone(1350, 0.6, { type: 'sine', gain: 0.12, delay: 0.14 }); this.creak(); }
  tick() { this.tone(900, 0.03, { type: 'square', gain: 0.05 }); }
  drawer() { this.burst('lowpass', 600, 0.35, 0.22, { slide: 300 }); this.tone(120, 0.3, { type: 'triangle', gain: 0.08 }); }
  screws() { for (let i = 0; i < 6; i++) this.tone(2000 + i * 60, 0.03, { type: 'square', gain: 0.04, delay: i * 0.06 }); this.drawer(); }
  oil() { this.burst('bandpass', 1500, 0.4, 0.1, { q: 3 }); }
  pour() { this.burst('bandpass', 900, 0.9, 0.16, { slide: 500, q: 2 }); }
  fuse() { this.snap(); this.tone(60, 1.2, { type: 'sine', gain: 0.1 }); }
  dynamo() { this.tone(70, 1.8, { type: 'sawtooth', gain: 0.12, slide: 80 }); this.burst('lowpass', 300, 1.6, 0.15); }
  wind() { for (let i = 0; i < 10; i++) this.tone(300 + i * 6, 0.05, { type: 'square', gain: 0.05, delay: i * 0.1 }); this.dynamo(); }
  ignite() { this.burst('lowpass', 900, 0.7, 0.4, { slide: -500 }); this.tone(90, 0.8, { type: 'sine', gain: 0.2 }); }
  hum() { this.tone(110, 3, { type: 'sine', gain: 0.1, attack: 0.5 }); }
  thunder(delay = 1) {
    if (!this.ctx) return;
    this.burst('lowpass', 700, 3.5, 0.5, { delay, slide: -560, q: 0.6 });
    this.burst('lowpass', 200, 2.5, 0.5, { delay: delay + 0.15, q: 0.5 });
    this.tone(48, 2.5, { type: 'sine', gain: 0.25, delay: delay + 0.1, slide: -18 });
  }
  morseTone(on) {
    if (!this.ctx) return;
    if (on && !this.mo) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.value = 640;
      g.gain.value = 0.0001;
      g.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + 0.01);
      o.connect(g).connect(this.sfx);
      o.start();
      this.mo = { o, g };
    } else if (!on && this.mo) {
      this.mo.g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02);
      this.mo.o.stop(this.ctx.currentTime + 0.05);
      this.mo = null;
    }
  }
  tape() { for (let i = 0; i < 14; i++) this.tone(1200 + (i % 3) * 200, 0.02, { type: 'square', gain: 0.04, delay: i * 0.07 }); }
  lamp() {
    [196, 247, 294, 392, 494, 587].forEach((f, i) => this.tone(f, 2.6, { type: 'sine', gain: 0.12, attack: 0.3, delay: i * 0.25 }));
    this.tone(55, 4, { type: 'sine', gain: 0.2, attack: 1 });
  }
  fanfare() {
    [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, 1.8, { type: 'triangle', gain: 0.14, attack: 0.05, delay: i * 0.18 }));
  }
  // ---- music: a sparse minor bed with slow pulses ----
  music() {
    const c = this.ctx;
    const notes = [110, 130.8, 164.8, 98, 123.5, 146.8];
    let i = 0;
    const step = () => {
      if (!this.ctx) return;
      if (this.musicOn && this.bed.gain.value > 0.001) {
        const f = notes[i++ % notes.length];
        this.tone(f, 4.5, { type: 'sine', gain: 0.1, attack: 1.2, dest: this.bed });
        if (Math.random() > 0.4) this.tone(f * 3, 2.5, { type: 'triangle', gain: 0.025, attack: 0.5, delay: 1.2 + Math.random(), dest: this.bed });
        if (Math.random() > 0.65) this.tone(f * 4.5, 0.6, { type: 'sine', gain: 0.03, delay: 2 + Math.random() * 2, dest: this.bed });
      }
      this.musicTimer = setTimeout(step, 3600);
    };
    step();
  }
  musicLevel(v, swell = false) {
    if (!this.bed) return;
    this.bed.gain.setTargetAtTime(v, this.ctx.currentTime, swell ? 0.8 : 0.4);
  }
  setVolume(v) {
    this.level = v;
    if (this.master) this.master.gain.value = v;
  }
}
