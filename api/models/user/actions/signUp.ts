import { applyParams, save, ActionOptions } from "gadget-server";

// Powers the form in web/routes/sign-up.tsx

export const run: ActionRun = async ({ params, record, logger, api, session }) => {
  // Applies new 'email' and 'password' to the user record and saves to database
  applyParams(params, record);
  record.lastSignedIn = new Date();
  await save(record);
  if (record.emailVerified) {
    // Assigns the signed-in user to the active session
    session?.set("user", { _link: record.id });
  }
  return {
    result: "ok"
  }
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, session }) => {
  // Create a new shareScore record for the user with a default score of 1000
  await api.shareScore.create({
    score: 1000,
    user: {
      _link: record.id
    }
  });
  
  logger.info(`Created shareScore for user ${record.id} with default score of 1000`);

  if (!record.emailVerified) {
    // Sends verification email by calling api/models/users/actions/sendVerifyEmail.ts
    await api.user.sendVerifyEmail({ email: record.email });
  }
};

export const options: ActionOptions = {
  actionType: "create",
  returnType: true,
  triggers: {
    googleOAuthSignUp: true,
    emailSignUp: true,
  },
};
