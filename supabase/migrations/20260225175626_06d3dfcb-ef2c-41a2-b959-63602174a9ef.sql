
-- Make the class-materials bucket private
UPDATE storage.buckets SET public = false WHERE id = 'class-materials';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Class materials are publicly accessible" ON storage.objects;

-- Allow authenticated users who are teachers or enrolled students to view class materials
-- Files are stored as {classId}/{uuid}.{ext}
CREATE POLICY "Teachers and enrolled students can view class materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'class-materials'
  AND auth.uid() IS NOT NULL
  AND (
    -- Teacher of the class
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = ((storage.foldername(name))[1])::uuid
        AND c.teacher_id = auth.uid()
    )
    OR
    -- Enrolled student in the class
    EXISTS (
      SELECT 1 FROM class_enrollments ce
      WHERE ce.class_id = ((storage.foldername(name))[1])::uuid
        AND ce.student_id = auth.uid()
        AND ce.status = 'active'
    )
  )
);
