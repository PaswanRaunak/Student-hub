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
import { Plus, Edit, Trash2, Search, FileText, Eye, EyeOff, X, Tag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Template = Tables<'application_templates'>;

const categories = [
  'Leave Application',
  'Medical Certificate',
  'Character Certificate',
  'Bonafide Certificate',
  'Fee Concession',
  'Hostel',
  'Library',
  'Examination',
  'Other',
];

interface TemplateFormData {
  name: string;
  category: string;
  template_content: string;
  placeholders: string[];
  is_active: boolean;
}

export default function AdminTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState('');

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: '',
    template_content: '',
    placeholders: [],
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('application_templates')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      toast.error('Failed to fetch templates');
      console.error(error);
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  }

  function resetForm() {
    setFormData({
      name: '',
      category: '',
      template_content: '',
      placeholders: [],
      is_active: true,
    });
    setEditingTemplate(null);
    setNewPlaceholder('');
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template);
    const placeholders = Array.isArray(template.placeholders) 
      ? (template.placeholders as string[]) 
      : [];
    setFormData({
      name: template.name,
      category: template.category,
      template_content: template.template_content,
      placeholders,
      is_active: template.is_active ?? true,
    });
    setIsDialogOpen(true);
  }

  function addPlaceholder() {
    const placeholder = newPlaceholder.trim().toUpperCase().replace(/\s+/g, '_');
    if (!placeholder) return;
    if (formData.placeholders.includes(placeholder)) {
      toast.error('Placeholder already exists');
      return;
    }
    setFormData({
      ...formData,
      placeholders: [...formData.placeholders, placeholder],
    });
    setNewPlaceholder('');
  }

  function removePlaceholder(placeholder: string) {
    setFormData({
      ...formData,
      placeholders: formData.placeholders.filter((p) => p !== placeholder),
    });
  }

  function insertPlaceholder(placeholder: string) {
    const textarea = document.getElementById('template_content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.template_content;
    const placeholderText = `{{${placeholder}}}`;
    
    const newText = text.substring(0, start) + placeholderText + text.substring(end);
    setFormData({ ...formData, template_content: newText });
    
    // Set cursor position after placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholderText.length, start + placeholderText.length);
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.template_content.trim()) {
      toast.error('Template content is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTemplate) {
        const updateData: TablesUpdate<'application_templates'> = {
          name: formData.name.trim(),
          category: formData.category,
          template_content: formData.template_content.trim(),
          placeholders: formData.placeholders,
          is_active: formData.is_active,
        };

        const { error } = await supabase
          .from('application_templates')
          .update(updateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const insertData: TablesInsert<'application_templates'> = {
          name: formData.name.trim(),
          category: formData.category,
          template_content: formData.template_content.trim(),
          placeholders: formData.placeholders,
          is_active: formData.is_active,
          created_by: user?.id,
        };

        const { error } = await supabase
          .from('application_templates')
          .insert(insertData);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(template: Template) {
    try {
      const { error } = await supabase
        .from('application_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
      console.error(error);
    }
  }

  async function toggleActive(template: Template) {
    try {
      const { error } = await supabase
        .from('application_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      toast.success(`Template ${template.is_active ? 'deactivated' : 'activated'}`);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update template');
      console.error(error);
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && template.is_active) ||
      (filterStatus === 'inactive' && !template.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const uniqueCategories = [...new Set(templates.map((t) => t.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates Management</h1>
          <p className="text-muted-foreground">Create and manage application templates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Medical Leave Application"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, category: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Select category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Placeholders */}
              <div className="space-y-2">
                <Label>Placeholders</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPlaceholder}
                    onChange={(e) => setNewPlaceholder(e.target.value)}
                    placeholder="e.g., STUDENT_NAME"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPlaceholder();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addPlaceholder}>
                    Add
                  </Button>
                </div>
                {formData.placeholders.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.placeholders.map((placeholder) => (
                      <Badge
                        key={placeholder}
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-primary/20"
                        onClick={() => insertPlaceholder(placeholder)}
                      >
                        <Tag className="h-3 w-3" />
                        {`{{${placeholder}}}`}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlaceholder(placeholder);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Click a placeholder to insert it at cursor position in the template
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_content">Template Content *</Label>
                <Textarea
                  id="template_content"
                  value={formData.template_content}
                  onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                  placeholder="Write your template content here. Use {{PLACEHOLDER_NAME}} for dynamic values."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  {formData.is_active ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="is_active" className="cursor-pointer">
                    {formData.is_active ? 'Active (visible to students)' : 'Inactive (hidden from students)'}
                  </Label>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-sm text-muted-foreground">Total Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <Eye className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates.filter((t) => t.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Active Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-secondary/50 p-3">
              <Tag className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueCategories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
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
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Templates ({filteredTemplates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No Templates Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first template to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Placeholders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const placeholders = Array.isArray(template.placeholders)
                      ? (template.placeholders as string[])
                      : [];
                    return (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {placeholders.length > 0 ? (
                              placeholders.slice(0, 3).map((p) => (
                                <Badge key={p} variant="secondary" className="text-xs">
                                  {p}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {placeholders.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{placeholders.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(template)}
                            className={template.is_active ? 'text-green-600' : 'text-muted-foreground'}
                          >
                            {template.is_active ? (
                              <>
                                <Eye className="mr-1 h-4 w-4" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="mr-1 h-4 w-4" />
                                Inactive
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(template)}
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
                                  <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{template.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(template)}
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
