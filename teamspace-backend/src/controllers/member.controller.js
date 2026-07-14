import mongoose from "mongoose";
import { TeamMember } from "../models/teamMember.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";

const promoteMember = asyncHandler(async (req, res) => {
  const { teamId, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, "Invalid member ID");
  }

  const targetMember = await TeamMember.findOne({ _id: memberId, team: teamId });

  if (!targetMember) {
    throw new ApiError(404, "Team member not found");
  }

  if (targetMember.role === "admin") {
    throw new ApiError(409, "Member is already an admin");
  }

  targetMember.role = "admin";
  await targetMember.save();

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "member_promoted",
    entityType: "team_member",
    entityId: targetMember._id,
    message: `${req.user.fullName} promoted a member to admin`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, targetMember, "Member promoted to admin"));
});

const demoteMember = asyncHandler(async (req, res) => {
  const { teamId, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, "Invalid member ID");
  }

  const targetMember = await TeamMember.findOne({ _id: memberId, team: teamId });

  if (!targetMember) {
    throw new ApiError(404, "Team member not found");
  }

  if (targetMember.role !== "admin") {
    throw new ApiError(409, "Member is not an admin");
  }

  const adminCount = await TeamMember.countDocuments({ team: teamId, role: "admin" });

  if (adminCount <= 1) {
    throw new ApiError(409, "Cannot demote the last remaining admin");
  }

  targetMember.role = "member";
  await targetMember.save();

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "member_demoted",
    entityType: "team_member",
    entityId: targetMember._id,
    message: `${req.user.fullName} demoted an admin to member`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, targetMember, "Member demoted to member"));
});

const removeMember = asyncHandler(async (req, res) => {
  const { teamId, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, "Invalid member ID");
  }

  const targetMember = await TeamMember.findOne({ _id: memberId, team: teamId });

  if (!targetMember) {
    throw new ApiError(404, "Team member not found");
  }

  if (targetMember.user.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Use the leave-team endpoint to remove yourself");
  }

  if (targetMember.role === "admin") {
    const adminCount = await TeamMember.countDocuments({ team: teamId, role: "admin" });

    if (adminCount <= 1) {
      throw new ApiError(409, "Cannot remove the last remaining admin");
    }
  }

  await TeamMember.findByIdAndDelete(targetMember._id);

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "member_removed",
    entityType: "team_member",
    entityId: targetMember._id,
    message: `${req.user.fullName} removed a member from the team`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member removed successfully"));
});

export { promoteMember, demoteMember, removeMember };
