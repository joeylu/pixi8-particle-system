---
name: skill-geminum-particle
description: 将固定或局部效果、独立发射闪光和命中爆散的描述、参考图与真实纹理转为 Geminant 二维粒子设计与配置。
---

# Geminum 二维粒子创作

交付与用户视觉意图相符、引用真实资源的配置，并说明素材适配与缺口。最多 8 个配置层；简单闪光可以只有一层。配置层、纹理文件、动画帧、粒子数量和绘制调用是不同量。

本技能负责固定或局部效果，以及宿主在指定位置触发的独立发射闪光和命中爆散。发射点、命中点及朝向由宿主给定，粒子效果不检测碰撞。移动弹体、跟随移动源的尾焰/尾迹、定向两端连接和移动雷电攻击使用同级 [skill-geminum-projectile](../skill-geminum-projectile/SKILL.md)；局部放电、雨丝、爆炸碎屑不因移动或细长自动变为 projectile。两技能共用本技能维护的唯一配置 Schema 与语义。

## 按当前阶段读取

- 澄清现象、视角、尺度和宿主条件：[intent](references/intent.md)。
- 意图阶段依据[分类目录](references/recipe-catalog.json)的用途语义选择 design.referenceIds，0–2类；没有合适类别可为空，复合效果只补确有独立贡献的第二类。
- 拆分视觉职责、时间阶段、材料需求：[design](references/design.md)与[组合逻辑](references/construction.md)，只读 referenceIds 对应分类。目录覆盖爆炸、持续火焰、烟尘雾、液体、雨雪、飘落物、火花、局部放电、光、能量门、[发射闪光](references/recipes/flash.md)和[命中爆散](references/recipes/impact.md)。
- 观察候选、选择可用帧并报告缺图：[materials](references/materials.md)。
- 根据真实材料计算参数：[configure](references/configure.md)、组合逻辑、已选分类与[effect-contract](references/effect-contract.md)。字段结构以唯一[Schema](references/effect.schema.json)为准。
- 最终检查与一次修复：[validation](references/validation.md)。

MCP 中模型无工具，服务器按阶段注入这些内容及实际任务产物；不要假定模型能自行打开链接。阶段输入输出形状以服务器提供的输出 Schema 为准，不增加字段。

分类与组合经验来自 Ultimate VFX Prefab、材质和贴图用法的拆解，优先二维侧视；不是自动转换器。用户明确俯视或其他视角时按其要求重映射。参考的效果、数值例子和原素材名均不是固定资产绑定或强制配方；同源重新生成的纹理仍需观察。

设计目标在 design.json 冻结；真实材料在 materials.json 记录；配置只通过 adaptations 解释实现变化。静态图不能承诺内部动画，缺图不创造纹理绑定。有真实资源的可运行结果可以交付，缺口以 warning 和纹理生成 brief 说明。视觉偏好、层次、混合或保留参数偏差只作 warning，由用户决定调整；只有确定结构、运行、引用和 8 层错误阻断。

本技能不提供噪声场、碰撞、递归子发射器、距离发射、继承宿主速度、真实灯光或自定义 shader 能力。开发接入与运行诊断由模块所在项目维护，不属于本 MCP skill。

结构示例见 [固定火源](assets/fire.effect.json)、[火焰帧网格](assets/fire-grid.effect.json)、[局部重力](assets/space-gravity.effect.json)与[普通拖尾](assets/trails.effect.json)。这些示例说明配置结构，不是当前任务真实素材绑定；移动弹体的三个示例由 projectile 的 [assets](../skill-geminum-projectile/references/configure.md#结构示例)维护。

先在意图阶段核对当前工具职责；明确错用时提醒用户使用另一 create 工具，等待更正或取消，不自动切换，不继续设计生成。职责模糊时简短澄清，不能按关键词或 Trails 模块决定工具。
