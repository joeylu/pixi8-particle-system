# 风与涡旋：气环列、旋卷与刃尾

## 原件证据

源 `C:/Unity/Donut/Assets/MasterStylizedProjectiles/Projectiles/TornadoShoots/Prefabs/Par_WindBullet.prefab`：Wind PS `7024346480256014488`（L110），renderMode4→Common/Models/Ring2.fbx，rate60；Velocity.z=-24到-2、inWorldSpace0，Initial/Shape/Emission/Size/Color/Velocity/ClampVelocity/SizeBySpeed/ColorBySpeed/CustomData启用。CurvySmoke `1365629445628899003`（L9821）rate6、Velocity.y2到6、orbitalY2、radial.98；TrailModule寿命1、minVertexDistance.02、dieWithParticles1，NullParticle+Mat_WindTrails双材质。WindShoot/WindBullet另外有4×4 Head UV帧和两TrailRenderer，AutoRotate分别-1400与1080度/秒，不能净相减。

## 构造与样本

Mat_CommonRing的_BaseTexture=Tex_WindRing.png、_MaskTexture=Tex_Ring1.png、_RampTexture=Tex_Gradient 2.png，共同依赖UberParticles.shadergraph与mesh投影。原始base图不等于最终旋环；完整外观需烘焙。该图实际_BaseTexture连接SampleTexture2D后通向BaseColor与Alpha，证据在`agent-documents/projectile-unity-study/evidence/master/shader-trace.json`。材质Blend整数不证明当前pipeline最终混合。

涡旋建议5层：透明锥形旋纹、前缘气环、后扩环列、淡烟卷、尘点。锥纹与烟卷可用明确spin-phase序列；环纹是静态弧形shape；烟形集合是group。目标无orbital/Noise/距离发射模块，需烘焙旋卷帧或用少量不同角度/速度近似，不能杜撰动力参数。WindShoot可另构4层风刃动画核/逆向细环/尾/碎光，保留双旋向，不把两个节点角速相抵。

估算例：D=24单位、v=120单位/秒，锥纹前宽.6D后宽2D、长3D；环寿命.35秒、rate18/秒，尺寸从.5D到1.6D；烟卷寿命.7秒、rate8/秒、低opacity；尘点rate5/秒。所有数值为二维设计估算，orbitalY2不是二维ω，禁止直接换算。

## 压缩、损失与命中

八系统压5层：BG/CoreTrails并旋纹，两Smoke并烟，CurvySmoke带状轨迹并预烘焙烟卷，Burst并尘点，控制根不占层。保留前窄后宽、旋向及负空间；mesh环重映射为椭圆/弧，3D轨道近似为帧，舍弃带子自遮挡/视差/体积光，损失路径急转连续性与逐粒子相位。命中4层压缩核.08秒、展开气环.35秒、散烟.7秒、尘点.5秒，均为估算；停止原持续旋纹，World烟排空。发射闪2层压气尖闪+单环，不能把涡旋循环放在发射口无限播放。
