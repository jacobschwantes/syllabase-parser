import { InvocationContext } from "@azure/functions";
import { SupabaseClient } from "@supabase/supabase-js";
import { Course } from "types";
/**
 * Updates a row in a Supabase table.
 *
 * @param client - The Supabase client instance.
 * @param context - The invocation context.
 * @param table - The name of the table.
 * @param updated - The updated field values.
 * @param id - The ID of the row to update.
 * @returns Promise<void>
 * @throws Error if the Supabase row update fails.
 */
export const updateSupabaseEntry = async (
  client: SupabaseClient,
  context: InvocationContext,
  table: string,
  updated: Record<string, unknown>,
  id: string
) => {
  try {
    const { error } = await client.from(table).update(updated).eq("id", id);
    if (error) throw error;
  } catch (error) {
    context.error(
      `Failed to update row with id: ${id} in ${table} table. Reason:`,
      error.message
    );
    throw error;
  }
}

/**
 * Fetches course document by id from the "courses" table in Supabase.
 *
 * @param client - The Supabase client instance.
 * @param context - The invocation context.
 * @param courseId - The ID of the course.
 * @returns Promise<Course> - The raw syllabus text of the course.
 * @throws Error if the Supabase course lookup fails or no raw syllabus text is found.
 */
export const getCourseDocument = async (
    client: SupabaseClient,
    context: InvocationContext,
    courseId: string,
): Promise<Course> => {
    try {
        const { data, error } = await client
            .from("courses")
            .select()
            .eq("id", parseInt(courseId));

        if (error) {
            throw error;
        }
        if (data.length === 0 || !data[0].raw_syllabus_text) {
            throw new Error("Invalid course document. No raw syllabus text found.");
        }
        return data[0];
    } catch (error) {
        context.error(`Supabase course lookup with id: ${courseId} failed. Reason:`, error.message);
        throw error;
    }
};

