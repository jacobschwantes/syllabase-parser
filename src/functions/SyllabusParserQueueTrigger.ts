import { app, InvocationContext } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";
import { parseSyllabus } from "../utils/gpt";
import { validateQueueItem } from "../utils/validation";
import { getCourseDocument } from "../utils/db";
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const supabaseKey = process.env["SUPABASE_KEY"];
const supabseUrl = process.env["SUPABASE_ENDPOINT"];
const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const azureApiKey = process.env["AZURE_OPENAI_KEY"];
const deploymentId = process.env["AZURE_OPENAI_DEPLOYMENT_ID"];

export async function SyllabusParserQueueTrigger(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  try {
    const start = Date.now();
    context.log("Processing queue item: ", queueItem);
    const { courseId } = validateQueueItem(queueItem, context);
    const supabase = createClient(supabseUrl, supabaseKey);
    const openai = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(azureApiKey)
    );
    const courseDocument = await getCourseDocument(supabase, context, courseId);
    await parseSyllabus(
      openai,
      supabase,
      context,
      deploymentId,
      courseDocument
    );
    const end = Date.now();
    context.log(
      `Syllabus parsing for course id: ${courseId} completed in ${
        (end - start) / 1000
      } seconds`
    );
  } catch (error) {
    context.error("Error encountered:", error.message);
    throw error;
  }
}

app.storageQueue("SyllabusParserQueueTrigger", {
  queueName: "syllabus-parser-queue",
  connection: "AzureWebJobsStorage",
  handler: SyllabusParserQueueTrigger,
});
