import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import { NotFoundSourceParams } from '../../types'
import { NotFound, IconBadge } from './styles'

import OButton from '../shared/OButton'
import OText from '../shared/OText'
import Icon from '../shared/Icon'

/**
 * The empty state of a list or a screen (`components.empty_state`; `simple`
 * is its `compact` variant): an icon or an image, a message and an action.
 */
export const NotFoundSource = (props: NotFoundSourceParams) => {
  const {
    hideImage,
    srcImage,
    content,
    subContent,
    iconName,
    btnTitle,
    btnStyle,
    conditioned,
    onClickButton,
    simple
  } = props

  const theme: any = useTheme();
  const empty = theme.native.components.empty_state
  const look = simple ? { ...empty.base, ...empty.variants.compact } : empty.base
  const styles = useMemo(() => StyleSheet.create({
    image: { width: '100%', height: look.image_size },
    action: { marginTop: look.actions_gap, width: '100%' }
  }), [look.image_size, look.actions_gap])

  return (
    <NotFound $simple={simple}>
      {iconName && (
        <IconBadge>
          <Icon name={iconName} size={look.icon_size} color='text_muted' />
        </IconBadge>
      )}
      {!hideImage && !simple && !srcImage && !iconName && (
        <IconBadge>
          <Icon set='mci' name='file-search-outline' size={look.icon_size} color='primary' />
        </IconBadge>
      )}
      {srcImage && (
        <FastImage
          style={styles.image}
          source={srcImage}
          objectFit='contain'
        />
      )}
      {content && conditioned && <OText preset='body_lg' color='text_disabled' align='center'>{content}</OText>}
      {content && !conditioned && (
        <OText
          preset={iconName ? 'h4' : 'body_lg'}
          weight={iconName ? 600 : undefined}
          align='center'
        >
          {content}
        </OText>
      )}
      {subContent && (
        <OText color='text_muted' align='center' mTop='xs'>
          {subContent}
        </OText>
      )}
      {!onClickButton && props.children && (
        props.children
      )}
      {onClickButton && (
        <View style={styles.action}>
          <OButton
            size='lg'
            style={{ width: '100%', ...btnStyle }}
            onClick={() => onClickButton()}
            text={btnTitle}
          />
        </View>
      )}
    </NotFound>
  )
}
