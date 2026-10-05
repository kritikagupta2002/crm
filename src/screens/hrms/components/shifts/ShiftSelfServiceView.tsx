import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Clock,
  ArrowRight,
  Coffee,
  Calendar,
  MapPin,
  ChevronRight,
} from 'lucide-react-native';
import { AppHeader, Card, StatusBadge } from '../../../../components';
import { colors } from '../../../../theme';
import { Shift } from '../../../../types';
import { styles } from './shiftsStyles';

interface ShiftSelfServiceViewProps {
  navigation: any;
  myShift?: Shift;
  weeklyRoster: Array<{
    day: string;
    date: string;
    shift: string;
    timing: string;
    status: string;
  }>;
  refreshing: boolean;
  onRefresh: () => void;
}

export const ShiftSelfServiceView: React.FC<ShiftSelfServiceViewProps> = ({
  navigation,
  myShift,
  weeklyRoster,
  refreshing,
  onRefresh,
}) => {
  return (
    <View style={styles.container}>
      <AppHeader
        title="My Shift Schedule & Roster"
        subtitle="Your active assigned shift, timing rules, and weekly roster"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Clock size={14} color={colors.primary} />
              <Text style={styles.heroBadgeText}>CURRENT ACTIVE ASSIGNMENT</Text>
            </View>
            <StatusBadge status={myShift?.status || 'Active'} size="sm" />
          </View>

          <Text style={styles.heroShiftTitle}>
            {myShift?.name || 'General Corporate Shift (HQ)'}
          </Text>
          <Text style={styles.heroShiftCode}>{myShift?.code || 'HQ-GEN'}</Text>

          <View style={styles.heroTimeRow}>
            <View style={styles.heroTimeBox}>
              <Text style={styles.heroTimeLabel}>START TIME</Text>
              <Text style={styles.heroTimeValue}>
                {myShift?.startTime || '09:30 AM'}
              </Text>
            </View>
            <ArrowRight size={18} color={colors.text.tertiary} />
            <View style={styles.heroTimeBox}>
              <Text style={styles.heroTimeLabel}>END TIME</Text>
              <Text style={styles.heroTimeValue}>
                {myShift?.endTime || '06:00 PM'}
              </Text>
            </View>
            <View style={styles.heroTimeBox}>
              <Text style={styles.heroTimeLabel}>DURATION</Text>
              <Text style={styles.heroTimeValue}>8.5 Hours</Text>
            </View>
          </View>

          <View style={styles.heroDetailsGrid}>
            <View style={styles.heroDetailItem}>
              <Coffee size={14} color={colors.text.tertiary} />
              <Text style={styles.heroDetailText}>
                Break: {myShift?.breakDuration || '45 mins'}
              </Text>
            </View>
            <View style={styles.heroDetailItem}>
              <Clock size={14} color={colors.text.tertiary} />
              <Text style={styles.heroDetailText}>
                Grace: {myShift?.gracePeriod || '15 mins'}
              </Text>
            </View>
            <View style={styles.heroDetailItem}>
              <Calendar size={14} color={colors.text.tertiary} />
              <Text style={styles.heroDetailText}>
                Off: {myShift?.weeklyOff || 'Saturday & Sunday'}
              </Text>
            </View>
            <View style={styles.heroDetailItem}>
              <MapPin size={14} color={colors.text.tertiary} />
              <Text style={styles.heroDetailText}>
                {myShift?.location || 'Jaipur Corporate HQ'}
              </Text>
            </View>
          </View>

          {myShift?.description ? (
            <Text style={styles.heroDesc}>{myShift.description}</Text>
          ) : null}
        </Card>

        <TouchableOpacity
          style={styles.monthlyRosterBanner}
          onPress={() => navigation.navigate('MonthlyRoster')}
          activeOpacity={0.8}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIcon}>
              <Calendar size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.bannerTitle}>
                Monthly Employee Roster Planner
              </Text>
              <Text style={styles.bannerSubtitle}>
                View complete calendar schedule & rotations
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Current Week Roster (22 Sep – 28 Sep 2026)
          </Text>
        </View>

        <Card style={styles.weeklyTableCard}>
          {weeklyRoster.map((item, index) => {
            const isActiveToday = item.status === 'Active Today';
            const isWeeklyOff = item.status === 'Weekly Off';

            return (
              <View
                key={index}
                style={[
                  styles.rosterRow,
                  isActiveToday && styles.rosterRowActive,
                  index === weeklyRoster.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.rosterDayCol}>
                  <Text
                    style={[
                      styles.rosterDayText,
                      isActiveToday && styles.textHighlight,
                    ]}
                  >
                    {item.day}
                  </Text>
                  <Text style={styles.rosterDateText}>{item.date}</Text>
                </View>

                <View style={styles.rosterShiftCol}>
                  <Text
                    style={[
                      styles.rosterShiftName,
                      isWeeklyOff && styles.textMuted,
                    ]}
                  >
                    {item.shift}
                  </Text>
                  <Text style={styles.rosterTimingText}>{item.timing}</Text>
                </View>

                <View style={styles.rosterStatusCol}>
                  <StatusBadge
                    status={
                      item.status === 'Completed'
                        ? 'Completed'
                        : item.status === 'Active Today'
                        ? 'Active'
                        : 'Pending'
                    }
                    size="sm"
                  />
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
};
