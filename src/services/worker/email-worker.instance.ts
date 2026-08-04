import { env } from "../../config/env.js";
import { gmailService } from "../gmail/gmail.service.js";
import { EmailWorkerService } from "./email-worker.service.js";

export const emailWorkerService = new EmailWorkerService(
  gmailService,
  env.email.pollIntervalMs,
  env.email.workerMaxMessagesPerPoll,
);
