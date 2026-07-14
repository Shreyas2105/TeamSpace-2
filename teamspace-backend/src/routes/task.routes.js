import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  assignTask,
  changeTaskStatus,
  deleteTask,
} from "../controllers/task.controller.js";
import {
  uploadTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
} from "../controllers/attachment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyTeamMember, authorizeRoles } from "../middlewares/team.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router({ mergeParams: true });

router
  .route("/")
  .post(verifyJWT, verifyTeamMember, createTask)
  .get(verifyJWT, verifyTeamMember, getTasks);

router
  .route("/:taskId")
  .get(verifyJWT, verifyTeamMember, getTaskById)
  .patch(verifyJWT, verifyTeamMember, authorizeRoles("admin"), updateTask)
  .delete(verifyJWT, verifyTeamMember, authorizeRoles("admin"), deleteTask);

router
  .route("/:taskId/assign")
  .patch(verifyJWT, verifyTeamMember, authorizeRoles("admin"), assignTask);

router.route("/:taskId/status").patch(verifyJWT, verifyTeamMember, changeTaskStatus);

router
  .route("/:taskId/attachments")
  .post(verifyJWT, verifyTeamMember, upload.single("file"), uploadTaskAttachment)
  .get(verifyJWT, verifyTeamMember, getTaskAttachments);

router
  .route("/:taskId/attachments/:attachmentId")
  .delete(verifyJWT, verifyTeamMember, deleteTaskAttachment);

export default router;
