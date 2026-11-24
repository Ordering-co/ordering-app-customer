import React, { useEffect, useMemo, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import RNRestart from 'react-native-restart'
import { useTheme } from 'styled-components/native'

import { NoNetworkParams } from '../../types'
import { OText, OButton } from '../shared'
import { themeImage, themePart, themeSpace } from '@/theme/helpers'

import { Container, ImageContainer } from './styles'

import { useLanguage } from '@components'

/** `components.connection_status`: its margin and its button slot; the image is `empty.no_internet`. */
export const NetworkError = (props: NoNetworkParams) => {
  const {
    image,
    reason = 'offline',
    onRetry,
    retrying = false,
    nextRetryAt = null
  } = props
  const theme: any = useTheme()
  const [, t] = useLanguage()
  const button = themePart(theme, 'connection_status', 'slots.button')
  const styles = useMemo(() => StyleSheet.create({
    // The illustration's box: a share of the screen, the image's own proportions.
    image: { width: '80%', height: undefined, aspectRatio: 9 / 8 },
    button: { marginTop: themeSpace(theme, 'xxl') },
    countdown: { marginTop: themeSpace(theme, 'md'), textAlign: 'center' },
  }), [theme])

  // The seconds to the next automatic retry, counted down once a second.
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!nextRetryAt) return
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [nextRetryAt])
  const seconds = nextRetryAt ? Math.max(0, Math.ceil((nextRetryAt - now) / 1000)) : null
  const unreachable = reason === 'unreachable'

  return (
    <Container>
      <OText preset='h3' mBottom={themePart(theme, 'connection_status', 'base.margin')}>
        {unreachable
          ? t('SERVER_UNREACHABLE', 'We can\'t reach our servers')
          : t('MOBILE_NO_INTERNET', 'No internet connection')}
      </OText>
      <OText>
        {unreachable
          ? t('SERVER_UNREACHABLE_MESSAGE', 'Your data is safe. We\'ll keep trying while the app is open, or you can retry now.')
          : t('NETWORK_OFFLINE_MESSAGE', 'Your connection appears to be off-line. Try to refresh the page')}
      </OText>
      <ImageContainer>
        <Image
          source={image || themeImage(theme, 'empty.no_internet')}
          style={styles.image}
          resizeMode='contain'
        />
        <OButton
          text={onRetry ? t('RETRY', 'Retry') : t('REFRESH', 'Refresh')}
          size={button.size}
          color={button.color}
          appearance={button.appearance}
          style={styles.button}
          loading={retrying}
          onClick={() => (onRetry ? onRetry() : RNRestart.restart())}
        />
        {!retrying && seconds !== null && (
          <OText preset='body_sm' color='text_muted' style={styles.countdown}>
            {t('RETRYING_IN_SECONDS', 'Trying again in _seconds_ s').replace('_seconds_', String(seconds))}
          </OText>
        )}
      </ImageContainer>
    </Container>
  )
}
