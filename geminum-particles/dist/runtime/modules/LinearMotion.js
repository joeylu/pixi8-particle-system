export function createLinearMotion() {
    return () => ({
        id: 'LinearMotion', phase: 'motion', updateWrites: ['x', 'y'],
        update(p, ctx) {
            if (ctx.gravityModifier !== undefined && ctx.gravityModifier !== 0)
                throw new TypeError('Nonzero gravityModifier requires KinematicMotion');
            p.x += p.vx * ctx.dtSeconds;
            p.y += p.vy * ctx.dtSeconds;
            return undefined;
        },
    });
}
