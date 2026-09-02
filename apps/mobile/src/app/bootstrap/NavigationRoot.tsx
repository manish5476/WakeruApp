import React from 'react';
import { OverlayRoot } from './OverlayRoot';
// Note: Actual react-navigation container would wrap this in real execution,
// but architecture review specifies NavigationRoot wraps OverlayRoot.

export function NavigationRoot() {
  return (
    <>
      <OverlayRoot />
    </>
  );
}
