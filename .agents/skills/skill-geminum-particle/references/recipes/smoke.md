# 烟尘雾

用于冲击扬尘、火后烟团、驻留薄雾。事件烟用burst与快速扩张；环境雾用低频连续发射与慢淡入，先决定时间职责再挑图。

原作证据：`Prefabs/Loop/pf_vfx-ult_demo_psys_loop_realisticSmokeWispsCombined.prefab`，198447971229798232/L106、198883990615947086/L9168，两种真实SmokeWisps序列，life2..4、size3.5..4、rate.5.. .75/s、speed0且无速度/力模块；原地序列已承担卷动。基础 `Prefabs/Oneshot/pf_vfx-ult_demo_psys_oneshot_realisticSmokeBurst.prefab`，198843324624394938/L75，burst2、life2..3、size3..5、realisticSmokeBurst.png8×8，size(.0,.5),(.1,1),(1,1)，alpha约0/.05/.5/1对应0/1/1/0。路径只审计。

二维把浓团轮廓与薄雾覆盖压成1..3职责，最多8层，不增加没有视觉差异的同图层。扬尘由落点向两侧或沿受击方向扩张；驻留雾可低速横移。近烟尺寸为基准1，薄雾可大1.5..2倍而alpha更低。暗烟normal才能保留遮挡，亮雾可add但需背景检查。random为出生固定挑一帧，sequence才随年龄播放；同图集中真实连续段才组clip，不凭烟名字给所有帧循环。

建议例子，非原样复刻：以扬尘包络宽240像素为例，t0 burst3、life1.2..1.8s、startSpeed20..50像素/秒、circle半径10像素、outward；scaleCurve(0,.45),(.12,1),(1,1.4)，alphaCurve(0,0),(.08,.7),(.65,.45),(1,0)。真实24帧clip可fps20；最短寿命覆盖全片，较长寿命会停末帧，须配合淡出观察。若做薄雾可rate1/s、life3s、startScaleAspect为x2/y1，从可见宽度换算scale。

没有动画时改用真实静烟帧、尺度和位移表达外扩，明确缺少内部卷动。当前不支持噪声场、随机发射率及体积深度穿插；可取固定代表速率并让帧、出生位置和寿命提供差异。省三维会减弱层间穿透感，记录适配而不发明模块。
