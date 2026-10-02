import { finite, knownKeys, object, syncFunction } from '../core/validation.js';
const forceOwners = new WeakSet();
export function createKinematicMotion(config = {}) {
    if (arguments.length > 0 && arguments[0] === undefined)
        throw new TypeError('KinematicMotion config cannot be explicitly undefined');
    object(config, 'KinematicMotion config');
    knownKeys(config, ['force'], 'KinematicMotion');
    if ('force' in config)
        syncFunction(config.force, 'force factory');
    const forceFactory = config.force;
    return () => {
        let force = { accelerationX: 0, accelerationY: 0 };
        if (forceFactory) {
            const created = forceFactory();
            object(created, 'force provider');
            knownKeys(created, ['accelerationX', 'accelerationY'], 'force provider');
            finite(created.accelerationX, 'accelerationX');
            finite(created.accelerationY, 'accelerationY');
            if (forceOwners.has(created))
                throw new TypeError('Force provider must be a distinct runtime per system');
            forceOwners.add(created);
            force = Object.freeze({ accelerationX: created.accelerationX, accelerationY: created.accelerationY });
        }
        return {
            id: 'KinematicMotion', phase: 'motion', updateWrites: ['x', 'y', 'vx', 'vy'],
            update(p, ctx) {
                const dt = ctx.dtSeconds;
                let ax = force.accelerationX, ay = force.accelerationY;
                if (ctx.gravityModifier !== undefined && ctx.gravityModifier !== 0) {
                    if (!ctx.environment)
                        throw new TypeError('Gravity requires environment');
                    let gx = ctx.environment.gravity.x * ctx.gravityModifier, gy = ctx.environment.gravity.y * ctx.gravityModifier;
                    finite(gx, 'gravity.x * gravityModifier');
                    finite(gy, 'gravity.y * gravityModifier');
                    if (ctx.simulationSpace !== 'world') {
                        const matrix = ctx.environment.emitterTransform, determinant = matrix.a * matrix.d - matrix.b * matrix.c;
                        const x = (matrix.d / determinant) * gx + (-matrix.c / determinant) * gy;
                        const y = (-matrix.b / determinant) * gx + (matrix.a / determinant) * gy;
                        finite(x, 'local gravity.x');
                        finite(y, 'local gravity.y');
                        gx = x;
                        gy = y;
                    }
                    ax += gx;
                    ay += gy;
                    finite(ax, 'force + gravity.x');
                    finite(ay, 'force + gravity.y');
                }
                const deltaVX = ax * dt, deltaVY = ay * dt;
                const motionX = p.vx * dt, motionY = p.vy * dt;
                const forceX = (0.5 * deltaVX) * dt, forceY = (0.5 * deltaVY) * dt;
                finite(deltaVX, 'deltaVX');
                finite(deltaVY, 'deltaVY');
                finite(motionX, 'motionX');
                finite(motionY, 'motionY');
                finite(forceX, 'forceX');
                finite(forceY, 'forceY');
                const displacementX = motionX + forceX, displacementY = motionY + forceY;
                finite(displacementX, 'displacementX');
                finite(displacementY, 'displacementY');
                p.x += displacementX;
                p.y += displacementY;
                p.vx += deltaVX;
                p.vy += deltaVY;
                return undefined;
            },
        };
    };
}
