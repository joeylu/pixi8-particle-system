# 宿主运动与结束交接

本页给配置消费方，不作为效果 JSON 字段表。运行符号从目标项目 SDK 发现，不依赖 module 源码路径。配置不包含碰撞、目标、速度控制回调或动态端点。

## 移动发射器

宿主提供 `space:{emitter,world}`，world 包含 emitter。先设发射位置／前向角，再创建并 play；每步先更新 emitter 位置／朝向，再 entity.update(dtSeconds)。local 头部随它移动，world 烟保留历史出生位置。SDK 绑定的输出容器变换归 SDK 管理，不直接重挂或改写它们；setOrigin 只改后续出生偏移，不是移动已有头部。

一次外部 update 只采一个宿主 pose；内部切片不会知道帧内的飞行路径。高速烟迹需要宿主提供合理的轨迹采样；对已知直线可在宿主真实时间段内插 pose，弯曲路径需实际路径值。固定当前 pose 后反复调用小 dt 不会恢复运动。gravity 是宿主参数，副作用只在明确采用重力的层启用。

## 命中或取消

到达真实结束位置时，由宿主将 emitter 设置到该 pose，然后 `entity.stop({killLayerIds:[实际头层id,...]})`。它停止所有层的后续出生，并仅让所列层的活粒子立即经历正常死亡；`dieWithParticles=false` 的同层尾迹仍保留，其他烟层的活粒子继续自然消散。正常 `stop()` 不立即清头。继续 update 直到 entity.state 为 stopped，再 destroy。

该 stop 参数是 SDK 控制接口，不写进效果 JSON。无需在外部直接 reset 某个 layer.system。低层 `system.stop({killParticles:true})` 为同样的立即死亡语义；不重置已有尾迹 TTL。paused 时停止不会擅自恢复时间，有余留则 resume 后继续 drain。reset/destroy 会清除整套所属运行数据，不能用来替代保留余尾的命中收尾。

不要移动 emitter 回池再等待尾迹结束；先在结束 pose 完成 stop，保留所需宿主绑定到实体停止。Flash 在源点播放，impact 在真实接触点以法线／命中方向放置，各自有独立实体和所有权。停止生成效果不等于返还资源；共享 Textures/Source 和宿主容器由宿主管理。

## 直梁适配

只含束身的 local 效果以 +X 和基准长度 L0 制作。对 start/end，宿主计算中点、atan2(dy,dx)、长度 L，设置其专用 emitter 的位置、rotation 和 scale.x=L/L0，scale.y 保持宽度比例；不把端点闪光或世界烟装进同一被拉伸的束身。中点计算还需考虑真实图像的可见中心偏移；锚点固定 0.5，不存在 JSON anchor 字段。

零长度时隐藏／停止束身并保持有效非零变换，不给空间绑定传不可逆矩阵。此适配不提供曲线几何、UV平铺、端点碰撞或 Shader 流动。没有这样的宿主适配器时只能交付固定长度局部束身，并明确未实现动态连接。
