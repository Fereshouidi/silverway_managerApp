import React, { useState, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { MotiView } from 'moti';

type Props = {
  size?: number;
  squareSize?: number;
};

const LoadingIcon = ({ size: propSize, squareSize: propSquareSize }: Props) => {
  const [layout, setLayout] = useState({ width: 0, height: 0, isReady: false });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height, isReady: true });
    }
  };

  const iconSize = propSize || (layout.isReady ? Math.min(layout.width, layout.height) : 0);
  
  // 1. حجم المربعات (صغير وأنيق)
  const finalSquareSize = propSquareSize || iconSize * 0.35;

  // 🔴 التعديل الأساسي هنا: حساب الإزاحة لتقريبهم من المركز
  // قمنا بحساب الفراغ المتبقي وقسمناه بحيث لا تلتصق المربعات بالحواف الخارجية
  const offset = iconSize * 0.15; 

  const positions = useMemo(() => {
    if (iconSize === 0) return [];
    
    // حساب الحدود الجديدة لتكون "داخلية" أكثر
    const start = offset;
    const end = iconSize - finalSquareSize - offset;

    return [
      { x: start, y: start }, // أعلى يسار (مقرب للمركز)
      { x: end,   y: start }, // أعلى يمين
      { x: end,   y: end   }, // أسفل يمين
      { x: start, y: end   }, // أسفل يسار
    ];
  }, [iconSize, finalSquareSize, offset]);

  const startIndexes = [0, 1, 2, 3];
  const colors = ["#000000", "#FFFFFF", "#000000", "#FFFFFF"];
  const borderColors = ["#FFFFFF", "#000000", "#FFFFFF", "#000000"];

  return (
    <View onLayout={handleLayout} style={styles.outerContainer}>
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
    borderRadius: 4, // جعلنا الحواف أقل انحناءً لتناسب الحجم الصغير
    borderWidth: 1,
    elevation: 4,
  },
});

export default LoadingIcon;