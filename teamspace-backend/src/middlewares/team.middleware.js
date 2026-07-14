import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Team } from "../models/team.model.js";
import { TeamMember } from "../models/teamMember.model.js";

const verifyTeamMember = asyncHandler(async (req, res, next) => {
  const { teamId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    throw new ApiError(400, "Invalid team ID");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const teamMember = await TeamMember.findOne({
    team: teamId,
    user: req.user._id,
  });

  if (!teamMember) {
    throw new ApiError(403, "You are not a member of this team");
  }

  req.team = team;
  req.teamMember = teamMember;
  next();
});

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.teamMember.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }

    next();
  };
};

export { verifyTeamMember, authorizeRoles };
