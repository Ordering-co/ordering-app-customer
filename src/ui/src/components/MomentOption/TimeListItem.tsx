import React from 'react'
import { Pressable } from 'react-native'
import { OptionRow, OptionLabels } from './styles'
import { OText } from '../shared'
import { RadioMark, useMomentLooks } from './RadioMark'

const timeListItemPropsAreEqual = (prevProps: any, nextProps: any) => {
  return JSON.stringify(prevProps.time) === JSON.stringify(nextProps.time) &&
    prevProps.selected === nextProps.selected
}

export const TimeListItem = React.memo((props: any) => {
  const {
    time,
    selected,
    onSelect
  } = props
  const looks = useMomentLooks()

  const label = time.endText ? `${time.text} – ${time.endText}` : time.text

  return (
    <Pressable
      onPress={() => onSelect(time.value)}
      accessibilityRole='radio'
      accessibilityState={{ checked: selected }}
    >
      <OptionRow style={looks.row}>
        <RadioMark selected={selected} />
        <OptionLabels>
          <OText style={[looks.rowTitle, selected && looks.rowTitleSelected]}>
            {label}
          </OText>
        </OptionLabels>
      </OptionRow>
    </Pressable>
  )
}, timeListItemPropsAreEqual)
