import { Router } from "express";
import { getHealth, getReadiness } from "../controllers/health.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(async (req, res) => getHealth(req, res)));
healthRouter.get("/health/ready", asyncHandler(async (req, res) => getReadiness(req, res)));

