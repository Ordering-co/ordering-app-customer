import { useEffect, useState } from 'react';

import { PopoverContainer, Pointer, Bubble } from './styles';
import { OText, StoreMethods } from '@ui';

const { _retrieveStoreData, _setStoreData } = StoreMethods

export const AddressAlertPopover = ({ isVisible, text, setOpen }: any) => {
  const [isPopoverVisible, setIsPopoverVisible] = useState(isVisible);

  const handleClose = (value: boolean) => {
    setOpen(value);
    setIsPopoverVisible(value);
    _setStoreData('showAwayAddressPopover', false);
  }

  useEffect(() => {
    const getInitialValues = async () => {
      const showAwayAddressPopover = await _retrieveStoreData('showAwayAddressPopover');
      setIsPopoverVisible(showAwayAddressPopover === false ? false : isVisible);
    }
    getInitialValues();
  }, [isVisible]);

  return (
    isPopoverVisible ? (
      <PopoverContainer onPress={() => handleClose(!isPopoverVisible)}>
        <Pointer />
        <Bubble>
          <OText color='on_inverse' align='center'>{text}</OText>
        </Bubble>
      </PopoverContainer>
    ) : null);
};
