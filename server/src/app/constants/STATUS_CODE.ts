import type { StatusCodeType } from "../types/StatusCode";

export const STATUS_CODE: StatusCodeType = {
  400: {
    title: "Bad request",
  },
  401: {
    title: "Unauthorized",
  },
  403: {
    title: "Forbidden",
  },
  404: {
    title: "Not found",
  },
  409: {
    title: "Conflict",
  },
  500: {
    title: "Server error",
  },
  503: {
    title: "Unavailable service",
  },
};
