export function computeMediaSize(
    mediaAspectRatio?: number,
    mediaContainerWidth = 450
) {
    const baseWidth =
        mediaContainerWidth < 450 ? mediaContainerWidth * 0.85 : 450;

    if (!mediaAspectRatio) {
        return { width: baseWidth, height: 150 };
    }

    const computedWidth = baseWidth;
    const computedHeight = computedWidth / mediaAspectRatio;

    return { width: computedWidth, height: computedHeight };
}
