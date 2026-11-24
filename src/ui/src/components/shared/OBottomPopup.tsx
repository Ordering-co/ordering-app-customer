import React, { useEffect, useState } from 'react'
import { Modal, TouchableWithoutFeedback, StyleSheet, View, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ModalCloseButton } from './styles'
import { useTheme } from 'styled-components/native';
import { themeBottomSpace, nativeShadowStyle, nativeTextStyle, themeColor, themeSpace, themeTitleAlign } from '@/theme/helpers'
import OText from './OText'

interface Props {
  open: boolean;
  transparent?: boolean;
  title?: string;
  children?: any;
  onClose?: any;
  bottomContainerStyle?: any;
  containerStyle?: any;
  titleStyle?: any;
  closeIcon?: boolean;
  presentationStyle?: "fullScreen" | "pageSheet" | "formSheet" | "overFullScreen" | undefined;
  showHandleBar?: boolean;
  animationType?: "slide" | "fade" | "none";
  childenOutsideContainer?: boolean; //
}
const OBottomPopup = (props: Props) => {
  const {
    open,
    transparent,
    title,
    onClose,
    children,
    titleStyle,
    bottomContainerStyle,
    closeIcon,
    presentationStyle,
    showHandleBar,
    animationType,
    childenOutsideContainer
  } = props

  const insets = useSafeAreaInsets()
  const theme: any = useTheme();
  const styles = React.useMemo(() => sheetStyles(theme), [theme]);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (Platform.OS === 'android') {
          setIsKeyboardVisible(true);
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Modal
      animationType={animationType || 'fade'}
      transparent={transparent}
      visible={open}
      onRequestClose={() => onClose()}
      presentationStyle={presentationStyle || 'fullScreen'}
    >
      <View style={styles.container}>
        {showHandleBar && (
          <Pressable style={styles.handleArea} onPress={() => onClose()}>
            <View style={styles.handle} />
          </Pressable>
        )}
        <TouchableWithoutFeedback
          style={styles.touchableOutsideStyle}
          onPress={() => onClose()}
        >
          <View style={styles.touchableOutsideStyle} />
        </TouchableWithoutFeedback>
        <View style={{ ...styles.bottomContainer, ...bottomContainerStyle }}>
          <View style={{ paddingBottom: themeBottomSpace(theme, insets.bottom) }}>
            <View style={styles.modalTitleStyle}>
              {!!title && (
                <OText style={[styles.titleStyle, titleStyle]}>
                  {title}
                </OText>
              )}
              {closeIcon && (
                <ModalCloseButton onPress={onClose} />
              )}
            </View>
            {!childenOutsideContainer && children}
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={themeSpace(theme, 'xl')}
      >
        {childenOutsideContainer && children}
      </KeyboardAvoidingView>
    </Modal>
  )
}

// Styles from `components.sheet`, built with the theme (never at module level).
const sheetStyles = (theme: any) => {
  const sheet = theme.native.components.sheet.base
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColor(theme, 'overlay'),
      justifyContent: 'flex-end'
    },
    touchableOutsideStyle: {
      flex: 1,
      width: '100%'
    },
    bottomContainer: {
      borderTopLeftRadius: sheet.radius,
      borderTopRightRadius: sheet.radius,
      backgroundColor: sheet.background,
      width: '100%',
      ...nativeShadowStyle(sheet.shadow)
    },
    titleStyle: {
      ...nativeTextStyle(sheet.title),
      color: sheet.title_color,
      textAlign: themeTitleAlign(theme),
      flex: 1
    },
    modalTitleStyle: {
      position: 'relative',
      padding: sheet.padding,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    handleArea: {
      position: 'absolute',
      bottom: themeSpace(theme, 'xs'),
      zIndex: 1,
      width: '100%',
      paddingVertical: themeSpace(theme, 'xs'),
      alignItems: 'center'
    },
    handle: {
      backgroundColor: sheet.handle_color,
      height: themeSpace(theme, 'xs'),
      width: themeSpace(theme, 'xxxl'),
      borderRadius: theme.native.tokens.radius.full
    }
  })
}

export default OBottomPopup
