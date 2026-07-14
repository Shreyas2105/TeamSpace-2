import { Router } from "express";
import { getTeamDashboard } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyTeamMember } from "../middlewares/team.middleware.js";

const router = Router({ mergeParams: true });

router.route("/").get(verifyJWT, verifyTeamMember, getTeamDashboard);

export default router;
