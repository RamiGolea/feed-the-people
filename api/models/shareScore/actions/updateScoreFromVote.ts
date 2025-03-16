import { applyParams, save, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  
  // Apply point adjustment if provided
  if (params.pointAdjustment) {
    // Ensure score is a number, default to 0 if null
    const currentScore = record.score ?? 0;
    // Apply adjustment but ensure score doesn't go below zero
    const newScore = Math.max(0, currentScore + params.pointAdjustment);
    record.score = newScore;
    // Update the lastUpdated timestamp
    record.lastUpdated = new Date();
  }
  
  await save(record);
};

export const params = {
  pointAdjustment: { type: "number" }
};

export const options: ActionOptions = {
  actionType: "update",
};