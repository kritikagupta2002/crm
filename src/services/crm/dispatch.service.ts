import { mobileStorage } from '../../storage';
import { DispatchRecord } from '../../types';

export class DispatchService {
  async getDispatches(): Promise<DispatchRecord[]> {
    return mobileStorage.getDispatches();
  }

  async logDispatch(data: Omit<DispatchRecord, 'id' | 'status'>): Promise<DispatchRecord> {
    const list = await mobileStorage.getDispatches();
    const newDisp: DispatchRecord = {
      ...data,
      id: 'disp-' + Date.now(),
      status: 'In Transit',
    };
    list.unshift(newDisp);
    await mobileStorage.setDispatches(list);
    return newDisp;
  }
}

export const dispatchService = new DispatchService();
