import type { Request, Response } from "express";

import { sendSuccess } from "@shared/http/response";
import type { SalesEntryService } from "./sales-entry.service";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type {
  getSalesEntrySchemas,
  listSalesEntriesSchemas,
  createSalesEntrySchemas,
  deleteSalesEntrySchemas,
  updateSalesEntrySchemas,
} from "./sales-entry.schema";

export class SalesEntryController {
  constructor(private readonly service: SalesEntryService) {}

  list = async (req: ValidatedRequest<typeof listSalesEntriesSchemas>, res: Response) => {
    const entries = await this.service.list(req.query.from, req.query.to);
    sendSuccess(res, { message: "Sales entries retrieved", data: entries });
  };

  productSuggestions = async (_req: Request, res: Response) => {
    const suggestions = await this.service.productSuggestions();
    sendSuccess(res, { message: "Product suggestions retrieved", data: suggestions });
  };

  getById = async (req: ValidatedRequest<typeof getSalesEntrySchemas>, res: Response) => {
    const entry = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "Sales entry retrieved", data: entry });
  };

  create = async (req: ValidatedRequest<typeof createSalesEntrySchemas>, res: Response) => {
    const entry = await this.service.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "Sales entry created", data: entry });
  };

  update = async (req: ValidatedRequest<typeof updateSalesEntrySchemas>, res: Response) => {
    const entry = await this.service.update(req.params.id, req.body);
    sendSuccess(res, { message: "Sales entry updated", data: entry });
  };

  delete = async (req: ValidatedRequest<typeof deleteSalesEntrySchemas>, res: Response) => {
    await this.service.delete(req.params.id);
    sendSuccess(res, { message: "Sales entry deleted", data: null });
  };
}
