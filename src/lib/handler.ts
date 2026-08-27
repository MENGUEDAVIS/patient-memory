import { jsonError, requireMutationOrigin } from "@/lib/api";

export function apiHandler<TContext>(
  fn: (request: Request, context: TContext) => Promise<Response>,
) {
  return async (request: Request, context: TContext) => {
    try {
      requireMutationOrigin(request);
      return await fn(request, context);
    } catch (error) {
      return jsonError(error);
    }
  };
}
