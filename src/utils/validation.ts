import { InvocationContext } from "@azure/functions";

type queueItem = {
  courseId: string;
};

/**
 * Validates the queue item to make sure it has a valid course id.
 * @param queueItem - The queue item to be validated.
 * @param context - The invocation context.
 * @returns The validated queue item.
 */
export const validateQueueItem = (queueItem: unknown, context: InvocationContext) => {
  try {
    switch (queueItem) {
      case undefined || null:
        throw new Error("No queue item found");
      case typeof queueItem !== "object":
        throw new Error("Queue item is not an object");
      case !queueItem.hasOwnProperty("courseId"):
        throw new Error("Queue item does not have an id");
      default:
        return queueItem as queueItem;
    }
  } catch (error) {
    context.error(`Queue item validation failed with: ${error.message}`);
  }
};
