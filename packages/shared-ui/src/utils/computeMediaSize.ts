export function computeMediaSize(
    mediaAspectRatio?: number,
    mediaContainerWidth = 300
) {
    const baseContainerWidth = mediaContainerWidth || 300;
    const computedWidth =
        baseContainerWidth < 300 ? baseContainerWidth * 0.85 : 300;
    const computedHeight = mediaAspectRatio
        ? computedWidth * mediaAspectRatio
        : 150;

    return { width: computedWidth, height: computedHeight };
}
