import * as React from 'react';
import { Modal } from "react-native";
import { useTheme } from 'styled-components/native'
import { nativeTextStyle, themeTitleAlign } from '@/theme/helpers'

import { CenteredView, ModalCloseButton, ModalTitle } from './styles';
import { OText, SafeAreaViewWrapper, Toast } from '@ui'

interface Props {
  open?: boolean;
  title?: string;
  subtitle?: string;
  children?: any;
  onClose?: any;
  style?: any;
  isTransparent?: boolean;
  titleSectionStyle?: any;
  isAvoidKeyBoardView?: boolean;
  styleContainerCloseButton?: any;
  showToastInsideModal?: boolean;
}

const OModal = (props: Props): React.ReactElement => {
  const theme: any = useTheme()
  const {
    open,
    title,
    subtitle,
    children,
    onClose,
    isTransparent,
    showToastInsideModal
  } = props

  return (
    <Modal
      animationType="slide"
      transparent={isTransparent}
      visible={open}
      onRequestClose={() => onClose && onClose()}
    >
      {showToastInsideModal && (
        <Toast />
      )}
      <SafeAreaViewWrapper pt disableScrollView backgroundColor={theme.native.components.modal.base.background}>
        <CenteredView>
          <ModalTitle>
            <OText style={[nativeTextStyle(theme.native.components.modal.base.title), { textAlign: themeTitleAlign(theme) }]} numberOfLines={1} ellipsizeMode='tail'>{title || ''}</OText>
            {subtitle && <OText preset='body'>{subtitle}</OText>}
          </ModalTitle>
          <ModalCloseButton onPress={onClose} />
        </CenteredView>
        {children}
      </SafeAreaViewWrapper>
    </Modal>
  );
};

export default OModal;
