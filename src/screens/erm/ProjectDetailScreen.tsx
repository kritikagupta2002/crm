import React from 'react';
import { View, Text } from 'react-native';
import { ScreenContainer, AppHeader } from '../../components/common';
import { useProjectDetail } from './useProjectDetail';
import {
  styles,
  ProjectHeaderCard,
  ProjectStageLifecycle,
  ProjectTabs,
  ProjectModals,
} from './components';

interface ProjectDetailScreenProps {
  route: any;
  navigation: any;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { projectId, initialTab } = route?.params || {};
  const {
    project,
    role,
    tabOptions,
    activeTab,
    setActiveTab,
    currentStage,
    currentStageCfg,
    isActionPermitted,
    selectedCoord,
    setSelectedCoord,
    handleSaveCoordinator,
    selectedLead,
    setSelectedLead,
    selectedMembers,
    toggleMemberSelection,
    handleSaveTeamPlan,
    submissionDate,
    setSubmissionDate,
    submissionMode,
    setSubmissionMode,
    submissionAck,
    setSubmissionAck,
    handleSubmitAuthority,
    handleToggleApprovalStep,
    handleToggleClosureStep,
    closureNote,
    setClosureNote,
    handleCloseProject,
    handleAdvanceInvoicing,
    taskModalVisible,
    setTaskModalVisible,
    taskTitle,
    setTaskTitle,
    taskAssignee,
    setTaskAssignee,
    taskDueDate,
    setTaskDueDate,
    handleAddTask,
    visitModalVisible,
    setVisitModalVisible,
    visitActivity,
    setVisitActivity,
    visitDate,
    setVisitDate,
    visitBy,
    setVisitBy,
    visitLocation,
    setVisitLocation,
    visitNotes,
    setVisitNotes,
    handleLogVisit,
    docModalVisible,
    setDocModalVisible,
    docName,
    setDocName,
    docCategory,
    setDocCategory,
    handleUploadDoc,
    letterModalVisible,
    setLetterModalVisible,
    letterTitle,
    setLetterTitle,
    letterRef,
    setLetterRef,
    setLetterStepKey,
    handleAddLetter,
    updateProjectStage,
    updateProjectTask,
    toggleDocumentSharing,
  } = useProjectDetail(projectId, initialTab);

  if (!project) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader
          title="Project Details"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>Exploration Block not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

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
      <ProjectHeaderCard project={project} />

      <ProjectStageLifecycle
        project={project}
        currentStage={currentStage}
        currentStageCfg={currentStageCfg}
        isActionPermitted={isActionPermitted}
        role={role}
        selectedCoord={selectedCoord}
        setSelectedCoord={setSelectedCoord}
        handleSaveCoordinator={handleSaveCoordinator}
        selectedLead={selectedLead}
        setSelectedLead={setSelectedLead}
        selectedMembers={selectedMembers}
        toggleMemberSelection={toggleMemberSelection}
        handleSaveTeamPlan={handleSaveTeamPlan}
        setTaskModalVisible={setTaskModalVisible}
        setVisitModalVisible={setVisitModalVisible}
        updateProjectStage={updateProjectStage}
        submissionDate={submissionDate}
        setSubmissionDate={setSubmissionDate}
        submissionMode={submissionMode}
        setSubmissionMode={setSubmissionMode}
        submissionAck={submissionAck}
        setSubmissionAck={setSubmissionAck}
        handleSubmitAuthority={handleSubmitAuthority}
        handleToggleApprovalStep={handleToggleApprovalStep}
        setLetterStepKey={setLetterStepKey}
        setLetterTitle={setLetterTitle}
        setLetterRef={setLetterRef}
        setLetterModalVisible={setLetterModalVisible}
        handleAdvanceInvoicing={handleAdvanceInvoicing}
        handleToggleClosureStep={handleToggleClosureStep}
        closureNote={closureNote}
        setClosureNote={setClosureNote}
        handleCloseProject={handleCloseProject}
      />

      <ProjectTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabOptions={tabOptions}
        project={project}
        setTaskModalVisible={setTaskModalVisible}
        updateProjectTask={updateProjectTask}
        setVisitModalVisible={setVisitModalVisible}
        toggleDocumentSharing={toggleDocumentSharing}
        setDocModalVisible={setDocModalVisible}
      />

      <ProjectModals
        taskModalVisible={taskModalVisible}
        setTaskModalVisible={setTaskModalVisible}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskAssignee={taskAssignee}
        setTaskAssignee={setTaskAssignee}
        taskDueDate={taskDueDate}
        setTaskDueDate={setTaskDueDate}
        handleAddTask={handleAddTask}
        visitModalVisible={visitModalVisible}
        setVisitModalVisible={setVisitModalVisible}
        visitActivity={visitActivity}
        setVisitActivity={setVisitActivity}
        visitDate={visitDate}
        setVisitDate={setVisitDate}
        visitBy={visitBy}
        setVisitBy={setVisitBy}
        visitLocation={visitLocation}
        setVisitLocation={setVisitLocation}
        visitNotes={visitNotes}
        setVisitNotes={setVisitNotes}
        handleLogVisit={handleLogVisit}
        docModalVisible={docModalVisible}
        setDocModalVisible={setDocModalVisible}
        docName={docName}
        setDocName={setDocName}
        docCategory={docCategory}
        setDocCategory={setDocCategory}
        docCategories={['Report', 'Map', 'License', 'Assay', 'Other']}
        handleUploadDoc={handleUploadDoc}
        letterModalVisible={letterModalVisible}
        setLetterModalVisible={setLetterModalVisible}
        letterTitle={letterTitle}
        setLetterTitle={setLetterTitle}
        letterRef={letterRef}
        setLetterRef={setLetterRef}
        handleAddLetter={handleAddLetter}
      />
    </ScreenContainer>
  );
};
