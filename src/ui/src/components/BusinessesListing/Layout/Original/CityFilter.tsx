import React, { memo, useCallback, useMemo } from 'react'

import { useLanguage } from '@components'
import OSelect, { SelectOption } from '../../../shared/OSelect'
import { OrderContextPill } from '../../../shared/OrderContextPill'
import { CityFilterRow, CityFilterSelect } from './styles'

interface Props {
  cities?: Array<{ id: number, name: string, enabled?: boolean }>
  /** The order's city, `null`/`undefined` for all of them. */
  cityId?: number | null
  disabled?: boolean
  onChange: (cityId: number | null) => void
}

/**
 * The city filter of pickup without an address: the order options' pill (the
 * order type and moment look) that opens the app's select with "All cities" and
 * the enabled cities. Choosing one only calls `onChange`; the order context
 * stores it and the list asks for that city's businesses once.
 */
export const CityFilter = memo(({ cities, cityId, disabled, onChange }: Props) => {
  const [, t] = useLanguage()
  const allCities = t('ALL_CITIES', 'All cities')

  const options: SelectOption[] = useMemo(() => [
    { value: null, label: allCities },
    ...(cities || []).filter((city) => city?.enabled).map((city) => ({ value: city.id, label: city.name }))
  ], [cities, allCities])

  // The select also hands the option: the order context takes only the id.
  const handleSelect = useCallback((value: number | null) => onChange(value), [onChange])

  const renderTrigger = useCallback(({ open, selected, disabled: off }: any) => (
    <OrderContextPill
      testID='business-list-city-filter'
      text={selected?.label ?? allCities}
      disabled={off}
      onPress={open}
    />
  ), [allCities])

  return (
    <CityFilterRow>
      <CityFilterSelect>
        <OSelect
          title={t('FILTER_BY_CITY', 'Filter by city')}
          options={options}
          // `OSelect` compares with `===`: no city is `null`, never `undefined`.
          value={cityId ?? null}
          disabled={disabled}
          onSelect={handleSelect}
          renderTrigger={renderTrigger}
        />
      </CityFilterSelect>
    </CityFilterRow>
  )
})
