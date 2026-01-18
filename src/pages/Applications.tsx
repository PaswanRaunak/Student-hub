import { useState, useEffect } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { FileEdit, Copy, Download, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Applications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('application_templates').select('*').eq('is_active', true);
      setTemplates(data || []);
    };
    fetchData();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    setGeneratedContent('');
    const initialData: Record<string, string> = {};
    (template?.placeholders || []).forEach((p: string) => { initialData[p] = ''; });
    initialData['date'] = new Date().toLocaleDateString('en-IN');
    setFormData(initialData);
  };

  const generateApplication = async () => {
    if (!selectedTemplate) return;
    let content = selectedTemplate.template_content;
    Object.entries(formData).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    });
    setGeneratedContent(content);
    
    await supabase.from('application_usages').insert({
      user_id: user?.id,
      template_id: selectedTemplate.id,
      generated_content: content
    });
    toast({ title: 'Application Generated!', description: 'You can now copy or download it.' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Application copied to clipboard.' });
  };

  return (
    <StudentLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Application Writer</h1>
          <p className="text-muted-foreground">Generate college-ready applications instantly</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Application</CardTitle>
              <CardDescription>Select a template and fill in your details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Application Type</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (selectedTemplate.placeholders || []).map((placeholder: string) => (
                <div key={placeholder} className="space-y-2">
                  <Label className="capitalize">{placeholder.replace(/_/g, ' ')}</Label>
                  <Input
                    value={formData[placeholder] || ''}
                    onChange={(e) => setFormData({ ...formData, [placeholder]: e.target.value })}
                    placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}

              {selectedTemplate && (
                <Button onClick={generateApplication} className="w-full">
                  Generate Application
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generated Application</CardTitle>
              <CardDescription>Preview and download your application</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  <Textarea value={generatedContent} readOnly className="min-h-[300px] font-mono text-sm" />
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button className="flex-1"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <FileEdit className="h-12 w-12 mb-4 opacity-20" />
                  <p>Select a template to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
