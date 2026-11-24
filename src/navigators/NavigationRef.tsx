import * as React from 'react';
import { openScreen } from './appNavigation';

export const navigationRef: any = React.createRef();

/** Open a screen from outside React (push notifications): the main stack's go through MyAccount. */
export const navigate = (name: string, params: any) => {
  openScreen(navigationRef.current, name, params);
};
