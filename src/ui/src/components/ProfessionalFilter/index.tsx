import React, { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { ProfessionalFilterParams } from '../../types'
import { SingleProfessionalCard } from './SingleProfessionalCard'
import { professionalChoiceStyles } from './styles'
import { PressableScale } from '../shared/PressableScale'

import { useLanguage } from '@components'
import { OText, OModal, ProfessionalProfile } from '@ui'

export const ProfessionalFilter = (props: ProfessionalFilterParams) => {
  const {
    professionals,
    professionalSelected,
		handleChangeProfessionalSelected,
    handleUpdateProfessionals
  } = props

  const theme: any = useTheme()
  const styles = useMemo(() => professionalChoiceStyles(theme), [theme])
  const [, t] = useLanguage()
  const [open, setOpen] = useState(false)
  const [currentProfessional, setCurrentProfessional] = useState(null)

  const handleOpenProfile = (professional: any) => {
    setCurrentProfessional(professional)
    setOpen(true)
  }

  const handleCloseProfile = () => {
    setCurrentProfessional(null)
    setOpen(false)
  }

  const onUpdateProfessionals = (id: any, changes: any) => {
    const updatedProfessional = professionals.find((professional: any) => professional.id === id)
    handleUpdateProfessionals({ ...updatedProfessional, ...changes })
  }

  return (
    <>
      <ScrollView
        horizontal
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <PressableScale
          onPress={() => handleChangeProfessionalSelected(null)}
        >
          <View style={[styles.item, !professionalSelected && styles.selected]}>
            <OText style={[styles.text, !professionalSelected && styles.selectedText]}>
              {t('ANY_PROFESSIONAL_MEMBER', 'Any professional member')}
            </OText>
          </View>
        </PressableScale>
        {professionals.map((professional: any) => (
          <SingleProfessionalCard
            key={professional.id}
            professional={professional}
            active={professional?.id === professionalSelected?.id}
            handleProfessionalClick={handleOpenProfile}
            handleUpdateProfessionals={onUpdateProfessionals}
          />
        ))}
      </ScrollView>
      <OModal
				open={open}
				onClose={() => handleCloseProfile()}
			>
				<ProfessionalProfile
          professional={currentProfessional}
          onClose={() => handleCloseProfile()}
          handleChangeProfessionalSelected={handleChangeProfessionalSelected}
        />
			</OModal>
    </>
  )
}
