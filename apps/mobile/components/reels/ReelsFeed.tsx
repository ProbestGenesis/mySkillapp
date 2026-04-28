import { FlashList, ViewToken } from '@shopify/flash-list';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Platform, View } from 'react-native';
import { ReelData, ReelItem } from './ReelItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

interface ReelsFeedProps {
  data: ReelData[];
  onEndReached?: () => void;
}

export const ReelsFeed = ({ data, onEndReached }: ReelsFeedProps) => {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const activeIndex = viewableItems[0].index;
      if (typeof activeIndex === 'number') {
        setActiveItemIndex(activeIndex);
      }
    }
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: ReelData; index: number }) => {
      const isActive = index === activeItemIndex;
      const shouldLoad = Math.abs(index - activeItemIndex) <= 1;

      return <ReelItem item={item} isActive={isActive} shouldLoad={shouldLoad} containerHeight={containerHeight} />;
    },
    [activeItemIndex, containerHeight]
  );

  return (
    <View 
      className="flex-1 bg-black"
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {containerHeight > 0 && (
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          pagingEnabled={Platform.OS === 'ios'}
          snapToInterval={Platform.OS === 'android' ? containerHeight : undefined}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          drawDistance={containerHeight * 2}
        />
      )}
    </View>
  );
};
