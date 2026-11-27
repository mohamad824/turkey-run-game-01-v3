/* GOBBLE DASH — the world that runs past Gus: recycling track segments,
   side scenery per zone, sky/fog colour, clouds, birds and falling leaves.
   The turkey stays near z = 0; the world moves toward the camera. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  var SEG_LEN = 24;          // metres per ground segment
  var SEG_COUNT = 8;         // segments kept alive

  function Track(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.zoneIndex = 0;
    this.segments = [];
    this.clouds = [];
    this.birds = [];
    this.leaves = [];
    this.steamPuffs = [];
    this.sun = null;
    this.hemi = null;
    this.groundMat = null;
    this.skyMesh = null;
    this.buildLights();
    this.buildSky();
    this.buildSegments();
    this.buildAmbient();
    this.applyZone(0, true);
  }

  Track.prototype.buildLights = function () {
    this.hemi = new THREE.HemisphereLight(0xbfe3ff, 0x3a7d2c, 0.95);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2b0, 1.35);
    this.sun.position.set(8, 16, 6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -16;
    this.sun.shadow.camera.right = 16;
    this.sun.shadow.camera.top = 20;
    this.sun.shadow.camera.bottom = -30;
    this.sun.shadow.camera.far = 60;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
  };

  Track.prototype.buildSky = function () {
    // Big sky dome: its colour is the zone's sky, seen past the track.
    var geo = new THREE.SphereGeometry(220, 16, 12);
    var mat = new THREE.MeshBasicMaterial({ color: 0x2f9df0, side: THREE.BackSide, fog: false });
    this.skyMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.skyMesh);
    // The sun: a bright yellow disc with a glow ring.
    var sunGroup = new THREE.Group();
    var disc = new THREE.Mesh(new THREE.CircleGeometry(5, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, fog: false }));
    var glow = new THREE.Mesh(new THREE.CircleGeometry(8, 24),
      new THREE.MeshBasicMaterial({ color: 0xffe45e, transparent: true, opacity: 0.35, fog: false }));
    glow.position.z = -0.5;
    sunGroup.add(glow);
    sunGroup.add(disc);
    sunGroup.position.set(-38, 34, -160);
    this.scene.add(sunGroup);
    this.sunDisc = sunGroup;
    this.scene.fog = new THREE.Fog(0x9fd8ff, 55, 150);
  };

  Track.prototype.buildSegments = function () {
    var self = this;
    this.groundMat = new THREE.MeshLambertMaterial({ color: 0x39c24a });
    for (var i = 0; i < SEG_COUNT; i++) {
      var seg = new THREE.Group();
      // Ground slab: vivid grass with a pale dirt track down the middle.
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(70, SEG_LEN), this.groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      seg.add(ground);
      var dirt = new THREE.Mesh(new THREE.PlaneGeometry(9.4, SEG_LEN),
        new THREE.MeshLambertMaterial({ color: 0xd9a066 }));
      dirt.rotation.x = -Math.PI / 2;
      dirt.position.y = 0.02;
      dirt.receiveShadow = true;
      seg.add(dirt);
      // Lane dashes: white, one per lane gap.
      [-1.17, 1.17].forEach(function (x) {
        for (var d = 0; d < 4; d++) {
          var dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 2.2),
            new THREE.MeshBasicMaterial({ color: 0xffffff }));
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(x, 0.04, -SEG_LEN / 2 + 3 + d * 6);
          seg.add(dash);
        }
      });
      seg.position.z = -i * SEG_LEN + SEG_LEN / 2 + 14;
      seg.userData.props = [];
      this.scene.add(seg);
      this.segments.push(seg);
      this.decorateSegment(seg, true);
    }
  };

  /* Fill a segment's sides with zone-appropriate props. */
  Track.prototype.decorateSegment = function (seg, first) {
    var rng = this.rng;
    var zone = G.ZONES[this.zoneIndex];
    var self = this;
    seg.userData.props.forEach(function (p) { seg.remove(p); });
    seg.userData.props = [];
    function addProp(obj, x, z) {
      obj.position.x = x;
      obj.position.z = z;
      seg.add(obj);
      seg.userData.props.push(obj);
    }
    var side = function () { return (rng() < 0.5 ? -1 : 1) * (6.5 + rng() * 9); };
    if (zone.name === 'FARMYARD') {
      if (rng() < 0.55) addProp(G.makeTree(rng), side(), (rng() - 0.5) * 16);
      if (rng() < 0.4) addProp(G.makePumpkin(rng), (rng() < 0.5 ? -1 : 1) * (5.2 + rng() * 1.5), (rng() - 0.5) * 18);
      if (rng() < 0.5) addProp(G.makeFence(), (rng() < 0.5 ? -1 : 1) * 5.6, (rng() - 0.5) * 10);
      if (rng() < 0.14 && !first) addProp(G.makeBarn(), (rng() < 0.5 ? -1 : 1) * 13, 0);
      if (rng() < 0.3) addProp(G.makeHayBale(), (rng() < 0.5 ? -1 : 1) * (5.4 + rng()), (rng() - 0.5) * 16);
    } else if (zone.name === 'CORNFIELD') {
      for (var i = 0; i < 7; i++) {
        addProp(G.makeCornStalk(rng), (rng() < 0.5 ? -1 : 1) * (5.6 + rng() * 7), -10 + i * 3.2 + rng());
      }
      if (rng() < 0.35) addProp(G.makePumpkin(rng), (rng() < 0.5 ? -1 : 1) * 5.4, (rng() - 0.5) * 16);
      if (rng() < 0.3) addProp(G.makeHayBale(), (rng() < 0.5 ? -1 : 1) * (6 + rng() * 4), (rng() - 0.5) * 14);
    } else if (zone.name === 'WILD WOODS') {
      for (var j = 0; j < 5; j++) {
        addProp(G.makeTree(rng), (rng() < 0.5 ? -1 : 1) * (5.8 + rng() * 8), -10 + j * 4.5 + rng() * 2);
      }
      if (rng() < 0.4) addProp(G.makePumpkin(rng), (rng() < 0.5 ? -1 : 1) * 5.3, (rng() - 0.5) * 16);
    } else { // KITCHEN — giant table legs, pots, spoons, rolling pins
      var kinds = ['pot', 'spoon', 'table', 'pin'];
      for (var k = 0; k < 3; k++) {
        addProp(G.makeKitchenProp(kinds[Math.floor(rng() * kinds.length)], rng),
          (rng() < 0.5 ? -1 : 1) * (6.5 + rng() * 6), -9 + k * 8 + rng() * 3);
      }
      if (rng() < 0.3) addProp(G.makeOven(), (rng() < 0.5 ? -1 : 1) * 9, (rng() - 0.5) * 10);
    }
    // Steam from any oven prop on this segment.
    seg.userData.props.forEach(function (p) {
      if (p.userData.steam) self.steamPuffs.push.apply(self.steamPuffs, p.userData.steam);
    });
  };

  Track.prototype.buildAmbient = function () {
    var self = this;
    for (var i = 0; i < 7; i++) {
      var c = G.makeCloud(this.rng);
      this.scene.add(c);
      this.clouds.push(c);
    }
    for (var j = 0; j < 4; j++) {
      var b = G.makeBird();
      b.position.set((this.rng() - 0.5) * 50, 10 + this.rng() * 8, -30 - this.rng() * 60);
      this.scene.add(b);
      this.birds.push(b);
    }
    for (var k = 0; k < 26; k++) {
      var leaf = G.makeLeaf(this.rng);
      this.scene.add(leaf);
      this.leaves.push(leaf);
    }
  };

  Track.prototype.applyZone = function (index, instant) {
    this.zoneIndex = index;
    var z = G.ZONES[index];
    this.skyMesh.material.color.setHex(z.sky);
    this.scene.fog.color.setHex(z.fog);
    this.groundMat.color.setHex(z.ground);
    this.sun.color.setHex(z.sun);
    this.hemi.groundColor.setHex(z.groundSide);
  };

  /* Move the world; recycle segments that pass behind the camera. */
  Track.prototype.update = function (dt, speed, time) {
    var move = speed * dt;
    var self = this;
    this.segments.forEach(function (seg) {
      seg.position.z += move;
      if (seg.position.z - SEG_LEN / 2 > 20) {
        seg.position.z -= SEG_LEN * SEG_COUNT;
        self.decorateSegment(seg, false);
      }
    });
    this.clouds.forEach(function (c) {
      c.position.x += dt * 0.7;
      c.position.z += move * 0.15;
      if (c.position.x > 45) c.position.x = -45;
      if (c.position.z > 20) c.position.z = -120;
    });
    this.birds.forEach(function (b, i) {
      b.position.z += move * 0.55 + dt * 3;
      b.position.x += Math.sin(time * 0.8 + i * 2) * dt * 1.5;
      var flap = Math.sin(time * 9 + i * 3) * 0.6;
      b.userData.wings[0].rotation.z = flap;
      b.userData.wings[1].rotation.z = -flap;
      if (b.position.z > 15) {
        b.position.z = -90 - self.rng() * 40;
        b.position.x = (self.rng() - 0.5) * 50;
      }
    });
    this.leaves.forEach(function (leaf) {
      leaf.position.y -= leaf.userData.fall * dt;
      leaf.position.z += move * 0.9;
      leaf.position.x += Math.sin(time * 1.5 + leaf.userData.sway) * dt * 1.2;
      leaf.rotation.x += leaf.userData.spin * dt;
      leaf.rotation.y += leaf.userData.spin * 0.7 * dt;
      if (leaf.position.y < 0.1 || leaf.position.z > 15) {
        leaf.position.y = 4 + self.rng() * 5;
        leaf.position.z = -60 - self.rng() * 50;
        leaf.position.x = (self.rng() - 0.5) * 30;
      }
    });
    // Steam puffs rise and swell.
    this.steamPuffs.forEach(function (puff, i) {
      puff.position.y += dt * 0.8;
      var s = 1 + Math.sin(time * 2 + i) * 0.15;
      puff.scale.set(s, s, s);
      if (puff.position.y > 5.4) puff.position.y = 3.1;
    });
  };

  G.Track = Track;
})();
