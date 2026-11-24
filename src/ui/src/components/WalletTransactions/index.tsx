import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { useTheme } from 'styled-components/native'

import { Container, Content, SkeletonItem, TransactionsWrapper } from './styles'
import { useLanguage } from '@components'
import { WalletTransactionItem, OText } from '@ui'

export const WalletTransactions = (props: any) => {
  const {
    transactionsList,
    currentWalletSelected
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const styles = React.useMemo(() => StyleSheet.create({
    skeleton: { marginBottom: 0, borderRadius: theme.native.components.skeleton.base.radius }
  }), [theme])

  return (
    <Container>
      <Content>
        {!transactionsList?.loading &&
          !transactionsList?.error &&
          transactionsList.list?.[`wallet:${currentWalletSelected?.id}`]?.length > 0 &&
        (
          <>
            <TransactionsWrapper>
              {transactionsList.list?.[`wallet:${currentWalletSelected?.id}`]?.map((transaction: any, i: number) =>(
                <WalletTransactionItem
                  idx={i}
                  type={currentWalletSelected?.type}
                  key={transaction.id}
                  item={transaction}
                  withFormatPrice={currentWalletSelected?.type === 'cash'}
                  isLast={i === transactionsList.list?.[`wallet:${currentWalletSelected?.id}`]?.length - 1}
                />
              ))}
            </TransactionsWrapper>
          </>
        )}

        {(transactionsList?.loading) && (
          <View>
            {[...Array(4).keys()].map(i => (
              <SkeletonItem key={i}>
                <Placeholder Animation={Fade}>
                  <PlaceholderLine width={100} height={100} style={styles.skeleton} />
                </Placeholder>
              </SkeletonItem>
            ))}
          </View>
        )}

        {!transactionsList?.loading &&
          !transactionsList.list?.[`wallet:${currentWalletSelected?.id}`]?.length &&
        (
          <OText color='text_disabled' preset='body_lg' align='center'>
            {transactionsList?.error
              ? t('ERROR_NOT_FOUND_TRANSACTIONS', 'Sorry, an error has occurred')
              : t('NOT_FOUND_TRANSACTIONS', 'No transactions to show at this time.')
            }
          </OText>
        )}
      </Content>
    </Container>
  )
}
