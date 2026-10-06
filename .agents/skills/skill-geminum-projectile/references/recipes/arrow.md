# 箭矢：硬轮廓与轨迹尾

## 原件证据

源 `C:/Unity/Donut/Assets/MasterStylizedProjectiles/Projectiles/Arrow/Prefabs/ArrowBullet.prefab`：Arrow PS `4632893314836815007`（L9911）renderMode4、startSpeed0、寿命.4，Initial/Emission/CustomData启用。CyanBlueArrow材质引用UberParticles.shadergraph，_BaseTexture/_EmissionMap等槽为Arrow.psd。Light `4607049114249733469`（L36）是低速常驻光，根PS `7300938123587259680`（L5069）没有Emission；另有真实TrailRenderer `Trail`，不是粒子尾系统。根飞行由BulletShooter动态添加Bullet后Translate执行。

## 构造与样本

2层即可：箭形及同层 Trails、微弱光晕。箭纹理包含尖头/细杆/尾翼，单张静态shape，朝向由宿主控制。尾纹理是细实线渐透明，不用火焰翻卷序列。现有 Trails 有界缓存历史点，worldSpace 留在世界；没有距离发射模块。缺少适用尾带素材时可另加世界印迹层，接受断续与转弯接缝。

估算例：箭宽D=12单位、长3.5D、v=300单位/秒；尾宽.18D、点TTL=.16秒，若箭头startLifetime=2秒，则trails.lifetime=.08，minVertexDistance可从2单位试起。备用印迹间距4单位，rate≈75/秒，只近似恒速。光晕直径1.2D、峰值低于箭亮面。直线高速箭应让轮廓先读到，不能靠大量粒子制造实体。

## 三维处置与事件

保留箭头/杆/尾翼方向关系；真实mesh烘焙固定投影，丢失侧面体积和翻滚。TrailRenderer重映射为现有粒子轨迹带，保留路径连贯，失去沿尾宽度曲线和逐点年龄淡出。原件三PS含非发射根，配置层数不对应原组件数。ArrowMuzzle六系统可压为定向尖闪+薄环2层，多个mesh边/白核合并，损失独立相位。

ArrowHit的CoreSpike为inactive，根没有Emission；不得声称提取到完整可见爆炸。建议新设计命中为.1秒尖白闪、.25秒短切口、.35秒碎亮3层，沿入射方向偏置，不默认圆形火爆。hit需宿主冻结落点、删除随行箭头并排空尾迹；不要让消失的箭轮廓继续挂在命中中心。
