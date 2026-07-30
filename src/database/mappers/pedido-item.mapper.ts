import type { PedidoItem } from '../../types/entities.js';
import type { PedidoItemRow } from '../rows.js';

export function mapPedidoItemRow(row: PedidoItemRow): PedidoItem {
  return {
    id: row.id,
    pedidoId: row.pedido_id,
    materialCodigo: row.material_codigo,
    materialDescricao: row.material_descricao,
    quantidade: Number(row.quantidade),
    unidade: row.unidade,
    createdAt: row.created_at,
  };
}
