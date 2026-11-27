import type { Request, Response } from "express";

import type { MenuService } from "./menu.service";
import { sendSuccess } from "@shared/http/response";
import type { ValidatedRequest } from "@shared/middlewares/validate";
import type { updateSettingsSchemas, updatePreOrderSettingsSchemas } from "./menu.schema";

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

  updatePreOrderSettings = async (req: ValidatedRequest<typeof updatePreOrderSettingsSchemas>, res: Response) => {
    const settings = await this.service.updatePreOrderSettings(req.body);
    const { open, ...rest } = req.body;
    const message =
      open === undefined || Object.keys(rest).length > 0
        ? "Pre-order settings saved"
        : open
          ? "Pre-orders opened"
          : "Pre-orders closed";
    sendSuccess(res, { message, data: settings });
  };
}
