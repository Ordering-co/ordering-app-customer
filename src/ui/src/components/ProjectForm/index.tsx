import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, useWindowDimensions, Keyboard } from 'react-native'
import { useTheme } from 'styled-components/native';
import { Controller, useForm } from 'react-hook-form';
import { nativeTextStyle, themeImage, themePart, themeSpace } from '@/theme/helpers'
import { FormInput, Container, LogoWrapper, ButtonWrapper } from './styles'
import {
  ProjectForm as ProjectFormController,
  useApi,
  useLanguage
} from '@components'
import { OButton, OIcon, OInput, OText, ProjectFormParams } from '@ui'

/** The form's values: its text fields and checkboxes. */
type FormValues = Record<string, string | boolean>

export const ProjectFormUI = (props: ProjectFormParams) => {
  const {
    navigation,
    onNavigationRedirect,
    onSubmit,
    projectState,
    setProjectState
  } = props

  const theme: any = useTheme()
  const { width } = useWindowDimensions();
  const submit = themePart(theme, 'auth_form', 'slots.submit')
  const styles = useMemo(() => StyleSheet.create({
    // The logo's box: half the window, the logotype's proportions.
    logo: { marginTop: themeSpace(theme, 'lg'), resizeMode: 'contain', width: width / 2, height: (width / 2) * 0.25 },
    error: {
      ...nativeTextStyle(themePart(theme, 'field', 'base.error')),
      color: themePart(theme, 'field', 'base.error_color'),
      alignSelf: 'center',
      marginTop: themePart(theme, 'field', 'base.message_gap'),
    },
  }), [theme, width])

  const [ordering] = useApi()
  const [, t] = useLanguage()
  const [isKeyboardShow, setIsKeyboardShow] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setProjectState?.({ data: null, loading: false })
    }
  }, [errors])

  useEffect(() => {
    if (ordering?.project === projectState?.data?.project_name && !isKeyboardShow) {
      setProjectState?.({ ...projectState, loading: false })
      navigation?.canGoBack() ? navigation?.goBack() : onNavigationRedirect('Home', {})
    }
  }, [ordering, isKeyboardShow])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardShow(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardShow(false);
      },
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Container>
      <LogoWrapper>
        <OIcon
          src={themeImage(theme, 'logotype')}
          style={styles.logo}
        />
      </LogoWrapper>
      <FormInput>
        <OText preset='h3' weight={400} mBottom='lg'>
          {t('PROJECT', 'Project')}
        </OText>
        <Controller
          control={control}
          name='project_name'
          rules={{ required: t(`VALIDATION_ERROR_PROJECT_NAME_REQUIRED`, 'The field project name is required') }}
          defaultValue=""
          render={({ field: { onChange, value } }: any) => (
            <OInput
              name='project_name'
              placeholder={t('PROJECT_NAME', 'Project Name')}
              vertorIcon='arrow-collapse-right'
              onChange={(e: any) => {
                const project = e?.target?.value?.replace(/\s/g, '')
                onChange(project)
              }}
              selectionColor={themePart(theme, 'link', 'base.color')}
              value={value}
              hasError={Object.keys(errors).length > 0}
              returnKeyType='done'
              autoCorrect={false}
              autoCapitalize='none'
              blurOnSubmit={false}
              onSubmitEditing={() => {
                Keyboard.dismiss()
                handleSubmit(onSubmit)()
              }}
              isValueSync
            />
          )}
        />
      {Object.keys(errors).length > 0 && (
        <OText style={styles.error}>
          {errors.project_name?.message}
        </OText>
      )}
      </FormInput>
      <ButtonWrapper>
        <OButton
          text={t('CONTINUE', 'Continue')}
          size={submit.size}
          color={submit.color}
          appearance={submit.appearance}
          loading={projectState?.loading}
          onClick={() => {
            Keyboard.dismiss()
            handleSubmit(onSubmit)()
          }}
        />
      </ButtonWrapper>
    </Container>
  )
}

export const ProjectForm = (props: ProjectFormParams) => {
  const projectFormProps = {
    ...props,
    UIComponent: ProjectFormUI
  }

  return <ProjectFormController {...projectFormProps} />
}
