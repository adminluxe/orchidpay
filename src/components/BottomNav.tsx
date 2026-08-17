import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import type { Navigate, TabRoute } from '../types';

const tabs: Array<{ route: TabRoute; label: string; symbol: string }> = [
  { route: 'home', label: 'Accueil', symbol: '⌂' },
  { route: 'cards', label: 'Cartes', symbol: '▣' },
  { route: 'scan', label: 'Scan', symbol: '⌁' },
  { route: 'activity', label: 'Activité', symbol: '↺' },
  { route: 'profile', label: 'Profil', symbol: '○' },
];

export default function BottomNav({ active, navigate }: { active: TabRoute; navigate: Navigate }) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = active === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.item}
            activeOpacity={0.8}
            onPress={() => navigate(tab.route)}
          >
            <Text style={[styles.symbol, isActive && styles.activeSymbol]}>{tab.symbol}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 86,
    paddingBottom: 14,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0B0810',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.panelBorder,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  symbol: { color: '#6F687B', fontSize: 21, fontWeight: '700' },
  activeSymbol: { color: colors.purpleSoft },
  label: { color: '#6F687B', fontSize: 10, marginTop: 4, fontWeight: '600' },
  activeLabel: { color: colors.text },
});
