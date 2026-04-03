import type { Request, Response } from "express";
import { ok } from "../../utils/api-response.js";
import * as dispatchService from "./dispatch.service.js";

export async function getDispatchQueue(_req: Request, res: Response) {
  const data = await dispatchService.getDispatchQueue();
  return ok(res, data);
}
