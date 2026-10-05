import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input } from '../../components';
import { GovtDocument } from '../../types';
import {
  FileText,
  FileScan,
  ShieldCheck,
  ShieldAlert,
  FolderLock,
  Share2,
  Truck,
  PackageCheck,
  CheckCircle2,
  Check,
  RotateCcw,
  Upload,
  Link2,
  HardDrive,
  Eye,
  MessageCircle,
  Clock,
  ChevronDown,
  AlertCircle,
  X,
} from 'lucide-react-native';
import {
  DISPATCH_MODES,
  RESCAN_REASONS,
  STAGE_TONE,
  DISPATCH_TONE,
  accessLabel,
  verifyBlock,
  originalNeeded,
} from '../../constants';

const STEPS = [
  { label: 'Filed', test: () => true },
  { label: 'Verified', test: (d: GovtDocument) => d.record.verify?.status === 'Verified' },
  { label: 'Access set', test: (d: GovtDocument) => Boolean(d.record.access) },
  { label: 'Shared', test: (d: GovtDocument) => Boolean(d.record.access && (!d.record.access.client || d.letter.sharedOn)) },
  {
    label: 'Original',
    test: (d: GovtDocument) =>
      Boolean(d.record.access && ['Not needed', 'Dispatched', 'Received'].includes(d.record.dispatch?.status ?? 'Not needed')),
  },
];

export const DocumentDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { docId } = route.params || {};
  const {
    govtDocuments,
    scanInbox,
    vendors,
    verifyGovtDocument,
    replaceDocScan,
    linkGovtDocument,
    authorizeGovtDocument,
    shareGovtDocument,
    requestGovtDocumentDispatch,
    dispatchGovtDocument,
    receiveGovtDocument,
  } = useCrm();
  const { session } = useAuth();
  const currentUserName = (session as any)?.name || (session as any)?.contactPerson || 'Active User';
  const currentUserId = (session as any)?.employeeId || 'emp-001';

  const doc = govtDocuments.find((d) => d.id === docId);

  const [showEditLinks, setShowEditLinks] = useState(false);
  const [leaseNo, setLeaseNo] = useState(doc?.record.links?.leaseNo || '');
  const [vendorId, setVendorId] = useState(doc?.record.links?.vendorId || '');

  const [rescanReason, setRescanReason] = useState<string>(RESCAN_REASONS[0]);
  const [rescanNote, setRescanNote] = useState<string>('');
  const [isRescanFormOpen, setIsRescanFormOpen] = useState(false);

  const [authClient, setAuthClient] = useState<boolean>(doc?.kind !== 'Circular');
  const [authVendor, setAuthVendor] = useState<boolean>(false);
  const [authOriginal, setAuthOriginal] = useState<boolean>(doc ? originalNeeded(doc.kind) : false);

  const [dispatchMode, setDispatchMode] = useState<string>(DISPATCH_MODES[0]);
  const [docketNumber, setDocketNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);

  const [receivedBy, setReceivedBy] = useState(doc?.lead.contactPerson || '');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!doc) {
    return (
      <View style={styles.container}>
        <AppHeader title="Document" showBack onBack={() => navigation.goBack()} />
        <View style={styles.notFound}>

          <Text style={styles.notFoundText}>Document record not found.</Text>
          <Button title="Go Back" variant="primary" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const blockedReason = verifyBlock(doc, currentUserName);

  const handleVerify = async () => {
    if (blockedReason) {
      Alert.alert(
        'Four-Eyes Principle Security Guard',
        'Compliance Rule: The employee who uploaded or filed this scan cannot verify it. Another authorized officer or director must perform physical verification.'
      );
      return;
    }
    try {
      await verifyGovtDocument(doc.id, { ok: true }, currentUserId, currentUserName);
      Alert.alert('Verified', 'Document scan successfully authenticated against physical original.');
    } catch (e: any) {
      Alert.alert('Verification Error', e.message);
    }
  };

  const handleSendForRescan = async () => {
    try {
      await verifyGovtDocument(
        doc.id,
        { ok: false, reason: rescanReason, note: rescanNote.trim() },
        currentUserId,
        currentUserName
      );
      setIsRescanFormOpen(false);
      Alert.alert('Rescan Requested', 'Scan rejected and returned to filing queue for physical rescan.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReplaceWithScan = async (scanId?: string) => {
    try {
      if (scanId) {
        const scan = scanInbox.find((s) => s.id === scanId);
        await replaceDocScan(doc.id, { fileName: scan ? scan.name : 'Scanned copy', scanId }, currentUserName);
      } else {
        await replaceDocScan(doc.id, { fileName: `RES_${doc.letter.ref.replace(/[^A-Za-z0-9]/g, '_')}.pdf` }, currentUserName);
      }
      Alert.alert('Rescan Attached', 'Fresh copy attached. Document re-entered verification queue.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveAccess = async () => {
    try {
      await authorizeGovtDocument(
        doc.id,
        {
          client: authClient,
          vendor: authVendor && Boolean(doc.vendor),
          original: authClient && authOriginal,
        },
        currentUserName
      );
      Alert.alert('Access Configured', 'Access rights set and recorded in audit log.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleShareWhatsApp = async () => {
    const msg = `Dear ${doc.lead.contactPerson}, we have received the ${doc.letter.title} (${doc.letter.ref}) from ${doc.letter.authority} for ${doc.project.name}. You can download it from your client portal. — Bansal Geo Team`;
    const url = `whatsapp://send?phone=${doc.lead.phone || ''}&text=${encodeURIComponent(msg)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
      await shareGovtDocument(doc.id, 'WhatsApp', currentUserName);
      Alert.alert('Shared', 'Document marked as shared with client on WhatsApp.');
    } catch (e: any) {
      await shareGovtDocument(doc.id, 'WhatsApp', currentUserName);
      Alert.alert('Shared', 'Document marked as shared.');
    }
  };

  const handleMarkShared = async () => {
    try {
      await shareGovtDocument(doc.id, 'marked', currentUserName);
      Alert.alert('Updated', 'Document marked as shared with client.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDispatch = async () => {
    if (!docketNumber.trim() && dispatchMode !== 'By hand') {
      Alert.alert('Docket Required', 'Please enter docket or waybill tracking number.');
      return;
    }
    try {
      await dispatchGovtDocument(
        doc.id,
        {
          mode: dispatchMode,
          docket: docketNumber.trim() || 'By hand messenger',
          on: dispatchDate,
        },
        currentUserName
      );
      Alert.alert('Dispatch Recorded', 'Physical consignment logged into Dispatch Register.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReceive = async () => {
    if (!receivedBy.trim()) {
      Alert.alert('Recipient Required', 'Please enter the name of the person who received the document.');
      return;
    }
    try {
      await receiveGovtDocument(
        doc.id,
        {
          receivedBy: receivedBy.trim(),
          on: receivedDate,
        },
        currentUserName
      );
      Alert.alert('Delivery Acknowledged', 'Original marked as received by client.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveLinks = async () => {
    try {
      await linkGovtDocument(
        doc.id,
        {
          leaseNo: leaseNo.trim(),
          vendorId: vendorId || undefined,
        },
        currentUserName
      );
      setShowEditLinks(false);
      Alert.alert('Links Updated', 'Lease number and vendor associations updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={doc.letter.ref}
        subtitle={`${doc.kind} • ${doc.lead.company}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <View style={styles.titleRow}>
            <StatusBadge
              status={doc.rescan ? 'Rescan needed' : doc.stage}
              size="small"
            />
            <Text style={styles.kindBadge}>{doc.kind}</Text>
            <Text style={styles.dateText}>Dated {doc.letter.date}</Text>
          </View>
          <Text style={styles.docMainTitle}>{doc.letter.title}</Text>
          <Text style={styles.authorityText}>Issuing Authority: {doc.letter.authority || 'Government Body'}</Text>
        </Card>

        <Card style={styles.stepperCard}>
          <Text style={styles.stepperTitle}>Lifecycle & Custody Flow</Text>
          <View style={styles.stepperRow}>
            {STEPS.map((s, idx) => {
              const isDone = s.test(doc);
              const isCurrent = !isDone && STEPS.slice(0, idx).every((prev) => prev.test(doc));

              return (
                <View key={s.label} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      isDone && styles.stepDotDone,
                      isCurrent && styles.stepDotCurrent,
                    ]}
                  >
                    {isDone ? (
                      <Check size={10} color={colors.text.inverse} strokeWidth={3} />
                    ) : (
                      <Text style={[styles.stepNum, isCurrent && styles.stepNumCurrent]}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isDone && styles.stepLabelDone,
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.fileCard}>
          <View style={styles.fileIconWrap}>
            <FileScan size={22} color={colors.primary} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{doc.nas.split('\\').pop()}</Text>
            <View style={styles.nasRow}>
              <HardDrive size={11} color={colors.text.tertiary} />
              <Text style={styles.nasText} numberOfLines={1}>{doc.nas}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => setShowPreviewModal(true)}
          >
            <Eye size={16} color={colors.primary} />
            <Text style={styles.previewBtnText}>Inspect</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.actionCard}>
          {doc.rescan ? (
            <View style={styles.actionSection}>
              <View style={styles.actionHeadRow}>
                <RotateCcw size={18} color={colors.semantic.danger} />
                <Text style={styles.actionHeadTitle}>Rescan Required</Text>
              </View>
              <View style={styles.rescanReasonBox}>
                <Text style={styles.rescanReasonTitle}>
                  {doc.record.verify?.reason || 'Document unreadable'}
                </Text>
                {Boolean(doc.record.verify?.note) && (
                  <Text style={styles.rescanReasonNote}>{doc.record.verify?.note}</Text>
                )}
                <Text style={styles.rescanMeta}>
                  Requested by {doc.record.verify?.by} on {doc.record.verify?.at?.slice(0, 10)}
                </Text>
              </View>

              <Text style={styles.actionInstruction}>
                Attach the corrected physical scan from the Scanner Inbox or upload directly:
              </Text>

              {scanInbox.length > 0 ? (
                <View style={styles.scanSelectWrap}>
                  <Text style={styles.inputLabel}>Available Scans in NAS Inbox:</Text>
                  {scanInbox.slice(0, 2).map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.scanChoiceRow}
                      onPress={() => handleReplaceWithScan(s.id)}
                    >
                      <FileScan size={16} color={colors.primary} />
                      <Text style={styles.scanChoiceName}>{s.name}</Text>
                      <Text style={styles.scanChoiceAction}>Use This Scan</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Button
                title="Simulate Ingest New Scan"
                variant="primary"
                icon={<Upload size={16} color={colors.text.inverse} />}
                onPress={() => handleReplaceWithScan()}
              />
            </View>
          ) : doc.stage === 'To verify' ? (
            <View style={styles.actionSection}>
              <View style={styles.actionHeadRow}>
                <ShieldCheck size={18} color={colors.primary} />
                <Text style={styles.actionHeadTitle}>Step 2: Physical Verification</Text>
              </View>
              <Text style={styles.actionInstruction}>
                Cross-check the digitized scan against the physical original paper letter in custody. Ensure all pages, signatures, and stamps are legible.
              </Text>

              {blockedReason ? (
                <View style={styles.fourEyesBlockBox}>
                  <ShieldAlert size={24} color={colors.semantic.danger} />
                  <View style={styles.fourEyesBlockTextWrap}>
                    <Text style={styles.fourEyesBlockTitle}>4-Eyes Principle Violation Guard</Text>
                    <Text style={styles.fourEyesBlockDesc}>{blockedReason}</Text>
                  </View>
                </View>
              ) : (
                <>
                  {!isRescanFormOpen ? (
                    <View style={styles.btnRow}>
                      <Button
                        title="Verify Against Original"
                        variant="primary"
                        onPress={handleVerify}
                        icon={<ShieldCheck size={16} color={colors.text.inverse} />}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Send for Rescan"
                        variant="secondary"
                        onPress={() => setIsRescanFormOpen(true)}
                        icon={<RotateCcw size={16} color={colors.text.primary} />}
                        style={{ flex: 1 }}
                      />
                    </View>
                  ) : (
                    <View style={styles.rescanForm}>
                      <Text style={styles.inputLabel}>Select What Is Wrong:</Text>
                      {RESCAN_REASONS.map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[
                            styles.reasonRadio,
                            rescanReason === r && styles.reasonRadioActive,
                          ]}
                          onPress={() => setRescanReason(r)}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              rescanReason === r && styles.radioCircleActive,
                            ]}
                          />
                          <Text style={styles.radioText}>{r}</Text>
                        </TouchableOpacity>
                      ))}

                      <Input
                        label="Note for Scanner Operator"
                        placeholder="e.g. Page 2 is missing the bottom seal..."
                        value={rescanNote}
                        onChangeText={setRescanNote}
                        multiline
                        numberOfLines={2}
                      />

                      <View style={styles.btnRow}>
                        <Button
                          title="Cancel"
                          variant="secondary"
                          onPress={() => setIsRescanFormOpen(false)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          title="Confirm Rescan Request"
                          variant="danger"
                          onPress={handleSendForRescan}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          ) : doc.stage === 'To authorize' ? (
            <View style={styles.actionSection}>
              <View style={styles.actionHeadRow}>
                <FolderLock size={18} color={colors.primary} />
                <Text style={styles.actionHeadTitle}>Step 3: Portal Access & Authorization</Text>
              </View>
              <Text style={styles.actionInstruction}>
                Specify access boundaries for client and subcontractor portals:
              </Text>

              <View style={styles.accessCheckList}>
                <View style={[styles.accessCheckRow, styles.accessCheckRowDisabled]}>
                  <View style={[styles.checkSquare, styles.checkSquareActive]}>
                    <Check size={12} color={colors.text.inverse} />
                  </View>
                  <View style={styles.checkTextWrap}>
                    <Text style={styles.checkTitle}>Office Internal Team</Text>
                    <Text style={styles.checkSub}>Always authorized for internal review</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.accessCheckRow}
                  onPress={() => setAuthClient(!authClient)}
                >
                  <View style={[styles.checkSquare, authClient && styles.checkSquareActive]}>
                    {authClient && <Check size={12} color={colors.text.inverse} />}
                  </View>
                  <View style={styles.checkTextWrap}>
                    <Text style={styles.checkTitle}>Client Portal ({doc.lead.company})</Text>
                    <Text style={styles.checkSub}>Permits client to view and download digitally</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accessCheckRow, !doc.vendor && styles.accessCheckRowDisabled]}
                  onPress={() => doc.vendor && setAuthVendor(!authVendor)}
                >
                  <View
                    style={[
                      styles.checkSquare,
                      authVendor && Boolean(doc.vendor) && styles.checkSquareActive,
                    ]}
                  >
                    {authVendor && Boolean(doc.vendor) && (
                      <Check size={12} color={colors.text.inverse} />
                    )}
                  </View>
                  <View style={styles.checkTextWrap}>
                    <Text style={styles.checkTitle}>
                      Vendor Portal {doc.vendor ? `(${doc.vendor.name})` : '(No vendor linked)'}
                    </Text>
                    <Text style={styles.checkSub}>
                      {doc.vendor
                        ? 'Permits subcontractor access in My Documents'
                        : 'Link a vendor under Linked Metadata to enable'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accessCheckRow, !authClient && styles.accessCheckRowDisabled]}
                  onPress={() => authClient && setAuthOriginal(!authOriginal)}
                >
                  <View
                    style={[
                      styles.checkSquare,
                      authOriginal && authClient && styles.checkSquareActive,
                    ]}
                  >
                    {authOriginal && authClient && (
                      <Check size={12} color={colors.text.inverse} />
                    )}
                  </View>
                  <View style={styles.checkTextWrap}>
                    <Text style={styles.checkTitle}>Send Physical Paper Original</Text>
                    <Text style={styles.checkSub}>Enters document into Dispatch Register</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Button title="Save Access Permissions" variant="primary" onPress={handleSaveAccess} />
            </View>
          ) : doc.stage === 'To share' ? (
            <View style={styles.actionSection}>
              <View style={styles.actionHeadRow}>
                <Share2 size={18} color={colors.semantic.info} />
                <Text style={styles.actionHeadTitle}>Step 4: Client Notification</Text>
              </View>
              <Text style={styles.actionInstruction}>
                The document is published in {doc.lead.company}’s portal. Notify {doc.lead.contactPerson}:
              </Text>

              <View style={styles.btnRow}>
                <Button
                  title="Notify on WhatsApp"
                  variant="primary"
                  onPress={handleShareWhatsApp}
                  icon={<MessageCircle size={16} color={colors.text.inverse} />}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Mark as Shared"
                  variant="secondary"
                  onPress={handleMarkShared}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : doc.stage === 'To dispatch' ? (
            <View style={styles.actionSection}>
              <View style={styles.actionHeadRow}>
                <Truck size={18} color={colors.semantic.info} />
                <Text style={styles.actionHeadTitle}>Step 5: Record Physical Dispatch</Text>
              </View>
              <Text style={styles.actionInstruction}>
                Deliver original to: {doc.lead.contactPerson}, {doc.lead.company} ({doc.lead.location})
              </Text>

              <Text style={styles.inputLabel}>Courier / Transit Mode:</Text>
              <View style={styles.modePillRow}>
                {DISPATCH_MODES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modePill, dispatchMode === m && styles.modePillActive]}
                    onPress={() => setDispatchMode(m)}
                  >
                    <Text style={[styles.modePillText, dispatchMode === m && styles.modePillTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label={dispatchMode === 'By hand' ? 'Carried By (Messenger Name)' : 'Docket / Waybill No.'}
                placeholder={dispatchMode === 'By hand' ? 'e.g. Office Runner A. Kumar' : 'e.g. DTDC D40018873'}
                value={docketNumber}
                onChangeText={setDocketNumber}
              />

              <Input
                label="Dispatch Date (YYYY-MM-DD)"
                value={dispatchDate}
                onChangeText={setDispatchDate}
              />

              <Button
                title="Record Consignment Dispatch"
                variant="primary"
                icon={<Truck size={16} color={colors.text.inverse} />}
                onPress={handleDispatch}
              />
            </View>
          ) : doc.record.dispatch?.status === 'Dispatched' ? (
            <View style={styles.actionSection}>
              <View style={styles.actionHeadRow}>
                <PackageCheck size={18} color={colors.semantic.success} />
                <Text style={styles.actionHeadTitle}>Confirm Recipient Receipt</Text>
              </View>
              <Text style={styles.actionInstruction}>
                Consignment is in transit ({doc.record.dispatch.mode} • {doc.record.dispatch.docket}). Confirm receipt by client:
              </Text>

              <Input
                label="Received By (Name)"
                value={receivedBy}
                onChangeText={setReceivedBy}
              />

              <Input
                label="Receipt Date (YYYY-MM-DD)"
                value={receivedDate}
                onChangeText={setReceivedDate}
              />

              <Button
                title="Acknowledge Delivery"
                variant="primary"
                icon={<PackageCheck size={16} color={colors.text.inverse} />}
                onPress={handleReceive}
              />
            </View>
          ) : (
            <View style={styles.completedNotice}>
              <CheckCircle2 size={24} color={colors.semantic.success} />
              <View style={styles.completedTextWrap}>
                <Text style={styles.completedTitle}>All Lifecycle Steps Completed</Text>
                <Text style={styles.completedDesc}>
                  Verified, authorized, shared, and paper original archived.
                </Text>
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.metaCard}>
          <View style={styles.metaHeadRow}>
            <Text style={styles.metaSectionTitle}>Linked Metadata</Text>
            <TouchableOpacity
              style={styles.editLinksBtn}
              onPress={() => {
                setLeaseNo(doc.record.links?.leaseNo || '');
                setVendorId(doc.record.links?.vendorId || '');
                setShowEditLinks(true);
              }}
            >
              <Link2 size={14} color={colors.primary} />
              <Text style={styles.editLinksBtnText}>Edit Links</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaTable}>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Client</Text>
              <Text style={styles.metaVal}>{doc.lead.company}</Text>
            </View>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Project</Text>
              <Text style={styles.metaVal}>{doc.project.id} • {doc.project.name}</Text>
            </View>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Lease No.</Text>
              <Text style={styles.metaVal}>{doc.record.links?.leaseNo || '—'}</Text>
            </View>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Vendor</Text>
              <Text style={styles.metaVal}>
                {doc.vendor ? `${doc.vendor.name} (${doc.vendor.id})` : '—'}
              </Text>
            </View>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Filed By</Text>
              <Text style={styles.metaVal}>{doc.record.filedBy}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.metaCard}>
          <Text style={styles.metaSectionTitle}>Access & Original Summary</Text>
          <View style={styles.metaTable}>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Who can open</Text>
              <Text style={styles.metaVal}>
                {accessLabel(doc.record.access, doc.record.links, vendors)}
              </Text>
            </View>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Client Portal</Text>
              <Text style={styles.metaVal}>
                {!doc.record.access?.client
                  ? 'Not shared — Office only'
                  : doc.letter.sharedOn
                  ? `Shared ${doc.letter.sharedOn}`
                  : 'Published in portal (not notified)'}
              </Text>
            </View>
            <View style={styles.metaTableRow}>
              <Text style={styles.metaKey}>Paper Original</Text>
              <Text style={styles.metaVal}>
                {doc.record.dispatch?.status === 'Dispatched'
                  ? `In Transit (${doc.record.dispatch.mode} • ${doc.record.dispatch.docket})`
                  : doc.record.dispatch?.status === 'Received'
                  ? `Received by ${doc.record.dispatch.receivedBy} on ${doc.record.dispatch.receivedOn}`
                  : doc.record.dispatch?.status || 'Not needed'}
              </Text>
            </View>
          </View>
          {doc.stage === 'Done' && (!doc.record.dispatch || doc.record.dispatch.status === 'Not needed') && (
            <TouchableOpacity
              style={styles.requestDispatchBtn}
              onPress={() => requestGovtDocumentDispatch(doc.id, true, currentUserName)}
            >
              <Truck size={14} color={colors.primary} />
              <Text style={styles.requestDispatchBtnText}>Send physical original to client</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card style={styles.auditCard}>
          <Text style={styles.metaSectionTitle}>Chronological Audit Trail</Text>
          <View style={styles.timelineList}>
            {[...(doc.record.events || [])].reverse().map((ev, i) => (
              <View key={`${ev.at}-${i}`} style={styles.timelineItem}>
                <View style={styles.timelineDotWrap}>
                  <View style={[styles.timelineDot, i === 0 && styles.timelineDotActive]} />
                  {i < (doc.record.events || []).length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineText}>{ev.text}</Text>
                  <Text style={styles.timelineActor}>
                    {ev.by} • {ev.at?.slice(0, 10)} {ev.at ? new Date(ev.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      <Modal visible={showEditLinks} transparent animationType="slide" onRequestClose={() => setShowEditLinks(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalHeadTitle}>Edit Linked Metadata</Text>
              <TouchableOpacity onPress={() => setShowEditLinks(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Mining Lease No."
              placeholder="e.g. ML 17/2004"
              value={leaseNo}
              onChangeText={setLeaseNo}
            />

            <Text style={styles.inputLabel}>Subcontractor / Vendor on the work:</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: spacing.md }}>
              <TouchableOpacity
                style={[styles.vendorOption, !vendorId && styles.vendorOptionActive]}
                onPress={() => setVendorId('')}
              >
                <Text style={styles.vendorOptionText}>None</Text>
              </TouchableOpacity>
              {vendors.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vendorOption, vendorId === v.id && styles.vendorOptionActive]}
                  onPress={() => setVendorId(v.id)}
                >
                  <Text style={styles.vendorOptionText}>
                    {v.name} ({v.id})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.btnRow}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowEditLinks(false)} style={{ flex: 1 }} />
              <Button title="Save Links" variant="primary" onPress={handleSaveLinks} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPreviewModal} transparent animationType="fade" onRequestClose={() => setShowPreviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalHeadTitle}>Document Scan Preview</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.previewCanvas}>
              <FileText size={64} color={colors.primary} />
              <Text style={styles.previewDocTitle}>{doc.letter.title}</Text>
              <Text style={styles.previewDocRef}>{doc.letter.ref}</Text>
              <Text style={styles.previewDocMeta}>
                {doc.letter.pages || 2} Pages • High Resolution 300 DPI PDF
              </Text>
              <View style={styles.certifiedSeal}>
                <ShieldCheck size={18} color={colors.semantic.success} />
                <Text style={styles.certifiedSealText}>Bansal Geo Authenticated NAS Archival</Text>
              </View>
            </View>

            <Button title="Done" variant="primary" onPress={() => setShowPreviewModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notFound: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  notFoundText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  headerCard: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  kindBadge: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  dateText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginLeft: 'auto',
  },
  docMainTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  authorityText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  stepperCard: {
    gap: spacing.sm,
  },
  stepperTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: colors.semantic.success,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  stepNumCurrent: {
    color: colors.text.inverse,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: colors.semantic.success,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  nasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nasText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}12`,
  },
  previewBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  actionCard: {
    gap: spacing.sm,
  },
  actionSection: {
    gap: spacing.sm,
  },
  actionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionHeadTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  actionInstruction: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fourEyesBlockBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.semantic.danger}12`,
    borderWidth: 1,
    borderColor: colors.semantic.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  fourEyesBlockTextWrap: {
    flex: 1,
  },
  fourEyesBlockTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.semantic.danger,
    marginBottom: 2,
  },
  fourEyesBlockDesc: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 18,
  },
  rescanReasonBox: {
    backgroundColor: `${colors.semantic.danger}10`,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.danger,
    gap: 2,
  },
  rescanReasonTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.semantic.danger,
  },
  rescanReasonNote: {
    ...typography.caption,
    color: colors.text.primary,
  },
  rescanMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
  },
  scanSelectWrap: {
    gap: spacing.xs,
  },
  scanChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
  },
  scanChoiceName: {
    ...typography.caption,
    flex: 1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  scanChoiceAction: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  rescanForm: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  reasonRadio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  reasonRadioActive: {},
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  radioCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  accessCheckList: {
    gap: spacing.sm,
  },
  accessCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  accessCheckRowDisabled: {
    opacity: 0.5,
  },
  checkSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkSquareActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkTextWrap: {
    flex: 1,
  },
  checkTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  checkSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  modePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  modePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },

  modePillActive: {
    backgroundColor: colors.primary,
  },
  modePillText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  modePillTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  completedTextWrap: {
    flex: 1,
  },
  completedTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  completedDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metaCard: {
    gap: spacing.xs,
  },
  metaHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaSectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  editLinksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editLinksBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  metaTable: {
    gap: spacing.xs,
  },
  metaTableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  metaKey: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 100,
  },
  metaVal: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  requestDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  requestDispatchBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  auditCard: {
    gap: spacing.sm,
  },
  timelineList: {
    paddingLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineDotWrap: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border.default,
    marginTop: 4,
  },

  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 2,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  timelineText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timelineActor: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalHeadTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  vendorOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
    marginBottom: 4,
  },
  vendorOptionActive: {
    backgroundColor: `${colors.primary}20`,
  },
  vendorOptionText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  previewCanvas: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
    gap: spacing.xs,
  },
  previewDocTitle: {
    ...typography.h4,
    textAlign: 'center',
    color: colors.text.primary,
  },
  previewDocRef: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  previewDocMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  certifiedSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.semantic.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },

  certifiedSealText: {
    fontSize: 11,
    color: colors.semantic.success,
    fontWeight: '700',
  },
});
