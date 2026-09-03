// src/utils/reminder.utils.ts
import { isToday, isTomorrow, isThisWeek, isPast, parseISO } from 'date-fns';

export interface ReminderAPIModel {
  dueDate(dueDate: any): unknown;
  _id: string;
  title: string;
  message: string;
  type: 'payment' | 'settlement' | 'budget' | 'custom';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom_days';
  nextTriggerAt?: string;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
  targetUserId?: string;
  targetUserName?: string;
  tripId?: string;
  tripName?: string;
  escalationLevel: number;
  escalationInterval: number;
  channels?: string[];
  triggerCount: number;
  cancelledAt?: string;
  customDays?: number;
}

export function extractAmount(message: string): string | null {
  if (!message) return null;
  const match = message.match(/₹([\d,]+(\.\d+)?)/);
  return match && match[1] ? match[1] : null;
}

export function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export type TimelineGroup =
  | 'Overdue'
  | 'Today'
  | 'Tomorrow'
  | 'This Week'
  | 'Later'
  | 'Completed'
  | 'Paused'
  | 'Cancelled';

export function getTimelineGroup(reminder: ReminderAPIModel): TimelineGroup {
  if (reminder.status === 'completed') return 'Completed';
  if (reminder.status === 'cancelled') return 'Cancelled';
  if (reminder.status === 'paused') return 'Paused';

  if (!reminder.nextTriggerAt) return 'Later';
  const nextDate = parseISO(reminder.nextTriggerAt);

  if (isPast(nextDate) && !isToday(nextDate)) return 'Overdue';
  if (isToday(nextDate)) return 'Today';
  if (isTomorrow(nextDate)) return 'Tomorrow';
  if (isThisWeek(nextDate)) return 'This Week';
  return 'Later';
}

export function groupRemindersByTimeline(reminders: ReminderAPIModel[]) {
  const groups: Record<TimelineGroup, ReminderAPIModel[]> = {
    Overdue: [],
    Today: [],
    Tomorrow: [],
    'This Week': [],
    Later: [],
    Completed: [],
    Paused: [],
    Cancelled: [],
  };

  reminders.forEach(r => {
    const group = getTimelineGroup(r);
    if (groups[group]) {
      groups[group].push(r);
    }
  });

  return groups;
}

export function calculateCompletionRate(reminders: ReminderAPIModel[]): number {
  if (!reminders.length) return 0;
  const completed = reminders.filter(r => r.status === 'completed').length;
  return Math.round((completed / reminders.length) * 100);
}
