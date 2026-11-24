import React, { useState, useEffect, useMemo } from 'react'
import { StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image'
import { nativeTextStyle, themeBorder, themeVisible } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'

import {
  Container,
  SectionContent,
  LoyaltyContent,
  LoyaltyWrapp,
  WalletBand
} from './styles'
import { WalletBalance } from '../CashWallet/WalletBalance'

import {
  WalletList,
  useLanguage,
  useConfig,
  useUtils
} from '@components'

import {
  OText,
  NotFoundSource,
  WalletTransactions
} from '@ui'
import { goHome } from '@/navigators/appNavigation'

const LoyaltyPointsUI = (props: any) => {
  const {
    navigation,
    walletList,
    userLoyaltyLevel,
    transactionsList,
    isWalletCashEnabled,
    isWalletPointsEnabled,
    getWallets,
    refreshWallets,
    setRefreshWallets
  } = props

  const [, t] = useLanguage()
  const theme = useTheme()
  const [{ configs }] = useConfig()
  const [{ isWalletEnabled: isWalletConfigEnabled }] = useUtils()


  const { render } = usePageSections('wallets')
  const showLevel = themeVisible(theme, 'wallets.loyalty_level')

  const styles = useMemo(() => {
    const look = (theme as any).native.components.wallet_balance.base
    return StyleSheet.create({
      logoStyle: {
        width: look.loyalty_image_size,
        height: look.loyalty_image_size,
        borderRadius: look.loyalty_image_radius,
        ...themeBorder(theme, 'thin', 'border'),
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      },
      logoHidden: {
        width: 0,
        height: 0,
        borderWidth: 0,
      },
      levelName: { ...nativeTextStyle(look.loyalty_name), textTransform: 'uppercase' },
      transactions: { maxHeight: '55%' }
    })
  }, [theme]);

  const [levelImageError, setLevelImageError] = useState(false)
  const [levelImageLoaded, setLevelImageLoaded] = useState(false)

  const isWalletEnabled = configs?.cash_wallet?.value && isWalletConfigEnabled(configs) && (isWalletCashEnabled || isWalletPointsEnabled)

  const currentWalletSelected = walletList?.wallets?.find((w: any) => w.type === 'credit_point') ?? null

  const loyaltyLevel = Object.keys(userLoyaltyLevel.loyaltyLevel ?? {}).length > 0 && userLoyaltyLevel.loyaltyLevel

  const hasLevelImage = !!loyaltyLevel?.image?.trim() && !levelImageError

  useEffect(() => {
    setLevelImageError(false)
    setLevelImageLoaded(false)
  }, [loyaltyLevel?.image])

  useEffect(() => {
    if (!isWalletEnabled) {
      goHome(navigation, {
        screen: 'Profile'
      })
    }
  }, [configs])

  useEffect(() => {
    if (refreshWallets) {
      getWallets()
      setRefreshWallets && setRefreshWallets(false)
    }
  }, [refreshWallets])

  // The `wallets` page sections this screen has, in the theme's order.
  const renderBalance = () => (
    <>
      <SectionContent>
        {showLevel && (
          <LoyaltyContent>
            <LoyaltyWrapp>
              <OText preset='h3'>
                {`${t('LOYALTY_LEVEL_TITLE', 'Your level is')}`}
              </OText>
              {hasLevelImage && (
                <FastImage
                  style={[styles.logoStyle, !levelImageLoaded && styles.logoHidden]}
                  source={{
                    uri: loyaltyLevel.image,
                    priority: FastImage.priority.high,
                    cache: FastImage.cacheControl.web
                  }}
                  objectFit='contain'
                  onLoad={() => setLevelImageLoaded(true)}
                  onError={() => setLevelImageError(true)}
                />
              )}
              <OText style={styles.levelName} color='primary'>
                {loyaltyLevel.name}
              </OText>
            </LoyaltyWrapp>
          </LoyaltyContent>
        )}
        <WalletBalance
          label={t('AVAILABLE', 'Available')}
          amount={`${currentWalletSelected?.balance} ${t('POINTS', 'Points')}`}
          type='credit_point'
        />
      </SectionContent>
      <WalletBand />
    </>
  )
  const renderTransactions = () => (
    <ScrollView style={styles.transactions} showsVerticalScrollIndicator={false}>
      <WalletTransactions transactionsList={transactionsList} currentWalletSelected={currentWalletSelected} />
    </ScrollView>
  )
  const sections = { balance: renderBalance, transactions: renderTransactions }

  return (
    <>
      <Container>
        {!walletList.loading &&
          !userLoyaltyLevel.loading &&
          !walletList.error &&
          walletList.wallets?.length > 0 &&
          (
            <>
              {render(sections)}
            </>
          )}
        {!walletList?.loading && !userLoyaltyLevel.loading && (walletList?.error || !walletList?.wallets?.length) && (
          <NotFoundSource
            content={walletList?.error
              ? t('ERROR_NOT_FOUND_WALLETS', 'Sorry, an error has occurred')
              : t('NOT_FOUND_WALLETS', 'No wallets to show at this time.')
            }
          />
        )}
      </Container>
    </>
  )
}

export const LoyaltyPoints = (props: any) => {
  const [{ configs }] = useConfig()

  const isWalletCashEnabled = configs?.wallet_cash_enabled?.value === '1'
  const isWalletPointsEnabled = configs?.wallet_credit_point_enabled?.value === '1'

  const walletsProps = {
    ...props,
    UIComponent: LoyaltyPointsUI,
    isWalletCashEnabled,
    isWalletPointsEnabled,
    walletType: 'credit_point'
  }
  return (
    <WalletList {...walletsProps} />
  )
}
