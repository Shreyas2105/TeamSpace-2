import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Task } from "../models/task.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/logActivity.js";

const findTaskOrThrow = async (taskId, projectId, teamId) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, team: teamId });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return task;
};

const addComment = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  const task = await findTaskOrThrow(taskId, projectId, teamId);

  const normalizedContent = req.body.content?.trim();

  if (!normalizedContent) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.create({
    team: teamId,
    task: task._id,
    user: req.user._id,
    content: normalizedContent,
  });

  await logActivity({
    team: teamId,
    user: req.user._id,
    action: "comment_added",
    entityType: "comment",
    entityId: comment._id,
    message: `${req.user.fullName} commented on task ${task.title}`,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getComments = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId } = req.params;

  await findTaskOrThrow(taskId, projectId, teamId);

  const comments = await Comment.find({ task: taskId, team: teamId })
    .populate("user", "fullName username avatar")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId, commentId } = req.params;

  await findTaskOrThrow(taskId, projectId, teamId);

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findOne({ _id: commentId, task: taskId, team: teamId });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own comment");
  }

  const normalizedContent = req.body.content?.trim();

  if (!normalizedContent) {
    throw new ApiError(400, "Comment content is required");
  }

  comment.content = normalizedContent;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { teamId, projectId, taskId, commentId } = req.params;

  await findTaskOrThrow(taskId, projectId, teamId);

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findOne({ _id: commentId, task: taskId, team: teamId });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const isOwner = comment.user.toString() === req.user._id.toString();
  const isAdmin = req.teamMember.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can only delete your own comment");
  }

  await Comment.findByIdAndDelete(comment._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { addComment, getComments, updateComment, deleteComment };
