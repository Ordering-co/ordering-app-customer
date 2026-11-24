import React from 'react'
import { NavBar, Promotions as PromotionsController, SafeAreaViewWrapper } from '@ui'
import settings from '../config';
import { useLanguage } from '@components';
import { getSingleBusiness } from '../utils/singleBusiness';

const Promotions = (props: any) => {
  const [, t] = useLanguage()
  const singleBusiness = getSingleBusiness()
  const promotionsProps = {
    ...props,
    franchiseId: settings.franchiseSlug,
    ...(singleBusiness !== null && { businessSlug: singleBusiness })
  }

  return (
    <>
      <NavBar title={t('OFFERS', 'Offers')} />
      <SafeAreaViewWrapper disableScrollView >
        <PromotionsController {...promotionsProps} />
      </SafeAreaViewWrapper>
    </>
  )
}

export default Promotions
