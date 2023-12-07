import { InvocationContext } from "@azure/functions";
import { updateSupabaseEntry } from "./db";
import { SupabaseClient } from "@supabase/supabase-js";
import { Course } from "types";

const questions = [
  {
    field_name: "full_title",
    table: "",
    question:
      "What is the full title of the course? ex. Algorithms and Data Structures",
    foreign: false,
    fields: [],
    force_array: false,
  },
  {
    field_name: "instructor",
    table: "staff",
    question: "What is the instructor's name and their email?",
    foreign: true,
    fields: ["name", "email"],
    force_array: false,
  },
  {
    field_name: "description",
    table: "",
    question: "What is a good description of the course?",
    foreign: false,
    fields: [],
    force_array: false,
  },
  {
    field_name: "policies",
    table: "",
    question: "What are some of the course policies? Do not list more than 3.",
    foreign: false,
    fields: [],
    force_array: true,
  },
  {
    field_name: "grade_categories",
    table: "",
    question:
      "What are the grade categories and their corresponding percentage as [string, number]? ex. [homework, 20]",
    foreign: false,
    fields: [],
    force_array: true,
  },
  {
    field_name: "important_dates",
    table: "",
    question:
      "What are the important dates and what it is? ex. midterm, final, etc",
    foreign: false,
    fields: [],
    force_array: true,
  },
  {
    field_name: "course_materials",
    table: "",
    question: "What is the list of required course materials?",
    foreign: false,
    fields: [],
    force_array: true,
  },
  {
    field_name: "grade_cutoffs",
    table: "",
    question:
      "What are the grade cutoffs as [string, number, number]? For example: [['A', 100, 90]]",
    foreign: false,
    fields: [],
    force_array: true,
  },
];
/**
 * Parses a syllabus using chat-gpt and updates the corresponding Supabase database entries.
 *
 * @param openAiClient - The OpenAI client.
 * @param supabaseClient - The Supabase client.
 * @param context - The invocation context.
 * @param deploymentId - The ID of the OpenAI model deployment.
 * @param course - The course object containing the raw syllabus text.
 * @returns A Promise that resolves when the syllabus parsing and database updates are complete.
 * @throws If there is an error during syllabus parsing or database updates.
 */
export const parseSyllabus = async (
  openAiClient: any,
  supabaseClient: SupabaseClient,
  context: InvocationContext,
  deploymentId: string,
  course: Course
) => {
  try {
    const rawSyllabus = course.raw_syllabus_text;
    const formattedQuestions = questions
      .map((question) => question.question)
      .join(" ");

    const messages = [
      {
        role: "user",
        content: `Syllabus: "${rawSyllabus}". Questions: "${formattedQuestions}"`,
      },
      {
        role: "system",
        content: `
        You are an AI syllabus parser.
        Your task is to extract specific information from a provided syllabus. 
        For each question asked, provide the answers in a simple array format for example [[answer], [answer, answer], [answer, answer]]. 
        Do not include any extraneous information or commentary. 
        Make every attempt to extrapolate information, using intution when at all possible, otherwise return an empty list.
        Some questions may provide examples or hints for output to help you.
        Do not include the questions in your response, only the answers. 
        Do not number your answers.
        You must return it as a valid javascript array.
        `,
      },
    ];

    const options = {
      topP: 1,
      // temperature: .1,
      max_tokens: 16000,
      stop: null,
    };

    const result = await openAiClient.getChatCompletions(
      deploymentId,
      messages,
      options
    );

    try {
      let filtered = result.choices[0].message.content;
      context.log("Filtered:", filtered);
      let parsed = JSON.parse(filtered);
      let filledDocument = {};

      for (let i = 0; i < questions.length; i++) {
        let question = questions[i];
        let answer = parsed[i];
        if (question.foreign) {
          let newobj = {};
          for (let j = 0; j < question.fields.length; j++) {
            let field = question.fields[j];
            newobj[field] = answer[j];
          }

          await updateSupabaseEntry(
            supabaseClient,
            context,
            question.table,
            newobj,
            course[question.field_name]
          );
        } else {
          if (answer.length === 1) {
            if (!question.force_array) {
              answer = answer[0];
            }
          } else if (answer.length === 0) {
          }
          filledDocument[question.field_name] = answer;
        }
      }

      await updateSupabaseEntry(
        supabaseClient,
        context,
        "courses",
        { ...filledDocument, status: "active" },
        course.id.toString()
      );
    } catch (error) {
      throw new Error(`Couldnt parse raw json: ${error}`);
    }
  } catch (error) {
    context.error("Syllabus parsing failed with:", error);
    throw error;
  }
};
