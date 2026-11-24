import React, { useMemo } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'

import Icon from '../shared/Icon'
import OButton from '../shared/OButton'
import { themePart, themeSpace } from '@/theme/helpers'
import { SocialListWrapper } from './styles'

/** A social link: the `social` slot of `components.business_header` (an icon button). */
const SocialNetWork = (props: any) => {
  const { socialLink, iconTitle, noMaterialIcon } = props
  const theme: any = useTheme()
  const slot = themePart(theme, 'business_header', 'slots.social')
  const ink = themePart(theme, 'button', `variants.${slot.color}.${slot.appearance}.color`)

  return (
    <OButton
      iconOnly
      color={slot.color}
      appearance={slot.appearance}
      size={slot.size}
      accessibilityLabel={iconTitle}
      onClick={() => Linking.openURL(socialLink)}
      icon={noMaterialIcon
        ? <Icon name={`logo-${iconTitle}`} color={ink} />
        : <Icon set='mci' name={iconTitle} color={ink} />}
    />
  )
}

export const SocialIcons = (props: any) => {
  const { loading, business } = props
  const theme: any = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    list: { flex: 1, justifyContent: 'flex-end' },
    skeleton: { flexDirection: 'row', gap: themeSpace(theme, 'sm'), justifyContent: 'flex-end' },
    skeletonItem: { width: themePart(theme, 'button', 'sizes.md.height'), justifyContent: 'center' },
    skeletonLine: { marginBottom: 0, borderRadius: themePart(theme, 'skeleton', 'base.radius') }
  }), [theme])

  const socialProfiles = [
    { profile: business?.facebook_profile, iconTitle: 'facebook' },
    { profile: business?.instagram_profile, iconTitle: 'instagram' },
    { profile: business?.tiktok_profile, iconTitle: 'tiktok', noMaterialIcon: true },
    { profile: business?.pinterest_profile, iconTitle: 'pinterest' },
    { profile: business?.whatsapp_number, iconTitle: 'whatsapp' },
    { profile: business?.snapchat_profile, iconTitle: 'snapchat' }
  ].filter(({ profile }) => profile)

  if (!loading && socialProfiles.length === 0) return null

  return (
    <>
      {!loading && (
        <SocialListWrapper
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={styles.list}
        >
          {socialProfiles.map(({ profile, iconTitle, noMaterialIcon }) => (
            <SocialNetWork
              key={iconTitle}
              socialLink={profile}
              iconTitle={iconTitle}
              noMaterialIcon={noMaterialIcon}
            />
          ))}
        </SocialListWrapper>
      )}

      {loading && (
        <Placeholder Animation={Fade}>
          <View style={styles.skeleton}>
            {[...Array(5).keys()].map(i => (
              <View style={styles.skeletonItem} key={i}>
                <PlaceholderLine width={100} height={themeSpace(theme, 'lg')} style={styles.skeletonLine} />
              </View>
            ))}
          </View>
        </Placeholder>
      )}
    </>
  )
}
