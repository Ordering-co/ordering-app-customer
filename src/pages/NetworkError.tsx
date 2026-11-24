import React from 'react';
import { SafeAreaContainer, NetworkError as NetworkErrorScreen } from '@ui'

// The safe area gives the top inset on both platforms (no Android literal).
const NetworkError = () => {
  return (
    <SafeAreaContainer>
      <NetworkErrorScreen />
    </SafeAreaContainer>
  );
};

export default NetworkError;
