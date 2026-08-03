import type { GmailService } from "./gmail.service.js";
import { parseAndSavePedido } from "./email-processing.service.js";
import { getErrorMessage } from "../utils/error.js";

interface WorkerCycleError {
  messageId: string;
  error: string;
}

export interface WorkerCycleResult {
  processed: number;
  skipped: number;
  failed: number;
  errors: WorkerCycleError[];
}

export class EmailWorkerService {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;

  constructor(
    private readonly gmailService: GmailService,
    private readonly pollIntervalMs: number,
    private readonly maxMessagesPerCycle: number,
  ) {}

  start(): void {
    if (!this.stopped) {
      return;
    }

    this.stopped = false;
    this.scheduleNextCycle(0);
  }

  stop(): void {
    this.stopped = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextCycle(delayMs: number): void {
    this.timer = setTimeout(() => {
      void this.runCycleAndScheduleNext();
    }, delayMs);
  }

  private async runCycleAndScheduleNext(): Promise<void> {
    await this.runCycle();

    if (!this.stopped) {
      this.scheduleNextCycle(this.pollIntervalMs);
    }
  }

  /**
   * Lista não lidos, processa cada um e retorna métricas
   */
  async runCycle(): Promise<WorkerCycleResult> {
    const result: WorkerCycleResult = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    const messageIds = await this.gmailService.listUnreadMessageIds(
      this.maxMessagesPerCycle,
    );

    for (const messageId of messageIds) {
      try {
        await this.processMessage(messageId, result);
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          messageId,
          error: getErrorMessage(error),
        });
      }
    }

    if (messageIds.length > 0 || result.failed > 0) {
      console.log(
        `[worker] processados=${result.processed} ignorados=${result.skipped} falhas=${result.failed}`,
      );
    }

    return result;
  }

  /**
   * Processo: Busca e-mail, parse, save e marca lido
   */
  private async processMessage(
    messageId: string,
    result: WorkerCycleResult,
  ): Promise<void> {
    const email = await this.gmailService.getMessage(messageId);
    const { parsed, saved } = await parseAndSavePedido(email);

    if (!parsed.success) {
      result.failed += 1;
      result.errors.push({
        messageId,
        error: parsed.error ?? "Falha no parse do e-mail",
      });
      return;
    }

    if (!saved) {
      result.failed += 1;
      result.errors.push({
        messageId,
        error: "Parse sem dados para salvar",
      });
      return;
    }

    if (saved.skipped) {
      result.skipped += 1;
    } else {
      result.processed += 1;
    }

    await this.gmailService.markAsRead(messageId);
  }
}
