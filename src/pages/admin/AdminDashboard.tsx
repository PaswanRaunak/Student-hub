import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, ClipboardList, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, notes: 0, pyqs: 0, premium: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, notesRes, pyqsRes, premiumRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('pyqs').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*, plan:plans!inner(type)').eq('plans.type', 'premium')
      ]);
      setStats({
        users: usersRes.count || 0,
        notes: notesRes.count || 0,
        pyqs: pyqsRes.count || 0,
        premium: premiumRes.data?.length || 0
      });
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="stat-gradient-blue">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.users}</div></CardContent>
          </Card>
          <Card className="stat-gradient-green">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <Crown className="h-4 w-4 text-premium" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.premium}</div></CardContent>
          </Card>
          <Card className="stat-gradient-orange">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
              <FileText className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.notes}</div></CardContent>
          </Card>
          <Card className="stat-gradient-purple">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total PYQs</CardTitle>
              <ClipboardList className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.pyqs}</div></CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
