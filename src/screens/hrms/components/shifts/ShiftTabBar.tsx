import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Clock, Users, Search, RotateCcw } from 'lucide-react-native';
import { colors } from '../../../../theme';
import { styles } from './shiftsStyles';

interface ShiftTabBarProps {
  activeTab: 'shifts' | 'assignments';
  setActiveTab: (tab: 'shifts' | 'assignments') => void;
  shiftsCount: number;
  assignmentsCount: number;
  search: string;
  setSearch: (text: string) => void;
  selectedDeptFilter: string;
  setSelectedDeptFilter: (dept: string) => void;
  departmentsList: string[];
}

export const ShiftTabBar: React.FC<ShiftTabBarProps> = ({
  activeTab,
  setActiveTab,
  shiftsCount,
  assignmentsCount,
  search,
  setSearch,
  selectedDeptFilter,
  setSelectedDeptFilter,
  departmentsList,
}) => {
  return (
    <>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'shifts' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('shifts')}
        >
          <Clock
            size={16}
            color={
              activeTab === 'shifts' ? colors.primary : colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'shifts' && styles.tabButtonTextActive,
            ]}
          >
            Shift Masters ({shiftsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'assignments' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('assignments')}
        >
          <Users
            size={16}
            color={
              activeTab === 'assignments' ? colors.primary : colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'assignments' && styles.tabButtonTextActive,
            ]}
          >
            Staff Assignments ({assignmentsCount})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'shifts'
                ? 'Search shift name, code, or location...'
                : 'Search staff, employee ID, or department...'
            }
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <RotateCcw size={14} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {activeTab === 'assignments' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {departmentsList.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.filterChip,
                selectedDeptFilter === dept && styles.filterChipActive,
              ]}
              onPress={() => setSelectedDeptFilter(dept)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDeptFilter === dept && styles.filterChipTextActive,
                ]}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
};
