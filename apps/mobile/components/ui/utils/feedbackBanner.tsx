
import { MotiView } from 'moti';
import clsx from 'clsx';
import { Text } from 'react-native';

export function FeedbackBanner({
  success,
}: {
  success: { message: string; type: 'success' | 'error' | null };
}) {
  if (!success.message) return null;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx('mt-4 p-4 rounded-xl items-center', {
        'bg-green-100': success.type === 'success',
        'bg-red-100': success.type === 'error',
      })}>
      <Text
        className={clsx('font-bold text-center', {
          'text-green-700': success.type === 'success',
          'text-red-700': success.type === 'error',
        })}>
        {success.message}
      </Text>
    </MotiView>
  );
}