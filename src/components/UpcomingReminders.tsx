import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Trash2, ArrowRight, Clock } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Reminder {
  id: string;
  remind_at: string;
  is_notified: boolean;
  assignment: {
    id: string;
    title: string;
    subject: string;
    due_date: string;
  } | null;
}

export function UpcomingReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReminders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('assignment_reminders')
      .select(`
        id,
        remind_at,
        is_notified,
        assignment:assignments(id, title, subject, due_date)
      `)
      .eq('user_id', user.id)
      .eq('is_notified', false)
      .order('remind_at', { ascending: true })
      .limit(5);

    if (!error && data) {
      setReminders(data as Reminder[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const cancelReminder = async (id: string) => {
    const { error } = await supabase
      .from('assignment_reminders')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel reminder.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Reminder Cancelled' });
    fetchReminders();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Reminders
          </CardTitle>
          <CardDescription>Your scheduled assignment reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Upcoming Reminders
          </CardTitle>
          <CardDescription>Your scheduled assignment reminders</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/assignments">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <BellOff className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No upcoming reminders</p>
            <p className="text-xs mt-1">Set reminders on your assignments to never miss a deadline</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const isOverdue = reminder.assignment && isPast(new Date(reminder.remind_at));
              
              return (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isOverdue ? 'bg-warning/10 border border-warning/20' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                      isOverdue ? 'bg-warning/20' : 'bg-primary/10'
                    }`}>
                      <Clock className={`h-4 w-4 ${isOverdue ? 'text-warning' : 'text-primary'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {reminder.assignment?.title || 'Unknown Assignment'}
                        </p>
                        {isOverdue && (
                          <Badge variant="outline" className="text-xs border-warning text-warning shrink-0">
                            Due Soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reminder.assignment?.subject} • Reminder {formatDistanceToNow(new Date(reminder.remind_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => cancelReminder(reminder.id)}
                    title="Cancel reminder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
