-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'admin');

-- Create subscription_status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('free', 'premium')),
  price NUMERIC DEFAULT 0,
  monthly_applications INTEGER DEFAULT 5,
  max_assignments INTEGER DEFAULT 10,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  college TEXT,
  course TEXT,
  semester TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  semester TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  is_premium BOOLEAN DEFAULT false,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pyqs table
CREATE TABLE public.pyqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_frequently_repeated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create application_templates table
CREATE TABLE public.application_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  template_content TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create application_usages table
CREATE TABLE public.application_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.application_templates(id) ON DELETE SET NULL,
  generated_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Create helper function to check if user has premium subscription
CREATE OR REPLACE FUNCTION public.is_premium_subscriber(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND p.type = 'premium'
      AND (s.expiry_date IS NULL OR s.expiry_date > now())
  )
$$;

-- Create helper function to get monthly application count
CREATE OR REPLACE FUNCTION public.get_monthly_application_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.application_usages
  WHERE user_id = _user_id
    AND created_at >= date_trunc('month', now())
$$;

-- Create helper function to get user's assignment count
CREATE OR REPLACE FUNCTION public.get_assignment_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.assignments
  WHERE user_id = _user_id
$$;

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM public.plans WHERE type = 'free' LIMIT 1;
  
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, free_plan_id, 'active');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pyqs_updated_at
  BEFORE UPDATE ON public.pyqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_templates_updated_at
  BEFORE UPDATE ON public.application_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for plans (public read)
CREATE POLICY "Anyone can view plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert plans"
  ON public.plans FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update plans"
  ON public.plans FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete plans"
  ON public.plans FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete subscriptions"
  ON public.subscriptions FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for subjects (public read)
CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update subjects"
  ON public.subjects FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete subjects"
  ON public.subjects FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for notes
CREATE POLICY "Users can view free notes or premium if subscribed"
  ON public.notes FOR SELECT
  TO authenticated
  USING (NOT is_premium OR public.is_premium_subscriber(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert notes"
  ON public.notes FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update notes"
  ON public.notes FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete notes"
  ON public.notes FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for pyqs
CREATE POLICY "Users can view free pyqs or premium if subscribed"
  ON public.pyqs FOR SELECT
  TO authenticated
  USING (NOT is_premium OR public.is_premium_subscriber(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert pyqs"
  ON public.pyqs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update pyqs"
  ON public.pyqs FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete pyqs"
  ON public.pyqs FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for application_templates
CREATE POLICY "Anyone can view active templates"
  ON public.application_templates FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert templates"
  ON public.application_templates FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update templates"
  ON public.application_templates FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete templates"
  ON public.application_templates FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for application_usages
CREATE POLICY "Users can view their own usage"
  ON public.application_usages FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own usage"
  ON public.application_usages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for assignments
CREATE POLICY "Users can view their own assignments"
  ON public.assignments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments"
  ON public.assignments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own assignments"
  ON public.assignments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Insert default plans
INSERT INTO public.plans (name, type, price, monthly_applications, max_assignments, features)
VALUES 
  ('Free Plan', 'free', 0, 5, 10, '["Access to free notes", "Access to free PYQs", "5 applications/month", "10 assignments max"]'::jsonb),
  ('Premium Student', 'premium', 99, -1, -1, '["Access to all notes", "Access to all PYQs", "Unlimited applications", "Unlimited assignments", "Priority support"]'::jsonb);

-- Insert default application templates
INSERT INTO public.application_templates (name, category, template_content, placeholders, is_active)
VALUES 
  ('Leave Application', 'leave', 'To,
The Principal,
{{college}}

Subject: Application for Leave

Respected Sir/Madam,

I, {{name}}, a student of {{class}} with Roll Number {{roll_number}}, would like to request leave from {{from_date}} to {{to_date}} due to {{reason}}.

I kindly request you to grant me leave for the mentioned period.

Thanking you,

Yours sincerely,
{{name}}
Date: {{date}}', '["name", "college", "class", "roll_number", "from_date", "to_date", "reason", "date"]'::jsonb, true),

  ('Medical Leave Application', 'medical', 'To,
The Principal,
{{college}}

Subject: Application for Medical Leave

Respected Sir/Madam,

I, {{name}}, a student of {{class}} with Roll Number {{roll_number}}, am suffering from {{medical_condition}} and have been advised rest by my doctor.

I request you to kindly grant me medical leave from {{from_date}} to {{to_date}}.

I am attaching the medical certificate for your reference.

Thanking you,

Yours sincerely,
{{name}}
Date: {{date}}', '["name", "college", "class", "roll_number", "medical_condition", "from_date", "to_date", "date"]'::jsonb, true),

  ('Fee Concession Request', 'fee', 'To,
The Principal,
{{college}}

Subject: Request for Fee Concession

Respected Sir/Madam,

I, {{name}}, a student of {{class}} with Roll Number {{roll_number}}, hereby request a fee concession for the current academic session.

My family''s financial condition is not stable due to {{reason}}. My father/guardian works as {{guardian_occupation}} and our monthly income is approximately Rs. {{monthly_income}}.

I humbly request you to consider my application and grant me a fee concession.

Thanking you,

Yours sincerely,
{{name}}
Date: {{date}}', '["name", "college", "class", "roll_number", "reason", "guardian_occupation", "monthly_income", "date"]'::jsonb, true),

  ('Bonafide Certificate Request', 'bonafide', 'To,
The Principal,
{{college}}

Subject: Request for Bonafide Certificate

Respected Sir/Madam,

I, {{name}}, am a bonafide student of {{class}} with Roll Number {{roll_number}} in your esteemed institution.

I require a bonafide certificate for {{purpose}}.

I kindly request you to issue the same at the earliest.

Thanking you,

Yours sincerely,
{{name}}
Date: {{date}}', '["name", "college", "class", "roll_number", "purpose", "date"]'::jsonb, true);

-- Insert some default subjects
INSERT INTO public.subjects (name, code, semester)
VALUES 
  ('Mathematics', 'MATH101', '1'),
  ('Physics', 'PHY101', '1'),
  ('Chemistry', 'CHEM101', '1'),
  ('English', 'ENG101', '1'),
  ('Computer Science', 'CS101', '1'),
  ('Data Structures', 'CS201', '3'),
  ('Database Management', 'CS301', '5'),
  ('Operating Systems', 'CS302', '5');