# 剑气：有限宽刃面

## 原件证据

源 `C:/Unity/Donut/Assets/MasterStylizedProjectiles/Projectiles/RedSwordBeam/Prefabs/Par_RedSwordBeam.prefab`：主体PS `2177278090331188314`（L4927），BGTrails `541527439525180989`（L36），startSpeed0、寿命1.01；CoreTrails `322694119455092858`（L14730）inactive。主体Initial/Emission/Color/CustomData启用；材质Mat__SlashHead→UberParticles.shadergraph→_BaseTexture Tex_SlashHead.png、_RampTexture Tex_Gradient 8.png。BGTrails用CloudNoise.png、Tex_SlashHeadMask.png；Burst `1373436936127719685`（L9815）World空间并有Velocity/ClampVelocity/Noise。

## 构造与样本

3层：宽弧形刃面、薄硬亮刃、后方断裂点。刃面横向展开、沿法线方向飞行，是有限宽移动切片，不是无限射线。主体用新制crescent/横弧shape，曲面与遮罩连续变化若烘焙为sequence必须明示open→full→dissolve；普通噪声和刃形不得同组冒充动画。当前配置不支持原ShaderGraph自定义流/溶解，有限帧是近似。

估算例：刃跨度6D、厚度.5D，D=16单位、v=180单位/秒，淡背刃宽度约1.2倍主体、opacity≤.3；World断点rate16/秒、寿命.2–.4秒；短生命周期脉冲只改变核亮度，不改变宿主射程。Muzzle3层刃闪/环/前冲点，约.1/.35/.5秒。

## 命中与压缩

原Hit十一PS含两个inactive节点。建议6层：短核闪、长切口、淡背光、细火星、大碎亮、烟。双SlashHitSparkle并一个刃口亮斑；BG/HorizontalFlare合背光；两类Particles保留尺度差；舍弃inactive的线与环。核闪.1秒，切口.25秒、烟.7秒为估算。飞散沿切口切向和入射方向，不能默认360度爆炸。

保留刃跨度与薄厚层次；3D轴向投影为平面弧线；Noise改少量初始速度随机；材质遮罩/UV滚动近似为有限帧，丢失连续参数与独立遮罩通道。hit停止移动刃面，保留已经产生的World断点自然消退，命中中心独立生成。
