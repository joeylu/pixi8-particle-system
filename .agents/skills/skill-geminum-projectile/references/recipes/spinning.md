# 旋转弹：手里剑与星形硬核

## 原件证据

源 `C:/Unity/Donut/Assets/MasterStylizedProjectiles/Projectiles/Shurikens/Prefabs/ShurikenBullet.prefab`：L9806嵌套Common/Models/Shuriken.fbx，L9824 AutoRotate.RotateAngle=(0,-720,0)。`Scripts/AutoRotate.cs:10`用Transform.Rotate(angle*deltaTime,Space.Self)。Sparkle PS `8843151686388034270`（L4879）World空间、distance rate3、Noise与Size启用；根`7300938123587259680`（L38）无Emission。手里剑真实model旋转，不能当UV序列。Star/Prefabs/StarBullet.prefab的Head `3321280325463875378`（L36）是mesh、大小.25、寿命.4、startSpeed0、Initial/Emission/CustomData；没有本地AutoRotate证据，Star旋转只能作为新设计。

## 构造与样本

手里剑3层：带中心空隙的硬轮廓、细旋亮边、经过路径的小碎点。静态shape+二维角度变化是平面旋转；若要求真实侧面翻转必须明确side→front→side帧序的新制sequence，不能拿多个不同形状假装旋转帧。星弹变体保留五角/多角尖核与较软光芒，构造仍需轮廓可读而非只改颜色。

估算例：D=28单位、v=200单位/秒，屏幕旋转ω=600度/秒（新设计值），亮边宽1.1D、opacity.25；World点ρ=.03/单位→rate6/秒，寿命.3秒。-720是原件local Y轴，只有选定摄像机投影后才能映射，不能直接当屏幕ω；宿主移动方向与核旋角分开。

## 命中与三维处置

原ShurikensHit八系统可压4层：双Slash合交叉切口，CoreSpike/LightCone/CoreWhite合瞬闪，Spike2与碎亮合外溅，Circle保留。失去双Slash独立相位和3D投影。估算核闪.1秒、交叉裂线.25秒、环.35秒、碎片.5秒。保留旋向与硬轮廓，重映射真实mesh为固定观看面纹理，近似深度翻面为有限帧，舍弃真实自遮挡/表面光照。hit需杀掉随行旋核后排空World点，不让旧核继续旋转遮住命中。
