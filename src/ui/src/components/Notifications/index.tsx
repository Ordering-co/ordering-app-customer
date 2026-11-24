import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import { useTheme } from 'styled-components/native';
import { LoadingOverlay } from '../LoadingOverlay';

import {
  ScreenContainer,
  ContentContainer,
  SettingsWrapper,
  SettingItem,
} from './styles';
import { nativeTextStyle, themeColor, themeVisible } from '@/theme/helpers';

import {
  UserFormDetails as NotificationsController,
  useLanguage,
  useSession,
  useToast,
  ToastType,
} from '@components';

import { OText } from '@ui';

const NotificationsUI = (props: any) => {
  const {
    singleNotifications,
    handleChangePromotions,
    userData
  } = props;

  const theme: any = useTheme();
  // `components.switch`: the track on and off, and the thumb.
  const toggle = theme.native.components.switch.base
  const styles = useMemo(() => {
    const row = theme.native.components.list_row.base
    return StyleSheet.create({
      label: { ...nativeTextStyle(row.title), color: row.title_color },
    })
  }, [theme])
  const [{ user: userSession }] = useSession();
  const [, t] = useLanguage();
  const [, { showToast }] = useToast();

  const user = userData || userSession;
  // Decision P3: the profile row and this route hide with `menu.notifications`.
  const showNotifications = themeVisible(theme, 'menu.notifications')

  const notificationOptions = [
    { key: 'sms', label: t('SMS', 'SMS') },
    { key: 'email', label: t('EMAILS', 'Emails') },
    { key: 'notification', label: t('PUSH_NOTIFICATIONS', 'Push notifications') },
  ];

  const getInitialSetting = (settingKey: any, newsletterPath: any) => {
    if (singleNotifications?.result?.result?.settings?.[settingKey]) {
      return !!singleNotifications.result.result.settings[settingKey][newsletterPath];
    }
    if (singleNotifications?.changes?.settings?.[settingKey]) {
      return !!singleNotifications.changes.settings[settingKey][newsletterPath];
    }
    if (user?.settings?.[settingKey]) {
      return !!user.settings[settingKey][newsletterPath];
    }
    return false;
  };

  const [notificationsList, setNotificationsList] = useState<any>({
    email: getInitialSetting('email', 'newsletter'),
    sms: getInitialSetting('sms', 'newsletter'),
    notification: getInitialSetting('notification', 'newsletter')
  });

  const handleEditNotifications = (key: any, value: any) => {
    setNotificationsList((prevList: any) => ({
      ...prevList,
      [key]: value
    }));
  };

  useEffect(() => {
    if (singleNotifications.result.result && !singleNotifications.loading) {
      if (!singleNotifications.result?.error) {
        showToast(ToastType.Success, t('UPDATE_SUCCESSFULLY', 'Update successfully'));
      }
    }
  }, [singleNotifications.result])

  useEffect(() => {
    const isSingle = true
    handleChangePromotions(notificationsList, isSingle)
  }, [notificationsList])

  return (
    <ScreenContainer>
      <ContentContainer>
        {showNotifications && (
          <>
            <LoadingOverlay
              visible={singleNotifications?.loading}
              color={theme.native.components.spinner.base.color}
              overlayColor={themeColor(theme, 'overlay')}
            />
            <SettingsWrapper>
              <OText preset='body' color='text_muted' mBottom='md'>
                {t('NOTIFICATIONS_TEXT_TITLE', 'Set up promotional notifications you would like to receive from Ordering')}
              </OText>
              {notificationOptions.map((option) => (
                <SettingItem key={option.key}>
                  <OText style={styles.label}>{option.label}</OText>
                  <Switch
                    trackColor={{ false: toggle.off, true: toggle.on }}
                    thumbColor={toggle.thumb}
                    ios_backgroundColor={toggle.off}
                    onValueChange={(value) => handleEditNotifications(option.key, value)}
                    value={notificationsList[option.key]}
                    disabled={singleNotifications?.loading}
                  />
                </SettingItem>
              ))}
            </SettingsWrapper>
          </>
        )}
      </ContentContainer>
    </ScreenContainer>
  );
};

export const NotificationsList = (props: any) => {
  const notificationsListProps = {
    ...props,
    UIComponent: NotificationsUI
  };
  return <NotificationsController {...notificationsListProps} />;
};

