import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const params = {
  recipient: { type: "string" }
};

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  
  // Ensure users can only complete their own posts
  await preventCrossUserDataAccess(params, record);
  
  // Check if the post is already archived
  if (record.status === "Archived") {
    throw new Error("This post is already archived");
  }
  
  // If a recipient email was provided, verify that a user with this email exists
  if (params.recipient) {
    const recipientUser = await api.user.findFirst({
      filter: { email: { equals: params.recipient } },
      select: { id: true, email: true }
    }).catch(() => null);

    if (!recipientUser) {
      throw new Error(`No user found with email ${params.recipient}. Please provide a valid email.`);
    }
    
    logger.info(`Verified recipient ${params.recipient} exists in the user database`);
  }
  
  // Set the post status to "Archived"
  record.status = "Archived";
  
  // Save the changes to the database
  await save(record);
  
  // If a recipient email was provided, create a notification and send an email
  if (params.recipient) {
    // Get the sender (post creator) information
    const sender = await api.user.findFirst({
      filter: { id: { equals: record.userId } },
      select: { 
        firstName: true, 
        lastName: true,
        email: true
      }
    });
    
    // Get the recipient user (already verified to exist)
    const recipientUser = await api.user.findFirst({
      filter: { email: { equals: params.recipient } },
      select: { id: true, email: true, firstName: true }
    });
    
    // Create metadata with relevant post details, ensuring all fields are JSON-serializable
    const notificationMetadata = {
      postTitle: record.title || null,
      postDescription: record.description || null,
      postCategory: record.category || null,
      location: record.location || null,
      // Format date as ISO string if present, or null if not
      goBadDate: record.goBadDate ? record.goBadDate.toISOString() : null,
      foodAllergens: record.foodAllergens || null
    };
    
    try {
      // Create notification in the database
      await api.notification.create({
        content: `The food sharing post "${record.title}" has been archived.`,
        type: "post_completed",
        isRead: false,
        sender: {
          _link: record.userId
        },
        recipient: {
          _link: recipientUser.id
        },
        relatedPostId: record.id,
        metadata: notificationMetadata
      });
      
      logger.info(`Created notification for user ${recipientUser.id} about completed post ${record.id}`);
    } catch (error) {
      logger.error(`Failed to create notification for completed post ${record.id}: ${error}`);
    }
  }
};

export const options: ActionOptions = {
  actionType: "update",
};
