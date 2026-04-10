import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AnimatePresence, MotiView } from 'moti';
import React from 'react';
import { Pressable, View } from 'react-native';
import UserInfo from './userInfo';

type Props = {
  visible: boolean;
  onClose: () => void;
  isCriticalMode?: boolean;
};

function EmailandNameDrawer({ visible, onClose, isCriticalMode = false }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <View className="absolute inset-0 z-50 justify-end">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 180 }}
            className="absolute inset-0 bg-black/40">
            <Pressable className="h-full w-full" disabled={isCriticalMode} onPress={onClose} />
          </MotiView>

          <MotiView
            from={{ translateY: 420, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 420, opacity: 0 }}
            transition={{ type: 'timing', duration: 260 }}
            className="max-h-[90%] w-full rounded-t-3xl bg-white px-2 pb-8 pt-5">

            <UserInfo forAuth={false} closeDrawer={onClose} />

            {!isCriticalMode ? (
              <Button variant="ghost" onPress={onClose} className="mt-2">
                <Text>Plus tard</Text>
              </Button>
            ) : null}
          </MotiView>
        </View>
      )}
    </AnimatePresence>
  );
}

export default EmailandNameDrawer;
