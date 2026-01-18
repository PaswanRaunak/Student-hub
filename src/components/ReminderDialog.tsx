import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { addHours, addDays, format } from 'date-fns';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: {
    id: string;
    title: string;
    due_date: string;
  };
  onReminderSet?: () => void;
}

const REMINDER_OPTIONS = [
  { value: '1h', label: '1 hour before', hours: -1 },
  { value: '3h', label: '3 hours before', hours: -3 },
  { value: '1d', label: '1 day before', days: -1 },
  { value: '2d', label: '2 days before', days: -2 },
  { value: '1w', label: '1 week before', days: -7 },
];

export function ReminderDialog({ open, onOpenChange, assignment, onReminderSet }: ReminderDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [selectedOption, setSelectedOption] = useState<string>('1d');
  const [isLoading, setIsLoading] = useState(false);

  const calculateReminderTime = (option: string, dueDate: string) => {
    const due = new Date(dueDate);
    const config = REMINDER_OPTIONS.find(o => o.value === option);
    
    if (!config) return due;
    
    if (config.hours) {
      return addHours(due, config.hours);
    }
    if (config.days) {
      return addDays(due, config.days);
    }
    return due;
  };

  const handleSetReminder = async () => {
    if (!user) return;

    // Request notification permission if not granted
    if (permission !== 'granted' && isSupported) {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings to receive reminders.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    const remindAt = calculateReminderTime(selectedOption, assignment.due_date);

    // Check if reminder time is in the past
    if (remindAt <= new Date()) {
      toast({
        title: 'Invalid Reminder Time',
        description: 'The reminder time has already passed. Please choose a different option.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from('assignment_reminders').insert({
      assignment_id: assignment.id,
      user_id: user.id,
      remind_at: remindAt.toISOString(),
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to set reminder. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Reminder Set!',
      description: `You'll be reminded on ${format(remindAt, 'MMM d, yyyy h:mm a')}`,
    });

    onReminderSet?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Reminder
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="font-medium">{assignment.title}</p>
            <p className="text-sm text-muted-foreground">
              Due: {format(new Date(assignment.due_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {!isSupported ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-destructive/10 p-3 rounded-lg">
              <BellOff className="h-4 w-4" />
              <span>Your browser doesn't support notifications</span>
            </div>
          ) : permission === 'denied' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-destructive/10 p-3 rounded-lg">
              <BellOff className="h-4 w-4" />
              <span>Notifications are blocked. Please enable them in browser settings.</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Remind me</Label>
                <Select value={selectedOption} onValueChange={setSelectedOption}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map(option => {
                      const reminderTime = calculateReminderTime(option.value, assignment.due_date);
                      const isPast = reminderTime <= new Date();
                      return (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          disabled={isPast}
                        >
                          {option.label} {isPast && '(passed)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                Reminder will be sent on:{' '}
                <span className="font-medium text-foreground">
                  {format(calculateReminderTime(selectedOption, assignment.due_date), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              <Button onClick={handleSetReminder} className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting...' : 'Set Reminder'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
