import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { TeamMember } from "../models/teamMember.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getTeamDashboard = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    teamMembers,
    taskStatusCounts,
  ] = await Promise.all([
    Project.countDocuments({ team: teamId }),
    Project.countDocuments({ team: teamId, status: "active" }),
    Project.countDocuments({ team: teamId, status: "completed" }),
    Task.countDocuments({ team: teamId }),
    Task.countDocuments({ team: teamId, status: "done" }),
    TeamMember.countDocuments({ team: teamId }),
    Task.aggregate([
      { $match: { team: new mongoose.Types.ObjectId(teamId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const taskStatusDistribution = {
    todo: 0,
    "in-progress": 0,
    review: 0,
    done: 0,
  };

  taskStatusCounts.forEach((entry) => {
    taskStatusDistribution[entry._id] = entry.count;
  });

  const pendingTasks = totalTasks - completedTasks;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        cards: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          teamMembers,
        },
        taskStatusDistribution,
      },
      "Dashboard data fetched successfully"
    )
  );
});

export { getTeamDashboard };
