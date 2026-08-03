import type { EmailMessage } from '../../src/types/email.js';

export const emailPedidoEstruturado: EmailMessage = {
  gmailMessageId: 'test-001',
  subject: 'Solicitação de material - Obra 42',
  sender: 'joao.silva@empresa.com',
  receivedAt: new Date('2026-07-30T12:00:00.000Z'),
  body: `
    Olá,

    Preciso dos seguintes materiais:
    - 10 parafusos M8
    - 5 metros de cabo PP 2,5mm

    Departamento: Manutenção
    Urgência: alta
    Obra: 42

    Att,
    João
  `,
};

export const emailPedidoSimples: EmailMessage = {
  gmailMessageId: 'test-001',
  subject: 'Pedido de material',
  sender: 'joao@empresa.com',
  receivedAt: new Date(),
  body: '- 2 tintas brancas',
};
