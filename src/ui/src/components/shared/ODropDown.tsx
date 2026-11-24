import React from 'react'
import OSelect from './OSelect'

/**
 * The old select API over `OSelect` (the one select of the app: a sheet).
 * `secondary`, `bgcolor`, `textcolor`, `dropViewMaxHeight`, `isModal` and
 * `gestureScroll` belonged to the old in-place list and are ignored.
 */
interface Props {
	options?: any[],
	defaultValue?: any,
	placeholder?: string,
	title?: string,
	onSelect?: (value: any) => void,
	style?: any,
	searchable?: boolean,
	disabled?: boolean,
	secondary?: boolean,
	dropViewMaxHeight?: any,
	isModal?: any,
	gestureScroll?: boolean,
	bgcolor?: string,
	textcolor?: string,
}

const ODropDown = ({ options, defaultValue, placeholder, title, onSelect, style, searchable, disabled }: Props) => (
	<OSelect
		options={(options ?? []).map((option: any) => ({ ...option, value: option.value ?? option.name }))}
		value={defaultValue}
		placeholder={placeholder}
		title={title ?? placeholder}
		searchable={searchable}
		disabled={disabled}
		style={style}
		onSelect={(value) => onSelect && onSelect(value)}
	/>
)

export default ODropDown
