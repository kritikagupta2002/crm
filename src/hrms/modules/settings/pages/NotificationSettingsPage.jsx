import React from 'react';
import { Bell } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { useAccess } from '../../../../core/permissions/crm';

/*
 * What the portal notifies people about. Notifications are in-app (the bell in the top bar); there is no email or
 * WhatsApp delivery yet, so this page describes the behaviour instead of offering switches that would do nothing.
 */
export const NotificationSettingsPage = () => {
    const { has } = useAccess();
    const personal = [
        'Your leave request is approved, partly approved or rejected',
        'A document you uploaded is verified or needs to be uploaded again',
    ];
    const reviewer = [];
    if (has('leave.approve')) reviewer.push('Someone applies for leave');
    if (has('documents.verify')) reviewer.push('Someone uploads a document for verification');

    return (<Card className="p-6">
      <div className="settings-section-head">
        <span className="settings-section-icon"><Bell size={20}/></span>
        <div>
          <h3 className="settings-section-title">Notifications</h3>
          <p className="settings-section-sub">Notifications appear under the bell in the top bar. Email and WhatsApp delivery are not set up yet.</p>
        </div>
      </div>
      <div className="kv-list" style={{ gap: 18 }}>
        <section>
          <h4 className="eyebrow">You are notified when</h4>
          <ul className="notify-list">{personal.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
        {reviewer.length > 0 && (<section>
            <h4 className="eyebrow">Because you review requests, you are also notified when</h4>
            <ul className="notify-list">{reviewer.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>)}
      </div>
    </Card>);
};
