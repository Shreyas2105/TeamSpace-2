import { Router } from "express";
import { getTeamActivity } from "../controllers/activity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyTeamMember } from "../middlewares/team.middleware.js";

const router = Router({ mergeParams: true });

router.route("/").get(verifyJWT, verifyTeamMember, getTeamActivity);

export default router;
