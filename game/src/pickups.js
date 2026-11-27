/* GOBBLE DASH — pickups: golden corn (+10), golden feathers (+50),
   the magnet (pulls corn in) and the speedy shoes (faster + invincible).
   Corn spawns in arcs and lines so a good line pays off. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  function mat(color, emissive) {
    return new THREE.MeshLambertMaterial({ color: color, emissive: emissive || 0x000000, roughness: 0.6 });
  }

  G.buildCorn = function () {
    var g = new THREE.Group();
    var cob = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 10), mat(0xffd23e, 0x553300));
    cob.rotation.x = Math.PI / 2.4;
    cob.castShadow = true;
    g.add(cob);
    // Kernels: little gold bumps along the cob.
    for (var i = 0; i < 6; i++) {
      var k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat(0xffe45e, 0x664400));
      k.position.set(Math.cos(i * 1.1) * 0.14, Math.sin(i * 1.1) * 0.14, -0.2 + i * 0.08);
      g.add(k);
    }
    // Green husk leaves at the base.
    [-1, 1].forEach(function (s) {
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), mat(0x2fae3e));
      leaf.rotation.z = s * 0.7;
      leaf.position.set(0.14 * s, -0.28, -0.1);
      g.add(leaf);
    });
    g.userData.kind = 'corn';
    g.userData.value = G.CONFIG.cornScore;
    return g;
  };

  G.buildFeather = function () {
    var g = new THREE.Group();
    var f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.85, 8), mat(0xffd23e, 0x664400));
    f.scale.set(1, 1, 0.3);
    f.castShadow = true;
    g.add(f);
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), mat(0xffffff));
    shaft.position.y = -0.1;
    g.add(shaft);
    // Sparkle ring so the rare pickup reads at a glance.
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 6, 20),
      new THREE.MeshBasicMaterial({ color: 0xffe45e }));
    g.add(ring);
    g.userData.kind = 'feather';
    g.userData.value = G.CONFIG.featherScore;
    g.userData.ring = ring;
    return g;
  };

  G.buildMagnet = function () {
    var g = new THREE.Group();
    var horseshoe = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.16, 10, 18, Math.PI), mat(0xe62020, 0x330000));
    horseshoe.rotation.z = Math.PI;
    horseshoe.castShadow = true;
    g.add(horseshoe);
    [-1, 1].forEach(function (s) {
      var tip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(0xd8d8d8));
      tip.position.set(0.42 * s, -0.42, 0);
      g.add(tip);
    });
    g.userData.kind = 'magnet';
    g.userData.power = 'magnet';
    return g;
  };

  G.buildShoes = function () {
    var g = new THREE.Group();
    // One red speedy sneaker with a white wing.
    var sole = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.85), mat(0xffffff));
    sole.position.y = 0.07;
    g.add(sole);
    var upper = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.7), mat(0xe62020, 0x330000));
    upper.position.set(0, 0.28, -0.05);
    upper.castShadow = true;
    g.add(upper);
    var wing = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), mat(0xffffff));
    wing.rotation.z = Math.PI / 2;
    wing.position.set(-0.3, 0.35, -0.1);
    g.add(wing);
    g.userData.kind = 'shoes';
    g.userData.power = 'shoes';
    return g;
  };

  /* A line of corn in one lane, or an arc over a jumpable obstacle. */
  G.cornLine = function (lane, count, arc) {
    var out = [];
    for (var i = 0; i < count; i++) {
      var corn = G.buildCorn();
      var y = 0.9;
      if (arc) y = 0.9 + Math.sin((i / (count - 1)) * Math.PI) * 1.1;
      out.push({ group: corn, lane: lane, z: G.CONFIG.spawnAhead - i * 2.2, y: y, taken: false });
    }
    return out;
  };

  /* Spin + bob for a pickup, called every frame. */
  G.spinPickup = function (pickup, time) {
    pickup.group.rotation.y = time * 2.4;
    pickup.group.position.y = pickup.y + Math.sin(time * 3 + pickup.z) * 0.12;
    if (pickup.group.userData.ring) {
      pickup.group.userData.ring.rotation.x = time * 1.5;
      pickup.group.userData.ring.rotation.y = time * 2;
    }
  };
})();
