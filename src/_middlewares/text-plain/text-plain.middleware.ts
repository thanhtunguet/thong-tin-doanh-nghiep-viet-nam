import { Injectable, NestMiddleware } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TextPlainMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only apply the middleware for POST, PUT, and PATCH methods
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      bodyParser.text({ type: 'text/plain' })(req, res, next);
    } else {
      next();
    }
  }
}
