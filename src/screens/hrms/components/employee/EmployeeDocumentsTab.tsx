import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FileText, Award, ChevronRight, Upload, Eye } from 'lucide-react-native';
import { Card, StatusBadge } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeeDocumentsTabProps {
  emp: any;
  empDocuments: any[];
  onNavigateDocuments: (employeeId: string) => void;
}

export const EmployeeDocumentsTab: React.FC<EmployeeDocumentsTabProps> = ({
  emp,
  empDocuments,
  onNavigateDocuments,
}) => {
  return (
    <View style={styles.tabSection}>
      <Card style={styles.card}>
        <View style={styles.cardTitleWithBadge}>
          <Text style={styles.sectionHeading}>Verified Credentials & Document Dossier</Text>
          <TouchableOpacity
            style={styles.manageDocsBtn}
            onPress={() => onNavigateDocuments(emp.employeeId)}
            activeOpacity={0.8}
          >
            <Text style={styles.manageDocsBtnText}>Manage Dossier</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {empDocuments.length === 0 ? (
          <View style={styles.emptyDocsBox}>
            <FileText size={32} color={colors.text.tertiary} />
            <Text style={styles.emptyDocsText}>
              No verified credentials or KYC records uploaded for this employee yet.
            </Text>
            <TouchableOpacity
              style={styles.uploadDocPromptBtn}
              onPress={() => onNavigateDocuments(emp.employeeId)}
            >
              <Upload size={14} color="#FFFFFF" />
              <Text style={styles.uploadDocPromptBtnText}>Upload Credential</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.docCardsList}>
            {empDocuments.map((doc) => {
              const isLicense =
                doc.documentType.includes('DGMS') || doc.documentType.includes('Pilot');
              return (
                <View key={doc.id} style={styles.docRowCard}>
                  <View style={styles.docRowIconWrap}>
                    {isLicense ? (
                      <Award size={20} color="#4F46E5" />
                    ) : (
                      <FileText size={20} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.docRowInfo}>
                    <Text style={styles.docRowType}>{doc.documentType}</Text>
                    <Text style={styles.docRowMeta}>
                      {doc.fileName} • {doc.fileSize}
                    </Text>
                    <Text style={styles.docRowDate}>
                      Uploaded: {doc.uploadedOn}
                      {doc.expiryDate ? ` • Expires: ${doc.expiryDate}` : ' • Lifetime'}
                    </Text>
                  </View>

                  <View style={styles.docRowRight}>
                    <StatusBadge
                      status={
                        doc.status === 'Verified'
                          ? 'approved'
                          : doc.status === 'Pending Review'
                          ? 'pending'
                          : 'rejected'
                      }
                      customLabel={doc.status}
                      size="small"
                    />

                    <TouchableOpacity
                      style={styles.docRowInspectBtn}
                      onPress={() => onNavigateDocuments(emp.employeeId)}
                    >
                      <Eye size={14} color={colors.primary} />
                      <Text style={styles.docRowInspectText}>Inspect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </View>
  );
};
