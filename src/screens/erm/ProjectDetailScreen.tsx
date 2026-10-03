import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Users,
  UserCheck,
  Check,
  Landmark,
  Eye,
  EyeOff,
  Download,
  Trash2,
  FileImage,
  FileSpreadsheet,
  FileCode,
  ScrollText,
  ChevronDown,
  X,
  Share2,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, Input, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import {
  ERM_STAGES,
  CLOSURE_STEPS,
  COORDINATORS,
  TEAM_LEADS,
  FIELD_MEMBERS,
  SUBMISSION_MODES,
  DOC_CATEGORIES,
  WORK_SUGGESTIONS,
  canActOnErm,
} from '../../constants';
import { Project, ProjectStageNumber, Task, FieldVisit } from '../../types';

interface ProjectDetailScreenProps {
  route: any;
  navigation: any;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ route, navigation }) => {
  const { projectId, initialTab } = route.params;
  const {
    projects,
    updateProjectStage,
    setProjectTeam,
    updateProjectTask,
    addProjectTask,
    addFieldVisit,
    submitToAuthority,
    setProjectApprovalStep,
    setClosureStep,
    closeProject,
    addProjectDocuments,
    toggleDocumentSharing,
    addGovtLetter,
  } = useCrm();
  const { role } = useAuth();

  const project = projects.find((p) => p.id === projectId);

  const tabOptions = ['Overview', 'Tasks', 'Field Work', 'Documents', 'History'];
  const initialTabIdx = initialTab === 'tasks' ? 1 : initialTab === 'field' ? 2 : initialTab === 'documents' ? 3 : initialTab === 'history' ? 4 : 0;
  const [activeTab, setActiveTab] = useState<number>(initialTabIdx);

  // Allocation & Planning Form States
  const [selectedCoord, setSelectedCoord] = useState<string>(project?.team?.coordinator || COORDINATORS[0].name);
  const [selectedLead, setSelectedLead] = useState<string>(project?.team?.teamLead || TEAM_LEADS[0].name);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(project?.team?.members || []);

  // Submission Form State
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [submissionMode, setSubmissionMode] = useState(SUBMISSION_MODES[0]);
  const [submissionAck, setSubmissionAck] = useState('');

  // Closure Form State
  const [closureNote, setClosureNote] = useState(project?.closure?.note || '');

  // Add Task Modal State
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');

  // Log Field Visit Modal State
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitActivity, setVisitActivity] = useState(WORK_SUGGESTIONS[0]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitBy, setVisitBy] = useState(project?.team?.members?.[0] || 'Ajay Kumar');
  const [visitLocation, setVisitLocation] = useState(project?.site?.split('·')?.[1]?.trim() || 'Pit 2 Drill Site');
  const [visitNotes, setVisitNotes] = useState('');

  // Upload Document Modal State
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState(DOC_CATEGORIES[0]);

  // Letter Modal State
  const [letterModalVisible, setLetterModalVisible] = useState(false);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterRef, setLetterRef] = useState('');
  const [letterStepKey, setLetterStepKey] = useState('');

  if (!project) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Project Details" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Exploration Block not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const currentStage = (project.currentStage || 1) as ProjectStageNumber;
  const currentStageCfg = ERM_STAGES[Math.min(6, currentStage - 1)];
  const isActionPermitted = canActOnErm(role, currentStageCfg?.key || 'allocation');

  const formatCurrency = (amt: number) => {
    if (!amt) return '₹0';
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)} Lakhs`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  // Hand-over actions
  const handleSaveCoordinator = async () => {
    if (!selectedCoord) return;
    try {
      await setProjectTeam(project.id, { coordinator: selectedCoord });
      Alert.alert('Coordinator Assigned', `${selectedCoord} assigned as Project Coordinator. Advanced to Stage 2: Planning.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveTeamPlan = async () => {
    if (!selectedLead || selectedMembers.length === 0) {
      Alert.alert('Incomplete', 'Please select a Team Lead and at least one Field Team member.');
      return;
    }
    try {
      await setProjectTeam(project.id, {
        teamLead: selectedLead,
        members: selectedMembers,
      });
      Alert.alert('Plan Confirmed', `Team Lead ${selectedLead} and ${selectedMembers.length} field engineers assigned. Advanced to Stage 3: Task Execution.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const toggleMemberSelection = (name: string) => {
    if (selectedMembers.includes(name)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== name));
    } else {
      setSelectedMembers([...selectedMembers, name]);
    }
  };

  const handleSubmitAuthority = async () => {
    try {
      await submitToAuthority(project.id, {
        date: submissionDate,
        mode: submissionMode,
        ackNo: submissionAck || `${project.refBase || 'ACK'}/SUB`,
      });
      Alert.alert('Submitted to Authority', `Filing confirmed via ${submissionMode}. Project progressed to Stage 5: Client Approval.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleApprovalStep = async (stepKey: string, currentVal: boolean) => {
    try {
      await setProjectApprovalStep(project.id, stepKey, !currentVal);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleClosureStep = async (stepKey: string, currentVal: boolean) => {
    try {
      await setClosureStep(project.id, stepKey, !currentVal);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCloseProject = async () => {
    const steps = project.closure?.steps || [];
    const allDone = steps.every((s) => s.done);
    if (!allDone) {
      Alert.alert('Incomplete Closure', 'Please complete all 4 hand-over checklist steps before final closure.');
      return;
    }
    try {
      await closeProject(project.id, closureNote);
      Alert.alert('Project Closed', 'Exploration archive sealed and project marked as Completed.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAdvanceInvoicing = async () => {
    try {
      await updateProjectStage(project.id, 7);
      Alert.alert('Invoicing Complete', 'Tax invoice booked. Project moved to Stage 7: Project Closure.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }
    try {
      await addProjectTask(project.id, {
        title: taskTitle.trim(),
        assigneeName: taskAssignee || project.team?.members?.[0] || 'Field Team',
        dueDate: taskDueDate,
        priority: taskPriority,
        status: 'Todo',
      });
      setTaskModalVisible(false);
      setTaskTitle('');
      Alert.alert('Success', 'Task assigned to project team.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLogVisit = async () => {
    if (!visitActivity.trim()) {
      Alert.alert('Required', 'Please enter work activity description.');
      return;
    }
    try {
      await addFieldVisit(project.id, {
        activity: visitActivity.trim(),
        date: visitDate,
        by: visitBy,
        location: visitLocation,
        notes: visitNotes,
        files: [
          {
            id: 'fv-' + Date.now(),
            name: `${visitActivity.toLowerCase().replace(/\s+/g, '_')}_field_photo.jpg`,
            size: 2400000,
            type: 'image/jpeg',
            shared: true,
          },
        ],
      });
      setVisitModalVisible(false);
      setVisitNotes('');
      Alert.alert('Success', 'Field visit and readings logged.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUploadDoc = async () => {
    if (!docName.trim()) {
      Alert.alert('Required', 'Please enter document filename.');
      return;
    }
    try {
      await addProjectDocuments(
        project.id,
        [
          {
            name: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
            size: 3200000,
            type: 'application/pdf',
          },
        ],
        docCategory
      );
      setDocModalVisible(false);
      setDocName('');
      Alert.alert('Success', 'Document attached to exploration block.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddLetter = async () => {
    if (!letterTitle.trim() || !letterRef.trim()) {
      Alert.alert('Required', 'Please enter letter title and reference number.');
      return;
    }
    try {
      await addGovtLetter(project.id, {
        title: letterTitle.trim(),
        ref: letterRef.trim(),
        authority: project.authority || 'Government Authority',
        date: new Date().toISOString().split('T')[0],
        forStep: letterStepKey || undefined,
      });
      setLetterModalVisible(false);
      setLetterTitle('');
      setLetterRef('');
      Alert.alert('Letter Recorded', 'Scanned authority letter linked to approval step.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // Render file icon
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
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={project.projectCode}
          subtitle={project.clientName}
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* 1. Project Header Overview Card */}
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

      {/* 2. 7-Stage Interactive Pipeline Card */}
      <Card style={styles.stepperCard}>
        <View style={styles.stepperHeader}>
          <Text style={styles.sectionHeading}>7-Stage Operational Lifecycle</Text>
          <Text style={styles.stageIndicatorText}>
            Stage {currentStage} of 7: {currentStageCfg?.label}
          </Text>
        </View>

        {/* Visual Stepper Dots */}
        <View style={styles.stepperRow}>
          {ERM_STAGES.map((st, i) => {
            const stageNum = i + 1;
            const isCompleted = stageNum < currentStage;
            const isCurrent = stageNum === currentStage;
            return (
              <View key={st.key} style={styles.stepDotContainer}>
                <View
                  style={[
                    styles.stepDot,
                    isCompleted && styles.stepDotDone,
                    isCurrent && styles.stepDotCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={12} color={colors.white} strokeWidth={3} />
                  ) : (
                    <Text style={[styles.stepDotNum, isCurrent && styles.stepDotNumActive]}>
                      {stageNum}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepDotLabel,
                    isCurrent && styles.stepDotLabelActive,
                    isCompleted && styles.stepDotLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {st.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Dynamic Next-Step Hand-over Action Card */}
        <View style={styles.nextStepCard}>
          <View style={styles.nextStepHead}>
            <View style={styles.nowBadge}>
              <Text style={styles.nowBadgeText}>Now: {currentStageCfg?.label}</Text>
            </View>
            <Text style={styles.todoText}>{currentStageCfg?.todo}</Text>
          </View>

          {!isActionPermitted ? (
            <Text style={styles.permissionNotice}>
              Waiting on {currentStageCfg?.owner}. As {role.toUpperCase()} you can monitor this stage; {currentStageCfg?.owner} confirms the hand-over.
            </Text>
          ) : (
            <View style={styles.handoverContent}>
              {/* STAGE 1: ALLOCATION */}
              {currentStage === 1 && (
                <View style={styles.stageForm}>
                  <Text style={styles.formLabel}>Select Project Coordinator:</Text>
                  <View style={styles.pickerWrap}>
                    {COORDINATORS.map((c) => (
                      <TouchableOpacity
                        key={c.name}
                        style={[
                          styles.radioOption,
                          selectedCoord === c.name && styles.radioOptionSelected,
                        ]}
                        onPress={() => setSelectedCoord(c.name)}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            selectedCoord === c.name && styles.radioCircleSelected,
                          ]}
                        />
                        <View>
                          <Text style={styles.radioText}>{c.name}</Text>
                          <Text style={styles.radioSub}>{c.title}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Button
                    title="Confirm Coordinator & Advance to Planning"
                    onPress={handleSaveCoordinator}
                    size="sm"
                    style={styles.stageActionBtn}
                  />
                </View>
              )}

              {/* STAGE 2: PLANNING */}
              {currentStage === 2 && (
                <View style={styles.stageForm}>
                  <Text style={styles.formLabel}>Choose Team Lead:</Text>
                  <View style={styles.pickerWrap}>
                    {TEAM_LEADS.map((t) => (
                      <TouchableOpacity
                        key={t.name}
                        style={[
                          styles.radioOption,
                          selectedLead === t.name && styles.radioOptionSelected,
                        ]}
                        onPress={() => setSelectedLead(t.name)}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            selectedLead === t.name && styles.radioCircleSelected,
                          ]}
                        />
                        <View>
                          <Text style={styles.radioText}>{t.name}</Text>
                          <Text style={styles.radioSub}>{t.title}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.formLabel, { marginTop: spacing.sm }]}>
                    Assign Field Engineers & Surveyors:
                  </Text>
                  <View style={styles.checkboxGrid}>
                    {FIELD_MEMBERS.map((m) => {
                      const isChecked = selectedMembers.includes(m.name);
                      return (
                        <TouchableOpacity
                          key={m.name}
                          style={[styles.checkOption, isChecked && styles.checkOptionSelected]}
                          onPress={() => toggleMemberSelection(m.name)}
                        >
                          <View
                            style={[styles.checkBox, isChecked && styles.checkBoxSelected]}
                          >
                            {isChecked && <Check size={12} color={colors.white} />}
                          </View>
                          <View>
                            <Text style={styles.checkText}>{m.name}</Text>
                            <Text style={styles.checkSub}>{m.skills}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Button
                    title="Lock Team & Advance to Execution"
                    onPress={handleSaveTeamPlan}
                    size="sm"
                    style={styles.stageActionBtn}
                  />
                </View>
              )}

              {/* STAGE 3: TASK EXECUTION */}
              {currentStage === 3 && (
                <View style={styles.stageForm}>
                  <View style={styles.workStatsRow}>
                    <Text style={styles.workStatsText}>
                      {(project.tasks || []).filter((t) => t.status === 'Completed').length} of {(project.tasks || []).length} field tasks done
                    </Text>
                    <Text style={styles.workStatsSub}>
                      {(project.fieldVisits || []).length} visits logged
                    </Text>
                  </View>
                  <View style={styles.stageBtnRow}>
                    <Button
                      title="Assign Field Task"
                      icon={<Plus size={14} color={colors.white} />}
                      onPress={() => setTaskModalVisible(true)}
                      size="sm"
                      style={styles.flexBtn}
                    />
                    <Button
                      title="Log Field Visit"
                      icon={<Plus size={14} color={colors.primary} />}
                      variant="outline"
                      onPress={() => setVisitModalVisible(true)}
                      size="sm"
                      style={styles.flexBtn}
                    />
                  </View>
                  <Button
                    title="Ready for Deliverable Submission"
                    onPress={() => updateProjectStage(project.id, 4)}
                    variant="secondary"
                    size="sm"
                    style={{ marginTop: spacing.xs }}
                  />
                </View>
              )}

              {/* STAGE 4: DELIVERABLE SUBMISSION */}
              {currentStage === 4 && (
                <View style={styles.stageForm}>
                  <Input
                    label="Filing Date"
                    value={submissionDate}
                    onChangeText={setSubmissionDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <Text style={styles.formLabel}>Submission Portal / Mode:</Text>
                  <View style={styles.modePicker}>
                    {SUBMISSION_MODES.map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.modeBtn,
                          submissionMode === mode && styles.modeBtnActive,
                        ]}
                        onPress={() => setSubmissionMode(mode)}
                      >
                        <Text
                          style={[
                            styles.modeBtnText,
                            submissionMode === mode && styles.modeBtnTextActive,
                          ]}
                        >
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Input
                    label="Acknowledgement / Application No."
                    value={submissionAck}
                    onChangeText={setSubmissionAck}
                    placeholder={`e.g. ${project.refBase}/ACK`}
                  />
                  <Button
                    title="Mark as Submitted to Authority"
                    icon={<Landmark size={14} color={colors.white} />}
                    onPress={handleSubmitAuthority}
                    size="sm"
                    style={styles.stageActionBtn}
                  />
                </View>
              )}

              {/* STAGE 5: CLIENT / GOVT APPROVAL */}
              {currentStage === 5 && (
                <View style={styles.stageForm}>
                  <Text style={styles.formLabel}>
                    Follow up with {project.authority || 'Government Authority'}:
                  </Text>
                  <View style={styles.checklistWrap}>
                    {(project.approvals || []).map((step) => (
                      <View key={step.key} style={styles.checklistItem}>
                        <TouchableOpacity
                          style={styles.checkRow}
                          onPress={() => handleToggleApprovalStep(step.key, step.done)}
                        >
                          <View
                            style={[
                              styles.checkBox,
                              step.done && styles.checkBoxSelected,
                            ]}
                          >
                            {step.done && <Check size={12} color={colors.white} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.checkItemLabel,
                                step.done && styles.checkItemLabelDone,
                              ]}
                            >
                              {step.label}
                            </Text>
                            {step.date && (
                              <Text style={styles.checkItemDate}>Done on {step.date}</Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Link Letter button */}
                        <TouchableOpacity
                          style={styles.linkLetterBtn}
                          onPress={() => {
                            setLetterStepKey(step.key);
                            setLetterTitle(step.letter || `${step.label} Notice`);
                            setLetterRef(`${project.refBase || 'REF'}/${step.key.toUpperCase()}`);
                            setLetterModalVisible(true);
                          }}
                        >
                          <ScrollText size={12} color={colors.primary} />
                          <Text style={styles.linkLetterText}>Attach Letter</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* STAGE 6: INVOICING */}
              {currentStage === 6 && (
                <View style={styles.stageForm}>
                  <Text style={styles.formLabel}>Milestone Billing & Invoicing:</Text>
                  <View style={styles.invoiceStatRow}>
                    <Text style={styles.invoiceLabel}>Final Contract Value:</Text>
                    <Text style={styles.invoiceVal}>{formatCurrency(project.baselineBudget)}</Text>
                  </View>
                  <View style={styles.invoiceStatRow}>
                    <Text style={styles.invoiceLabel}>GST Tax Rate (18%):</Text>
                    <Text style={styles.invoiceVal}>
                      {formatCurrency(project.baselineBudget * 0.18)}
                    </Text>
                  </View>
                  <View style={styles.invoiceStatRow}>
                    <Text style={styles.invoiceLabel}>Payment Status:</Text>
                    <Text style={[styles.invoiceVal, { color: colors.success }]}>
                      Client Approved • Tax Invoice Released
                    </Text>
                  </View>
                  <Button
                    title="Confirm Payment & Proceed to Closure"
                    onPress={handleAdvanceInvoicing}
                    size="sm"
                    style={styles.stageActionBtn}
                  />
                </View>
              )}

              {/* STAGE 7: PROJECT CLOSURE */}
              {currentStage === 7 && (
                <View style={styles.stageForm}>
                  {project.closure?.closedOn ? (
                    <View style={styles.closedBanner}>
                      <CheckCircle2 size={20} color={colors.success} />
                      <View>
                        <Text style={styles.closedBannerTitle}>
                          Project Closed on {project.closure.closedOn}
                        </Text>
                        <Text style={styles.closedBannerSub}>
                          {project.closure.note || 'Technical archive sealed and feedback received.'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.formLabel}>Hand-over & Archive Checklist:</Text>
                      <View style={styles.checklistWrap}>
                        {(project.closure?.steps || CLOSURE_STEPS.map(c => ({ key: c.key, label: c.label, done: false }))).map(
                          (cStep) => (
                            <TouchableOpacity
                              key={cStep.key}
                              style={styles.checklistItem}
                              onPress={() => handleToggleClosureStep(cStep.key, cStep.done)}
                            >
                              <View
                                style={[
                                  styles.checkBox,
                                  cStep.done && styles.checkBoxSelected,
                                ]}
                              >
                                {cStep.done && <Check size={12} color={colors.white} />}
                              </View>
                              <Text
                                style={[
                                  styles.checkItemLabel,
                                  cStep.done && styles.checkItemLabelDone,
                                ]}
                              >
                                {cStep.label}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                      <Input
                        label="Closing Review Note"
                        value={closureNote}
                        onChangeText={setClosureNote}
                        placeholder="e.g. Client satisfied, repeat work confirmed."
                      />
                      <Button
                        title="Close Exploration Block"
                        onPress={handleCloseProject}
                        size="sm"
                        style={styles.stageActionBtn}
                      />
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Card>

      {/* 3. 5-Tab Segmented Switcher */}
      <SegmentedControl
        options={tabOptions}
        selectedIndex={activeTab}
        onSelect={setActiveTab}
      />

      {/* TAB 0: OVERVIEW */}
      {activeTab === 0 && (
        <View style={styles.tabContent}>
          {/* Team Staff Card */}
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

          {/* Authority & Concession Reference */}
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

      {/* TAB 1: TASKS */}
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

      {/* TAB 2: FIELD WORK */}
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

      {/* TAB 3: DOCUMENTS */}
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

      {/* TAB 4: HISTORY */}
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

      {/* MODAL: ADD TASK */}
      <Modal
        visible={taskModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Field Task</Text>
              <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Task Title"
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="e.g. Collect 20 core samples from pit 3"
              required
            />

            <Input
              label="Assigned Engineer"
              value={taskAssignee}
              onChangeText={setTaskAssignee}
              placeholder="e.g. Ajay Kumar"
            />

            <Input
              label="Due Date"
              value={taskDueDate}
              onChangeText={setTaskDueDate}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setTaskModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Add Task"
                onPress={handleAddTask}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: LOG FIELD VISIT */}
      <Modal
        visible={visitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Field Visit</Text>
              <TouchableOpacity onPress={() => setVisitModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Work Done"
              value={visitActivity}
              onChangeText={setVisitActivity}
              placeholder="e.g. Core drilling & logging"
              required
            />

            <Input
              label="Visit Date"
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="YYYY-MM-DD"
            />

            <Input
              label="Done By"
              value={visitBy}
              onChangeText={setVisitBy}
              placeholder="e.g. Imran Ali"
            />

            <Input
              label="Location on Site"
              value={visitLocation}
              onChangeText={setVisitLocation}
              placeholder="e.g. Pit 2 North Shear"
            />

            <Input
              label="Notes & Geological Readings"
              value={visitNotes}
              onChangeText={setVisitNotes}
              placeholder="Observations, RQD, weather, etc."
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setVisitModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save Visit"
                onPress={handleLogVisit}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: UPLOAD DOCUMENT */}
      <Modal
        visible={docModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDocModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Exploration File</Text>
              <TouchableOpacity onPress={() => setDocModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="File Name"
              value={docName}
              onChangeText={setDocName}
              placeholder="e.g. Geological_Model_3D.pdf"
              required
            />

            <Text style={styles.formLabel}>Category:</Text>
            <View style={styles.modePicker}>
              {DOC_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.modeBtn, docCategory === cat && styles.modeBtnActive]}
                  onPress={() => setDocCategory(cat)}
                >
                  <Text
                    style={[styles.modeBtnText, docCategory === cat && styles.modeBtnTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setDocModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Attach Document"
                onPress={handleUploadDoc}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: LINK AUTHORITY LETTER */}
      <Modal
        visible={letterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLetterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Government Letter</Text>
              <TouchableOpacity onPress={() => setLetterModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Letter Title"
              value={letterTitle}
              onChangeText={setLetterTitle}
              placeholder="e.g. Acceptance of Geological Report"
              required
            />

            <Input
              label="Official Letter Reference Number"
              value={letterRef}
              onChangeText={setLetterRef}
              placeholder="e.g. DMG/RAJ/2026/1420/ACC"
              required
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setLetterModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save & Link Letter"
                onPress={handleAddLetter}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.danger,
  },
  headerCard: {
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSizes.xxs - 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  stepperCard: {
    marginBottom: spacing.sm,
  },
  stepperHeader: {
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  stageIndicatorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  stepDotContainer: {
    alignItems: 'center',
    width: '13.5%',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  stepDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepDotCurrent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  stepDotNum: {
    fontSize: typography.fontSizes.xxs - 2,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
  },
  stepDotNumActive: {
    color: colors.white,
  },
  stepDotLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepDotLabelDone: {
    color: colors.textSecondary,
  },
  stepDotLabelActive: {
    color: colors.accent,
    fontWeight: typography.fontWeights.bold,
  },
  nextStepCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  nextStepHead: {
    marginBottom: spacing.xs,
  },
  nowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginBottom: 2,
  },
  nowBadgeText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  todoText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.semibold,
  },
  permissionNotice: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  handoverContent: {
    marginTop: spacing.xs,
  },
  stageForm: {
    gap: spacing.xs,
  },
  formLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pickerWrap: {
    gap: spacing.xs,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  radioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  radioSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  checkboxGrid: {
    gap: spacing.xs,
  },
  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  checkOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  checkBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  checkSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  stageActionBtn: {
    marginTop: spacing.xs,
  },
  workStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  workStatsText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  workStatsSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  stageBtnRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  flexBtn: {
    flex: 1,
  },
  modePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
  },
  modeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeBtnText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeights.bold,
  },
  checklistWrap: {
    gap: spacing.xs,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.xs + 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  checkItemLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  checkItemLabelDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  checkItemDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.success,
  },
  linkLetterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: colors.primary + '15',
    borderRadius: radius.xs,
  },
  linkLetterText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  invoiceStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  invoiceLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  invoiceVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.success + '15',
    borderRadius: radius.sm,
  },
  closedBannerTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.success,
  },
  closedBannerSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  tabContent: {
    marginTop: spacing.xs,
    paddingBottom: spacing.huge,
  },
  tabCard: {
    marginBottom: spacing.sm,
  },
  tabCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tabCardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  personRole: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  fieldTeamList: {
    marginTop: spacing.sm,
  },
  fieldTeamHeading: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  memberTag: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  memberTagText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  mutedText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  tasksHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  taskCard: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  taskCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  taskCheckBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskCheckBoxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  taskTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  taskTitleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  visitItem: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  visitDateBadge: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xs,
  },
  visitDay: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  visitMonth: {
    fontSize: typography.fontSizes.xxs - 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  visitDetails: {
    flex: 1,
  },
  visitActivity: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  visitAuthor: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  visitNotes: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  visitFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.xs,
    marginTop: 4,
  },
  fileNameText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textPrimary,
    flex: 1,
  },
  shareBtn: {
    padding: 2,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  docSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  shareToggle: {
    padding: 4,
  },
  docActionBtn: {
    padding: 4,
  },
  historyRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  historyText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
