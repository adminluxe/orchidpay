import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type OrchidMarkProps = {
  size?: number;
};

export default function OrchidMark({ size = 44 }: OrchidMarkProps) {
  const petal = size * 0.34;
  const core = size * 0.13;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
      <View
        style={[
          styles.petal,
          styles.top,
          { width: petal, height: petal * 1.12, borderRadius: petal },
        ]}
      />
      <View
        style={[
          styles.petal,
          styles.left,
          { width: petal, height: petal * 1.12, borderRadius: petal },
        ]}
      />
      <View
        style={[
          styles.petal,
          styles.right,
          { width: petal, height: petal * 1.12, borderRadius: petal },
        ]}
      />
      <View
        style={[
          styles.lowerPetal,
          styles.lowerLeft,
          { width: petal * 0.86, height: petal, borderRadius: petal },
        ]}
      />
      <View
        style={[
          styles.lowerPetal,
          styles.lowerRight,
          { width: petal * 0.86, height: petal, borderRadius: petal },
        ]}
      />
      <View
        style={[
          styles.core,
          {
            width: core,
            height: core,
            borderRadius: core / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.2,
    borderColor: 'rgba(240,185,11,0.55)',
  },
  petal: {
    position: 'absolute',
    backgroundColor: colors.purple,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  lowerPetal: {
    position: 'absolute',
    backgroundColor: colors.purpleStrong,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  top: {
    top: '9%',
    transform: [{ rotate: '0deg' }],
  },
  left: {
    left: '14%',
    top: '31%',
    transform: [{ rotate: '-48deg' }],
  },
  right: {
    right: '14%',
    top: '31%',
    transform: [{ rotate: '48deg' }],
  },
  lowerLeft: {
    left: '25%',
    bottom: '14%',
    transform: [{ rotate: '-28deg' }],
  },
  lowerRight: {
    right: '25%',
    bottom: '14%',
    transform: [{ rotate: '28deg' }],
  },
  core: {
    position: 'absolute',
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
});
