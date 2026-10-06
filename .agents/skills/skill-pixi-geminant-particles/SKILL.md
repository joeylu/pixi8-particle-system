---
name: skill-pixi-geminant-particles
description: 接入、扩展和诊断 Geminant 二维粒子运行模块，处理 Pixi 渲染、资源所有权、生命周期、模拟空间与拖尾。
---

# Geminant 运行开发

用于 SDK 接入、模块开发和运行故障定位。创作、选图、视觉配方和参数调优由 [Particle 创作技能](../skill-geminum-particle/SKILL.md)与 [Projectile 创作技能](../skill-geminum-projectile/SKILL.md)负责；JSON 字段只引用 particle 维护的唯一 [Schema](../skill-geminum-particle/references/effect.schema.json)与[语义](../skill-geminum-particle/references/effect-contract.md)。

Particle 与 Projectile 是共用本运行时的创建用途分类：固定或局部效果、独立发射闪光／命中爆散走 particle；飞行弹体、跟随移动源的尾焰／尾迹、两端连接走 projectile。移动、细长或使用 Trails 本身不决定分类。

按任务读取 [runtime-integration](references/runtime-integration.md) 和 [runtime-api](references/runtime-api.md)。空间/重力读 [space-gravity](references/space-gravity.md)，拖尾读 [trails](references/trails.md)，扩展模块/renderer 读 [authoring](references/authoring.md)，实际接入验收读 [validation](references/validation.md)。Unity 对应术语读 [unity-naming](references/unity-naming.md)。接入 Projectile 的宿主运动、命中收尾、组合闪光／命中或两端束身时，才读[宿主交接](../skill-geminum-projectile/references/host-lifecycle.md)。

发现目标项目真实 SDK 符号与导出再选择 import，不假设安装路径。不安装依赖，不暗中切换 backend 或替换失败资源。宿主已明确允许的缺图 warning 预览属于编辑策略，不能用替代图证明真实素材可用性或导出验收通过。

运行由宿主提供 update 秒数、资源 resolver、空间/重力与销毁职责。控制复合效果用 entity，让所有层共享开始时刻、更新和排空判断。保留原始错误；类型/配置检查与实际 GPU 画面分别报告。
