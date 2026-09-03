import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const AppleLogo = ({ width = 18, height = 18 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24">
    <Path
      d="M12 2C9.25 2 7 4.25 7 7C7 9.75 9.25 12 12 12C14.75 12 17 9.75 17 7C17 4.25 14.75 2 12 2ZM12 14C9.25 14 7 16.25 7 19C7 21.75 9.25 24 12 24C14.75 24 17 21.75 17 19C17 16.25 14.75 14 12 14Z"
      fill="#000000"
    />
  </Svg>
);
