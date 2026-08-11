import { supabase } from './supabase';

/**
 * Obtener todos los vendedores con su ubicación actual y ruta planificada
 */
export async function obtenerVendedoresConLocalizacion() {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'default';

  try {
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        nombre,
        email,
        telefono,
        estado,
        ubicacion_actual,
        ruta_planificada,
        pedidos_hoy,
        ultima_actualizacion
      `)
      .eq('tenant_id', tenantId)
      .eq('estado', 'activo')
      .order('nombre');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vendedores:', error);
    return [];
  }
}

/**
 * Actualizar ubicación actual de un vendedor (desde app móvil)
 */
export async function actualizarUbicacionVendedor(vendedorId, ubicacion) {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'default';

  try {
    const { data, error } = await supabase
      .from('vendedores')
      .update({
        ubicacion_actual: {
          lat: ubicacion.latitude,
          lng: ubicacion.longitude,
          address: ubicacion.address || 'Ubicación desconocida',
          timestamp: new Date().toISOString()
        },
        ultima_actualizacion: new Date().toISOString()
      })
      .eq('id', vendedorId)
      .eq('tenant_id', tenantId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating ubicación:', error);
    throw error;
  }
}

/**
 * Obtener ruta planificada para un vendedor
 */
export async function obtenerRutaPlanificada(vendedorId) {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'default';

  try {
    const { data, error } = await supabase
      .from('rutas_diarias')
      .select(`
        id,
        vendedor_id,
        fecha,
        clientes:cliente_id(
          id,
          nombre,
          direccion,
          ubicacion:ubicacion_cliente(lat, lng)
        ),
        orden,
        completado
      `)
      .eq('vendedor_id', vendedorId)
      .eq('tenant_id', tenantId)
      .eq('fecha', new Date().toISOString().split('T')[0])
      .order('orden');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching ruta:', error);
    return [];
  }
}

/**
 * Marcar cliente como visitado
 */
export async function marcarClienteVisitado(rutaId) {
  try {
    const { data, error } = await supabase
      .from('rutas_diarias')
      .update({
        completado: true,
        hora_visita: new Date().toISOString()
      })
      .eq('id', rutaId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking cliente visited:', error);
    throw error;
  }
}

/**
 * Calcular distancia entre dos puntos (Haversine formula)
 */
export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Generar datos de prueba para vendedores con ubicación
 */
export function generarDatosVendedorPrueba(index) {
  const ubicacionesSantiago = [
    { lat: -33.8688, lng: -151.2093, address: 'Centro, Santiago' },
    { lat: -33.8989, lng: -151.2093, address: 'Providencia, Santiago' },
    { lat: -33.4069, lng: -151.2093, address: 'La Florida, Santiago' },
    { lat: -33.5709, lng: -151.2093, address: 'Ñuñoa, Santiago' },
    { lat: -33.3886, lng: -151.2093, address: 'Maipú, Santiago' },
  ];

  const clientesDePrueba = [
    { cliente: 'Supermercado Jumbo Providencia', lat: -33.8989, lng: -151.2093 },
    { cliente: 'Multitienda La Florida', lat: -33.4069, lng: -151.2093 },
    { cliente: 'Farmacia Ahumada Ñuñoa', lat: -33.5709, lng: -151.2093 },
    { cliente: 'Lider Maipú', lat: -33.3886, lng: -151.2093 },
  ];

  return {
    ubicacion_actual: ubicacionesSantiago[index % ubicacionesSantiago.length],
    ruta_planificada: clientesDePrueba.slice(0, 2),
    pedidos_hoy: Math.floor(Math.random() * 8) + 2,
    estado: ['en_ruta', 'en_cliente', 'almacen'][Math.floor(Math.random() * 3)],
    ultima_actualizacion: new Date().toISOString()
  };
}
