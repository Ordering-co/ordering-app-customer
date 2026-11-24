import React, { useEffect, useState } from 'react';
import { AddressForm as AddressFormController, NavBar, SafeAreaViewWrapper, _retrieveStoreData } from '@ui';
import { useLanguage } from '@components';
import { leaveToCheckoutOrBack, openFromCheckout } from '@/utils/checkoutReturn';
import { openScreen, useSendResult } from '@/navigators/appNavigation'

const AddressForm = ({ navigation, route }: any) => {
  const [, t] = useLanguage();
  const [isGuestFromStore, setIsGuestFromStore] = useState(false);
  const tellOpener = useSendResult(navigation);

  const AddressFormProps = {
    navigation,
    route,
    address: route?.params?.address,
    addressId: route?.params?.address?.id,
    isEditing: route?.params?.isEditing,
    addressesList: route?.params?.addressesList,
    // Opened from the address list: the saved address goes back to it, and so does the user.
    onSaveAddress: route?.params?.notifyAddressList
      ? (address: any) => {
        tellOpener({ savedAddress: address })
        navigation?.canGoBack() && navigation.goBack()
      }
      : undefined,
    isSelectedAfterAdd: true,
    isGuestUser: route?.params?.isGuestUser,
    isFromBusinesses: route?.params?.isFromBusinesses,
    isFromProductsList: route?.params?.isFromProductsList,
    isFromCheckout: route?.params?.isFromCheckout,
    isGoBack: route?.params?.isGoBack,
    hasAddressDefault: route?.params?.hasAddressDefault,
    afterSignup: route?.params?.afterSignup,
    businessSlug: route?.params?.businessSlug,
    goToBack: () => leaveToCheckoutOrBack(navigation, route),
    onNavigationRedirect: (page: string, params?: any) => {
      if (route?.params?.fromCheckout) {
        openFromCheckout(navigation, route, page, params)
        return
      }
      openScreen(navigation, page, params)
    }
  };

  const getDataFromStorage = async () => {
    const value = await _retrieveStoreData('isGuestUser');
    setIsGuestFromStore(value);
  };

  useEffect(() => {
    getDataFromStorage();
  }, []);

  return (
    <>
      <NavBar
        title={t('ADD_ADDRESS', 'Add address')}
        onActionLeft={() => AddressFormProps.goToBack()}
      />
      <SafeAreaViewWrapper disableScrollView>
        <AddressFormController
          {...AddressFormProps}
          isGuestFromStore={isGuestFromStore}
          useValidationFileds
        />
      </SafeAreaViewWrapper>
    </>
  );
};

export default AddressForm;
