import { Router } from "express";
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyTeamMember } from "../middlewares/team.middleware.js";

const router = Router({ mergeParams: true });

router
  .route("/")
  .post(verifyJWT, verifyTeamMember, addComment)
  .get(verifyJWT, verifyTeamMember, getComments);

router
  .route("/:commentId")
  .patch(verifyJWT, verifyTeamMember, updateComment)
  .delete(verifyJWT, verifyTeamMember, deleteComment);

export default router;
