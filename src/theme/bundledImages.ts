/**
 * The images bundled in the binary (`BUNDLED_IMAGES.<group>.<name>`). A theme
 * image (`themeImage`) falls back to one of them while the theme sets no URL
 * (IMAGE_FALLBACKS below); the rest are icons of the app, never themed.
 */
export const BUNDLED_IMAGES: any = {
  logos: {
    logotype: require('../assets/images/logotype.png'),
  },
  tutorials: {
    slide1: require('../assets/images/slide1.jpg'),
    slide2: require('../assets/images/slide2.jpg'),
    slide3: require('../assets/images/slide3.jpg'),
    slide4: require('../assets/images/slide4.jpg'),
    slide5: require('../assets/images/slide5.jpg'),
    slide6: require('../assets/images/slide6.jpg'),
  },
  general: {
    homeHero: require('../assets/images/home-hero.jpg'),
    notFound: require('../assets/images/not-found.png'),
    marker: require('../assets/images/marker.png'),
    paypal: require('../assets/icons/paypal.png'),
    stripecc: require('../assets/icons/cc-stripe.png'),
    stripes: require('../assets/icons/stripe-s.png'),
    stripesb: require('../assets/icons/stripe-sb.png'),
    noNetwork: require('../assets/images/no-network.png'),
    applePayMark: require('../assets/images/apple_pay_mark.png'),
    googlePayMark: require('../assets/images/google_pay_mark.png'),
    driverPng: require('../assets/images/driver.png'),
    heart: require('../assets/gifs/heart.json'),
    giftCardImage: require('../assets/images/gift_card_image.png'),
    giftCard5: require('../assets/images/gift_card_5.png'),
    giftCard10: require('../assets/images/gift_card_10.png'),
    giftCard25: require('../assets/images/gift_card_25.png'),
    giftCard50: require('../assets/images/gift_card_50.png'),
    giftCard100: require('../assets/images/gift_card_100.png'),
  },
  categories: {
    all: require('../assets/images/categories/category-all.png'),
  },
  dummies: {
    product: require('../assets/images/dummies/product.png'),
    businessLogo: require('../assets/images/dummies/store.png'),
    giftCard: require('../assets/images/dummies/gift-card.png')
  },
}

/** Theme image key → the bundled image painted while the theme sets no URL (`group.name` in BUNDLED_IMAGES). */
export const IMAGE_FALLBACKS: Record<string, string> = {
  logotype: 'logos.logotype',
  home_hero: 'general.homeHero',
  'onboarding.slide_1': 'tutorials.slide1',
  'onboarding.slide_2': 'tutorials.slide2',
  'onboarding.slide_3': 'tutorials.slide3',
  'onboarding.slide_4': 'tutorials.slide4',
  'onboarding.slide_5': 'tutorials.slide5',
  'onboarding.slide_6': 'tutorials.slide6',
  'empty.not_found': 'general.notFound',
  'empty.no_internet': 'general.noNetwork',
  'empty.sessions': 'general.notFound',
  'placeholder.product': 'dummies.product',
  'placeholder.business_logo': 'dummies.businessLogo',
  'placeholder.gift_card': 'general.giftCardImage',
  'categories.all': 'categories.all',
  'map.driver': 'general.driverPng',
  'map.store': 'general.marker'
}
