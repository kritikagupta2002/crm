import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  Check,
  Plus,
  Landmark,
  ScrollText,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native';
import { Card, Button, Input } from '../../../components/common';
import { colors, spacing } from '../../../theme';
import { formatCurrencyLakhs as formatCurrency } from '../../../utils';
import { formatDate } from '../../../utils/date';
import {
  ERM_STAGES,
  ErmStageConfig,
  CLOSURE_STEPS,
  COORDINATORS,
  TEAM_LEADS,
  FIELD_MEMBERS,
  SUBMISSION_MODES,
} from '../../../constants';
import { Project, ProjectStageNumber } from '../../../types';
import { styles } from './projectDetailStyles';

interface ProjectStageLifecycleProps {
  project: Project;
  currentStage: ProjectStageNumber;
  currentStageCfg?: ErmStageConfig;
  isActionPermitted: boolean;
  role: string;
  selectedCoord: string;
  setSelectedCoord: (name: string) => void;
  handleSaveCoordinator: () => void;
  selectedLead: string;
  setSelectedLead: (name: string) => void;
  selectedMembers: string[];
  toggleMemberSelection: (name: string) => void;
  handleSaveTeamPlan: () => void;
  setTaskModalVisible: (v: boolean) => void;
  setVisitModalVisible: (v: boolean) => void;
  updateProjectStage: (id: string, stage: ProjectStageNumber) => void;
  submissionDate: string;
  setSubmissionDate: (v: string) => void;
  submissionMode: string;
  setSubmissionMode: (v: string) => void;
  submissionAck: string;
  setSubmissionAck: (v: string) => void;
  handleSubmitAuthority: () => void;
  handleToggleApprovalStep: (key: string, currentVal: boolean) => void;
  setLetterStepKey: (v: string) => void;
  setLetterTitle: (v: string) => void;
  setLetterRef: (v: string) => void;
  setLetterModalVisible: (v: boolean) => void;
  handleAdvanceInvoicing: () => void;
  handleToggleClosureStep: (key: string, currentVal: boolean) => void;
  closureNote: string;
  setClosureNote: (v: string) => void;
  handleCloseProject: () => void;
}

export const ProjectStageLifecycle: React.FC<ProjectStageLifecycleProps> = ({
  project,
  currentStage,
  currentStageCfg,
  isActionPermitted,
  role,
  selectedCoord,
  setSelectedCoord,
  handleSaveCoordinator,
  selectedLead,
  setSelectedLead,
  selectedMembers,
  toggleMemberSelection,
  handleSaveTeamPlan,
  setTaskModalVisible,
  setVisitModalVisible,
  updateProjectStage,
  submissionDate,
  setSubmissionDate,
  submissionMode,
  setSubmissionMode,
  submissionAck,
  setSubmissionAck,
  handleSubmitAuthority,
  handleToggleApprovalStep,
  setLetterStepKey,
  setLetterTitle,
  setLetterRef,
  setLetterModalVisible,
  handleAdvanceInvoicing,
  handleToggleClosureStep,
  closureNote,
  setClosureNote,
  handleCloseProject,
}) => {
  return (
    <Card style={styles.stepperCard}>
      <View style={styles.stepperHeader}>
        <View style={styles.stepperHeaderTop}>
          <Text style={styles.sectionHeading}>7-Stage Operational Lifecycle</Text>
          <View style={styles.stageProgressBadge}>
            <Text style={styles.stageProgressBadgeText}>
              {Math.round((currentStage / 7) * 100)}% Complete
            </Text>
          </View>
        </View>
        <Text style={styles.stageIndicatorText}>
          Stage {currentStage} of 7: {currentStageCfg?.label}
        </Text>
        <View style={styles.stepperProgressBarTrack}>
          <View
            style={[
              styles.stepperProgressBarFill,
              { width: `${Math.round((currentStage / 7) * 100)}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepperScrollContent}
      >
        {ERM_STAGES.map((st, i) => {
          const stageNum = (i + 1) as ProjectStageNumber;
          const isCompleted = stageNum < currentStage;
          const isCurrent = stageNum === currentStage;
          return (
            <View key={st.key} style={styles.stepItemWrapper}>
              <View style={styles.stepNodeRow}>
                {i > 0 && (
                  <View
                    style={[
                      styles.connectorLine,
                      styles.connectorLineLeft,
                      (isCompleted || isCurrent) && styles.connectorLineActive,
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.stepDot,
                    isCompleted && styles.stepDotDone,
                    isCurrent && styles.stepDotCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={13} color={colors.white} strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepDotNum,
                        isCurrent && styles.stepDotNumActive,
                      ]}
                    >
                      {stageNum}
                    </Text>
                  )}
                </View>
                {i < ERM_STAGES.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      styles.connectorLineRight,
                      isCompleted && styles.connectorLineActive,
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepDotLabel,
                  isCurrent && styles.stepDotLabelActive,
                  isCompleted && styles.stepDotLabelDone,
                ]}
                numberOfLines={2}
              >
                {st.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

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
                  rightIcon={<ArrowRight size={14} color={colors.primaryDark} />}
                  onPress={() => updateProjectStage(project.id, 4)}
                  variant="outline"
                  size="sm"
                  style={styles.readyDeliverableBtn}
                />
              </View>
            )}

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
                            <Text style={styles.checkItemDate}>Done on {formatDate(step.date)}</Text>
                          )}
                        </View>
                      </TouchableOpacity>

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

            {currentStage === 7 && (
              <View style={styles.stageForm}>
                {project.closure?.closedOn ? (
                  <View style={styles.closedBanner}>
                    <CheckCircle2 size={20} color={colors.success} />
                    <View>
                      <Text style={styles.closedBannerTitle}>
                        Project Closed on {formatDate(project.closure.closedOn)}
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
  );
};
