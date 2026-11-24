import React, { useEffect, useMemo, useState } from 'react'
import { singleLineInput } from '../shared/singleLineInput'
import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput, View, Platform, Keyboard } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard';
import { useTheme } from 'styled-components/native';
import { launchImageLibrary } from 'react-native-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import 'dayjs/locale/es';

import { USER_TYPE } from '../../config/constants'
import { MessagesParams } from '../../types'
import { getLogisticTag, chatLanguagesAvailable } from '../../utils'

import { Container, QuickMessageContainer } from './styles'
import { ChatThread } from './ChatThread'

import {
  Messages as MessagesController,
  useSession,
  useUtils,
  useLanguage,
  ToastType,
  useToast
} from '@components'

import { ORDER_STATUS } from '@ui'
import { OButton, OText, Icon } from '../shared'
import { ReviewChip } from '../ReviewOrder/ReviewForm'
import {
  nativeBoxStyle,
  nativeShadowStyle,
  nativeTextStyle,
  themeBorder,
  themeColor,
  themeControlHeight,
  themeGutter,
  themeIconSize,
  themePart,
  themeRadius,
  themeSpace,
  themeVisible,
  themeBottomSpace
} from '@/theme/helpers'

const filterSpecialStatus = ['prepared_in', 'delivered_in', 'delivery_datetime']

const MessagesUI = (props: MessagesParams) => {
  const {
    type,
    order,
    messages,
    image,
    message,
    sendMessage,
    setCanRead,
    setMessage,
    handleSend,
    setImage,
    readMessages,
    business,
    driver
  } = props

  const theme: any = useTheme()
  const { bottom } = useSafeAreaInsets()
  const [{ user }] = useSession()
  const [{ parseDate }] = useUtils()
  const [languageState, t] = useLanguage()
  const [, { showToast }] = useToast()

  const [formattedMessages, setFormattedMessages] = useState<Array<any>>([])
  const [isKeyboardShow, setIsKeyboardShow] = useState(false)
  const previousStatus = [1, 2, 5, 6, 10, 11, 12, 15, 16, 17]
  const chatDisabled = previousStatus.includes(order?.status)

  const quickMessageList = [
    { key: 'customer_message_1', text: t('CUSTOMER_MESSAGE_1', 'Lorem ipsum 1') },
    { key: 'customer_message_2', text: t('CUSTOMER_MESSAGE_2', 'Lorem ipsum 2') },
    { key: 'customer_message_3', text: t('CUSTOMER_MESSAGE_3', 'Lorem ipsum 3') },
    { key: 'customer_message_4', text: t('CUSTOMER_MESSAGE_4', 'Lorem ipsum 4') }
  ]

  const handleClickQuickMessage = (text: string) => {
    setMessage && setMessage(`${message}${text}`)
  }

  const onChangeMessage = (val: string) => {
    setMessage && setMessage(val)
  }

  const removeImage = () => {
    setImage && setImage(null)
  }

  const handleImagePicker = () => {
    launchImageLibrary({ mediaType: 'photo', maxHeight: 2048, maxWidth: 2048, includeBase64: true }, (response: any) => {
      if (response?.didCancel) {
        return
      } else if (response?.errorMessage) {
        showToast(ToastType.Error, response.errorMessage);
      } else {
        if (response?.assets?.length > 0) {
          const image = response?.assets[0]
          const url = `data:${image.type};base64,${image.base64}`
          setImage && setImage(url);
        } else {
          showToast(ToastType.Error, t('IMAGE_NOT_FOUND', 'Image not found'));
        }
      }
    });
  };

  const onSubmit = () => {
    handleSend && handleSend()
    setImage && setImage(null)
    setMessage && setMessage('')
  }

  const messageConsole = (message: any) => {
    return message.change?.attribute !== 'driver_id'
      ?
      `${t('ORDER', 'Order')} ${t(message.change.attribute.toUpperCase(), message.change.attribute.replace(/_/g, ' '))} ${t('CHANGED_FROM', 'Changed from')} ${filterSpecialStatus.includes(message.change.attribute)
        ? `${message.change.old === null ? '0' : message.change.old} ${t('TO', 'to')} ${message.change.new} ${t('MINUTES', 'Minutes')}`
        : `${message.change?.attribute !== 'logistic_status'
          ? message.change.old !== null && (ORDER_STATUS[parseInt(message.change.old, 10)] ? t(ORDER_STATUS[parseInt(message.change.old, 10)]) : message.change.old)
          : message.change.old !== null && getLogisticTag(message.change.old, t)} ${t('TO', 'to')} ${message.change?.attribute !== 'logistic_status'
            ? ORDER_STATUS[parseInt(message.change.new, 10)] ? t(ORDER_STATUS[parseInt(message.change.new, 10)]) : message.change.new
            : getLogisticTag(message.change.new, t)}`
      }`
      : message.change.new
        ?
        `${message.driver?.name} ${message.driver?.lastname !== null ? message.driver.lastname : ''} ${t('WAS_ASSIGNED_AS_DRIVER', 'Was assigned as driver')} ${message.comment ? message.comment.length : ''}`
        :
        `${t('DRIVER_UNASSIGNED', 'Driver unassigned')}`
  }

  const styles = useMemo(() => {
    const chat = theme.native.components.chat_bubble.base
    const input = theme.native.components.input.base
    const line = theme.native.components.divider.variants.item.line
    const control = themeControlHeight(theme, 'md')
    const corner = chat.radius
    const bubble = (background: string, tailCorner: 'borderBottomLeftRadius' | 'borderBottomRightRadius') => ({
      backgroundColor: background,
      borderRadius: corner,
      paddingHorizontal: chat.padding_x,
      paddingVertical: chat.padding_y,
      ...(chat.tail ? { [tailCorner]: 0 } : {}),
      ...(chat.border ?? {}),
      ...nativeShadowStyle(chat.shadow),
    })
    return StyleSheet.create({
      toolbarStyle: {
        // The composer on the page sides, as the bubbles above it.
        paddingHorizontal: themeGutter(theme),
        flexDirection: 'column',
        backgroundColor: chat.composer_background,
        borderTopWidth: line.borderWidth,
        borderTopColor: line.borderColor,
      },
      toolbarInset: { paddingBottom: themeBottomSpace(theme, bottom) },
      toolbarKeyboard: { paddingBottom: 0 },
      toolbarPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: themeSpace(theme, 'xs'),
        paddingVertical: themeSpace(theme, 'xs'),
      },
      composerContainer: {
        flex: 1,
        flexDirection: 'row',
        minHeight: control,
        borderRadius: input.radius,
        alignItems: 'center',
        paddingRight: themeSpace(theme, 'xs'),
        ...nativeBoxStyle({ background: input.background, border: input.border, shadow: input.shadow }),
      },
      composerInput: {
        ...singleLineInput,
        ...nativeTextStyle(input.text),
        flex: 1,
        color: input.text_color,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: themeSpace(theme, 'sm'),
      },
      disabledChatContainer: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: themeSpace(theme, 'xs'),
        paddingVertical: themeSpace(theme, 'sm'),
      },
      containerActions: {
        width: control,
        height: control,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 0,
        marginBottom: 0,
      },
      containerSend: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 0,
      },
      quickMessages: { alignItems: 'center', gap: themeSpace(theme, 'sm') },
      quickMessageContainer: { marginTop: themeSpace(theme, 'sm') },
      preview: { width: themeIconSize(theme, 'lg'), height: themeIconSize(theme, 'lg'), borderRadius: themeRadius(theme, 'sm') },
      removeImageButton: {
        position: 'absolute',
        top: -themeSpace(theme, 'xs'),
        right: -themeSpace(theme, 'xs'),
        backgroundColor: themeColor(theme, 'surface'),
        borderRadius: themeRadius(theme, 'full', { fixed: true }),
      },
      bubbleTextMine: { ...nativeTextStyle(theme.native.tokens.typography.body), color: chat.mine_color },
      bubbleTextTheirs: { ...nativeTextStyle(theme.native.tokens.typography.body), color: chat.theirs_color },
      bubbleRow: { marginVertical: themeSpace(theme, 'xs') },
      bubbleMine: bubble(chat.mine_background, 'borderBottomRightRadius'),
      bubbleTheirs: bubble(chat.theirs_background, 'borderBottomLeftRadius'),
      scrollToBottom: {
        right: themeGutter(theme),
        ...themeBorder(theme, 'thin', 'border', { fixed: true }),
      },
      // The list is inverted: its `paddingTop` is under the last message, over
      // the composer (no input toolbar of gifted-chat's to make room for).
      listContent: {
        flexGrow: 1,
        paddingTop: themeSpace(theme, 'xs'),
        paddingBottom: themeSpace(theme, 'md'),
        paddingHorizontal: themeGutter(theme),
        backgroundColor: themeColor(theme, 'background'),
      },
      list: { flex: 1 },
      messagesContainer: { backgroundColor: themeColor(theme, 'background') },
    })
  }, [theme, bottom])

  const sendSlot = theme.native.components.chat_bubble.slots.send
  const sendInk = themePart(theme, 'button', `variants.${sendSlot.color}.${sendSlot.appearance}.color`)
  const showQuickMessages = themeVisible(theme, 'messages.quick_messages')
  const showImageUpload = themeVisible(theme, 'messages.image_upload')

  const renderActionsIcon = () => (
    <>
      <OButton
        iconOnly
        color='neutral'
        appearance='ghost'
        accessibilityLabel={t('UPLOAD_IMAGE', 'Upload image')}
        icon={image
          ? <Image source={{ uri: image }} style={styles.preview} resizeMode='cover' />
          : <Icon name='image-outline' color='text' />}
        onClick={handleImagePicker}
      />
      {!!image && (
        <Pressable
          style={styles.removeImageButton}
          onPress={removeImage}
          hitSlop={themeSpace(theme, 'sm')}
          accessibilityRole='button'
          accessibilityLabel={t('REMOVE', 'Remove')}
        >
          <Icon name='close-circle' color='inverse_surface' />
        </Pressable>
      )}
    </>
  )

  const renderAccessory = () => (
    !chatDisabled && showQuickMessages &&
    <QuickMessageContainer
      horizontal
      style={styles.quickMessageContainer}
      contentContainerStyle={styles.quickMessages}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
    >
      {quickMessageList.map((quickMessage) => (
        <ReviewChip
          key={quickMessage.key}
          text={quickMessage.text}
          onPress={() => handleClickQuickMessage(
            (message?.length ?? 0) > 0 ? ` ${quickMessage.text}` : quickMessage.text
          )}
        />
      ))}
    </QuickMessageContainer>
  )

  const renderComposer = () => (
    chatDisabled ? (
      <View style={styles.disabledChatContainer}>
        <Icon name='close-circle' size='lg' color='text_muted' />
        <OText preset='body' color='text_muted' align='center'>
          {t('NOT_SEND_MESSAGES', 'You can\'t send messages because the order has ended')}
        </OText>
      </View>
    ) : (
      <View style={styles.composerContainer}>
        <TextInput
          testID='chat-composer'
          style={styles.composerInput}
          value={message}
          onChangeText={onChangeMessage}
          onSubmitEditing={onSubmit}
          returnKeyType={message ? 'send' : 'done'}
          submitBehavior='blurAndSubmit'
          multiline={false}
          numberOfLines={1}
          autoCorrect={false}
          enablesReturnKeyAutomatically={false}
          placeholder={t('WRITE_MESSAGE', 'Write message')}
          placeholderTextColor={theme.native.components.input.base.placeholder}
          accessibilityLabel={t('WRITE_MESSAGE', 'Write message')}
        />
        {showImageUpload && <View style={styles.containerActions}>{renderActionsIcon()}</View>}
      </View>
    )
  )

  const renderSend = () => {
    const isDisabled = (sendMessage?.loading || (message === '' && !image) || messages?.loading)
    return (
      !chatDisabled &&
      <View style={styles.containerSend}>
        <OButton
          iconOnly
          color={sendSlot.color}
          appearance={sendSlot.appearance}
          size={sendSlot.size}
          accessibilityLabel={t('SEND', 'Send')}
          icon={<Icon name='send' color={sendInk} />}
          onClick={onSubmit}
          disabled={isDisabled}
        />
      </View>
    )
  }

  // The composer under the thread: the quick messages over the field and the send button.
  const renderInputToolbar = () => (
    <View style={[styles.toolbarStyle, isKeyboardShow ? styles.toolbarKeyboard : styles.toolbarInset]}>
      {renderAccessory()}
      <View style={styles.toolbarPrimary}>
        {renderComposer()}
        {renderSend()}
      </View>
    </View>
  )

  useEffect(() => {
    const newMessages: Array<any> = []
    const _console = `${t('ORDER_PLACED_FOR', 'Order placed for')} ${parseDate(order?.created_at)} ${t('VIA', 'Via')} ${order?.app_id ? t(order?.app_id.toUpperCase(), order?.app_id) : t('OTHER', 'Other')}`
    const firstMessage = {
      _id: 0,
      type: 1,
      text: _console,
      createdAt: parseDate(order?.created_at, { outputFormat: 'YYYY-MM-DD HH:mm:ss' }),
      user: {
        _id: 0,
        name: t('SYSTEM', 'System'),
        avatar: null
      }
    }
    messages.messages.map((message: any) => {
      if (message.change?.attribute === 'driver_group_id') return
      if (business && message.type !== 0 && (props?.messagesToShow?.messages?.length || message?.can_see?.includes('2'))) {
        newMessages.push({
          _id: message?.id,
          text: message.type === 1 ? messageConsole(message) : message.comment,
          createdAt: message.type !== 0 && parseDate(message?.created_at, { outputFormat: 'YYYY-MM-DD HH:mm:ss' }),
          image: message.source,
          type: message.type,
          user: {
            _id: message.author && message.author.id,
            name: message.author && message.author.name,
            avatar: message.author && (message.author.id !== user.id && type === USER_TYPE.DRIVER ? order?.driver?.photo : order?.business?.logo)
          }
        });
      }

      if (driver && message.type !== 0 && (props?.messagesToShow?.messages?.length || message?.can_see?.includes('4'))) {
        newMessages.push({
          _id: message?.id,
          text: message.type === 1 ? messageConsole(message) : message.comment,
          createdAt: message.type !== 0 && parseDate(message?.created_at, { outputFormat: 'YYYY-MM-DD HH:mm:ss' }),
          image: message.source,
          type: message.type,
          user: {
            _id: message.author && message.author.id,
            name: message.author && message.author.name,
            avatar: message.author && (message.author.id !== user.id && type === USER_TYPE.DRIVER ? order?.driver?.photo : order?.business?.logo)
          }
        });
      }

      // `visibility.messages.order_console`: the first, "Order placed" message.
      if (message.type === 0 && themeVisible(theme, 'messages.order_console')) {
        newMessages.push(firstMessage);
      }
    })
    let _arrayMessages = [...newMessages.reverse()]

    setFormattedMessages(_arrayMessages);
  }, [messages.messages.length, business, driver])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setIsKeyboardShow(true)
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardShow(false)
    })
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardShow(false)
    })
    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
      keyboardWillHideListener.remove()
    }
  }, [])

  useEffect(() => {
    if (driver) {
      setCanRead({ business: false, administrator: true, customer: true, driver: true })
    } else {
      setCanRead({ business: true, administrator: true, customer: true, driver: false })
    }
  }, [business, driver])

  useEffect(() => {
    if (!order?.id || messages?.loading) return
    readMessages && readMessages()
  }, [order?.id, messages?.loading])

  return (
    <Container>
      {messages?.loading && formattedMessages.length === 0
        ? <ActivityIndicator size='small' color={theme.native.components.spinner.base.color} />
        : null}
      <ChatThread
        messages={formattedMessages}
        userId={user?.id}
        locale={chatLanguagesAvailable(languageState?.language?.code)}
        // `visibility.messages.time`: without it, no time under the messages.
        showTime={themeVisible(theme, 'messages.time')}
        copyLabel={t('COPY_TEXT', 'Copy text')}
        cancelLabel={t('CANCEL', 'Cancel')}
        closeLabel={t('CLOSE', 'Close')}
        onCopy={(text) => Clipboard.setString(text)}
        styles={styles}
        footer={renderInputToolbar()}
      />
    </Container>
  )
}

export const Messages = (props: MessagesParams) => {
  const [allMessages, setAllMessages] = useState(props.messages)

  useEffect(() => {
    setAllMessages(props.messages)
  }, [props.messages])

  const MessagesProps = {
    ...props,
    UIComponent: MessagesUI,
    messages: allMessages,
    setMessages: (values: any) => {
      props.setMessages && props.setMessages(values)
      setAllMessages(values)
    }
  }
  return <MessagesController {...MessagesProps} />
}
