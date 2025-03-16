import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api }) => {
  const { notificationId, voteType } = params;
  
  // Find the notification by ID
  const notification = await api.notification.findOne(notificationId);
  
  if (!notification.senderId) {
    return { success: false, message: "Notification has no sender" };
  }
  
  try {
    // Find the sender's share score
    const senderShareScore = await api.shareScore.findOne({
      filter: { userId: { equals: notification.senderId } }
    });
    
    // Update the score based on vote type
    const scoreChange = voteType === "upvote" ? 1 : -1;
    await api.shareScore.update(senderShareScore.id, {
      score: (senderShareScore.score || 0) + scoreChange,
      lastUpdated: new Date().toISOString()
    });
    
    // Delete the notification
    await api.notification.delete(notificationId);
    
    return { 
      success: true, 
      message: `Successfully ${voteType === "upvote" ? "upvoted" : "downvoted"} the notification`,
      scoreChange
    };
  } catch (error) {
    logger.error("Error processing vote on notification", { error, notificationId, voteType });
    return { success: false, message: "Failed to process vote" };
  }
};

export const params = {
  notificationId: { type: "string" },
  voteType: { 
    type: "string",
    enum: ["upvote", "downvote"]
  }
};

export const options: ActionOptions = {
  returnType: true
};