import axios from 'axios';

const NTOPNG_URL = process.env.NTOPNG_URL || 'http://192.168.123.6:3000';
const NTOPNG_USER = process.env.NTOPNG_USER || 'admin';
const NTOPNG_PASSWORD = process.env.NTOPNG_PASSWORD || 'Hexadecimal16';

// Instancia de axios con configuración para mantener cookies
const axiosInstance = axios.create({
  baseURL: NTOPNG_URL,
  timeout: 15000,
  withCredentials: true, // Importante para mantener cookies de sesión
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Variable para almacenar la cookie de sesión
let sessionCookie: string | null = null;

// Función para hacer login y obtener cookie de sesión
async function ntopngLogin(): Promise<string | null> {
  try {
    console.log('📊 ntopng: Iniciando sesión...');
    // ntopng usa POST para login con usuario y contraseña
    const response = await axiosInstance.post('/lua/login.lua', {
      user: NTOPNG_USER,
      password: NTOPNG_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Extraer cookie de la respuesta
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader && setCookieHeader.length > 0) {
      sessionCookie = setCookieHeader[0].split(';')[0];
      console.log('✅ ntopng: Sesión iniciada correctamente');
      return sessionCookie;
    }

    // Si no hay cookie en headers, intentar con parámetros en URL
    console.log('⚠️ ntopng: No se obtuvo cookie, usando parámetros en URL');
    return null;
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión en ntopng:', error.message);
    // Si falla el login, intentar con parámetros en URL
    return null;
  }
}

// Función para hacer peticiones autenticadas a ntopng
async function ntopngRequest(endpoint: string, params: any = {}) {
  try {
    // Si no tenemos cookie, intentar login
    if (!sessionCookie) {
      await ntopngLogin();
    }

    const url = `${NTOPNG_URL}${endpoint}`;
    console.log(`📊 ntopng: Petición a ${url}`, params);

    // Configurar headers con cookie si está disponible
    const headers: any = {
      'Accept': 'application/json'
    };

    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }

    // ntopng REST API v2 requiere user y password en los parámetros
    const requestParams: any = {
      ...params,
      user: NTOPNG_USER,
      password: NTOPNG_PASSWORD
    };

    const response = await axiosInstance.get(endpoint, {
      params: requestParams,
      headers: headers
    });

    // Si recibimos HTML en lugar de JSON, significa que necesitamos re-autenticarnos
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      console.log('⚠️ ntopng: Respuesta HTML recibida, re-autenticando...');
      sessionCookie = null; // Limpiar cookie
      await ntopngLogin(); // Re-autenticar
      
      // Reintentar con cookie
      if (sessionCookie) {
        headers['Cookie'] = sessionCookie;
        const retryResponse = await axiosInstance.get(endpoint, {
          params: params, // Sin user/password en el retry
          headers: headers
        });
        console.log(`📊 ntopng: Respuesta exitosa de ${endpoint}`, retryResponse.status);
        return retryResponse.data;
      }
    }

    console.log(`📊 ntopng: Respuesta exitosa de ${endpoint}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error en petición ntopng ${endpoint}:`, error.message);
    if (error.response) {
      console.error('❌ Respuesta del servidor:', error.response.status);
      // Si es 401 o 403, limpiar cookie y reintentar login
      if (error.response.status === 401 || error.response.status === 403) {
        sessionCookie = null;
        await ntopngLogin();
      }
    } else if (error.request) {
      console.error('❌ No se recibió respuesta del servidor ntopng');
    }
    throw error;
  }
}

// Obtener interfaces disponibles
export async function getInterfaces() {
  try {
    console.log('📊 ntopng: Obteniendo lista de interfaces');
    const data: any = await ntopngRequest('/lua/rest/v2/get/interface/names.lua');
    console.log(`📊 ntopng: Respuesta completa:`, JSON.stringify(data).substring(0, 500));
    console.log(`📊 ntopng: Interfaces obtenidas:`, data?.rsp?.length || 0);
    
    // ntopng puede devolver los datos directamente o en data.rsp
    const interfaces = data?.rsp || data || [];
    
    // Formatear las interfaces para que tengan el formato esperado
    const formattedInterfaces = Array.isArray(interfaces) ? interfaces.map((iface: any, index: number) => {
      // Si es un string, crear un objeto con id y nombre
      if (typeof iface === 'string') {
        return {
          id: index,
          name: iface,
          description: iface
        };
      }
      // Si ya es un objeto, asegurarse de que tenga id
      return {
        id: iface.id || iface.ifid || index,
        name: iface.name || iface.interface_name || iface,
        description: iface.description || iface.name || iface.interface_name || iface
      };
    }) : [];
    
    console.log(`📊 ntopng: Interfaces formateadas:`, formattedInterfaces.length);
    return formattedInterfaces;
  } catch (error: any) {
    console.error('❌ Error obteniendo interfaces:', error.message);
    if (error.response) {
      console.error('❌ Respuesta del servidor:', error.response.status, error.response.data);
    }
    return [];
  }
}

// Obtener estadísticas de una interfaz
export async function getInterfaceStats(ifid: number = 0) {
  try {
    console.log(`📊 ntopng: Obteniendo estadísticas para ifid=${ifid}`);
    const data: any = await ntopngRequest('/lua/rest/v2/get/interface/stats.lua', { ifid });
    console.log(`📊 ntopng: Respuesta recibida:`, data ? 'OK' : 'NULL', data?.rsp ? 'con datos' : 'sin datos');
    console.log(`📊 ntopng: Estructura completa de data:`, JSON.stringify(data).substring(0, 1000));
    // ntopng puede devolver los datos directamente o en data.rsp
    return data?.rsp || data || null;
  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas de interfaz:', error.message);
    if (error.response) {
      console.error('❌ Respuesta del servidor:', error.response.status, error.response.data);
    }
    return null;
  }
}

// Obtener top hosts por tráfico
export async function getTopHosts(ifid: number = 0, mode: string = 'bytes', limit: number = 10) {
  try {
    const data: any = await ntopngRequest('/lua/rest/v2/get/top/hosts.lua', {
      ifid,
      mode, // 'bytes', 'packets', 'flows'
      limit
    });
    return data?.rsp || [];
  } catch (error) {
    console.error('Error obteniendo top hosts:', error);
    return [];
  }
}

// Obtener hosts activos
export async function getActiveHosts(ifid: number = 0) {
  try {
    const data: any = await ntopngRequest('/lua/rest/v2/get/host/active.lua', { ifid });
    return data?.rsp || [];
  } catch (error) {
    console.error('Error obteniendo hosts activos:', error);
    return [];
  }
}

// Obtener estadísticas de un host específico
export async function getHostStats(hostIp: string, vlanId: number = 0) {
  try {
    const data: any = await ntopngRequest('/lua/rest/v2/get/host/data.lua', {
      host: hostIp,
      vlan: vlanId
    });
    return data?.rsp || null;
  } catch (error) {
    console.error('Error obteniendo estadísticas de host:', error);
    return null;
  }
}

// Obtener top aplicaciones
export async function getTopApplications(ifid: number = 0, limit: number = 10) {
  try {
    const data: any = await ntopngRequest('/lua/rest/v2/get/top/applications.lua', {
      ifid,
      limit
    });
    return data?.rsp || [];
  } catch (error) {
    console.error('Error obteniendo top aplicaciones:', error);
    return [];
  }
}

// Obtener top países
export async function getTopCountries(ifid: number = 0, limit: number = 10) {
  try {
    const data: any = await ntopngRequest('/lua/rest/v2/get/top/countries.lua', {
      ifid,
      limit
    });
    return data?.rsp || [];
  } catch (error) {
    console.error('Error obteniendo top países:', error);
    return [];
  }
}

// Formatear bytes a formato legible
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Formatear bps (bits por segundo) a formato legible
export function formatBps(bps: number): string {
  if (bps === 0) return '0 bps';
  const k = 1000;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  return Math.round(bps / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

