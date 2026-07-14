import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  completeProject,
  deleteProject,
} from "../controllers/project.controller.js";
import {
  uploadProjectAttachment,
  getProjectAttachments,
  deleteProjectAttachment,
} from "../controllers/attachment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyTeamMember, authorizeRoles } from "../middlewares/team.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router({ mergeParams: true });

router
  .route("/")
  .post(verifyJWT, verifyTeamMember, authorizeRoles("admin"), createProject)
  .get(verifyJWT, verifyTeamMember, getProjects);

router
  .route("/:projectId")
  .get(verifyJWT, verifyTeamMember, getProjectById)
  .patch(verifyJWT, verifyTeamMember, authorizeRoles("admin"), updateProject)
  .delete(verifyJWT, verifyTeamMember, authorizeRoles("admin"), deleteProject);

router
  .route("/:projectId/complete")
  .patch(verifyJWT, verifyTeamMember, authorizeRoles("admin"), completeProject);

router
  .route("/:projectId/attachments")
  .post(
    verifyJWT,
    verifyTeamMember,
    authorizeRoles("admin"),
    upload.single("file"),
    uploadProjectAttachment
  )
  .get(verifyJWT, verifyTeamMember, getProjectAttachments);

router
  .route("/:projectId/attachments/:attachmentId")
  .delete(verifyJWT, verifyTeamMember, deleteProjectAttachment);

export default router;
