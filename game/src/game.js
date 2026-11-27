/* GOBBLE DASH — the game itself: state machine, render loop, input,
   spawning, collisions, the farmer chase, scoring and the end of the run.
   Gus stays near z = 0; the world runs past him. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});
  var C = G.CONFIG;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  /* easeOutBack: overshoot on lane hops (Playful personality). */
  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function Game() {
    var params = new URLSearchParams(location.search);
    this.seed = parseInt(params.get('seed') || '20261127', 10);
    this.rng = G.mulberry32(this.seed);
    this.shot = params.get('shot') || null;

    this.state = 'title';           // title | playing | paused | caught | escaped
    this.time = 0;
    this.distance = 0;
    this.speed = 0;
    this.score = 0;
    this.bonus = 0;
    this.cornCount = 0;
    this.lives = 3;
    this.danger = 0;
    this.timeSinceStumble = 99;
    this.lane = 1;
    this.playerX = 0;
    this.laneAnim = null;           // {from, to, t}
    this.playerY = 0;
    this.playerVy = 0;
    this.grounded = true;
    this.slideTimer = 0;
    this.squashTimer = 0;
    this.invincibleTimer = 0;
    this.power = null;              // 'magnet' | 'shoes'
    this.powerTime = 0;
    this.powerMax = 1;
    this.runPhase = 0;
    this.shakeTime = 0;
    this.zoneIndex = 0;
    this.nextObstacleAt = 26;
    this.nextKnifeIn = 9;
    this.obstacles = [];
    this.pickups = [];
    this.knifeDrops = [];
    this.confetti = [];
    this.farmerZ = 4.7;
    this.farmerTargetZ = 4.7;

    this.sound = new G.SoundEngine();
    this.hud = new G.Hud(this.sound);
    this.buildScene();
    this.bindInput();
    this.hud.showTitle();
    this.last = performance.now();
    var self = this;
    // rAF timestamps can run slightly behind performance.now() in some
    // browsers, which would make dt negative and the speed/distance run
    // backwards — so read the clock ourselves and clamp dt to [0, 0.05].
    (function loop() {
      requestAnimationFrame(loop);
      var now = performance.now();
      var dt = Math.max(0, Math.min(0.05, (now - self.last) / 1000));
      self.last = now;
      self.frame(dt);
    })();

    if (this.shot) this.applyShot(this.shot);
  }

  Game.prototype.buildScene = function () {
    var canvas = document.getElementById('scene');
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // No outputEncoding: three r149's default keeps authored hex colours
    // vivid (sRGBEncoding would wash the bright palette pale).
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
    this.camera.position.set(0, C.cameraY, C.cameraZ);
    this.camera.lookAt(0, 1.3, -10);
    this.onResize();
    var self = this;
    window.addEventListener('resize', function () { self.onResize(); });

    this.track = new G.Track(this.scene, this.rng);

    this.turkey = G.buildTurkey();
    this.scene.add(this.turkey.group);
    this.farmer = G.buildFarmer();
    this.farmer.group.scale.setScalar(0.85);
    this.farmer.group.position.set(0.9, 0, 4.7);
    this.farmer.group.rotation.y = Math.PI; // Bram faces down the track, away from camera
    this.scene.add(this.farmer.group);
    this.dog = G.buildDog();
    this.dog.group.scale.setScalar(0.9);
    this.dog.group.position.set(2.1, 0, 3.9);
    this.dog.group.rotation.y = Math.PI; // Biscuit faces down the track too
    this.scene.add(this.dog.group);
  };

  Game.prototype.onResize = function () {
    var w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  /* ---------------- input ---------------- */
  Game.prototype.bindInput = function () {
    var self = this;
    document.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ') e.preventDefault();
      if (k === 'm' || k === 'M') { self.toggleMute(); return; }
      if (k === 'p' || k === 'P' || k === 'Escape') { self.togglePause(); return; }
      if (k === 'Enter') {
        if (self.state === 'title' || self.state === 'caught' || self.state === 'escaped') self.startRun();
        return;
      }
      if (self.state !== 'playing') return;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') self.moveLane(-1);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') self.moveLane(1);
      else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') self.jump();
      else if (k === 'ArrowDown' || k === 's' || k === 'S') self.slide();
    });

    // Touch: swipe to steer / jump / slide, tap a side to change lane.
    var tx = 0, ty = 0, t0 = 0;
    var canvas = document.getElementById('scene');
    canvas.addEventListener('touchstart', function (e) {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY; t0 = performance.now();
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (self.state !== 'playing') return;
      if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) self.moveLane(dx > 0 ? 1 : -1);
      else if (dy < -28) self.jump();
      else if (dy > 28) self.slide();
      else if (performance.now() - t0 < 250) {
        var x = e.changedTouches[0].clientX;
        if (x < window.innerWidth / 3) self.moveLane(-1);
        else if (x > window.innerWidth * 2 / 3) self.moveLane(1);
        else self.jump();
      }
      e.preventDefault();
    }, { passive: false });

    // Mouse: click a side to steer, centre to jump.
    canvas.addEventListener('mousedown', function (e) {
      if (self.state !== 'playing') return;
      var x = e.clientX;
      if (x < window.innerWidth / 3) self.moveLane(-1);
      else if (x > window.innerWidth * 2 / 3) self.moveLane(1);
      else self.jump();
    });

    document.getElementById('btn-start').addEventListener('click', function () { self.sound.ensure(); self.sound.click(); self.startRun(); });
    document.getElementById('btn-restart').addEventListener('click', function () { self.sound.click(); self.startRun(); });
    document.getElementById('btn-resume').addEventListener('click', function () { self.togglePause(); });
    document.getElementById('mute-btn').addEventListener('click', function () { self.toggleMute(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && self.state === 'playing') self.togglePause();
    });
  };

  Game.prototype.toggleMute = function () {
    this.sound.setMuted(!this.sound.muted);
    document.getElementById('mute-btn').classList.toggle('muted', this.sound.muted);
  };

  Game.prototype.togglePause = function () {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.hud.showPaused(true);
      this.sound.stopMusic();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.hud.showPaused(false);
      this.sound.startMusic();
    }
  };

  Game.prototype.moveLane = function (dir) {
    var target = clamp(this.lane + dir, 0, 2);
    if (target === this.lane) return;
    this.laneAnim = { from: this.playerX, to: C.laneX[target], t: 0 };
    this.lane = target;
  };

  Game.prototype.jump = function () {
    if (!this.grounded) return;
    this.playerVy = C.jumpVelocity;
    this.grounded = false;
    this.slideTimer = 0;
    this.sound.jump();
  };

  Game.prototype.slide = function () {
    if (!this.grounded) {
      this.playerVy = -22; // slam down fast
      this.slideTimer = C.slideTime;
      return;
    }
    if (this.slideTimer <= 0) {
      this.slideTimer = C.slideTime;
      this.sound.slide();
    }
  };

  /* ---------------- run lifecycle ---------------- */
  Game.prototype.startRun = function () {
    var self = this;
    this.obstacles.forEach(function (o) { self.scene.remove(o.group); });
    this.pickups.forEach(function (p) { self.scene.remove(p.group); });
    this.knifeDrops.forEach(function (k) { self.scene.remove(k.group); });
    this.confetti.forEach(function (c) { self.scene.remove(c); });
    this.obstacles = []; this.pickups = []; this.knifeDrops = []; this.confetti = [];
    this.distance = 0; this.score = 0; this.bonus = 0; this.cornCount = 0;
    this.lives = 3; this.danger = 0; this.timeSinceStumble = 99;
    this.lane = 1; this.playerX = 0; this.laneAnim = null;
    this.playerY = 0; this.playerVy = 0; this.grounded = true;
    this.slideTimer = 0; this.squashTimer = 0; this.invincibleTimer = 0;
    this.power = null; this.powerTime = 0;
    this.zoneIndex = 0; this.nextObstacleAt = 26; this.nextKnifeIn = 9;
    this.turkey.group.rotation.set(0, Math.PI, 0); // Gus faces down the track, away from camera
    this.turkey.group.scale.set(1, 1, 1);
    this.farmerZ = 4.7; this.farmerTargetZ = 4.7;
    this.track.applyZone(0, true);
    this.state = 'playing';
    this.hud.showPlaying();
    this.sound.ensure();
    this.sound.startMusic();
  };

  Game.prototype.endRun = function (escaped) {
    this.state = escaped ? 'escaped' : 'caught';
    this.sound.stopMusic();
    if (escaped) {
      this.sound.win();
      this.spawnConfetti();
      this.farmerTargetZ = 4.7;
    } else {
      this.sound.caught();
      this.farmerTargetZ = 1.05; // Bram grabs Gus
    }
    this.hud.showEnd(escaped, { score: this.score, distance: this.distance, corn: this.cornCount });
  };

  Game.prototype.spawnConfetti = function () {
    var colors = [0xe62020, 0xff7f00, 0xffc21c, 0x2fae3e, 0x1d6fd1, 0xff5ec4];
    for (var i = 0; i < 60; i++) {
      var c = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14),
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide }));
      c.position.set((this.rng() - 0.5) * 10, 4 + this.rng() * 6, -4 - this.rng() * 10);
      c.userData.fall = 1 + this.rng() * 1.5;
      c.userData.spin = 2 + this.rng() * 4;
      this.scene.add(c);
      this.confetti.push(c);
    }
  };

  /* ---------------- spawning ---------------- */
  Game.prototype.spawnRow = function () {
    var r = this.rng;
    var lanes = [0, 1, 2];
    var blockedCount = r() < 0.55 ? 1 : 2;
    // Shuffle lanes, block the first N, keep at least one free.
    for (var i = lanes.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = lanes[i]; lanes[i] = lanes[j]; lanes[j] = t;
    }
    var blocked = lanes.slice(0, blockedCount);
    var free = lanes.slice(blockedCount);
    var self = this;
    blocked.forEach(function (lane) {
      var kind = G.pickObstacleKind(self.distance, r);
      var ob = G.buildObstacle(kind, lane, r);
      ob.group.position.z = C.spawnAhead;
      self.scene.add(ob.group);
      self.obstacles.push({ ob: ob, z: C.spawnAhead });
      // Corn arc over a jumpable obstacle rewards the jump.
      if (!ob.dodgeOnly && !ob.slideOnly && r() < 0.6) {
        G.cornLine(lane, 5, true).forEach(function (p) {
          p.group.position.set(C.laneX[lane], p.y, p.z);
          self.scene.add(p.group);
          self.pickups.push(p);
        });
      }
    });
    // Corn line in a free lane, or a rare feather / power-up.
    var roll = r();
    var freeLane = free[Math.floor(r() * free.length)];
    if (roll < 0.55) {
      G.cornLine(freeLane, 5, false).forEach(function (p) {
        p.group.position.set(C.laneX[freeLane], p.y, p.z);
        self.scene.add(p.group);
        self.pickups.push(p);
      });
    } else if (roll < 0.63) {
      var feather = G.buildFeather();
      feather.position.set(C.laneX[freeLane], 1.1, C.spawnAhead);
      self.scene.add(feather);
      self.pickups.push({ group: feather, lane: freeLane, z: C.spawnAhead, y: 1.1, taken: false });
    } else if (roll < 0.70) {
      var power = r() < 0.5 ? G.buildMagnet() : G.buildShoes();
      power.position.set(C.laneX[freeLane], 1.0, C.spawnAhead);
      self.scene.add(power);
      self.pickups.push({ group: power, lane: freeLane, z: C.spawnAhead, y: 1.0, taken: false });
    }
    var plan = G.spawnPlan(this.distance);
    this.nextObstacleAt = this.distance + plan.gapMin + r() * (plan.gapMax - plan.gapMin);
  };

  /* ---------------- stumble / caught ---------------- */
  Game.prototype.stumble = function (reason) {
    if (this.invincibleTimer > 0 || this.power === 'shoes') return;
    this.lives--;
    this.danger = Math.min(100, this.danger + C.dangerPerStumble);
    this.timeSinceStumble = 0;
    this.invincibleTimer = C.stumbleInvincible;
    this.shakeTime = 0.45;
    this.sound.stumble();
    this.hud.flashHit();
    this.hud.toast(reason === 'knife' ? 'OUCH! THE KNIFE!' : 'STUMBLE!');
    if (this.lives <= 0) this.endRun(false);
  };

  /* ---------------- per-frame ---------------- */
  Game.prototype.frame = function (dt) {
    this.time += dt;
    if (this.state === 'paused') {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    var playing = this.state === 'playing';
    var attract = this.state === 'title';
    var speedTarget = 0;
    if (playing) {
      speedTarget = C.baseSpeed + (C.maxSpeed - C.baseSpeed) * Math.min(1, this.distance / C.speedRamp);
      if (this.power === 'shoes') speedTarget *= 1.25;
    } else if (attract) {
      speedTarget = 6;
    } else if (this.state === 'escaped') {
      speedTarget = 0;
    }
    this.speed = lerp(this.speed, speedTarget, Math.min(1, dt * 2.5));
    var speed = this.speed;

    if (playing) {
      this.distance += speed * dt;
      this.score = Math.floor(this.distance) + this.bonus;
      this.timeSinceStumble += dt;
      if (this.timeSinceStumble > 3) this.danger = Math.max(0, this.danger - C.dangerDecay * dt);
      if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
      if (this.powerTime > 0) {
        this.powerTime -= dt;
        if (this.powerTime <= 0) this.power = null;
      }
      // Zone changes.
      var zi = 0;
      for (var z = 0; z < G.ZONES.length; z++) if (this.distance >= G.ZONES[z].from) zi = z;
      if (zi !== this.zoneIndex) {
        this.zoneIndex = zi;
        this.track.applyZone(zi);
        this.hud.zoneBanner(G.ZONES[zi].name);
      }
      if (this.distance >= C.winDistance) { this.endRun(true); }
      // Spawning.
      if (this.distance >= this.nextObstacleAt) this.spawnRow();
      this.nextKnifeIn -= dt;
      if (this.nextKnifeIn <= 0) {
        this.nextKnifeIn = 13 + this.rng() * 8;
        if (this.distance > G.spawnPlan(this.distance).knifeFrom) {
          var lane = Math.floor(this.rng() * 3);
          var drop = G.makeKnifeDrop(lane, this.rng);
          drop.group.position.z = C.spawnAhead;
          this.scene.add(drop.group);
          this.knifeDrops.push(drop);
          this.sound.knife();
        }
      }
    }

    this.updatePlayer(dt, playing, speed);
    this.updateWorld(dt, speed);
    this.updateChasers(dt);
    this.updateConfetti(dt);

    if (playing) {
      this.hud.update({
        score: this.score, distance: this.distance, zone: G.ZONES[this.zoneIndex].name,
        speed: speed, lives: this.lives, danger: this.danger,
        power: this.power, powerTime: this.powerTime, powerMax: this.powerMax,
      });
    }

    // Camera: follow the turkey's lane a little, shake on stumble. On the
    // title screen the camera sits right of centre so Gus (waiting at the
    // left) clears the title panel.
    var shakeX = 0, shakeY = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      shakeX = (Math.random() - 0.5) * 0.5 * (this.shakeTime / 0.45);
      shakeY = (Math.random() - 0.5) * 0.35 * (this.shakeTime / 0.45);
    }
    var titleCam = this.state === 'title' ? 1.5 : 0;
    this.camera.position.set(this.playerX * 0.35 + shakeX + titleCam, C.cameraY + shakeY, C.cameraZ);
    this.camera.lookAt(this.playerX * 0.5 + titleCam * 0.5, 1.3, -10);
    this.renderer.render(this.scene, this.camera);
  };

  Game.prototype.updatePlayer = function (dt, playing, speed) {
    // Lane glide with overshoot.
    if (this.laneAnim) {
      this.laneAnim.t += dt / C.laneChangeTime;
      var t = Math.min(1, this.laneAnim.t);
      this.playerX = lerp(this.laneAnim.from, this.laneAnim.to, easeOutBack(t));
      if (t >= 1) this.laneAnim = null;
    }
    // Jump physics.
    if (!this.grounded) {
      this.playerVy += C.gravity * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.grounded = true;
        this.squashTimer = 0.16; // landing squash
      }
    }
    if (this.slideTimer > 0) this.slideTimer -= dt;
    if (this.squashTimer > 0) this.squashTimer -= dt;
    var squash = this.squashTimer > 0 ? this.squashTimer / 0.16 : 0;

    var mode = 'run';
    if (!this.grounded) mode = 'jump';
    else if (this.slideTimer > 0) mode = 'slide';
    if (this.state === 'caught') mode = 'run';
    var phaseSpeed = 10 + speed * 0.55;
    this.runPhase += dt * phaseSpeed;
    G.animateTurkey(this.turkey, this.runPhase, mode, squash);

    // Turkey pose: slide squashes the body, jump lifts it.
    var targetScaleY = mode === 'slide' ? 0.55 : 1;
    var targetPosY = this.playerY + (mode === 'slide' ? 0.12 : 0);
    this.turkey.group.scale.y = lerp(this.turkey.group.scale.y, targetScaleY, Math.min(1, dt * 14));
    // On the title screen Gus waits at the left of the frame, clear of the
    // title text; on the end screens he stands at the left, clear of the
    // result panel. In play he runs in his lane.
    var sceneShift = 0;
    if (this.state === 'title') sceneShift = -2.2;
    else if (this.state === 'caught' || this.state === 'escaped') sceneShift = -2.0;
    this.turkey.group.position.set(this.playerX + sceneShift, targetPosY, 0);
    var tilt = this.laneAnim ? (this.laneAnim.to - this.laneAnim.from) * -0.12 : 0;
    this.turkey.group.rotation.y = Math.PI + tilt; // face down the track
    // Blink while invincible after a stumble.
    this.turkey.group.visible = !(this.invincibleTimer > 0 && Math.floor(this.time * 12) % 2 === 0);
    // Tipped over when caught.
    if (this.state === 'caught') {
      this.turkey.group.rotation.z = lerp(this.turkey.group.rotation.z, 1.35, Math.min(1, dt * 4));
      this.turkey.group.position.y = 0.25;
    }
    // Happy hops when escaped.
    if (this.state === 'escaped') {
      this.turkey.group.position.y = Math.abs(Math.sin(this.time * 5)) * 0.9;
    }
  };

  Game.prototype.updateWorld = function (dt, speed) {
    this.track.update(dt, speed, this.time);
    var self = this;
    // Obstacles: move, collide, recycle.
    for (var i = this.obstacles.length - 1; i >= 0; i--) {
      var entry = this.obstacles[i];
      entry.z += speed * dt;
      entry.ob.group.position.z = entry.z;
      if (this.state === 'playing') this.checkObstacle(entry);
      if (entry.z > C.despawnBehind || entry.ob.passed && entry.z > 12) {
        this.scene.remove(entry.ob.group);
        this.obstacles.splice(i, 1);
      }
    }
    // Pickups: move, spin, magnet pull, collect.
    for (var j = this.pickups.length - 1; j >= 0; j--) {
      var p = this.pickups[j];
      p.z += speed * dt;
      if (this.state === 'playing' && this.power === 'magnet' && p.group.userData.kind === 'corn' && p.z > -8 && p.z < 2) {
        // Magnet yanks nearby corn toward Gus.
        p.z += (2 - p.z) * dt * 3;
        p.group.position.x = lerp(p.group.position.x, this.playerX, Math.min(1, dt * 6));
      }
      p.group.position.z = p.z;
      G.spinPickup(p, this.time);
      if (this.state === 'playing' && !p.taken && Math.abs(p.z) < 1.1 && Math.abs(p.group.position.x - this.playerX) < 1.0) {
        p.taken = true;
        this.collect(p);
      }
      if (p.z > C.despawnBehind || p.taken) {
        this.scene.remove(p.group);
        this.pickups.splice(j, 1);
      }
    }
    // Knife drops.
    for (var k = this.knifeDrops.length - 1; k >= 0; k--) {
      var drop = this.knifeDrops[k];
      G.stepKnifeDrop(drop, dt, speed);
      if (this.state === 'playing' && drop.landed && !drop.hit) {
        if (Math.abs(drop.z) < 1.0 && drop.lane === this.lane && this.playerY < 1.25) {
          drop.hit = true;
          this.stumble('knife');
        }
      }
      if (drop.done || drop.z > C.despawnBehind) {
        this.scene.remove(drop.group);
        this.knifeDrops.splice(k, 1);
      }
    }
  };

  Game.prototype.checkObstacle = function (entry) {
    var ob = entry.ob;
    if (ob.passed || ob.hit) return;
    if (Math.abs(entry.z) > 1.0) return;
    if (ob.lane !== this.lane) return;
    if (this.invincibleTimer > 0 || this.power === 'shoes') return;
    if (ob.slideOnly) {
      if (this.slideTimer <= 0) { ob.hit = true; this.stumble('branch'); }
      return;
    }
    if (ob.dodgeOnly) { ob.hit = true; this.stumble('dodge'); return; }
    // Jumpable: clear it if Gus's feet are above the top.
    if (this.playerY < ob.height - 0.35) { ob.hit = true; this.stumble('jump'); }
  };

  Game.prototype.collect = function (p) {
    var kind = p.group.userData.kind;
    if (kind === 'corn') {
      this.bonus += C.cornScore;
      this.cornCount++;
      this.sound.coin();
    } else if (kind === 'feather') {
      this.bonus += C.featherScore;
      this.sound.feather();
      this.hud.toast('GOLDEN FEATHER +50!');
    } else if (kind === 'magnet') {
      this.power = 'magnet'; this.powerTime = C.magnetTime; this.powerMax = C.magnetTime;
      this.sound.powerup();
      this.hud.toast('MAGNET!');
    } else if (kind === 'shoes') {
      this.power = 'shoes'; this.powerTime = C.shoesTime; this.powerMax = C.shoesTime;
      this.sound.powerup();
      this.hud.toast('SPEEDY SHOES!');
    }
  };

  Game.prototype.updateChasers = function (dt) {
    var speedNorm = clamp(this.speed / C.maxSpeed, 0, 1);
    if (this.state === 'playing') {
      this.farmerTargetZ = 4.7 - (this.danger / 100) * 3.6;
    }
    this.farmerZ = lerp(this.farmerZ, this.farmerTargetZ, Math.min(1, dt * 2.2));
    // Far away Bram runs off to the side, out of Gus's way; as the danger
    // meter fills he closes in right onto Gus's tail. Biscuit runs just
    // ahead of Bram, between him and Gus, so both stay in frame.
    var sideOffset = lerp(2.0, 0.7, this.danger / 100);
    var farmerX = this.playerX * 0.5 + sideOffset;
    var farmerZ = this.farmerZ;
    var dogX = farmerX + 1.0;
    var dogZ = farmerZ - 0.8;
    if (this.state === 'title') {
      farmerX = 1.9; farmerZ = 4.7; dogX = 2.9; dogZ = 3.9;
    } else if (this.state === 'caught' || this.state === 'escaped') {
      farmerX = this.playerX * 0.5 + sideOffset - 2.0; // left, clear of the panel
      farmerZ = this.farmerZ;
      dogX = farmerX + 1.0; dogZ = farmerZ - 0.8;
    }
    this.farmer.group.position.set(farmerX, 0, farmerZ);
    this.dog.group.position.set(dogX, 0, dogZ);
    G.animateFarmer(this.farmer, this.time * (9 + speedNorm * 7), speedNorm);
    G.animateDog(this.dog, this.time * (11 + speedNorm * 8));
  };

  Game.prototype.updateConfetti = function (dt) {
    if (this.state !== 'escaped') return;
    for (var i = 0; i < this.confetti.length; i++) {
      var c = this.confetti[i];
      c.position.y -= c.userData.fall * dt;
      c.rotation.x += c.userData.spin * dt;
      c.rotation.y += c.userData.spin * 0.7 * dt;
      if (c.position.y < 0.1) c.position.y = 5 + this.rng() * 4;
    }
  };

  /* ---- screenshot states (?shot=...) — real game states, jumped to
     directly so the maker can capture each screen. ---- */
  Game.prototype.applyShot = function (shot) {
    var self = this;
    if (shot === 'play') {
      this.startRun();
      this.distance = 347;
      this.score = 347;
      this.zoneIndex = 0;
      // A few obstacles and corn ahead, mid-run.
      [0, 1].forEach(function (lane) {
        var ob = G.buildObstacle(lane === 0 ? 'hay' : 'crate', lane, self.rng);
        ob.group.position.z = -30 - lane * 12;
        self.scene.add(ob.group);
        self.obstacles.push({ ob: ob, z: ob.group.position.z });
      });
      var cart = G.buildObstacle('cart', 2, self.rng);
      cart.group.position.z = -58;
      self.scene.add(cart.group);
      self.obstacles.push({ ob: cart, z: -58 });
      G.cornLine(1, 5, false).forEach(function (p) {
        p.group.position.set(C.laneX[1], p.y, p.z + 100);
        self.scene.add(p.group);
        self.pickups.push(p);
      });
    } else if (shot === 'chase') {
      this.startRun();
      this.distance = 812;
      this.score = 912;
      this.bonus = 100;
      this.lives = 1;
      this.danger = 88;
      this.farmerZ = 1.7;
      this.farmerTargetZ = 1.7;
      this.zoneIndex = 1;
      this.track.applyZone(1, true);
      var knife = G.makeKnifeDrop(1, this.rng);
      knife.group.position.z = -16;
      knife.z = -16;
      this.scene.add(knife.group);
      this.knifeDrops.push(knife);
      var oven = G.buildObstacle('oven', 0, this.rng);
      oven.group.position.z = -22;
      this.scene.add(oven.group);
      this.obstacles.push({ ob: oven, z: -22 });
    } else if (shot === 'caught') {
      this.startRun();
      this.distance = 642;
      this.score = 718;
      this.bonus = 76;
      this.cornCount = 7;
      this.lives = 0;
      this.danger = 100;
      this.endRun(false);
      this.farmerZ = 1.2; // Bram is already on Gus for the shot (no slow lerp)
    } else if (shot === 'escaped') {
      this.startRun();
      this.distance = 2000;
      this.score = 2310;
      this.bonus = 310;
      this.cornCount = 24;
      this.endRun(true);
    }
    // Title is the default: no shot needed.
  };

  window.addEventListener('load', function () {
    window.__GOBBLE_GAME__ = new Game();
  });
})();
