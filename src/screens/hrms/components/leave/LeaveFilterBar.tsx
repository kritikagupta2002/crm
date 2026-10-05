import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, Search, X } from 'lucide-react-native';
import { Button } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './leaveStyles';

interface LeaveFilterBarProps {
  onOpenApply: () => void;
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  statusFilter: string;
  setStatusFilter: (st: string) => void;
}

export const LeaveFilterBar: React.FC<LeaveFilterBarProps> = ({
  onOpenApply,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <>
      <Button
        title="Apply for Leave"
        variant="primary"
        leftIcon={<Plus size={18} color="#FFFFFF" />}
        onPress={onOpenApply}
        style={styles.applyBtn}
      />

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leaves, reason, applicant..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsRow}
        >
          {['All', 'Pending', 'Approved', 'Partially Approved', 'Rejected'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, statusFilter === st && styles.statusChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text
                style={[
                  styles.statusChipText,
                  statusFilter === st && styles.statusChipTextActive,
                ]}
              >
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
};
