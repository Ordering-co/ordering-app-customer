import React from 'react';
import {
  StyleSheet,
  DeviceEventEmitter
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { _retrieveStoreData, _setStoreData, ProjectForm as ProjectFormController } from '@ui';
import { openScreen } from '@/navigators/appNavigation'

export const ProjectForm = (props: any) => {
  const projectFormProps = {
    ...props,
    navigation: props.navigation,
    EventEmitter: DeviceEventEmitter,
    setStoreData: _setStoreData,
    onNavigationRedirect: (page: string, params: any) => {
      if (!page) {
        return;
      }
      openScreen(props.navigation, page, params);
    },
  };

  // The safe area gives the top inset on both platforms (no Android literal).
  return (
    <SafeAreaView style={styles.wrapper}>
      <ProjectFormController {...projectFormProps} />
    </SafeAreaView>
  );
};

// Layout only (no theme values): safe at module level.
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProjectForm;
