import React, { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from '../shared/SectionTitle'
import { StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useForm } from 'react-hook-form';
import { LoadingOverlay } from '../LoadingOverlay';

import { nativeTextStyle, themeVisible } from '@/theme/helpers';
import { usePageSections } from '@/theme/sections'
import { PressableScale } from '../shared/PressableScale';
import Icon from '../shared/Icon';

import { ProfileParams } from '../../types';

import {
  AppInfo,
  Container,
  ListItemContent,
  QuickActionsContainer,
  Section,
  WrapperIcon,
  WrapperOptions
} from './styles';

import {
  UserFormDetails as UserProfileController,
  useSession,
  useLanguage,
  ToastType,
  useToast,
  useConfig,
  useUtils,
  useApi,
  useEvent
} from '@components';
import { useSavedCardsGateway } from '../SavedCards/useSavedCardsGateway';
import { emitLogoutSuccess } from '../LogoutButton';

import {
  OAlertOriginal as OAlert,
  OText,
  LogoutButton,
  WebsocketStatus
} from '@ui'

const ListItem = ({
  iconName,
  text,
  value,
  onPress,
  children,
  styles,
  rowIcon
}: any) => (
  <PressableScale onPress={onPress} style={styles.row}>
    <ListItemContent>
      <Icon name={iconName} size={rowIcon.icon_size} color={rowIcon.icon_color} />
      <OText style={styles.rowTitle}>{text}</OText>
    </ListItemContent>
    {value && <OText style={styles.rowValue}>{value}</OText>}
    {children}
  </PressableScale>
);

const QuickActionButton = ({ iconName, text, onPress, styles }: any) => (
  <PressableScale onPress={onPress} style={styles.quickAction}>
    <WrapperIcon>
      <Icon name={iconName} size='lg' />
    </WrapperIcon>
    <OText weight={500} mTop='xs'>{text}</OText>
  </PressableScale>
);

const ProfileListUI = (props: ProfileParams) => {
  const {
    notificationsGroup,
    removeAccountState,
    onNavigationRedirect,
    appVersion,
    wallets,
    isWalletPointsEnabled
  } = props;

  const theme: any = useTheme();
  // The page's sections in the theme's order.
  const { render } = usePageSections('profile')
  const [ordering] = useApi();
  const [, { logout }] = useSession();
  const [events] = useEvent();
  const [, t] = useLanguage();
  const [{ configs }] = useConfig();
  const { isAvailable: savedCardsAvailable } = useSavedCardsGateway();
  const [, { showToast }] = useToast();
  const { formState: { errors } } = useForm();
  const [{ parsePrice, isWalletEnabled: isWalletConfigEnabled }] = useUtils();

  // Number of enabled languages — drives whether the Languages row is shown.
  const [languagesCount, setLanguagesCount] = useState(0);

  const isProjectEnterpricePlan = configs?.plan_enterprise && configs?.plan_enterprise?.value
  const hideSession = !themeVisible(theme, 'menu.sessions') || !isProjectEnterpricePlan
  const showNotifications = themeVisible(theme, 'menu.notifications')

  const [confirm, setConfirm] = useState<any>({ open: false, content: null, handleOnAccept: null, id: null, title: null })
  const isWalletEnabled = configs?.cash_wallet?.value && isWalletConfigEnabled(configs)
  const isGiftCardDisabled = configs?.platform_store_giftcard_enabled?.value === '0' || configs?.platform_store_giftcard_enabled?.value === false
  const showCashWallet = isWalletEnabled && themeVisible(theme, 'menu.wallet')
  const showLoyaltyPoints = isWalletPointsEnabled && themeVisible(theme, 'menu.loyalty_points')
  const showGiftCards = !isGiftCardDisabled && themeVisible(theme, 'menu.gift_cards')
  const showRewards = showCashWallet || showLoyaltyPoints || showGiftCards
  const showAddresses = themeVisible(theme, 'menu.addresses')

  // `list_row` for the menu rows; `account_page` for the page's bottom room.
  const styles = useMemo(() => {
    const row = theme.native.components.list_row.base
    return StyleSheet.create({
      scrollContentContainer: {
        paddingBottom: theme.native.components.account_page.base.padding_bottom + theme.native.components.bottom_nav.base.height
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: row.gap,
        paddingVertical: row.padding_y,
        backgroundColor: row.background,
        borderBottomWidth: row.divider.borderWidth,
        borderBottomColor: row.divider.borderColor,
      },
      rowTitle: { ...nativeTextStyle(row.title), color: row.title_color, flexShrink: 1 },
      rowValue: { ...nativeTextStyle(row.subtitle), color: row.subtitle_color },
      quickAction: { flex: 1, alignItems: 'center' },
    })
  }, [theme])
  const rowIcon = theme.native.components.list_row.base

  useEffect(() => {
    let mounted = true;
    const fetchLanguagesCount = async () => {
      try {
        const { content: { error, result } } = await ordering.languages().where([{ attribute: 'enabled', value: true }]).get();
        if (mounted && !error && Array.isArray(result)) setLanguagesCount(result.length);
      } catch {
        // keep languagesCount at 0 → Languages row stays hidden on failure
      }
    };
    fetchLanguagesCount();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notificationsGroup.result.result && !notificationsGroup.loading) {
      if (!notificationsGroup.result?.error) {
        showToast(ToastType.Success, t('UPDATE_SUCCESSFULLY', 'Update successfully'));
      }
    }
  }, [notificationsGroup.result])

  useEffect(() => {
    const errorMessages = Object.values(errors).map((item: any) => `- ${item.message}`).join('\n');

    if (errorMessages) {
      showToast(ToastType.Error, errorMessages);
    }
  }, [errors]);

  useEffect(() => {
    if (removeAccountState?.result === 'OK') {
      logout().then(() => emitLogoutSuccess(events))
    }
  }, [removeAccountState])

  const renderQuickActions = () => (
    <QuickActionsContainer>
      {themeVisible(theme, 'menu.favorites') && (
        <QuickActionButton styles={styles} iconName="heart-outline" text={t('MY_FAVORITES', 'My Favorites')} onPress={() => onNavigationRedirect('Favorite')} />
      )}
      {savedCardsAvailable
        ? themeVisible(theme, 'menu.cards') && <QuickActionButton styles={styles} iconName="card-outline" text={t('MY_CARDS', 'My cards')} onPress={() => onNavigationRedirect('SavedCards')} />
        : showAddresses && <QuickActionButton styles={styles} iconName="location-outline" text={t('ADDRESSES', 'Addresses')} onPress={() => onNavigationRedirect('AddressList', { isGoBack: true })} />}
      <QuickActionButton styles={styles} iconName="person-outline" text={t('MY_ACCOUNT', 'My Account')} onPress={() => onNavigationRedirect('ProfileForm')} />
    </QuickActionsContainer>
  )
  const renderRewards = () => showRewards && (
    <Section>
      <SectionTitle>{t('REWARDS', 'Rewards')}</SectionTitle>
      {showCashWallet && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="cash-outline" text={t('CASH_WALLET', 'Cash Wallet')} value={`${parsePrice(wallets.result?.result?.cash?.balance ?? 0)}`} onPress={() => onNavigationRedirect('CashWallet')} />
      )}
      {showLoyaltyPoints && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="book-outline" text={t('LOYALTY_POINTS', 'Loyalty Points')} value={`${wallets.result?.result?.points?.balance ?? 0} ${t('POINTS', 'points')}`} onPress={() => onNavigationRedirect('LoyaltyPoints')} />
      )}
      {showGiftCards && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="gift-outline" text={t('GIFT_CARDS', 'Gift Cards')} onPress={() => onNavigationRedirect('GiftCards')} />
      )}
    </Section>
  )
  const renderAccount = () => (
    <Section>
      <SectionTitle>{t('MY_ACCOUNT', 'My account')}</SectionTitle>
      {savedCardsAvailable && showAddresses && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="location-outline" text={t('ADDRESSES', 'Addresses')} onPress={() => onNavigationRedirect('AddressList', { isGoBack: true })} />
      )}
      {configs?.school_module_enabled?.value === '1' && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="reader-outline" text={t('SCHOOL_MY_STUDENTS', 'My students')} onPress={() => onNavigationRedirect('MyStudents')} />
      )}
      {themeVisible(theme, 'menu.messages') && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="chatbubble-ellipses-outline" text={t('MESSAGES', 'Messages')} onPress={() => onNavigationRedirect('Messages')} />
      )}
      {themeVisible(theme, 'menu.language') && languagesCount > 1 && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="language-outline" text={t('LANGUAGES', 'Languages')} onPress={() => onNavigationRedirect('Languages')} />
      )}
      {showNotifications && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="notifications-outline" text={t('NOTIFICATIONS', 'Notifications')} onPress={() => onNavigationRedirect('Notifications')} />
      )}
    </Section>
  )
  const renderInformation = () => (
    <Section last>
      <SectionTitle>{t('INFORMATION', 'Information')}</SectionTitle>
      {themeVisible(theme, 'menu.help') && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="information-circle-outline" text={t('HELP', 'Help')} onPress={() => onNavigationRedirect('Help')} />
      )}
      {!hideSession && (
        <ListItem styles={styles} rowIcon={rowIcon} iconName="shield-checkmark-outline" text={t('SECURITY', 'Security')} onPress={() => onNavigationRedirect('Sessions')} />
      )}
      <LogoutButton
        UIButton={ListItem}
        uiProps={{
          styles,
          rowIcon,
          iconName: 'log-out-outline',
          text: t('LOGOUT', 'Logout')
        }}
      />
    </Section>
  )
  const renderAppInfo = () => (
    <>
      <WebsocketStatus />
      {appVersion && (
        <AppInfo>
          <OText>{`v${appVersion}`}</OText>
        </AppInfo>
      )}
    </>
  )

  return (
    <Container>
      <LoadingOverlay visible={notificationsGroup?.loading} />

      <WrapperOptions
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {render({ quick_actions: renderQuickActions, rewards: renderRewards, account: renderAccount, information: renderInformation, app_info: renderAppInfo })}
      </WrapperOptions>
      <OAlert
        open={confirm.open}
        title={confirm.title}
        content={confirm.content}
        onAccept={confirm.handleOnAccept}
        onCancel={() => setConfirm({ ...confirm, open: false, title: null })}
        onClose={() => setConfirm({ ...confirm, open: false, title: null })}
      />
    </Container>
  );
};

export const UserProfile = (props: any) => {
  const [{ configs }] = useConfig()
  const profileProps = {
    ...props,
    UIComponent: ProfileListUI,
    isWalletCashEnabled: configs?.wallet_cash_enabled?.value === '1',
    isWalletPointsEnabled: configs?.wallet_credit_point_enabled?.value === '1'
  };
  return <UserProfileController {...profileProps} />;
};
