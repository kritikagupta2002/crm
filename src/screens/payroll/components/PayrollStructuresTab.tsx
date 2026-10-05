import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Search, X, SlidersHorizontal, Edit2 } from 'lucide-react-native';
import { Card, Button, EmptyState } from '../../../components/common';
import { colors } from '../../../theme';
import { SalaryStructure } from '../../../types';
import { styles } from './payrollStyles';

interface PayrollStructuresTabProps {
  structureSearch: string;
  setStructureSearch: (text: string) => void;
  selectedDeptFilter: string;
  setSelectedDeptFilter: (dept: string) => void;
  departmentsList: string[];
  filteredStructures: SalaryStructure[];
  isHrOrAdmin: boolean;
  onEditStructure: (structure: SalaryStructure) => void;
}

export const PayrollStructuresTab: React.FC<PayrollStructuresTabProps> = ({
  structureSearch,
  setStructureSearch,
  selectedDeptFilter,
  setSelectedDeptFilter,
  departmentsList,
  filteredStructures,
  isHrOrAdmin,
  onEditStructure,
}) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.searchBar}>
        <Search size={16} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff by name or employee ID..."
          placeholderTextColor={colors.text.tertiary}
          value={structureSearch}
          onChangeText={setStructureSearch}
        />
        {structureSearch ? (
          <TouchableOpacity onPress={() => setStructureSearch('')}>
            <X size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

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

      <Text style={styles.resultCountText}>
        Showing {filteredStructures.length} employee salary structures
      </Text>

      {filteredStructures.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal size={36} color={colors.text.tertiary} />}
          title="No salary structure configured"
          description="No structures found matching your search criteria."
        />
      ) : (
        filteredStructures.map((s) => (
          <Card key={s.id} style={styles.structureCard}>
            <View style={styles.structHeader}>
              <View style={styles.structTitleWrap}>
                <Text style={styles.structEmpId}>{s.employeeId}</Text>
                <Text style={styles.structEmpName}>{s.employeeName}</Text>
                <Text style={styles.structEmpRole}>
                  {s.designation} • {s.department}
                </Text>
              </View>
              <View style={styles.structCtcBadge}>
                <Text style={styles.structCtcLabel}>ANNUAL CTC</Text>
                <Text style={styles.structCtcVal}>
                  ₹{((s.annualCtc || s.monthlyGross * 12) / 100000).toFixed(1)} LPA
                </Text>
              </View>
            </View>

            <View style={styles.compGrid}>
              <View style={styles.compCol}>
                <Text style={styles.compLabel}>BASIC</Text>
                <Text style={styles.compVal}>₹{s.basic.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.compCol}>
                <Text style={styles.compLabel}>HRA</Text>
                <Text style={styles.compVal}>₹{s.hra.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.compCol}>
                <Text style={styles.compLabel}>SPECIAL</Text>
                <Text style={styles.compVal}>₹{s.specialAllowance.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.compCol}>
                <Text style={styles.compLabel}>PF (12%)</Text>
                <Text style={[styles.compVal, { color: colors.semantic.danger }]}>
                  ₹{(s.providentFund || s.epf || 1800).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.structFooter}>
              <View>
                <Text style={styles.grossMonthlyLabel}>GROSS MONTHLY</Text>
                <Text style={styles.grossMonthlyVal}>
                  ₹{s.monthlyGross.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.netHighlight}>
                <Text style={styles.netHighlightLabel}>NET TAKE-HOME</Text>
                <Text style={styles.netHighlightVal}>
                  ₹{(s.monthlyNet || s.netSalary || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              {isHrOrAdmin && (
                <Button
                  title="Edit CTC"
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 size={12} color={colors.primary} />}
                  onPress={() => onEditStructure(s)}
                />
              )}
            </View>
          </Card>
        ))
      )}
    </View>
  );
};
