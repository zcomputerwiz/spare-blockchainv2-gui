import React from 'react';
import { SvgIcon, SvgIconProps } from '@material-ui/core';
import { ReactComponent as spareIcon } from './images/spare.svg';

export default function Keys(props: SvgIconProps) {
  return <SvgIcon component={spareIcon} viewBox="0 0 150 58" {...props} />;
}
