import { useState, useEffect } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { CardGridSkeleton } from '@/components/skeletons/CardGridSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Eye, Search } from 'lucide-react';

export default function Notes() {
  const [notes, setNotes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [notesRes, subjectsRes] = await Promise.all([
        supabase.from('notes').select('*, subject:subjects(name)').order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').order('name')
      ]);
      setNotes(notesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || note.subject_id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <StudentLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Browse and download study materials</p>
        </div>

        {isLoading ? (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-full sm:w-48" />
            </div>
            <CardGridSkeleton count={6} />
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredNotes.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No notes found.</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className="card-hover">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-base mt-3">{note.title}</CardTitle>
                      <CardDescription>{note.subject?.name} {note.chapter && `• ${note.chapter}`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" asChild>
                          <a href={note.file_url} target="_blank" rel="noopener noreferrer"><Eye className="mr-1 h-4 w-4" />Preview</a>
                        </Button>
                        <Button size="sm" className="flex-1" asChild>
                          <a href={note.file_url} download><Download className="mr-1 h-4 w-4" />Download</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
