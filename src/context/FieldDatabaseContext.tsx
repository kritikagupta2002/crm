import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { SEEDED_FIELD_RECORDS, generateFieldRecordId } from '../fieldDatabase/data/fieldDatabase';
import { codeList, listHasDesc, setAddedCodes } from '../fieldDatabase/data/fieldFormats';
import { toISODate } from '../fieldDatabase/utils/date';

/*
 * The Field Database store, as on the web CRM: the seeded records in the client's formats plus what
 * was added or edited on this phone, the options added from the dropdowns, and the CRM certified values.
 */
const KEYS = { records: '@bgspl_field_records', codes: '@bgspl_field_codes', crm: '@bgspl_crm_values' };

export type FieldRecord = any;
export type CodeEntry = { list: string; code: string; desc?: string; addedBy?: string; addedOn?: string };

interface FieldDatabaseContextType {
  fieldRecords: FieldRecord[];
  createFieldRecord: (details: any) => FieldRecord;
  updateFieldRecord: (id: string, patch: any) => FieldRecord;
  fieldCodes: CodeEntry[];
  addFieldCode: (entry: { list: string; code: string; desc?: string }) => CodeEntry;
  crmValues: Record<string, any>;
  saveCrmValues: (crm: string, values: any) => void;
  /** Super Admin, Manager and Employee work in the Field Database (as on the web). */
  canManage: boolean;
  /** An employee sees and edits only their own records. */
  canEdit: (record: FieldRecord) => boolean;
  visible: (records: FieldRecord[]) => FieldRecord[];
}

const FieldDatabaseContext = createContext<FieldDatabaseContextType | undefined>(undefined);

const load = async (key: string, fallback: any) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const FieldDatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, canonicalRole } = useAuth();
  const userName: string = (session as any)?.name || '';
  const employeeId: string = (session as any)?.employeeId || '';

  const [custom, setCustom] = useState<FieldRecord[]>([]);
  const [codes, setCodes] = useState<CodeEntry[]>([]);
  const [crmValues, setCrmValues] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      setCustom(await load(KEYS.records, []));
      const added = await load(KEYS.codes, []);
      setAddedCodes(added);
      setCodes(added);
      setCrmValues(await load(KEYS.crm, {}));
    })();
  }, []);

  const persist = (key: string, value: any) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

  // Seeded records, replaced by their edited copy when there is one, newest first.
  const fieldRecords = useMemo(() => {
    const byId = new Map(custom.map((r) => [r.id, r]));
    const seeded = SEEDED_FIELD_RECORDS.map((r: any) => byId.get(r.id) || r);
    const extra = custom.filter((r) => !SEEDED_FIELD_RECORDS.some((s: any) => s.id === r.id));
    return [...extra, ...seeded].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [custom]);

  const canManage = canonicalRole === 'super_admin' || canonicalRole === 'manager' || canonicalRole === 'employee';
  const isMine = useCallback(
    (r: FieldRecord) => {
      const me = userName.trim().toLowerCase();
      const by = [r.createdBy, r.employeeName].map((x) => (x || '').trim().toLowerCase());
      return Boolean((me && by.includes(me)) || (employeeId && (r.employeeId || '').toLowerCase() === employeeId.toLowerCase()));
    },
    [userName, employeeId],
  );
  const visible = useCallback((records: FieldRecord[]) => (canonicalRole === 'employee' ? records.filter(isMine) : records), [canonicalRole, isMine]);
  const canEdit = useCallback((r: FieldRecord) => canManage && (canonicalRole !== 'employee' || isMine(r)), [canManage, canonicalRole, isMine]);

  const createFieldRecord = useCallback(
    (details: any) => {
      if (!canManage) throw new Error('You do not have permission to add field records.');
      if (!details.projectId) throw new Error('Choose the project.');
      const now = new Date().toISOString();
      const record = {
        id: details.id || generateFieldRecordId(details.section, fieldRecords),
        section: details.section,
        projectId: details.projectId,
        projectName: details.projectName || details.projectId,
        date: details.date,
        employeeId: details.employeeId || '',
        employeeName: details.employeeName || userName,
        metadata: {
          location: details.metadata?.location || '',
          sampleOrBoreholeId: details.metadata?.sampleOrBoreholeId || '',
          coordinates: { latitude: '', longitude: '', elevation: '', ...(details.metadata?.coordinates || {}) },
          remarks: details.metadata?.remarks || '',
        },
        data: details.data || {},
        status: details.status || 'Submitted',
        createdAt: now,
        updatedAt: now,
        createdBy: userName,
        updatedBy: userName,
      };
      setCustom((prev) => {
        const next = [record, ...prev];
        persist(KEYS.records, next);
        return next;
      });
      return record;
    },
    [canManage, fieldRecords, userName],
  );

  const updateFieldRecord = useCallback(
    (id: string, patch: any) => {
      const existing = fieldRecords.find((r) => r.id === id);
      if (!existing) throw new Error('Field record not found.');
      if (!canEdit(existing)) throw new Error('You can only edit your own field records.');
      const merged = {
        ...existing,
        ...patch,
        metadata: {
          ...existing.metadata,
          ...(patch.metadata || {}),
          coordinates: { ...(existing.metadata?.coordinates || {}), ...(patch.metadata?.coordinates || {}) },
        },
        data: { ...existing.data, ...(patch.data || {}) },
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
      };
      setCustom((prev) => {
        const next = prev.some((r) => r.id === id) ? prev.map((r) => (r.id === id ? merged : r)) : [merged, ...prev];
        persist(KEYS.records, next);
        return next;
      });
      return merged;
    },
    [fieldRecords, canEdit, userName],
  );

  const addFieldCode = useCallback(
    ({ list, code, desc }: { list: string; code: string; desc?: string }) => {
      if (!canManage) throw new Error('You do not have permission to add options.');
      const value = code?.trim();
      const meaning = desc?.trim();
      if (!value) throw new Error('Enter the new option.');
      if (listHasDesc(list) && !meaning) throw new Error('Enter what the code means.');
      if (codeList(list).some((c: any) => c.code.toLowerCase() === value.toLowerCase())) throw new Error(`"${value}" is already in the list.`);
      const entry: CodeEntry = { list, code: value, ...(meaning ? { desc: meaning } : {}), addedBy: userName, addedOn: toISODate(new Date()) };
      const next = [...codes, entry];
      setAddedCodes(next); // so the dropdown that added it can pick it (and fill its meaning) at once
      setCodes(next);
      persist(KEYS.codes, next);
      return entry;
    },
    [canManage, codes, userName],
  );

  const saveCrmValues = useCallback(
    (crm: string, values: any) => {
      if (!canManage || canonicalRole === 'employee') throw new Error('You do not have permission to change CRM values.');
      if (!crm) throw new Error('Choose the CRM.');
      setCrmValues((prev) => {
        const next = { ...prev, [crm]: values };
        persist(KEYS.crm, next);
        return next;
      });
    },
    [canManage, canonicalRole],
  );

  const value = useMemo(
    () => ({ fieldRecords, createFieldRecord, updateFieldRecord, fieldCodes: codes, addFieldCode, crmValues, saveCrmValues, canManage, canEdit, visible }),
    [fieldRecords, createFieldRecord, updateFieldRecord, codes, addFieldCode, crmValues, saveCrmValues, canManage, canEdit, visible],
  );

  return <FieldDatabaseContext.Provider value={value}>{children}</FieldDatabaseContext.Provider>;
};

export const useFieldDatabase = () => {
  const ctx = useContext(FieldDatabaseContext);
  if (!ctx) throw new Error('useFieldDatabase must be used inside FieldDatabaseProvider');
  return ctx;
};
