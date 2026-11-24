import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SessionsParams } from '../../types'
import { useTheme } from 'styled-components/native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'
import { themeImage, themeSpace } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'
import Icon from '../shared/Icon'

import {
  SessionsWrapper,
  SessionItem,
  Container
} from './styles'

import { useLanguage, useSession, useUtils, Sessions as SessionsController } from '@components'
import { NotFoundSource, OAlertOriginal as OAlert, OButton, OText } from '@ui'

export const SessionsUI = (props: SessionsParams) => {
  const {
    sessionsList,
    actionState,
    handleDeleteSession,
    handleDeleteAllSessions
  } = props

  const [, t] = useLanguage()
  const [{ user }] = useSession()
  const [{ parseDate }] = useUtils()
  const theme: any = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    grow: { flex: 1 },
    action: { marginTop: themeSpace(theme, 'lg') }
  }), [theme])
  // The page's sections in the theme's order.
  const { render } = usePageSections('sessions')
  const [confirm, setConfirm] = useState<any>({ open: false, content: null, handleOnAccept: null, id: null, title: null })

  const onDeleteSession = (session: any) => {
    setConfirm({
      open: true,
      title: t('WEB_APPNAME', 'Ordering'),
      content: [t('QUESTION_DELETE_SESSION', 'Are you sure to delete this session?')],
      handleOnAccept: () => {
        handleDeleteSession(session)
        setConfirm({ ...confirm, open: false })
      }
    })
  }

  const onDeleteAllSessions = (isOldUser: any, deleteCurrent: any) => {
    setConfirm({
      open: true,
      title: t('WEB_APPNAME', 'Ordering'),
      content:
        isOldUser
          ? [t('QUESTION_ENABLE_ALL_SESSIONS', 'Are you sure to enable all sessions?')]
          : deleteCurrent
            ? [t('QUESTION_DELETE_ALL_SESSIONS', 'Are you sure that you want to delete all sessions?')]
            : [t('QUESTION_DELETE_ALL_SESSIONS_EXCEPT_CURRENT', 'Are you sure that you want to delete all sessions except current?')],
      handleOnAccept: () => {
        handleDeleteAllSessions(deleteCurrent)
        setConfirm({ ...confirm, open: false })
      }
    })
  }

  const renderBulkActions = () => (
    <>
      <OButton
        text={t('DELETE_ALL_SESSIONS_EXCEPT_CURRENT', 'Delete all sessions except current')}
        disabled={actionState.loading}
        style={styles.action}
        onClick={() => onDeleteAllSessions(false, false)}
      />
      <OButton
        text={t('DELETE_ALL_SESSIONS', 'Delete all sessions')}
        appearance='outline'
        disabled={actionState.loading}
        onClick={() => onDeleteAllSessions(false, true)}
      />
    </>
  )

  return (
    <Container showsVerticalScrollIndicator={false}>
      {user?.session_strategy === 'jwt_session' ? (
        <>
          {sessionsList.loading && (
            <SessionsWrapper>
              {[...Array(7).keys()].map(i => (
                <SessionItem key={i}>
                  <Placeholder Animation={Fade}>
                    <View style={styles.row}>
                      <View style={styles.grow}>
                        <PlaceholderLine width={40} />
                        <PlaceholderLine width={40} />
                      </View>
                      <PlaceholderLine width={10} />
                    </View>
                  </Placeholder>
                </SessionItem>
              ))}
            </SessionsWrapper>
          )}

          {!sessionsList.loading && sessionsList.sessions.length > 0 && (
            <SessionsWrapper>
              {sessionsList.sessions.map((session: any) => (
                <SessionItem key={session.id}>
                  <View style={styles.row}>
                    <View>
                      <OText color={theme.native.components.list_row.base.subtitle_color}>{parseDate(session.created_at)}</OText>
                      <OText>{parseDate(session.valid_thru)}</OText>
                    </View>
                  </View>
                  <View style={styles.row}>
                    {session.current && (
                      <OText color='primary' mRight='md'>{t('CURRENT', 'Current')}</OText>
                    )}
                    <OButton
                      iconOnly
                      color='neutral'
                      appearance='ghost'
                      accessibilityLabel={t('DELETE', 'Delete')}
                      icon={<Icon name='close' size='sm' />}
                      onClick={() => onDeleteSession(session)}
                    />
                  </View>
                </SessionItem>
              ))}
              {render({ bulk_actions: renderBulkActions })}
            </SessionsWrapper>
          )}

          {!sessionsList.loading && sessionsList.sessions.length === 0 && (
            <NotFoundSource
              srcImage={themeImage(theme, 'empty.sessions')}
              content={t('NO_LOGIN_FOUND', 'No login found')}
            />
          )}
        </>
      ) : (
        <SessionsWrapper>
          <OText>
            {t('YOU_DONT_HAVE_ENABLED_THE_SESSIONS', 'You don\'t have enabled the sessions, please active them to have a better control of your sessions.')}
          </OText>
          <OButton
            text={t('ACTIVE_SESSIONS', 'Active sessions')}
            disabled={actionState.loading}
            onClick={() => onDeleteAllSessions(true, false)}
            style={styles.action}
          />
        </SessionsWrapper>
      )}
      <OAlert
        open={confirm.open}
        title={confirm.title}
        content={confirm.content}
        onAccept={confirm.handleOnAccept}
        onCancel={() => setConfirm({ ...confirm, open: false, title: null })}
        onClose={() => setConfirm({ ...confirm, open: false, title: null })}
      />
    </Container>
  )
}

export const Sessions = (props: SessionsParams) => {
  const sessionsProps = {
    ...props,
    UIComponent: SessionsUI,
    sortByDate: 'desc'
  }
  return <SessionsController {...sessionsProps} />
}
