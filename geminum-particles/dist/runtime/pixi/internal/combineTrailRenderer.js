import { PixiTrailRenderer, validatePixiTrailRenderOptions } from '../PixiTrailRenderer.js';
import { syncFunction, undefinedResult } from '../../core/validation.js';
export function requireTrailBinding(observers, options) {
    const trails = observers?.find(observer => observer.id === 'trails');
    if (!!trails !== !!options)
        throw new TypeError('Trails and trailRenderer must be provided together');
    if (options)
        validatePixiTrailRenderOptions(options);
    return trails;
}
export function combineTrailRenderer(body, trails, options) {
    let tail;
    try {
        syncFunction(body.sync, 'body renderer.sync');
        syncFunction(body.destroy, 'body renderer.destroy');
        if (trails) {
            tail = new PixiTrailRenderer({ ...options, trails });
            syncFunction(tail.sync, 'trail renderer.sync');
            syncFunction(tail.destroy, 'trail renderer.destroy');
        }
    }
    catch (error) {
        const failures = [];
        for (const child of [body, tail])
            try {
                if (child)
                    undefinedResult(child.destroy());
            }
            catch (failure) {
                failures.push(failure);
            }
        if (failures.length)
            throw Object.assign(new Error('Trail construction and cleanup failed'), { cause: error, cleanupErrors: failures });
        throw error;
    }
    let cleanupFailure;
    const disposed = new Set();
    const renderer = {
        sync(snapshot) { undefinedResult(body.sync(snapshot)); if (tail)
            undefinedResult(tail.sync()); return undefined; },
        destroy() { const errors = []; for (const child of [body, tail]) {
            if (!child || disposed.has(child))
                continue;
            try {
                undefinedResult(child.destroy());
                disposed.add(child);
            }
            catch (error) {
                errors.push(error);
            }
        } if (errors.length && !cleanupFailure)
            cleanupFailure = Object.assign(new Error('Particle renderer cleanup failed'), { cleanupErrors: errors }); if (cleanupFailure)
            throw cleanupFailure; return undefined; },
    };
    return { renderer, trailContainer: tail?.container };
}
