import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "user" model, go to https://feed-the-people.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "YfhwtKQHsIeJ",
  fields: {
    allergies: { type: "string", storageKey: "nw-YHL8VSlEC" },
    bio: { type: "string", storageKey: "9uLLTVUleVML" },
    dietaryPreferences: {
      type: "string",
      storageKey: "zFFREgItrvYl",
    },
    email: {
      type: "email",
      validations: { required: true, unique: true },
      storageKey: "OSwCSfGb3tTz",
    },
    emailVerificationToken: {
      type: "string",
      storageKey: "GXtdSXO0GsZk",
    },
    emailVerificationTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "ATGuMP5Z6tZL",
    },
    emailVerified: {
      type: "boolean",
      default: false,
      storageKey: "SXW30Vzq_ZuK",
    },
    firstName: { type: "string", storageKey: "UTUIWoGy9qLj" },
    googleImageUrl: { type: "url", storageKey: "OhA9KOcBhVkf" },
    googleProfileId: { type: "string", storageKey: "_SDPwurg87od" },
    lastName: { type: "string", storageKey: "YjfcoHFdap0M" },
    lastSignedIn: {
      type: "dateTime",
      includeTime: true,
      storageKey: "gvTDhqB62Z76",
    },
    password: {
      type: "password",
      validations: { strongPassword: true },
      storageKey: "-GE0gbaiLyO6",
    },
    resetPasswordToken: {
      type: "string",
      storageKey: "UgqchIJt1l7b",
    },
    resetPasswordTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "9SoQvowpbu_l",
    },
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "n9hXFvDruzhn",
    },
  },
};
