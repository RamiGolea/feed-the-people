import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, session }) => {
  // Get the current user ID from session
  const currentUserId = session?.get("user");
  
  if (!currentUserId && !params.targetUserId) {
    logger.error("No user found in session and no targetUserId provided. Cannot fix posts.");
    return { 
      success: false, 
      postsFound: 0, 
      postsFixed: 0, 
      error: "No user found in session and no targetUserId provided" 
    };
  }

  // Use provided targetUserId or fallback to current user
  const userIdToAssign = params.targetUserId || currentUserId;
  
  // Find posts without users
  let postsToFix;
  
  try {
    if (params.specificPosts && params.specificPosts.length > 0) {
      // If specific post IDs were provided, only fix those
      postsToFix = await api.post.findMany({
        filter: {
          AND: [
            { id: { in: params.specificPosts } },
            { userId: { isSet: false } }
          ]
        }
      });
    } else {
      // Otherwise find all posts without users
      postsToFix = await api.post.findMany({
        filter: {
          userId: { isSet: false }
        }
      });
    }
  } catch (error) {
    logger.error("Error finding posts without users:", error);
    return { 
      success: false, 
      postsFound: 0, 
      postsFixed: 0, 
      error: `Error finding posts: ${error.message}` 
    };
  }

  logger.info(`Found ${postsToFix.length} posts without users.`);

  // Track statistics
  let postsFixed = 0;
  let errors = [];

  // Assign user to each post
  for (const post of postsToFix) {
    try {
      await api.post.update(post.id, {
        user: { _link: userIdToAssign }
      });
      postsFixed++;
      logger.debug(`Fixed post ${post.id}, assigned to user ${userIdToAssign}`);
    } catch (error) {
      logger.error(`Error updating post ${post.id}:`, error);
      errors.push({ postId: post.id, error: error.message });
    }
  }

  // Return statistics
  return {
    success: true,
    postsFound: postsToFix.length,
    postsFixed,
    errors: errors.length > 0 ? errors : undefined
  };
};

export const params = {
  specificPosts: {
    type: "array",
    items: { type: "string" }
  },
  targetUserId: { type: "string" }
};

export const options: ActionOptions = {
  returnType: true
};