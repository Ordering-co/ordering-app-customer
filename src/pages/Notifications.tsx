import React from 'react';
import { NavBar, NotificationsList as NotificationsController, SafeAreaViewWrapper } from '@ui';
import { useLanguage } from '@components';
import { openScreen } from '@/navigators/appNavigation'

const NotificationsList = (props: any) => {
  const [, t] = useLanguage()
  const notificationsProps = {
    ...props,
    useSessionUser: true,
    useValidationFields: true,
    refreshSessionUser: true,
    goToBack: () => props.navigation?.canGoBack() && props.navigation.goBack(),
    onNavigationRedirect: (route: string, params: any) =>
      openScreen(props.navigation, route, params),
  };

  return (
    <>
      <NavBar
        title={t('NOTIFICATIONS', 'Notifications')}
        onActionLeft={() => notificationsProps.goToBack()}
      />
      <SafeAreaViewWrapper>
        <NotificationsController {...notificationsProps} />
      </SafeAreaViewWrapper>
    </>
  )
};

export default NotificationsList;
