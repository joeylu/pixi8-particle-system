# pixi8-particle-system

为 PixiJS 8 补齐粒子特效的逻辑控制。

PixiJS 8 的 `ParticleContainer` 提供高效粒子渲染。本项目在它之上管理粒子的生成、运动、外观变化、生命周期，以及整个特效的播放与资源释放。宿主提供纹理和时间步长，粒子系统计算状态，Pixi 适配层负责把状态同步到渲染组件。

## 功能

- 恒定速率发射与手动批量发射；点、圆、矩形发射形状。
- 初始速度、大小、旋转、颜色和透明度；带种子的随机参数。
- 运动、恒定加速度和宿主提供的重力。
- 颜色、透明度、大小随生命周期变化，以及持续旋转。
- 单纹理、序列帧、随机帧和网格纹理切分。
- 分层 JSON 特效、配置解析与校验。
- 拖尾，以及局部／世界空间模拟。
- 播放、暂停、恢复、停止发射并排空、重置和销毁。
- 有容量上限的粒子池与可扩展的行为、生命周期观察器和渲染器接口。

## 项目结构

```text
geminum-particles/
  runtime/core/         粒子状态、生命周期、时间推进和模块契约
  runtime/modules/      发射、形状、运动、外观和拖尾模块
  runtime/composition/  将特效配置编译为运行模块
  runtime/entity/       JSON 配置解析、校验和帧选择
  runtime/pixi/         Pixi 渲染适配与特效创建入口
  entries/              core、config、pixi 公共入口
  dist/                 已有 JavaScript 与 TypeScript 声明产物
  scripts/build.mjs     构建与类型检查
.agents/skills/skill-pixi-geminant-particles/
                        配套使用说明、JSON Schema、配置示例与校验脚本
```

仓库名为 `pixi8-particle-system`，代码目录为 `geminum-particles`，当前包名为 `geminant-particles`。包版本为 `0.1.0`，`private: true`；本仓库不声明该包已发布到 npm。

## 本地接入

当前 peer dependency 为 `pixi.js ^8.21.0`，开发依赖为 `typescript ^5.9.3`。在包目录准备构建依赖：

```sh
cd geminum-particles
npm install
npm run typecheck
npm run build
```

也可通过 `GEMINANT_PARTICLES_BUILD_DEPS` 指向已有依赖目录；该目录需同时包含 `typescript` 和 `pixi.js`。

在使用 PixiJS 8 的宿主项目中安装本地包：

```sh
npm install /absolute/path/to/pixi8-particle-system/geminum-particles
```

公共入口：`geminant-particles`（与 `/core` 相同）、`geminant-particles/core`、`geminant-particles/config`、`geminant-particles/pixi`。纯逻辑入口可用于自定义渲染器；Pixi 入口用于连接 `ParticleContainer`。

## 快速示例

下面使用已初始化的 Pixi `app` 和由宿主加载的有效 `texture`。在 `app.init()` 或首次初始化渲染器之前加载粒子扩展；使用拖尾时还需提前注册 `pixi.js/mesh`。

```ts
import 'pixi.js/particle-container';
import 'pixi.js/mesh';
import { createPixiParticleEffect } from 'geminant-particles/pixi';

// app 与 texture 由宿主创建；上述导入应在 app.init() 之前执行。
const { system, container } = createPixiParticleEffect({
  texture,
  blendMode: 'add',
  main: {
    maxParticles: 256,
    startLifetime: 1,
    startSpeed: { min: 40, max: 100 },
    startScale: { min: 0.2, max: 0.5 },
    startTint: 0xffaa44,
    randomSeed: 42,
  },
  emission: { rateOverTime: 60 },
  shape: { shapeType: 'point', spreadRadians: Math.PI * 2 },
  colorOverLifetime: { endTint: 0xff3300, endAlphaFactor: 0 },
  sizeOverLifetime: { endScaleFactor: 0 },
});

app.stage.addChild(container);
system.setOrigin(400, 300);
system.play();

const tick = (ticker: { deltaMS: number }) => {
  system.update(ticker.deltaMS / 1000);
};
app.ticker.add(tick);

// 停止产生新粒子；继续 tick，直到粒子和拖尾排空。
// system.stop();

// 场景释放时：
// app.ticker.remove(tick);
// system.destroy();
```

所有时间参数以秒为单位，角度以弧度为单位。工厂不会自动播放，也不会创建 ticker。`emit(count)` 可用于一次性爆发，不要求先调用 `play()`。

## 控制与运行约定

| 操作 | 行为 |
| --- | --- |
| `play()` | 从 stopped 开始持续运行；自动发射需要 emission 配置 |
| `emit(count)` | 立即生成指定数量的粒子 |
| `pause()` / `resume()` | 冻结／恢复模拟 |
| `stop()` | 停止新发射，保留已有粒子和拖尾直到排空 |
| `reset()` | 清空当前效果、重置运行时间与模块，保留可复用池 |
| `setOrigin(x, y)` | 设置后续粒子的出生原点 |
| `update(dtSeconds)` | 用宿主提供的非负有限秒数推进模拟 |
| `destroy()` | 释放系统拥有的资源 |

状态包括 `stopped`、`playing`、`draining`、`paused`、`faulted`、`destroyed`。核心系统提供 `particleCount`、`hasPendingWork`、`error` 和 `diagnostic`。拖尾仍可能在粒子数量归零后存活，应通过状态或 `hasPendingWork` 判断是否排空。

宿主拥有传入的纹理、TextureSource 和父容器；销毁系统不会销毁这些共享资源。不要在效果运行期间破坏纹理或修改其帧布局。世界空间、重力和世界空间拖尾需要对应的宿主环境绑定。容量或单次出生预算超限会显式报错，不会静默丢弃粒子。运行模块失败会进入 faulted，之后应读取诊断并销毁系统。

## 分层、序列帧与拖尾

单纹理使用 `createPixiParticleEffect`；多帧使用 `createPixiFrameParticleEffect`；JSON 分层特效使用异步工厂 `createPixiParticleEntity({ config, resolveTexture })`。宿主通过 `resolveTexture` 将配置中的逻辑资源引用解析为有效纹理，再挂载容器、播放并逐帧更新。多帧纹理需共享同一 TextureSource。

详细接口、空间绑定和拖尾材质约定见配套文档：

- [运行接入](.agents/skills/skill-pixi-geminant-particles/references/runtime-integration.md)
- [运行 API](.agents/skills/skill-pixi-geminant-particles/references/runtime-api.md)
- [JSON 配置契约](.agents/skills/skill-pixi-geminant-particles/references/effect-contract.md)
- [JSON Schema](.agents/skills/skill-pixi-geminant-particles/references/effect.schema.json)
- [空间与重力](.agents/skills/skill-pixi-geminant-particles/references/space-gravity.md)
- [拖尾](.agents/skills/skill-pixi-geminant-particles/references/trails.md)
- [配置示例](.agents/skills/skill-pixi-geminant-particles/assets/)

## 当前范围

当前交付为运行库、构建产物与配套配置说明。仓库未包含独立可视化编辑器或浏览器演示应用；真实 GPU 绘制与特效表现需在宿主 Pixi 场景中验证。
