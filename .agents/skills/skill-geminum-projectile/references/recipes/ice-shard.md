# 冰棱弹：实体棱角与延迟碎裂

## 原件证据

源 `C:/Unity/Donut/Assets/MasterStylizedProjectiles/Projectiles/SmallIceBullet/Prefabs/SmallIceBullet.prefab`：EnergyHead PS `4632893314836815007`（L14626），renderMode4、startSpeed0、寿命5，启用Initial/Emission/CustomData；材质Ice、UberParticles.shadergraph、_BaseTexture=Ice.png。Particles `821044967274113081`（L36）World空间寿命.2、startSpeed5。命中 `SmallIceBulletHit.prefab` 有16系统；IcicleSpike `9127804314732749146`（L63670）与SharpIcicle `7167203669714277098`（L73452）为mesh，Size曲线分别于归一化.154388/.192932达到1。DebrisStart t0 burst15，DebrisEndTop t1 burst8、DebrisEnd t1 burst5。

## 构造与样本

飞行4层：方向明确的冰棱、薄冷亮边、细窄尾、短冰屑。冰棱必须长尖硬边与不对称切面，不能拿蓝色火球替代。主体静态shape，冰屑是多轮廓shape group；冰刺生长若用帧必须另有明确growth→hold→break顺序，不能将任意冰片集合当sequence。

估算例（非原件值）：D=20单位，棱长2D、宽.6D，飞速220单位/秒，尾寿命.18–.3秒、rate24/秒，屑寿命.2–.4秒、rate8/秒。命中6层：.1秒白闪、.2秒长出的2D刺群、.6秒霜环、.9秒冷雾、t0起始屑、t1后破裂屑。延迟事件由宿主安排，不虚构粒子模块；生命周期按当前目标配置表达。

## 压缩与三维处置

保留棱角轮廓和先长后碎的两段节奏。mesh重映射到固定观看面明暗纹理，失去任意朝向切面；sphere体积屑改平面径向飞散，丢失前后遮挡。16系统压到6层：两种冰刺合一组，结束顶部/周边屑合一组，多个白核/光照并入白闪/霜环；失去独立3D朝向、顶部层次及场景投光。不能将t1所有burst移动到t0。停止飞行时杀掉跟随核，World尾/屑自然排空；命中刺群与碎裂使用独立事件。
