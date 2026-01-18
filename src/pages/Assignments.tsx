import { useState, useEffect } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { AssignmentsSkeleton } from '@/components/skeletons/AssignmentsSkeleton';
import { ReminderDialog } from '@/components/ReminderDialog';
import { useReminderChecker } from '@/hooks/use-reminder-checker';
import { Plus, CheckSquare, Clock, Check, Trash2, CalendarDays, List, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description?: string;
  due_date: string;
  status: string;
  user_id: string;
}

export default function Assignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newAssignment, setNewAssignment] = useState({ subject: '', title: '', description: '', due_date: '' });
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Initialize reminder checker
  useReminderChecker();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('assignments').select('*').order('due_date', { ascending: true });
    setAssignments((data as Assignment[]) || []);
    setIsLoading(false);
  };

  const addAssignment = async () => {
    if (!newAssignment.subject || !newAssignment.title || !newAssignment.due_date) return;
    await supabase.from('assignments').insert({ ...newAssignment, user_id: user?.id });
    setIsOpen(false);
    setNewAssignment({ subject: '', title: '', description: '', due_date: '' });
    fetchAssignments();
    toast({ title: 'Assignment Added!' });
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'submitted' : 'pending';
    await supabase.from('assignments').update({ status: newStatus }).eq('id', id);
    fetchAssignments();
  };

  const deleteAssignment = async (id: string) => {
    await supabase.from('assignments').delete().eq('id', id);
    fetchAssignments();
    toast({ title: 'Assignment Deleted' });
  };

  const pending = assignments.filter(a => a.status === 'pending');
  const submitted = assignments.filter(a => a.status === 'submitted');

  // Get assignments for a specific date
  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(a => isSameDay(new Date(a.due_date), date));
  };

  // Get dates that have assignments
  const assignmentDates = assignments.map(a => new Date(a.due_date));

  // Assignments for selected date
  const selectedDateAssignments = selectedDate ? getAssignmentsForDate(selectedDate) : [];

  // Check if a date is overdue (past and has pending assignments)
  const isOverdue = (date: Date) => {
    const dayAssignments = getAssignmentsForDate(date);
    return isBefore(date, startOfDay(new Date())) && 
           dayAssignments.some(a => a.status === 'pending');
  };

  return (
    <StudentLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Assignments</h1>
            <p className="text-muted-foreground">Track your assignments and deadlines</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Assignment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Assignment</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={newAssignment.subject} onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={newAssignment.due_date} onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })} />
                </div>
                <Button onClick={addAssignment} className="w-full">Add Assignment</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <AssignmentsSkeleton />
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-warning" />Pending ({pending.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {pending.length === 0 ? <p className="text-muted-foreground text-sm">No pending assignments</p> : pending.map(a => (
                      <div key={a.id} className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        isBefore(new Date(a.due_date), startOfDay(new Date())) 
                          ? "bg-destructive/10 border border-destructive/20" 
                          : "bg-muted/50"
                      )}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{a.title}</p>
                            {isBefore(new Date(a.due_date), startOfDay(new Date())) && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                            {isToday(new Date(a.due_date)) && (
                              <Badge className="text-xs bg-warning text-warning-foreground">Due Today</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{a.subject} • Due: {format(new Date(a.due_date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            title="Set reminder"
                            onClick={() => {
                              setSelectedAssignment(a);
                              setReminderDialogOpen(true);
                            }}
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => toggleStatus(a.id, a.status)}><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteAssignment(a.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-success" />Submitted ({submitted.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {submitted.length === 0 ? <p className="text-muted-foreground text-sm">No submitted assignments</p> : submitted.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                        <div>
                          <p className="font-medium line-through opacity-60">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.subject}</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => toggleStatus(a.id, a.status)}><Clock className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                {/* Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Calendar</CardTitle>
                    <CardDescription>Click on a date to see assignments due</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border pointer-events-auto w-full"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 w-full",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full",
                        head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "relative w-full p-0 text-center text-sm focus-within:relative focus-within:z-20",
                        day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                      }}
                      modifiers={{
                        hasAssignment: assignmentDates,
                        overdue: (date) => isOverdue(date),
                      }}
                      modifiersStyles={{
                        hasAssignment: {
                          fontWeight: 'bold',
                          textDecoration: 'underline',
                          textUnderlineOffset: '4px',
                        },
                        overdue: {
                          color: 'hsl(var(--destructive))',
                        },
                      }}
                    />
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        <span>Selected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold underline underline-offset-4">Date</span>
                        <span>Has assignments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-destructive font-bold">Date</span>
                        <span>Overdue</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Date Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                    </CardTitle>
                    <CardDescription>
                      {selectedDateAssignments.length} assignment{selectedDateAssignments.length !== 1 ? 's' : ''} due
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedDateAssignments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No assignments due on this date</p>
                      </div>
                    ) : (
                      selectedDateAssignments.map(a => (
                        <div
                          key={a.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            a.status === 'submitted' 
                              ? "bg-success/10 border-success/20" 
                              : isOverdue(new Date(a.due_date))
                                ? "bg-destructive/10 border-destructive/20"
                                : "bg-muted/50 border-border"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "font-medium",
                                  a.status === 'submitted' && "line-through opacity-60"
                                )}>{a.title}</p>
                                {a.status === 'submitted' && (
                                  <Badge variant="outline" className="text-xs text-success border-success">Done</Badge>
                                )}
                                {a.status === 'pending' && isOverdue(new Date(a.due_date)) && (
                                  <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{a.subject}</p>
                            </div>
                            <div className="flex gap-1">
                              {a.status === 'pending' && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7"
                                  title="Set reminder"
                                  onClick={() => {
                                    setSelectedAssignment(a);
                                    setReminderDialogOpen(true);
                                  }}
                                >
                                  <Bell className="h-3 w-3" />
                                </Button>
                              )}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={() => toggleStatus(a.id, a.status)}
                              >
                                {a.status === 'pending' ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteAssignment(a.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Reminder Dialog */}
        {selectedAssignment && (
          <ReminderDialog
            open={reminderDialogOpen}
            onOpenChange={setReminderDialogOpen}
            assignment={selectedAssignment}
          />
        )}
      </div>
    </StudentLayout>
  );
}
