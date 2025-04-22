export function computeMediaSize(
    mediaAspectRatio?: number,
    mediaContainerWidth = 300
) {
    const baseWidth =
        mediaContainerWidth < 350 ? mediaContainerWidth * 0.85 : 300;

    if (!mediaAspectRatio) {
        return { width: baseWidth, height: 150 };
    }

    const computedWidth = baseWidth;
    const computedHeight = computedWidth * mediaAspectRatio;

    return { width: computedWidth, height: computedHeight };
}
