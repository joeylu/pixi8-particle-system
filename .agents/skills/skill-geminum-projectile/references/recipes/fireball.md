# 火焰弹：热核与残留火尾

## 原件证据

源 `C:/Unity/Donut/Assets/MasterStylizedProjectiles/Projectiles/SmallFireBullet/Prefabs/SmallFireBullet.prefab`：CenterLight PS fileID `7537485722929905639`（L112），Trail `5859815570234300078`（L9925），Sparkle `8843151686388034270`（L14760）。前两者 renderMode=1，启用 Initial/Shape/Emission/Size/CustomData；startSpeed0.01不是弹速。Sparkle World空间，寿命0.5、distance rate3、Noise strength1.35、frequency0.5。Trail 大小曲线归一化键 `(0,.046154)→(.138149,.990056)→(1,0)`。CenterLight/Trail 材质 CommonStaticTrails 使用 UberParticles.shadergraph、_BaseTexture=StaticTrail.png；Sparkle用Flare6cg材质的Flare10.png。纹理是输入，需结合拉伸、遮罩与透明处理；不称原始base图为最终弹头。

## 构造与样本

原四系统含不发射控制根。二维飞行建议3层：白热尖核、偏暖细长火尾、稀疏火星。弹头跟随宿主位移，尾与火星留在经过的位置；尾纹理从亮尖到透明毛边，火星用静态小菱形，均为 shape group，不能按文件顺序宣称逐帧动画。目标没有 Noise/距离发射能力；使用低幅初始横向速度与少量随机角度近似扰动，已知速度v、目标密度ρ时用 rate≈vρ，必须注明世界/逻辑单位换算。

估算例（非Unity换算）：D=24逻辑单位、v=240单位/秒；核宽D长1.3D，尾宽0.7D、寿命0.25秒、ρ=.12/单位，则rate≈29/秒；火星ρ=.025则rate≈6/秒、寿命0.35–0.55秒、初始横向速度±12。尾opacity迅速到峰后降零，size先小后撑再收，具体字段交配置编译器。

## 三维处置与命中

保留快起慢退与核尾明度差；拉伸Billboard重映射为沿flightDirection定向纹理；3D Noise仅近似，舍弃深度软交与投光。合并CenterLight/Trail重叠亮度后失去独立脉冲。命中另用核闪0.1秒、火裂边0.3秒、环0.45秒、火星0.6秒共4层，轮廓扩至约3D。发射闪用核闪+尖边2层。宿主在hit冻结落点并停止飞行发射；尾排空，不把火尾循环当爆炸。纹理须新建/合法已有资源，不复制商业包。
