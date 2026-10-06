# 持续火焰

用于篝火、燃烧口、持续喷焰。先区别团状火和方向性火舌：团状素材可随机转，向上火舌应保持主方向。火源停止发射后让存活粒子自然排空。

原作证据：campFire `Prefabs/Loop/pf_vfx-ult_demo_psys_loop_campFire.prefab`，19809446/L250，fire.png静图、add、rate8/s、life.5..1、ForceY2；19863382/L22293同纹理normal混合；19852880/L17816名fire实际smoke2.png动画加色、ForceY3.6。基础 `Prefabs/Loop/pf_vfx-ult_demo_psys_loop_realisticFireAlpha.prefab`，198783328636305050/L4637，realisticFire2.png、8×8一周期、rate5/s、life1.5..3、size2..4、speed0。内部火舌变化可以来自原地播放而非上移。证据路径不构成运行依赖。

二维可用暗焰轮廓、亮焰、低频烟、稀疏余烬几个职责；通常2..4层，具体素材能合并时减少，最多8层。轮廓normal保暗边、亮焰add，烟normal置后；若主图已经有明暗轮廓，先用一层。焰主体高宽比依据真实图，烟宽度可为焰的1..1.5倍，余烬远小于焰。灰度火/烟图需要用startTint或colorCurve乘染为目标暖色，配合亮核与暗边；彩色烘焙图先保留自身颜色，避免再次强染。原作橙色只是证据，不是固定色值。真实序列用sequence；固定随机烟帧用random，不把同图随机帧宣称为内部动画。N/fps应与寿命同量级，避免过早停末帧。

建议例子，非原样复刻：以火焰包络高180像素为例，火源rectangle宽40像素、rate12/s、life1..1.2s、向上startSpeed30..60像素/秒、force沿上方向80像素/秒²、scaleCurve(0,.6),(.2,1),(1,.4)，alphaCurve(0,0),(.1,1),(.75,.8),(1,0)。若有24帧clip可用fps24，先检查播放后段是否适合短暂停留；烟rate2/s、life1.6s、余烬rate5/s。

上方向随宿主Y约定；Unity Velocity是速度，不能复制为二维force。静图火能产生闪动外观，却没有火舌演化，应记录缺图brief。省热扭曲与真实照明有可见代价；只作warning，不因层数少或风格偏差阻止可运行交付。
