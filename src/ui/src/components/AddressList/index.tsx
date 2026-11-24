import React, { useState, useMemo, useEffect } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'
import { useTheme } from 'styled-components/native';

import { themeSpace, themeVisible } from '@/theme/helpers'
import { addressTagIcon } from './TagOptions'
import { usePageSections } from '@/theme/sections'
import Icon from '../shared/Icon'
import { SectionTitle } from '../shared/SectionTitle'

import { AddressListParams } from '../../types'
import { TagOptions } from './TagOptions'
import { AddressItem, Container } from './styles'
import { AddressList as AddressListController, useLanguage, useOrder, useEvent, useConfig } from '@components'
import { OButton, OText, OAlert, NotFoundSource } from '@ui'
import { runSetDefaultThenNavigate } from './shouldNavigateAfterSetDefault'
import { plainParams } from '@/navigators/appNavigation'
import { PICKUP_ORDER_TYPE, canPickupWithoutAddress } from '@/utils/unaddressedOrderTypes'

const AddressListUI = (props: AddressListParams) => {
  const {
    route,
    addressList,
    isFromProfile,
    handleSetDefault,
    handleDelete,
    setAddressList,
    isGoBack,
    isFromBusinesses,
    isFromProductsList,
    afterSignup,
    loadAddresses,
    goToBack,
    onNavigationRedirect
  } = props

  const theme: any = useTheme();
  // `visibility.address.icons` hides the tags: the form's chips and the list's icons.
  const showTagIcons = themeVisible(theme, 'address.icons')
  // The page's sections in the theme's order.
  const { render } = usePageSections('addresses')

  // `list_row` for the address rows; a skeleton line is a body_sm line.
  const styles = useMemo(() => {
    const row = theme.native.components.list_row.base
    return StyleSheet.create({
      skeleton: { paddingVertical: themeSpace(theme, 'sm') },
      skeletonLine: { marginBottom: themeSpace(theme, 'xs') },
      skeletonLast: { marginBottom: themeSpace(theme, 'none') },
      address: { fontSize: row.title.fontSize, lineHeight: row.title.lineHeight, flex: 1, color: row.title_color },
      selected: { color: theme.native.tokens.color.primary },
      button: { marginTop: themeSpace(theme, 'xl') }
    })
  }, [theme])
  const row = theme.native.components.list_row.base
  const skeletonHeight = theme.native.tokens.typography.body.fontSize

  const [orderState, { changeType }] = useOrder()
  const [{ configs }] = useConfig()
  const [, t] = useLanguage()
  const [refreshing] = useState(false);
  const [events] = useEvent()
  const [isLogin, setIsLogin] = useState(false)

  const [isProfile, setIsProfile] = useState(isFromProfile || route?.params?.isFromProfile);
  // Only the Home entry (no address yet): not from the profile, the checkout, the listing's
  // address or the menu, where an address is what the user came to pick.
  const showPickupWithoutAddress = !orderState?.options?.address_id &&
    !isProfile && !isFromBusinesses && !isFromProductsList &&
    !route?.params?.isFromCheckout &&
    canPickupWithoutAddress(configs)

  const handlePickupWithoutAddress = async () => {
    if (orderState?.loading) return
    await changeType(PICKUP_ORDER_TYPE)
    onNavigationRedirect('BottomTab', { screen: 'Home', isLogin })
  }
  const [searchValue, setSearchValue] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const onNavigatorRedirect = () => {
    if (route && (isFromBusinesses || isGoBack)) {
      isGoBack ? goToBack?.() : onNavigationRedirect('BottomTab')
      return
    }
    if (route && route?.params?.isFromCheckout) {
      onNavigationRedirect('CheckoutPage', { cartUuid: route?.params?.cartUuid })
      return
    }
    if (route && !route?.params?.isFromCheckout) {
      onNavigationRedirect('BottomTab')
    }
  }

  const uniqueAddressesList = useMemo(() => (
    (addressList.addresses && addressList.addresses
      .filter(
        (address: any, i: number, self: any) => address.address &&
          i === self.findIndex((obj: any) => (
            address.address === obj.address &&
            address.address_notes === obj.address_notes &&
            address.zipcode === obj.zipcode &&
            address.internal_number === obj.internal_number
          ))
      )
      .sort((a: any, b: any) => (b.default === true ? 1 : 0) - (a.default === true ? 1 : 0))
    ) || []
  ), [addressList.addresses]);

  const filteredAddressesList = useMemo(() => {
    let list = uniqueAddressesList;
    if (searchValue) {
      list = list.filter((address: any) =>
        address.address?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    if (selectedTag) {
      list = list.filter((address: any) =>
        (address.tag || 'other') === selectedTag
      );
    }
    return list;
  }, [uniqueAddressesList, searchValue, selectedTag]);

  const checkAddress = (address: any) => {
    if (!orderState?.options?.address) return false
    const props = ['address', 'address_notes', 'zipcode', 'location', 'internal_number']
    const values: any = []
    props.forEach(prop => {
      if (address[prop]) {
        if (prop === 'location') {
          values.push(address[prop].lat === orderState?.options?.address[prop]?.lat &&
            address[prop].lng === orderState?.options?.address[prop]?.lng)
        } else {
          values.push(address[prop] === orderState?.options?.address[prop])
        }
      } else {
        values.push(orderState?.options?.address[prop] === null || orderState?.options?.address[prop] === '')
      }
    })
    return values.every((value: any) => value)
  }

  const handleSetAddress = async (address: any) => {
    if (address.id === orderState?.options?.address_id) return
    await runSetDefaultThenNavigate({
      setDefault: () => handleSetDefault(address),
      navigate: onNavigatorRedirect
    })
  }

  const handleSaveAddress = (address: any) => {
    let found = false
    const addresses = addressList.addresses.map((_address: any) => {
      if (_address?.id === address?.id) {
        Object.assign(_address, address)
        found = true
      } else if (address.default) {
        _address.default = false
      }
      return _address
    })
    if (!found) {
      addresses.push(address)
    }
    setAddressList({
      ...addressList,
      addresses
    })
  }

  // An address saved in AddressForm, opened from here (`useSendResult`).
  const savedAddress = route?.params?.savedAddress
  useEffect(() => {
    if (savedAddress) handleSaveAddress(savedAddress)
  }, [savedAddress])

  const handleOnRefresh = () => {
    if (!addressList.loading) {
      loadAddresses && loadAddresses();
    }
  }

  useEffect(() => {
    events.on('login', setIsLogin)
    return () => {
      events.off('login', setIsLogin)
    }
  }, [])

  const renderAddressList = () => (
    <>
      {!addressList.error &&
        addressList?.addresses?.length > 0 && (
          <View>
            {themeVisible(theme, 'address.tag_filter') && (
              <TagOptions selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
            )}

            <SectionTitle>{t('SAVED_ADDRESSES', 'Saved addresses')}</SectionTitle>
            {filteredAddressesList.length > 0 ? (
              filteredAddressesList.map((address: any) => (
                <AddressItem
                  key={address.id}
                  isSelected={checkAddress(address)}
                  onPress={() => handleSetAddress(address)}
                >
                  {/* The icon of the address's tag, as the web (none when the theme hides the tags). */}
                  {showTagIcons && (
                    <Icon
                      name={addressTagIcon(address?.tag)}
                      size={row.icon_size}
                      color={checkAddress(address) ? 'primary' : row.icon_color}
                    />
                  )}
                  <OText style={[styles.address, checkAddress(address) && styles.selected]}>
                    {address.address}
                  </OText>
                  <OButton
                    iconOnly
                    color='neutral'
                    appearance='ghost'
                    accessibilityLabel={t('EDIT', 'Edit')}
                    icon={<Icon set='mci' name='pencil-outline' color='text_muted' />}
                    onClick={() => onNavigationRedirect(
                      'AddressForm',
                      {
                        address: plainParams(address),
                        isEditing: true,
                        addressesList: plainParams(addressList),
                        notifyAddressList: true,
                        isSelectedAfterAdd: true,
                        isFromProductsList: isFromProductsList,
                        hasAddressDefault: !!orderState.options?.address?.location,
                        isFromCheckout: route?.params?.isFromCheckout
                      }
                    )}
                  />
                  {!checkAddress(address) && (
                    <OAlert
                      title={t('DELETE_ADDRESS', 'Delete Address')}
                      message={t('QUESTION_DELETE_ADDRESS', 'Are you sure to you wants delete the selected address')}
                      onAccept={() => handleDelete(address)}
                      disabled={checkAddress(address)}
                    >
                      {/* The alert is the touchable: the button only paints. */}
                      <View pointerEvents='none'>
                        <OButton
                          iconOnly
                          color='neutral'
                          appearance='ghost'
                          accessibilityLabel={t('DELETE_ADDRESS', 'Delete Address')}
                          icon={<Icon name='trash' color='danger' />}
                        />
                      </View>
                    </OAlert>
                  )}
                </AddressItem>
              ))
            ) : (
              <NotFoundSource
                content={t('NO_ADDRESSES_FOUND', 'No addresses found')}
              />
            )}
          </View>
        )}

      {!addressList.loading && addressList.error && (
        addressList.error.length > 0 && (
          <NotFoundSource
            content={
              addressList.error[0]?.message ||
              addressList.error[0] ||
              t('NETWORK_ERROR', 'Network Error, please reload the app')
            }
          />
        )
      )}

      {!addressList.loading && !addressList.error && (
        <>
          {addressList?.addresses?.length === 0 && (
            <NotFoundSource
              iconName='location-outline'
              content={t('NO_ADDRESSES_SAVED', 'No addresses saved yet')}
            />
          )}

          {themeVisible(theme, 'address.add_button') && (
            <OButton
              text={t('ADD_NEW_ADDRESS', 'Add new Address')}
              class={addressList?.addresses?.length > 0 ? 'secondary' : 'primary'}
              style={styles.button}
              onClick={() => onNavigationRedirect(
                'AddressForm',
                {
                  address: null,
                  notifyAddressList: true,
                  addressesList: plainParams(addressList?.addresses),
                  nopadding: true,
                  isSelectedAfterAdd: true,
                  hasAddressDefault: !!orderState.options?.address?.location,
                  isFromCheckout: route?.params?.isFromCheckout
                })}
            />
          )}

          {addressList?.addresses?.length > 0 && (
            <OButton
              text={t('CONTINUE', 'Continue')}
              style={styles.button}
              onClick={() => onNavigationRedirect(
                'BottomTab', { screen: 'Home', isLogin })}
            />
          )}

          {showPickupWithoutAddress && (
            <OButton
              testID='address-list-pickup-without-address'
              text={t('ORDER_FOR_PICKUP', 'Order for pickup')}
              class='secondary'
              style={styles.button}
              disabled={orderState?.loading}
              onClick={handlePickupWithoutAddress}
            />
          )}
        </>
      )}
    </>
  )

  return (
    <Container
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => handleOnRefresh()}
        />
      }
    >
      {addressList.loading && (
        <>
          {[...Array(8)].map((_, i) => (
            <Placeholder
              key={i}
              Animation={Fade}
              style={styles.skeleton}
            >
              <View>
                <PlaceholderLine width={80} height={skeletonHeight} style={styles.skeletonLine} />
                <PlaceholderLine width={60} height={skeletonHeight} style={styles.skeletonLast} />
              </View>
            </Placeholder>
          ))}
        </>
      )}

      {(!addressList.loading || (isFromProductsList || isFromBusinesses || isFromProfile || isProfile)) && render({ address_list: renderAddressList })}
    </Container >
  )
}

export { AddressListUI }

export const AddressList = (props: AddressListParams) => {
  const addressListProps = {
    ...props,
    UIComponent: AddressListUI
  }
  return <AddressListController {...addressListProps} />
}
