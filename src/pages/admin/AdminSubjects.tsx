import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, BookOpen, GraduationCap } from 'lucide-react';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Subject = Tables<'subjects'>;

const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

interface SubjectFormData {
  name: string;
  code: string;
  semester: string;
}

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemester, setFilterSemester] = useState<string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    semester: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('semester')
      .order('name');

    if (error) {
      toast.error('Failed to fetch subjects');
      console.error(error);
    } else {
      setSubjects(data || []);
    }
    setIsLoading(false);
  }

  function resetForm() {
    setFormData({ name: '', code: '', semester: '' });
    setEditingSubject(null);
  }

  function openEditDialog(subject: Subject) {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      semester: subject.semester || '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingSubject) {
        const updateData: TablesUpdate<'subjects'> = {
          name: formData.name.trim(),
          code: formData.code.trim() || null,
          semester: formData.semester || null,
        };

        const { error } = await supabase
          .from('subjects')
          .update(updateData)
          .eq('id', editingSubject.id);

        if (error) throw error;
        toast.success('Subject updated successfully');
      } else {
        const insertData: TablesInsert<'subjects'> = {
          name: formData.name.trim(),
          code: formData.code.trim() || null,
          semester: formData.semester || null,
        };

        const { error } = await supabase
          .from('subjects')
          .insert(insertData);

        if (error) throw error;
        toast.success('Subject created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save subject');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(subject: Subject) {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subject.id);

      if (error) throw error;
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
      console.error(error);
    }
  }

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesSemester = filterSemester === 'all' || subject.semester === filterSemester;

    return matchesSearch && matchesSemester;
  });

  // Group subjects by semester for stats
  const subjectsBySemester = subjects.reduce((acc, subject) => {
    const sem = subject.semester || 'Unassigned';
    acc[sem] = (acc[sem] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subjects Management</h1>
          <p className="text-muted-foreground">Manage subjects for organizing notes and PYQs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Data Structures & Algorithms"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CS201"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, semester: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Semester</SelectItem>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subjects.length}</p>
              <p className="text-sm text-muted-foreground">Total Subjects</p>
            </div>
          </CardContent>
        </Card>
        {semesters.slice(0, 3).map((sem) => (
          <Card key={sem}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-secondary/50 p-3">
                <GraduationCap className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subjectsBySemester[sem] || 0}</p>
                <p className="text-sm text-muted-foreground">Semester {sem}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Subjects ({filteredSubjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No Subjects Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterSemester !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first subject to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{subject.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subject.code ? (
                          <Badge variant="outline">{subject.code}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subject.semester ? (
                          <Badge variant="secondary">Sem {subject.semester}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(subject)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{subject.name}". Notes and PYQs linked to this subject will become unassigned.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(subject)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}
