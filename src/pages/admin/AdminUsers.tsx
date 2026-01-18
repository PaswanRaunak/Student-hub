import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, Users, Shield, Crown, Calendar, Mail, User, Edit } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;
type Subscription = Tables<'subscriptions'>;
type Plan = Tables<'plans'>;

interface UserWithDetails {
  profile: Profile;
  role: UserRole | null;
  subscription: Subscription | null;
  plan: Plan | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    role: 'student' as 'student' | 'admin',
    plan_id: '',
    status: 'active' as 'active' | 'expired' | 'cancelled',
    expiry_date: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price');

    if (error) {
      toast.error('Failed to fetch plans');
      console.error(error);
    } else {
      setPlans(data || []);
    }
  }

  async function fetchUsers() {
    setIsLoading(true);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error('Failed to fetch users');
      console.error(profilesError);
      setIsLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error(rolesError);
    }

    // Fetch all subscriptions with plans
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*, plans(*)');

    if (subsError) {
      console.error(subsError);
    }

    // Combine data
    const usersWithDetails: UserWithDetails[] = (profiles || []).map((profile) => {
      const role = roles?.find((r) => r.user_id === profile.id) || null;
      const subscriptionData = subscriptions?.find((s) => s.user_id === profile.id);
      const subscription = subscriptionData ? {
        id: subscriptionData.id,
        user_id: subscriptionData.user_id,
        plan_id: subscriptionData.plan_id,
        status: subscriptionData.status,
        start_date: subscriptionData.start_date,
        expiry_date: subscriptionData.expiry_date,
        created_at: subscriptionData.created_at,
        updated_at: subscriptionData.updated_at,
      } : null;
      const plan = subscriptionData?.plans as Plan | null;

      return { profile, role, subscription, plan };
    });

    setUsers(usersWithDetails);
    setIsLoading(false);
  }

  function openEditDialog(user: UserWithDetails) {
    setEditingUser(user);
    setEditForm({
      role: (user.role?.role as 'student' | 'admin') || 'student',
      plan_id: user.subscription?.plan_id || '',
      status: (user.subscription?.status as 'active' | 'expired' | 'cancelled') || 'active',
      expiry_date: user.subscription?.expiry_date 
        ? new Date(user.subscription.expiry_date).toISOString().split('T')[0] 
        : '',
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!editingUser) return;

    setIsSubmitting(true);

    try {
      // Update role
      if (editingUser.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: editForm.role })
          .eq('id', editingUser.role.id);

        if (roleError) throw roleError;
      } else {
        // Create role if it doesn't exist
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: editingUser.profile.id,
            role: editForm.role,
          });

        if (roleError) throw roleError;
      }

      // Update subscription
      if (editingUser.subscription) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: editForm.plan_id,
            status: editForm.status,
            expiry_date: editForm.expiry_date || null,
          })
          .eq('id', editingUser.subscription.id);

        if (subError) throw subError;
      } else if (editForm.plan_id) {
        // Create subscription if it doesn't exist
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: editingUser.profile.id,
            plan_id: editForm.plan_id,
            status: editForm.status,
            expiry_date: editForm.expiry_date || null,
          });

        if (subError) throw subError;
      }

      toast.success('User updated successfully');
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role?.role === filterRole;
    const matchesPlan = filterPlan === 'all' || user.plan?.id === filterPlan;

    return matchesSearch && matchesRole && matchesPlan;
  });

  function formatDate(dateString: string | null) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getStatusColor(status: string | undefined) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
        <p className="text-muted-foreground">View and manage user accounts, roles, and subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-amber-500/10 p-3">
              <Crown className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.plan?.type === 'premium').length}
              </p>
              <p className="text-sm text-muted-foreground">Premium Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role?.role === 'admin').length}
              </p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <User className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.subscription?.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No Users Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterRole !== 'all' || filterPlan !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No users have registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {user.profile.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.profile.name}</p>
                            <p className="text-sm text-muted-foreground">{user.profile.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role?.role === 'admin' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {user.role?.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                          {user.role?.role || 'student'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.plan?.type === 'premium' && (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                          <span>{user.plan?.name || 'No Plan'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.subscription?.status)}>
                          {user.subscription?.status || 'None'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.profile.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-lg">
                  {editingUser.profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{editingUser.profile.name}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.profile.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: 'student' | 'admin') =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subscription Plan</Label>
                <Select
                  value={editForm.plan_id || 'none'}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, plan_id: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Plan</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} (₹{plan.price}/month)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subscription Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: 'active' | 'expired' | 'cancelled') =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={editForm.expiry_date}
                  onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
