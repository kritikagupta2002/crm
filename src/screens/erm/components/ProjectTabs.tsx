import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import {
  Users,
  Landmark,
  Plus,
  Check,
  Eye,
  EyeOff,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
} from 'lucide-react-native';
import { Card, Button, SegmentedControl } from '../../../components/common';
import { colors } from '../../../theme';
import { Project } from '../../../types';
import { styles } from './projectDetailStyles';

interface ProjectTabsProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  tabOptions: string[];
  project: Project;
  setTaskModalVisible: (v: boolean) => void;
  updateProjectTask: (projectId: string, taskId: string, updates: any) => void;
  setVisitModalVisible: (v: boolean) => void;
  toggleDocumentSharing: (projectId: string, docId: string) => void;
  setDocModalVisible: (v: boolean) => void;
}

export const ProjectTabs: React.FC<ProjectTabsProps> = ({
  activeTab,
  setActiveTab,
  tabOptions,
  project,
  setTaskModalVisible,
  updateProjectTask,
  setVisitModalVisible,
  toggleDocumentSharing,
  setDocModalVisible,
}) => {
  const getFileIcon = (type?: string, name?: string) => {
    if (type?.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(name || '')) {
      return <FileImage size={18} color={colors.accent} />;
    }
    if (/csv|excel|sheet/i.test(type || '') || /\.(csv|xlsx?)$/i.test(name || '')) {
      return <FileSpreadsheet size={18} color={colors.success} />;
    }
    return <FileText size={18} color={colors.primary} />;
  };

  return (
    <>
      <SegmentedControl
        options={tabOptions}
        selectedIndex={activeTab}
        onSelect={setActiveTab}
      />

      {activeTab === 0 && (
        <View style={styles.tabContent}>
          <Card style={styles.tabCard}>
            <View style={styles.tabCardHeader}>
              <Users size={16} color={colors.primary} />
              <Text style={styles.tabCardTitle}>Project Team</Text>
            </View>
            <View style={styles.personRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {project.team?.coordinator?.replace(/^Dr\.\s*/, '')?.slice(0, 2)?.toUpperCase() || 'CO'}
                </Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>
                  {project.team?.coordinator || 'Not Assigned'}
                </Text>
                <Text style={styles.personRole}>Project Coordinator</Text>
              </View>
            </View>

            <View style={styles.personRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {project.team?.teamLead?.replace(/^Dr\.\s*/, '')?.slice(0, 2)?.toUpperCase() || 'TL'}
                </Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>
                  {project.team?.teamLead || 'Not Assigned'}
                </Text>
                <Text style={styles.personRole}>Team Lead • Senior Geologist</Text>
              </View>
            </View>

            <View style={styles.fieldTeamList}>
              <Text style={styles.fieldTeamHeading}>Field Team Members:</Text>
              {(project.team?.members || []).length === 0 ? (
                <Text style={styles.mutedText}>No field members allocated yet.</Text>
              ) : (
                project.team!.members.map((m) => (
                  <View key={m} style={styles.memberTag}>
                    <Text style={styles.memberTagText}>{m}</Text>
                  </View>
                ))
              )}
            </View>
          </Card>

          <Card style={styles.tabCard}>
            <View style={styles.tabCardHeader}>
              <Landmark size={16} color={colors.primary} />
              <Text style={styles.tabCardTitle}>Authority & Concession</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Authority:</Text>
              <Text style={styles.detailValue}>{project.authority}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference Base:</Text>
              <Text style={styles.detailValue}>{project.refBase}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service Line:</Text>
              <Text style={styles.detailValue}>{project.service}</Text>
            </View>
          </Card>
        </View>
      )}

      {activeTab === 1 && (
        <View style={styles.tabContent}>
          <Card style={styles.tabCard}>
            <View style={styles.tasksHeadRow}>
              <View>
                <Text style={styles.tabCardTitle}>
                  Field & Project Tasks ({(project.tasks || []).length})
                </Text>
                <Text style={styles.mutedText}>
                  {(project.tasks || []).filter((t) => t.status === 'Completed').length} completed
                </Text>
              </View>
              <Button
                title="Add Task"
                icon={<Plus size={14} color={colors.white} />}
                onPress={() => setTaskModalVisible(true)}
                size="sm"
              />
            </View>

            {(project.tasks || []).length === 0 ? (
              <Text style={styles.emptyText}>No tasks assigned to this project yet.</Text>
            ) : (
              (project.tasks || []).map((t) => {
                const isDone = t.status === 'Completed';
                return (
                  <View key={t.id || t.key} style={styles.taskCard}>
                    <TouchableOpacity
                      style={styles.taskCheckRow}
                      onPress={() =>
                        updateProjectTask(project.id, t.id || t.key!, {
                          status: isDone ? 'Todo' : 'Completed',
                        })
                      }
                    >
                      <View
                        style={[
                          styles.taskCheckBox,
                          isDone && styles.taskCheckBoxDone,
                        ]}
                      >
                        {isDone && <Check size={12} color={colors.white} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                          {t.title}
                        </Text>
                        <Text style={styles.taskMeta}>
                          {t.assigneeName} • Due {t.dueDate}
                          {t.overdue && !isDone && (
                            <Text style={{ color: colors.danger }}> • OVERDUE</Text>
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </Card>
        </View>
      )}

      {activeTab === 2 && (
        <View style={styles.tabContent}>
          <Card style={styles.tabCard}>
            <View style={styles.tasksHeadRow}>
              <View>
                <Text style={styles.tabCardTitle}>
                  Site Visits & Readings ({(project.fieldVisits || []).length})
                </Text>
                <Text style={styles.mutedText}>Photos, lithologs & GPS survey logs</Text>
              </View>
              <Button
                title="Log Visit"
                icon={<Plus size={14} color={colors.white} />}
                onPress={() => setVisitModalVisible(true)}
                size="sm"
              />
            </View>

            {(project.fieldVisits || []).length === 0 ? (
              <Text style={styles.emptyText}>No field visits logged for this project block yet.</Text>
            ) : (
              project.fieldVisits!.map((v) => (
                <View key={v.id} style={styles.visitItem}>
                  <View style={styles.visitDateBadge}>
                    <Text style={styles.visitDay}>{v.date.slice(8, 10)}</Text>
                    <Text style={styles.visitMonth}>
                      {new Date(v.date).toLocaleString('default', { month: 'short' })}
                    </Text>
                  </View>

                  <View style={styles.visitDetails}>
                    <Text style={styles.visitActivity}>{v.activity}</Text>
                    <Text style={styles.visitAuthor}>
                      By {v.by} • {v.location}
                    </Text>
                    {v.notes ? <Text style={styles.visitNotes}>{v.notes}</Text> : null}

                    {v.files?.map((f) => (
                      <View key={f.id} style={styles.visitFileRow}>
                        {getFileIcon(f.type, f.name)}
                        <Text style={styles.fileNameText} numberOfLines={1}>
                          {f.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.shareBtn}
                          onPress={() => toggleDocumentSharing(project.id, f.id)}
                        >
                          {f.shared ? (
                            <Eye size={14} color={colors.success} />
                          ) : (
                            <EyeOff size={14} color={colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>
      )}

      {activeTab === 3 && (
        <View style={styles.tabContent}>
          <Card style={styles.tabCard}>
            <View style={styles.tasksHeadRow}>
              <View>
                <Text style={styles.tabCardTitle}>
                  Attached Documents ({(project.documents || []).length})
                </Text>
                <Text style={styles.mutedText}>Client portal and authority files</Text>
              </View>
              <Button
                title="Upload"
                icon={<Plus size={14} color={colors.white} />}
                onPress={() => setDocModalVisible(true)}
                size="sm"
              />
            </View>

            {(project.documents || []).length === 0 ? (
              <Text style={styles.emptyText}>No documents attached yet.</Text>
            ) : (
              project.documents!.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  {getFileIcon(doc.type, doc.name)}
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={styles.docSub}>
                      {doc.category || 'General'} • {(doc.size / 1024 / 1024).toFixed(1)} MB • {doc.addedOn}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.shareToggle}
                    onPress={() => toggleDocumentSharing(project.id, doc.id)}
                  >
                    {doc.shared ? (
                      <Eye size={16} color={colors.success} />
                    ) : (
                      <EyeOff size={16} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.docActionBtn}
                    onPress={() =>
                      Alert.alert('Download Started', `Downloading ${doc.name} to local device cache.`)
                    }
                  >
                    <Download size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </View>
      )}

      {activeTab === 4 && (
        <View style={styles.tabContent}>
          <Card style={styles.tabCard}>
            <Text style={styles.tabCardTitle}>Project Audit Log</Text>
            {(project.history || []).length === 0 ? (
              <Text style={styles.emptyText}>No history logged yet.</Text>
            ) : (
              project.history!.map((h) => (
                <View key={h.id} style={styles.historyRow}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyDate}>{h.date}</Text>
                    <Text style={styles.historyText}>{h.text}</Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>
      )}
    </>
  );
};
