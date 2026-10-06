# 发射闪光

这是发射点的独立静止粒子资产，由宿主在发射事件触发一次；不跟随弹体，也不是弹体层移到枪口。方向可由宿主发射方向设置，粒子产生后留在该次发射位置，后续枪口移动不得拖走旧闪光。

证据：`C:/Unity/Donut/Assets/QFX/ProjectilesFX/VFX_Prefabs/Flashes/VFX_Comet_Flash.prefab` L35 fileID `866264817605975053` Sparks、L4883 fileID `2707926972777729854` Stars、L9751 fileID `7536481754351467188` Glow (1)；这些是独立 Flash Prefab。`VFX_Resources/Scripts/PFX_ProjectileObjectWeapon.cs` L49 实例化 FlashFX，L51 按 FlashFXDestroyDelay 清理，与 L53 创建 projectile 分开。

3–4 层足够：极短白核、稍大的柔光、向前散射短火星、可选符号轮廓。核抢先出现且最先灭，火星稍晚仍可读；不要复制飞行拖尾，不能让持续 rate 形成常驻光球。枪口版以发射方向扇出，魔法释放版可径向分布，二者通过形状和节奏区别，不能只改色。三维锥形压成二维扇形会丢失深度，Bloom 的亮度扩张用受控柔光贴片近似。

需要 flare/streak 核、soft glow、短火星或静态符号。flare 空间轮廓无需时间图集；确有开花过程才提供连续帧，随机轮廓族独立声明。实际材质需查 `_SrcBlend/_DstBlend`，PFX_Particles.shader L26 参数化 Blend、L127–128 主纹理采样。使用自有/授权素材，不复制原包，不虚构在线资源 ID。

二维估计：白核寿命 .04–.08s、宽12px，柔光 .12s、直径36px，火星 .15–.3s、爆发6–10枚，前向角宽35°。这些是预览起点，不是 Unity 源参数。资产按自身时钟完成并清理；宿主负责重复发射的新实例、发射点坐标与朝向。火星可保留世界空间，发射事件结束后不重播，不依赖 collision/subemitter/noise；每个 flash 独立且最多8层。
