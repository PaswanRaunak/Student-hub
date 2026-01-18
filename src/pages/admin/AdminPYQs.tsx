import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, FileText, Download, Star, Repeat, Crown, Upload, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type PYQ = Tables<'pyqs'>;
type Subject = Tables<'subjects'>;

interface PYQFormData {
  title: string;
  year: number;
  subject_id: string;
  is_premium: boolean;
  is_important: boolean;
  is_frequently_repeated: boolean;
  file: File | null;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

export default function AdminPYQs() {
  const { user } = useAuth();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPyq, setEditingPyq] = useState<PYQ | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PYQFormData>({
    title: '',
    year: currentYear,
    subject_id: '',
    is_premium: false,
    is_important: false,
    is_frequently_repeated: false,
    file: null,
  });

  useEffect(() => {
    fetchPyqs();
    fetchSubjects();
  }, []);

  async function fetchPyqs() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('pyqs')
      .select('*')
      .order('year', { ascending: false });

    if (error) {
      toast.error('Failed to fetch PYQs');
      console.error(error);
    } else {
      setPyqs(data || []);
    }
    setIsLoading(false);
  }

  async function fetchSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch subjects');
      console.error(error);
    } else {
      setSubjects(data || []);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      year: currentYear,
      subject_id: '',
      is_premium: false,
      is_important: false,
      is_frequently_repeated: false,
      file: null,
    });
    setEditingPyq(null);
  }

  function openEditDialog(pyq: PYQ) {
    setEditingPyq(pyq);
    setFormData({
      title: pyq.title,
      year: pyq.year,
      subject_id: pyq.subject_id || '',
      is_premium: pyq.is_premium || false,
      is_important: pyq.is_important || false,
      is_frequently_repeated: pyq.is_frequently_repeated || false,
      file: null,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.year) {
      toast.error('Year is required');
      return;
    }

    if (!editingPyq && !formData.file) {
      toast.error('Please select a PDF file');
      return;
    }

    setIsSubmitting(true);

    try {
      let file_url = editingPyq?.file_url || '';
      let file_name = editingPyq?.file_name || '';

      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pyqs')
          .upload(fileName, formData.file);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('pyqs')
          .getPublicUrl(fileName);

        file_url = urlData.publicUrl;
        file_name = formData.file.name;

        // Delete old file if updating
        if (editingPyq?.file_url) {
          const oldFileName = editingPyq.file_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('pyqs').remove([oldFileName]);
          }
        }
      }

      if (editingPyq) {
        const updateData: TablesUpdate<'pyqs'> = {
          title: formData.title.trim(),
          year: formData.year,
          subject_id: formData.subject_id || null,
          is_premium: formData.is_premium,
          is_important: formData.is_important,
          is_frequently_repeated: formData.is_frequently_repeated,
          file_url,
          file_name,
        };

        const { error } = await supabase
          .from('pyqs')
          .update(updateData)
          .eq('id', editingPyq.id);

        if (error) throw error;
        toast.success('PYQ updated successfully');
      } else {
        const insertData: TablesInsert<'pyqs'> = {
          title: formData.title.trim(),
          year: formData.year,
          subject_id: formData.subject_id || null,
          is_premium: formData.is_premium,
          is_important: formData.is_important,
          is_frequently_repeated: formData.is_frequently_repeated,
          file_url,
          file_name,
          created_by: user?.id,
        };

        const { error } = await supabase
          .from('pyqs')
          .insert(insertData);

        if (error) throw error;
        toast.success('PYQ created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPyqs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save PYQ');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(pyq: PYQ) {
    try {
      // Delete file from storage
      if (pyq.file_url) {
        const fileName = pyq.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('pyqs').remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('pyqs')
        .delete()
        .eq('id', pyq.id);

      if (error) throw error;
      toast.success('PYQ deleted successfully');
      fetchPyqs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete PYQ');
      console.error(error);
    }
  }

  function getSubjectName(subjectId: string | null) {
    if (!subjectId) return 'Unassigned';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown';
  }

  const filteredPyqs = pyqs.filter(pyq => {
    const matchesSearch = pyq.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || pyq.subject_id === filterSubject;
    const matchesYear = filterYear === 'all' || pyq.year.toString() === filterYear;
    const matchesType = 
      filterType === 'all' ||
      (filterType === 'premium' && pyq.is_premium) ||
      (filterType === 'free' && !pyq.is_premium) ||
      (filterType === 'important' && pyq.is_important) ||
      (filterType === 'repeated' && pyq.is_frequently_repeated);
    
    return matchesSearch && matchesSubject && matchesYear && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">PYQs Management</h1>
          <p className="text-muted-foreground">Upload and manage previous year questions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload PYQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPyq ? 'Edit PYQ' : 'Upload New PYQ'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Data Structures Mid-Sem 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={formData.subject_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Subject</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">PDF File {!editingPyq && '*'}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="flex-1"
                  />
                  {formData.file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData({ ...formData, file: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {editingPyq && !formData.file && (
                  <p className="text-sm text-muted-foreground">
                    Current: {editingPyq.file_name || 'Unknown file'}
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-medium">Flags</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <Label htmlFor="is_premium" className="cursor-pointer">Premium Only</Label>
                  </div>
                  <Switch
                    id="is_premium"
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <Label htmlFor="is_important" className="cursor-pointer">Mark as Important</Label>
                  </div>
                  <Switch
                    id="is_important"
                    checked={formData.is_important}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_important: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="is_frequently_repeated" className="cursor-pointer">Frequently Repeated</Label>
                  </div>
                  <Switch
                    id="is_frequently_repeated"
                    checked={formData.is_frequently_repeated}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_frequently_repeated: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      {editingPyq ? 'Updating...' : 'Uploading...'}
                    </>
                  ) : (
                    editingPyq ? 'Update PYQ' : 'Upload PYQ'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search PYQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="repeated">Frequently Repeated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PYQs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All PYQs ({filteredPyqs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredPyqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No PYQs Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterSubject !== 'all' || filterYear !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Upload your first PYQ to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPyqs.map((pyq) => (
                    <TableRow key={pyq.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{pyq.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pyq.year}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {getSubjectName(pyq.subject_id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pyq.is_premium && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              <Crown className="mr-1 h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                          {pyq.is_important && (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Star className="mr-1 h-3 w-3" />
                              Important
                            </Badge>
                          )}
                          {pyq.is_frequently_repeated && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <Repeat className="mr-1 h-3 w-3" />
                              Repeated
                            </Badge>
                          )}
                          {!pyq.is_premium && !pyq.is_important && !pyq.is_frequently_repeated && (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={pyq.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(pyq)}
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
                                <AlertDialogTitle>Delete PYQ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{pyq.title}" and its associated file. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(pyq)}
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
