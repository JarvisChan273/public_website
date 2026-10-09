import { WorkerEntrypoint } from "cloudflare:workers";
import type { CallMeta, QueueMessage, SubmitInquiry } from "@platform/contracts";
import { logEvent } from "@platform/observability";
import { consumeInquiry, submitInquiry, sweepOutbox, type InquiryDeps } from "./app";
import { D1InquiryRepository, QueueBinding } from "./d1";

interface InquiryEnv {
  DB: D1Database;
  INQUIRY_QUEUE: Queue<QueueMessage>;
}

function deps(env: InquiryEnv): InquiryDeps {
  return {
    repo: new D1InquiryRepository(env.DB),
    queue: new QueueBinding(env.INQUIRY_QUEUE),
    ids: () => crypto.randomUUID(),
    clock: () => new Date().toISOString(),
    log: logEvent,
  };
}

export class InquiryService extends WorkerEntrypoint<InquiryEnv> {
  async ping(): Promise<{ ok: true }> {
    return { ok: true };
  }

  async submit(input: SubmitInquiry, meta: CallMeta) {
    return submitInquiry(input, meta, deps(this.env));
  }
}

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: InquiryEnv): Promise<void> {
    const repo = new D1InquiryRepository(env.DB);
    for (const message of batch.messages) {
      try {
        await consumeInquiry(message.body, repo);
        message.ack();
      } catch {
        message.retry();
      }
    }
  },

  async scheduled(_controller: ScheduledController, env: InquiryEnv): Promise<void> {
    await sweepOutbox(deps(env));
  },
};
