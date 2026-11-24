import type { Response } from "express";

import { sendSuccess } from "@shared/http/response";
import type { ProductsService } from "./products.service";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type {
  getProductSchemas,
  listProductsSchemas,
  createProductSchemas,
  deleteProductSchemas,
  updateProductSchemas,
} from "./products.schema";

export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  list = async (req: ValidatedRequest<typeof listProductsSchemas>, res: Response) => {
    const products = await this.service.list(req.query);
    sendSuccess(res, { message: "Products retrieved", data: products });
  };

  getById = async (req: ValidatedRequest<typeof getProductSchemas>, res: Response) => {
    const product = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "Product retrieved", data: product });
  };

  create = async (req: ValidatedRequest<typeof createProductSchemas>, res: Response) => {
    const product = await this.service.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "Product created", data: product });
  };

  update = async (req: ValidatedRequest<typeof updateProductSchemas>, res: Response) => {
    const product = await this.service.update(req.params.id, req.body);
    sendSuccess(res, { message: "Product updated", data: product });
  };

  delete = async (req: ValidatedRequest<typeof deleteProductSchemas>, res: Response) => {
    await this.service.delete(req.params.id);
    sendSuccess(res, { message: "Product deleted", data: null });
  };
}
