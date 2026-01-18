-- Create assignment_reminders table
CREATE TABLE public.assignment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  is_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own reminders"
ON public.assignment_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
ON public.assignment_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.assignment_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.assignment_reminders FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient querying
CREATE INDEX idx_reminders_user_remind_at ON public.assignment_reminders(user_id, remind_at) WHERE is_notified = false;