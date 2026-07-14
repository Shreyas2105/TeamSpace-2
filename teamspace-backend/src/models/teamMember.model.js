import mongoose, { Schema } from "mongoose";

const teamMemberSchema = new Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  },
  { timestamps: true }
);

teamMemberSchema.index({ team: 1, user: 1 }, { unique: true });

export const TeamMember = mongoose.model("TeamMember", teamMemberSchema);
