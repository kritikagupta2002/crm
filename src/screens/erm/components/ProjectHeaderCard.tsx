import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Card, StatusBadge } from '../../../components/common';
import { colors } from '../../../theme';
import { Project } from '../../../types';
import { formatCurrencyLakhs as formatCurrency } from '../../../utils';
import { styles } from './projectDetailStyles';

interface ProjectHeaderCardProps {
  project: Project;
}

export const ProjectHeaderCard: React.FC<ProjectHeaderCardProps> = ({ project }) => {
  return (
    <Card style={styles.headerCard}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>{project.title}</Text>
        <StatusBadge status={project.status || project.stageName} />
      </View>

      <View style={styles.metaRow}>
        <MapPin size={13} color={colors.textMuted} />
        <Text style={styles.metaText}>{project.site || project.location}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Baseline Budget</Text>
          <Text style={styles.statValue}>{formatCurrency(project.baselineBudget)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Authority</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {project.code || 'DMG'}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Target Due</Text>
          <Text style={styles.statValue}>{project.dueOn || project.endDate}</Text>
        </View>
      </View>
    </Card>
  );
};
