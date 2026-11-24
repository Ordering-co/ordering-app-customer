import React, { useEffect } from 'react'
import { ScrollView } from 'react-native';
import { usePageSections } from '@/theme/sections'
import {
  Container,
  SectionContent,
  WalletBand,
} from './styles'
import { WalletBalance } from './WalletBalance'

import {
  WalletList,
  useLanguage,
  useUtils,
  useConfig
} from '@components'

import {
  NotFoundSource,
  WalletTransactions,
} from '@ui'
import { goHome } from '@/navigators/appNavigation'

const CashWalletUI = (props: any) => {
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
  const [{ parsePrice, isWalletEnabled: isWalletConfigEnabled }] = useUtils()
  const [{ configs }] = useConfig()
  const { render } = usePageSections('wallets')

  const isWalletEnabled = configs?.cash_wallet?.value && isWalletConfigEnabled(configs) && (isWalletCashEnabled || isWalletPointsEnabled)

  const currentWalletSelected = walletList?.wallets?.find((w: any) => w.type === 'cash') ?? null

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
        <WalletBalance
          label={t('AVAILABLE', 'Available')}
          amount={parsePrice(currentWalletSelected?.balance)}
          type='cash'
        />
      </SectionContent>
      <WalletBand />
    </>
  )
  const renderTransactions = () => (
    <ScrollView>
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

export const CashWallet = (props: any) => {
  const [{ configs }] = useConfig()

  const isWalletCashEnabled = configs?.wallet_cash_enabled?.value === '1'
  const isWalletPointsEnabled = configs?.wallet_credit_point_enabled?.value === '1'

  const walletsProps = {
    ...props,
    UIComponent: CashWalletUI,
    isWalletCashEnabled,
    isWalletPointsEnabled
  }
  return (
    <WalletList {...walletsProps} />
  )
}
