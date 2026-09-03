import React, { forwardRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../providers/ThemeProvider';

export interface AppBottomSheetProps extends Omit<
  BottomSheetModalProps,
  'children'
> {
  children: React.ReactNode;
  snapPoints?: string[];
  enableDynamicSizing?: boolean;
  showBackdrop?: boolean;
}

export const BottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(
  (
    {
      children,
      snapPoints: userSnapPoints = ['50%', '90%'],
      enableDynamicSizing = false,
      showBackdrop = true,
      ...props
    },
    ref,
  ) => {
    const theme = useTheme();

    const renderBackdrop = useCallback(
      (backdropProps: any) =>
        showBackdrop ? (
          <BottomSheetBackdrop
            {...backdropProps}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={theme.isDark ? 0.7 : 0.4}
          />
        ) : null,
      [showBackdrop, theme.isDark],
    );

    return (
      <BottomSheetModal
        ref={ref}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.glass.background,
          borderRadius: theme.borderRadius['3xl'],
          borderWidth: theme.glass.borderTopWidth,
          borderColor: theme.glass.borderTopColor,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.borderStrong,
          width: 40,
          height: 5,
          borderRadius: 3,
        }}
        enableDynamicSizing={enableDynamicSizing}
        snapPoints={enableDynamicSizing ? undefined : userSnapPoints}
        {...props}
      >
        <View style={styles.contentContainer}>{children}</View>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
