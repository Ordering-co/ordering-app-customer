import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@ui';
import { bottomBarBox, nativeBoxStyle, nativeTextStyle, themeColor, themeImage, themeVisible } from '../theme/helpers';
import FastImage from 'react-native-fast-image';

import BusinessListingSearch from '../pages/BusinessListingSearch';
import MyOrders from '../pages/MyOrders';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Forgot from '../pages/ForgotPassword';
import Promotions from '../pages/Promotions';

import { useLanguage, useSession, useEvent } from '@components';
import { ACCOUNT_VALUES } from '@ui';
import { useLeaveAppOnLogout } from './appNavigation';
import { HomeEntry } from './HomeEntry';
import { isSingleBusiness } from '../utils/singleBusiness';

const Tab = createBottomTabNavigator();

/** A tab's icon, declared once: built inside the navigator it was a new component type on every render, and the icons remounted. */
const TabBarIcon = ({ name, focused, nav, style, image }: any) => (
  <View style={style}>
    {image ? (
      <FastImage style={{ width: nav.icon_size, height: nav.icon_size }} source={image} objectFit='contain' />
    ) : (
      <Icon
        name={name}
        size={nav.icon_size}
        color={focused ? nav.active : nav.inactive}
      />
    )}
  </View>
)

/** The `tabBarIcon` option of a tab: React Navigation calls it with the tab's state. */
const tabBarIcon = (name: string, nav: any, style: any, image?: any) =>
  ({ focused }: { focused: boolean }) => <TabBarIcon nav={nav} style={style} name={name} focused={focused} image={image} />

/**
 * The tab label with the app's text cap (maxFontSizeMultiplier 1.3, as OText):
 * the bar has a fixed height, so the system's largest text cannot overflow it.
 */
const tabLabel = (text: string, style: any) => ({
  tabBarAccessibilityLabel: text,
  tabBarLabel: ({ color }: { color: string }) => (
    <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[style, { color }]}>{text}</Text>
  ),
})

/**
 * Home and Profile: the signed-in screen (`signedIn`), or the account flow.
 * A route `target` (LOGIN / SIGNUP) opens that form and is cleared once the
 * account state matches it.
 */
const AccountScreen = ({ route, navigation, signedIn, accountState, setAccountState, auth, user, propsToPass }: any) => {
  const currentRouteTarget = route.params?.target;

  useEffect(() => {
    if (currentRouteTarget) {
      let newAccountStateValue = null;
      if (currentRouteTarget === 'LOGIN') {
        newAccountStateValue = ACCOUNT_VALUES.LOGIN;
      } else if (currentRouteTarget === 'SIGNUP') {
        newAccountStateValue = ACCOUNT_VALUES.SIGNUP;
      }

      if (newAccountStateValue && newAccountStateValue !== accountState) {
        setAccountState(newAccountStateValue);
      }
    }
  }, [currentRouteTarget, accountState, setAccountState]);

  useEffect(() => {
    if (currentRouteTarget) {
      const targetMatchesAccountState =
        (currentRouteTarget === 'LOGIN' && accountState === ACCOUNT_VALUES.LOGIN) ||
        (currentRouteTarget === 'SIGNUP' && accountState === ACCOUNT_VALUES.SIGNUP);

      if (targetMatchesAccountState) {
        navigation.setParams({ target: undefined });
      }
    }
  }, [currentRouteTarget, accountState, navigation]);

  if ((accountState === ACCOUNT_VALUES.ACCOUNT) || auth) {
    return signedIn;
  }
  if (currentRouteTarget === 'LOGIN') {
    return <Login {...propsToPass} onNavigateToSignup={() => setAccountState(ACCOUNT_VALUES.SIGNUP)} />;
  }
  if (currentRouteTarget === 'SIGNUP') {
    return <Signup {...propsToPass} onNavigateToLogin={() => setAccountState(ACCOUNT_VALUES.LOGIN)} />;
  }
  if ((accountState === ACCOUNT_VALUES.LOGIN) || (accountState === ACCOUNT_VALUES.ACCOUNT && user?.guest_id)) {
    return <Login {...propsToPass} onNavigateToSignup={() => setAccountState(ACCOUNT_VALUES.SIGNUP)} />;
  }
  if (accountState === ACCOUNT_VALUES.SIGNUP) {
    return <Signup {...propsToPass} onNavigateToLogin={() => setAccountState(ACCOUNT_VALUES.LOGIN)} />;
  }
  return <Forgot {...propsToPass} />;
}

const BottomNavigator = (props: any) => {
  const theme: any = useTheme();
  const [, t] = useLanguage();
  const [events] = useEvent()
  const [{ auth, user }] = useSession()

  const insets = useSafeAreaInsets()
  const [accountState, setAccountState] = useState('')
  const [shouldClearSearchTerm, setShouldClearSearchTerm] = useState(false)

  // `components.bottom_nav`: the bar is its height above the safe-area inset.
  const nav = theme.native.components.bottom_nav.base
  const { fontScale } = useWindowDimensions()
  const labelGrowth = Math.ceil(nav.label_text.lineHeight * (Math.min(fontScale, 1.3) - 1))
  const styles = React.useMemo(() => StyleSheet.create({
    iconStyle: {
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    barStyle: {
      // Grows with the label when the system text is larger (up to the 1.3 cap); the space
      // under the labels is the inset or at least `min_bottom_space` (`bottomBarBox`).
      ...bottomBarBox({ height: nav.height, padding: nav.padding_y, inset: insets.bottom, min: nav.min_bottom_space, growth: labelGrowth }),
      paddingTop: nav.padding_y,
      ...nativeBoxStyle({ background: nav.background, shadow: nav.shadow }),
      borderTopWidth: nav.border_top.borderWidth,
      ...nav.border_top.borderColor && { borderTopColor: nav.border_top.borderColor },
    },
    hidden: { display: 'none' },
    label: nativeTextStyle(nav.label_text),
    page: { flex: 1, backgroundColor: themeColor(theme, 'background') },
  }), [theme, nav, insets.bottom, labelGrowth])

  useLeaveAppOnLogout(events, props.navigation, () => setAccountState(''))

  const propsToPass = {
    ...props,
    setAccountState,
    isLogin: props?.route?.params?.isLogin,
    notification_state: props?.route?.params?.notification_state
  }

  // Offers, Browse and Orders can be hidden by the theme (`bottom_nav.*`): the tab
  // leaves the bar, its screen stays registered for deep links and redirects.
  const tabShown = (key: string) => themeVisible(theme, `bottom_nav.${key}`)
  const hiddenTab = { tabBarButton: () => null, tabBarItemStyle: styles.hidden }
  const accountProps = { accountState, setAccountState, auth, user, propsToPass }

  return (
    <View style={styles.page}>
      <Tab.Navigator
        initialRouteName={"Home"}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: nav.active,
          tabBarInactiveTintColor: nav.inactive,
          tabBarLabelStyle: styles.label,
          tabBarStyle: [styles.barStyle, !auth && styles.hidden]
        }}
      >
        <Tab.Screen
          name="Home"
          children={(screenProps: any) => (
            <AccountScreen
              {...accountProps}
              route={screenProps.route}
              navigation={screenProps.navigation}
              signedIn={<HomeEntry propsToPass={propsToPass} />}
            />
          )}
          options={{
            ...tabLabel(t('HOME', 'Home'), styles.label),
            tabBarIcon: tabBarIcon('home-outline', nav, styles.iconStyle, themeImage(theme, 'icons.tab_home'))
          }}
        />
        <Tab.Screen
          name="Offers"
          children={() => (
            (accountState === ACCOUNT_VALUES.ACCOUNT || auth)
              ? <Promotions {...propsToPass} />
              : (accountState === ACCOUNT_VALUES.LOGIN) || (accountState === ACCOUNT_VALUES.ACCOUNT && user?.guest_id)
                ? <Login {...propsToPass} />
                : accountState === ACCOUNT_VALUES.SIGNUP
                  ? <Signup {...propsToPass} />
                  : <Forgot {...propsToPass} />
          )}
          options={{
            ...tabLabel(t('OFFERS', 'Offers'), styles.label),
            tabBarIcon: tabBarIcon('pricetags-outline', nav, styles.iconStyle, themeImage(theme, 'icons.tab_offers')),
            ...(!tabShown('offers') && hiddenTab)
          }}
        />
        <Tab.Screen
          name="BusinessSearch"
          children={() => (
            (accountState === ACCOUNT_VALUES.ACCOUNT || auth)
              ? <BusinessListingSearch {...propsToPass} shouldClearSearchTerm={shouldClearSearchTerm} setShouldClearSearchTerm={setShouldClearSearchTerm} />
              : (accountState === ACCOUNT_VALUES.LOGIN) || (accountState === ACCOUNT_VALUES.ACCOUNT && user?.guest_id)
                ? <Login {...propsToPass} />
                : accountState === ACCOUNT_VALUES.SIGNUP
                  ? <Signup {...propsToPass} />
                  : <Forgot {...propsToPass} />
          )}
          listeners={{
            blur: () => {
              setShouldClearSearchTerm(true);
            }
          }}
          options={{
            ...tabLabel(t('BROWSE', 'Browse'), styles.label),
            tabBarIcon: tabBarIcon('search-outline', nav, styles.iconStyle, themeImage(theme, 'icons.tab_browse')),
            ...((isSingleBusiness() || !tabShown('browse')) && hiddenTab)
          }}
        />
        <Tab.Screen
          name="MyOrders"
          children={() => (
            (accountState === ACCOUNT_VALUES.ACCOUNT || auth)
              ? <MyOrders {...propsToPass} />
              : (accountState === ACCOUNT_VALUES.LOGIN) || (accountState === ACCOUNT_VALUES.ACCOUNT && user?.guest_id)
                ? <Login {...propsToPass} />
                : accountState === ACCOUNT_VALUES.SIGNUP
                  ? <Signup {...propsToPass} />
                  : <Forgot {...propsToPass} />
          )}
          options={{
            ...tabLabel(t('ORDERS', 'Orders'), styles.label),
            tabBarIcon: tabBarIcon('bag-outline', nav, styles.iconStyle, themeImage(theme, 'icons.tab_orders')),
            ...(!tabShown('orders') && hiddenTab)
          }}
        />
        <Tab.Screen
          name="Profile"
          children={(screenProps: any) => (
            <AccountScreen
              {...accountProps}
              route={screenProps.route}
              navigation={screenProps.navigation}
              signedIn={<Profile {...propsToPass} />}
            />
          )}
          options={{
            ...tabLabel(t('PROFILE', 'Profile'), styles.label),
            tabBarIcon: tabBarIcon('person-outline', nav, styles.iconStyle, themeImage(theme, 'icons.tab_profile'))
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

export default BottomNavigator;
