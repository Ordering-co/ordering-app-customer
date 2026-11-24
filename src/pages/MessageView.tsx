import React, { useEffect, useState } from 'react'
import { BackHandler, KeyboardAvoidingView, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themeColor } from '@/theme/helpers'

import { OrderDetails as MessageViewController, useLanguage } from '@components'
import { Messages, NavBar, USER_TYPE } from '@ui'
import { goHome } from '@/navigators/appNavigation'

const OrderMessageUI = (props: any) => {
  const {
    navigation,
    messages,
    setMessages,
    readMessages,
    messagesReadList,
    business: routeBusiness,
    driver: routeDriver,
  } = props

  const [, t] = useLanguage()
  const theme = useTheme()
  const { order } = props.order

  const [openMessages, setOpenMessages] = useState({
    business: routeBusiness !== undefined ? routeBusiness : true,
    driver: routeDriver !== undefined ? routeDriver : false,
  })
  const [unreadAlert, setUnreadAlert] = useState({
    business: false,
    driver: false,
  })

  const handleArrowBack: any = () => goHome(navigation)

  const handleClose = () => {
    props.goToBack && props.goToBack()
  }

  useEffect(() => {
    if (messagesReadList?.length) {
      openMessages.business
        ? setUnreadAlert({ ...unreadAlert, business: false })
        : setUnreadAlert({ ...unreadAlert, driver: false })
    }
  }, [messagesReadList])

  useEffect(() => {
    setOpenMessages({
      business: routeBusiness !== undefined ? routeBusiness : true,
      driver: routeDriver !== undefined ? routeDriver : false,
    })
    readMessages && readMessages()
  }, [order?.id, routeBusiness, routeDriver])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleArrowBack)
    return () => {
      backHandler.remove()
    }
  }, [])

  const activeType = openMessages.driver ? USER_TYPE.DRIVER : USER_TYPE.BUSINESS

  return (
    <KeyboardAvoidingView behavior='padding' style={styles.screen} testID='chat-keyboard-screen'>
      <NavBar
        // While the order loads (opened with its id only) the title is the screen's, never empty:
        // the bar shows the logo instead of a title that is missing.
        title={(activeType === USER_TYPE.DRIVER ? order?.driver?.name : order?.business?.name) || t('MESSAGES', 'Messages')}
        subtitle={activeType === USER_TYPE.DRIVER ? t('DRIVER', 'Driver') : t('BUSINESS', 'Business')}
        onActionLeft={() => handleClose()}
      />
      <View style={{ flex: 1, backgroundColor: themeColor(theme, 'background') }}>
        <Messages
          orderId={order?.id}
          messages={messages}
          order={order}
          setMessages={setMessages}
          readMessages={readMessages}
          business={openMessages.business}
          driver={openMessages.driver}
          isMeesageListing
          onClose={() => handleClose()}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 }
})

const MessageView = (props: any) => {
  const orderDetailsProps = {
    ...props,
    UIComponent: OrderMessageUI,
    disabledLeaveOrderSocket: true,
    goToBack: () => props.navigation?.canGoBack() && props.navigation.goBack(),
    order: props.route?.params?.order,
    orderId: props.route?.params?.orderId,
    type: props.route?.params?.type,
    business: props.route?.params?.business,
    driver: props.route?.params?.driver
  }

  return <MessageViewController {...orderDetailsProps} />
}

export default MessageView
