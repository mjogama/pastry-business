import type { Response } from "express";

import { sendSuccess } from "@shared/http/response";
import type { ExampleService } from "./example.service";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type { createExampleSchemas, getExampleSchemas, listExamplesSchemas } from "./example.schema";

/** Translates HTTP <-> service calls. Thrown errors reach the global error handler on their own. */
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  list = async (req: ValidatedRequest<typeof listExamplesSchemas>, res: Response) => {
    const examples = await this.service.list(req.query.limit);
    sendSuccess(res, { message: "Examples retrieved", data: examples });
  };

  getById = async (req: ValidatedRequest<typeof getExampleSchemas>, res: Response) => {
    const example = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "Example retrieved", data: example });
  };

  create = async (req: ValidatedRequest<typeof createExampleSchemas>, res: Response) => {
    const example = await this.service.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "Example created", data: example });
  };
}
