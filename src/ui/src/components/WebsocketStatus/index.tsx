import React, { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import RNRestart from 'react-native-restart'
import { themeGutter, themePart, themeSpace } from '@/theme/helpers'

import {
  Container,
  ModalContainer,
  ContentWrapper,
  CurrentStatusRow,
  LegendWrapper,
  StatusItemWrapper,
  StatusDot,
  StatusBody,
  ButtonRow,
  ReloadButtonWrapper
} from './styles'

import { OModal, OButton, OText, Icon } from '../shared'
import { useLanguage, useUtils, WebsocketStatus as WebsocketStatusController } from '@components'

const SocketStatusUI = (props: any) => {
  const {
    socketStatus,
    connectedDate
  } = props

  const theme: any = useTheme()
  const reload = themePart(theme, 'connection_status', 'slots.button')
  const styles = useMemo(() => StyleSheet.create({
    trigger: { marginVertical: themeSpace(theme, 'sm'), marginHorizontal: themeGutter(theme) },
  }), [theme])
  const [, t] = useLanguage()
  const [{ parseDate }] = useUtils()
  const [openModal, setOpenModal] = useState(false)

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'warning';
      case 1:
        return 'success';
      case 2:
        return 'danger';
      default:
        return 'warning';
    }
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return t('CONNECTING', 'Connecting')
      case 1:
        return t('CONNECTED', 'Connected')
      case 2:
        return t('DISCONNECTED', 'Disconnected')
      default:
        return t('CONNECTING', 'Connecting')
    }
  }

  const isDisconnected = socketStatus === 2

  return (
    <Container>
      <OButton
        text={t('CONNECTION_STATUS', 'Status')}
        color='neutral'
        appearance='tonal'
        size='sm'
        icon={<Icon set='mci' name='circle' size='sm' color={getStatusColor(socketStatus)} />}
        style={styles.trigger}
        onClick={() => setOpenModal(true)}
      />

      <OModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      >
        <ModalContainer nestedScrollEnabled={true}>
          <ContentWrapper>
            <OText preset='h3' align='center' mBottom='sm'>{t('CONNECTION_STATUS', 'Connection status')}</OText>
            <CurrentStatusRow>
              <Icon set='mci' name='circle' size='sm' color={getStatusColor(socketStatus)} />
              <OText preset='h4'>{getStatusLabel(socketStatus)}</OText>
            </CurrentStatusRow>
            <OText align='center' mBottom='lg'>
              {t('LAST_UPDATE', 'Last update')}: {parseDate(connectedDate)}
            </OText>
            <LegendWrapper>
              <StatusItemWrapper>
                <StatusDot>
                  <Icon set='mci' name='circle' size='sm' color={getStatusColor(1)} />
                </StatusDot>
                <StatusBody>
                  <OText preset='h4' weight={500}>{t('OK', 'Ok')}</OText>
                  <OText color='text_muted'>{t('WEBSOCKET_OK', 'The websocket works normally.')}</OText>
                </StatusBody>
              </StatusItemWrapper>
              <StatusItemWrapper>
                <StatusDot>
                  <Icon set='mci' name='circle' size='sm' color={getStatusColor(0)} />
                </StatusDot>
                <StatusBody>
                  <OText preset='h4' weight={500}>{t('CONNECTING', 'Connecting')}</OText>
                  <OText color='text_muted'>{t('WEBSOCKET_CONNECTING', 'The websocket is connecting.')}</OText>
                </StatusBody>
              </StatusItemWrapper>
              <StatusItemWrapper>
                <StatusDot>
                  <Icon set='mci' name='circle' size='sm' color={getStatusColor(2)} />
                </StatusDot>
                <StatusBody>
                  <OText preset='h4' weight={500}>{t('DISCONNECTED', 'Disconnected')}</OText>
                  <OText color='text_muted'>{t('WEBSOCKET_DISCONNECTED', 'The server is slow, please reload.')}</OText>
                </StatusBody>
              </StatusItemWrapper>
            </LegendWrapper>

            {isDisconnected && (
              <ButtonRow>
                <ReloadButtonWrapper>
                  <OButton
                    onClick={() => RNRestart.restart()}
                    size={reload.size}
                    color={reload.color}
                    appearance={reload.appearance}
                    text={t('RELOAD', 'Reload')}
                  />
                </ReloadButtonWrapper>
              </ButtonRow>
            )}
          </ContentWrapper>
        </ModalContainer>
      </OModal>
    </Container>
  )
}

export const WebsocketStatus = (props: any) => {
  const socketProps = {
    ...props,
    UIComponent: SocketStatusUI
  }
  return <WebsocketStatusController {...socketProps} />
}
