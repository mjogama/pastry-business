import type { Response } from "express";

import { sendSuccess } from "@shared/http/response";
import type { CategoriesService } from "./categories.service";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type {
  getCategorySchemas,
  listCategoriesSchemas,
  createCategorySchemas,
  deleteCategorySchemas,
  updateCategorySchemas,
} from "./categories.schema";

export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  list = async (req: ValidatedRequest<typeof listCategoriesSchemas>, res: Response) => {
    const categories = await this.service.list(req.query.limit);
    sendSuccess(res, { message: "Categories retrieved", data: categories });
  };

  getById = async (req: ValidatedRequest<typeof getCategorySchemas>, res: Response) => {
    const category = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "Category retrieved", data: category });
  };

  create = async (req: ValidatedRequest<typeof createCategorySchemas>, res: Response) => {
    const category = await this.service.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "Category created", data: category });
  };

  update = async (req: ValidatedRequest<typeof updateCategorySchemas>, res: Response) => {
    const category = await this.service.update(req.params.id, req.body);
    sendSuccess(res, { message: "Category updated", data: category });
  };

  delete = async (req: ValidatedRequest<typeof deleteCategorySchemas>, res: Response) => {
    await this.service.delete(req.params.id);
    sendSuccess(res, { message: "Category deleted", data: null });
  };
}
