export function resetParticleModuleData(data) {
    data.birthIndex = 0;
    data.directionRadians = 0;
    data.startScaleX = 1;
    data.startScaleY = 1;
    data.startRotationRadians = 0;
    data.startTint = 0xffffff;
    data.startAlpha = 1;
    return undefined;
}
export function createParticleModuleData() {
    return { birthIndex: 0, directionRadians: 0, startScaleX: 1, startScaleY: 1, startRotationRadians: 0, startTint: 0xffffff, startAlpha: 1 };
}
