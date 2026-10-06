# 意图

把用户描述转为能指导创作的目标。先区分现象、用途、风格、视角、画面尺度、发生时长与是否持续；未知宿主条件明确记录在 requirements.hostConditions 与 design.assumptions，不猜重力或物理单位。

requirements 使用 effect、composition、physics、configuration、textures、hostConditions；acceptance 使用当前输出 Schema。design 使用 visualGoal、assumptions、roles、omissions，可用 beats、adaptable 字符串数组表达时间阶段和可调整范围。此处不生成完整配置或预先冻结素材未知时的 fps/scale。

design.referenceIds 从提供的分类目录按用户要呈现的主要现象选0–2个id，按主次排序。大爆炸选explosion，不因为描述中提到余烟就自动追加smoke；明确需要持续火源和浓烟可以选fire、smoke。冰霜命中不因“冰雪”选weather；单独闪光可选light。忽略否定项和附带材料名称对类别的干扰。不匹配时为空；不向用户追问分类id。

角色 id 稳定。purpose 表达可见贡献，required 表达用户目标中的重要程度；blendMode/blendReason、textureKind、sampling、queryIntent、hardConstraints/preferences、motion/appearance 为后续选材和配置提供依据。required 不意味着运行中视觉缺失必须拒绝可用结果。

视角先于物理：侧视可以用向下宿主重力，俯视画面 Y 不等于高度。+X 向右、+Y 向下是常见 Pixi 画面约定，实际宿主以传入条件为准。角度使用弧度、时间使用秒。网站 profile 不成为所有效果的默认值。

## 坐标与验收目标

区分宿主发射器在画面中的变换与效果相对发射器的偏移。已知 emitter 位于 (400,530)、无旋转缩放时，host.transform 为 x=400、y=530、rotation=0、scaleX=scaleY=1；“无缩放”不表示平移为零。未知变换填 null，不用单位变换替代未知。acceptance.coordinateSpace 表示验收数值的空间，不强制等于配置的 simulationSpace；viewport、coverage、exitBeforeDeath 的数值都按选定的验收空间表达。例如 800px 宽视口、emitter.x=400 时，屏幕横向 [0,800] 对应局部 [-400,400]，不能直接比较二者。

acceptance 只固定有依据的要求。coverage 当前检查的是粒子出生位置范围，不包含贴图宽度、后续位移或尺寸增长；用户只给最终火焰宽度、爆炸直径时，coverage=null，把可见尺寸目标写入 composition 和 appearance。只有确实要求源区覆盖时才填写出生范围。exitBeforeDeath 只用于明确要求“死亡前越过某边界”的情况；“向上飘散”“循环”“覆盖全屏”都不自动要求飞出视口，否则填 null。minPopulation、完整动画周期、拖尾等也不由泛化效果名称凭空补成验收义务。艺术假设写入 design.assumptions，不冒充用户的硬条件。

只在缺失信息会改变用户要求、用途或可交付内容时提出少量问题。其他艺术选择可以作为明确假设推进。参考图提供轮廓、明暗、构图和材质线索，不自动证明运动、帧序或真实世界尺度。

retry 从输入配置和用户修改要求识别保留项、替换材料范围；用当前 textureDecision 输出协议表达。不扩大为全量重设计，不擅自改写冻结目标。

先按用途和运动所有者判断职责，不按飞行、细长、激光或 Trails 等关键词路由。固定／局部效果、独立发射闪光和命中爆散属于 particle；飞行主体、喷口尾焰、记录世界移动路径的尾迹和两端束线属于 projectile。普通爆炸火星、雨丝、局部放电即使使用 Trails 仍属于 particle。明确错用当前工具时，message 提醒用户改用 `vfx-projectile-create`，保持 requirements/design/acceptance 为 null，不继续设计、选材或生成；等待用户更正或取消，不自动切换工具。用途模糊且影响职责时，只简短澄清所需现象或运动所有者。
