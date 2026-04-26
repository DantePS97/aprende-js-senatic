import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

function isZodError(err: unknown): err is ZodError {
  // Use duck-typing in addition to instanceof to handle cross-module-boundary
  // cases where Zod schemas from @senatic/shared may use the v3 compat subpath
  // while this middleware imports from the v4 main entry.
  return (
    err instanceof ZodError ||
    (typeof err === 'object' && err !== null && 'issues' in err && Array.isArray((err as ZodError).issues))
  );
}

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (isZodError(err)) {
        const errors = (err as ZodError).errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ success: false, error: 'Datos inválidos.', details: errors });
        return;
      }
      next(err);
    }
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        issues: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        issues: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.query = result.data as unknown as typeof req.query;
    next();
  };
}
