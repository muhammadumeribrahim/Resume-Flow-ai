-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create saved_resumes table
CREATE TABLE public.saved_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  resume_data JSONB NOT NULL,
  ats_score INTEGER,
  target_job TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on saved_resumes
ALTER TABLE public.saved_resumes ENABLE ROW LEVEL SECURITY;

-- Saved resumes policies
CREATE POLICY "Users can view their own resumes" 
ON public.saved_resumes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes" 
ON public.saved_resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
ON public.saved_resumes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
ON public.saved_resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  location TEXT,
  work_type TEXT CHECK (work_type IN ('remote', 'onsite', 'hybrid')),
  status TEXT DEFAULT 'applied' CHECK (status IN ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  resume_id UUID REFERENCES public.saved_resumes(id) ON DELETE SET NULL,
  applied_date DATE,
  job_url TEXT,
  salary_range TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Job applications policies
CREATE POLICY "Users can view their own applications" 
ON public.job_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
ON public.job_applications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" 
ON public.job_applications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create application_notes table
CREATE TABLE public.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'interview', 'followup', 'feedback')),
  content TEXT NOT NULL,
  note_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on application_notes
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

-- Application notes policies
CREATE POLICY "Users can view notes on their own applications" 
ON public.application_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notes on their own applications" 
ON public.application_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.application_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.application_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_resumes_updated_at
  BEFORE UPDATE ON public.saved_resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better query performance
CREATE INDEX idx_saved_resumes_user_id ON public.saved_resumes(user_id);
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_application_notes_application_id ON public.application_notes(application_id);