export type Course = {
  attendance: number | null;
  course_materials: Json[] | null;
  created_at: string;
  description: string | null;
  full_title: string | null;
  grade_categories: Json[] | null;
  grade_cutoffs: Json[] | null;
  id: number;
  important_dates: Json[] | null;
  instructor: number | null;
  policies: Json[] | null;
  profile_id: string | null;
  raw_syllabus_text: string | null;
  specifier: string | null;
  status: string | null;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
