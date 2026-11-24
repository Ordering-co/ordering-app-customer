import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { singleLineInput } from '../shared/singleLineInput';
import { suggestionLook } from './suggestionLook';
import { FlatList, Keyboard, StyleSheet, TextInput, TouchableOpacity, View, type TextInputInstance } from 'react-native';
import { useTheme } from 'styled-components/native';
import { nativeBoxStyle, nativeTextStyle, themeOpacity } from '@/theme/helpers';
import OText from '../shared/OText';
import {
  consumeLegacyFallback,
  createSessionToken,
  fetchLegacyDetails,
  fetchLegacyPredictions,
} from './googlePlaces';

interface LegacyPlacesInputProps {
  apiKey: string;
  value?: string;
  placeHolderText?: string;
  includedRegionCodes?: string[];
  debounceDelay?: number;
  style?: any;
  onPlaceSelect: (details: any) => void;
  onTextChange?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onError?: (error: any) => void;
}

export const LegacyPlacesInput = forwardRef((props: LegacyPlacesInputProps, ref) => {
  const {
    apiKey,
    value,
    placeHolderText,
    includedRegionCodes,
    debounceDelay = 200,
    style = {},
    onPlaceSelect,
    onTextChange,
    onFocus,
    onBlur,
    onError,
  } = props;

  const theme: any = useTheme();
  const styles = useMemo(() => placesStyles(theme), [theme]);
  const inputRef = useRef<TextInputInstance>(null);
  const debounceTimeout = useRef<any>(null);
  const requestId = useRef(0);
  const sessionToken = useRef(createSessionToken());
  const [inputText, setInputText] = useState(value || '');
  const [predictions, setPredictions] = useState<any[]>([]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      clearTimeout(debounceTimeout.current);
      setInputText('');
      setPredictions([]);
    },
    blur: () => inputRef.current?.blur(),
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    setInputText(value ?? '');
  }, [value]);

  useEffect(() => {
    const shouldFetch = consumeLegacyFallback();
    if (shouldFetch && value) {
      inputRef.current?.focus();
      requestPredictions(value);
    }
    return () => clearTimeout(debounceTimeout.current);
  }, []);

  const requestPredictions = async (text: string) => {
    const currentRequest = ++requestId.current;
    if (!text) {
      setPredictions([]);
      return;
    }
    try {
      const result = await fetchLegacyPredictions({
        text,
        apiKey,
        regionCodes: includedRegionCodes,
        sessionToken: sessionToken.current,
      });
      if (currentRequest === requestId.current) setPredictions(result);
    } catch (error) {
      if (currentRequest === requestId.current) setPredictions([]);
      onError?.(error);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    onTextChange?.(text);
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => requestPredictions(text), debounceDelay);
  };

  const handleSelect = async (prediction: any) => {
    clearTimeout(debounceTimeout.current);
    requestId.current += 1;
    setInputText(prediction.mainText);
    setPredictions([]);
    Keyboard.dismiss();
    try {
      const details = await fetchLegacyDetails({
        placeId: prediction.placeId,
        apiKey,
        sessionToken: sessionToken.current,
      });
      onPlaceSelect(details);
    } catch (error) {
      onError?.(error);
    }
    sessionToken.current = createSessionToken();
  };

  const suggestionsContainerStyle = StyleSheet.flatten(style.suggestionsContainer);
  const suggestionBackground = suggestionsContainerStyle?.backgroundColor || theme.native.components.menu.base.background;

  const renderSuggestion = ({ item }: { item: any }) => {
    const handlePress = () => handleSelect(item);
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={item.description}
        activeOpacity={themeOpacity(theme, 'pressed')}
        style={[styles.suggestionItem, { backgroundColor: suggestionBackground }, style.suggestionItem]}
        onPress={handlePress}
      >
        <OText style={[styles.text, suggestionLook(theme).main, style.suggestionText?.main]}>{item.mainText}</OText>
        {!!item.secondaryText && (
          <OText style={[styles.text, suggestionLook(theme).secondary, style.suggestionText?.secondary]}>{item.secondaryText}</OText>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style.container]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, style.input]}
        value={inputText}
        placeholder={placeHolderText}
        placeholderTextColor={style.placeholder?.color ?? theme.native.components.input.base.placeholder}
        onChangeText={handleTextChange}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityRole="search"
        accessibilityLabel={placeHolderText}
      />
      {predictions.length > 0 && (
        <View style={[styles.suggestionsContainer, style.suggestionsContainer]}>
          <FlatList
            data={predictions}
            renderItem={renderSuggestion}
            keyExtractor={item => item.placeId}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            bounces={false}
            style={style.suggestionsList}
          />
        </View>
      )}
    </View>
  );
});

// Defaults under the caller's styles: an `input` field (size lg) and its suggestions.
const placesStyles = (theme: any) => {
  const input = theme.native.components.input
  return StyleSheet.create({
    container: {},
    input: {
      ...singleLineInput,
      height: input.sizes.lg.height,
      borderRadius: input.base.radius,
      paddingHorizontal: input.base.padding_x,
      ...nativeBoxStyle(input.base),
      ...nativeTextStyle(input.base.text),
      color: input.base.text_color,
    },
    // The one look of the address suggestions (`suggestionLook`: a menu); the list scrolls past 200.
    suggestionsContainer: {
      ...suggestionLook(theme).list,
      maxHeight: 200,
    },
    suggestionItem: suggestionLook(theme).item,
    text: {
      textAlign: 'left',
    },
  })
};
