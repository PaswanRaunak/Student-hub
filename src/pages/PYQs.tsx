import { useState, useEffect } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { CardGridSkeleton } from '@/components/skeletons/CardGridSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Download, Eye, Star, Repeat } from 'lucide-react';

export default function PYQs() {
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [pyqsRes, subjectsRes] = await Promise.all([
        supabase.from('pyqs').select('*, subject:subjects(name)').order('year', { ascending: false }),
        supabase.from('subjects').select('*').order('name')
      ]);
      setPyqs(pyqsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const years = [...new Set(pyqs.map(p => p.year))].sort((a, b) => b - a);
  const filteredPyqs = pyqs.filter(p => {
    const matchesSubject = selectedSubject === 'all' || p.subject_id === selectedSubject;
    const matchesYear = selectedYear === 'all' || p.year.toString() === selectedYear;
    return matchesSubject && matchesYear;
  });

  return (
    <StudentLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Previous Year Questions</h1>
          <p className="text-muted-foreground">Practice with past exam papers</p>
        </div>

        {isLoading ? (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-full sm:w-48" />
              <Skeleton className="h-10 w-full sm:w-32" />
            </div>
            <CardGridSkeleton count={6} />
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredPyqs.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No PYQs found.</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPyqs.map((pyq) => (
                  <Card key={pyq.id} className="card-hover">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                          <ClipboardList className="h-5 w-5 text-warning" />
                        </div>
                        <div className="flex gap-1">
                          {pyq.is_important && <Badge variant="outline" className="text-xs"><Star className="h-3 w-3" /></Badge>}
                          {pyq.is_frequently_repeated && <Badge variant="outline" className="text-xs"><Repeat className="h-3 w-3" /></Badge>}
                        </div>
                      </div>
                      <CardTitle className="text-base mt-3">{pyq.title}</CardTitle>
                      <CardDescription>{pyq.subject?.name} • {pyq.year}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" asChild>
                          <a href={pyq.file_url} target="_blank" rel="noopener noreferrer"><Eye className="mr-1 h-4 w-4" />Preview</a>
                        </Button>
                        <Button size="sm" className="flex-1" asChild>
                          <a href={pyq.file_url} download><Download className="mr-1 h-4 w-4" />Download</a>
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
