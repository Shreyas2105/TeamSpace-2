import { Router } from "express";
import {
  createTeam,
  getMyTeams,
  getTeamById,
  joinTeam,
  getTeamMembers,
  leaveTeam,
} from "../controllers/team.controller.js";
import {
  promoteMember,
  demoteMember,
  removeMember,
} from "../controllers/member.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyTeamMember, authorizeRoles } from "../middlewares/team.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createTeam).get(verifyJWT, getMyTeams);
router.route("/join").post(verifyJWT, joinTeam);
router.route("/:teamId").get(verifyJWT, verifyTeamMember, getTeamById);
router.route("/:teamId/members").get(verifyJWT, verifyTeamMember, getTeamMembers);
router.route("/:teamId/leave").post(verifyJWT, verifyTeamMember, leaveTeam);

router
  .route("/:teamId/members/:memberId/promote")
  .patch(verifyJWT, verifyTeamMember, authorizeRoles("admin"), promoteMember);

router
  .route("/:teamId/members/:memberId/demote")
  .patch(verifyJWT, verifyTeamMember, authorizeRoles("admin"), demoteMember);

router
  .route("/:teamId/members/:memberId")
  .delete(verifyJWT, verifyTeamMember, authorizeRoles("admin"), removeMember);

export default router;
