import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants';

type Props = {
  size?: number | 'small' | 'large';
  color?: string;
};

const LoadingIcon = ({ size = 'small', color }: Props) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={color || colors.light[700]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',

  },
});

export default LoadingIcon;