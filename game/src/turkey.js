/* GOBBLE DASH — Gus the turkey, built entirely from 3D primitives.
   Motion personality: Playful (ease-out-back lane hops, squash-and-stretch
   jumps, flapping wings as secondary motion, tail fan as ambient sway). */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  function mat(color, rough) {
    return new THREE.MeshLambertMaterial({ color: color, roughness: rough == null ? 0.9 : rough });
  }

  /* Build the turkey. Returns { group, parts } where parts holds the
     animated bits: wings, legs, tail fan, body, head. */
  G.buildTurkey = function () {
    var g = new THREE.Group();
    var parts = {};

    // Body: big round brown egg, tilted slightly forward.
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), mat(0x8a5a2b));
    body.scale.set(1, 1.05, 1.15);
    body.position.y = 1.05;
    body.castShadow = true;
    g.add(body);
    parts.body = body;

    // Belly patch: lighter cream front.
    var belly = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), mat(0xf2d8a0));
    belly.scale.set(0.85, 0.95, 0.6);
    belly.position.set(0, 0.95, 0.32);
    g.add(belly);

    // Head: small sphere on a short neck, up front.
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.4, 10), mat(0x8a5a2b));
    neck.position.set(0, 1.72, 0.42);
    g.add(neck);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), mat(0x7a4a22));
    head.position.set(0, 2.02, 0.48);
    head.castShadow = true;
    g.add(head);
    parts.head = head;

    // Beak: bright yellow cone pointing forward; red wattle hanging below.
    var beak = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 10), mat(0xffc21c));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 2.0, 0.86);
    g.add(beak);
    var wattle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat(0xe62020));
    wattle.scale.set(0.8, 1.5, 0.8);
    wattle.position.set(0, 1.82, 0.72);
    g.add(wattle);
    // Eyes: white + black pupils, wide and panicked.
    [-1, 1].forEach(function (s) {
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(0xffffff));
      eye.position.set(0.13 * s, 2.1, 0.7);
      g.add(eye);
      var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), mat(0x111111));
      pupil.position.set(0.13 * s, 2.1, 0.76);
      g.add(pupil);
    });
    // Snood: the red flap over the beak.
    var snood = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 8), mat(0xe62020));
    snood.rotation.x = 0.5;
    snood.position.set(0, 2.12, 0.78);
    g.add(snood);

    // Tail fan: five flattened cones fanned behind, rainbow autumn colours.
    var tail = new THREE.Group();
    tail.position.set(0, 1.15, -0.55);
    var tailColors = [0xe62020, 0xff7f00, 0xffc21c, 0x2fae3e, 0x1d6fd1];
    tailColors.forEach(function (c, i) {
      var feather = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.15, 6), mat(c));
      feather.scale.set(1, 1, 0.28);
      var angle = (i - 2) * 0.42;
      feather.position.set(Math.sin(angle) * 0.55, Math.cos(angle) * 0.45 + 0.25, -0.1);
      feather.rotation.z = -angle;
      feather.rotation.x = -0.35;
      feather.castShadow = true;
      tail.add(feather);
    });
    g.add(tail);
    parts.tail = tail;

    // Wings: flattened brown boxes on the sides, hinged to flap.
    parts.wings = [];
    [-1, 1].forEach(function (s) {
      var pivot = new THREE.Group();
      pivot.position.set(0.5 * s, 1.35, 0.05);
      var wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.5), mat(0x6b4423));
      wing.position.set(0.12 * s, -0.22, -0.05);
      wing.castShadow = true;
      pivot.add(wing);
      // wing tip feather in cream
      var tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.42), mat(0xf2d8a0));
      tip.position.set(0.14 * s, -0.55, -0.08);
      pivot.add(tip);
      pivot.rotation.z = s * 0.5;
      g.add(pivot);
      parts.wings.push(pivot);
    });

    // Legs: thin orange cylinders with a run cycle; feet are flat boxes.
    parts.legs = [];
    [-1, 1].forEach(function (s) {
      var pivot = new THREE.Group();
      pivot.position.set(0.22 * s, 0.55, 0);
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), mat(0xff8c1a));
      leg.position.y = -0.25;
      pivot.add(leg);
      var foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.34), mat(0xff8c1a));
      foot.position.set(0, -0.52, 0.06);
      pivot.add(foot);
      g.add(pivot);
      parts.legs.push(pivot);
    });

    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, parts: parts };
  };

  /* Animate one frame of Gus.
     phase: run-cycle phase (radians). mode: 'run' | 'jump' | 'slide'.
     squash: 0..1 landing squash amount. */
  G.animateTurkey = function (turkey, phase, mode, squash) {
    var p = turkey.parts;
    var runSwing = Math.sin(phase);
    var runSwing2 = Math.sin(phase + Math.PI);

    if (mode === 'jump') {
      // Legs tucked, wings spread wide in panic, tail up.
      p.legs[0].rotation.x = -0.9;
      p.legs[1].rotation.x = -0.5;
      p.wings[0].rotation.z = -1.25;
      p.wings[1].rotation.z = 1.25;
      p.wings[0].rotation.x = 0.3;
      p.wings[1].rotation.x = 0.3;
      p.tail.rotation.x = -0.5;
      p.body.position.y = 1.05;
    } else if (mode === 'slide') {
      // Squash-and-stretch: body low and long, wings pinned back.
      p.legs[0].rotation.x = 0.9;
      p.legs[1].rotation.x = 1.1;
      p.wings[0].rotation.z = -0.15;
      p.wings[1].rotation.z = 0.15;
      p.tail.rotation.x = 0.25;
    } else {
      // Run: legs scissor, wings flap, body bobs, tail sways.
      p.legs[0].rotation.x = runSwing * 0.85;
      p.legs[1].rotation.x = runSwing2 * 0.85;
      var flap = Math.sin(phase * 1.0) * 0.45 + 0.45;
      p.wings[0].rotation.z = -(0.35 + flap * 0.5);
      p.wings[1].rotation.z = 0.35 + flap * 0.5;
      p.wings[0].rotation.x = Math.sin(phase * 0.5) * 0.15;
      p.wings[1].rotation.x = Math.sin(phase * 0.5) * 0.15;
      p.tail.rotation.x = -0.15 + Math.sin(phase * 0.5) * 0.08;
      p.tail.rotation.z = Math.sin(phase * 0.25) * 0.06;
      p.body.position.y = 1.05 + Math.abs(Math.sin(phase)) * 0.08;
    }
    // Landing squash: scale the whole bird briefly.
    var s = 1 - (squash || 0) * 0.18;
    turkey.group.scale.set(2 - s, s, 2 - s);
    // Head looks around nervously.
    p.head.rotation.y = Math.sin(phase * 0.35) * 0.25;
  };
})();
