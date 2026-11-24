import React from 'react'
import { Pressable, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';
import { nativeTextStyle, themePart, themeSpace, themeVisible } from '@/theme/helpers';

import { useSession, useOrder, useLanguage, useConfig, useUtils } from '@components'
import { OButton, OText } from '../shared';
import { closedStatusLabel } from '@/utils/businessTime'
import { preorderParams } from '@/navigators/appNavigation'

export const ActionButton = (props: any) => {
  const {
    navigation,
    isHaveWeight,
    isSoldOut,
    maxProductQuantity,
    productCart,
    handleSaveProduct,
    editMode,
    product,
    errors,
    productAddedToCartLength,
    handleRedirectLogin,
    guestCheckoutEnabled,
    orderTypeEnabled,
    handleUpdateGuest,
    actionStatus,
    needsStudent,
    onSelectStudent,
    business,
    closedWithoutMoment
  } = props

  const [, t] = useLanguage()
  const [{ auth }] = useSession()
  const [orderState] = useOrder()
  const [{ parsePrice, is12Hours }] = useUtils()
  const theme: any = useTheme()
  // The product modal's buttons: `add` (and the student / address steps) and `login`.
  const { add, login } = theme.native.components.product_modal.slots
  const link = themePart(theme, 'link', 'variants.default')
  const showTotal = themeVisible(theme, 'product.add_price')
  const [{ configs }] = useConfig()
  const unaddressedTypes = configs?.unaddressed_order_types_allowed?.value.split('|').map((value: any) => Number(value)) || []
  const isAllowUnaddressOrderType = unaddressedTypes.includes(orderState?.options?.type)
  const isPreOrder = configs?.preorder_status_enabled?.value === '1'
  const closedStatus = closedWithoutMoment ? closedStatusLabel(business, t, { is12Hours }) : null
  // Missing options do not disable the button: tapping it brings the first one into view (`ProductForm`).
  const saveErrors =
    orderState.loading ||
    maxProductQuantity === 0 ||
    closedWithoutMoment;
  const buttonColor = saveErrors || isSoldOut || maxProductQuantity <= 0 || (product?.minimum_per_order && ((productCart?.quantity + productAddedToCartLength) < product?.minimum_per_order)) || (product?.maximum_per_order && ((productCart?.quantity + productAddedToCartLength) > product?.maximum_per_order))

  return (
    <View
      style={isHaveWeight ? { width: '100%' } : { flex: 1 }}
    >
      {closedWithoutMoment && (
        <View style={{ marginBottom: themeSpace(theme, 'sm') }}>
          <OText preset='body_sm' color='danger_text' style={{ marginBottom: themeSpace(theme, 'xs') }}>
            {closedStatus}
          </OText>
          {isPreOrder && (
            <OButton
              color={add.color}
              appearance={add.appearance}
              size={add.size}
              text={t('PREORDER', 'Preorder')}
              onClick={() => navigation.navigate('MomentOption', preorderParams(business, 'back'))}
            />
          )}
        </View>
      )}
      {auth && needsStudent && (
        <OButton
          color={add.color}
          appearance={add.appearance}
          size={add.size}
          onClick={() => onSelectStudent && onSelectStudent()}
          text={t('SCHOOL_SELECT_STUDENT', 'Select a student')}
        />
      )}

      {(productCart &&
        auth &&
        !needsStudent &&
        ((orderState.options?.address_id || isAllowUnaddressOrderType) || (isSoldOut || maxProductQuantity <= 0))) && (
          <OButton
            testID='product-add'
            color={add.color}
            appearance={add.appearance}
            size={add.size}
            onClick={() => handleSaveProduct()}
            fitText
            text={`${orderState.loading
              ? t('LOADING', 'Loading')
              : (isSoldOut || maxProductQuantity <= 0)
                ? t('SOLD_OUT', 'Sold out')
                : `${editMode ? t('UPDATE', 'Update') : showTotal ? t('ADD', 'Add') : t('ADD_TO_CART', 'Add to cart')}${productCart?.total && showTotal ? ` \u00B7 ${parsePrice(productCart.total)}` : ''}`
              }`}
            disabled={!!buttonColor}
          />
        )}

      {auth && !needsStudent &&
        !orderState.options?.address_id && !isAllowUnaddressOrderType &&
        (orderState.loading ? (
          <OButton
            color={add.color}
            appearance={add.appearance}
            size={add.size}
            disabled
            loading
            text={t('LOADING', 'Loading')}
          />
        ) : (
          <OButton
            testID="product-address-redirect"
            color={add.color}
            appearance={add.appearance}
            size={add.size}
            text={t('SELECT_ADDRESS', 'Select address')}
            onClick={() => navigation.navigate('AddressList', { isGoBack: true })}
          />
        ))}

      {!auth && (
        <OButton
          color={login.color}
          appearance={login.appearance}
          size={login.size}
          disabled={isSoldOut || maxProductQuantity <= 0}
          onClick={() => handleRedirectLogin()}
          text={
            isSoldOut || maxProductQuantity <= 0
              ? t('SOLD_OUT', 'Sold out')
              : t('LOGIN_SIGNUP', 'Login / Sign Up')
          }
        />
      )}

      {!auth && guestCheckoutEnabled && orderTypeEnabled && (
        <Pressable
          accessibilityRole='link'
          hitSlop={themeSpace(theme, 'sm')}
          style={({ pressed }) => [{ marginTop: themeSpace(theme, 'sm'), alignItems: 'center' }, pressed && { opacity: link.states.pressed.opacity }]}
          onPress={handleUpdateGuest}
          disabled={!!buttonColor}
        >
          {actionStatus?.loading ? (
            <Placeholder Animation={Fade}>
              <PlaceholderLine height={20} />
            </Placeholder>
          ) : (
            <OText
              color={buttonColor ? link.states.disabled.color : themePart(theme, 'link', 'base.color')}
              style={nativeTextStyle(themePart(theme, 'link', 'sizes.md.text'))}
              align='center'
            >
              {t('AS_GUEST_USER', 'As guest user')}
            </OText>
          )}
        </Pressable>
      )}
    </View>
  )
}
