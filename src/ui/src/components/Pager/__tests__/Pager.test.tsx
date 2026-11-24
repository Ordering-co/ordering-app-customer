/**
 * The pager (src/ui/src/components/Pager): one page per item, the index of a
 * settled swipe, goTo/next for buttons, the autoplay loop and the dots.
 */
import React from 'react'
import { FlatList, Text } from 'react-native'
import { act, fireEvent } from '@testing-library/react-native'
import { Pager, PagerDots, PagerHandle, pageAt } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

const items = ['one', 'two', 'three']

const renderPager = (props: Partial<React.ComponentProps<typeof Pager<string>>> = {}) => {
  const ref = React.createRef<PagerHandle>()
  const onIndexChange = jest.fn()
  const utils = renderWithProviders(
    <Pager
      ref={ref}
      data={items}
      pageWidth={300}
      renderItem={({ item }) => <Text>{item}</Text>}
      keyExtractor={(item) => item}
      onIndexChange={onIndexChange}
      renderOverlay={({ index, count }) => <Text testID="overlay">{`${index + 1}/${count}`}</Text>}
      {...props}
    />
  )
  return { ...utils, ref, onIndexChange }
}

const settleAt = (list: any, x: number) =>
  fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x, y: 0 } } })

describe('Pager', () => {
  afterEach(() => jest.useRealTimers())

  it('rounds a settled offset to its page, inside the list', () => {
    expect(pageAt(0, 300, 3)).toBe(0)
    expect(pageAt(310, 300, 3)).toBe(1)
    expect(pageAt(899.6, 300, 3)).toBe(2)
    expect(pageAt(5000, 300, 3)).toBe(2)
    expect(pageAt(-20, 300, 3)).toBe(0)
    expect(pageAt(100, 0, 3)).toBe(0)
  })

  it('renders every page and reports the page a swipe settles on', () => {
    const { getByText, UNSAFE_getByType, getByTestId, onIndexChange } = renderPager()
    items.forEach(item => expect(getByText(item)).toBeTruthy())
    const list = UNSAFE_getByType(FlatList)
    expect(list.props.horizontal).toBe(true)
    expect(list.props.pagingEnabled).toBe(true)
    expect(list.props.getItemLayout(null, 2)).toEqual({ length: 300, offset: 600, index: 2 })
    act(() => { settleAt(list, 600) })
    expect(onIndexChange).toHaveBeenCalledWith(2, 0)
    expect(getByTestId('overlay').props.children).toBe('3/3')
    // The same page again is no change.
    act(() => { settleAt(list, 601) })
    expect(onIndexChange).toHaveBeenCalledTimes(1)
  })

  it('moves with goTo and next, looping after the last page', () => {
    const { ref, onIndexChange, getByTestId } = renderPager()
    act(() => ref.current?.goTo(2))
    expect(onIndexChange).toHaveBeenLastCalledWith(2, 0)
    act(() => ref.current?.next())
    expect(onIndexChange).toHaveBeenLastCalledWith(0, 2)
    act(() => ref.current?.goTo(9))
    expect(getByTestId('overlay').props.children).toBe('3/3')
  })

  it('autoplays, and waits while the user drags', () => {
    jest.useFakeTimers()
    const { onIndexChange, UNSAFE_getByType } = renderPager({ autoplayMs: 1000 })
    act(() => { jest.advanceTimersByTime(1000) })
    expect(onIndexChange).toHaveBeenLastCalledWith(1, 0)
    const list = UNSAFE_getByType(FlatList)
    act(() => { fireEvent(list, 'scrollBeginDrag') })
    act(() => { jest.advanceTimersByTime(3000) })
    expect(onIndexChange).toHaveBeenCalledTimes(1)
    act(() => { settleAt(list, 300) })
    act(() => { jest.advanceTimersByTime(1000) })
    expect(onIndexChange).toHaveBeenLastCalledWith(2, 1)
  })
})

describe('PagerDots', () => {
  it('draws one dot per page, the current one active', () => {
    const onPress = jest.fn()
    const { getAllByTestId, getByTestId } = renderWithProviders(<PagerDots count={4} index={1} onPress={onPress} />)
    expect(getAllByTestId(/^pager-dot/)).toHaveLength(4)
    fireEvent.press(getAllByTestId('pager-dot')[2])
    expect(onPress).toHaveBeenCalledWith(3)
    expect(getByTestId('pager-dot-active')).toBeTruthy()
  })

  it('draws nothing for a single page', () => {
    const { toJSON } = renderWithProviders(<PagerDots count={1} index={0} />)
    expect(toJSON()).toBeNull()
  })
})
