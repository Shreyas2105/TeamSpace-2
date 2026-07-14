import mongoose from "mongoose";
import { Attachment } from "../models/attachment.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { logActivity } from "../utils/logActivity.js";

const uploadProjectAttachment = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const project = await Project.findOne({ _id: projectId, team: teamId });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!req.file) {
    throw new ApiError(400, "A file is required");
  }

  const result = await uploadOnCloudinary(req.file.buffer, "auto");

  const attachment = await Attachment.create({
    team: teamId,
    project: project._id,
    uploadedBy: req.user._id,
    fileName: req.file.originalname,
    fileUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    size: req.file.size,
  });

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "file_uploaded",
    entityType: "attachment",
    entityId: attachment._id,
    message: `${req.user.fullName} uploaded a file to project ${project.title}`,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, attachment, "File uploaded successfully"));
});

const getProjectAttachments = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const attachments = await Attachment.find({ team: teamId, project: projectId })
    .populate("uploadedBy", "fullName username avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, attachments, "Attachments fetched successfully"));
});

const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (!req.file) {
    throw new ApiError(400, "A file is required");
  }

  const result = await uploadOnCloudinary(req.file.buffer, "auto");

  const attachment = await Attachment.create({
    team: teamId,
    task: task._id,
    uploadedBy: req.user._id,
    fileName: req.file.originalname,
    fileUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    size: req.file.size,
  });

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "file_uploaded",
    entityType: "attachment",
    entityId: attachment._id,
    message: `${req.user.fullName} uploaded a file to task ${task.title}`,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, attachment, "File uploaded successfully"));
});

const getTaskAttachments = asyncHandler(async (req, res) => {
  const { teamId, taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const attachments = await Attachment.find({ team: teamId, task: taskId })
    .populate("uploadedBy", "fullName username avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, attachments, "Attachments fetched successfully"));
});

const removeAttachment = async (attachment, req) => {
  const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.teamMember.role === "admin";

  if (!isUploader && !isAdmin) {
    throw new ApiError(403, "You can only delete your own attachment");
  }

  let cloudinaryDeleted = true;

  try {
    await deleteFromCloudinary(attachment.publicId, attachment.resourceType);
  } catch (error) {
    cloudinaryDeleted = false;
  }

  await Attachment.findByIdAndDelete(attachment._id);

  return cloudinaryDeleted
    ? "Attachment deleted successfully"
    : "Attachment record deleted, but the remote file could not be removed";
};

const deleteProjectAttachment = asyncHandler(async (req, res) => {
  const { teamId, projectId, attachmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
    throw new ApiError(400, "Invalid attachment ID");
  }

  const attachment = await Attachment.findOne({
    _id: attachmentId,
    team: teamId,
    project: projectId,
  });

  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  const message = await removeAttachment(attachment, req);

  return res.status(200).json(new ApiResponse(200, {}, message));
});

const deleteTaskAttachment = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId, attachmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
    throw new ApiError(400, "Invalid attachment ID");
  }

  const attachment = await Attachment.findOne({
    _id: attachmentId,
    team: teamId,
    task: taskId,
  });

  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const message = await removeAttachment(attachment, req);

  return res.status(200).json(new ApiResponse(200, {}, message));
});

export {
  uploadProjectAttachment,
  getProjectAttachments,
  uploadTaskAttachment,
  getTaskAttachments,
  deleteProjectAttachment,
  deleteTaskAttachment,
};
