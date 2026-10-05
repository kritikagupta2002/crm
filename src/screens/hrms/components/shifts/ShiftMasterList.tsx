import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Clock,
  Sunrise,
  Sun,
  Coffee,
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import { Card, StatusBadge, EmptyState } from '../../../../components';
import { colors } from '../../../../theme';
import { Shift } from '../../../../types';
import { styles } from './shiftsStyles';

interface ShiftMasterListProps {
  filteredShifts: Shift[];
  refreshing: boolean;
  onRefresh: () => void;
  handleOpenCreateShift: () => void;
  handleOpenEditShift: (shift: Shift) => void;
  handleDeleteShift: (shift: Shift) => void;
}

export const ShiftMasterList: React.FC<ShiftMasterListProps> = ({
  filteredShifts,
  refreshing,
  onRefresh,
  handleOpenCreateShift,
  handleOpenEditShift,
  handleDeleteShift,
}) => {
  const getShiftIcon = (code: string) => {
    if (code.includes('MORN') || code.includes('AM'))
      return <Sunrise size={18} color="#D97706" />;
    if (code.includes('EVE') || code.includes('PM'))
      return <Sun size={18} color="#2563EB" />;
    if (code.includes('FLIGHT') || code.includes('UAV'))
      return <Clock size={18} color="#059669" />;
    return <Clock size={18} color={colors.primary} />;
  };

  return (
    <FlatList
      data={filteredShifts}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <EmptyState
          title="No Shifts Found"
          description="No shift master schedules match your query."
          actionLabel="Create Shift"
          onAction={handleOpenCreateShift}
        />
      }
      renderItem={({ item }) => (
        <Card style={styles.shiftCard}>
          <View style={styles.shiftCardHeader}>
            <View style={styles.shiftCardLeft}>
              {getShiftIcon(item.code)}
              <View>
                <Text style={styles.shiftCardCode}>{item.code}</Text>
                <Text style={styles.shiftCardName}>{item.name}</Text>
              </View>
            </View>
            <StatusBadge status={item.status} size="sm" />
          </View>

          <View style={styles.shiftTimingBox}>
            <View style={styles.shiftTimeCol}>
              <Text style={styles.shiftTimeLabel}>TIMINGS</Text>
              <Text style={styles.shiftTimeVal}>
                {item.startTime} – {item.endTime}
              </Text>
            </View>
            <View style={styles.shiftHoursBadge}>
              <Text style={styles.shiftHoursText}>8.5h Shift</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Coffee size={12} color={colors.text.tertiary} />
              <Text style={styles.metaBadgeText}>
                Break: {item.breakDuration || '45m'}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Clock size={12} color={colors.text.tertiary} />
              <Text style={styles.metaBadgeText}>
                Grace: {item.gracePeriod || '15m'}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Calendar size={12} color={colors.text.tertiary} />
              <Text style={styles.metaBadgeText}>
                Off: {item.weeklyOff || 'Sun'}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.locationWrap}>
              <MapPin size={12} color={colors.text.tertiary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location || 'Jaipur Corporate HQ'}
              </Text>
            </View>
            <View style={styles.staffCountWrap}>
              <Users size={12} color={colors.primary} />
              <Text style={styles.staffCountText}>
                {item.assignedEmployeesCount || 0} Staff Assigned
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => handleOpenEditShift(item)}
            >
              <Edit2 size={14} color={colors.text.secondary} />
              <Text style={styles.actionBtnTextSecondary}>Edit Shift</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnDanger}
              onPress={() => handleDeleteShift(item)}
            >
              <Trash2 size={14} color={colors.danger} />
              <Text style={styles.actionBtnTextDanger}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}
    />
  );
};
