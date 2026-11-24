import React, { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

import { LoginForm } from '@ui'
import { themeColor, themeGutter, themeSpace } from '@/theme/helpers'
import { openScreen } from '@/navigators/appNavigation'

type CheckoutLoginFormProps = {
  navigation: any
  theme: any
  t: (key: string, fallback: string) => string
  onSuccessLogin: (user: any) => void
  onCloseLogin: () => void
  onOpenSignup: () => void
}

export const CheckoutLoginForm = ({
  navigation,
  theme,
  t,
  onSuccessLogin,
  onCloseLogin,
  onOpenSignup
}: CheckoutLoginFormProps) => {
  const styles = useMemo(() => StyleSheet.create({
    scroll: { paddingHorizontal: themeGutter(theme), width: '100%' },
    content: { paddingBottom: themeSpace(theme, 'xl') }
  }), [theme])
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LoginForm
        navigation={navigation}
        isGuest
        loginButtonText={t('LOGIN', 'Login')}
        loginButtonBackground={themeColor(theme, 'primary')}
        forgotButtonText={t('FORGOT_YOUR_PASSWORD', 'Forgot your password?')}
        registerButtonText={t('SIGNUP', 'Signup')}
        handleSuccessLogin={onSuccessLogin}
        onNavigationRedirect={(page: string) => {
          if (!page) return
          onCloseLogin()
          openScreen(navigation, page)
        }}
        onNavigateToSignup={onOpenSignup}
      />
    </ScrollView>
  )
}
