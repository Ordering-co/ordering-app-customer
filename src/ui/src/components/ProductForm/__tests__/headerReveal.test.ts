import { headerBackgroundProgress, headerTitleProgress, contentTopWithoutImage } from '../headerReveal'

const RAMP = 16
const HEADER = 64

describe('headerBackgroundProgress', () => {
  it('is transparent while the content is below the buttons and solid once it reaches them', () => {
    // with an image: the sheet starts at 400 and reaches the header's bottom at 400 - 64
    expect(headerBackgroundProgress(0, 400, HEADER, RAMP)).toBe(0)
    expect(headerBackgroundProgress(400 - HEADER - RAMP, 400, HEADER, RAMP)).toBe(0)
    expect(headerBackgroundProgress(400 - HEADER, 400, HEADER, RAMP)).toBe(1)
    expect(headerBackgroundProgress(900, 400, HEADER, RAMP)).toBe(1)
  })

  it('fades in continuously between the two', () => {
    const mid = headerBackgroundProgress(400 - HEADER - RAMP / 2, 400, HEADER, RAMP)
    expect(mid).toBeCloseTo(0.5)
  })

  it('is never partly transparent over content: solid by the time the content enters the header zone', () => {
    // no image: the content starts right under the header plus the ramp
    const top = contentTopWithoutImage(HEADER, RAMP, 56)
    expect(top).toBe(HEADER + RAMP)
    expect(headerBackgroundProgress(0, top, HEADER, RAMP)).toBe(0)
    // the content's top enters the header's zone when scrollY > RAMP: solid by then
    expect(headerBackgroundProgress(RAMP, top, HEADER, RAMP)).toBe(1)
  })

  it('uses the fallback padding until the header is measured', () => {
    expect(contentTopWithoutImage(0, RAMP, 56)).toBe(56)
  })
})

describe('headerTitleProgress', () => {
  it('shows the title while the name goes under the header', () => {
    // name at 300 with 40 high; the header covers up to 64
    expect(headerTitleProgress(0, HEADER, 300, 40)).toBe(0)
    expect(headerTitleProgress(300 - HEADER, HEADER, 300, 40)).toBe(0)
    expect(headerTitleProgress(300 - HEADER + 20, HEADER, 300, 40)).toBeCloseTo(0.5)
    expect(headerTitleProgress(300 - HEADER + 40, HEADER, 300, 40)).toBe(1)
    expect(headerTitleProgress(1000, HEADER, 300, 40)).toBe(1)
  })
})
