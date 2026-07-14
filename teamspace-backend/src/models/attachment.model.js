import mongoose, { Schema } from "mongoose";

const attachmentSchema = new Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
    },
  },
  { timestamps: true }
);

attachmentSchema.index({ team: 1, project: 1 });
attachmentSchema.index({ team: 1, task: 1 });

export const Attachment = mongoose.model("Attachment", attachmentSchema);
