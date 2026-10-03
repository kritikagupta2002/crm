import { mobileStorage } from '../storage';
import { PerformanceAppraisal } from '../types';

export class PerformanceService {
  async getAppraisals(): Promise<PerformanceAppraisal[]> {
    return mobileStorage.getAppraisals();
  }

  async getAppraisalsByEmployee(employeeId: string): Promise<PerformanceAppraisal[]> {
    const list = await mobileStorage.getAppraisals();
    return list.filter((a) => a.employeeId === employeeId);
  }

  async createAppraisal(data: Omit<PerformanceAppraisal, 'id'>): Promise<PerformanceAppraisal> {
    const list = await mobileStorage.getAppraisals();
    const newRecord: PerformanceAppraisal = {
      ...data,
      id: `appr-${Date.now()}`,
    };
    list.unshift(newRecord);
    await mobileStorage.setAppraisals(list);
    return newRecord;
  }
}

export const performanceService = new PerformanceService();
