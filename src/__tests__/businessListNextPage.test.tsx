import React from 'react'
import { renderHook } from '@testing-library/react-native'
import { renderWithProviders } from '../../jest/helpers/renderWithProviders'
import { useNextPageRequest } from '@/ui/src/components/BusinessesListing/Layout/Original/useNextPageRequest'
import { BusinessCardSkeleton } from '@/ui/src/components/BusinessController/BusinessCardSkeleton'

jest.mock('@/ui/src/components/BusinessController/BusinessCard', () => ({
  useBusinessCardVisibility: () => ({ header: true, logo: true })
}))

const nearEnd = { nativeEvent: { contentOffset: { y: 5000 }, contentSize: { height: 6000 } } }
const businesses = [{ id: 1 }]

describe('next page of the business list', () => {
  it('asks for a page once while the request has not started loading', () => {
    const getBusinesses = jest.fn()
    const { result } = renderHook(() => useNextPageRequest(
      { loading: false, businesses }, { currentPage: 1, totalPages: 3 }, getBusinesses
    ))
    result.current(nearEnd)
    result.current(nearEnd)
    result.current(nearEnd)
    expect(getBusinesses).toHaveBeenCalledTimes(1)
  })

  it('releases the lock when the request ends', () => {
    const getBusinesses = jest.fn()
    let list: any = { loading: false, businesses }
    const { result, rerender } = renderHook(() => useNextPageRequest(list, { currentPage: 1, totalPages: 3 }, getBusinesses))
    result.current(nearEnd)
    list = { loading: true, businesses }
    rerender({})
    result.current(nearEnd)
    list = { loading: false, businesses }
    rerender({})
    result.current(nearEnd)
    expect(getBusinesses).toHaveBeenCalledTimes(2)
  })

  it('does not ask on the last page or far from the end', () => {
    const getBusinesses = jest.fn()
    const { result } = renderHook(() => useNextPageRequest(
      { loading: false, businesses }, { currentPage: 3, totalPages: 3 }, getBusinesses
    ))
    result.current(nearEnd)
    expect(getBusinesses).not.toHaveBeenCalled()
  })

  it('the skeleton accepts the negative count a list with repeated pages produces', () => {
    // total 120, 170 businesses after two concatenated copies of a page: 120 - 170 = -50.
    for (const count of [-50, NaN, Infinity, 2.7]) {
      expect(() => renderWithProviders(<BusinessCardSkeleton count={count} />)).not.toThrow()
    }
  })
})
