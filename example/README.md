# Pixi 8 Particle Example

A static Vite site using `pixi.js` and the local `geminant-particles/pixi` module.

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal. Move the pointer over the canvas to change the emission position. The controls support pause, resume, and reset.

```sh
npm run build
npm run preview
```

The static build is written to `dist/` and uses relative asset paths for deployment under a subdirectory.
The local particle module uses the existing build artifacts in `../geminum-particles/dist`.

References: [Vite](https://vite.dev/guide/) · [PixiJS Application](https://pixijs.com/8.x/guides/components/application).
