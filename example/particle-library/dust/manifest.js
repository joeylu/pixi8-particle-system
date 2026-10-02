const textures = {
  dot: {
    id: 'dust.dot',
    file: './dust-dot.png',
    kind: 'single',
    size: [64, 64]
  },
  chip: {
    id: 'dust.chip',
    file: './dust-chip.png',
    kind: 'single',
    size: [64, 64]
  },
  puff: {
    id: 'dust.puff',
    file: './dust-puff.png',
    kind: 'single',
    size: [96, 96]
  }
};

export const dust = {
  name: 'dust',
  description: 'Reusable dust particle textures for dots, chips, and puffs.',
  textures,
  presets: {
    groundDust: {
      id: 'dust.groundDust',
      effectType: 'burst',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'dust.groundDust.dot',
          texture: textures.dot,
          maxParticles: 42,
          burstCount: 24,
          lifespan: [0.45, 0.85],
          speed: [90, 190],
          directionDeg: [-170, -10],
          spreadX: 12,
          spreadY: 4,
          startScale: [0.08, 0.16],
          endScale: [0.03, 0.08],
          startAlpha: [0.5, 0.8],
          endAlpha: 0,
          gravityY: 220,
          rotationSpeed: [-6, 6],
          tint: 0xcbb99e
        },
        {
          id: 'dust.groundDust.puff',
          texture: textures.puff,
          maxParticles: 18,
          burstCount: 8,
          lifespan: [0.65, 1.1],
          speed: [35, 95],
          directionDeg: [-165, -15],
          spreadX: 16,
          spreadY: 5,
          startScale: [0.2, 0.36],
          endScale: [0.65, 1.05],
          startAlpha: [0.22, 0.4],
          endAlpha: 0,
          gravityY: 80,
          rotationSpeed: [-2, 2],
          tint: 0xb8aa96
        }
      ],
      notes: 'Ground contact dust burst.'
    },
    debrisBurst: {
      id: 'dust.debrisBurst',
      effectType: 'burst',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'dust.debrisBurst.dot',
          texture: textures.dot,
          maxParticles: 36,
          burstCount: 18,
          lifespan: [0.4, 0.8],
          speed: [120, 230],
          directionDeg: [-170, -10],
          spreadX: 6,
          spreadY: 6,
          startScale: [0.07, 0.14],
          endScale: [0.025, 0.06],
          startAlpha: [0.45, 0.75],
          endAlpha: 0,
          gravityY: 300,
          rotationSpeed: [-7, 7],
          tint: 0xd1b996
        },
        {
          id: 'dust.debrisBurst.chip',
          texture: textures.chip,
          maxParticles: 26,
          burstCount: 14,
          lifespan: [0.55, 1],
          speed: [110, 210],
          directionDeg: [-160, -20],
          spreadX: 5,
          spreadY: 5,
          startScale: [0.1, 0.18],
          endScale: [0.04, 0.08],
          startAlpha: [0.55, 0.85],
          endAlpha: 0,
          gravityY: 340,
          rotationSpeed: [-10, 10],
          tint: 0xb89162
        }
      ],
      notes: 'Small debris burst for impacts.'
    }
  }
};

export default dust;
