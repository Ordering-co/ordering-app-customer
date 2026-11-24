import React, { useMemo } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { ToastType, useConfig, useToast, useSession } from '@components'
import { FacebookLogin, GoogleLogin, AppleLogin } from '@ui'

import { UIButton } from './UIButton'
import { themePart, themeSpace } from '@/theme/helpers'
import { isFacebookAvailable, isGoogleSignInAvailable } from '@/utils/nativeKeys'

export const SocialButtons = (props: any) => {
  const {
    notificationState,
    setIsFBLoading,
    onHandleSuccess
  } = props

  const [{ configs }] = useConfig()
  const [, { showToast }] = useToast()
  const [, { login }] = useSession()
  const theme: any = useTheme()
  const styles = useMemo(() => {
    const auth = theme.native.components.auth_form.base
    const social = themePart(theme, 'button', `sizes.${themePart(theme, 'auth_form', 'slots.social.size')}`)
    return {
      skeletonButtonHeight: social.height,
      skeletonLineHeight: themeSpace(theme, 'lg'),
      sheet: StyleSheet.create({
        block: { marginTop: auth.social_margin, gap: auth.social_gap },
        skeleton: { width: '90%' },
        skeletonLine: { marginTop: themeSpace(theme, 'sm'), marginBottom: themeSpace(theme, 'md') },
        skeletonButton: { borderRadius: themePart(theme, 'button', 'base.radius'), marginBottom: auth.social_gap },
      }),
    }
  }, [theme])

  // Each button also needs its native keys (src/utils/nativeKeys.ts): Facebook's SDK started
  // (an app id and a client token), Google's URL scheme on iOS.
  const googleLoginEnabled = isGoogleSignInAvailable() &&
    configs?.google_login_enabled?.value === '1' &&
    !!configs?.google_login_client_id?.value &&
    (Platform.OS === 'ios' ? !!configs?.google_login_ios_client_id?.value : true)

  const facebookLoginEnabled = isFacebookAvailable() &&
    configs?.facebook_login_enabled?.value === '1' &&
    configs?.facebook_id?.value

  const appleLoginEnabled = Platform.OS === 'ios' &&
    configs?.apple_login_enabled?.value === '1' &&
    !!configs?.apple_login_client_id?.value

  const handleSuccess = (user: any) => {
    login({ user, token: user.session.access_token })
    onHandleSuccess?.(user)
  }

  const vibrateApp = (impact?: any) => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    ReactNativeHapticFeedback.trigger(impact || "impactLight", options);
  }

  return (
    <>
      {configs && Object.keys(configs).length > 0 ? (
        ((facebookLoginEnabled) ||
          (googleLoginEnabled) ||
          (appleLoginEnabled)) &&
        (
          <View style={styles.sheet.block}>
            {facebookLoginEnabled && (
              <FacebookLogin
                UIButton={UIButton}
                notificationState={notificationState}
                handleErrors={(err: any) => { showToast(ToastType.Error, err), vibrateApp() }}
                handleLoading={(val: boolean) => setIsFBLoading(val)}
                handleSuccessFacebookLogin={handleSuccess}
              />
            )}
            {googleLoginEnabled && (
              <GoogleLogin
                UIButton={UIButton}
                notificationState={notificationState}
                webClientId={configs?.google_login_client_id?.value}
                iosClientId={configs?.google_login_ios_client_id?.value}
                handleErrors={(err: any) => { showToast(ToastType.Error, err), vibrateApp() }}
                handleLoading={(val: boolean) => setIsFBLoading(val)}
                handleSuccessGoogleLogin={handleSuccess}
              />
            )}
            {appleLoginEnabled && (
              <AppleLogin
                UIButton={UIButton}
                notificationState={notificationState}
                handleErrors={(err: any) => { showToast(ToastType.Error, err), vibrateApp() }}
                handleLoading={(val: boolean) => setIsFBLoading(val)}
                handleSuccessAppleLogin={handleSuccess}
              />
            )}
          </View>
        )
      ) : (
        <View style={styles.sheet.skeleton}>
          <Placeholder Animation={Fade}>
            <PlaceholderLine
              height={styles.skeletonLineHeight}
              style={styles.sheet.skeletonLine}
            />
            <PlaceholderLine
              height={styles.skeletonButtonHeight}
              style={styles.sheet.skeletonButton}
            />
          </Placeholder>
        </View>
      )}
    </>
  )
}
