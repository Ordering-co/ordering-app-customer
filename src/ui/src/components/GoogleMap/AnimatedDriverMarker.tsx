import React from 'react'
import { MarkerAnimated, AnimatedRegion } from 'react-native-maps'
import FastImage from 'react-native-fast-image'

// react-native-maps types MarkerAnimated with React Native 0.88's AnimatedProps,
// which leave out `children`; the marker does draw them (the driver's photo).
const DriverMarker = MarkerAnimated as unknown as React.ComponentType<any>

interface AnimatedDriverMarkerProps {
  coordinate: AnimatedRegion
  /** A photo URL, a bundled asset, or a theme image (`{ uri }`). */
  icon?: string | number | { uri?: string }
  title?: string
  zIndex?: number
  onImageLoad?: () => void
  tracksViewChanges?: boolean
}

export const AnimatedDriverMarker = ({
  coordinate, icon, title, zIndex = 99, onImageLoad, tracksViewChanges = false
}: AnimatedDriverMarkerProps) => {
  return (
    <DriverMarker
      zIndex={zIndex}
      coordinate={coordinate as any}
      title={title}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      {icon != null && (
        <FastImage
          source={typeof icon === 'number' ? icon : { uri: typeof icon === 'string' ? icon : icon?.uri, priority: FastImage.priority.high }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
          onLoadEnd={onImageLoad}
        />
      )}
    </DriverMarker>
  )
}
