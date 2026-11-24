import type { TextStyle } from 'react-native'

/**
 * A one-line text field's own text box. On Android an `EditText` keeps the font's
 * and the view's default vertical padding and starts at the top of its box, so the
 * text sat above the middle of the field (iOS centers it): no padding and a
 * centered text. A text area (`multiline`) keeps its text at the top.
 */
export const singleLineInput: TextStyle = {
  paddingVertical: 0,
  textAlignVertical: 'center',
  includeFontPadding: false,
}
