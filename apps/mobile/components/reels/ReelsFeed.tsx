import { FlashList, ViewToken } from '@shopify/flash-list';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { ReelData, ReelItem } from './ReelItem';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

interface ReelsFeedProps {
  data: ReelData[];
}

export const ReelsFeed = ({ data }: ReelsFeedProps) => {
  const [activeItemIndex, setActiveItemIndex] = useState(0);

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

      return <ReelItem item={item} isActive={isActive} shouldLoad={shouldLoad} />;
    },
    [activeItemIndex]
  );

  return (
    <View className="flex-1 bg-black">
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        drawDistance={WINDOW_HEIGHT}
      />
    </View>
  );
};
