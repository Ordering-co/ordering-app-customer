import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { ScrollView } from 'react-native-gesture-handler';
import { useForm, Controller } from 'react-hook-form';
import { LoadingOverlay } from '../LoadingOverlay';
import { geocode, initGeocoder } from '../../utils/geocoding';

import { AddressFormParams } from '../../types';
import { AddressMapBoxList } from './AddressMapBoxList';
import { getAddressLocationSubmitAction } from './hasValidAddressLocation';
import { TAG_OPTIONS, TagChip } from '../AddressList/TagOptions';
import { suggestionLook } from './suggestionLook';
import Icon from '../shared/Icon';
import { nativeBoxStyle, nativeTextStyle, themeControlHeight, themeSpace, themeVisible } from '@/theme/helpers';

import {
  AddressFormContainer,
  AutocompleteInput,
  GoogleMapContainer,
  FormInput,
  TagContainer,
} from './styles';

import {
  AddressForm as AddressFormController,
  useLanguage,
  useConfig,
  useSession,
  useOrder,
  useToast,
  ToastType
} from '@components';

import {
  GPSButton,
  OInput,
  OButton,
  OModal,
  GoogleMap,
  OText
} from '@ui';
import GooglePlacesTextInput, { GooglePlacesTextInputStyles } from 'react-native-google-places-textinput';
import { LegacyPlacesInput } from './LegacyPlacesInput';
import {
  PLACES_API_LEGACY,
  PLACES_API_NEW,
  NEW_PLACE_DETAILS_FIELDS,
  getPlacesApiMode,
  setPlacesApiMode,
  switchToLegacyPlacesApi,
  isPlacesApiNotEnabledError,
  newDetailsToLegacy,
  fetchLegacyDetails,
} from './googlePlaces';
import { goHome, returnTo } from '@/navigators/appNavigation'
import { isGoogleMapsAvailable } from '@/utils/nativeKeys'

const inputNames = [
  { name: 'address', code: 'Address' },
  { name: 'internal_number', code: 'Internal number' },
  { name: 'zipcode', code: 'Zipcode' },
  { name: 'address_notes', code: 'Address notes' },
];

const AddressFormUI = (props: AddressFormParams) => {
  const {
    navigation,
    updateChanges,
    address,
    formState,
    isEditing,
    handleChangeInput,
    addressState,
    addressesList,
    onSaveAddress,
    saveAddress,
    isGuestUser,
    isRequiredField,
    showField,
    isFromProductsList,
    hasAddressDefault,
    afterSignup,
    businessSlug,
    isFromCheckout,
    isGoBack,
    onNavigationRedirect,
    getSuggestedResult,
    mapBoxSuggests,
    retrieveSuggestResult
  } = props;

  const theme: any = useTheme();

  const [autoCompleteInputFocused, setAutoCompleteInputFocused] = useState(false)

  const isEmptyField = (key: any, str: any) => isRequiredField && isRequiredField(key) && (!str || str.trim().length === 0)

  const hasAddressText = !!address?.address || !!formState.changes?.address || !!addressState.address.address
  // `input` (size lg) for the fields; `field` for the label and the gap between fields.
  const styles = useMemo(() => {
    const input = theme.native.components.input
    const textAreaHeight = themeControlHeight(theme, 'lg') * 2
    return StyleSheet.create({
      inputsStyle: {
        height: input.sizes.lg.height,
        maxHeight: input.sizes.lg.height,
        minHeight: input.sizes.lg.height,
        flex: 1,
      },
      // Room for two lines of a large input.
      textAreaStyles: {
        height: textAreaHeight,
        maxHeight: textAreaHeight,
        minHeight: textAreaHeight,
        textAlignVertical: 'top',
        alignItems: 'flex-start',
      },
      pinIcon: {
        position: 'absolute',
        top: themeSpace(theme, 'md'),
        zIndex: 1002,
        end: themeSpace(theme, 'md'),
      },
      // The clear button of the focused field sits where the pin was.
      pinIconShifted: { end: themeSpace(theme, 'xl') },
      fieldGap: { marginRight: themeSpace(theme, 'lg') },
      map: {
        height: 189,
        borderRadius: theme.native.components.card.base.radius,
        overflow: 'hidden',
        marginBottom: themeSpace(theme, 'lg'),
      },
      tagLabel: {
        ...nativeTextStyle(theme.native.components.field.base.label),
        color: theme.native.components.field.base.label_color,
        marginBottom: theme.native.components.field.base.label_gap,
      },
    })
  }, [theme])

  const [, t] = useLanguage();
  const [{ auth }] = useSession();
  const [, { showToast }] = useToast();
  const [configState] = useConfig();
  const [orderState] = useOrder();
  const { handleSubmit, control, setValue, formState: { errors } } = useForm();
  const [autoCompleteAddress, setAutoCompleteAddress] = useState(false)

  const [toggleMap, setToggleMap] = useState(false);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    content: Array<string>;
    key?: string | null;
  }>({ open: false, content: [], key: null });
  const [addressTag, setAddressTag] = useState(addressState?.address?.tag);
  const [firstLocationNoEdit, setFirstLocationNoEdit] = useState({
    value: { lat: null, lng: null },
    address: null,
  });
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [locationChange, setLocationChange] = useState(
    isEditing
      ? addressState?.address?.location
      : formState.changes?.location ?? null,
  );
  const [saveMapLocation, setSaveMapLocation] = useState(false);
  const [isSignUpEffect, setIsSignUpEffect] = useState(false);
  const [inputFocused, setInputFocused] = useState(false)
  const [mapBoxAddressValue, setMapBoxAddressValue] = useState(address?.address ||
    formState.changes?.address ||
    addressState.address.address ||
    '')
  const [googleAddressValue, setGoogleAddressValue] = useState(address?.address ||
    formState.changes?.address ||
    addressState.address.address ||
    '')
  const [placesApiMode, setPlacesApiModeState] = useState(getPlacesApiMode())

  const googleInput: any = useRef(null);
  const suggestionsErrorShown = useRef(false);
  const internalNumberRef: any = useRef(null);
  const zipCodeRef: any = useRef(null);
  const addressNotesRef: any = useRef(null);

  const googleMapsApiKey = configState?.configs?.google_maps_api_key?.value;
  const isLocationRequired =
    configState.configs?.google_autocomplete_selection_required?.value ===
    '1' ||
    configState.configs?.google_autocomplete_selection_required?.value ===
    'true';
  const maxLimitLocation =
    configState?.configs?.meters_to_change_address?.value;
  const countryCode = configState?.configs?.country_autocomplete?.value
  const isHideMap = !themeVisible(theme, 'address.map')
  const isHideIcons = !themeVisible(theme, 'address.icons')
  const useAlternativeMap = configState?.configs?.use_alternative_to_google_maps?.value === '1'
  // The native map needs the app's own Google Maps key (src/utils/nativeKeys.ts). Only the map:
  // the autocomplete and the GPS button are HTTP calls with the server's key (`googleMapsApiKey`).
  const showMap = !useAlternativeMap && !isHideMap && isGoogleMapsAvailable()
  const continueAsGuest = () => businessSlug
    ? returnTo(navigation, 'Business', { isGuestUser: true })
    : goHome(navigation, { screen: 'Home', params: { isGuestUser: true } });
  const leaveAfterUnauthSave = () => {
    if (isGoBack) {
      props?.goToBack?.();
      return;
    }
    !isFromProductsList
      ? returnTo(navigation, 'Business')
      : navigation?.canGoBack() && navigation.goBack();
  };
  const unaddressedTypes = configState?.configs?.unaddressed_order_types_allowed?.value.split('|').map((value: any) => Number(value)) || []
  const isAllowUnaddressOrderType = unaddressedTypes.includes(orderState?.options?.type)
  const addressLength = address?.address?.length ||
    formState.changes?.address?.length ||
    addressState.address.address?.length ||
    0
  const getAddressFormatted = (address: any) => {
    const data: any = { address: null, error: null };
    geocode(address)
      .then((json) => {
        if (json.results && json.results?.length > 0) {
          let postalCode = null;
          for (const component of json.results?.[0].address_components) {
            const addressType = component.types?.[0];
            if (addressType === 'postal_code') {
              postalCode = component.short_name;
              break;
            }
          }
          data.address = {
            address,
            location: json.results[0].geometry.location,
            map_data: {
              library: 'google',
              place_id: json.results?.[0].place_id,
            },
          };
          if (postalCode) {
            data.address.zipcode = postalCode;
          }

          const arrayList = isEditing
            ? addressesList?.addresses?.filter(
              (address: any) => address.id !== addressState?.address?.id,
            ) || []
            : addressesList || [];
          const addressToCompare = isEditing
            ? { ...addressState.address, ...data.address, ...formState.changes }
            : { ...data.address, ...formState?.changes };

          const isAddressAlreadyExist =
            arrayList
              .map((address: any) => checkAddress(address, addressToCompare))
              .some((value: any) => value) ?? false;

          if (!isAddressAlreadyExist) {
            saveAddress(data.address);
            if (isGuestUser) {
              continueAsGuest();
              return;
            }
            if (!isGuestUser && !auth) {
              leaveAfterUnauthSave();
            }
            return;
          }

          setAlertState({
            open: true,
            content: [t('ADDRESS_ALREADY_EXIST', 'The address already exists')],
          });
        } else {
          setAlertState({
            open: true,
            content: [t('ERROR_NOT_FOUND_ADDRESS', 'Error, address not found')],
          });
        }
      })
      .catch((error) => {
        setAlertState({
          open: true,
          content: [error?.message || error?.toString()],
        });
      });
  };

  const handleChangeInputAddress = (text: string) => {
    getSuggestedResult(text)
    handleChangeInput({
      target: { name: 'address', value: text },
    });
    setValue('address', text);
    setAutoCompleteAddress(true)
    setMapBoxAddressValue(text)
  }

  const onSubmit = () => {
    if (
      !auth &&
      ((formState?.changes?.address === '' &&
        addressState?.address?.address) || (!useAlternativeMap && !googleAddressValue))
    ) {
      setAlertState({
        open: true,
        content: [
          t(
            'VALIDATION_ERROR_ADDRESS_REQUIRED',
            'The field Address is required',
          ),
        ],
      });
      return;
    }
    const locationAction = getAddressLocationSubmitAction({
      address: formState?.changes?.address,
      location: formState?.changes?.location,
      isLocationRequired,
      useAlternativeMap,
    });
    if (locationAction === 'requireLocation') {
      setAlertState({
        open: true,
        content: [
          t(
            'ADDRESS_REQUIRE_LOCATION',
            'The address needs a location, please select one of the suggested',
          ),
        ],
      });
      return;
    }
    if (locationAction === 'geocode') {
      getAddressFormatted(formState?.changes?.address);
      return;
    }

    const arrayList = isEditing
      ? addressesList?.addresses?.filter(
        (address: any) => address.id !== addressState?.address?.id,
      ) || []
      : addressesList || [];
    const addressToCompare = isEditing
      ? { ...addressState.address, ...formState.changes }
      : formState?.changes;

    const isAddressAlreadyExist =
      arrayList
        .map((address: any) => checkAddress(address, addressToCompare))
        .some((value: any) => value) ?? false;

    if (!isAddressAlreadyExist) {
      saveAddress();
      if (isGuestUser) {
        continueAsGuest();
      }
      if (!isGuestUser && !auth && !afterSignup) {
        leaveAfterUnauthSave();
      }
      return;
    }

    setAlertState({
      open: true,
      content: [t('ADDRESS_ALREADY_EXIST', 'The address already exists')],
    });
  };

  /**
   * Returns true when the user made no changes
   * @param {object} address
   */
  const checkAddress = (address: any, addressToCompare: any) => {
    const props = [
      'address',
      'address_notes',
      'zipcode',
      'location',
      'internal_number',
    ];
    const values: any = [];
    props.forEach((prop) => {
      if (addressToCompare[prop]) {
        if (prop === 'location') {
          values.push(
            address[prop]?.lat === addressToCompare[prop]?.lat &&
            address[prop]?.lng === addressToCompare[prop]?.lng,
          );
        } else {
          values.push(address[prop] === addressToCompare[prop]);
        }
      } else {
        values.push(!address[prop]);
      }
    });
    return values.every((value: any) => value);
  };

  const handleChangeAddress = (data: any, details: any) => {
    const addressObj: any = {}
    if (details?.address_components) {
      details.address_components.map((component: any) => {
        const addressType = component.types[0]
        if (addressType === 'postal_code') {
          addressObj.zipcode = component.short_name
        }
        if (addressType === 'street_number') {
          addressObj.street_number = component.long_name
        }
        if (addressType === 'neighborhood') {
          addressObj.neighborhood = component.long_name
        }
        if (addressType === 'route') {
          addressObj.route = component.short_name
        }
        if (addressType === 'locality') {
          addressObj.locality = component.long_name
        }
        if (component.types?.includes('sublocality')) {
          addressObj.sublocality = component.long_name
        }
        if (addressType === 'country') {
          addressObj.country = component.long_name
          addressObj.country_code = component.short_name
        }
        if (addressType === 'administrative_area_level_1') {
          addressObj.state = component.long_name
        }
        if (addressType === 'administrative_area_level_2') {
          addressObj.city = component.long_name
        }
      })
    }
    const addressSelected = {
      address: data?.description || data?.address,
      location: details?.geometry?.location,
      utc_offset: details?.utc_offset || null,
      map_data: { library: 'google', place_id: data.place_id },
      zipcode: data?.zipcode || null,
      ...addressObj
    };
    updateChanges(addressSelected);
  };

  const handleSelectGoogleDetails = (details: any) => {
    const data = {
      description: details?.formatted_address,
      address: details?.formatted_address,
      place_id: details?.place_id
    }
    handleChangeAddress(data, details)
    setAutoCompleteAddress(true)
  }

  const handleGooglePlaceSelect = async (place: any) => {
    setPlacesApiMode(PLACES_API_NEW)
    try {
      const details = newDetailsToLegacy(place?.details) ??
        await fetchLegacyDetails({ placeId: place?.placeId, apiKey: googleMapsApiKey })
      handleSelectGoogleDetails(details)
    } catch (error) {
      console.log('onFail', error)
    }
  }

  /**
   * Google's suggestions failed for good (the legacy API is denied too, no network…): the form
   * says so once, in its own words and not Google's. The typed address is still saved through
   * the geocoder when the form is sent.
   */
  const handleSuggestionsUnavailable = () => {
    if (suggestionsErrorShown.current) return
    suggestionsErrorShown.current = true
    setAlertState({
      open: true,
      content: [t('ADDRESS_SUGGESTIONS_UNAVAILABLE', 'Address suggestions are not available right now. Type your full address to continue.')],
    })
  }

  /**
   * An error of Places API (New). While neither API has answered in this session, a key that
   * cannot use it sends the form to the legacy API; the requests still on their way when that
   * happens are not news.
   */
  const handleGooglePlacesError = (error: any) => {
    if (getPlacesApiMode() === PLACES_API_LEGACY) return
    if (getPlacesApiMode() === null && isPlacesApiNotEnabledError(error)) {
      switchToLegacyPlacesApi()
      setPlacesApiModeState(PLACES_API_LEGACY)
      return
    }
    handleSuggestionsUnavailable()
  }

  const handleGoogleTextChange = (text: string) => {
    if (!isFirstTime) {
      handleChangeInput({
        target: { name: 'address', value: text },
      });
      setValue('address', text);
      setGoogleAddressValue(text)
      setAutoCompleteAddress(true)
    }
    setIsFirstTime(false);
  }

  // The places field paints like `OInput` (size lg); its suggestions float like a card.
  const googlePlacesInputStyle: GooglePlacesTextInputStyles = useMemo(() => {
    const input = theme.native.components.input
    return {
      // The suggestions: the one look of every provider (`suggestionLook`: a menu).
      suggestionsContainer: suggestionLook(theme).list,
      suggestionItem: {},
      container: {
        zIndex: 100,
        marginBottom: theme.native.components.field.base.gap
      },
      input: {
        ...nativeBoxStyle(input.base),
        ...(autoCompleteInputFocused ? nativeBoxStyle(input.variants.default.states.focus) : {}),
        borderRadius: input.base.radius,
        flexGrow: 1,
        ...nativeTextStyle(input.base.text),
        color: input.base.text_color,
        paddingLeft: input.base.padding_x,
        paddingRight: input.base.padding_x + input.base.icon_size + input.base.icon_gap,
        paddingVertical: themeSpace(theme, 'sm'),
        minHeight: input.sizes.lg.height,
        height: 'auto',
      },
    }
  }, [theme, autoCompleteInputFocused])

  const handleChangeAddressMapbox = (address: any) => {
    updateChanges(address);
  };

  const handleAddressTag = (tag: string) => {
    setAddressTag(tag);
    handleChangeInput({
      target: {
        name: 'tag',
        value: tag,
      },
    });
  };

  const handleToggleMap = () => {
    setToggleMap(!toggleMap);
  };

  const showFieldWithTheme = (name: 'internal_number' | 'zipcode' | 'address_notes') =>
    themeVisible(theme, name === 'address_notes' ? 'address.notes' : `address.${name}`)

  useEffect(() => {
    if (
      // Opened from the address list, the page goes back to it on save (`onSaveAddress`).
      orderState.loading &&
      !onSaveAddress &&
      orderState?.options?.address &&
      auth &&
      !afterSignup
    ) {
      (isFromCheckout || isGoBack) && navigation?.canGoBack()
        ? props?.goToBack()
        : !isFromProductsList
          ? goHome(navigation)
          : returnTo(navigation, 'Business');
    }
  }, [orderState?.options?.address]);

  useEffect(() => {
    if (alertState.open && alertState?.key !== 'ERROR_MAX_LIMIT_LOCATION') {
      alertState.content && showToast(ToastType.Error, alertState.content);
    }
  }, [alertState.content]);

  useEffect(() => {
    if (!auth) {
      inputNames.forEach((field) =>
        setValue(
          field.name,
          formState?.changes[field.name] ||
          (orderState?.options?.address &&
            orderState?.options?.address[field.name]) ||
          '',
        ),
      );
      return;
    }

    if (!formState.loading && formState.result?.error) {
      setAlertState({
        open: true,
        content: formState.result?.result || [t('ERROR', 'Error')],
      });
    }

    setValue(
      'address',
      formState?.changes?.address ?? addressState.address?.address ?? '',
    );
    if (!isEditing) {
      formState?.changes?.address &&
        setLocationChange(formState?.changes?.location);
      if (
        formState?.changes?.address &&
        formState?.changes?.address !== firstLocationNoEdit?.address &&
        formState?.changes?.location &&
        formState?.changes?.location?.lat !== firstLocationNoEdit.value?.lat &&
        formState?.changes?.location?.lng !== firstLocationNoEdit.value?.lng
      ) {
        setFirstLocationNoEdit({
          value: formState?.changes?.location,
          address: formState?.changes?.address,
        });
      }
    }

    if (isEditing) {
      if (formState?.changes?.location) {
        const prevLocation = {
          lat: locationChange?.lat?.toFixed(5),
          lng: locationChange?.lng?.toFixed(5),
        };
        const newLocation = {
          lat: formState?.changes?.location?.lat?.toFixed(5),
          lng: formState?.changes?.location?.lng?.toFixed(5),
        };
        if (
          prevLocation?.lat !== newLocation?.lat &&
          prevLocation?.lng !== newLocation?.lng
        ) {
          setLocationChange(formState?.changes?.location);
        }
      }
    }
  }, [formState]);

  useEffect(() => {
    if (formState?.result && !formState?.loading) {
      if (formState?.error) {
        showToast(ToastType.Error, formState.error[0]);
      } else {
        showToast(
          ToastType.Success,
          t('UPDATE_SUCCESSFULLY', 'Update successfully'),
        );
      }
    }
  }, [formState.result]);

  useEffect(() => {
    const errorMessages = Object.values(errors)
      .map((item: any) => `- ${item.message}`)
      .join('\n');
    if (errorMessages) {
      showToast(ToastType.Error, errorMessages);
    }
  }, [errors]);

  useEffect(() => {
    if (!useAlternativeMap) {
      setGoogleAddressValue(
        address?.address ||
        formState.changes?.address ||
        addressState.address.address ||
        '',
      );
    }
  }, []);

  useEffect(() => {
    initGeocoder(googleMapsApiKey);
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!orderState.loading && auth && !hasAddressDefault && isSignUpEffect) {
      goHome(navigation);
    }
    setIsSignUpEffect(true);
  }, [orderState.loading]);

  return (
    <ScrollView keyboardShouldPersistTaps='always'>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <AddressFormContainer style={{ overflow: 'scroll' }}>
          <View>
            <FormInput>
              <AutocompleteInput>
                <Controller
                  control={control}
                  name="address"
                  defaultValue={
                    address?.address ||
                    formState.changes?.address ||
                    addressState.address.address ||
                    ''
                  }
                  rules={{
                    required:
                      isRequiredField && isRequiredField('address')
                        ? t(
                          `VALIDATION_ERROR_ADDRESS_REQUIRED`,
                          `The field Address is required`,
                        )
                        : null,
                  }}
                  render={() => useAlternativeMap ? (
                    <View>
                      <OInput
                        placeholder={t('ADD_ADDRESS', 'Add a address')}
                        onChange={(text: string) => {
                          handleChangeInputAddress(text)
                        }}
                        onPress={() => setInputFocused(true)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        value={
                          mapBoxAddressValue
                        }
                        isFocusHighlight
                        style={styles.inputsStyle}
                        forwardRef={googleInput}
                        returnKeyType="next"
                        onSubmitEditing={() => zipCodeRef?.current?.focus?.()}
                        blurOnSubmit={false}
                      />
                      {inputFocused && addressLength > 0 && (
                        <AddressMapBoxList
                          mapBoxSuggests={mapBoxSuggests}
                          retrieveSuggestResult={retrieveSuggestResult}
                          handleChangeAddressMapbox={handleChangeAddressMapbox}
                          onBlurInput={() => setInputFocused(false)}
                          handleChangeInputAddress={handleChangeInputAddress}
                        />
                      )}
                    </View>
                  ) : placesApiMode === PLACES_API_LEGACY ? (
                    <LegacyPlacesInput
                      placeHolderText={t('ADD_ADDRESS', 'Add a address')}
                      apiKey={googleMapsApiKey}
                      value={googleAddressValue}
                      includedRegionCodes={countryCode && countryCode !== '*' ? [countryCode] : undefined}
                      ref={googleInput}
                      onPlaceSelect={handleSelectGoogleDetails}
                      onFocus={() => setAutoCompleteAddress(true)}
                      onBlur={() => setAutoCompleteAddress(false)}
                      onError={handleSuggestionsUnavailable}
                      onTextChange={handleGoogleTextChange}
                      style={googlePlacesInputStyle}
                    />
                  ) : (
                    <GooglePlacesTextInput
                      placeHolderText={t('ADD_ADDRESS', 'Add a address')}
                      apiKey={googleMapsApiKey}
                      value={googleAddressValue}
                      fetchDetails
                      detailsFields={NEW_PLACE_DETAILS_FIELDS}
                      showClearButton={false}
                      showLoadingIndicator={false}
                      includedRegionCodes={countryCode && countryCode !== '*' ? [countryCode] : undefined}
                      ref={googleInput}
                      onPlaceSelect={handleGooglePlaceSelect}
                      onFocus={() => setAutoCompleteAddress(true)}
                      onBlur={() => setAutoCompleteAddress(false)}
                      onError={handleGooglePlacesError}
                      onTextChange={handleGoogleTextChange}
                      style={googlePlacesInputStyle}
                    />
                  )}
                />
                {(
                  ((!isEditing && !isGuestUser) ||
                    (isEditing && !isGuestUser)) ||
                  (isGuestUser)) &&
                  !useAlternativeMap &&
                  themeVisible(theme, 'address.gps_button') &&
                  (
                    <View style={[styles.pinIcon, autoCompleteInputFocused && hasAddressText && styles.pinIconShifted]}>
                      <GPSButton
                        apiKey={googleMapsApiKey}
                        handleGPS={(data: any, detail: any) => {
                          handleChangeAddress(data, detail);
                          setValue('address', data.address);
                          if (!useAlternativeMap && googleInput?.current) {
                            setGoogleAddressValue(data.address);
                            googleInput?.current?.blur();
                          }
                        }}
                        IconButton={<Icon name='locate' size='sm' color='primary' />}
                        isIntGeoCoder
                        setAlertState={setAlertState}
                      />
                    </View>
                  )}
              </AutocompleteInput>
              {showMap && (locationChange || formState.changes?.location) && (
                <View style={styles.map}>
                  <GoogleMapContainer>
                    <GoogleMap
                      location={locationChange || formState.changes?.location}
                      handleChangeAddressMap={handleChangeAddress}
                      maxLimitLocation={maxLimitLocation}
                      saveLocation={saveMapLocation}
                      setSaveLocation={setSaveMapLocation}
                      handleToggleMap={handleToggleMap}
                      isIntGeoCoder
                      setAutoCompleteAddress={setAutoCompleteAddress}
                      autoCompleteAddress={autoCompleteAddress}
                    />
                  </GoogleMapContainer>
                </View>
              )}

              <View style={{ flexDirection: 'row' }}>
                {showField?.('internal_number') && ((isRequiredField && isRequiredField('internal_number')) || showFieldWithTheme('internal_number')) && (
                  <Controller
                    control={control}
                    name="internal_number"
                    rules={{
                      required:
                        isRequiredField && isRequiredField('internal_number')
                          ? t(
                            `VALIDATION_ERROR_INTERNAL_NUMBER_REQUIRED`,
                            `The field internal number is required`,
                          )
                          : null,
                    }}
                    defaultValue={
                      address?.internal_number ||
                      formState.changes?.internal_number ||
                      addressState?.address?.internal_number ||
                      ''
                    }
                    render={() => (
                      <OInput
                        name="internal_number"
                        placeholder={t('INTERNAL_NUMBER', 'Internal number')}
                        onChange={(data: any) => {
                          handleChangeInput(data);
                          setValue('internal_number', isEmptyField('internal_number', data?.target?.value) ? null : data);
                        }}
                        value={
                          address?.internal_number ||
                          formState.changes?.internal_number ||
                          addressState?.address?.internal_number ||
                          ''
                        }
                        isFocusHighlight
                        style={[
                          styles.inputsStyle,
                          { width: '50%' },
                          showField?.('internal_number') && showField?.('zipcode') ? styles.fieldGap : null
                        ] as any}
                        forwardRef={internalNumberRef}
                        returnKeyType="next"
                        onSubmitEditing={() => zipCodeRef?.current?.focus?.()}
                        blurOnSubmit={false}
                      />
                    )}
                  />
                )}

                {showField?.('zipcode') && ((isRequiredField && isRequiredField('zipcode')) || showFieldWithTheme('zipcode')) && (
                  <Controller
                    control={control}
                    name="zipcode"
                    rules={{
                      required:
                        isRequiredField && isRequiredField('zipcode') && !(address?.zipcode || formState.changes?.zipcode || addressState.address.zipcode)
                          ? t(
                            `VALIDATION_ERROR_ZIP_CODE_REQUIRED`,
                            `The field Zip Code is required`,
                          )
                          : null,
                    }}
                    defaultValue={
                      address?.zipcode ||
                      formState.changes?.zipcode ||
                      addressState.address.zipcode ||
                      ''
                    }
                    render={() => (
                      <OInput
                        name="zipcode"
                        placeholder={t('ZIP_CODE', 'Zip code')}
                        onChange={(data: any) => {
                          handleChangeInput(data);
                          setValue('zipcode', isEmptyField('zipcode', data?.target?.value) ? null : data);
                        }}
                        value={
                          address?.zipcode ||
                          formState.changes?.zipcode ||
                          addressState.address.zipcode ||
                          ''
                        }
                        isFocusHighlight
                        style={[styles.inputsStyle, { width: '50%' }] as any}
                        forwardRef={zipCodeRef}
                        returnKeyType="next"
                        onSubmitEditing={() => addressNotesRef?.current?.focus?.()}
                        blurOnSubmit={false}
                      />
                    )}
                  />
                )}
              </View>

              {showField?.('address_notes') && ((isRequiredField && isRequiredField('address_notes')) || showFieldWithTheme('address_notes')) && (
                <Controller
                  control={control}
                  name="address_notes"
                  rules={{
                    required:
                      isRequiredField && isRequiredField('address_notes')
                        ? t(
                          `VALIDATION_ERROR_ADDRESS_NOTES_REQUIRED`,
                          `The field address notes is required`,
                        )
                        : null,
                  }}
                  defaultValue={
                    address?.address_notes ||
                    formState.changes?.address_notes ||
                    addressState.address.address_notes ||
                    ''
                  }
                  render={() => (
                    <OInput
                      name="address_notes"
                      placeholder={t('ADDRESS_NOTES', 'Address notes')}
                      onChange={(text: any) => {
                        handleChangeInput(text);
                        setValue('address_notes', text);
                      }}
                      value={
                        address?.address_notes ||
                        formState.changes?.address_notes ||
                        addressState.address.address_notes ||
                        ''
                      }
                      multiline
                      isFocusHighlight
                      style={styles.textAreaStyles}
                      returnKeyType="done"
                      forwardRef={addressNotesRef}
                      blurOnSubmit
                    />
                  )}
                />
              )}
            </FormInput>
            {!isHideIcons && (
              <>
                <OText style={styles.tagLabel}>
                  {t('ADDRESS_LABEL', 'Address label')}
                </OText>
                <TagContainer>
                  {TAG_OPTIONS.map((tag) => (
                    <TagChip
                      key={tag.key}
                      icon={tag.icon}
                      selected={addressTag === tag.key}
                      text={t(`ADDRESS_TAG_${tag.key.toUpperCase()}`, tag.key)}
                      onPress={() => handleAddressTag(tag.key)}
                    />
                  ))}
                </TagContainer>
              </>
            )}
          </View>

          <OButton
            text={
              formState.loading
                ? t('LOADING', 'Loading')
                : Object.keys(formState?.changes).length > 0
                  ? isEditing || (!auth && orderState.options?.address?.address)
                    ? t('UPDATE', 'Update')
                    : t('CONTINUE', 'Continue')
                  : t('CANCEL', 'Cancel')
            }
            onClick={
              Object.keys(formState?.changes).length > 0
                ? handleSubmit(onSubmit)
                : () => navigation?.canGoBack() && navigation.goBack()
            }
            disabled={formState.loading}
          />
          <OModal
            open={toggleMap}
            onClose={() => handleToggleMap()}
          >
            {(locationChange || formState.changes?.location) && (
              <GoogleMapContainer>
                <GoogleMap
                  location={locationChange || formState.changes?.location}
                  handleChangeAddressMap={handleChangeAddress}
                  maxLimitLocation={maxLimitLocation}
                  saveLocation={saveMapLocation}
                  setSaveLocation={setSaveMapLocation}
                  handleToggleMap={handleToggleMap}
                  isIntGeoCoder
                />
              </GoogleMapContainer>
            )}
            <OButton
              text={t('SAVE', 'Save')}
              onClick={() => setSaveMapLocation(true)}
            />
          </OModal>
          <LoadingOverlay visible={saveMapLocation} />
        </AddressFormContainer>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
};

export const AddressForm = (props: AddressFormParams) => {
  const addressFormProps = {
    ...props,
    UIComponent: AddressFormUI
  };
  return <AddressFormController {...addressFormProps} />;
};
