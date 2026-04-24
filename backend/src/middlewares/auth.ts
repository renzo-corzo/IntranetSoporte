import { verifyToken } from "./auth.middleware";

// Compatibilidad legacy: enruta todo al middleware canónico.
export const authenticate = verifyToken;