// Web fallback for stripe client used by pay-money screen
// This avoids importing native-only modules on web bundler. The pay-money
// screen expects `CardField` and `useStripe` to exist; here we provide
// simple fallbacks that render a placeholder and implement no-op confirm.
import React from 'react';
import { View, Text } from 'react-native';

export const CardField: React.FC<any> = () => (
  <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }}>
    <Text style={{ color: '#333' }}>[CardField unavailable on web]</Text>
  </View>
);

export function useStripe() {
  return {
    // confirmPayment is not available on web here; callers should avoid calling it.
    confirmPayment: async () => ({ error: { message: 'Native confirmPayment not available on web' } }),
  } as any;
}
