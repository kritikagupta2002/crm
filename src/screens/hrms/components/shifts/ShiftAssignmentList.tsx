import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Card, StatusBadge, EmptyState } from '../../../../components';
import { ShiftAssignment } from '../../../../types';
import { styles } from './shiftsStyles';

interface ShiftAssignmentListProps {
  filteredAssignments: ShiftAssignment[];
  refreshing: boolean;
  onRefresh: () => void;
  handleOpenAssignModal: () => void;
}

export const ShiftAssignmentList: React.FC<ShiftAssignmentListProps> = ({
  filteredAssignments,
  refreshing,
  onRefresh,
  handleOpenAssignModal,
}) => {
  return (
    <FlatList
      data={filteredAssignments}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <EmptyState
          title="No Assignments Found"
          description="No staff shift assignments match your criteria."
          actionLabel="Assign Shift"
          onAction={handleOpenAssignModal}
        />
      }
      renderItem={({ item }) => (
        <Card style={styles.assignmentCard}>
          <View style={styles.asgnHeader}>
            <View style={styles.asgnEmpWrap}>
              <Text style={styles.asgnEmpId}>{item.employeeId}</Text>
              <Text style={styles.asgnEmpName}>{item.employeeName}</Text>
              <Text style={styles.asgnDept}>{item.department}</Text>
            </View>
            <StatusBadge status={item.status} size="sm" />
          </View>

          <View style={styles.asgnBody}>
            <View style={styles.asgnItem}>
              <Text style={styles.asgnItemLabel}>ASSIGNED SHIFT</Text>
              <Text style={styles.asgnItemValue}>{item.shiftName}</Text>
            </View>

            <View style={styles.asgnGrid}>
              <View style={styles.asgnSubItem}>
                <Text style={styles.asgnItemLabel}>WEEKLY REST DAY</Text>
                <Text style={styles.asgnSubVal}>{item.weeklyOff}</Text>
              </View>
              <View style={styles.asgnSubItem}>
                <Text style={styles.asgnItemLabel}>EFFECTIVE FROM</Text>
                <Text style={styles.asgnSubVal}>{item.effectiveFrom}</Text>
              </View>
            </View>
          </View>
        </Card>
      )}
    />
  );
};
