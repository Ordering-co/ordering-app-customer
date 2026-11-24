import React, { useState, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { useTheme } from 'styled-components/native'
import { WalletRow } from './WalletRow'

import {
  PaymentOptionWallet as PaymentOptionWalletController,
  useLanguage,
  useUtils,
  useOrder,
  useConfig
} from '@components'

import { OText } from '../shared'
import { themeSpace, themeVisible } from '@/theme/helpers'

type wallet = {
  id: string
  type: string
  balance: number
  redemption_rate: number
  valid: boolean
}

const PaymentOptionWalletUI = (props: any) => {
  const {
    businessConfigs,
    businessId,
    walletsState,
    selectWallet,
    deletetWalletSelected,
    loading
  } = props

  const theme: any = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    skeletonItem: { marginBottom: themeSpace(theme, 'sm') },
    skeleton: { marginBottom: 0, borderRadius: theme.native.components.skeleton.base.radius },
  }), [theme])
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()
  const [{ carts }] = useOrder()
  const [{ parsePrice }] = useUtils()

  const cart = carts?.[`businessId:${businessId}`] ?? {}

  const isWalletCashEnabled = configs?.wallet_cash_enabled?.value === '1'
  const isWalletPointsEnabled = configs?.wallet_credit_point_enabled?.value === '1'

  const isBusinessWalletCashEnabled = businessConfigs.find((config: any) => config.key === 'wallet_cash_enabled')?.value === '1'
  const isBusinessWalletPointsEnabled = businessConfigs.find((config: any) => config.key === 'wallet_credit_point_enabled')?.value === '1'

  const [checkedState, setCheckedState] = useState<{ [key: string]: boolean }>({});

  const creditBalance: any = (wallet: any) => ` = ${parsePrice(wallet.balance / wallet.redemption_rate, { isTruncable: true })}`

  const walletName: any = {
    cash: {
      name: t('PAY_WITH_CASH_WALLET', 'Pay with Cash Wallet'),
      isActive: isWalletCashEnabled && isBusinessWalletCashEnabled
    },
    credit_point: {
      name: t('PAY_WITH_CREDITS_POINTS_WALLET', 'Pay with Credit Points Wallet'),
      isActive: isWalletPointsEnabled && isBusinessWalletPointsEnabled
    }
  }

  const handleOnChange = (wallet: wallet) => {
    if (!checkedState[wallet.id]) {
      selectWallet(wallet)
    } else {
      deletetWalletSelected(wallet)
    }

    setCheckedState({ ...checkedState, [wallet.id]: !checkedState[wallet.id] });
  };

  useEffect(() => {
    if (!walletsState.loading && walletsState.result?.length) {
      const updatedCheckedState: { [key: string]: boolean } = {}
      walletsState.result?.forEach((wallet: any) => {
        updatedCheckedState[wallet.id] = !!cart?.payment_events?.find((w: any) => w.wallet_id === wallet.id)
      })
      setCheckedState(updatedCheckedState)
    }
  }, [walletsState.result?.length])

  return (
    <>
      {!walletsState.loading &&
        !walletsState.error &&
        walletsState.result?.length > 0 &&
        (
          <>
            {walletsState.result?.map((wallet: wallet) => {
              if (!(wallet.valid && wallet.balance >= 0 && walletName[wallet.type]?.isActive)) return null
              const isOff = (cart?.balance === 0 && !checkedState[wallet.id]) || wallet.balance === 0
              return (
                <WalletRow
                  key={wallet.id}
                  type={wallet.type as 'cash' | 'credit_point'}
                  name={walletName[wallet.type]?.name}
                  checked={!!checkedState[wallet.id]}
                  loading={loading && !!checkedState[wallet.id]}
                  disabled={isOff}
                  onPress={() => handleOnChange(wallet)}
                  balance={wallet.type === 'cash'
                    ? parsePrice(wallet?.balance, { isTruncable: true })
                    : (
                      <>
                        <OText color='primary_text' weight={700}>
                          {`${wallet?.balance} ${t('POINTS', 'Points')}`}
                        </OText>
                        {wallet?.balance > 0 && themeVisible(theme, 'checkout.wallet.points_equivalence')
                          ? creditBalance(wallet)
                          : null}
                      </>
                    )}
                />
              )
            })}
          </>
        )}

      {walletsState?.loading && (
        <View>
          {[...Array(2).keys()].map(i => (
            <View style={styles.skeletonItem} key={i}>
              <Placeholder Animation={Fade}>
                <PlaceholderLine width={100} height={40} style={styles.skeleton} />
              </Placeholder>
            </View>
          ))}
        </View>
      )}
    </>
  )
}

export const PaymentOptionWallet = (props: any) => {
  const paymentWalletProps = {
    ...props,
    UIComponent: PaymentOptionWalletUI
  }

  return (
    <PaymentOptionWalletController {...paymentWalletProps} />
  )
}
