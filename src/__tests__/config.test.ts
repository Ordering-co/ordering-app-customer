describe('config: the values the module normalises at load', () => {
  const load = (json: any) => {
    let loaded: any
    jest.isolateModules(() => {
      jest.doMock('../config.json', () => json)
      loaded = require('../config').default
    })
    return loaded
  }

  it.each([
    ['0', null],
    [0, null],
    ['', null],
    [null, null],
    ['1', 1],
    [3, 3],
    ['my-shop', 'my-shop']
  ])('turns businessSlug %p into %p', (value, expected) => {
    expect(load({ businessSlug: value, franchiseSlug: null }).businessSlug).toBe(expected)
  })

  it('leaves franchiseSlug as before: only the string 0 becomes null', () => {
    expect(load({ businessSlug: null, franchiseSlug: '0' }).franchiseSlug).toBeNull()
    expect(load({ businessSlug: null, franchiseSlug: '12' }).franchiseSlug).toBe('12')
    expect(load({ businessSlug: null, franchiseSlug: 'brand' }).franchiseSlug).toBe('brand')
  })
})
