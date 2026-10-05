import React, { useState, useMemo } from 'react';
import {
  Network,
  Users,
  Search,
  Building2,
  MapPin,
  ChevronDown,
  ArrowDown,
  Briefcase,
  Shield,
  Filter,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  Crown,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useCrm } from '../../../../context/crm';
import { storage } from '@/core/storage/storage';

export const OrgChartPage = () => {
  const { user } = useAuth();
  const crmContext = useCrm();
  const crmRole = crmContext?.role || 'Super Admin';

  const [allEmployees] = useState(() => storage.getEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewMode, setViewMode] = useState('drilldown'); // 'drilldown' | 'full'

  // Determine permissions based on Phase 1 RBAC
  const isSuperOrDirector = ['Super Admin', 'Director', 'Finance Master'].includes(crmRole);
  const isManager = crmRole === 'Manager';
  const isEmployee = !isSuperOrDirector && !isManager; // 'Employee', 'Accounts Executive'

  // Map employeeId -> Employee
  const empMap = useMemo(() => {
    const map = new Map();
    allEmployees.forEach((emp) => {
      map.set(emp.employeeId, emp);
    });
    return map;
  }, [allEmployees]);

  // Map managerId -> Array of direct reportee Employees
  const reporteesMap = useMemo(() => {
    const map = new Map();
    allEmployees.forEach((emp) => {
      const mId = emp.employment?.managerId;
      if (mId) {
        if (!map.has(mId)) map.set(mId, []);
        map.get(mId).push(emp);
      }
    });
    return map;
  }, [allEmployees]);

  // Recursively find all reportees under a given manager ID
  const getAllDescendants = (mgrId) => {
    const result = [];
    const queue = [...(reporteesMap.get(mgrId) || [])];
    const visited = new Set();
    while (queue.length > 0) {
      const current = queue.shift();
      if (!visited.has(current.employeeId)) {
        visited.add(current.employeeId);
        result.push(current);
        const children = reporteesMap.get(current.employeeId) || [];
        queue.push(...children);
      }
    }
    return result;
  };

  // Identify current logged-in employee record
  const currentEmpRecord = useMemo(() => {
    if (user?.employeeId && empMap.has(user.employeeId)) {
      return empMap.get(user.employeeId);
    }
    // Fallback: match by email or name
    const match = allEmployees.find(
      (e) =>
        (e.contact?.workEmail && user?.email && e.contact.workEmail.toLowerCase() === user.email.toLowerCase()) ||
        (e.name && user?.name && e.name.toLowerCase() === user.name.toLowerCase())
    );
    if (match) return match;
    // Default fallback based on role
    if (isManager) return allEmployees.find((e) => e.employeeId === 'BGS-003') || allEmployees[0];
    if (isEmployee) return allEmployees.find((e) => e.employeeId === 'BGS-006') || allEmployees[0];
    return allEmployees[0];
  }, [allEmployees, empMap, user, isManager, isEmployee]);

  // Permitted employees that can be selected in dropdown/search
  const permittedEmployees = useMemo(() => {
    if (isSuperOrDirector) {
      return allEmployees;
    }
    if (isManager && currentEmpRecord) {
      const subordinates = getAllDescendants(currentEmpRecord.employeeId);
      return [currentEmpRecord, ...subordinates];
    }
    // Employee role: only self
    return currentEmpRecord ? [currentEmpRecord] : [];
  }, [isSuperOrDirector, isManager, currentEmpRecord, allEmployees]);

  // Selected employee ID state
  const [selectedEmpId, setSelectedEmpId] = useState(() => {
    if (isSuperOrDirector) {
      return allEmployees[0]?.employeeId || 'BGS-001';
    }
    return currentEmpRecord?.employeeId || allEmployees[0]?.employeeId;
  });

  const selectedEmployee = empMap.get(selectedEmpId) || currentEmpRecord || allEmployees[0];

  // Upstream reporting chain for the selected employee
  // e.g. Managing Director -> Senior Manager -> [Selected Employee]
  const upstreamChain = useMemo(() => {
    if (!selectedEmployee) return [];
    const chain = [];
    let curr = selectedEmployee;
    const visited = new Set([curr.employeeId]);
    while (curr && curr.employment?.managerId) {
      const mId = curr.employment.managerId;
      if (visited.has(mId)) break; // cycle prevention
      visited.add(mId);
      const mgr = empMap.get(mId);
      if (mgr) {
        chain.unshift(mgr); // root first
        curr = mgr;
      } else {
        break;
      }
    }
    return chain;
  }, [selectedEmployee, empMap]);

  // Direct reportees under the selected employee
  const directReportees = useMemo(() => {
    if (!selectedEmployee) return [];
    return reporteesMap.get(selectedEmployee.employeeId) || [];
  }, [selectedEmployee, reporteesMap]);

  // Filtered employees for dropdown search
  const filteredOptions = useMemo(() => {
    return permittedEmployees.filter((emp) => {
      if (departmentFilter !== 'all' && emp.employment?.department !== departmentFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          emp.name.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.employment?.designation?.toLowerCase().includes(q) ||
          emp.employment?.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permittedEmployees, departmentFilter, searchTerm]);

  // Unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    const depts = new Set();
    allEmployees.forEach((e) => {
      if (e.employment?.department) depts.add(e.employment.department);
    });
    return Array.from(depts);
  }, [allEmployees]);

  // Card component for rendering an employee node in the tree
  const EmployeeNode = ({ emp, isSelected = false, roleLabel, canDrill = true }) => {
    const isRoot = !emp.employment?.managerId || emp.employment?.managerName === 'Board of Directors';
    const reporteeCount = (reporteesMap.get(emp.employeeId) || []).length;
    const isPermittedToSelect = permittedEmployees.some((p) => p.employeeId === emp.employeeId);

    return (
      <div
        onClick={() => {
          if (canDrill && isPermittedToSelect && emp.employeeId !== selectedEmployee.employeeId) {
            setSelectedEmpId(emp.employeeId);
          }
        }}
        className={`group relative rounded-2xl p-4 transition-all duration-200 ${
          isSelected
            ? 'bg-gradient-to-b from-white to-amber-50/60 dark:from-[#1A2533] dark:to-[#223348] border-2 border-amber-500 shadow-md scale-102 ring-4 ring-amber-500/10'
            : 'bg-white dark:bg-[#131E2B] border border-slate-200/90 dark:border-[#223347] hover:border-teal-500/60 dark:hover:border-teal-400/60 hover:shadow-xs'
        } ${isPermittedToSelect && canDrill ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ minWidth: '260px', maxWidth: '320px' }}
      >
        {/* Role / Hierarchy Tag Header */}
        {(roleLabel || isRoot) && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/60">
            {roleLabel ? (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                  isSelected
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700'
                    : isRoot
                    ? 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {roleLabel}
              </span>
            ) : <span />}
            {isRoot && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Executive</span>
              </span>
            )}
          </div>
        )}

        {/* Top details */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
              isSelected
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800'
            }`}
          >
            {emp.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {emp.name}
            </h4>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
              {emp.employment?.designation}
            </p>
            <p className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-medium">
              {emp.employeeId}
            </p>
          </div>
        </div>

        {/* Meta / Department & Location */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{emp.employment?.department}</span>
          </div>
          {emp.employment?.workLocation && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{emp.employment.workLocation}</span>
            </div>
          )}
        </div>

        {/* Bottom footer chip */}
        <div className="mt-2.5 pt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {emp.employment?.status || 'Active'}
          </span>
          {reporteeCount > 0 ? (
            <span className="font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200/50 dark:border-teal-800/50">
              {reporteeCount} {reporteeCount === 1 ? 'Reportee' : 'Reportees'}
            </span>
          ) : (
            <span className="text-slate-400">Direct Contributor</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <PageHeader
        title="Organization Hierarchy & Chart"
        description="Visual employee command structure, multi-level reporting relationships, and organizational directory."
        breadcrumbs={[
          { label: 'Dashboard', path: '/hr' },
          { label: 'Organization', path: '/hr/organization' },
          { label: 'Hierarchy Chart' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isSuperOrDirector && (
              <div className="bg-slate-100 dark:bg-[#1A2430] p-1 rounded-xl flex items-center border border-slate-200 dark:border-[#253344] text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('drilldown')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    viewMode === 'drilldown'
                      ? 'bg-white dark:bg-[#0E1622] text-teal-800 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Selected Drilldown
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    viewMode === 'full'
                      ? 'bg-white dark:bg-[#0E1622] text-teal-800 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Full Org Tree
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Control Bar: Employee Selector & Filter */}
      <Card className="p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Employee Selection */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Focus Employee Hierarchy
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  ({permittedEmployees.length} accessible)
                </span>
              </h4>
              <p className="text-[10px] text-slate-400">
                {isEmployee
                  ? 'Role access: Viewing your personal reporting hierarchy'
                  : isManager
                  ? 'Role access: Viewing hierarchy of your branch & team members'
                  : 'Super Admin access: Full corporate organization visibility'}
              </p>
            </div>
          </div>

          {/* Right: Search & Select controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-48">
              <Search
                className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff..."
                style={{ paddingLeft: '34px' }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#253344] bg-slate-50 dark:bg-[#0E1622] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Department Filter (For Admins) */}
            {isSuperOrDirector && (
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#253344] bg-slate-50 dark:bg-[#0E1622] text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            )}

            {/* Direct Employee Select Dropdown */}
            <div className="relative flex-1 md:w-64 min-w-[220px]">
              <select
                value={selectedEmployee?.employeeId || ''}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-[#0E1622] text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
              >
                {filteredOptions.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId}) — {emp.employment?.designation}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {(searchTerm || departmentFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setDepartmentFilter('all');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Hierarchy Visualization Area */}
      {viewMode === 'drilldown' ? (
        <div className="bg-slate-50/70 dark:bg-[#0C131D]/80 border border-slate-200/80 dark:border-[#1E2C3D] rounded-3xl p-4 sm:p-8 overflow-x-auto min-h-[460px] flex flex-col items-center">
          {/* Header indicator */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-[#131E2B] px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-[#223347] shadow-2xs mb-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Showing reporting structure for:{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {selectedEmployee?.name}
            </strong>{' '}
            ({selectedEmployee?.employment?.designation})
          </div>

          {/* 1. UPSTREAM CHAIN: Superiors / Directors / Managers */}
          {upstreamChain.length > 0 && (
            <div className="flex flex-col items-center w-full">
              {upstreamChain.map((superior, idx) => (
                <div key={superior.employeeId} className="flex flex-col items-center">
                  <EmployeeNode
                    emp={superior}
                    roleLabel={
                      idx === 0 && (!superior.employment?.managerId || superior.employment?.managerName === 'Board of Directors')
                        ? 'Apex Leadership'
                        : idx === upstreamChain.length - 1
                        ? 'Reporting Manager'
                        : 'Superior Authority'
                    }
                  />
                  {/* Downward connector arrow */}
                  <div className="flex flex-col items-center my-2 text-teal-600 dark:text-teal-400">
                    <div className="w-0.5 h-6 bg-teal-400/60 dark:bg-teal-500/40" />
                    <ArrowDown className="w-4 h-4 -mt-1" />
                    <span className="text-[10px] font-semibold text-slate-400 -mt-0.5">reports to</span>
                    <div className="w-0.5 h-3 bg-teal-400/60 dark:bg-teal-500/40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* If the selected employee has no upstream manager (e.g. Managing Director) */}
          {upstreamChain.length === 0 && (
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Reports directly to: Board of Directors (Executive Leadership)
              </span>
              <div className="flex flex-col items-center my-2">
                <div className="w-0.5 h-6 bg-amber-400/60" />
                <ArrowDown className="w-4 h-4 -mt-1 text-amber-500" />
              </div>
            </div>
          )}

          {/* 2. THE SELECTED EMPLOYEE (CENTER FOCUS) */}
          <div className="relative my-2">
            <EmployeeNode
              emp={selectedEmployee}
              isSelected={true}
              roleLabel="Selected Employee"
              canDrill={false}
            />
          </div>

          {/* 3. DOWNSTREAM BRANCH: Direct Reportees */}
          {directReportees.length > 0 ? (
            <div className="flex flex-col items-center w-full mt-2">
              {/* Connector line from selected employee down to reportees */}
              <div className="flex flex-col items-center my-2 text-teal-600 dark:text-teal-400">
                <div className="w-0.5 h-4 bg-teal-400/60 dark:bg-teal-500/40" />
                <ArrowDown className="w-4 h-4 -mt-1" />
                <span className="text-[10px] font-semibold text-slate-400 -mt-0.5">
                  supervises ({directReportees.length})
                </span>
                <div className="w-0.5 h-4 bg-teal-400/60 dark:bg-teal-500/40" />
              </div>

              {/* Horizontal line bridging all reportees */}
              {directReportees.length > 1 && (
                <div className="w-full max-w-4xl h-0.5 bg-teal-400/40 dark:bg-teal-500/30 mb-4" />
              )}

              {/* Reportees Grid / Flex */}
              <div className="flex flex-wrap justify-center gap-4 w-full px-2">
                {directReportees.map((reportee) => (
                  <div key={reportee.employeeId} className="flex flex-col items-center">
                    <EmployeeNode
                      emp={reportee}
                      roleLabel="Direct Reportee"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  No direct reportees reporting to this position (Individual Contributor / Field Staff).
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full Organization Tree (Super Admin / Director mode) */
        <div className="bg-slate-50/70 dark:bg-[#0C131D]/80 border border-slate-200/80 dark:border-[#1E2C3D] rounded-3xl p-4 sm:p-8 overflow-x-auto min-h-[460px]">
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Executive Command & Full Corporate Hierarchy (Click any card to drill down)
            </span>
          </div>

          {/* Root: Managing Director (BGS-001) */}
          <div className="flex flex-col items-center">
            {allEmployees
              .filter((e) => !e.employment?.managerId || e.employment?.managerName === 'Board of Directors')
              .map((root) => {
                const level1Reportees = reporteesMap.get(root.employeeId) || [];
                return (
                  <div key={root.employeeId} className="flex flex-col items-center w-full">
                    <EmployeeNode
                      emp={root}
                      roleLabel="Managing Director & CEO"
                      isSelected={selectedEmployee.employeeId === root.employeeId}
                    />

                    <div className="flex flex-col items-center my-3 text-teal-600 dark:text-teal-400">
                      <div className="w-0.5 h-6 bg-teal-400/60 dark:bg-teal-500/40" />
                      <ArrowDown className="w-4 h-4 -mt-1" />
                    </div>

                    {/* Level 1: Heads of Departments & Direct Leads */}
                    <div className="w-full flex flex-wrap justify-center gap-6">
                      {level1Reportees.map((head) => {
                        const level2Reportees = reporteesMap.get(head.employeeId) || [];
                        return (
                          <div
                            key={head.employeeId}
                            className="flex flex-col items-center p-3 rounded-2xl bg-slate-100/50 dark:bg-[#121C28]/50 border border-slate-200/60 dark:border-[#1C2A3A]"
                          >
                            <EmployeeNode
                              emp={head}
                              roleLabel="Department Head / Lead"
                              isSelected={selectedEmployee.employeeId === head.employeeId}
                            />

                            {/* Level 2 Subordinates */}
                            {level2Reportees.length > 0 && (
                              <div className="flex flex-col items-center mt-2 w-full">
                                <div className="w-0.5 h-4 bg-teal-400/60 dark:bg-teal-500/40 my-1" />
                                <div className="flex flex-col gap-2.5 w-full">
                                  {level2Reportees.map((sub) => (
                                    <EmployeeNode
                                      key={sub.employeeId}
                                      emp={sub}
                                      roleLabel="Specialist / Contributor"
                                      isSelected={selectedEmployee.employeeId === sub.employeeId}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
