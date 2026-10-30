import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { SEEDED_ASSIGNMENTS, SEEDED_INVENTORY_ITEMS, calculateItemStock } from '../inventory/data';

/*
 * Inventory & Stock, as on the web CRM: the equipment, tools and consumables, who has what, and what
 * came back. Seeded items and assignments plus what was added or changed on this phone.
 */
const KEYS = { items: '@bgspl_inventory_items', assignments: '@bgspl_inventory_assignments' };
const today = () => new Date().toISOString().slice(0, 10);

interface InventoryContextType {
  items: any[];
  assignments: any[];
  canManage: boolean;
  createItem: (details: any) => any;
  updateItem: (id: string, patch: any) => any;
  assign: (details: any) => any;
  returnItem: (assignmentId: string, remarks?: string) => any;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

/* Seeded rows replaced by their edited copy, plus new ones. */
const merge = (seeded: any[], custom: any[]) => {
  const byId = new Map(custom.map((r) => [r.id, r]));
  return [...custom.filter((r) => !seeded.some((s) => s.id === r.id)), ...seeded.map((s) => byId.get(s.id) || s)];
};

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, canonicalRole } = useAuth();
  const userName = (session as any)?.name || '';
  const [customItems, setCustomItems] = useState<any[]>([]);
  const [customAssignments, setCustomAssignments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setCustomItems(JSON.parse((await AsyncStorage.getItem(KEYS.items)) || '[]'));
        setCustomAssignments(JSON.parse((await AsyncStorage.getItem(KEYS.assignments)) || '[]'));
      } catch {
        // a broken store starts from the seeds
      }
    })();
  }, []);

  const save = (key: string, value: any[]) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

  const assignments = useMemo(
    () => merge(SEEDED_ASSIGNMENTS, customAssignments).sort((a, b) => (b.assignedDate || '').localeCompare(a.assignedDate || '')),
    [customAssignments],
  );
  const items = useMemo(() => merge(SEEDED_INVENTORY_ITEMS, customItems).map((i) => calculateItemStock(i, assignments)), [customItems, assignments]);

  // As on the web: Super Admin, Director, Manager and Finance Master manage the stock.
  const canManage = ['super_admin', 'director', 'manager', 'finance_master'].includes(canonicalRole);
  const guard = () => {
    if (!canManage) throw new Error('You do not have permission to manage inventory.');
  };

  const putItem = (record: any) =>
    setCustomItems((prev) => {
      const next = prev.some((r) => r.id === record.id) ? prev.map((r) => (r.id === record.id ? record : r)) : [record, ...prev];
      save(KEYS.items, next);
      return next;
    });
  const putAssignment = (record: any) =>
    setCustomAssignments((prev) => {
      const next = prev.some((r) => r.id === record.id) ? prev.map((r) => (r.id === record.id ? record : r)) : [record, ...prev];
      save(KEYS.assignments, next);
      return next;
    });

  const createItem = useCallback(
    (d: any) => {
      guard();
      const name = d.name?.trim();
      if (!name) throw new Error('Item name is required.');
      if (!d.category) throw new Error('Category is required.');
      const quantity = Number(d.quantity);
      if (d.quantity === '' || !Number.isFinite(quantity) || quantity < 0) throw new Error('Quantity must be a number, 0 or more.');
      let assetId = d.assetId?.trim();
      if (assetId && items.some((i) => (i.assetId || '').toLowerCase() === assetId.toLowerCase())) throw new Error(`Asset ID "${assetId}" already exists.`);
      if (!assetId) assetId = `AST-${new Date().getFullYear()}-${String(items.length + 1).padStart(3, '0')}`;
      const record = {
        id: `INV-${Date.now()}`,
        assetId,
        name,
        category: d.category,
        description: d.description?.trim() || '',
        quantity,
        unit: d.unit || 'Nos',
        location: d.location || 'Jaipur Corporate HQ',
        purchaseDate: d.purchaseDate || '',
        purchaseCost: Number(d.purchaseCost) || 0,
        vendor: d.vendor?.trim() || '',
        remarks: d.remarks?.trim() || '',
        createdAt: new Date().toISOString(),
        createdBy: userName,
      };
      putItem(record);
      return record;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, userName, canManage],
  );

  const updateItem = useCallback(
    (id: string, patch: any) => {
      guard();
      const existing = items.find((i) => i.id === id);
      if (!existing) throw new Error('Inventory item not found.');
      if (patch.quantity !== undefined) {
        const q = Number(patch.quantity);
        if (!Number.isFinite(q) || q < 0) throw new Error('Quantity must be a number, 0 or more.');
        if (q < existing.assignedQuantity) throw new Error(`${existing.assignedQuantity} are out with the team; the quantity cannot go below that.`);
      }
      const { totalQuantity, assignedQuantity, availableQuantity, returnedQuantity, status, activeAssignmentsCount, totalAssignmentsCount, ...base } = existing;
      const record = { ...base, ...patch, quantity: patch.quantity !== undefined ? Number(patch.quantity) : base.quantity, updatedAt: new Date().toISOString(), updatedBy: userName };
      putItem(record);
      return record;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, userName, canManage],
  );

  const assign = useCallback(
    (d: any) => {
      guard();
      const item = items.find((i) => i.id === d.inventoryItemId);
      if (!item) throw new Error('Inventory item not found.');
      if (!d.employeeName) throw new Error('Choose who it goes to.');
      const quantity = Number(d.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantity must be more than 0.');
      if (quantity > item.availableQuantity) throw new Error(`Only ${item.availableQuantity} ${item.unit || 'units'} are in stock.`);
      const id = `ASG-${Date.now()}`;
      const record = {
        id,
        assignmentId: id,
        inventoryItemId: item.id,
        assetId: item.assetId,
        itemName: item.name,
        category: item.category,
        employeeId: d.employeeId || d.employeeName,
        employeeName: d.employeeName,
        quantity,
        unit: item.unit || 'Nos',
        assignedDate: d.assignedDate || today(),
        expectedReturnDate: d.expectedReturnDate || '',
        returnDate: null,
        status: 'Assigned',
        projectId: d.projectId || null,
        projectName: d.projectName || null,
        remarks: d.remarks?.trim() || '',
        assignedBy: userName,
        createdAt: new Date().toISOString(),
      };
      putAssignment(record);
      return record;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, userName, canManage],
  );

  const returnItem = useCallback(
    (assignmentId: string, remarks = '') => {
      guard();
      const a = assignments.find((x) => x.id === assignmentId);
      if (!a) throw new Error('Assignment not found.');
      if (a.status === 'Returned') throw new Error('This was already returned.');
      const record = { ...a, status: 'Returned', returnDate: today(), returnRemarks: remarks.trim(), returnedBy: userName, updatedAt: new Date().toISOString() };
      putAssignment(record);
      return record;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignments, userName, canManage],
  );

  const value = useMemo(
    () => ({ items, assignments, canManage, createItem, updateItem, assign, returnItem }),
    [items, assignments, canManage, createItem, updateItem, assign, returnItem],
  );
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside InventoryProvider');
  return ctx;
};
