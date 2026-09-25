import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Calendar, Clock, CreditCard, FileText, Receipt, ArrowRight, } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { notificationService } from '@/modules/notifications/services/notification.service';
export const NotificationsPage = () => {
    const toast = useToast();
    const { currentRole } = useRole();
    const [notifications, setNotifications] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const load = async () => {
        const data = await notificationService.getNotifications(currentRole);
        setNotifications(data);
    };
    useEffect(() => {
        load();
    }, [currentRole]);
    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead();
        toast.success('All notifications marked as read.', 'Updated');
        load();
    };
    const handleMarkRead = async (id) => {
        await notificationService.markAsRead(id);
        load();
    };
    const handleDelete = async (id) => {
        await notificationService.deleteNotification(id);
        toast.info('Notification cleared.', 'Deleted');
        load();
    };
    const filtered = notifications.filter((n) => {
        if (filterType === 'unread')
            return !n.read;
        if (filterType !== 'all' && n.type !== filterType)
            return false;
        return true;
    });
    const unreadCount = notifications.filter((n) => !n.read).length;
    const getIcon = (type) => {
        switch (type) {
            case 'Leave':
                return <Calendar className="w-4 h-4 text-blue-600"/>;
            case 'Attendance':
                return <Clock className="w-4 h-4 text-amber-600"/>;
            case 'Payroll':
                return <CreditCard className="w-4 h-4 text-emerald-600"/>;
            case 'Documents':
                return <FileText className="w-4 h-4 text-purple-600"/>;
            case 'Expense':
                return <Receipt className="w-4 h-4 text-blue-600"/>;
            default:
                return <Bell className="w-4 h-4 text-slate-600"/>;
        }
    };
    return (<div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader title="Notifications Center" description="System communications, approval alerts, and operational task notifications." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Notifications' },
        ]} actions={unreadCount > 0 ? (<Button variant="outline" size="sm" onClick={handleMarkAllRead} leftIcon={<CheckCheck className="w-4 h-4"/>}>
              Mark All as Read ({unreadCount})
            </Button>) : undefined}/>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344]">
        {['all', 'unread', 'Leave', 'Attendance', 'Payroll', 'Expense', 'Documents'].map((f) => (<button key={f} onClick={() => setFilterType(f)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filterType === f
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#253344]'}`}>
            {f === 'all' ? 'All Alerts' : f === 'unread' ? `Unread (${unreadCount})` : f}
          </button>))}
      </div>

      {/* Notification List */}
      <Card className="divide-y divide-slate-100 dark:divide-[#253344] overflow-hidden">
        {filtered.length === 0 ? (<div className="p-12 text-center text-xs text-slate-400">
            No notifications matching this filter.
          </div>) : (filtered.map((item) => (<div key={item.id} className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${!item.read ? 'bg-blue-50/20' : 'hover:bg-slate-50/60'}`}>
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-xs sm:text-sm truncate ${!item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {item.title}
                    </h4>
                    <Badge variant="blue" size="sm">
                      {item.type}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-inter text-slate-400 shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.message}
                </p>

                <div className="flex items-center gap-3">
                  {item.actionLink && (<Link to={item.actionLink} onClick={() => handleMarkRead(item.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                      <span>Take Action</span>
                      <ArrowRight className="w-3.5 h-3.5"/>
                    </Link>)}
                  {!item.read && (<button onClick={() => handleMarkRead(item.id)} className="text-xs text-slate-500 hover:text-slate-800">
                      Mark as read
                    </button>)}
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-slate-400 hover:text-rose-600 ml-auto" title="Delete notification">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </div>)))}
      </Card>
    </div>);
};
