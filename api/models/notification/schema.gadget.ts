import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "notification" model, go to https://feed-the-people.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "TmRw-57WCIR8",
  comment:
    "This model stores notifications for users, with fields to categorize and provide context for the notifications.",
  fields: {
    content: {
      type: "string",
      validations: { required: true },
      storageKey: "kWhz_f49mgYP",
    },
    isRead: {
      type: "boolean",
      default: false,
      storageKey: "V3nrxQMq3V9J",
    },
    metadata: { type: "json", storageKey: "TkxON6DKrrdX" },
    recipient: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "skiG-E2TQwRi",
    },
    relatedPostId: { type: "string", storageKey: "wYgOTm1aEduZ" },
    sender: {
      type: "belongsTo",
      parent: { model: "user" },
      storageKey: "7Tg65YqKALN1",
    },
    type: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["post_completed", "message_received", "system"],
      validations: { required: true },
      storageKey: "GUQOKV9EvO8P",
    },
  },
};
