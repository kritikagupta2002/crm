import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { Button, Input } from '../../../../components';
import { colors, spacing } from '../../../../theme';
import { Shift, Employee } from '../../../../types';
import { styles } from './shiftsStyles';

interface ShiftModalsProps {
  showShiftModal: boolean;
  setShowShiftModal: (v: boolean) => void;
  editingShift: Shift | null;
  shiftName: string;
  setShiftName: (v: string) => void;
  shiftCode: string;
  setShiftCode: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  breakDuration: string;
  setBreakDuration: (v: string) => void;
  gracePeriod: string;
  setGracePeriod: (v: string) => void;
  weeklyOff: string;
  setWeeklyOff: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  shiftStatus: 'Active' | 'Inactive';
  setShiftStatus: (v: 'Active' | 'Inactive') => void;
  description: string;
  setDescription: (v: string) => void;
  shiftErrors: Record<string, string>;
  handleSaveShift: () => void;

  showAssignModal: boolean;
  setShowAssignModal: (v: boolean) => void;
  assignEmpId: string;
  setAssignEmpId: (v: string) => void;
  assignShiftId: string;
  setAssignShiftId: (v: string) => void;
  effectiveFrom: string;
  setEffectiveFrom: (v: string) => void;
  assignWeeklyOff: string;
  setAssignWeeklyOff: (v: string) => void;
  employees: Employee[];
  shifts: Shift[];
  handleSaveAssignment: () => void;
}

export const ShiftModals: React.FC<ShiftModalsProps> = ({
  showShiftModal,
  setShowShiftModal,
  editingShift,
  shiftName,
  setShiftName,
  shiftCode,
  setShiftCode,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  breakDuration,
  setBreakDuration,
  gracePeriod,
  setGracePeriod,
  weeklyOff,
  setWeeklyOff,
  location,
  setLocation,
  shiftStatus,
  setShiftStatus,
  description,
  setDescription,
  shiftErrors,
  handleSaveShift,
  showAssignModal,
  setShowAssignModal,
  assignEmpId,
  setAssignEmpId,
  assignShiftId,
  setAssignShiftId,
  effectiveFrom,
  setEffectiveFrom,
  assignWeeklyOff,
  setAssignWeeklyOff,
  employees,
  shifts,
  handleSaveAssignment,
}) => {
  return (
    <>
      <Modal
        visible={showShiftModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShiftModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingShift ? 'Edit Shift Master' : 'Create New Shift'}
              </Text>
              <TouchableOpacity onPress={() => setShowShiftModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Input
                label="Shift Name *"
                placeholder="e.g. Night Borehole Drilling Shift"
                value={shiftName}
                onChangeText={setShiftName}
                error={shiftErrors.name}
              />

              <Input
                label="Shift Code *"
                placeholder="e.g. NIGHT-DRILL"
                value={shiftCode}
                onChangeText={setShiftCode}
                autoCapitalize="characters"
                error={shiftErrors.code}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Start Time *"
                    placeholder="09:30 AM"
                    value={startTime}
                    onChangeText={setStartTime}
                    error={shiftErrors.startTime}
                  />
                </View>
                <View style={{ width: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Input
                    label="End Time *"
                    placeholder="06:00 PM"
                    value={endTime}
                    onChangeText={setEndTime}
                    error={shiftErrors.endTime}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Break Duration"
                    placeholder="45 mins"
                    value={breakDuration}
                    onChangeText={setBreakDuration}
                  />
                </View>
                <View style={{ width: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Input
                    label="Grace Period"
                    placeholder="15 mins"
                    value={gracePeriod}
                    onChangeText={setGracePeriod}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Designated Weekly Off</Text>
              <View style={styles.optionRow}>
                {[
                  'Saturday & Sunday',
                  'Sunday',
                  'Rotational (1 day / week)',
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionBtn,
                      weeklyOff === opt && styles.optionBtnActive,
                    ]}
                    onPress={() => setWeeklyOff(opt)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        weeklyOff === opt && styles.optionBtnTextActive,
                      ]}
                    >
                      {opt === 'Rotational (1 day / week)' ? 'Rotational' : opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                Location Applicability
              </Text>
              <View style={styles.optionRow}>
                {[
                  'Jaipur Corporate HQ',
                  'Bhilwara & Udaipur Mine Sites',
                  'Exploration Blocks / Field',
                ].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.optionBtn,
                      location === loc && styles.optionBtnActive,
                    ]}
                    onPress={() => setLocation(loc)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        location === loc && styles.optionBtnTextActive,
                      ]}
                    >
                      {loc.includes('HQ')
                        ? 'Jaipur HQ'
                        : loc.includes('Mine')
                        ? 'Mine Sites'
                        : 'Field'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                Status
              </Text>
              <View style={styles.optionRow}>
                {(['Active', 'Inactive'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.optionBtn,
                      shiftStatus === st && styles.optionBtnActive,
                    ]}
                    onPress={() => setShiftStatus(st)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        shiftStatus === st && styles.optionBtnTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: spacing.md }}>
                <Input
                  label="Description / Scope"
                  placeholder="Operating guidelines, shift handover, vehicle log requirements..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={editingShift ? 'Save Changes' : 'Create Shift Schedule'}
                onPress={handleSaveShift}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Shift to Staff Member</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.fieldLabel}>Select Employee *</Text>
              <ScrollView style={styles.selectionList} nestedScrollEnabled>
                {employees.map((e) => {
                  const isSelected = assignEmpId === e.employeeId;
                  return (
                    <TouchableOpacity
                      key={e.id}
                      style={[
                        styles.selectionItem,
                        isSelected && styles.selectionItemActive,
                      ]}
                      onPress={() => setAssignEmpId(e.employeeId)}
                    >
                      <View>
                        <Text
                          style={[
                            styles.selectionItemTitle,
                            isSelected && styles.textHighlight,
                          ]}
                        >
                          {e.name}
                        </Text>
                        <Text style={styles.selectionItemSub}>
                          {e.employeeId} ·{' '}
                          {e.employment?.department || 'Operations'}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Check size={16} color={colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                Target Shift Schedule *
              </Text>
              <ScrollView style={styles.selectionList} nestedScrollEnabled>
                {shifts.map((s) => {
                  const isSelected = assignShiftId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.selectionItem,
                        isSelected && styles.selectionItemActive,
                      ]}
                      onPress={() => setAssignShiftId(s.id)}
                    >
                      <View>
                        <Text
                          style={[
                            styles.selectionItemTitle,
                            isSelected && styles.textHighlight,
                          ]}
                        >
                          {s.name}
                        </Text>
                        <Text style={styles.selectionItemSub}>
                          {s.code} ({s.startTime} – {s.endTime})
                        </Text>
                      </View>
                      {isSelected ? (
                        <Check size={16} color={colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ marginTop: spacing.md }}>
                <Input
                  label="Effective From Date (YYYY-MM-DD)"
                  placeholder="2026-10-01"
                  value={effectiveFrom}
                  onChangeText={setEffectiveFrom}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                Designated Weekly Off
              </Text>
              <View style={styles.optionRow}>
                {[
                  'Saturday & Sunday',
                  'Sunday',
                  'Rotational (1 day / week)',
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionBtn,
                      assignWeeklyOff === opt && styles.optionBtnActive,
                    ]}
                    onPress={() => setAssignWeeklyOff(opt)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        assignWeeklyOff === opt && styles.optionBtnTextActive,
                      ]}
                    >
                      {opt === 'Rotational (1 day / week)' ? 'Rotational' : opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Save Assignment" onPress={handleSaveAssignment} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};
