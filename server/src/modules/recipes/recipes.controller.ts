import type { Response } from "express";

import { sendSuccess } from "@shared/http/response";
import type { RecipesService } from "./recipes.service";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type {
  createRecipesSchemas,
  deleteRecipesSchemas,
  getRecipesSchemas,
  listRecipesSchemas,
  updateRecipesSchemas,
} from "./recipes.schema";

export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  list = async (req: ValidatedRequest<typeof listRecipesSchemas>, res: Response) => {
    const items = await this.service.list(req.query.page, req.query.limit);
    sendSuccess(res, { message: "Recipes retrieved", data: items });
  };

  getById = async (req: ValidatedRequest<typeof getRecipesSchemas>, res: Response) => {
    const recipe = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "Recipe retrieved", data: recipe });
  };

  create = async (req: ValidatedRequest<typeof createRecipesSchemas>, res: Response) => {
    const recipe = await this.service.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "Recipe created", data: recipe });
  };

  update = async (req: ValidatedRequest<typeof updateRecipesSchemas>, res: Response) => {
    const recipe = await this.service.update(req.params.id, req.body);
    sendSuccess(res, { message: "Recipe updated", data: recipe });
  };

  delete = async (req: ValidatedRequest<typeof deleteRecipesSchemas>, res: Response) => {
    await this.service.delete(req.params.id);
    sendSuccess(res, { message: "Recipe deleted", data: null });
  };
}
