import { useCallback, useEffect, useRef } from 'react'

const PIXELS_TO_SCROLL = 2000

/**
 * The scroll handler that asks for the next page of businesses. A scroll fires many events
 * before the list reports `loading`, and two requests for the same page concatenate its
 * businesses twice: the lock holds from the request until the list stops loading. It is a ref,
 * so a scroll event never sets state.
 */
export const useNextPageRequest = (businessesList: any, paginationProps: any, getBusinesses?: (...args: any[]) => any) => {
  const requestedRef = useRef(false)
  const loading = !!businessesList?.loading

  useEffect(() => {
    if (!loading) requestedRef.current = false
  }, [loading])

  // The latest list and pagination for a handler that keeps its identity.
  const latest = useRef({ businessesList, paginationProps, getBusinesses })
  latest.current = { businessesList, paginationProps, getBusinesses }

  return useCallback(({ nativeEvent }: any) => {
    const { businessesList: list, paginationProps: pagination, getBusinesses: fetchPage } = latest.current
    const y = nativeEvent.contentOffset.y
    const height = nativeEvent.contentSize.height
    const hasMore = pagination.totalPages !== pagination.currentPage

    if (
      !requestedRef.current && y + PIXELS_TO_SCROLL > height && list && !list.loading &&
      hasMore && list?.businesses?.length > 0 && fetchPage
    ) {
      requestedRef.current = true
      fetchPage()
    }
  }, [])
}
