---
name: skill-geminum-projectile
description: 将射线、飞行弹体、尾焰和移动尾迹的描述与真实纹理转为 Geminant 二维特效配置，规划头尾关系、宿主运动与命中收尾。
---

# Geminum 二维 Projectile 创作

目标是生成可辨认的飞行／连接效果配置，最多 8 层。默认优先二维侧视，明确的其他视角按用户要求处理。Projectile 包括移动弹体、跟随移动源的尾焰／尾迹、两端射线；雨丝、爆炸火星、定点放电不因为细长或使用 Trails 就改成 projectile。

## 按阶段读取

- 理解用途、运动所有者与视角：[intent](references/intent.md)，从[分类目录](references/recipe-catalog.json)选择 0–2 个相关类别。
- 规划职责、空间与结束方式：[design](references/design.md)、[构建逻辑](references/construction.md)、所选类别；结果保存为 design.json。
- 观察与选择实际图像：[materials](references/materials.md)及设计，结果保存为 materials.json。
- 落地配置：[configure](references/configure.md)、构建逻辑、所选类别，以及同级 particle 技能维护的唯一[配置语义](../skill-geminum-particle/references/effect-contract.md)和[Schema](../skill-geminum-particle/references/effect.schema.json)。实际素材改变实现，不暗改冻结的用户目标。
- 最终检查：[validation](references/validation.md)。只有调用宿主运行接口或组合发射／命中时才读[宿主交接](references/host-lifecycle.md)。

本技能与 `skill-geminum-particle` 一起分发，共用基础配置合同；不依赖 runtime 的源码位置。独立 agent 按链接读取；服务编排可注入对应阶段正文、冻结产物及输出 Schema，无工具模型不自行访问链接。服务给定包装字段时严格遵守；独立执行交付效果 JSON 和单独的设计／素材／宿主说明，不把说明字段塞进配置。

十二类覆盖持续镭射、快速能量弹、火球、喷口尾焰、流星、电能弹、冰片、箭矢、刀光、旋转投掷物、风旋、魔法光团。类目是构建参考，不是配色预设、固定层数或强制素材名称。材料缺口和近似写 warning，不能用占位图假装检索成功。

发射闪光和接触命中分别使用 particle 的 [flash](../skill-geminum-particle/references/recipes/flash.md)、[impact](../skill-geminum-particle/references/recipes/impact.md)。宿主负责实际发射时刻、轨迹、命中点及法线。效果不提供碰撞判定、伤害、自动追踪或游戏事件脚本。每份 JSON 不超过 8 层；组合多个资产时还要说明同时存活的总成本，不能借拆资产绕过单配置预算。

资料来自 Ultimate VFX、QFX ProjectilesFX 和 MasterStylizedProjectiles 的 Prefab、材质与调用脚本。二维结果保留轮廓、方向、时序和头尾关系，不承诺复现原包的 3D Mesh、噪声、Shader 扭曲或 HDR/Bloom。60%–70% 是人工比对目标，没有原作画面对照不声称达成。

先在意图阶段核对当前工具职责；明确错用时提醒用户使用另一 create 工具，等待更正或取消，不自动切换，不继续设计生成。职责模糊时简短澄清，不能按关键词或 Trails 模块决定工具。
