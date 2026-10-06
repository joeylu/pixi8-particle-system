# 火花余烬

用于金属擦碰、焊接、火源余烬和短促热碎点。高速火花强调短条方向与弧线，余烬强调低速飘起和逐渐暗下；先选职责再决定尾迹。

原作证据：`Prefabs/Loop/pf_vfx-ult_demo_psys_loop_sparks.prefab`，198000010463177108/L640用droplet.png、add、rate250/s、life1..4、speed1..4、gravity2、stretched Renderer；198000012380079992/L9582用capsule3.png、rate500/s、size.04.. .08。基础 `Expansions/XP - CONSTR. KIT/Prefabs/Oneshot/Sparks/pf_vfx-ult_xp-ckit_psys_oneshot_sparks3.prefab`，198137499466921364/L44，Renderer不绘制粒子头，burst4共8轮间隔.01s、life.4.. .8、speed4..8、gravity1；solidGlow.png尾迹TTL为寿命.05.. .08倍、宽0→1→0，碰撞bounce.4。路径只审计。

二维可合并为快速亮条、少量长尾和慢余烬1..3职责，最多8层。亮条用真实capsule类静图，velocity alignment对准素材前向轴、startScaleAspect控制长宽；add适合发光但观察背景曝光。静图选single或random，不需要假造动画。光点尺度建议主体冲击宽度的.01.. .04倍；寿命和初速共同控制扩散距离，重力决定弧线，不把Unity magnitude/dampen转换成同值drag。

建议例子，非原样复刻：以飞散半径120像素为例，burst时刻0/.02/.04各8粒、life.3.. .6s、扇形startSpeed200..400像素/秒、向下force400像素/秒²、drag1/s；alphaCurve(0,1),(.6,.8),(1,0)，scaleCurve(0,.8),(.15,1),(1,.3)，长宽aspect为x3/y1且校准forwardAngle。长尾另用单帧真实纹理，modules.trails与renderer.trail配对，lifetime=.08（寿命倍数），固定宽；余烬可rate4/s、life1s。

八轮源burst可展开为显式time列表，当前没有repeatInterval字段。固定宽尾迹无法复刻锥形宽度，速度朝向不等于速度拉伸；长条静图可近似但需写明。没有碰撞能力时按轨迹自然消失，不能承诺落地反弹。缺尾迹素材可保留亮条，记录缺图而不编造ID。
