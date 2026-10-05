import { useState } from 'react';
import { Alert } from 'react-native';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import {
  ERM_STAGES,
  COORDINATORS,
  TEAM_LEADS,
  SUBMISSION_MODES,
  DOC_CATEGORIES,
  WORK_SUGGESTIONS,
  canActOnErm,
} from '../../constants';
import { ProjectStageNumber } from '../../types';

export const useProjectDetail = (projectId: string, initialTab?: string) => {
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
  const initialTabIdx =
    initialTab === 'tasks'
      ? 1
      : initialTab === 'field'
      ? 2
      : initialTab === 'documents'
      ? 3
      : initialTab === 'history'
      ? 4
      : 0;
  const [activeTab, setActiveTab] = useState<number>(initialTabIdx);

  const [selectedCoord, setSelectedCoord] = useState<string>(
    project?.team?.coordinator || COORDINATORS[0].name
  );
  const [selectedLead, setSelectedLead] = useState<string>(
    project?.team?.teamLead || TEAM_LEADS[0].name
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    project?.team?.members || []
  );

  const [submissionDate, setSubmissionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [submissionMode, setSubmissionMode] = useState(SUBMISSION_MODES[0]);
  const [submissionAck, setSubmissionAck] = useState('');

  const [closureNote, setClosureNote] = useState(project?.closure?.note || '');

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [taskPriority, setTaskPriority] = useState<
    'Low' | 'Medium' | 'High' | 'Urgent'
  >('Medium');

  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitActivity, setVisitActivity] = useState(WORK_SUGGESTIONS[0]);
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [visitBy, setVisitBy] = useState(
    project?.team?.members?.[0] || 'Ajay Kumar'
  );
  const [visitLocation, setVisitLocation] = useState(
    project?.site?.split('·')?.[1]?.trim() || 'Pit 2 Drill Site'
  );
  const [visitNotes, setVisitNotes] = useState('');

  const [docModalVisible, setDocModalVisible] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState(DOC_CATEGORIES[0]);

  const [letterModalVisible, setLetterModalVisible] = useState(false);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterRef, setLetterRef] = useState('');
  const [letterStepKey, setLetterStepKey] = useState('');

  const currentStage = (project?.currentStage || 1) as ProjectStageNumber;
  const currentStageCfg = ERM_STAGES[Math.min(6, currentStage - 1)];
  const isActionPermitted = canActOnErm(
    role,
    currentStageCfg?.key || 'allocation'
  );

  const handleSaveCoordinator = async () => {
    if (!project || !selectedCoord) return;
    try {
      await setProjectTeam(project.id, { coordinator: selectedCoord });
      Alert.alert(
        'Coordinator Assigned',
        `${selectedCoord} assigned as Project Coordinator. Advanced to Stage 2: Planning.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveTeamPlan = async () => {
    if (!project) return;
    if (!selectedLead || selectedMembers.length === 0) {
      Alert.alert(
        'Incomplete',
        'Please select a Team Lead and at least one Field Team member.'
      );
      return;
    }
    try {
      await setProjectTeam(project.id, {
        teamLead: selectedLead,
        members: selectedMembers,
      });
      Alert.alert(
        'Plan Confirmed',
        `Team Lead ${selectedLead} and ${selectedMembers.length} field engineers assigned. Advanced to Stage 3: Task Execution.`
      );
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
    if (!project) return;
    try {
      await submitToAuthority(project.id, {
        date: submissionDate,
        mode: submissionMode,
        ackNo: submissionAck || `${project.refBase || 'ACK'}/SUB`,
      });
      Alert.alert(
        'Submitted to Authority',
        `Filing confirmed via ${submissionMode}. Project progressed to Stage 5: Client Approval.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleApprovalStep = async (
    stepKey: string,
    currentVal: boolean
  ) => {
    if (!project) return;
    try {
      await setProjectApprovalStep(project.id, stepKey, !currentVal);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleClosureStep = async (
    stepKey: string,
    currentVal: boolean
  ) => {
    if (!project) return;
    try {
      await setClosureStep(project.id, stepKey, !currentVal);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCloseProject = async () => {
    if (!project) return;
    const steps = project.closure?.steps || [];
    const allDone = steps.every((s) => s.done);
    if (!allDone) {
      Alert.alert(
        'Incomplete Closure',
        'Please complete all 4 hand-over checklist steps before final closure.'
      );
      return;
    }
    try {
      await closeProject(project.id, closureNote);
      Alert.alert(
        'Project Closed',
        'Exploration archive sealed and project marked as Completed.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAdvanceInvoicing = async () => {
    if (!project) return;
    try {
      await updateProjectStage(project.id, 7);
      Alert.alert(
        'Invoicing Complete',
        'Tax invoice booked. Project moved to Stage 7: Project Closure.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddTask = async () => {
    if (!project) return;
    if (!taskTitle.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }
    try {
      await addProjectTask(project.id, {
        title: taskTitle.trim(),
        assigneeName:
          taskAssignee || project.team?.members?.[0] || 'Field Team',
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
    if (!project) return;
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
            name: `${visitActivity
              .toLowerCase()
              .replace(/\s+/g, '_')}_field_photo.jpg`,
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
    if (!project) return;
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
    if (!project) return;
    if (!letterTitle.trim() || !letterRef.trim()) {
      Alert.alert(
        'Required',
        'Please enter letter title and reference number.'
      );
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
      Alert.alert(
        'Letter Recorded',
        'Scanned authority letter linked to approval step.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return {
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
  };
};
