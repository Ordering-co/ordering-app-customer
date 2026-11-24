/**
 * The product page's solid header: how much of it shows for a scroll offset.
 * The content must never be seen under the floating buttons, so the header is
 * solid by the time the top of the content (the sheet, or the summary with no
 * image) reaches the bottom of the header's zone, and fades in over `ramp` before.
 */
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** 0 (floating buttons only) to 1 (solid header). */
export const headerBackgroundProgress = (scrollY: number, contentTop: number, headerHeight: number, ramp: number) => {
  const solidAt = Math.max(contentTop - headerHeight, ramp)
  return clamp01((scrollY - (solidAt - ramp)) / ramp)
}

/** The scroll offset where the content starts to enter the header's zone, as the top padding of the scroll content when there is no image. */
export const contentTopWithoutImage = (headerHeight: number, ramp: number, fallback: number) =>
  headerHeight > 0 ? headerHeight + ramp : fallback

/** 0 to 1 while the product name goes under the header's bottom edge (its height is the distance). */
export const headerTitleProgress = (scrollY: number, headerHeight: number, nameTop: number, nameHeight: number) =>
  clamp01((scrollY + headerHeight - nameTop) / Math.max(nameHeight, 1))
