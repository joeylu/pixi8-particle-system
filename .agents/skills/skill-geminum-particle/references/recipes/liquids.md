# 水流喷溅

用于落水、喷流、流水碰撞后的泡沫和涟漪。先确认液体材料；SmokeWisps只能承担水雾，不能独自证明水流。

原作证据：`Prefabs/Loop/pf_vfx-ult_demo_psys_loop_blackwater.prefab`，水底19809820/L343用rapids-blur-x2.png、size22.5..25；涟漪19829462/L4748用ripple.png、size0→1；splashes19848008/L9171实际是smoke.png固定随机帧、rate128/s；rain19862004/L22296实际rain-s3.png、Y速度-10..-12.5。基础 `Expansions/XP - CONSTR. KIT/Prefabs/Oneshot/Liquids/pf_vfx-ult_xp-ckit_psys_oneshot_liquid.prefab`，198030044662963420/L44，用liquid.png8×8、burst1、life.5s、size2、speed0，帧Hermite切线2→0。序列自身演化承担喷溅。路径只作来源标识。

侧视将水带、落点泡沫、水滴、表面薄圈合成1..4职责，总计≤8。水平涟漪可用startScaleAspect压成椭圆，侧视避免巨大的正圆。流带保持方向，水滴velocity alignment须校准素材前向轴；水雾比水滴大且alpha低，泡沫局限落点。水主体通常normal保轮廓，亮点可add；黑底材料先核对alpha。sequence播放有序喷溅段，静态ripple只靠scaleCurve展开；统一fps近似不了原作非匀速取帧，写适配。

建议例子，非原样复刻：以喷溅包络高180像素为例，落点主体t0 burst1、life.5s、startSpeed0；真实32帧喷溅clip用fps64。水滴t0 burst10、life.35.. .7s、朝上扇形startSpeed100..200像素/秒、向下恒force400像素/秒²，泡沫life.8s、scaleCurve(0,.5),(.2,1),(1,1.2)。扁圈寿命.7s、aspect x1/y.2、scale由.1到1，宽度约主喷溅1.2倍。上下符号由宿主约定，位置与速度使用宿主像素单位，素材scale仍按真实可见包围框换算。

独立水滴抛落优先选一颗可读水珠/液体碎片；密集雨点场是整片图案，只适合作喷雾片或覆盖，不能把几张场簇向上移动就当成水滴弹道。水冠素材要承担弧形水片或上扬喷溅轮廓，泡沫湍纹只负责水面。第一轮错配时针对缺失的形态重新检索，不反复搜索整句“清水粒子”。

缺滴/液体clip时保留真实泡沫与水雾并列缺图brief；不造水贴图ID，不承诺折射或真实撞地回弹。预定落点发射是美术模拟，不能写成碰撞响应。省三维和shader会损失透明水感及深度，但不因美学近似阻断已有可运行配置。
