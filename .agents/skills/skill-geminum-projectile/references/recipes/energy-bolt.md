# 能量弹

适合快速、有限寿命的单发弹；辨识来自沿速度拉长的亮头和短拖尾。宿主移动弹头，每次发射形成独立弹体，连续射击仍是多个弹体，不能合成持续光束。

证据：`C:/Unity/Donut/Assets/QFX/ProjectilesFX/VFX_Prefabs/Projectiles_Particles/VFX_Cyber_Projectile_Only.prefab`，L28834 fileID `2216830344071879081` 主弹寿命 2、速度 15，Renderer mode=1，启用 Collision/Sub/Trail；L14474 fileID `2216830343411377736` 为 stretched sparks，寿命 .15–.45、速度 0–4。L19263 fileID `2216830343846765595` 的 Trail 使用 mode=4。以上是 Unity 源值，不是像素参数。

压成 4–5 层：局部空间窄亮头、局部淡光晕、世界空间烘焙渐细拖带、世界短火星、可选低频矩形残片。头朝宿主速度旋转，尾留在经过的位置；火星稍偏离路径，不能每层都同宽同寿命。源中的多个矩形层合并会丢失尺度节奏，mesh 拖带需换成二维烘焙轮廓，不能声称复现三维几何。

材质按 GUID 读取实际 shader 和混合：PFX_Particles.shader L26 使用材质 `_SrcBlend/_DstBlend`，普通 `_MainTex` 在 L127–128 空间采样。需要独立窄 streak、soft glow、细点及可选矩形纹理；轮廓族放随机静态图集，只有明确连续变化才用时间帧。使用自有或获授权来源，不复制包内纹理，不填写虚构资产 ID。

二维估计示例：速度 650px/s，头长 28px、宽 7px，拖带寿命 .12s，火星 .1–.25s，光晕 20px。这些需预览定标。宿主负责命中停头、停止尾部新增并让既有尾粒子自然排空，命中效果另建静止资产。当前没有距离发射；已知恒速时可把期望密度 rho 近似换为 rate=rho×speed，变速时该密度仅是近似；当前没有在线设置发射率接口，不承诺自动等距。不能保留源 noise/tile 模块为有效能力。

材质完整性：Ares/MFX_Trail_2.mat 使用 noise 主图+FX_Mask_1 红通道，PFX_Trail.shader L144–165 双速滚动后乘 mask；原始 noise 不能当完整 trail。此运行器用自有素材烘焙最终渐细轮廓/序列，或明确静态近似并接受滚动层次损失。RGB 黑底图可在加色下有效，透明混合则需正确遮罩；保存贴图槽只在 shader 实际采样时才生效。
