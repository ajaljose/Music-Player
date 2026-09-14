import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, Library, Flame } from 'lucide-react-native';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('home')}>
        <Home size={22} color={activeTab === 'home' ? '#ff6b00' : '#8a89a0'} />
        <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('search')}>
        <Search size={22} color={activeTab === 'search' ? '#ff6b00' : '#8a89a0'} />
        <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('library')}>
        <Library size={22} color={activeTab === 'library' ? '#ff6b00' : '#8a89a0'} />
        <Text style={[styles.tabText, activeTab === 'library' && styles.activeTabText]}>Library</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem} onPress={() => onTabChange('hotlist')}>
        <Flame size={22} color={activeTab === 'hotlist' ? '#ff6b00' : '#8a89a0'} />
        <Text style={[styles.tabText, activeTab === 'hotlist' && styles.activeTabText]}>Hotlist</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#0c0724',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#8a89a0',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ff6b00',
    fontWeight: '700',
  },
});
