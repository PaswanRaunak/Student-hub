import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText, ClipboardList, CheckSquare, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
  id: string;
  title: string;
  type: 'note' | 'pyq' | 'assignment';
  subtitle?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchAll = async () => {
      setIsLoading(true);
      try {
        const searchTerm = `%${debouncedQuery}%`;

        const [notesRes, pyqsRes, assignmentsRes] = await Promise.all([
          supabase
            .from('notes')
            .select('id, title, chapter')
            .ilike('title', searchTerm)
            .limit(5),
          supabase
            .from('pyqs')
            .select('id, title, year')
            .ilike('title', searchTerm)
            .limit(5),
          supabase
            .from('assignments')
            .select('id, title, subject')
            .ilike('title', searchTerm)
            .limit(5),
        ]);

        const searchResults: SearchResult[] = [
          ...(notesRes.data || []).map((note) => ({
            id: note.id,
            title: note.title,
            type: 'note' as const,
            subtitle: note.chapter || 'Study Material',
          })),
          ...(pyqsRes.data || []).map((pyq) => ({
            id: pyq.id,
            title: pyq.title,
            type: 'pyq' as const,
            subtitle: `Year ${pyq.year}`,
          })),
          ...(assignmentsRes.data || []).map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            type: 'assignment' as const,
            subtitle: assignment.subject,
          })),
        ];

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchAll();
  }, [debouncedQuery]);

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    setQuery('');
    
    switch (result.type) {
      case 'note':
        navigate('/notes');
        break;
      case 'pyq':
        navigate('/pyqs');
        break;
      case 'assignment':
        navigate('/assignments');
        break;
    }
  }, [navigate]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4 text-primary" />;
      case 'pyq':
        return <ClipboardList className="h-4 w-4 text-warning" />;
      case 'assignment':
        return <CheckSquare className="h-4 w-4 text-success" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'note':
        return 'Note';
      case 'pyq':
        return 'PYQ';
      case 'assignment':
        return 'Assignment';
    }
  };

  const noteResults = results.filter((r) => r.type === 'note');
  const pyqResults = results.filter((r) => r.type === 'pyq');
  const assignmentResults = results.filter((r) => r.type === 'assignment');

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search notes, PYQs, assignments..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : query.length < 2 ? (
            <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <>
              {noteResults.length > 0 && (
                <CommandGroup heading="Notes">
                  {noteResults.map((result) => (
                    <CommandItem
                      key={`note-${result.id}`}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3"
                    >
                      {getIcon(result.type)}
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {pyqResults.length > 0 && (
                <CommandGroup heading="Previous Year Questions">
                  {pyqResults.map((result) => (
                    <CommandItem
                      key={`pyq-${result.id}`}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3"
                    >
                      {getIcon(result.type)}
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {assignmentResults.length > 0 && (
                <CommandGroup heading="Assignments">
                  {assignmentResults.map((result) => (
                    <CommandItem
                      key={`assignment-${result.id}`}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3"
                    >
                      {getIcon(result.type)}
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
