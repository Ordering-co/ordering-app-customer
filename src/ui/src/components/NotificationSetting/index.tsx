import React, { useEffect, useMemo } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { themeGutter, themeSpace } from '@/theme/helpers';
import { openSettings, checkNotifications } from 'react-native-permissions';

import { useLanguage } from '@components'
import { OBottomPopup, OButton, OText } from '../shared';

interface NotificationSettingPropsParams {
  checkNotificationStatus: { open: boolean, checked: boolean };
  setCheckNotificationStatus: (notificationStatus: any) => void;
}

export const NotificationSetting = (props: NotificationSettingPropsParams) => {
  const { checkNotificationStatus, setCheckNotificationStatus } = props
  const theme: any = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { width: '100%' },
    textContainer: { width: '100%', paddingHorizontal: themeGutter(theme), paddingBottom: themeSpace(theme, 'lg') },
    action: { width: '70%', alignSelf: 'center', marginBottom: themeSpace(theme, 'xl') }
  }), [theme]);
  const [, t] = useLanguage();

  // The sheet opens only while the app is active:
  // opened under a system sheet (iOS's "Save password" after logging in) the
  // Modal is never presented, stays "visible" and blocks the touches above it.
  const openWhenActive = () => {
    const open = () => setCheckNotificationStatus({ open: true, checked: false })
    // Waits only while inactive or in the background (at launch the state can still be unknown).
    if (AppState.currentState !== 'inactive' && AppState.currentState !== 'background') {
      open()
      return undefined
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return
      subscription.remove()
      open()
    })
    return subscription
  }

  const requestLocationPermission = async () => {
    const notificationStatus = await checkNotifications()
    if (notificationStatus?.status === 'blocked') {
      return openWhenActive()
    }
    setCheckNotificationStatus({ open: false, checked: true })
    return undefined
  };

  const callOpenSettings = () => {
    openSettings()
      .catch(() => console.warn('cannot open settings'))
      .finally(() => setCheckNotificationStatus({ open: false, checked: true }))
  }

  useEffect(() => {
    let subscription: { remove: () => void } | undefined
    let cancelled = false
    requestLocationPermission().then((pending) => {
      if (cancelled) pending?.remove()
      else subscription = pending
    })
    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [])

  return (
    <OBottomPopup
      open={checkNotificationStatus?.open}
      onClose={() => setCheckNotificationStatus({ open: false, checked: true })}
      title={t('ENABLE_NOTIFICATIONS', 'Enable notifications')}
    >
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <OText align='center'>
            {t('ACTIVE_NOTIFICATION_TO_RECEIVE_INFORMATION', 'Activate notifications to receive information about your orders')}
          </OText>
        </View>
        <View style={styles.action}>
          <OButton
            text={t('ENABLE_NOTIFICATIONS', 'Enable notifications')}
            onClick={() => callOpenSettings()}
          />
        </View>
      </View>
    </OBottomPopup>
  );
};
