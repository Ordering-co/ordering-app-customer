import React, { useEffect, useState } from 'react';
import { useTheme } from 'styled-components/native';
import { useForm } from 'react-hook-form';
import { launchImageLibrary } from 'react-native-image-picker';
import { LoadingOverlay } from '../LoadingOverlay';
import { ProfileParams } from '../../types';

import { Container, EditIconWrapper, ProfileHeader, ProfileImage } from './styles';

import {
  UserFormDetails as UserProfileController,
  useSession,
  useLanguage,
  ToastType,
  useToast
} from '@components';

import {
  UserFormDetailsUI,
  VerifyPhone,
  OModal,
  OText,
  OButton
} from '@ui'
import Icon from '../shared/Icon';
import { PressableScale } from '../shared/PressableScale';
import { nativeTextStyle, themePart } from '@/theme/helpers';

const ProfileUI = (props: ProfileParams) => {
  const {
    formState,
    handleButtonUpdateClick,
    handleSendVerifyCode,
    verifyPhoneState,
    setFormState
  } = props;

  const theme: any = useTheme();
  const photo = theme.native.components.profile_photo.base
  const editSlot = themePart(theme, 'profile_photo', 'slots.edit')
  const styles = React.useMemo(() => ({
    name: { ...nativeTextStyle(photo.text), color: photo.text_color, flexShrink: 1 },
    image: { width: photo.size, height: photo.size, borderRadius: photo.radius },
  }), [photo])

  const [{ user }] = useSession();
  const [, t] = useLanguage();
  const [, { showToast }] = useToast();
  const { formState: { errors } } = useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [willVerifyOtpState, setWillVerifyOtpState] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [phoneInputData, setPhoneInputData] = useState({
    error: '',
    phone: {
      country_phone_code: null,
      cellphone: null,
    },
  });

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxHeight: 200,
        maxWidth: 200,
        includeBase64: true,
      },
      (response: any) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('ImagePicker Error: ', response.errorMessage);
          showToast(ToastType.Error, response.errorMessage);
        } else {
          if (response?.assets?.length > 0) {
            const image = response?.assets[0]
            const url = `data:${image.type};base64,${image.base64}`
            handleButtonUpdateClick(null, true, url);
          } else {
            showToast(ToastType.Error, t('IMAGE_NOT_FOUND', 'Image not found'));
          }
        }
      },
    );
  };


  const handleVerifyCodeClick = () => {
    if (formState?.changes?.cellphone && formState?.changes?.country_phone_code) {
      const { cellphone, country_phone_code: countryPhoneCode } = formState?.changes

      setPhoneInputData({
        error: '',
        phone: {
          country_phone_code: countryPhoneCode,
          cellphone: cellphone,
        },
      });
      handleSendVerifyCode({
        cellphone: cellphone,
        country_phone_code: countryPhoneCode
      })
    }
  }

  useEffect(() => {
    if (formState.result.result && !formState.loading) {
      if (formState.result?.error) {
        showToast(ToastType.Error, formState.result.result);
      } else {
        showToast(
          ToastType.Success,
          t('UPDATE_SUCCESSFULLY', 'Update successfully'),
        );
      }
    }
  }, [formState.result]);

  useEffect(() => {
    const errorMessages = Object.values(errors).map((item: any) => `- ${item.message}`).join('\n');
    if (errorMessages) {
      showToast(ToastType.Error, errorMessages);
    }
  }, [errors]);

  useEffect(() => {
    if (willVerifyOtpState) handleVerifyCodeClick()
  }, [willVerifyOtpState])

  useEffect(() => {
    if (verifyPhoneState && !verifyPhoneState?.loading) {
      if (verifyPhoneState.result?.error) {
        const message = typeof verifyPhoneState?.result?.result === 'string'
          ? verifyPhoneState?.result?.result
          : verifyPhoneState?.result?.result[0]
        verifyPhoneState.result?.result && showToast(
          ToastType.Error,
          message
        )
        setWillVerifyOtpState(false)
        return
      }

      const okResult = verifyPhoneState.result?.result === 'OK'
      if (okResult) {
        !isModalVisible && setIsModalVisible(true)
        setWillVerifyOtpState(false)
      }
    }
  }, [verifyPhoneState])

  const handleSendPhoneCode = (values: any) => {
    setWillVerifyOtpState(false)
    setIsModalVisible(false)
    setFormState({
      ...formState,
      changes: {
        ...formState?.changes,
        verification_code: values?.code
      }
    })
  }

  return (
    <>
      <Container>
        <ProfileHeader>
          <OText style={styles.name}>{user?.name}{' '}{user?.lastname}</OText>
          <PressableScale onPress={() => handleImagePicker()}>
            {user?.photo && (
              <>
                <ProfileImage
                  source={{ uri: user.photo }}
                  style={styles.image}
                />
                <EditIconWrapper>
                  <OButton
                    iconOnly
                    size={editSlot.size}
                    color={editSlot.color}
                    appearance={editSlot.appearance}
                    accessibilityLabel={t('EDIT', 'Edit')}
                    onClick={() => handleImagePicker()}
                    icon={<Icon set='mci' name='pencil-outline' color='on_overlay' />}
                  />
                </EditIconWrapper>
              </>
            )}
            {!user?.photo && (
              <Icon name='person-circle-outline' size={photo.placeholder_icon_size} color={photo.text_color} />
            )}
          </PressableScale>
        </ProfileHeader>
        <UserFormDetailsUI
          {...props}
          isProfile
          isEdit={isEdit}
          setIsEdit={setIsEdit}
          setWillVerifyOtpState={setWillVerifyOtpState}
        />
        <LoadingOverlay visible={formState?.loading || verifyPhoneState?.loading} />
      </Container>
      <OModal
        open={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      >
        <VerifyPhone
          phone={phoneInputData.phone}
          verifyPhoneState={verifyPhoneState}
          handleCheckPhoneCode={handleSendPhoneCode}
          handleVerifyCodeClick={handleVerifyCodeClick}
          onClose={() => setIsModalVisible(false)}
        />
      </OModal>
    </>

  );
};

export const UserProfileForm = (props: any) => {
  const profileProps = {
    ...props,
    UIComponent: ProfileUI,
  };
  return <UserProfileController {...profileProps} />;
};
