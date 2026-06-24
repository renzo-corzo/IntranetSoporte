-- Aditivo: Zabbix pasa a ser un único servidor para toda la instalación
-- (antes se había modelado por cliente, pero en la práctica hay un solo
-- usuario/password de Zabbix y los clientes se distinguen por grupo de
-- hosts). Todo nullable, seguro de correr con la app vieja todavía
-- corriendo.
BEGIN;

-- AlterTable
ALTER TABLE "ConfiguracionSistema" ADD COLUMN "zabbixUrl" TEXT,
ADD COLUMN     "zabbixUsuario" TEXT,
ADD COLUMN     "zabbixPasswordCifrada" TEXT,
ADD COLUMN     "zabbixIv" TEXT,
ADD COLUMN     "zabbixAuthTag" TEXT;

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN "zabbixGrupo" TEXT;

COMMIT;
