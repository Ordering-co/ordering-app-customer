import * as React from 'react';
import { SafeAreaViewWrapper, UpsellingProducts as Upselling } from '@ui';
import { goHome, openScreen } from '@/navigators/appNavigation'

interface Props {
  navigation: any;
  route: any;
}

const UpsellingPage = (props: Props) => {

  const upsellingProps = {
    ...props,
    ...props.route.params,
    isPage: true,
    onGoBack: props?.navigation?.canGoBack()
      ? () => props?.navigation?.goBack()
      : () => goHome(props.navigation),
    onNavigationRedirect: (route: string, params: any) =>
      openScreen(props.navigation, route, params),
  };

  return (
    <SafeAreaViewWrapper pt headerInset='band' disableScrollView>
      <Upselling {...upsellingProps} />
    </SafeAreaViewWrapper>
  );
};

export default UpsellingPage;
