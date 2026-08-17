import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import SendScreen from './screens/SendScreen';
import ReceiveScreen from './screens/ReceiveScreen';
import DepositScreen from './screens/DepositScreen';
import { ActivityScreen, CardsScreen, ProfileScreen, ScanScreen } from './screens/TabScreens';
import type { AppRoute, Navigate, TabRoute } from './types';
import { colors } from './theme';

const tabRoutes: TabRoute[] = ['home', 'cards', 'scan', 'activity', 'profile'];

export default function AppShell() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [lastTab, setLastTab] = useState<TabRoute>('home');

  const navigate: Navigate = (next) => {
    setRoute(next);
    if (tabRoutes.includes(next as TabRoute)) {
      setLastTab(next as TabRoute);
    }
  };

  const content = (() => {
    switch (route) {
      case 'send': return <SendScreen navigate={navigate} />;
      case 'receive': return <ReceiveScreen navigate={navigate} />;
      case 'deposit': return <DepositScreen navigate={navigate} />;
      case 'cards': return <CardsScreen />;
      case 'scan': return <ScanScreen />;
      case 'activity': return <ActivityScreen />;
      case 'profile': return <ProfileScreen />;
      case 'home':
      default: return <HomeScreen navigate={navigate} />;
    }
  })();

  const showTabs = tabRoutes.includes(route as TabRoute);

  return (
    <View style={styles.root}>
      <View style={styles.content}>{content}</View>
      {showTabs ? <BottomNav active={lastTab} navigate={navigate} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { flex: 1 },
});
