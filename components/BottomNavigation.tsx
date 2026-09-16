import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, Library, Flame } from 'lucide-react-native';
import { TabType } from '../types';
import { COLORS } from '../constants/theme';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('home')}>
        <Home size={22} color={activeTab === 'home' ? COLORS.yellowAccent : COLORS.slateGray} />
        <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('search')}>
        <Search size={22} color={activeTab === 'search' ? COLORS.yellowAccent : COLORS.slateGray} />
        <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('library')}>
        <Library size={22} color={activeTab === 'library' ? COLORS.yellowAccent : COLORS.slateGray} />
        <Text style={[styles.tabText, activeTab === 'library' && styles.activeTabText]}>Library</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('hotlist')}>
        <Flame size={22} color={activeTab === 'hotlist' ? COLORS.yellowAccent : COLORS.slateGray} />
        <Text style={[styles.tabText, activeTab === 'hotlist' && styles.activeTabText]}>Hotlist</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: COLORS.darkerBg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(105, 103, 115, 0.25)',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabText: {
    fontSize: 11,
    color: COLORS.slateGray,
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.yellowAccent,
    fontWeight: '700',
  },
});
