import React from 'react';
import { View, Text } from 'react-native';
import { Award } from 'lucide-react-native';
import { Card, EmptyState } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeePerformanceTabProps {
  empAppraisals: any[];
}

export const EmployeePerformanceTab: React.FC<EmployeePerformanceTabProps> = ({
  empAppraisals,
}) => {
  return (
    <View style={styles.tabSection}>
      {empAppraisals.length === 0 ? (
        <Card style={styles.card}>
          <EmptyState
            title="No Appraisal Records"
            message="No formal performance reviews have been filed for this employee yet."
            icon={<Award size={40} color={colors.text.tertiary} />}
          />
        </Card>
      ) : (
        empAppraisals.map(appr => (
          <Card key={appr.id} style={styles.card}>
            <View style={styles.apprHeader}>
              <View>
                <Text style={styles.apprCycle}>{appr.cycle}</Text>
                <Text style={styles.apprReviewer}>Reviewer: {appr.reviewerName}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{appr.overallScore} / 5.0</Text>
              </View>
            </View>

            <View style={styles.ratingsList}>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingName}>Technical Competency</Text>
                <Text style={styles.ratingScore}>{appr.ratings.technicalCompetency} / 5</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingName}>Field Execution & Rig Rigor</Text>
                <Text style={styles.ratingScore}>{appr.ratings.fieldExecution} / 5</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingName}>HSE & Safety Standards</Text>
                <Text style={styles.ratingScore}>{appr.ratings.safetyHse} / 5</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingName}>Team Leadership</Text>
                <Text style={styles.ratingScore}>{appr.ratings.leadership} / 5</Text>
              </View>
            </View>

            <View style={styles.feedbackBlock}>
              <Text style={styles.feedbackLabel}>Manager Feedback:</Text>
              <Text style={styles.feedbackText}>{appr.managerFeedback}</Text>
            </View>
          </Card>
        ))
      )}
    </View>
  );
};
