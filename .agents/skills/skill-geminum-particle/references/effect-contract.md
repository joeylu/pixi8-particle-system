# Geminant 效果语义

[effect.schema.json](effect.schema.json) 是配置字段、结构和数值范围的唯一编辑源。这里补充单位和交互语义，不引入 Schema 以外的参数。entity 的 textureSets 提供资源，layers 数组为绘制顺序，最多 8 层；每层 main、modules、renderer 分别负责出生/模拟、行为和呈现。

## 时间与随机

main.startLifetime 是正秒数或 min/max 范围，出生时采样一次；年龄归一化、死亡和拖尾 TTL 读取个体寿命。startAlpha 是 0..1 单值/范围，startScale/startSpeed/startRotation 和 rotationOverLifetime.z 的范围同样出生固定。randomSeed 与 birthIndex 控制可复现，随机通道互不扰动。

modules.emission 是唯一发射时间表：rateOverTime（粒子/秒）、startDelay（首次延迟）、duration（窗口长度）、loop、bursts:[{time,count}]。省略 duration 表示无限窗口，不能 loop；有限窗口为 [0,duration)，连续出生在 n/rate、n 从 1 开始，零时刻出生使用 burst。duration=0 仅容纳 time=0 burst、rate=0、loop=false。循环要求 duration>0，不重复 startDelay、不重置存活粒子。所有同次 update 出生共享 maxBirthsPerUpdate 预算。

stop 取消未来发射，粒子及尾迹继续排空；pause 冻结时钟。有限效果完成要求无未来事件、无粒子、无尾迹。play/reset/宿主重播是控制动作，不写成粒子寿命。

## 运动与外观

shape 的 point/circle/rectangle 在局部出生基准取样。circle 的 innerRadius 默认 0，环带按面积均匀采样。directionMode=fixed 使用 directionRadians/spreadRadians；outward 的 circle 复用位置采样角，inward 在该角度加π；point 使用平面随机方向，inward 同样加π。两种径向模式均叠加 spreadRadians；rectangle 使用 fixed。inward 只设出生速度，不持续施加吸引力；无其他力时可能穿过中心继续前进，按半径/初速安排寿命或淡出。

forceOverLifetime 的 x/y 为所选模拟空间中恒定加速度，叠加宿主重力。limitVelocityOverLifetime.drag 是非负系数 k，单位 1/s；同一积分器求 dv/dt=a-kv。k=0 为恒加速度，恒输入时按解析解推进，不添加第二个位置/速度写入者。

alphaCurve、colorCurve、scaleCurve 均为 2–8 个严格递增的 {t,value}，覆盖 t=0 和 t=1，按归一化个体年龄分段线性插值。alphaCurve 乘出生 alpha，colorCurve 的 RGB 乘出生 tint，最终 tint 与贴图相乘；scaleCurve 乘出生尺寸。对应曲线存在时，endAlphaFactor/endTint/endScaleFactor 不参与该通道计算；没有曲线则终点参数表达两点插值。出生完成、首次渲染前计算 t=0。

startScale 是等比倍率；startScaleAspect:{x,y} 默认 1/1，乘在出生 X/Y 尺寸上。长度为逻辑单位，速度为逻辑单位/s，加速度为逻辑单位/s²，转角为弧度，z 为 rad/s。renderer.alignment=fixed/velocity；velocity 使用 atan2(vy,vx)-forwardAngle，加模拟 rotation，零速保持上一有效朝向。forwardAngle 是素材前向轴角。

local 外观随宿主容器变换；world 的出生位置和速度按宿主 affine 转换，外观旋转/尺寸由配置与 renderer 决定，不隐式继承宿主外观变换。gravityModifier 乘宿主给定重力；JSON 不含重力向量或游戏回调。

## 帧与资源

每个 textureSet 使用显式 textures 或 grid；显式顺序为 ordinal，grid 从左到右、从上到下。grid 等分无 spacing/padding，物理像素边缘必须整数，不接受 trim/rotate；同集帧必须共用 TextureSource。资源名不等于文件 URL。

textureSheetAnimation.selectionMode：single 指定 index；random 可用非空唯一 indices 池，出生固定取一帧；sequence 可用 clips（多个有序 ordinal 列表），出生选定一个 clip 和 fps（正单值/范围），随后按自身年龄播放。省略 indices/clips 使用全部帧。非循环从 clip 首帧开始、结束保持末帧；loop 可以 randomStartFrame，随机相位与播放速率独立。N 帧完整显示一个周期为 N/fps；不支持逐帧 duration。

modules.trails 与 renderer.trail 必须一起出现，尾迹使用单帧纹理，宽度固定、textureMode=stretch，lifetime 为个体总寿命倍数。dieWithParticles=false 允许死亡后残留；worldSpace 需要宿主空间绑定。尾迹每条 Mesh 成本另算，8 层不等于 8 次绘制。