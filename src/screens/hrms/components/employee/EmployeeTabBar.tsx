import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TabKey } from '../../useEmployeeDetail';
import { styles } from './employeeDetailStyles';

interface EmployeeTabBarProps {
  tabs: { key: TabKey; label: string; count?: number }[];
  activeTab: TabKey;
  onSelectTab: (key: TabKey) => void;
}

export const EmployeeTabBar: React.FC<EmployeeTabBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {tabs.map(t => {
          const isActive = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => onSelectTab(t.key)}
            >
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                {t.label}
                {t.count !== undefined && t.count > 0 ? ` (${t.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
