/* GOBBLE DASH — all scenery props, built from primitives in bright autumn
   colours. One job: factories for the things that line the track. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  function mat(color) {
    return new THREE.MeshLambertMaterial({ color: color, roughness: 0.9 });
  }
  function mesh(geo, color, x, y, z) {
    var m = new THREE.Mesh(geo, mat(color));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }

  /* Autumn tree: brown trunk + 2-3 blazing foliage spheres. */
  G.makeTree = function (rng) {
    var g = new THREE.Group();
    var trunk = mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.6, 8), 0x7a4a22, 0, 0.8, 0);
    g.add(trunk);
    var colors = [0xff7f00, 0xe62020, 0xffc21c, 0xff5e00];
    var c = colors[Math.floor(rng() * colors.length)];
    var c2 = colors[Math.floor(rng() * colors.length)];
    g.add(mesh(new THREE.SphereGeometry(1.15, 12, 10), c, 0, 2.3, 0));
    g.add(mesh(new THREE.SphereGeometry(0.8, 12, 10), c2, 0.55, 1.85, 0.25));
    g.add(mesh(new THREE.SphereGeometry(0.7, 12, 10), c, -0.5, 1.9, -0.2));
    var s = 0.9 + rng() * 0.7;
    g.scale.set(s, s, s);
    return g;
  };

  /* Red barn with white trim and a gambrel-ish roof. */
  G.makeBarn = function () {
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(5, 3.2, 4), 0xe62020, 0, 1.6, 0));
    var roof = mesh(new THREE.ConeGeometry(3.6, 1.8, 4), 0x8a2f2f, 0, 4.1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.15, 1, 0.95);
    g.add(roof);
    g.add(mesh(new THREE.BoxGeometry(1.6, 2.2, 0.15), 0xffffff, 0, 1.1, 2.02));
    g.add(mesh(new THREE.BoxGeometry(0.15, 2.2, 0.2), 0x8a2f2f, 0, 1.1, 2.05));
    g.add(mesh(new THREE.BoxGeometry(1.1, 1.1, 0.15), 0xffd23e, 0, 3.0, 2.02));
    return g;
  };

  /* Glowing orange pumpkin with ridges and a green stem. */
  G.makePumpkin = function (rng) {
    var g = new THREE.Group();
    var body = mesh(new THREE.SphereGeometry(0.55, 14, 10), 0xff7f00, 0, 0.42, 0);
    body.scale.set(1, 0.85, 1);
    g.add(body);
    for (var i = 0; i < 5; i++) {
      var ridge = mesh(new THREE.TorusGeometry(0.52, 0.045, 6, 14), 0xe66a00, 0, 0.42, 0);
      ridge.rotation.y = (i / 5) * Math.PI;
      ridge.scale.set(1, 0.85, 1);
      g.add(ridge);
    }
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.3, 6), 0x2fae3e, 0, 0.95, 0));
    // Jack-o-lantern face on some pumpkins.
    if (rng() < 0.45) {
      [-1, 1].forEach(function (s) {
        g.add(mesh(new THREE.ConeGeometry(0.07, 0.12, 4), 0x1a1a1a, 0.18 * s, 0.55, 0.5));
      });
      g.add(mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), 0x1a1a1a, 0, 0.32, 0.52));
    }
    var s = 0.8 + rng() * 0.6;
    g.scale.set(s, s, s);
    return g;
  };

  /* Corn stalk: tall green stem, golden cob, long leaves. */
  G.makeCornStalk = function (rng) {
    var g = new THREE.Group();
    var h = 2.2 + rng() * 0.9;
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 6), 0x2fae3e, 0, h / 2, 0));
    var cob = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 8), 0xffd23e, 0.18, h * 0.62, 0);
    cob.rotation.z = 0.4;
    g.add(cob);
    for (var i = 0; i < 3; i++) {
      var leaf = mesh(new THREE.BoxGeometry(0.12, 1.1, 0.3), 0x39c24a, (rng() - 0.5) * 0.5, h * (0.4 + i * 0.2), 0);
      leaf.rotation.z = (rng() - 0.5) * 1.2;
      g.add(leaf);
    }
    return g;
  };

  /* White picket fence segment, 4 m long. */
  G.makeFence = function () {
    var g = new THREE.Group();
    for (var i = 0; i < 6; i++) {
      var picket = mesh(new THREE.BoxGeometry(0.14, 0.9, 0.06), 0xffffff, -1.75 + i * 0.7, 0.45, 0);
      g.add(picket);
      var tip = mesh(new THREE.ConeGeometry(0.1, 0.16, 4), 0xffffff, -1.75 + i * 0.7, 0.98, 0);
      tip.rotation.y = Math.PI / 4;
      g.add(tip);
    }
    g.add(mesh(new THREE.BoxGeometry(4.1, 0.09, 0.05), 0xffffff, 0, 0.32, 0));
    g.add(mesh(new THREE.BoxGeometry(4.1, 0.09, 0.05), 0xffffff, 0, 0.68, 0));
    return g;
  };

  /* Hay bale: golden cylinder lying on its side. */
  G.makeHayBale = function () {
    var g = new THREE.Group();
    var bale = mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.1, 14), 0xffc21c, 0, 0.75, 0);
    bale.rotation.z = Math.PI / 2;
    g.add(bale);
    var ring = mesh(new THREE.TorusGeometry(0.75, 0.05, 6, 18), 0xe6a800, 0, 0.75, 0.56);
    g.add(ring);
    var ring2 = mesh(new THREE.TorusGeometry(0.75, 0.05, 6, 18), 0xe6a800, 0, 0.75, -0.56);
    g.add(ring2);
    return g;
  };

  /* Kitchen props, giant-sized so the turkey runs between table legs:
     a red oven, a pot, a spoon, a table leg. */
  G.makeOven = function () {
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(2.6, 2.6, 1.4), 0xd21f1f, 0, 1.3, 0));
    g.add(mesh(new THREE.BoxGeometry(2.2, 1.4, 0.1), 0x222222, 0, 1.25, 0.72));
    // Glowing orange window: the turkey's doom, lit from inside.
    var win = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xff9d00 }));
    win.position.set(0, 1.25, 0.78);
    g.add(win);
    g.add(mesh(new THREE.BoxGeometry(2.6, 0.25, 1.5), 0x8a8a8a, 0, 2.72, 0));
    [-1, 1].forEach(function (s) {
      g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), 0xd8d8d8, 0.9 * s, 2.6, 0.75));
    });
    // Steam puffs above the oven (animated in track.js via userData.steam).
    var steam = [];
    for (var i = 0; i < 4; i++) {
      var puff = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
      puff.position.set((Math.random() - 0.5) * 1.2, 3.1 + i * 0.45, 0);
      g.add(puff);
      steam.push(puff);
    }
    g.userData.steam = steam;
    return g;
  };

  G.makeKitchenProp = function (kind, rng) {
    var g = new THREE.Group();
    if (kind === 'pot') {
      g.add(mesh(new THREE.CylinderGeometry(1.1, 0.9, 1.0, 14), 0x3a3a3a, 0, 0.5, 0));
      g.add(mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 14), 0x555555, 0, 1.05, 0));
      [-1, 1].forEach(function (s) {
        var h = mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 12), 0x222222, 1.15 * s, 0.7, 0);
        h.rotation.y = Math.PI / 2;
        g.add(h);
      });
    } else if (kind === 'spoon') {
      var handle = mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8), 0x8a5a2b, 0, 1.3, 0);
      handle.rotation.z = 0.25;
      g.add(handle);
      var bowl = mesh(new THREE.SphereGeometry(0.42, 12, 10), 0x8a5a2b, -0.32, 2.75, 0);
      bowl.scale.set(1, 1.35, 0.4);
      g.add(bowl);
    } else if (kind === 'table') {
      g.add(mesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), 0x8a5a2b, 0, 2.25, 0));
      g.add(mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), 0x6b4423, 0, 0.15, 0));
    } else { // rolling pin
      var pin = mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.2, 12), 0xf2d8a0, 0, 0.6, 0);
      pin.rotation.z = Math.PI / 2;
      g.add(pin);
      [-1, 1].forEach(function (s) {
        var knob = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), 0x8a5a2b, 1.35 * s, 0.6, 0);
        knob.rotation.z = Math.PI / 2;
        g.add(knob);
      });
    }
    var s = 0.9 + rng() * 0.5;
    g.scale.set(s, s, s);
    return g;
  };

  /* Fluffy white cloud, drifting slowly. Basic material keeps it white
     instead of tinted by the hemisphere light. */
  G.makeCloud = function (rng) {
    var g = new THREE.Group();
    var m = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [[0, 0, 0, 1.4], [1.2, 0.2, 0.2, 1.0], [-1.2, 0.15, -0.1, 0.95], [0.4, 0.55, -0.2, 0.9]].forEach(function (b) {
      var s = new THREE.Mesh(new THREE.SphereGeometry(b[3], 10, 8), m);
      s.position.set(b[0], b[1], b[2]);
      s.scale.y = 0.55;
      g.add(s);
    });
    g.position.set((rng() - 0.5) * 70, 14 + rng() * 8, -40 - rng() * 80);
    return g;
  };

  /* Simple bird: two flapping triangle wings + body. */
  G.makeBird = function () {
    var g = new THREE.Group();
    var m = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 6), m);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    var wings = [];
    [-1, 1].forEach(function (s) {
      var w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshLambertMaterial({ color: 0x222222, side: THREE.DoubleSide }));
      w.position.x = 0.45 * s;
      g.add(w);
      wings.push(w);
    });
    g.userData.wings = wings;
    return g;
  };

  /* One falling leaf: small coloured plane, spun by the wind. */
  G.makeLeaf = function (rng) {
    var colors = [0xff7f00, 0xe62020, 0xffc21c, 0xffd23e];
    var leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28),
      new THREE.MeshLambertMaterial({ color: colors[Math.floor(rng() * colors.length)], side: THREE.DoubleSide }));
    leaf.position.set((rng() - 0.5) * 30, 3 + rng() * 6, -20 - rng() * 90);
    leaf.userData.spin = 1 + rng() * 2;
    leaf.userData.fall = 0.6 + rng() * 0.8;
    leaf.userData.sway = rng() * Math.PI * 2;
    return leaf;
  };
})();
