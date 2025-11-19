-- Agregar campo diasBase2023 a la tabla Empleado
ALTER TABLE "Empleado" ADD COLUMN IF NOT EXISTS "diasBase2023" INTEGER;

-- Comentario para documentar el campo
COMMENT ON COLUMN "Empleado"."diasBase2023" IS 'Días disponibles al inicio de 2023 (antes de sumar días por años)';

