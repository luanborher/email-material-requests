export const PedidoStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PENDING_REVIEW: 'pending_review',
} as const;

export type PedidoStatus = (typeof PedidoStatus)[keyof typeof PedidoStatus];

export const UrgencyLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export const ParserType = {
  REGEX: 'regex',
  LLM: 'llm',
} as const;

export type ParserType = (typeof ParserType)[keyof typeof ParserType];
