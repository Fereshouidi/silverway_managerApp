import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text
} from 'react-native';

interface Props {
  children: ReactNode[];
  style?: ViewStyle;
  currentIndex: number
  setCurrentIndex: (value: number) => void
}

const CustomSwiper = ({ children, style, currentIndex, setCurrentIndex }: Props) => {

  const { width } = Dimensions.get('window');
  const flatListRef = useRef<FlatList>(null);

  const pageWidths = useMemo(() => {
    return React.Children.map(children, (child: any) =>
      child?.props?.style?.width || Dimensions.get('window').width
    ) as number[];
  }, [children]);

  const snapOffsets = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;
    for (let width of pageWidths) {
      offsets.push(total);
      total += width;
    }
    return offsets;
  }, [pageWidths]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    flatListRef.current?.scrollToIndex({
      index: currentIndex,
      animated: true,
    });
    
  }, [currentIndex, flatListRef.current]);

    React.useEffect(() => {
        flatListRef.current?.scrollToIndex({ index: currentIndex, animated: false });
    }, []);

  return (
    <>
      <FlatList
        horizontal
        pagingEnabled
        nestedScrollEnabled={true}
        data={children}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <View>{item}</View>}
        onMomentumScrollEnd={onScrollEnd}
        showsHorizontalScrollIndicator={false}
        ref={flatListRef}
        onScrollToIndexFailed={() => <Text>scroll error !</Text>}
      />

      </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  index: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CustomSwiper;
