-- Aditivo: agrega la config de Zabbix por cliente en Empresa. Todo nullable,
-- seguro de correr con la app vieja todavia corriendo. El cliente que hoy usa
-- el Zabbix hardcodeado (192.168.123.6) queda sin Zabbix hasta que se le
-- complete esta config a mano desde Empresas (a propósito, no se precarga acá).
BEGIN;

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN "zabbixUrl" TEXT,
ADD COLUMN     "zabbixUsuario" TEXT,
ADD COLUMN     "zabbixPasswordCifrada" TEXT,
ADD COLUMN     "zabbixIv" TEXT,
ADD COLUMN     "zabbixAuthTag" TEXT;

COMMIT;
