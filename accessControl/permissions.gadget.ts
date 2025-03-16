import type { GadgetPermissions } from "gadget-server";

/**
 * This metadata describes the access control configuration available in your application.
 * Grants that are not defined here are set to false by default.
 *
 * View and edit your roles and permissions in the Gadget editor at https://feed-the-people.gadget.app/edit/settings/permissions
 */
export const permissions: GadgetPermissions = {
  type: "gadget/permissions/v1",
  roles: {
    "signed-in": {
      storageKey: "signed-in",
      default: {
        read: true,
        action: true,
      },
      models: {
        message: {
          read: {
            filter: "accessControl/filters/message/tenant.gelly",
          },
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        post: {
          read: {
            filter: "accessControl/filters/post/signed-in-read.gelly",
          },
          actions: {
            create: {
              filter:
                "accessControl/filters/post/signed-in-read.gelly",
            },
            delete: {
              filter:
                "accessControl/filters/post/signed-in-delete.gelly",
            },
            update: {
              filter:
                "accessControl/filters/post/signed-in-update.gelly",
            },
          },
        },
        shareScore: {
          read: true,
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        user: {
          read: {
            filter: "accessControl/filters/user/tenant.gelly",
          },
          actions: {
            changePassword: {
              filter: "accessControl/filters/user/tenant.gelly",
            },
            signOut: {
              filter: "accessControl/filters/user/tenant.gelly",
            },
            update: {
              filter:
                "accessControl/filters/user/signed-in-update.gelly",
            },
          },
        },
      },
    },
    unauthenticated: {
      storageKey: "unauthenticated",
      models: {
        post: {
          read: true,
        },
        user: {
          read: true,
          actions: {
            resetPassword: true,
            sendResetPassword: true,
            sendVerifyEmail: true,
            signIn: true,
            signUp: true,
            verifyEmail: true,
          },
        },
      },
    },
  },
};
