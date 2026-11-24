import React from 'react'
import { useTheme } from 'styled-components/native'
import { themePart } from '@/theme/helpers'
import OButton from './OButton'
import Icon from './Icon'

interface Props {
  onClick?: () => void
  accessibilityLabel?: string
  testID?: string
  icon?: string
}

export const EditButton = ({ onClick, accessibilityLabel, testID, icon = 'pencil-outline' }: Props) => {
  const theme: any = useTheme()
  const slot = themePart(theme, 'checkout', 'slots.edit')
  return (
    <OButton
      testID={testID}
      iconOnly
      color={slot.color}
      appearance={slot.appearance}
      size={slot.size}
      accessibilityLabel={accessibilityLabel}
      onClick={onClick}
      icon={<Icon set='mci' name={icon} color={slot.appearance === 'ghost' ? 'text_muted' : undefined} />}
    />
  )
}
