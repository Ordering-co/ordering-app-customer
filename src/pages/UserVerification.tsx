import React from 'react'
import styled from 'styled-components/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { themeColor } from '@/theme/helpers'
import { UserVerification as UserVerificationController } from '@ui';
interface Props {
  navigation: any;
  route: any;
}

// The screen's box, made once (not on every render); the safe area gives its top on both platforms.
const UserVerificationView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${(p: any) => themeColor(p.theme, 'background')};
`;

const UserVerification = (props: Props) => {

  return (
    <UserVerificationView>
      <UserVerificationController {...props} />
    </UserVerificationView>
  )
}

export default UserVerification
