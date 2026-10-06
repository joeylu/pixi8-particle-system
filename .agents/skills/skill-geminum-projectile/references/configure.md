# 参数与最终配置

读冻结设计、材料文档、实际选中图、所选配方和共享 effect Schema／语义。输出标准效果 JSON；category=projectile 属于资产外层元数据，不添加到效果 Schema。独立执行另存 layer→role→anchor／结束策略、素材适配、宿主条件、缺图和未渲染范围；有服务输出 Schema 时按它包装。

所有已决定的实现都写进 JSON。头部零时刻出现用 emission.bursts，世界残留用 rateOverTime，开始和停止由宿主控制。local 头层 startSpeed=0，按素材前向轴设置 startRotation；自驱动粒子才用 startSpeed 与 velocity alignment。world 方向性粒子的朝向需要速度或正确的出生 rotation，不假设它们像 local 头部一样自动继承宿主外观角度。

按真实可见宽 B、resolution r、宿主屏幕缩放 h 估出生等比尺寸：scale≈目标宽×r/(B×h)。长束再区分 X/Y 比例；各向异性 emitter 缩放会改变 world 出生位置和速度，直梁的宿主伸缩只用于单独束身，不用于混合飞行实体。原作的 Bloom 外晕不计作全部清晰轮廓，黑底加色贴图也要核对叠亮面积。

随机静态 variants 用 indices；真实序列用 clips、fps，循环才可 randomStartFrame。头部内部动画可以循环，单次 flash／impact 通常从首帧播放。静图转动不等于内部流动；不拿快 fps 填补不存在的动画。

烟／尘常用 normal，光带／火星常用 add；不能整套 projectile 一律 add。曲线控制出现、峰值和消散，不能让每层都同步从小放大再线性淡出。头部在稳定飞行期应维持身份，尾粒子可以尺寸发展和渐消；实际结束由宿主立即清头而不是强制等曲线走完。

将设计中保留的尾部职责映射到真实层，检查内外尾是否有宽度、亮度、历史长度或节奏的可见差别。已烘焙进同图的对比可合层，材料不足时说明取舍；不要机械复制三层或只复制颜色。通常柔外尾先绘制，明内尾和头核靠上，碎尾根据可读性安排；按实际遮挡调整。多层add需分配总曝光，不能让重叠把宽窄与色阶全部抹成白条。

使用world短段叠接时，按速度、可见段长与采样间隔估计重叠，并联动单颗alpha与发射密度。关注重复端帽、硬实芯和留白产生的条带；增加粒子数量不能自动修复这些图像边界。柔边材料与不同寿命可以改善融合，无法消除的接缝保留warning。各尾层分别计算人口和排空时间，拆层后仍遵守总8层与原有最终校验次数，不增加视觉阻断。

头部轮廓、光核与尾根可通过layer.origin或shape.offsetX/Y设置局部出生偏移；固定纹理锚点0.5不等于没有位置偏移。用实际亮区中心对齐头核与尾根，按偏移后的画面判断硬边与曝光；这些字段不替代宿主飞行或移动已出生的world尾粒子。

trail 必须配齐 modules.trails 与 renderer.trail，单帧、stretch，lifetime 为所属粒子总寿命倍数。worldSpace=true 需要宿主空间绑定；dieWithParticles=false 才允许强制死亡后的余尾。纯烟尾不需要 Trails。单条大尾与多粒子短尾分别核算 maxTrails、点数及 Mesh 成本，不因为只有一层就认为廉价。

Trail 几何恒宽、全带统一 tint/alpha，不接收粒子 alphaCurve 或尺寸曲线。贴图渐细／渐淡是沿长度的空间轮廓，不是每点随年龄淡出；点到 TTL 后截短／删除。需要柔和时间消散时可选独立世界粒子尾，接受连续性损失，不能写出不存在的尾宽／尾透明曲线。

初估容量用最长存活时间和实际发射窗口，出生预算按宿主 dt 和 burst 合计；没有宿主 dt 时写清估计依据。视觉密度与曝光由真实画面决定，不增加最少层数、最少帧数或同色多层等硬规则。

最终核对 adaptations／宿主说明与真实 layerId、空间及材料绑定一致。首次只允许纠正确定的配置致命错误一次；材料近似、帧周期截断、尾长偏差和审美偏好作 warning。

## 结构示例

同级assets提供 [单弹体带尾](../assets/projectile-trail.effect.json)、[移动烟尾](../assets/projectile-smoke.effect.json)、[烟尾与辉光](../assets/projectile-smoke-glow.effect.json)。这些是配置结构示例，不是当前任务真实素材绑定；使用前按实际纹理改写资源引用，并按宿主轨迹说明空间与结束策略。普通粒子拖尾示例仍在particle的 [trails](../../skill-geminum-particle/assets/trails.effect.json)。

配置输出的 `projectile` 与 `configuration` 并列，不写入效果 Schema；资产记录对应 `meta.projectile`。仅输出 `mode`（`emitter`：宿主移动发射器；`particles`：粒子自身运动；`beam`：两端直束）、`killLayerIds`（结束时立即清除的真实层 id，可为空）。仅 `beam` 模式另含 `beam:{referenceLength,referenceCenter}`：referenceLength 为正的基准束长，referenceCenter 为配置局部坐标中的真实可见束中心 [x,y]。非 beam 不输出 beam。依据最终配置确认模式、清除层和束基准；retry 同步整体更新 configuration 与 projectile，不沿用失效的层 id 或基准。
