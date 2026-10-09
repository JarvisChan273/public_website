import type { ContentApi, InquiryApi } from "@platform/contracts";
import { handleRequest } from "./http";

interface GatewayEnv {
  CONTENT: ContentApi;
  INQUIRY: InquiryApi;
}

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    return handleRequest(request, {
      content: env.CONTENT,
      inquiry: env.INQUIRY,
    });
  },
};
