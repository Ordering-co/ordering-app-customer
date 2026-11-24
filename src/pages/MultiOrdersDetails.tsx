import React from 'react'
import { View } from 'react-native'
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themeColor } from '@/theme/helpers';
import { MultiOrdersDetails as MultiOrdersDetailsController, NavBar } from '@ui'
import { useLanguage } from '@components'
import { useSuppressProfileGate } from '../contexts/CheckoutFieldsContext';
import { goHome } from '@/navigators/appNavigation'

const SafeAreaContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${(props: any) => themeColor(props.theme, 'background')};
`;

const MultiOrdersDetails = ({ navigation, route }: any) => {
  useSuppressProfileGate();
  const [, t] = useLanguage()
  const multiOrdersDetailsProps = {
    navigation,
    orderId: route?.params?.orderId,
    isFromMultiCheckout: route.params?.isFromMultiCheckout,
    onRedirectPage: () => goHome(navigation, { screen: 'Home' })
  }

  return (
    <View style={{ flex: 1 }}>
    <NavBar
      title={t('MULTI_ORDERS_DETAILS', 'Multi Orders Details')}
      onActionLeft={() => navigation?.canGoBack() ? navigation?.goBack() : goHome(navigation)}
    />
      <SafeAreaContainer disableScrollView>
        <MultiOrdersDetailsController {...multiOrdersDetailsProps} />
      </SafeAreaContainer>
    </View>
  )
}

export default MultiOrdersDetails
