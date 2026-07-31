export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeEmailBody(body: string): string {
  if (body.includes('<html') || body.includes('<body') || body.includes('<div')) {
    return stripHtml(body);
  }

  return body.replace(/\r\n/g, '\n').trim();
}

export function parseQuantity(value: string): number {
  const normalized = value.replace(',', '.');
  const quantity = Number(normalized);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`Quantidade inválida: ${value}`);
  }

  return quantity;
}

export function parseSenderName(fromEmail: string): string | null {
  const localPart = fromEmail.split('@')[0] ?? '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();

  return cleaned.length > 0 ? cleaned : null;
}
