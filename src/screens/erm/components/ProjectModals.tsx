import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { Button, Input } from '../../../components/common';
import { colors } from '../../../theme';
import { styles } from './projectDetailStyles';

interface ProjectModalsProps {
  taskModalVisible: boolean;
  setTaskModalVisible: (v: boolean) => void;
  taskTitle: string;
  setTaskTitle: (v: string) => void;
  taskAssignee: string;
  setTaskAssignee: (v: string) => void;
  taskDueDate: string;
  setTaskDueDate: (v: string) => void;
  handleAddTask: () => void;

  visitModalVisible: boolean;
  setVisitModalVisible: (v: boolean) => void;
  visitActivity: string;
  setVisitActivity: (v: string) => void;
  visitDate: string;
  setVisitDate: (v: string) => void;
  visitBy: string;
  setVisitBy: (v: string) => void;
  visitLocation: string;
  setVisitLocation: (v: string) => void;
  visitNotes: string;
  setVisitNotes: (v: string) => void;
  handleLogVisit: () => void;

  docModalVisible: boolean;
  setDocModalVisible: (v: boolean) => void;
  docName: string;
  setDocName: (v: string) => void;
  docCategory: string;
  setDocCategory: (v: string) => void;
  docCategories: string[];
  handleUploadDoc: () => void;

  letterModalVisible: boolean;
  setLetterModalVisible: (v: boolean) => void;
  letterTitle: string;
  setLetterTitle: (v: string) => void;
  letterRef: string;
  setLetterRef: (v: string) => void;
  handleAddLetter: () => void;
}

export const ProjectModals: React.FC<ProjectModalsProps> = ({
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
  docCategories,
  handleUploadDoc,

  letterModalVisible,
  setLetterModalVisible,
  letterTitle,
  setLetterTitle,
  letterRef,
  setLetterRef,
  handleAddLetter,
}) => {
  return (
    <>
      <Modal statusBarTranslucent
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

      <Modal statusBarTranslucent
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

      <Modal statusBarTranslucent
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
              {docCategories.map((cat) => (
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

      <Modal statusBarTranslucent
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
    </>
  );
};
