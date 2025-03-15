import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "message" model, go to https://feed-the-people.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "Z-8Rc4CRTe9-",
  fields: {
    content: { type: "string", storageKey: "Bzs6uXrBg9Xz" },
    user: {
      type: "belongsTo",
      parent: { model: "user" },
      storageKey: "Z-8Rc4CRTe9--BelongsTo-User",
    },
  },
};
