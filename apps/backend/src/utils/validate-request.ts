import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type z } from "zod";
import { AppError } from "./app-error.js";

type RequestSchemas = {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
};

function formatZodError(err: ZodError) {
  const flat = err.flatten();
  return {
    fields: flat.fieldErrors,
    formErrors: flat.formErrors
  };
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as Request["body"];
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new AppError({
            statusCode: 400,
            message: "Validation error",
            details: formatZodError(err)
          })
        );
        return;
      }
      next(err);
    }
  };
}
