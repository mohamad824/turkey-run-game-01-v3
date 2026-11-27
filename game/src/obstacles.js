/* GOBBLE DASH — obstacles: what Gus must jump, slide under, or dodge.
   Each obstacle carries its lane, height and rule; collision is a small
   AABB test in game.js. The falling carving knife telegraphs with a red
   shadow on the ground before it lands. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  function mat(color) {
    return new THREE.MeshLambertMaterial({ color: color, roughness: 0.9 });
  }
  function box(w, h, d, color, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  }

  /* Build one obstacle of `kind` in `lane`. Returns an object with the
     group plus collision data: height (jump clearance needed), slideOnly
     (must slide under), dodgeOnly (cannot jump or slide past). */
  G.buildObstacle = function (kind, lane, rng) {
    var g = new THREE.Group();
    var ob = { group: g, kind: kind, lane: lane, height: 1, slideOnly: false, dodgeOnly: false, passed: false, hit: false };

    if (kind === 'hay') {
      g.add(G.makeHayBale());
      ob.height = 1.35;
    } else if (kind === 'crate') {
      g.add(box(1.15, 1.15, 1.15, 0xb5772f, 0, 0.58, 0));
      g.add(box(1.25, 0.12, 1.25, 0x8a5a2b, 0, 1.18, 0));
      g.add(box(1.25, 0.12, 1.25, 0x8a5a2b, 0, 0.06, 0));
      ob.height = 1.25;
    } else if (kind === 'fence') {
      g.add(box(2.2, 0.14, 0.1, 0xffffff, 0, 0.95, 0));
      g.add(box(2.2, 0.14, 0.1, 0xffffff, 0, 0.5, 0));
      [-1, 1].forEach(function (s) {
        g.add(box(0.14, 1.05, 0.14, 0xffffff, 1.0 * s, 0.52, 0));
      });
      ob.height = 1.05;
    } else if (kind === 'branch') {
      // Low hanging branch with autumn leaves: too low to jump over the
      // gap beneath — slide under it. Clearance 0.85 m.
      g.add(box(2.4, 0.22, 0.5, 0x7a4a22, 0, 1.35, 0));
      for (var i = 0; i < 6; i++) {
        var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat([0xff7f00, 0xe62020, 0xffc21c][i % 3]));
        leaf.position.set(-1 + i * 0.4, 1.55 + (rng() - 0.5) * 0.2, (rng() - 0.5) * 0.3);
        leaf.castShadow = true;
        g.add(leaf);
      }
      [-1, 1].forEach(function (s) {
        g.add(box(0.18, 1.5, 0.18, 0x7a4a22, 1.15 * s, 0.75, 0));
      });
      ob.height = 0.0; // not jumpable: the gap is underneath
      ob.slideOnly = true;
    } else if (kind === 'cart') {
      // Farm cart: tall, wide, full of pumpkins — must switch lane.
      g.add(box(2.1, 0.9, 1.3, 0x8a5a2b, 0, 0.75, 0));
      g.add(box(2.2, 0.16, 1.4, 0x6b4423, 0, 1.28, 0));
      var wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12);
      [-1, 1].forEach(function (s) {
        var wheel = new THREE.Mesh(wheelGeo, mat(0x5a3418));
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(1.05 * s, 0.42, 0);
        wheel.castShadow = true;
        g.add(wheel);
      });
      for (var p = 0; p < 3; p++) {
        var pumpkin = G.makePumpkin(rng);
        pumpkin.position.set(-0.6 + p * 0.6, 1.35, (rng() - 0.5) * 0.4);
        pumpkin.scale.set(0.7, 0.7, 0.7);
        g.add(pumpkin);
      }
      g.add(box(0.14, 0.9, 0.14, 0x8a5a2b, -0.9, 0.45, 0.85));
      ob.height = 2.4;
      ob.dodgeOnly = true;
    } else if (kind === 'oven') {
      var oven = G.makeOven();
      g.add(oven);
      ob.height = 2.8;
      ob.dodgeOnly = true;
      ob.steam = oven.userData.steam;
    } else if (kind === 'knife') {
      // Carving knife stuck in the dirt: blade up, jumpable once landed.
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.34), mat(0xd8d8d8));
      blade.position.set(0, 0.85, 0);
      blade.rotation.z = 0.12;
      blade.castShadow = true;
      g.add(blade);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.35, 4), mat(0xbdbdbd));
      tip.position.set(-0.07, 1.55, 0);
      tip.rotation.z = 0.12;
      g.add(tip);
      var handle = box(0.14, 0.55, 0.2, 0x222222, 0.07, 0.28, 0);
      handle.rotation.z = 0.12;
      g.add(handle);
      ob.height = 1.6;
      ob.isKnife = true;
    }
    g.position.x = G.CONFIG.laneX[lane];
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return ob;
  };

  /* Pick a kind from the spawn weights for this distance. */
  G.pickObstacleKind = function (distance, rng) {
    var plan = G.spawnPlan(distance);
    var roll = rng();
    var acc = 0;
    var kinds = Object.keys(plan.weights);
    for (var i = 0; i < kinds.length; i++) {
      acc += plan.weights[kinds[i]];
      if (roll <= acc) return kinds[i];
    }
    return 'hay';
  };

  /* A falling knife: red telegraph circle on the ground, then the knife
     drops in and sticks. Returns a controller the game steps each frame. */
  G.makeKnifeDrop = function (lane, rng) {
    var group = new THREE.Group();
    group.position.x = G.CONFIG.laneX[lane];
    // Telegraph: pulsing red disc where the knife will land.
    var tele = new THREE.Mesh(new THREE.CircleGeometry(0.85, 24),
      new THREE.MeshBasicMaterial({ color: 0xff2e2e, transparent: true, opacity: 0.6 }));
    tele.rotation.x = -Math.PI / 2;
    tele.position.y = 0.05;
    group.add(tele);
    // The knife itself, waiting high above.
    var knife = G.buildObstacle('knife', lane, rng);
    knife.group.position.set(0, 14, 0);
    group.add(knife.group);
    return {
      group: group, lane: lane, knife: knife,
      state: 'telegraph', timer: 0.85, z: G.CONFIG.spawnAhead,
      landed: false, done: false,
    };
  };

  G.stepKnifeDrop = function (drop, dt, speed) {
    drop.z += speed * dt;
    drop.group.position.z = drop.z;
    if (drop.state === 'telegraph') {
      drop.timer -= dt;
      var pulse = 0.45 + Math.sin(drop.timer * 18) * 0.2;
      drop.group.children[0].material.opacity = pulse;
      drop.group.children[0].scale.setScalar(1 + (0.85 - drop.timer) * 0.25);
      if (drop.timer <= 0) {
        drop.state = 'falling';
        drop.knife.group.position.y = 14;
      }
    } else if (drop.state === 'falling') {
      drop.knife.group.position.y -= 42 * dt;
      if (drop.knife.group.position.y <= 0) {
        drop.knife.group.position.y = 0;
        drop.state = 'stuck';
        drop.landed = true;
        drop.timer = 2.2; // sticks in the ground, then vanishes
      }
    } else if (drop.state === 'stuck') {
      drop.timer -= dt;
      if (drop.timer <= 0) drop.done = true;
    }
    return drop;
  };
})();
