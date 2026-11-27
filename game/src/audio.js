/* GOBBLE DASH — all sound is synthesized with WebAudio. No audio files,
   no network: every blip, thud and tune is built from oscillators. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  function SoundEngine() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOn = false;
  }

  SoundEngine.prototype.ensure = function () {
    if (!this.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  };

  SoundEngine.prototype.tone = function (freq, dur, type, vol, when, slideTo) {
    if (this.muted || !this.ensure()) return;
    var t0 = this.ctx.currentTime + (when || 0);
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  };

  SoundEngine.prototype.noise = function (dur, vol, when, lowpass) {
    if (this.muted || !this.ensure()) return;
    var t0 = this.ctx.currentTime + (when || 0);
    var len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var g = this.ctx.createGain();
    g.gain.value = vol || 0.15;
    var f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass || 1200;
    src.connect(f).connect(g).connect(this.ctx.destination);
    src.start(t0);
  };

  /* --- game event sounds --- */
  SoundEngine.prototype.coin = function () {
    this.tone(988, 0.09, 'sine', 0.16);
    this.tone(1319, 0.16, 'sine', 0.16, 0.07);
  };
  SoundEngine.prototype.feather = function () {
    this.tone(784, 0.1, 'triangle', 0.16);
    this.tone(1047, 0.1, 'triangle', 0.16, 0.08);
    this.tone(1568, 0.22, 'triangle', 0.16, 0.16);
  };
  SoundEngine.prototype.jump = function () { this.tone(300, 0.18, 'sine', 0.14, 0, 720); };
  SoundEngine.prototype.slide = function () { this.noise(0.22, 0.12, 0, 900); };
  SoundEngine.prototype.stumble = function () {
    this.noise(0.25, 0.25, 0, 500);
    this.tone(160, 0.3, 'sawtooth', 0.18, 0, 60);
  };
  SoundEngine.prototype.knife = function () {
    this.tone(1400, 0.35, 'sine', 0.1, 0, 300);   // whistle down
    this.noise(0.12, 0.2, 0.36, 2500);            // thunk
  };
  SoundEngine.prototype.powerup = function () {
    var self = this;
    [523, 659, 784, 1047].forEach(function (f, i) { self.tone(f, 0.12, 'triangle', 0.15, i * 0.07); });
  };
  SoundEngine.prototype.caught = function () {
    var self = this;
    [392, 370, 349, 311].forEach(function (f, i) { self.tone(f, 0.35, 'sawtooth', 0.16, i * 0.22); });
    self.noise(0.5, 0.2, 0.9, 400);
  };
  SoundEngine.prototype.win = function () {
    var self = this;
    [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { self.tone(f, 0.28, 'triangle', 0.16, i * 0.11); });
  };
  SoundEngine.prototype.click = function () { this.tone(660, 0.06, 'square', 0.1); };
  SoundEngine.prototype.zone = function () {
    this.tone(523, 0.12, 'triangle', 0.14);
    this.tone(784, 0.2, 'triangle', 0.14, 0.1);
  };

  /* --- cheerful music loop: a bouncy C-major melody over a walking bass.
         8th notes at 132 bpm, square lead + triangle bass. --- */
  SoundEngine.prototype.startMusic = function () {
    if (this.musicOn || !this.ensure()) return;
    this.musicOn = true;
    var melody = [523, 0, 659, 784, 0, 784, 880, 0, 784, 659, 523, 0, 587, 659, 0, 0,
                  523, 0, 659, 784, 0, 880, 1047, 0, 880, 784, 659, 784, 0, 0, 0, 0];
    var bass = [131, 0, 165, 0, 196, 0, 165, 0, 131, 0, 165, 0, 196, 220, 0, 0,
                131, 0, 165, 0, 196, 0, 220, 0, 196, 165, 196, 0, 131, 0, 0, 0];
    var stepDur = 60 / 132 / 2;
    var self = this;
    this.musicTimer = setInterval(function () {
      if (self.muted || !self.ctx) return;
      var i = self.musicStep % 32;
      var m = melody[i];
      if (m) self.tone(m, stepDur * 0.92, 'square', 0.045);
      var b = bass[i];
      if (b) self.tone(b, stepDur * 0.95, 'triangle', 0.09);
      self.musicStep++;
    }, stepDur * 1000);
  };

  SoundEngine.prototype.stopMusic = function () {
    this.musicOn = false;
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  };

  SoundEngine.prototype.setMuted = function (m) { this.muted = m; };

  G.SoundEngine = SoundEngine;
})();
