import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

const checkHealth = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, { status: "ok" }, "Server is healthy"));
});

router.route("/").get(checkHealth);

export default router;
