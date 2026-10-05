import { mobileStorage } from '../../storage';
import { FollowUp } from '../../types';

export class FollowupsService {
  async getFollowUps(): Promise<FollowUp[]> {
    return mobileStorage.getFollowUps();
  }

  async scheduleFollowUp(data: Omit<FollowUp, 'id' | 'status'>): Promise<FollowUp> {
    const followUps = await mobileStorage.getFollowUps();
    const newFU: FollowUp = {
      ...data,
      id: 'fu-' + Date.now(),
      status: 'Pending',
    };
    followUps.unshift(newFU);
    await mobileStorage.setFollowUps(followUps);

    if (data.leadId) {
      const leads = await mobileStorage.getLeads();
      const lead = leads.find((l) => l.id === data.leadId);
      if (lead) {
        lead.nextFollowUp = data.date;
        await mobileStorage.setLeads(leads);
      }
    }
    return newFU;
  }

  async completeFollowUp(id: string, outcome: string): Promise<FollowUp> {
    const followUps = await mobileStorage.getFollowUps();
    const target = followUps.find((f) => f.id === id);
    if (!target) throw new Error('Follow-up not found.');
    target.status = 'Completed';
    target.outcome = outcome;
    await mobileStorage.setFollowUps(followUps);
    return target;
  }

  async rescheduleFollowUp(id: string, newDate: string, newTime?: string): Promise<FollowUp> {
    const followUps = await mobileStorage.getFollowUps();
    const target = followUps.find((f) => f.id === id);
    if (!target) throw new Error('Follow-up not found.');
    target.date = newDate;
    if (newTime) target.time = newTime;
    await mobileStorage.setFollowUps(followUps);

    if (target.leadId) {
      const leads = await mobileStorage.getLeads();
      const lead = leads.find((l) => l.id === target.leadId);
      if (lead) {
        lead.nextFollowUp = newDate;
        await mobileStorage.setLeads(leads);
      }
    }
    return target;
  }
}

export const followupsService = new FollowupsService();
