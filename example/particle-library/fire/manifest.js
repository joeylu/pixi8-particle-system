const textures = {
  spark: {
    id: 'fire.spark',
    file: './fire-spark.png',
    kind: 'single',
    size: [64, 64]
  },
  ember: {
    id: 'fire.ember',
    file: './fire-ember.png',
    kind: 'single',
    size: [64, 64]
  },
  smoke: {
    id: 'fire.smoke',
    file: './fire-smoke.png',
    kind: 'single',
    size: [96, 96]
  }
};

export const fire = {
  name: 'fire',
  description: 'Reusable fire particle textures for sparks, embers, and light smoke.',
  textures,
  presets: {
    itemBurning: {
      id: 'fire.itemBurning',
      effectType: 'continuous',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'fire.itemBurning.spark',
          texture: textures.spark,
          maxParticles: 80,
          spawnRate: 30,
          lifespan: [0.35, 0.75],
          speed: [80, 150],
          directionDeg: [-120, -60],
          spreadX: 26,
          spreadY: 10,
          startScale: [0.12, 0.22],
          endScale: [0.03, 0.08],
          startAlpha: [0.75, 1],
          endAlpha: 0,
          gravityY: -30,
          rotationSpeed: [-5, 5],
          tint: 0xffcf6a
        },
        {
          id: 'fire.itemBurning.ember',
          texture: textures.ember,
          maxParticles: 70,
          spawnRate: 18,
          lifespan: [0.6, 1.1],
          speed: [40, 90],
          directionDeg: [-115, -65],
          spreadX: 22,
          spreadY: 12,
          startScale: [0.16, 0.3],
          endScale: [0.06, 0.12],
          startAlpha: [0.75, 1],
          endAlpha: 0,
          gravityY: -18,
          rotationSpeed: [-3, 3],
          tint: 0xff7a2f
        },
        {
          id: 'fire.itemBurning.smoke',
          texture: textures.smoke,
          maxParticles: 40,
          spawnRate: 8,
          lifespan: [0.9, 1.6],
          speed: [18, 44],
          directionDeg: [-105, -75],
          spreadX: 20,
          spreadY: 8,
          startScale: [0.18, 0.35],
          endScale: [0.55, 0.95],
          startAlpha: [0.18, 0.34],
          endAlpha: 0,
          gravityY: -10,
          rotationSpeed: [-1.5, 1.5],
          tint: 0x7a7169
        }
      ],
      notes: 'Continuous visible fire effect around the top and sides of an object.'
    },
    emberBurst: {
      id: 'fire.emberBurst',
      effectType: 'burst',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'fire.emberBurst.spark',
          texture: textures.spark,
          maxParticles: 48,
          burstCount: 24,
          lifespan: [0.35, 0.7],
          speed: [120, 240],
          directionDeg: [-165, -15],
          spreadX: 4,
          spreadY: 4,
          startScale: [0.1, 0.22],
          endScale: [0.02, 0.06],
          startAlpha: [0.8, 1],
          endAlpha: 0,
          gravityY: 160,
          rotationSpeed: [-8, 8],
          tint: 0xffd27a
        },
        {
          id: 'fire.emberBurst.ember',
          texture: textures.ember,
          maxParticles: 36,
          burstCount: 18,
          lifespan: [0.55, 1],
          speed: [80, 180],
          directionDeg: [-160, -20],
          spreadX: 5,
          spreadY: 5,
          startScale: [0.14, 0.28],
          endScale: [0.04, 0.1],
          startAlpha: [0.75, 1],
          endAlpha: 0,
          gravityY: 180,
          rotationSpeed: [-6, 6],
          tint: 0xff8038
        }
      ],
      notes: 'Short fire-spark burst for impact or ignition moments.'
    }
  }
};

export default fire;
