import { ActivityLog } from "../models/activityLog.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getTeamActivity = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const activity = await ActivityLog.find({ team: teamId })
    .populate("user", "fullName username avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res
    .status(200)
    .json(new ApiResponse(200, activity, "Activity feed fetched successfully"));
});

export { getTeamActivity };
