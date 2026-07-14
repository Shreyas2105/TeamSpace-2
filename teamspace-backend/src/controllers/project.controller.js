import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { Comment } from "../models/comment.model.js";
import { Attachment } from "../models/attachment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const createProject = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { title, description, startDate, dueDate } = req.body;

  const normalizedTitle = title?.trim();

  if (!normalizedTitle) {
    throw new ApiError(400, "Project title is required");
  }

  const project = await Project.create({
    team: teamId,
    title: normalizedTitle,
    description: description?.trim(),
    startDate,
    dueDate,
    createdBy: req.user._id,
  });

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "project_created",
    entityType: "project",
    entityId: project._id,
    message: `${req.user.fullName} created project ${project.title}`,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project created successfully"));
});

const getProjects = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const projects = await Project.find({ team: teamId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({ _id: projectId, team: teamId });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({ _id: projectId, team: teamId });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const { title, description, startDate, dueDate, status } = req.body;

  if (title !== undefined) {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      throw new ApiError(400, "Project title cannot be empty");
    }

    project.title = normalizedTitle;
  }

  if (description !== undefined) {
    project.description = description.trim();
  }

  if (startDate !== undefined) {
    project.startDate = startDate;
  }

  if (dueDate !== undefined) {
    project.dueDate = dueDate;
  }

  if (status !== undefined) {
    if (!["planning", "active", "completed"].includes(status)) {
      throw new ApiError(400, "Invalid project status");
    }

    project.status = status;
  }

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

const completeProject = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({ _id: projectId, team: teamId });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  project.status = "completed";
  await project.save();

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "project_completed",
    entityType: "project",
    entityId: project._id,
    message: `${req.user.fullName} marked project ${project.title} as completed`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project marked as completed"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({ _id: projectId, team: teamId });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const tasks = await Task.find({ project: project._id, team: teamId });
  const taskIds = tasks.map((task) => task._id);

  await Comment.deleteMany({ task: { $in: taskIds }, team: teamId });

  const attachments = await Attachment.find({
    team: teamId,
    $or: [{ project: project._id }, { task: { $in: taskIds } }],
  });

  for (const attachment of attachments) {
    try {
      await deleteFromCloudinary(attachment.publicId, attachment.resourceType);
    } catch (error) {
      console.error("Failed to delete Cloudinary asset: ", error);
    }
  }

  await Attachment.deleteMany({
    team: teamId,
    $or: [{ project: project._id }, { task: { $in: taskIds } }],
  });

  await Task.deleteMany({ project: project._id, team: teamId });

  await Project.findByIdAndDelete(project._id);

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "project_deleted",
    entityType: "project",
    entityId: project._id,
    message: `${req.user.fullName} deleted project ${project.title}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

export {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  completeProject,
  deleteProject,
};
