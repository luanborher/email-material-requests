import { pedidoItemRepository } from "../../repositories/pedido-item.repository.js";
import { pedidoRepository } from "../../repositories/pedido.repository.js";
import { PedidoService } from "./pedido.service.js";

export const pedidoService = new PedidoService(pedidoRepository, pedidoItemRepository);
