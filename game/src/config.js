/* GOBBLE DASH — tuning constants, zone palettes and spawn tables.
   One job: every number the game balances on lives here, so tuning never
   means hunting through the render or input code. */
(function () {
  var G = window.GOBBLE || (window.GOBBLE = {});

  G.CONFIG = {
    laneX: [-2.35, 0, 2.35],      // three running lanes, left / centre / right
    laneWidth: 2.35,
    winDistance: 2000,            // metres to freedom (ESCAPED)
    baseSpeed: 11,                // m/s at the start line
    maxSpeed: 24,                 // m/s near the kitchen
    speedRamp: 2000,              // distance over which speed ramps to max
    gravity: -34,                 // jump gravity (snappy, cartoonish)
    jumpVelocity: 12.5,           // jump take-off speed
    slideTime: 0.75,              // seconds a slide lasts
    laneChangeTime: 0.16,         // seconds to glide to the next lane (Playful: fast)
    stumbleInvincible: 1.6,       // seconds of grace after a stumble
    dangerPerStumble: 34,         // danger meter gain per stumble
    dangerDecay: 2.2,             // danger meter loss per clean second
    magnetTime: 9,                // magnet power-up seconds
    shoesTime: 7,                 // speedy-shoes power-up seconds
    cornScore: 10,
    featherScore: 50,
    spawnAhead: -130,             // z where new things appear
    despawnBehind: 22,            // z where things are recycled
    cameraZ: 7.6,
    cameraY: 4.4,
  };

  /* Four bright zones. Each palette is vivid and saturated on purpose:
     the farmyard is lush green + red barn, the cornfield is gold, the woods
     are blazing orange/red, the kitchen is warm cream + glowing red oven. */
  G.ZONES = [
    {
      name: 'FARMYARD', from: 0,
      sky: 0x2f9df0, fog: 0x9fd8ff, ground: 0x39c24a, groundSide: 0x2fae3e,
      sun: 0xfff2b0, accent: 'red barn',
    },
    {
      name: 'CORNFIELD', from: 500,
      sky: 0x35a8ff, fog: 0xffe9a8, ground: 0xe8b93a, groundSide: 0xd9a92a,
      sun: 0xffe066, accent: 'golden corn',
    },
    {
      name: 'WILD WOODS', from: 1000,
      sky: 0x2f8fe8, fog: 0xffc46b, ground: 0x7ec850, groundSide: 0x5da83a,
      sun: 0xffd23e, accent: 'autumn trees',
    },
    {
      name: 'KITCHEN', from: 1500,
      sky: 0xffb36b, fog: 0xffd9a8, ground: 0xf2d8a0, groundSide: 0xe0b878,
      sun: 0xff9d5c, accent: 'the oven',
    },
  ];

  /* Obstacle spawn weights grow harder with distance: carts and ovens
     (must dodge) appear later; knives start falling after 250 m. */
  G.spawnPlan = function (distance) {
    var t = Math.min(1, distance / 1600);
    return {
      gapMin: 26 - 9 * t,          // metres between obstacle rows
      gapMax: 44 - 14 * t,
      knifeEveryMin: 14,           // seconds between knife drops
      knifeEveryMax: 22,
      knifeFrom: 250,              // knives only after this distance
      weights: {
        hay: 0.30 - 0.08 * t,
        crate: 0.22 - 0.04 * t,
        fence: 0.18,
        branch: 0.12 + 0.04 * t,   // slide-under branch
        cart: 0.10 + 0.10 * t,     // must dodge
        oven: 0.08 + 0.08 * t,     // must dodge
      },
    };
  };

  /* Tiny deterministic RNG so screenshots are reproducible (?seed=7). */
  G.mulberry32 = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
})();
