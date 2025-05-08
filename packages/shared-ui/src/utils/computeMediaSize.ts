export function computeMediaSize(
    mediaAspectRatio?: number,
    mediaContainerWidth = 360
) {
    const baseWidth =
        mediaContainerWidth < 360 ? mediaContainerWidth * 0.85 : 360;

    if (!mediaAspectRatio) {
        return { width: baseWidth, height: 150 };
    }

    const computedWidth = baseWidth;
    const computedHeight = computedWidth / mediaAspectRatio;

    return { width: computedWidth, height: computedHeight };
}
