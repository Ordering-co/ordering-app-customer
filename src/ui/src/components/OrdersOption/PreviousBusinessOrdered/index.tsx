import React from 'react'
import { View, Dimensions } from 'react-native';
import { useTheme } from 'styled-components/native'
import { themeSpace } from '@/theme/helpers'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';

import { BusinessController } from '../../BusinessController'
import { Container, ListWrapper } from './styles'
import { PreviousBusinessOrderedParams } from '../../../types';
import { useOrder } from '@components'
import { useSkeletonCard } from '../skeleton'

const BusinessControllerList = ({ businesses, onBusinessClick, navigation, orderState, handleCustomUpdate, style }: any) => {
  return (
    <>
      {businesses?.result?.map((business: any, i: number) => (
        <View style={style} key={`${business.id}_` + i}>
          <BusinessController
            simpleView
            business={business}
            isBusinessOpen={business.open}
            handleCustomClick={() => onBusinessClick(business)}
            orderType={orderState?.options?.type}
            navigation={navigation}
            businessHeader={business?.header}
            businessFeatured={business?.featured}
            businessLogo={business?.logo}
            businessReviews={business?.reviews}
            businessDeliveryPrice={business?.delivery_price}
            businessDeliveryTime={business?.delivery_time}
            businessPickupTime={business?.pickup_time}
            businessDistance={business?.distance}
            handleCustomUpdate={handleCustomUpdate}
          />
        </View>
      ))}
    </>
  )
}

const BusinessSkeletons = () => {
  const { styles, color } = useSkeletonCard()
  return (
    <>
      {[...Array(6).keys()].map((_, i) => (
        <Placeholder
          key={i}
          Animation={Fade}
          style={styles.card}
        >
          <View style={styles.row}>
            <PlaceholderLine width={45} color={color} style={styles.line} />
            <PlaceholderLine width={20} color={color} style={styles.line} />
          </View>
          <PlaceholderLine width={70} color={color} style={styles.lineSpaced} />
          <PlaceholderLine width={30} color={color} style={styles.lineLast} />
        </Placeholder>
      ))}
    </>
  )
}

export const PreviousBusinessOrdered = (props: PreviousBusinessOrderedParams) => {
  const {
    navigation,
    businesses,
    onNavigationRedirect,
    isBusinessesSearchList,
    handleUpdateBusinesses,
  } = props

  const [orderState] = useOrder()
  const theme: any = useTheme()
  const windowWidth = Dimensions.get('window').width;
  const onBusinessClick = (business: any) => {
    onNavigationRedirect('Business', { store: business.slug, logo: business.logo, header: business.header })
  }

  return (
    <Container
      horizontal={isBusinessesSearchList}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      {isBusinessesSearchList ? (
        <>
          {!businesses?.loading && (
            <BusinessControllerList
              style={{ width: windowWidth - 120, marginRight: themeSpace(theme, 'lg') }}
              onBusinessClick={onBusinessClick}
              orderState={orderState}
              navigation={navigation}
              businesses={businesses}
              handleCustomUpdate={handleUpdateBusinesses}
            />
          )}
        </>
      ) : (
        <ListWrapper>
          {businesses?.loading ? (
            <BusinessSkeletons />
          ) : (
            <BusinessControllerList
              onBusinessClick={onBusinessClick}
              orderState={orderState}
              navigation={navigation}
              businesses={businesses}
              handleCustomUpdate={handleUpdateBusinesses}
            />
          )}
        </ListWrapper>
      )}
    </Container>
  )
}
