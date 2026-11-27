/* GOBBLE DASH — HUD and screens: score, distance, zone, speed, feather
   lives, the farmer danger meter, power-up timer, zone banners, toasts,
   and the title / end / pause screens. Pure DOM over the 3D canvas. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  function el(id) { return document.getElementById(id); }
  function show(node) { node.classList.remove('hidden'); }
  function hide(node) { node.classList.add('hidden'); }

  function Hud(sound) {
    this.sound = sound;
    this.best = 0;
    try { this.best = parseInt(localStorage.getItem('gobble-dash-best') || '0', 10) || 0; } catch (e) { this.best = 0; }
  }

  Hud.prototype.showTitle = function () {
    hide(el('hud'));
    hide(el('end-screen'));
    hide(el('pause-screen'));
    show(el('title-screen'));
  };

  Hud.prototype.showPlaying = function () {
    hide(el('title-screen'));
    hide(el('end-screen'));
    hide(el('pause-screen'));
    show(el('hud'));
  };

  Hud.prototype.showPaused = function (paused) {
    if (paused) show(el('pause-screen')); else hide(el('pause-screen'));
  };

  Hud.prototype.showEnd = function (escaped, stats) {
    hide(el('hud'));
    hide(el('title-screen'));
    var kicker = el('end-kicker');
    var title = el('end-title');
    var sub = el('end-sub');
    var tip = el('end-tip');
    if (escaped) {
      kicker.textContent = 'ESCAPED!';
      title.textContent = 'FREEDOM!';
      sub.textContent = 'Gus outran Farmer Bram, the oven and the carving knife — no Thanksgiving dinner tonight!';
      tip.textContent = 'You escaped! Try again and beat your best score — the farm gets faster every run.';
      title.style.textShadow = '0 5px 0 #1d7a2c, 0 10px 24px rgba(0,0,0,0.55)';
    } else {
      kicker.textContent = 'CAUGHT!';
      title.textContent = 'DINNER TIME';
      sub.textContent = 'Farmer Bram caught Gus… the oven was already hot.';
      tip.textContent = 'Tip: jump the hay bales, slide under the low branches, and never stay in the lane of a falling knife.';
      title.style.textShadow = '0 5px 0 #e2580a, 0 10px 24px rgba(0,0,0,0.55)';
    }
    el('end-score').textContent = stats.score;
    el('end-dist').textContent = Math.floor(stats.distance);
    el('end-corn').textContent = stats.corn;
    var best = Math.max(this.best, stats.score);
    this.best = best;
    try { localStorage.setItem('gobble-dash-best', String(best)); } catch (e) {}
    el('end-best').textContent = best;
    show(el('end-screen'));
  };

  Hud.prototype.update = function (s) {
    el('hud-score').textContent = s.score;
    el('hud-dist').textContent = Math.floor(s.distance);
    el('hud-speed').textContent = Math.round(s.speed * 3.6);
    el('hud-zone').textContent = s.zone;
    // Feather lives.
    var feathers = el('lives-row').children;
    for (var i = 0; i < feathers.length; i++) {
      feathers[i].classList.toggle('on', i < s.lives);
      feathers[i].classList.toggle('off', i >= s.lives);
    }
    // Danger meter: farmer proximity, green -> red.
    var d = Math.max(0, Math.min(100, s.danger));
    el('danger-fill').style.width = Math.max(6, d) + '%';
    var text = 'He is far behind…';
    if (d > 75) text = 'HE IS RIGHT BEHIND YOU — RUN!';
    else if (d > 50) text = 'He is gaining on you!';
    else if (d > 25) text = 'He is getting closer…';
    el('danger-text').textContent = text;
    // Power-up timer.
    if (s.power && s.powerTime > 0) {
      show(el('powerup-wrap'));
      el('powerup-name').textContent = s.power === 'magnet' ? '🧲 MAGNET — corn flies to you!' : '👟 SPEEDY SHOES — invincible!';
      el('powerup-fill').style.width = Math.round((s.powerTime / s.powerMax) * 100) + '%';
    } else {
      hide(el('powerup-wrap'));
    }
  };

  Hud.prototype.zoneBanner = function (zoneName) {
    var b = el('zone-banner');
    b.textContent = zoneName + '!';
    b.classList.remove('hidden');
    b.classList.remove('pop');
    void b.offsetWidth; // restart the animation
    b.classList.add('pop');
    this.sound.zone();
    setTimeout(function () { b.classList.add('hidden'); }, 1700);
  };

  Hud.prototype.toast = function (text) {
    var t = el('toast');
    t.textContent = text;
    t.classList.remove('hidden');
    t.classList.remove('pop');
    void t.offsetWidth;
    t.classList.add('pop');
    setTimeout(function () { t.classList.add('hidden'); }, 950);
  };

  Hud.prototype.flashHit = function () {
    var f = el('flash');
    f.classList.add('hit');
    setTimeout(function () { f.classList.remove('hit'); }, 160);
  };

  G.Hud = Hud;
  G.hudEl = el;
})();
