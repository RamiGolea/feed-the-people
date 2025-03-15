import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "message" model, go to https://feed-the-people.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "eiBJjUsaFOsY",
  comment:
    "The message model represents private direct messages between users, including the sender, recipient, and content of the message.",
  fields: {
    content: {
      type: "string",
      validations: { required: true },
      storageKey: "ptXUaA4QiQzW",
    },
    post: {
      type: "belongsTo",
      parent: { model: "post" },
      storageKey: "-WJZcKoAgDS1",
    },
    read: {
      type: "boolean",
      default: false,
      storageKey: "EnEkDKmaRoqF",
    },
    recipient: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "5WXuANxBu4R6",
    },
    sender: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "fjwHbPUNIT21",
    },
    status: {
      type: "enum",
      default: "active",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["active", "archived", "deleted"],
      validations: { required: true },
      storageKey: "ymgL7Kv58rgq",
    },
  },
};
