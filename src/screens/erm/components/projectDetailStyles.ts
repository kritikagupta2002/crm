import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '../../../theme';

export const styles = StyleSheet.create({
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
