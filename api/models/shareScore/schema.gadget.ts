import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shareScore" model, go to https://share-a-byte.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "Fr5ZyuLS366Q",
  comment:
    "This model represents a user's leaderboard entry, tracking their sharing activity score and rank.",
  fields: {
    lastUpdated: {
      type: "dateTime",
      includeTime: true,
      storageKey: "hMhFBADYON13",
    },
    rank: { type: "number", decimals: 0, storageKey: "Mn2z7ubwlnba" },
    score: {
      type: "number",
      default: 0,
      decimals: 0,
      storageKey: "7TLOZzWEKqnc",
    },
    user: {
      type: "belongsTo",
      validations: { required: true, unique: true },
      parent: { model: "user" },
      storageKey: "WiDZs9antLzh",
    },
    userEmail: {
      type: "string",
      validations: { required: true, unique: true },
      storageKey: "-M30LpMnm5tc",
    },
  },
};
