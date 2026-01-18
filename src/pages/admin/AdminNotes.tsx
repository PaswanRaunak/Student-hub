import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  FileText,
  Search,
  Crown,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  subject_id: string | null;
  chapter: string | null;
  file_url: string;
  file_name: string | null;
  is_premium: boolean;
  description: string | null;
  created_at: string;
  subject?: { name: string } | null;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

export default function AdminNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPremium, setFilterPremium] = useState<string>('all');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    chapter: '',
    description: '',
    is_premium: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [notesRes, subjectsRes] = await Promise.all([
      supabase
        .from('notes')
        .select('*, subject:subjects(name)')
        .order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
    ]);
    
    setNotes(notesRes.data || []);
    setSubjects(subjectsRes.data || []);
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject_id: '',
      chapter: '',
      description: '',
      is_premium: false,
    });
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Error', description: 'Only PDF files are allowed', variant: 'destructive' });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 50MB', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `notes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('notes')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('notes')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreate = async () => {
    if (!formData.title || !selectedFile) {
      toast({ title: 'Error', description: 'Please fill in title and upload a file', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const fileUrl = await uploadFile(selectedFile);
      
      const { error } = await supabase.from('notes').insert({
        title: formData.title,
        subject_id: formData.subject_id || null,
        chapter: formData.chapter || null,
        description: formData.description || null,
        is_premium: formData.is_premium,
        file_url: fileUrl,
        file_name: selectedFile.name,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Note uploaded successfully' });
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingNote || !formData.title) {
      toast({ title: 'Error', description: 'Please fill in the title', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl = editingNote.file_url;
      let fileName = editingNote.file_name;

      // Upload new file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileName = selectedFile.name;
      }

      const { error } = await supabase
        .from('notes')
        .update({
          title: formData.title,
          subject_id: formData.subject_id || null,
          chapter: formData.chapter || null,
          description: formData.description || null,
          is_premium: formData.is_premium,
          file_url: fileUrl,
          file_name: fileName,
        })
        .eq('id', editingNote.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Note updated successfully' });
      setIsEditOpen(false);
      setEditingNote(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteNote) return;

    try {
      // Delete from database
      const { error } = await supabase.from('notes').delete().eq('id', deleteNote.id);
      if (error) throw error;

      toast({ title: 'Success', description: 'Note deleted successfully' });
      setDeleteNote(null);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      subject_id: note.subject_id || '',
      chapter: note.chapter || '',
      description: note.description || '',
      is_premium: note.is_premium,
    });
    setSelectedFile(null);
    setIsEditOpen(true);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = filterSubject === 'all' || note.subject_id === filterSubject;
    const matchesPremium =
      filterPremium === 'all' ||
      (filterPremium === 'premium' && note.is_premium) ||
      (filterPremium === 'free' && !note.is_premium);
    return matchesSearch && matchesSubject && matchesPremium;
  });

  const NoteForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Introduction to Calculus"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={formData.subject_id}
            onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chapter">Chapter</Label>
          <Input
            id="chapter"
            value={formData.chapter}
            onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
            placeholder="e.g., Chapter 1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the notes..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">PDF File {!isEdit && '*'}</Label>
        <div className="flex items-center gap-4">
          <Input
            id="file"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {selectedFile && (
            <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
          )}
        </div>
        {isEdit && !selectedFile && (
          <p className="text-xs text-muted-foreground">
            Current file: {editingNote?.file_name || 'Unknown'}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="premium" className="cursor-pointer">Premium Content</Label>
          <p className="text-xs text-muted-foreground">
            Only premium subscribers can download this note
          </p>
        </div>
        <Switch
          id="premium"
          checked={formData.is_premium}
          onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
        />
      </div>

      <Button
        onClick={isEdit ? handleEdit : handleCreate}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEdit ? 'Updating...' : 'Uploading...'}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {isEdit ? 'Update Note' : 'Upload Note'}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notes Management</h1>
            <p className="text-muted-foreground">Upload and manage study notes</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload New Note</DialogTitle>
                <DialogDescription>
                  Upload a PDF file with study notes for students
                </DialogDescription>
              </DialogHeader>
              <NoteForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPremium} onValueChange={setFilterPremium}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Notes ({filteredNotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{note.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{note.subject?.name || '-'}</TableCell>
                        <TableCell>{note.chapter || '-'}</TableCell>
                        <TableCell>
                          {note.is_premium ? (
                            <Badge className="bg-premium text-premium-foreground">
                              <Crown className="mr-1 h-3 w-3" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(note.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                            >
                              <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(note)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteNote(note)}
                            >
                              <Trash2 className="h-4 w-4" />
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
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingNote(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>
                Update the note details or replace the PDF file
              </DialogDescription>
            </DialogHeader>
            <NoteForm isEdit />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteNote} onOpenChange={(open) => !open && setDeleteNote(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteNote?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
