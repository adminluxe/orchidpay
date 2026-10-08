import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const PREMIUM_MARK = require('../../assets/in-app-mark.png');
const GOLDEN_RADIUS_FACTOR = 0.236;

export default function OrchidMark({ size = 44 }: { size?: number }) {
  const radius = Math.max(12, Math.round(size * GOLDEN_RADIUS_FACTOR));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="OrchidPay"
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <Image
        source={PREMIUM_MARK}
        resizeMode="cover"
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#0A0612',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 215, 106, 0.52)',
    shadowColor: '#8A3FFC',
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  image: {
    backgroundColor: '#0A0612',
  },
});
