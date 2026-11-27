import type { Request, Response } from "express";

import type { MenuService } from "./menu.service";
import { sendSuccess } from "@shared/http/response";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type { updateSettingsSchemas, updatePreOrdersOpenSchemas } from "./menu.schema";

export class MenuController {
  constructor(private readonly service: MenuService) {}

  get = async (_req: Request, res: Response) => {
    const menu = await this.service.getMenu();
    sendSuccess(res, { message: "Menu retrieved", data: menu });
  };

  getSettings = async (_req: Request, res: Response) => {
    const settings = await this.service.getSettings();
    sendSuccess(res, { message: "Settings retrieved", data: settings });
  };

  updateSettings = async (req: ValidatedRequest<typeof updateSettingsSchemas>, res: Response) => {
    const settings = await this.service.updateSettings(req.body);
    sendSuccess(res, { message: "Settings updated", data: settings });
  };

  updatePreOrdersOpen = async (req: ValidatedRequest<typeof updatePreOrdersOpenSchemas>, res: Response) => {
    const settings = await this.service.updatePreOrdersOpen(req.body.open);
    sendSuccess(res, { message: req.body.open ? "Pre-orders opened" : "Pre-orders closed", data: settings });
  };
}
