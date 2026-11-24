import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { PlaceGroupContainer, PlaceSpotContainer } from './styles'
import { Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'
import { useTheme } from 'styled-components/native'
import { PlaceSpotParams } from '../../types'

import { PlaceSpot as PlaceSpotController, useLanguage, useOrder, useToast, ToastType } from '@components'
import {
  OText,
  OInput,
  OButton,
  NotFoundSource
} from '@ui'
import OSelect from '../shared/OSelect'
import { themeSpace } from '@/theme/helpers'

export const PlaceSpotUI = (props: PlaceSpotParams) => {
  const {
    cart,
    orderTypes,
    placesState,
    handleChangePlace,
    spotNumber,
    spotState,
    isCheckout,
    vehicle,
    isInputMode,
    setSpotNumber,
    setVehicle,
    handleChangeSpot,
    setPlaceSpotNumber
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [orderState] = useOrder()
  const [, { showToast }] = useToast();

  const [placeGroupSelected, setPlaceGroupSelected] = useState<any>(null)
  const vehicleInputAllowed = [4, 5]

  const currentOrderType = isCheckout ? orderState?.options?.type : cart?.delivery_type
  const isEatin = currentOrderType === 3
  const isDriveThru = currentOrderType === 5
  const placeholderText = isEatin
    ? t('EATIN_SPOT_NUMBER', 'Table number')
    : isDriveThru
      ? t('DRIVE_THRU_SPOT_NUMBER', 'Drive thru lane')
      : t('CURBSIDE_SPOT_NUMBER', 'Spot number')

  const styles = useMemo(() => {
    return StyleSheet.create({
      optionWrapper: {
        marginBottom: theme.native.components.field.base.gap
      },
      fieldLabel: {
        marginBottom: theme.native.components.field.base.label_gap
      },
      actions: {
        alignItems: 'flex-start'
      },
      submit: {
        marginTop: themeSpace(theme, 'lg')
      }
    })
  }, [theme])

  const vehicleTypeList: any = [
    { key: 'car', text: t('VEHICLE_TYPE_CAR', 'Car') },
    { key: 'truck', text: t('VEHICLE_TYPE_TRUCK', 'Truck') },
    { key: 'suv', text: t('VEHICLE_TYPE_SUV', 'SUV') },
    { key: 'van', text: t('VEHICLE_TYPE_VAN', 'Van') },
    { key: 'motorcycle', text: t('VEHICLE_TYPE_MOTORCYCLE', 'Motorcycle') }
  ]

  const vehicleInputList = [
    { key: 'model', text: t('VEHICLE_MODEL', 'Model') },
    { key: 'car_registration', text: t('VEHICLE_CAR_REGISTRATION', 'Car registration') },
    { key: 'color', text: t('VEHICLE_COLOR', 'Color') }
  ]

  const getPlacesGroups = () => {
    const groups = placesState.placeGroups?.filter((group: any) => group?.enabled && placesState?.places?.find((place: any) => place?.enabled && place?.place_group_id === group?.id))
    return groups.map((group: any) => ({
      value: group?.id,
      label: group?.name,
      group
    }))
  }

  const getPlaces = () => {
    const places = placeGroupSelected && placesState?.places?.filter((place: any) => place?.enabled && place?.place_group_id === placeGroupSelected?.id)
    return places.map((place: any) => ({
      value: place?.id,
      label: place.name,
      place
    }))
  }

  const handlerChangePlace = (place: any) => {
    handleChangePlace(place)
  }

  const onChangeSpot = () => {
    if (orderState.loading) return
    if (!Number.isInteger(Number(spotNumber))) {
      showToast(ToastType.Error, t('VALIDATION_ERROR_INTEGER', 'The _attribute_ must be an integer.').replace('_attribute_', placeholderText))
      return
    }
    if (Number(spotNumber) < 0) {
      showToast(ToastType.Error, t('VALIDATION_MUST_BIGGER_ZERO', '_attribute_ must be bigger than zero').replace('_attribute_', placeholderText))
      return
    }
    const isVehicle = Object.values(vehicle).every(e => e)
    const bodyToSend: any = {}
    spotNumber && (bodyToSend.spot_number = spotNumber)
    isVehicle && (bodyToSend.vehicle = vehicle)

    if (Object.keys(bodyToSend).length) {
      handleChangeSpot({ bodyToSend, isCheckout: !!isCheckout })
    }
  }

  const manageErrorsToShow = (array = []) => {
    let stringError = ''
    const list = Array.isArray(array) ? array : Object.values(array)
    list.map((item: any, i: number) => {
      stringError += (i + 1) === array.length ? `- ${item?.message || item}` : `- ${item?.message || item}\n`
    })
    return stringError;
  }

  useEffect(() => {
    if (!placesState?.loading) {
      const placeGroupOnCart = placesState?.placeGroups.find((group: any) => group?.id === cart?.place?.place_group_id)
      setPlaceGroupSelected(placeGroupOnCart)
    }
  }, [placesState])

  useEffect(() => {
    if (spotState?.error?.length > 0) {
      const errorText = manageErrorsToShow(spotState?.error)
      showToast(ToastType.Error, errorText)
    }
  }, [spotState?.error])

  const onChangePlaceSpot = (value: string) => {
    setSpotNumber(value)
    setPlaceSpotNumber(value)
  }

  return (
    <PlaceSpotContainer>
      {isInputMode ? (
        <PlaceGroupContainer>
          <OText preset='body_lg' weight={500} mBottom='md'>{orderTypes[currentOrderType]}</OText>
          {vehicleInputAllowed.includes(currentOrderType) && (
            <>
              <View style={styles.optionWrapper}>
                <OText preset='body_sm' style={styles.fieldLabel}>{t('VEHICLE_TYPE', 'Vehicle type')}</OText>
                <OSelect
                  testID='vehicle-type-select'
                  title={t('VEHICLE_TYPE', 'Vehicle type')}
                  placeholder={t('SELECT_AN_OPTION', 'Select an option')}
                  options={vehicleTypeList.map((item: any) => ({ value: item.key, label: item.text }))}
                  value={vehicle?.type || undefined}
                  onSelect={(type: any) => setVehicle({ ...vehicle, type: type ?? '' })}
                />
              </View>
              {vehicleInputList.map((input: any) => (
                <View key={input.key}>
                  <OText preset='body_sm' style={styles.fieldLabel}>{input.text}</OText>
                  <OInput
                    placeholder={input.text}
                    value={vehicle[input.key] ?? ''}
                    onChange={(value: string) => setVehicle({ ...vehicle, [input.key]: value })}
                  />
                </View>
              ))}
            </>
          )}
          <OText preset='body_sm' style={styles.fieldLabel}>{placeholderText}</OText>
          <OInput
            value={spotNumber?.toString() ?? ''}
            placeholder={placeholderText}
            type='number-pad'
            onChange={(value: string) => onChangePlaceSpot(value)}
          />
          <View style={styles.actions}>
            <OButton
              onClick={() => onChangeSpot()}
              text={t('UPDATE_SPOT_NUMBER', 'Update')}
              disabled={(!spotNumber && !Object.values(vehicle).every(e => e))}
              style={styles.submit}
            />
          </View>
        </PlaceGroupContainer>
      ) : (
        <>
          {(placesState.error || placesState?.placeGroups?.length === 0) && !placesState?.loading && (
            <NotFoundSource
              content={t('NO_PLACES_THIS_BUSINESS', 'There are not places for this business')}
            />
          )}
          {placesState?.loading && (
            <Placeholder>
              <PlaceGroupContainer>
                <PlaceholderLine width={100} height={25} />
                <PlaceholderLine height={30} />
              </PlaceGroupContainer>
              <View>
                <PlaceholderLine width={120} height={25} />
                <PlaceholderLine height={30} />
              </View>
            </Placeholder>
          )}
          {!(placesState.error || placesState?.placeGroups?.length === 0) && !placesState?.loading && (
            <>
              <PlaceGroupContainer>
                <OText preset='body_lg' mBottom='sm'>{t('PLACE_GROUP', 'Place group')}</OText>
                <OSelect
                  testID='place-group-select'
                  title={t('PLACE_GROUP', 'Place group')}
                  placeholder={t('PLACE_GROUP', 'Place group')}
                  options={getPlacesGroups()}
                  onSelect={(_id: any, option: any) => setPlaceGroupSelected(option.group)}
                  value={placeGroupSelected?.id ?? cart?.place?.place_group_id}
                />
              </PlaceGroupContainer>
              {placeGroupSelected && (
                <View>
                  <OText preset='body_lg' mBottom='sm'>{t('SELECT_YOUR_SPOT', 'Select your spot')}</OText>
                  <OSelect
                    testID='place-spot-select'
                    title={t('SELECT_YOUR_SPOT', 'Select your spot')}
                    onSelect={(_id: any, option: any) => handlerChangePlace(option.place)}
                    placeholder={t('SELECT_YOUR_SPOT', 'Select your spot')}
                    options={getPlaces()}
                    value={cart?.place_id}
                  />
                </View>
              )}
            </>
          )}
        </>
      )}
    </PlaceSpotContainer>
  )
}

export const PlaceSpot = (props: PlaceSpotParams) => {
  const [, t] = useLanguage()

  const placeSpotProps = {
    ...props,
    UIComponent: PlaceSpotUI,
    orderTypes: {
      1: t('DELIVERY', 'Delivery'),
      2: t('PICKUP', 'Pickup'),
      3: t('EAT_IN', 'Eat in'),
      4: t('CURBSIDE', 'Curbside'),
      5: t('DRIVE_THRU', 'Drive thru')
    }
  }

  return <PlaceSpotController {...placeSpotProps} />
}
