import React, { useState, useEffect, useMemo } from 'react';
import { Award, TrendingUp, Star, Users, Search, Plus, CheckCircle2, Calendar, Eye, FileCheck, Download, Sparkles, ChevronDown, X, RotateCcw, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { performanceService } from '@/modules/employees/services/performance.service';
export const PerformanceRecordsPage = () => {
    const toast = useToast();
    const { user } = useAuth();
    const [appraisals, setAppraisals] = useState([]);
    const [selectedCycle, setSelectedCycle] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    // Modal States
    const [viewingAppraisal, setViewingAppraisal] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    // New Appraisal Form State
    const [formEmployeeId, setFormEmployeeId] = useState('BGS-006');
    const [formEmployeeName, setFormEmployeeName] = useState('Rohan Deshmukh');
    const [formDepartment, setFormDepartment] = useState('Geology & Mineral Exploration');
    const [formDesignation, setFormDesignation] = useState('Senior Exploration Geologist');
    const [formCycle, setFormCycle] = useState('Annual Appraisal FY 2026-27');
    const [formRating, setFormRating] = useState('Exceeds Expectations');
    const [formScore, setFormScore] = useState(4.5);
    const [formStrengths, setFormStrengths] = useState('');
    const [formAreas, setFormAreas] = useState('');
    const [formFeedback, setFormFeedback] = useState('');
    const [formPromotion, setFormPromotion] = useState(false);
    const loadData = async () => {
        setLoading(true);
        const data = await performanceService.getAppraisals();
        setAppraisals(data);
        setLoading(false);
    };
    useEffect(() => {
        loadData();
    }, []);
    // Filtered appraisals
    const filteredAppraisals = useMemo(() => {
        return appraisals.filter((a) => {
            const matchCycle = selectedCycle === 'all' || a.reviewCycle === selectedCycle;
            const matchDept = selectedDept === 'all' || a.department.toLowerCase().includes(selectedDept.toLowerCase());
            const matchSearch = !searchQuery ||
                a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.designation.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCycle && matchDept && matchSearch;
        });
    }, [appraisals, selectedCycle, selectedDept, searchQuery]);
    // Overall Statistics
    const stats = useMemo(() => {
        const total = appraisals.length;
        const avg = total > 0 ? (appraisals.reduce((acc, a) => acc + a.overallScore, 0) / total).toFixed(2) : '0';
        const top = appraisals.filter((a) => a.rating === 'Outstanding').length;
        const finalized = appraisals.filter((a) => a.status === 'HR Finalized').length;
        const finalizedPercent = total > 0 ? Math.round((finalized / total) * 100) : 0;
        return { total, avg, top, finalizedPercent };
    }, [appraisals]);
    const handleCreateAppraisal = async () => {
        if (!formEmployeeName || !formStrengths || !formFeedback) {
            toast.error('Please fill in required feedback and performance metrics.', 'Validation Error');
            return;
        }
        await performanceService.createAppraisal({
            employeeId: formEmployeeId,
            employeeName: formEmployeeName,
            department: formDepartment,
            designation: formDesignation,
            reviewCycle: formCycle,
            reviewerName: user?.name || 'Kritika Gupta (HR Head)',
            reviewerDesignation: user?.designation || 'Head - HR & Administration',
            overallScore: Number(formScore),
            goalsAchievementPercent: Math.round((Number(formScore) / 5) * 100),
            rating: formRating,
            status: 'HR Finalized',
            reviewDate: new Date().toLocaleDateString('en-CA'),
            goals: [
                { id: 'g-new-1', title: 'Operational Delivery & Precision', description: 'Core deliverables execution against project milestone', weightage: 50, targetScore: 5, achievedScore: Number(formScore) },
                { id: 'g-new-2', title: 'HSE & Corporate Compliance', description: 'Field safety protocols and regulatory documentation', weightage: 50, targetScore: 5, achievedScore: Number(formScore) },
            ],
            strengths: formStrengths,
            areasOfImprovement: formAreas || 'Continuous skill development in domain technologies.',
            managerFeedback: formFeedback,
            promotionRecommended: formPromotion,
            bonusMultiplier: formRating === 'Outstanding' ? 1.3 : formRating === 'Exceeds Expectations' ? 1.15 : 1.0,
        });
        toast.success(`Performance appraisal recorded for ${formEmployeeName}.`, 'Appraisal Finalized');
        setIsCreateModalOpen(false);
        // Reset form
        setFormStrengths('');
        setFormAreas('');
        setFormFeedback('');
        loadData();
    };
    const getRatingBadgeClass = (rating) => {
        switch (rating) {
            case 'Outstanding':
                return 'bg-amber-100 text-[#8F621A] dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/70 dark:border-amber-700/60';
            case 'Exceeds Expectations':
                return 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60';
            case 'Meets Expectations':
                return 'bg-slate-100 text-[#31485A] dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
            case 'Needs Improvement':
                return 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200';
            default:
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200';
        }
    };
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'HR Finalized':
                return 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/60';
            case 'Manager Review':
                return 'bg-amber-50 text-[#B07D27] dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60';
            case 'Self-Appraisal':
                return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60';
        }
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader title="Performance Records & Appraisals" description="Annual appraisal matrices, KPI goal evaluations, managerial reviews, and promotion recommendations." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Workforce', path: '/hr/employees' },
            { label: 'Performance Records' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4"/>}>
              Initiate Appraisal
            </Button>
          </div>}/>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard title="Average Score (Out of 5.0)" value={`${stats.avg} / 5.0`} icon={<Star className="w-5 h-5 text-[#C8943A]"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-[#C8943A] border border-amber-200/60" change="Strong Bench" changeType="increase" caption="Company-wide index"/>
        <StatCard title="Top Performers" value={`${stats.top} Staff`} icon={<Award className="w-5 h-5 text-teal-700"/>} iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 border border-teal-200/60" change="Outstanding" changeType="increase" caption="Rated 4.6+ score"/>
        <StatCard title="Appraisal Completion" value={`${stats.finalizedPercent}%`} icon={<CheckCircle2 className="w-5 h-5 text-teal-700"/>} iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 border border-teal-200/60" change="On Track" changeType="neutral" caption="HR finalized reviews"/>
        <StatCard title="Total Reviews Evaluated" value={`${stats.total} Records`} icon={<Users className="w-5 h-5 text-[#31485A] dark:text-slate-300"/>} iconBgColor="bg-slate-100 dark:bg-slate-800 text-[#31485A] border border-slate-200/60" change="Active Cycles" changeType="neutral" caption="All active divisions"/>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by employee name, BGS ID, or role..." className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs transition-all"/>
            {searchQuery && (<button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5" title="Clear search">
                <X className="w-3.5 h-3.5"/>
              </button>)}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cycle Filter */}
            <div className="relative min-w-[180px]">
              <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs transition-all">
                <option value="all">📅 All Review Cycles</option>
                <option value="Annual Appraisal FY 2025-26">Annual Appraisal FY 2025-26</option>
                <option value="Mid-Year Review 2026">Mid-Year Review 2026</option>
                <option value="Probation Review 2026">Probation Review 2026</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
            </div>

            {/* Department Filter */}
            <div className="relative min-w-[160px]">
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs transition-all">
                <option value="all">🏢 All Departments</option>
                <option value="geology">Geology & Exploration</option>
                <option value="gis">GIS & Remote Sensing</option>
                <option value="hr">HR & Administration</option>
                <option value="finance">Finance & Accounts</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
            </div>

            {/* Reset Button */}
            {(selectedCycle !== 'all' || selectedDept !== 'all' || searchQuery) && (<button type="button" onClick={() => {
                setSelectedCycle('all');
                setSelectedDept('all');
                setSearchQuery('');
            }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition-all shadow-2xs cursor-pointer" title="Reset all filters">
                <RotateCcw className="w-3.5 h-3.5"/>
                <span>Reset</span>
              </button>)}

            {/* Counter Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/70 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{filteredAppraisals.length}</span>
              <span>records</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#253344] bg-[#F8FAFC] dark:bg-[#111821]/80 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Review Cycle</th>
                <th className="py-3.5 px-4 font-semibold">Score & Rating</th>
                <th className="py-3.5 px-4 font-semibold">Goal Delivery</th>
                <th className="py-3.5 px-4 font-semibold">Reviewer</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#253344]">
              {filteredAppraisals.length === 0 ? (<tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No performance appraisals found matching search filters.
                  </td>
                </tr>) : (filteredAppraisals.map((appr) => (<tr key={appr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {appr.avatar ? (<img src={appr.avatar} alt={appr.employeeName} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-teal-600/20 dark:ring-teal-500/20"/>) : (<div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs ring-2 ring-teal-600/20 shrink-0">
                            {appr.employeeName.charAt(0)}
                          </div>)}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-[13px] leading-snug">
                            {appr.employeeName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200/70 dark:border-teal-800/40">
                              {appr.employeeId}
                            </span>
                            <span className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">
                              {appr.designation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cycle */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400"/>
                        <span>{appr.reviewCycle}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Evaluated {appr.reviewDate}</p>
                    </td>

                    {/* Score & Rating Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${getRatingBadgeClass(appr.rating)}`}>
                          {appr.rating}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#C8943A] fill-current"/>
                          {appr.overallScore} / 5.0
                        </span>
                      </div>
                    </td>

                    {/* Goal Delivery */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="w-36">
                        <div className="flex justify-between text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>KPI Target</span>
                          <span>{appr.goalsAchievementPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-[#C8943A]" style={{ width: `${appr.goalsAchievementPercent}%` }}/>
                        </div>
                      </div>
                    </td>

                    {/* Reviewer */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{appr.reviewerName}</p>
                      <p className="text-[10px] text-slate-400">{appr.reviewerDesignation}</p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(appr.status)}`}>
                        {appr.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setViewingAppraisal(appr)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 transition-colors shadow-2xs">
                        <Eye className="w-3.5 h-3.5"/>
                        <span>View Dossier</span>
                      </button>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── MODAL: VIEW APPRAISAL DOSSIER ── */}
      {viewingAppraisal && (<Modal isOpen={true} onClose={() => setViewingAppraisal(null)} title={`Performance Dossier • ${viewingAppraisal.employeeName} (${viewingAppraisal.employeeId})`} maxWidth="lg">
          <div className="space-y-5 text-xs">
            {/* Header summary banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/70 via-amber-50/40 to-slate-50 dark:from-teal-950/30 dark:via-amber-950/20 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {viewingAppraisal.avatar ? (<img src={viewingAppraisal.avatar} alt={viewingAppraisal.employeeName} className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-600/30"/>) : (<div className="w-12 h-12 rounded-full bg-teal-700 text-white font-bold text-lg flex items-center justify-center">
                    {viewingAppraisal.employeeName.charAt(0)}
                  </div>)}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewingAppraisal.employeeName}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {viewingAppraisal.designation} • {viewingAppraisal.department}
                  </p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold mt-1">
                    Cycle: {viewingAppraisal.reviewCycle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Overall Rating</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-0.5 ${getRatingBadgeClass(viewingAppraisal.rating)}`}>
                    {viewingAppraisal.rating}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1A2430] border border-slate-200 dark:border-slate-700 text-center min-w-[70px]">
                  <span className="text-[10px] text-slate-400 block">Score</span>
                  <span className="text-lg font-black text-[#C8943A] tabular-nums tracking-tight">
                    {viewingAppraisal.overallScore}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Goals Evaluated */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-teal-700"/>
                KPI Goal Deliverables & Weightages
              </h4>
              <div className="space-y-2">
                {viewingAppraisal.goals.map((g) => (<div key={g.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{g.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {g.weightage}% weight
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{g.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#C8943A] tabular-nums">
                        {g.achievedScore} / {g.targetScore}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Score</span>
                    </div>
                  </div>))}
              </div>
            </div>

            {/* Strengths & Improvement Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <h5 className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600"/>
                  Key Strengths & Achievements
                </h5>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewingAppraisal.strengths}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <h5 className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#C8943A]"/>
                  Growth & Developmental Areas
                </h5>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewingAppraisal.areasOfImprovement}
                </p>
              </div>
            </div>

            {/* Manager Remarks & Recommendation */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Manager Reviewer Feedback ({viewingAppraisal.reviewerName})
                </span>
                {viewingAppraisal.promotionRecommended && (<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8943A]/20 text-[#8F621A] dark:text-amber-300 border border-[#C8943A]/30">
                    ★ Recommended for Promotion / Raise
                  </span>)}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                "{viewingAppraisal.managerFeedback}"
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                <span>Bonus Multiplier: <strong className="text-slate-800 dark:text-slate-200">{viewingAppraisal.bonusMultiplier}x</strong></span>
                <span>Evaluation Date: {viewingAppraisal.reviewDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => {
                toast.success(`Appraisal sheet downloaded for ${viewingAppraisal.employeeName}.`, 'Dossier Exported');
            }} leftIcon={<Download className="w-3.5 h-3.5"/>}>
                Download PDF Dossier
              </Button>
              <Button variant="primary" size="sm" onClick={() => setViewingAppraisal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>)}

      {/* ── MODAL: INITIATE / RECORD APPRAISAL ── */}
      {isCreateModalOpen && (<Modal isOpen={true} onClose={() => setIsCreateModalOpen(false)} title="Initiate Employee Performance Appraisal" maxWidth="lg">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Employee Full Name" value={formEmployeeName} onChange={(e) => setFormEmployeeName(e.target.value)} placeholder="e.g. Rohan Deshmukh" required/>
              <Input label="Employee ID" value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)} placeholder="e.g. BGS-006" required/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select label="Department" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} options={[
                { value: 'Geology & Mineral Exploration', label: 'Geology & Mineral Exploration' },
                { value: 'GIS & Remote Sensing', label: 'GIS & Remote Sensing' },
                { value: 'HR & Administration', label: 'HR & Administration' },
                { value: 'Finance & Accounts', label: 'Finance & Accounts' },
            ]}/>
              <Input label="Current Designation" value={formDesignation} onChange={(e) => setFormDesignation(e.target.value)} placeholder="e.g. Senior Geologist"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select label="Appraisal Review Cycle" value={formCycle} onChange={(e) => setFormCycle(e.target.value)} options={[
                { value: 'Annual Appraisal FY 2026-27', label: 'Annual Appraisal FY 2026-27' },
                { value: 'Mid-Year Review 2026', label: 'Mid-Year Review 2026' },
                { value: 'Probation Review 2026', label: 'Probation Review 2026' },
            ]}/>
              <Select label="Overall Rating" value={formRating} onChange={(e) => setFormRating(e.target.value)} options={[
                { value: 'Outstanding', label: 'Outstanding (4.6 - 5.0)' },
                { value: 'Exceeds Expectations', label: 'Exceeds Expectations (4.0 - 4.5)' },
                { value: 'Meets Expectations', label: 'Meets Expectations (3.0 - 3.9)' },
                { value: 'Needs Improvement', label: 'Needs Improvement (< 3.0)' },
            ]}/>
              <Input label="Numeric Score (0 - 5.0)" type="number" step="0.1" min="1.0" max="5.0" value={formScore} onChange={(e) => setFormScore(Number(e.target.value))} required/>
            </div>

            <Textarea label="Key Strengths & Project Achievements" value={formStrengths} onChange={(e) => setFormStrengths(e.target.value)} placeholder="Detail key exploration milestones delivered, safety records, or leadership accomplishments..." rows={2} required/>

            <Textarea label="Developmental Needs & Training Goals" value={formAreas} onChange={(e) => setFormAreas(e.target.value)} placeholder="Detail technical software training, certifications, or communication skills to nurture..." rows={2}/>

            <Textarea label="Manager / HR Feedback & Directives" value={formFeedback} onChange={(e) => setFormFeedback(e.target.value)} placeholder="Official appraisal evaluation narrative..." rows={2} required/>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="promotionRecommended" checked={formPromotion} onChange={(e) => setFormPromotion(e.target.checked)} className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"/>
              <label htmlFor="promotionRecommended" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Recommend employee for grade promotion and merit performance bonus
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateAppraisal}>
                Save & Finalize Appraisal
              </Button>
            </div>
          </div>
        </Modal>)}
    </div>);
};
