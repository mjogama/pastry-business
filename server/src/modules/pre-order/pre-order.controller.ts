import type { Response } from "express";

import { sendSuccess } from "@shared/http/response";
import type { PreOrderService } from "./pre-order.service";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type {
  getPreOrderSchemas,
  listPreOrdersSchemas,
  createPreOrderSchemas,
  deletePreOrderSchemas,
  updatePreOrderStatusSchemas,
} from "./pre-order.schema";

export class PreOrderController {
  constructor(private readonly service: PreOrderService) {}

  list = async (req: ValidatedRequest<typeof listPreOrdersSchemas>, res: Response) => {
    const orders = await this.service.list(req.query);
    sendSuccess(res, { message: "Pre-orders retrieved", data: orders });
  };

  getById = async (req: ValidatedRequest<typeof getPreOrderSchemas>, res: Response) => {
    const order = await this.service.getById(req.params.id);
    sendSuccess(res, { message: "Pre-order retrieved", data: order });
  };

  create = async (req: ValidatedRequest<typeof createPreOrderSchemas>, res: Response) => {
    const order = await this.service.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "Pre-order placed", data: order });
  };

  updateStatus = async (req: ValidatedRequest<typeof updatePreOrderStatusSchemas>, res: Response) => {
    const order = await this.service.updateStatus(req.params.id, req.body);
    sendSuccess(res, { message: "Pre-order updated", data: order });
  };

  delete = async (req: ValidatedRequest<typeof deletePreOrderSchemas>, res: Response) => {
    await this.service.delete(req.params.id);
    sendSuccess(res, { message: "Pre-order deleted", data: null });
  };
}
