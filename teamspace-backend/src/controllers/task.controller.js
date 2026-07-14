import mongoose from "mongoose";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { Comment } from "../models/comment.model.js";
import { Attachment } from "../models/attachment.model.js";
import { TeamMember } from "../models/teamMember.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const findProjectOrThrow = async (projectId, teamId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({ _id: projectId, team: teamId });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

const createTask = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  await findProjectOrThrow(projectId, teamId);

  const { title, description, priority, dueDate, assignedTo } = req.body;

  const normalizedTitle = title?.trim();

  if (!normalizedTitle) {
    throw new ApiError(400, "Task title is required");
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    throw new ApiError(400, "Invalid task priority");
  }

  if (assignedTo) {
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      throw new ApiError(400, "Invalid assigned user ID");
    }

    const assigneeMembership = await TeamMember.findOne({ team: teamId, user: assignedTo });

    if (!assigneeMembership) {
      throw new ApiError(400, "Assigned user is not a member of this team");
    }
  }

  const task = await Task.create({
    team: teamId,
    project: projectId,
    title: normalizedTitle,
    description: description?.trim(),
    priority,
    dueDate,
    assignedTo: assignedTo || undefined,
    createdBy: req.user._id,
  });

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "task_created",
    entityType: "task",
    entityId: task._id,
    message: `${req.user.fullName} created task ${task.title}`,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

const getTasks = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  await findProjectOrThrow(projectId, teamId);

  const tasks = await Task.find({ project: projectId, team: teamId })
    .populate("assignedTo", "fullName username avatar")
    .populate("createdBy", "fullName username avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  await findProjectOrThrow(projectId, teamId);

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId })
    .populate("assignedTo", "fullName username avatar")
    .populate("createdBy", "fullName username avatar");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  await findProjectOrThrow(projectId, teamId);

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const { title, description, priority, dueDate } = req.body;

  if (title !== undefined) {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      throw new ApiError(400, "Task title cannot be empty");
    }

    task.title = normalizedTitle;
  }

  if (description !== undefined) {
    task.description = description.trim();
  }

  if (priority !== undefined) {
    if (!["low", "medium", "high"].includes(priority)) {
      throw new ApiError(400, "Invalid task priority");
    }

    task.priority = priority;
  }

  if (dueDate !== undefined) {
    task.dueDate = dueDate;
  }

  await task.save();

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

const assignTask = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  await findProjectOrThrow(projectId, teamId);

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const { assignedTo } = req.body;

  if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new ApiError(400, "A valid assigned user ID is required");
  }

  const assigneeMembership = await TeamMember.findOne({ team: teamId, user: assignedTo });

  if (!assigneeMembership) {
    throw new ApiError(400, "Assigned user is not a member of this team");
  }

  task.assignedTo = assignedTo;
  await task.save();

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "task_assigned",
    entityType: "task",
    entityId: task._id,
    message: `${req.user.fullName} assigned task ${task.title}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task assigned successfully"));
});

const changeTaskStatus = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  await findProjectOrThrow(projectId, teamId);

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isAdmin = req.teamMember.role === "admin";
  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignee) {
    throw new ApiError(403, "Only an admin or the assigned member can change this task's status");
  }

  const { status } = req.body;

  if (!["todo", "in-progress", "review", "done"].includes(status)) {
    throw new ApiError(400, "Invalid task status");
  }

  task.status = status;
  await task.save();

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: status === "done" ? "task_completed" : "task_status_changed",
    entityType: "task",
    entityId: task._id,
    message: `${req.user.fullName} changed task ${task.title} status to ${status}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task status updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  await findProjectOrThrow(projectId, teamId);

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  await Comment.deleteMany({ task: task._id, team: teamId });

  const attachments = await Attachment.find({ task: task._id, team: teamId });

  for (const attachment of attachments) {
    try {
      await deleteFromCloudinary(attachment.publicId, attachment.resourceType);
    } catch (error) {
      console.error("Failed to delete Cloudinary asset: ", error);
    }
  }

  await Attachment.deleteMany({ task: task._id, team: teamId });

  await Task.findByIdAndDelete(task._id);

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "task_deleted",
    entityType: "task",
    entityId: task._id,
    message: `${req.user.fullName} deleted task ${task.title}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

export {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  assignTask,
  changeTaskStatus,
  deleteTask,
};
