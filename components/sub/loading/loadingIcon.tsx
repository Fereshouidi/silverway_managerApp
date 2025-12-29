import React, { useState, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '@/constants';

type Props = {
  size?: number;
  squareSize?: number;
};

const LoadingIcon = ({ size: propSize, squareSize: propSquareSize }: Props) => {
  const [layout, setLayout] = useState({ width: 0, height: 0, isReady: false });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    // Only update if we have a valid measurement and haven't locked it yet
    if (width > 0 && height > 0) {
      setLayout({ width, height, isReady: true });
    }
  };

  // 1. Calculate final dimensions only when ready or if prop is provided
  const iconSize = propSize || (layout.isReady ? Math.min(layout.width, layout.height) : 0);
  const finalSquareSize = propSquareSize || iconSize * 0.45;

  // 2. Positions are only valid if iconSize > 0
  const positions = useMemo(() => {
    if (iconSize === 0) return [];
    return [
      { x: 0, y: 0 },
      { x: iconSize - finalSquareSize, y: 0 },
      { x: iconSize - finalSquareSize, y: iconSize - finalSquareSize },
      { x: 0, y: iconSize - finalSquareSize },
    ];
  }, [iconSize, finalSquareSize]);

  const startIndexes = [0, 1, 2, 3];
  const colors = ["#000000", "#FFFFFF", "#000000", "#FFFFFF"];
  const borderColors = ["#FFFFFF", "#000000", "#FFFFFF", "#000000"];

  return (
    <View onLayout={handleLayout} style={styles.outerContainer}>
      {/* We wrap the whole thing in a MotiView to animate the Opacity.
          This hides the "initial jump" while onLayout is calculating.
      */}
      <MotiView 
        animate={{ opacity: layout.isReady || propSize ? 1 : 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={{ width: iconSize, height: iconSize, position: 'relative' }}
      >
        {positions.length > 0 &&
          startIndexes.map((startIdx, i) => (
            <MotiView
              key={i}
              style={[
                styles.square,
                {
                  width: finalSquareSize,
                  height: finalSquareSize,
                  backgroundColor: colors[i],
                  borderColor: borderColors[i],
                },
              ]}
              from={{
                translateX: positions[startIdx].x,
                translateY: positions[startIdx].y,
              }}
              animate={{
                translateX: positions.map((_, idx) => positions[(startIdx + idx) % 4].x),
                translateY: positions.map((_, idx) => positions[(startIdx + idx) % 4].y),
              }}
              transition={{
                type: 'timing',
                duration: 600,
                loop: true,
                repeatReverse: false,
              }}
            />
          ))}
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  square: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.light[500],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default LoadingIcon;