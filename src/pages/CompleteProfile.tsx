import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { ToastType, useLanguage, useSession, useToast } from '@components';
import { Icon, OButton, OText, UserDetails } from '@ui';
import { nativeTextStyle, themeColor, themeControlHeight, themeGutter, themeSpace } from '@/theme/helpers';
import { useProfileCompletion } from '../contexts/CheckoutFieldsContext';

const CompleteProfile = () => {
  const theme: any = useTheme();
  const [, t] = useLanguage();
  const [{ user }, { logout, refreshUserInfo }] = useSession();
  const [, { showToast }] = useToast();
  const { missingFields, checkoutFields, canSkip, skip } = useProfileCompletion();

  // The cached session user can be stale (e.g. the field was saved from another session),
  // so pull the server truth once on mount; if it already satisfies the gate, it clears.
  const didRefresh = useRef(false);
  useEffect(() => {
    if (didRefresh.current) return;
    didRefresh.current = true;
    refreshUserInfo?.();
  }, [refreshUserInfo]);

  // Logout is the only way out of this screen, so a silent failure would strand the user.
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      showToast(ToastType.Error, err?.message || t('ERROR_UNKNOWN', 'An error occurred'));
    }
  };

  // UserFormDetails leaves edit mode after any successful save and offers no way back in,
  // so remount it whenever the user changes to keep the form editable until the gate clears.
  const [remountCount, setRemountCount] = useState(0);
  useEffect(() => {
    setRemountCount(count => count + 1);
  }, [user]);
  const userDetailsKey = `${remountCount}-${missingFields.join('|')}`;

  const [phoneUpdate, setPhoneUpdate] = useState(false);

  const styles = useMemo(() => {
    const link = theme.native.components.link;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: themeColor(theme, 'background'),
      },
      scrollContent: {
        paddingVertical: themeSpace(theme, 'lg'),
        paddingHorizontal: themeGutter(theme),
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      },
      titleText: {
        flex: 1,
      },
      descriptionText: {
        paddingVertical: themeSpace(theme, 'lg'),
      },
      skipButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: themeControlHeight(theme, 'md'),
        marginVertical: themeSpace(theme, 'sm'),
      },
      skipPressed: { opacity: link.variants.default.states.pressed.opacity },
      skipText: { ...nativeTextStyle(link.sizes.md.text), color: link.base.color },
    });
  }, [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <OText preset="h2" style={styles.titleText}>
            {t('COMPLETE_YOUR_PROFILE', 'Complete your profile')}
          </OText>
          <OButton
            iconOnly
            appearance="ghost"
            color="neutral"
            accessibilityLabel={t('LOGOUT', 'Logout')}
            onClick={handleLogout}
            icon={<Icon name="log-out-outline" />}
          />
        </View>

        <OText color="text_muted" style={styles.descriptionText}>
          {t(
            'COMPLETE_YOUR_PROFILE_MESSAGE',
            'In order to continue using our platform please complete your profile information',
          )}
        </OText>

        <UserDetails
          key={userDetailsKey}
          isEdit
          isUserDetailsEdit
          useSessionUser
          useDefualtSessionManager
          isOrderTypeValidationField
          isCheckoutPlace
          hideUpdateButton
          requiredFields={missingFields}
          checkoutFields={checkoutFields}
          phoneUpdate={phoneUpdate}
          togglePhoneUpdate={setPhoneUpdate}
          onClose={() => {}}
        />

        {canSkip && (
          <Pressable onPress={skip} style={({ pressed }) => [styles.skipButton, pressed && styles.skipPressed]}>
            <OText style={styles.skipText}>
              {t('SKIP_FOR_NOW', 'Skip for now')}
            </OText>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfile;
