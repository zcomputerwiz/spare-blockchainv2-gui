import React from 'react';
import styled from 'styled-components';
import { Box, BoxProps } from '@material-ui/core';
import { replaceme } from '@replaceme/icons';

const StyledReplaceme = styled(replaceme)`
  max-width: 100%;
  width: auto;
  height: auto;
`;

export default function Logo(props: BoxProps) {
  return (
    <Box {...props}>
      <StyledReplaceme />
    </Box>
  );
}
