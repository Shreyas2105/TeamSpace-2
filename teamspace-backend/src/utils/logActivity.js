import { ActivityLog } from "../models/activityLog.model.js";

const logActivity = async ({ team, user, action, entityType, entityId, message, metadata }) => {
  try {
    await ActivityLog.create({ team, user, action, entityType, entityId, message, metadata });
  } catch (error) {
    console.error("Failed to record activity log: ", error);
  }
};

export { logActivity };
