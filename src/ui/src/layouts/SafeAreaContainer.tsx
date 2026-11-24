import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themeColor } from '@/theme/helpers';

export const SafeAreaContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${(props: any) => themeColor(props.theme, 'background')};
`
