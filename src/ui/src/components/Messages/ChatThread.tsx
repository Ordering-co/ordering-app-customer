import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useTheme } from 'styled-components/native'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

import { OText, Icon } from '../shared'
import { ImageViewer } from './ImageViewer'
import { splitLinks } from './linkify'
import {
  nativeShadowStyle,
  nativeTextStyle,
  themeColor,
  themeControlHeight,
  themePart,
  themeRadius,
  themeSpace,
} from '@/theme/helpers'

dayjs.extend(localizedFormat)

/**
 * The order chat's thread, the app's own (in place of react-native-gifted-chat):
 * an inverted list, newest message at the bottom, with the day over the first
 * message of each day, the other side's avatar under its last message of a run,
 * the bubbles of `components.chat_bubble`, an image that opens full screen
 * (`ImageViewer`), the web addresses, emails and phones of a text as links
 * (`linkify`) and a long press that copies the text. The composer is the
 * caller's (`footer`).
 */
export type ChatMessage = {
  _id: string | number
  text?: string
  createdAt?: string | Date | false
  image?: string | null
  type?: number
  user: { _id?: string | number | null, name?: string | null, avatar?: string | null }
}

type ChatThreadProps = {
  messages: ChatMessage[]
  userId?: string | number
  locale: string
  showTime: boolean
  copyLabel: string
  cancelLabel: string
  closeLabel: string
  onCopy: (text: string) => void
  styles: {
    list: any
    listContent: any
    bubbleRow: any
    bubbleMine: any
    bubbleTheirs: any
    bubbleTextMine: any
    bubbleTextTheirs: any
    scrollToBottom: any
    messagesContainer: any
  }
  footer: React.ReactNode
}

/** Past this offset (as gifted-chat's 200) the scroll-to-bottom button shows. */
const SCROLL_TO_BOTTOM_OFFSET = 200

const sameDay = (a?: ChatMessage, b?: ChatMessage) =>
  !!a?.createdAt && !!b?.createdAt && dayjs(a.createdAt).isSame(dayjs(b.createdAt), 'day')

const sameUser = (a?: ChatMessage, b?: ChatMessage) =>
  !!a && !!b && a.user?._id === b.user?._id

const sameColor = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()

const initials = (name?: string | null) => (name ?? '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(word => word[0]?.toUpperCase())
  .join('')

export const ChatThread = (props: ChatThreadProps) => {
  const { messages, userId, locale, showTime, copyLabel, cancelLabel, closeLabel, onCopy, styles: chat, footer } = props
  const theme: any = useTheme()
  const listRef = useRef<FlatList<ChatMessage>>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [viewerImage, setViewerImage] = useState<string | null>(null)

  const looks = useMemo(() => {
    const avatar = themePart(theme, 'avatar', 'base')
    const avatarSize = themePart(theme, 'avatar', 'sizes.sm.size')
    const link = themePart(theme, 'link', 'base')
    const bubble = theme.native.components.chat_bubble.base
    // A link is read on its bubble: the theme's link color, or the bubble's own
    // ink where the bubble is painted with that color (mine, by default).
    const linkLook = (ink: string, background: string) => ({
      color: sameColor(link.color, background) ? ink : link.color,
      textDecorationLine: 'underline' as const,
    })
    return StyleSheet.create({
      wrapper: { flex: 1 },
      // As gifted-chat's `alignTop`: a short thread starts at the top.
      // (the list is inverted: its content's end is the screen's top.)
      content: { justifyContent: 'flex-end' },
      day: { alignItems: 'center', marginTop: themeSpace(theme, 'xs'), marginBottom: themeSpace(theme, 'sm') },
      row: { flexDirection: 'row', alignItems: 'flex-end' },
      rowMine: { justifyContent: 'flex-end', paddingLeft: themeSpace(theme, 'xxxl') },
      rowTheirs: { justifyContent: 'flex-start', paddingRight: themeSpace(theme, 'xxxl') },
      avatarSlot: { width: avatarSize, height: avatarSize, marginRight: themeSpace(theme, 'sm') },
      avatar: {
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatar.radius,
        backgroundColor: avatar.background,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...(avatar.border ?? {}),
      },
      avatarImage: { width: avatarSize, height: avatarSize },
      bubbleBody: { flexShrink: 1 },
      // As gifted-chat's image (150 × 100): the largest avatar's height, wider by `xxxl`.
      image: {
        width: themePart(theme, 'avatar', 'sizes.xl.size') + themeSpace(theme, 'xxxl'),
        height: themePart(theme, 'avatar', 'sizes.xl.size'),
        borderRadius: themeRadius(theme, 'lg'),
        marginBottom: themeSpace(theme, 'xs'),
      },
      time: { alignSelf: 'flex-end', marginTop: themeSpace(theme, 'xxs') },
      scrollToBottomButton: {
        position: 'absolute',
        width: themeControlHeight(theme, 'sm'),
        height: themeControlHeight(theme, 'sm'),
        borderRadius: themeRadius(theme, 'full', { fixed: true }),
        backgroundColor: themeColor(theme, 'surface'),
        alignItems: 'center',
        justifyContent: 'center',
        ...nativeShadowStyle(theme.native.components.chat_bubble.base.shadow),
      },
      avatarText: { ...nativeTextStyle(theme.native.tokens.typography.caption), color: avatar.color },
      linkMine: linkLook(bubble.mine_color, bubble.mine_background),
      linkTheirs: linkLook(bubble.theirs_color, bubble.theirs_background),
    })
  }, [theme])

  // A link nothing on the device opens (a phone on a tablet) stays as text.
  const openLink = useCallback((href: string) => {
    Linking.openURL(href).catch(() => {})
  }, [])

  const handleLongPress = useCallback((message: ChatMessage) => {
    if (!message.text) return
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [copyLabel, cancelLabel], cancelButtonIndex: 1 },
        (index) => index === 0 && onCopy(message.text ?? '')
      )
      return
    }
    Alert.alert('', message.text, [
      { text: cancelLabel, style: 'cancel' },
      { text: copyLabel, onPress: () => onCopy(message.text ?? '') },
    ])
  }, [copyLabel, cancelLabel, onCopy])

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowScrollToBottom(event.nativeEvent.contentOffset.y > SCROLL_TO_BOTTOM_OFFSET)
  }

  const renderAvatar = (message: ChatMessage, newer?: ChatMessage) => {
    // No avatar at all (`avatar: null`: the order's own messages), as gifted-chat's.
    if (message.user?.avatar === null) return null
    // The avatar goes under the last message of a run (as gifted-chat's).
    if (newer && sameUser(message, newer) && sameDay(message, newer)) {
      return <View style={looks.avatarSlot} />
    }
    return (
      <View style={looks.avatarSlot}>
        <View style={looks.avatar} testID='chat-avatar'>
          {message.user?.avatar
            ? <Image source={{ uri: message.user.avatar }} style={looks.avatarImage} />
            : <OText style={looks.avatarText}>{initials(message.user?.name)}</OText>}
        </View>
      </View>
    )
  }

  const renderItem = ({ item, index }: { item: ChatMessage, index: number }) => {
    const older = messages[index + 1]
    const newer = messages[index - 1]
    const mine = userId !== undefined && item.user?._id === userId
    const textStyle = mine ? chat.bubbleTextMine : chat.bubbleTextTheirs
    return (
      <View testID='chat-message'>
        {!!item.createdAt && !sameDay(item, older) && (
          <View style={looks.day}>
            <OText preset='caption' weight={600} color='text_muted'>
              {dayjs(item.createdAt).locale(locale).format('ll')}
            </OText>
          </View>
        )}
        <View style={[looks.row, mine ? looks.rowMine : looks.rowTheirs, chat.bubbleRow]}>
          {!mine && renderAvatar(item, newer)}
          <Pressable
            onLongPress={() => handleLongPress(item)}
            style={[looks.bubbleBody, mine ? chat.bubbleMine : chat.bubbleTheirs]}
          >
            {!!item.image && (
              <Pressable onPress={() => setViewerImage(item.image ?? null)} accessibilityRole='imagebutton'>
                <Image source={{ uri: item.image }} style={looks.image} resizeMode='cover' />
              </Pressable>
            )}
            {!!item.text && (
              <OText style={textStyle}>
                {splitLinks(item.text).map((part, position) => (part.type === 'text' ? part.text : (
                  <Text
                    key={position}
                    accessibilityRole='link'
                    style={mine ? looks.linkMine : looks.linkTheirs}
                    onPress={() => openLink(part.href)}
                    // The long press of a link is the message's: it copies the text.
                    onLongPress={() => handleLongPress(item)}
                  >
                    {part.text}
                  </Text>
                )))}
              </OText>
            )}
            {showTime && !!item.createdAt && (
              <OText preset='caption' style={[looks.time, { color: textStyle.color }]}>
                {dayjs(item.createdAt).locale(locale).format('LT')}
              </OText>
            )}
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={looks.wrapper}>
      <View style={[looks.wrapper, chat.messagesContainer]}>
        <FlatList
          ref={listRef}
          testID='chat-list'
          inverted
          data={messages}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={100}
          style={chat.list}
          contentContainerStyle={[chat.listContent, looks.content]}
        />
        {showScrollToBottom && (
          <Pressable
            testID='chat-scroll-to-bottom'
            accessibilityRole='button'
            onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
            style={[looks.scrollToBottomButton, chat.scrollToBottom, { bottom: themeSpace(theme, 'sm') }]}
          >
            <Icon set='mci' name='chevron-double-down' size='lg' color='text' />
          </Pressable>
        )}
      </View>
      {footer}
      <ImageViewer uri={viewerImage} closeLabel={closeLabel} onClose={() => setViewerImage(null)} />
    </View>
  )
}
