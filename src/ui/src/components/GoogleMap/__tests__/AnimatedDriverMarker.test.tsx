import React from 'react'
import { render } from '@testing-library/react-native'
import FastImage from 'react-native-fast-image'

import { AnimatedDriverMarker } from '../AnimatedDriverMarker'

jest.mock('react-native-maps', () => {
  const { View } = require('react-native')
  return { MarkerAnimated: (props: any) => <View {...props} /> }
})

describe('AnimatedDriverMarker', () => {
  it("paints a theme image (`{ uri }`) as well as a photo URL", () => {
    const coordinate = { latitude: 1, longitude: 2 } as any
    const themed = render(<AnimatedDriverMarker coordinate={coordinate} icon={{ uri: 'https://cdn.test/driver.png' }} />)
    expect(themed.UNSAFE_getByType(FastImage).props.source.uri).toBe('https://cdn.test/driver.png')
    const photo = render(<AnimatedDriverMarker coordinate={coordinate} icon='https://cdn.test/photo.png' />)
    expect(photo.UNSAFE_getByType(FastImage).props.source.uri).toBe('https://cdn.test/photo.png')
  })
})
