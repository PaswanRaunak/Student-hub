import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useNotifications } from './use-notifications';

export function useReminderChecker() {
  const { user } = useAuth();
  const { permission, sendNotification } = useNotifications();

  const checkReminders = useCallback(async () => {
    if (!user || permission !== 'granted') return;

    // Fetch due reminders that haven't been notified
    const { data: reminders } = await supabase
      .from('assignment_reminders')
      .select(`
        id,
        remind_at,
        assignment_id
      `)
      .eq('user_id', user.id)
      .eq('is_notified', false)
      .lte('remind_at', new Date().toISOString());

    if (!reminders || reminders.length === 0) return;

    // Fetch assignment details for each reminder
    for (const reminder of reminders) {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('title, subject, due_date')
        .eq('id', reminder.assignment_id)
        .maybeSingle();

      if (assignment) {
        // Send notification
        sendNotification(`Assignment Reminder: ${assignment.title}`, {
          body: `${assignment.subject} - Due: ${new Date(assignment.due_date).toLocaleDateString()}`,
          tag: reminder.id,
        });

        // Mark as notified
        await supabase
          .from('assignment_reminders')
          .update({ is_notified: true })
          .eq('id', reminder.id);
      }
    }
  }, [user, permission, sendNotification]);

  useEffect(() => {
    if (!user || permission !== 'granted') return;

    // Check immediately
    checkReminders();

    // Check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [user, permission, checkReminders]);
}
