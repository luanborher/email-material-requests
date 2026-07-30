import { getPool } from '../database/connection.js';
import { mapPedidoItemRow } from '../database/mappers/pedido-item.mapper.js';
import type { CreatePedidoItemInput, PedidoItem } from '../types/entities.js';

export class PedidoItemRepository {
  async createMany(items: CreatePedidoItemInput[]): Promise<PedidoItem[]> {
    if (items.length === 0) {
      return [];
    }

    const pool = await getPool();
    const transaction = pool.transaction();

    await transaction.begin();

    try {
      const createdItems: PedidoItem[] = [];

      for (const item of items) {
        const result = await transaction
          .request()
          .input('pedidoId', item.pedidoId)
          .input('materialCodigo', item.materialCodigo ?? null)
          .input('materialDescricao', item.materialDescricao)
          .input('quantidade', item.quantidade)
          .input('unidade', item.unidade ?? null)
          .query(`
            INSERT INTO dbo.pedido_itens (
              pedido_id,
              material_codigo,
              material_descricao,
              quantidade,
              unidade
            )
            OUTPUT INSERTED.*
            VALUES (
              @pedidoId,
              @materialCodigo,
              @materialDescricao,
              @quantidade,
              @unidade
            )
          `);

        createdItems.push(mapPedidoItemRow(result.recordset[0]));
      }

      await transaction.commit();

      return createdItems;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const pedidoItemRepository = new PedidoItemRepository();
