const textures = {
  drop: {
    id: 'water.drop',
    file: './water-drop.png',
    kind: 'single',
    size: [64, 64]
  },
  foam: {
    id: 'water.foam',
    file: './water-foam.png',
    kind: 'single',
    size: [64, 64]
  },
  splash: {
    id: 'water.splash',
    file: './water-splash.png',
    kind: 'single',
    size: [96, 96]
  }
};

export const water = {
  name: 'water',
  description: 'Reusable water particle textures for drops, foam, and splash shapes.',
  textures,
  presets: {
    sideSplash: {
      id: 'water.sideSplash',
      effectType: 'burst',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'water.sideSplash.drop',
          texture: textures.drop,
          maxParticles: 44,
          burstCount: 26,
          lifespan: [0.45, 0.9],
          speed: [160, 290],
          directionDeg: [-165, -20],
          spreadX: 8,
          spreadY: 4,
          startScale: [0.12, 0.22],
          endScale: [0.05, 0.1],
          startAlpha: [0.72, 0.95],
          endAlpha: 0,
          gravityY: 360,
          rotationSpeed: [-9, 9],
          tint: 0x9fdcff
        },
        {
          id: 'water.sideSplash.foam',
          texture: textures.foam,
          maxParticles: 24,
          burstCount: 12,
          lifespan: [0.55, 1],
          speed: [90, 180],
          directionDeg: [-160, -30],
          spreadX: 10,
          spreadY: 4,
          startScale: [0.16, 0.32],
          endScale: [0.25, 0.5],
          startAlpha: [0.55, 0.85],
          endAlpha: 0,
          gravityY: 240,
          rotationSpeed: [-4, 4],
          tint: 0xffffff
        },
        {
          id: 'water.sideSplash.splash',
          texture: textures.splash,
          maxParticles: 14,
          burstCount: 7,
          lifespan: [0.35, 0.65],
          speed: [70, 130],
          directionDeg: [-150, -35],
          spreadX: 6,
          spreadY: 3,
          startScale: [0.2, 0.36],
          endScale: [0.38, 0.64],
          startAlpha: [0.45, 0.7],
          endAlpha: 0,
          gravityY: 180,
          rotationSpeed: [-3, 3],
          tint: 0xbfefff
        }
      ],
      notes: 'Obvious water splash burst from the bottom or side of an object.'
    },
    drip: {
      id: 'water.drip',
      effectType: 'continuous',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'water.drip.drop',
          texture: textures.drop,
          maxParticles: 26,
          spawnRate: 7,
          lifespan: [0.7, 1.25],
          speed: [20, 65],
          directionDeg: [75, 105],
          spreadX: 7,
          spreadY: 4,
          startScale: [0.11, 0.2],
          endScale: [0.07, 0.14],
          startAlpha: [0.65, 0.95],
          endAlpha: 0,
          gravityY: 420,
          rotationSpeed: [-2, 2],
          tint: 0xa7e4ff
        }
      ],
      notes: 'Light dripping water effect.'
    }
  }
};

export default water;
