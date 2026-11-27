/* GOBBLE DASH — Farmer Bram and his dog Biscuit, the chase behind Gus.
   Both built from primitives: straw hat, plaid shirt, denim overalls,
   pitchfork for Bram; long ears and a wagging tail for Biscuit. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  function mat(color) {
    return new THREE.MeshLambertMaterial({ color: color, roughness: 0.9 });
  }

  G.buildFarmer = function () {
    var g = new THREE.Group();
    var parts = {};

    // Legs: denim blue, running scissor.
    parts.legs = [];
    [-1, 1].forEach(function (s) {
      var pivot = new THREE.Group();
      pivot.position.set(0.22 * s, 0.95, 0);
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.95, 0.34), mat(0x2f5fd1));
      leg.position.y = -0.48;
      leg.castShadow = true;
      pivot.add(leg);
      var boot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.5), mat(0x5a3418));
      boot.position.set(0, -0.95, 0.08);
      pivot.add(boot);
      g.add(pivot);
      parts.legs.push(pivot);
    });

    // Torso: red plaid shirt — red box with white stripe boxes.
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.9, 0.55), mat(0xd21f1f));
    torso.position.y = 1.45;
    torso.castShadow = true;
    g.add(torso);
    parts.torso = torso;
    [-0.22, 0.22].forEach(function (x) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.57), mat(0xffffff));
      stripe.position.set(x, 1.45, 0);
      g.add(stripe);
    });
    var hStripe = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.09, 0.57), mat(0xffffff));
    hStripe.position.set(0, 1.55, 0);
    g.add(hStripe);
    // Denim overall straps.
    [-1, 1].forEach(function (s) {
      var strap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.56), mat(0x2f5fd1));
      strap.position.set(0.28 * s, 1.75, 0);
      g.add(strap);
    });

    // Arms: red sleeves, one pumping, one holding the pitchfork.
    parts.arms = [];
    [-1, 1].forEach(function (s) {
      var pivot = new THREE.Group();
      pivot.position.set(0.55 * s, 1.8, 0);
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), mat(0xd21f1f));
      arm.position.y = -0.35;
      arm.castShadow = true;
      pivot.add(arm);
      var hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(0xf2c89b));
      hand.position.y = -0.75;
      pivot.add(hand);
      g.add(pivot);
      parts.arms.push(pivot);
    });

    // Head: round, with a big white beard and angry eyes.
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), mat(0xf2c89b));
    head.position.y = 2.25;
    head.castShadow = true;
    g.add(head);
    parts.head = head;
    var beard = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 10), mat(0xffffff));
    beard.rotation.x = Math.PI;
    beard.position.set(0, 1.98, 0.18);
    g.add(beard);
    [-1, 1].forEach(function (s) {
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(0x111111));
      eye.position.set(0.12 * s, 2.32, 0.3);
      g.add(eye);
      var brow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), mat(0x7a4a22));
      brow.position.set(0.12 * s, 2.42, 0.3);
      brow.rotation.z = s * -0.4;
      g.add(brow);
    });
    var nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat(0xe89b6b));
    nose.position.set(0, 2.22, 0.34);
    g.add(nose);

    // Straw hat: wide yellow brim + cone crown.
    var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.06, 16), mat(0xffd23e));
    brim.position.y = 2.52;
    brim.castShadow = true;
    g.add(brim);
    var crown = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.34, 12), mat(0xffd23e));
    crown.position.y = 2.7;
    g.add(crown);
    var band = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), mat(0xd21f1f));
    band.position.y = 2.58;
    g.add(band);

    // Pitchfork: wooden handle + three steel prongs, held in the right hand.
    var fork = new THREE.Group();
    var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8), mat(0x8a5a2b));
    fork.add(handle);
    [-0.14, 0, 0.14].forEach(function (x) {
      var prong = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.42, 6), mat(0xd8d8d8));
      prong.position.set(x, 1.12, 0);
      fork.add(prong);
    });
    fork.position.set(0.62, 1.35, 0.35);
    fork.rotation.x = -0.35;
    g.add(fork);
    parts.fork = fork;

    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, parts: parts };
  };

  G.animateFarmer = function (farmer, phase, speedNorm) {
    var p = farmer.parts;
    var swing = Math.sin(phase) * (0.7 + speedNorm * 0.25);
    p.legs[0].rotation.x = swing;
    p.legs[1].rotation.x = -swing;
    p.arms[0].rotation.x = -swing * 0.8;
    p.arms[1].rotation.x = -0.5; // pitchfork arm stays raised
    p.torso.position.y = 1.45 + Math.abs(Math.sin(phase)) * 0.06;
    p.torso.rotation.x = 0.12; // leaning forward, hungry
    p.head.rotation.y = Math.sin(phase * 0.3) * 0.1;
    p.fork.rotation.x = -0.35 + Math.sin(phase) * 0.08;
  };

  /* Biscuit the dog: chocolate-brown, long floppy ears, wagging tail. */
  G.buildDog = function () {
    var g = new THREE.Group();
    var parts = {};

    var body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 1.05), mat(0x8a5a2b));
    body.position.y = 0.62;
    body.castShadow = true;
    g.add(body);
    parts.body = body;
    // White chest patch.
    var chest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.36, 0.2), mat(0xffffff));
    chest.position.set(0, 0.58, 0.5);
    g.add(chest);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat(0x8a5a2b));
    head.position.set(0, 0.92, 0.62);
    head.castShadow = true;
    g.add(head);
    parts.head = head;
    var snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.3), mat(0x6b4423));
    snout.position.set(0, 0.86, 0.88);
    g.add(snout);
    var nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(0x111111));
    nose.position.set(0, 0.9, 1.02);
    g.add(nose);
    [-1, 1].forEach(function (s) {
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(0x111111));
      eye.position.set(0.12 * s, 1.0, 0.85);
      g.add(eye);
      // Long floppy ears.
      var ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.06), mat(0x6b4423));
      ear.position.set(0.28 * s, 0.88, 0.58);
      ear.rotation.z = s * 0.25;
      g.add(ear);
    });

    // Tail: wagging cone.
    var tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.78, -0.52);
    var tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 8), mat(0x6b4423));
    tail.rotation.x = -0.9;
    tail.position.set(0, 0.18, -0.18);
    tailPivot.add(tail);
    g.add(tailPivot);
    parts.tail = tailPivot;

    // Four little legs.
    parts.legs = [];
    [[-0.2, 0.35], [0.2, 0.35], [-0.2, -0.35], [0.2, -0.35]].forEach(function (pos) {
      var pivot = new THREE.Group();
      pivot.position.set(pos[0], 0.42, pos[1]);
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), mat(0x6b4423));
      leg.position.y = -0.21;
      pivot.add(leg);
      g.add(pivot);
      parts.legs.push(pivot);
    });

    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, parts: parts };
  };

  G.animateDog = function (dog, phase) {
    var p = dog.parts;
    p.legs[0].rotation.x = Math.sin(phase) * 0.9;
    p.legs[3].rotation.x = Math.sin(phase) * 0.9;
    p.legs[1].rotation.x = Math.sin(phase + Math.PI) * 0.9;
    p.legs[2].rotation.x = Math.sin(phase + Math.PI) * 0.9;
    p.tail.rotation.y = Math.sin(phase * 2.2) * 0.55; // happy wag
    p.body.position.y = 0.62 + Math.abs(Math.sin(phase)) * 0.05;
    p.head.rotation.x = Math.sin(phase * 0.5) * 0.08;
  };
})();
