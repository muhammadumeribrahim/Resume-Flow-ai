-- Allow 'ghosted' status for job applications
ALTER TABLE public.job_applications
DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE public.job_applications
ADD CONSTRAINT job_applications_status_check
CHECK (
  status = ANY (
    ARRAY[
      'saved'::text,
      'applied'::text,
      'interviewing'::text,
      'offer'::text,
      'rejected'::text,
      'withdrawn'::text,
      'ghosted'::text
    ]
  )
);