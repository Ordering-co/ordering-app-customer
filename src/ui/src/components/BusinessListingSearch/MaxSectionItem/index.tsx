import React, { useMemo } from 'react'
import { TouchableOpacity } from 'react-native'

import { ProgressContentWrapper, ProgressBar, MaxContainer, SectionWrapper } from './styles'
import { useLanguage, useUtils } from '@components'
import { OText } from '../../shared'
import { useTheme } from 'styled-components/native'
import { nativeTextStyle, themeOpacity, themeSpace } from '@/theme/helpers'

/** A max-value picker of the search filters: `components.slider`. */
export const MaxSectionItem = (props: any) => {
  const {
    filters,
    handleChangeFilters,
    title,
    options,
    filter
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils();
  const look = useMemo(() => {
    const slider = theme.native.components.slider.base
    const slop = themeSpace(theme, 'sm')
    return {
      mark: { ...nativeTextStyle(slider.mark), color: slider.mark_color },
      active: { color: slider.mark_active },
      slop: { top: slop, bottom: slop, left: slop, right: slop },
      pressed: themeOpacity(theme, 'pressed')
    }
  }, [theme])

  const parseValue = (option: number) => {
    return filter === 'max_distance'
      ? `${option / 1000} ${t('KM', 'Km')}`
      : filter === 'max_eta'
        ? `${option} ${t('TIME_MIN', 'min')}`
        : parsePrice(option)
  }

  const progressWidth = ((options.indexOf(filters?.[filter]) / 3) * 100)

  return (
    <SectionWrapper>
      {!!title && (
        <OText preset='body_lg' weight='bold' mBottom='sm'>
          {title}
        </OText>
      )}
      <ProgressContentWrapper>
        <ProgressBar style={{ width: `${progressWidth ?? 100}%` }} />
      </ProgressContentWrapper>
      <MaxContainer>
        {options.map((option: any, i: number) => {
          const selected = filters?.[filter] === option || (option === 'default' && (filters?.[filter] === 'default' || !filters?.[filter]))
          return (
            <TouchableOpacity
              onPress={() => handleChangeFilters(filter, option)}
              key={option}
              hitSlop={look.slop}
              activeOpacity={look.pressed}
            >
              <OText weight='bold' style={[look.mark, selected && look.active]}>
                {option === 'default' ? `${parseValue(options[i - 1])}+` : parseValue(option)}
              </OText>
            </TouchableOpacity>
          )
        })}
      </MaxContainer>
    </SectionWrapper>
  )
}
