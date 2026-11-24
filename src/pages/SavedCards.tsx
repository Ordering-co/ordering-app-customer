import React from 'react';

import { useLanguage, useSession } from '@components';
import { SavedCards as SavedCardsController, NavBar, SafeAreaViewWrapper } from '@ui';
import { goHome, openScreen } from '@/navigators/appNavigation'

const SavedCards = ({ route, navigation }: any) => {
  const [{ user }] = useSession();
  const [, t] = useLanguage();

  const savedCardsProps = {
    navigation,
    route,
    userId: user?.id,
    goToBack: () => navigation?.canGoBack() ? navigation.goBack() : goHome(navigation, { screen: 'Home' }),
    onNavigationRedirect: (page: string, params?: any) => {
      openScreen(navigation, page, params)
    }
  };

  return (
    <>
      <NavBar title={t('MY_CARDS', 'My cards')} onActionLeft={() => savedCardsProps.goToBack()} />
      <SafeAreaViewWrapper>
        <SavedCardsController {...savedCardsProps} />
      </SafeAreaViewWrapper>
    </>
  )
};

export default SavedCards;
