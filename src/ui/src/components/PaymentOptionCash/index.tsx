import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useUtils, useLanguage } from '@components';
import { useTheme } from 'styled-components/native';
import { useForm, Controller } from 'react-hook-form';

import { PCContainer, PCForm, PCWrapper } from './styles';
import { OInput, OText } from '../shared';
import { FilterChip } from '../BusinessListingSearch/FilterChip';
import { cashSuggestions } from '../../utils/cashSuggestions';
import { themePart, themeSpace } from '@/theme/helpers';

export const PaymentOptionCash = (props: any) => {
	const {
		defaultValue = '',
		orderTotal,
		onChangeData,
		setErrorCash
	} = props;

	const theme: any = useTheme();

	// The input keeps the theme's look; only its place in the form is set here.
	const styles = useMemo(() => StyleSheet.create({
		inputsStyle: {
			marginTop: themeSpace(theme, 'sm'),
			width: '100%'
		},
		suggestionsRow: {
			flexGrow: 0
		},
		suggestions: {
			gap: themeSpace(theme, 'sm'),
			paddingTop: themeSpace(theme, 'sm')
		}
	}), [theme]);
	const showSuggestions = themePart(theme, 'checkout', 'base.cash_suggestions');
	const suggestions = useMemo(() => orderTotal > 0 ? [orderTotal, ...cashSuggestions(orderTotal)] : [], [orderTotal]);
	const [picked, setPicked] = useState(0);

	const [, t] = useLanguage();
	const [{ parsePrice }] = useUtils();
	const { control } = useForm();

	const [value, setvalue] = useState(defaultValue?.toString() || '');
	const timeout = useRef<any>(null);

	const onChangeCash = (value: any) => {
		clearTimeout(timeout.current)
		timeout.current = setTimeout(() => {
			let cash: any = parseFloat(value)
			cash = isNaN(cash) ? '' : cash
			setvalue(cash.toString())
			if (cash >= orderTotal || !cash) {
				onChangeData && onChangeData(!cash ? { cash: null } : { cash })
			}
		}, 750)
	}

	const onPickCash = (amount: number) => {
		clearTimeout(timeout.current)
		setvalue(amount.toString())
		setPicked(picked + 1)
		onChangeData && onChangeData({ cash: amount })
	}

	useEffect(() => {
		if (value && parseFloat(value) < orderTotal) {
			setErrorCash && setErrorCash(true)
		} else {
			setErrorCash && setErrorCash(false)
		}
	}, [value, orderTotal])

	return (
		<PCContainer>
			<PCForm>
				<PCWrapper>
					<OText preset='body_sm'>
						{t('NOT_EXACT_CASH_AMOUNT', 'Don\'t have exact amount? Let us know with how much will you pay')}
					</OText>
					{showSuggestions && suggestions.length > 0 && (
						<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsRow} contentContainerStyle={styles.suggestions}>
							{suggestions.map((amount: number) => (
								<FilterChip
									key={amount}
									testID={`cash-suggestion-${amount}`}
									size='md'
									text={parsePrice(amount)}
									selected={parseFloat(value) === amount}
									onPress={() => onPickCash(amount)}
								/>
							))}
						</ScrollView>
					)}
					<Controller
						control={control}
						name='cash'
						defaultValue={value}
						render={() => (
							<OInput
								key={`cash-${picked}`}
								name='cash'
								placeholder='0'
								style={styles.inputsStyle}
								value={value}
								onChange={(val: any) => onChangeCash(val?.target.value)}
								type='numeric'
								returnKeyType='done'
							/>
						)}
					/>
				</PCWrapper>
				{!!value && parseFloat(value) < orderTotal && (
					<OText preset='body_lg' weight={700} color='danger_text' align='center' mTop='sm'>
						{`${t('VALUE_GREATER_THAN_TOTAL', 'This value must be greater than order total')}: ${parsePrice(orderTotal)}`}
					</OText>
				)}
			</PCForm>
		</PCContainer>
	)
}

