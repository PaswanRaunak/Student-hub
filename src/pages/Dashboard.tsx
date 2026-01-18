import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { UpcomingReminders } from '@/components/UpcomingReminders';
import {
  FileText,
  ClipboardList,
  FileEdit,
  CheckSquare,
  ArrowRight,
  Clock,
  BookOpen,
} from 'lucide-react';

interface DashboardStats {
  pendingAssignments: number;
  totalAssignments: number;
  notesCount: number;
  pyqsCount: number;
}

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingAssignments: 0,
    totalAssignments: 0,
    notesCount: 0,
    pyqsCount: 0,
  });
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch pending assignments
        const { count: pendingCount } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: totalAssignments } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true });

        // Fetch notes count
        const { count: notesCount } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true });

        // Fetch PYQs count
        const { count: pyqsCount } = await supabase
          .from('pyqs')
          .select('*', { count: 'exact', head: true });

        // Fetch recent notes
        const { data: notes } = await supabase
          .from('notes')
          .select('*, subject:subjects(name)')
          .order('created_at', { ascending: false })
          .limit(3);

        setStats({
          pendingAssignments: pendingCount || 0,
          totalAssignments: totalAssignments || 0,
          notesCount: notesCount || 0,
          pyqsCount: pyqsCount || 0,
        });
        setRecentNotes(notes || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <StudentLayout>
        <DashboardSkeleton />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your studies today.
            </p>
          </div>
          {isAdmin && (
            <Button asChild variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Link to="/admin/dashboard">
                Go to Admin Panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover stat-gradient-blue">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
              <CheckSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalAssignments} total assignments
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover stat-gradient-green">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Notes</CardTitle>
              <FileText className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notesCount}</div>
              <p className="text-xs text-muted-foreground">
                Study materials available
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover stat-gradient-orange">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">PYQs Available</CardTitle>
              <ClipboardList className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pyqsCount}</div>
              <p className="text-xs text-muted-foreground">
                Previous year questions
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover stat-gradient-purple">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Application Writer</CardTitle>
              <FileEdit className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ready</div>
              <p className="text-xs text-muted-foreground">
                Generate applications instantly
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Notes */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Jump straight to what you need</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild variant="outline" className="justify-start h-auto py-3">
                <Link to="/applications">
                  <FileEdit className="mr-3 h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Write an Application</div>
                    <div className="text-xs text-muted-foreground">Generate college-ready applications</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-auto py-3">
                <Link to="/notes">
                  <BookOpen className="mr-3 h-5 w-5 text-success" />
                  <div className="text-left">
                    <div className="font-medium">Browse Notes</div>
                    <div className="text-xs text-muted-foreground">Study materials by subject</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-auto py-3">
                <Link to="/assignments">
                  <Clock className="mr-3 h-5 w-5 text-warning" />
                  <div className="text-left">
                    <div className="font-medium">Track Assignments</div>
                    <div className="text-xs text-muted-foreground">Never miss a deadline</div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recently Added Notes</CardTitle>
                <CardDescription>Latest study materials</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/notes">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes available yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{note.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {note.subject?.name || 'General'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders */}
        <UpcomingReminders />
      </div>
    </StudentLayout>
  );
}
