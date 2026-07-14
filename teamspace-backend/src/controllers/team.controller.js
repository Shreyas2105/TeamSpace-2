import crypto from "crypto";
import { Team } from "../models/team.model.js";
import { TeamMember } from "../models/teamMember.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateInviteCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

const createUniqueInviteCode = async () => {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInviteCode();
    const existingTeam = await Team.findOne({ inviteCode: code });

    if (!existingTeam) {
      return code;
    }
  }

  throw new ApiError(500, "Could not generate a unique invite code, please try again");
};

const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const normalizedName = name?.trim();
  const normalizedDescription = description?.trim();

  if (!normalizedName) {
    throw new ApiError(400, "Team name is required");
  }

  const inviteCode = await createUniqueInviteCode();

  const team = await Team.create({
    name: normalizedName,
    description: normalizedDescription,
    createdBy: req.user._id,
    inviteCode,
  });

  try {
    await TeamMember.create({
      team: team._id,
      user: req.user._id,
      role: "admin",
    });
  } catch (membershipError) {
    try {
      await Team.findByIdAndDelete(team._id);
    } catch (cleanupError) {
      throw new ApiError(
        500,
        "Failed to create team membership and failed to clean up the created team"
      );
    }

    throw membershipError;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, team, "Team created successfully"));
});

const getMyTeams = asyncHandler(async (req, res) => {
  const memberships = await TeamMember.find({ user: req.user._id })
    .populate("team", "name description createdBy createdAt")
    .select("team role createdAt");

  const teams = memberships
    .filter((membership) => membership.team)
    .map((membership) => ({
      team: membership.team,
      role: membership.role,
      joinedAt: membership.createdAt,
    }));

  return res
    .status(200)
    .json(new ApiResponse(200, teams, "Teams fetched successfully"));
});

const getTeamById = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { team: req.team, role: req.teamMember.role },
        "Team fetched successfully"
      )
    );
});

const joinTeam = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;

  const normalizedCode = inviteCode?.trim().toUpperCase();

  if (!normalizedCode) {
    throw new ApiError(400, "Invite code is required");
  }

  const team = await Team.findOne({ inviteCode: normalizedCode });

  if (!team) {
    throw new ApiError(404, "Invalid invite code");
  }

  const existingMembership = await TeamMember.findOne({
    team: team._id,
    user: req.user._id,
  });

  if (existingMembership) {
    throw new ApiError(409, "You are already a member of this team");
  }

  let teamMember;

  try {
    teamMember = await TeamMember.create({
      team: team._id,
      user: req.user._id,
      role: "member",
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "You are already a member of this team");
    }

    throw error;
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, { team, role: teamMember.role }, "Joined team successfully")
    );
});

const getTeamMembers = asyncHandler(async (req, res) => {
  const members = await TeamMember.find({ team: req.params.teamId })
    .populate("user", "fullName username avatar")
    .select("user role createdAt");

  return res
    .status(200)
    .json(new ApiResponse(200, members, "Team members fetched successfully"));
});

const leaveTeam = asyncHandler(async (req, res) => {
  const { _id, role } = req.teamMember;

  if (role === "admin") {
    const adminCount = await TeamMember.countDocuments({
      team: req.params.teamId,
      role: "admin",
    });

    if (adminCount <= 1) {
      throw new ApiError(
        409,
        "You are the last admin of this team, promote another member before leaving"
      );
    }
  }

  await TeamMember.findByIdAndDelete(_id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Left team successfully"));
});

export {
  createTeam,
  getMyTeams,
  getTeamById,
  joinTeam,
  getTeamMembers,
  leaveTeam,
};
