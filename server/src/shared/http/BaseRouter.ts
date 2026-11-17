import { Router } from "express";

/** OOP alternative to creating a Router() in each routes file. Subclasses declare routes in the constructor. */
export abstract class BaseRouter {
  readonly router: Router = Router();
}
