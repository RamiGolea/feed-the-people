import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "post" model, go to https://feed-the-people.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "I4_assSW6qzU",
  comment:
    "Represents a user-created post with details such as title, description, price, and status. Used to display user-generated content in the application.",
  fields: {
    category: { type: "string", storageKey: "6nTJtO9PATMk" },
    condition: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "New",
        "Used - Like New",
        "Used - Good",
        "Used - Fair",
      ],
      storageKey: "md7tUm9lvb7h",
    },
    description: {
      type: "string",
      validations: { required: true },
      storageKey: "WmBlwgE_yplu",
    },
    images: { type: "json", storageKey: "tKWoegh-doOY" },
    location: { type: "string", storageKey: "8A0WiNgImDv5" },
    price: {
      type: "number",
      decimals: 2,
      validations: { required: true },
      storageKey: "qyt80WFaszzg",
    },
    status: {
      type: "enum",
      default: "Active",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["Draft", "Active", "Sold", "Archived"],
      validations: { required: true },
      storageKey: "7B1wIQ49px8i",
    },
    title: {
      type: "string",
      validations: { required: true },
      storageKey: "fgfJXW1H_bIZ",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "g4gdMy6rQQ-P",
    },
  },
};
