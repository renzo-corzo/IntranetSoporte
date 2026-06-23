-- El tipo de movimiento "Ajuste" se sembró con afectaStock='neutro' (igual que
-- "Transferencia"), por lo que crearMovimiento no modificaba stockActual al
-- registrar un ajuste de inventario. Afecta a todas las empresas por igual,
-- ya que el valor se heredó del seed original (previo a multi-tenant).
-- Ver conversación 2026-06-23 (portado desde Infra_Caja).
UPDATE "TipoMovimiento" SET "afectaStock" = 'ajuste' WHERE "nombre" = 'Ajuste';
