import React from 'react'
import { useTheme } from 'styled-components/native'
import { themePart } from '@/theme/helpers'
import ChoiceMark from '../shared/ChoiceMark'

/**
 * The theme's look for the booking screens (reservation, service,
 * professional): the selection mark. Their month calendar is `OCalendar`
 * (`shared/OCalendar`).
 */

/** A selection mark: the theme's radio (`components.radio`). */
export const RadioMark = ({ on, style }: { on: boolean, style?: any }) => {
  return <ChoiceMark kind='radio' checked={on} style={style} />
}
