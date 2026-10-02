const textures = {
  puff: {
    id: 'smoke.puff',
    file: './smoke-puff.png',
    kind: 'single',
    size: [96, 96]
  },
  soft: {
    id: 'smoke.soft',
    file: './smoke-soft.png',
    kind: 'single',
    size: [128, 128]
  }
};

export const smoke = {
  name: 'smoke',
  description: 'Reusable smoke particle textures for soft puffs and diffuse clouds.',
  textures,
  presets: {
    softSmoke: {
      id: 'smoke.softSmoke',
      effectType: 'continuous',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'smoke.softSmoke.puff',
          texture: textures.puff,
          maxParticles: 48,
          spawnRate: 12,
          lifespan: [1.2, 2],
          speed: [18, 42],
          directionDeg: [-112, -68],
          spreadX: 16,
          spreadY: 8,
          startScale: [0.18, 0.34],
          endScale: [0.65, 1.05],
          startAlpha: [0.22, 0.38],
          endAlpha: 0,
          gravityY: -14,
          rotationSpeed: [-1.2, 1.2],
          tint: 0xb7b0a8
        },
        {
          id: 'smoke.softSmoke.soft',
          texture: textures.soft,
          maxParticles: 36,
          spawnRate: 7,
          lifespan: [1.7, 2.7],
          speed: [10, 28],
          directionDeg: [-104, -76],
          spreadX: 18,
          spreadY: 8,
          startScale: [0.2, 0.4],
          endScale: [0.85, 1.35],
          startAlpha: [0.12, 0.26],
          endAlpha: 0,
          gravityY: -8,
          rotationSpeed: [-0.8, 0.8],
          tint: 0x9f9890
        }
      ],
      notes: 'Soft smoke rising from an object.'
    },
    dissipate: {
      id: 'smoke.dissipate',
      effectType: 'burst',
      renderer: 'ParticleContainer',
      layers: [
        {
          id: 'smoke.dissipate.soft',
          texture: textures.soft,
          maxParticles: 22,
          burstCount: 12,
          lifespan: [0.8, 1.45],
          speed: [18, 60],
          directionDeg: [-180, 0],
          spreadX: 10,
          spreadY: 6,
          startScale: [0.22, 0.42],
          endScale: [0.95, 1.55],
          startAlpha: [0.22, 0.42],
          endAlpha: 0,
          gravityY: -18,
          rotationSpeed: [-1.5, 1.5],
          tint: 0xb2aca5
        }
      ],
      notes: 'Short smoke puff that expands and fades.'
    }
  }
};

export default smoke;
