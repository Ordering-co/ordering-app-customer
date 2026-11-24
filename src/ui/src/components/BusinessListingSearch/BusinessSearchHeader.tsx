import React, { useState } from 'react'
import { useTheme } from 'styled-components/native'

import { BContainer } from './styles'
import { BusinessesFilters } from './BusinessesFilters'
import { useLanguage } from '@components'
import {
  OText,
  SearchBar,
  NotFoundSource,
  BusinessTypeFilter
} from '@ui'
import { usePageSections } from '@/theme/sections'
import { themeVisible } from '@/theme/helpers'

/**
 * The head of the search page (`pages.business_search`): the search bar, the
 * categories and the filters in the theme's order; the results follow.
 */
export const BusinessSearchHeader = (props: any) => {
  const {
    businessesSearchList,
    onChangeTermValue,
    termValue,
    handleChangeFilters
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  // The text the user sees in the field: `termValue` follows it after the search's pause.
  const [typed, setTyped] = useState<string>(termValue ?? '')
  const { render, isVisible } = usePageSections('business_search')
  const noResults = (!businessesSearchList.loading && !businessesSearchList.lengthError && businessesSearchList?.businesses?.length === 0)

  const renderSearch = () => (
    <>
      <SearchBar
        lazyLoad
        placeholder={t('SEARCH_BUSINESSES', 'Search Businesses')}
        onSearch={(val: string) => onChangeTermValue(val)}
        onChangeText={(val: string) => setTyped(val)}
        searchValue={termValue}
        isCancelXButtonShow={termValue.length > 0}
      />
      {themeVisible(theme, 'business_search.hint') && typed.trim().length < 2 && (
        <OText preset='body_sm' color='text_muted'>
          {t('TYPE_AT_LEAST_2_CHARACTERS', 'Type at least 2 characters')}
        </OText>
      )}
    </>
  )

  const renderCategories = () => (
    <BusinessTypeFilter
      pillSize={theme.native.components.filters.slots.chip.size}
      handleChangeBusinessType={(type: string) => handleChangeFilters('business_types', type ? [type] : [])}
    />
  )

  const renderFilters = () => <BusinessesFilters {...props} />

  return (
    <BContainer>
      {render({
        search: renderSearch,
        categories: renderCategories,
        filters: renderFilters
      })}
      {/* Without the filter bar, the loading rows and the results count still show. */}
      {!isVisible('filters') && <BusinessesFilters {...props} />}

      {noResults && (
        <NotFoundSource
          content={t('NOT_FOUND_BUSINESSES', 'No businesses to delivery / pick up at this address, please change filters or change address.')}
        />
      )}
    </BContainer>
  )
}
