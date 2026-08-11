import { useEffect, useState } from 'react';
import Link from 'next/link';
import { obtenerVendedoresConLocalizacion } from '../../utils/tracking';

export default function VendedorTracking() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: -33.8688, lng: -151.2093 }); // Santiago por defecto

  useEffect(() => {
    cargarVendedores();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarVendedores, 30000);
    return () => clearInterval(interval);
  }, []);

  async function cargarVendedores() {
    try {
      const data = await obtenerVendedoresConLocalizacion();
      setVendedores(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial' }}>
      {/* HEADER */}
      <header style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>📍 B2TRAC - Rastreo de Vendedores</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>
            Geolocalización en tiempo real
          </p>
        </div>
        <Link href="/vendedor">
          <button style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '8px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            ← Volver
          </button>
        </Link>
      </header>

      {/* MAIN CONTENT */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', padding: '20px' }}>

        {/* PANEL IZQUIERDO - RESUMEN DE VENDEDORES */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <div style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '15px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            📍 Vendedores en Ruta ({vendedores.length})
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Cargando ubicaciones...</div>
            ) : vendedores.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Sin vendedores activos
              </div>
            ) : (
              vendedores.map((vendedor, index) => (
                <VendedorCard
                  key={vendedor.id}
                  vendedor={vendedor}
                  index={index}
                  total={vendedores.length}
                />
              ))
            )}
          </div>
        </div>

        {/* PANEL DERECHO - MAPA */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          minHeight: '600px'
        }}>
          <MapContainer vendedores={vendedores} />
        </div>

      </div>
    </div>
  );
}

// Componente: Tarjeta de Vendedor
function VendedorCard({ vendedor, index, total }) {
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'en_ruta':
        return '#ffc107';
      case 'en_cliente':
        return '#28a745';
      case 'almacen':
        return '#6c757d';
      default:
        return '#dc3545';
    }
  };

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'en_ruta':
        return '🚗 En Ruta';
      case 'en_cliente':
        return '🏪 En Cliente';
      case 'almacen':
        return '📦 En Almacén';
      default:
        return '❌ Offline';
    }
  };

  const calcularKmAlCliente = () => {
    if (!vendedor.ubicacion_actual || !vendedor.ruta_planificada[0]) return 'N/A';

    const lat1 = vendedor.ubicacion_actual.lat;
    const lon1 = vendedor.ubicacion_actual.lng;
    const lat2 = vendedor.ruta_planificada[0].lat;
    const lon2 = vendedor.ruta_planificada[0].lng;

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance.toFixed(1);
  };

  return (
    <div style={{
      borderBottom: '1px solid #eee',
      padding: '15px',
      transition: 'background 0.2s'
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>

      {/* Nombre y Estado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 'bold' }}>
            {index + 1}. {vendedor.nombre}
          </h4>
          <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
            {vendedor.email}
          </p>
        </div>
        <span style={{
          backgroundColor: getStatusColor(vendedor.estado),
          color: 'white',
          padding: '4px 8px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          {getStatusLabel(vendedor.estado)}
        </span>
      </div>

      {/* Ubicación Actual */}
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '8px',
        borderRadius: '3px',
        marginBottom: '8px',
        fontSize: '12px'
      }}>
        <strong>📍 Ubicación:</strong><br/>
        {vendedor.ubicacion_actual ? (
          <>
            {vendedor.ubicacion_actual.address || 'Coordenadas'}
            <br/>
            <small style={{ color: '#666' }}>
              ({vendedor.ubicacion_actual.lat.toFixed(4)}, {vendedor.ubicacion_actual.lng.toFixed(4)})
            </small>
          </>
        ) : (
          'Sin ubicación'
        )}
      </div>

      {/* Próximo Cliente */}
      {vendedor.ruta_planificada && vendedor.ruta_planificada.length > 0 ? (
        <div style={{
          backgroundColor: '#e8f5e9',
          padding: '8px',
          borderRadius: '3px',
          fontSize: '12px'
        }}>
          <strong>🎯 Próximo:</strong><br/>
          {vendedor.ruta_planificada[0].cliente}<br/>
          <small style={{ color: '#2e7d32' }}>
            {calcularKmAlCliente()} km
          </small>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#f3f3f3',
          padding: '8px',
          borderRadius: '3px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>🎯 Próximo:</strong><br/>
          Sin ruta planificada
        </div>
      )}

      {/* Pedidos Hoy */}
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #ddd',
        fontSize: '12px'
      }}>
        <strong>📋 Pedidos hoy:</strong> {vendedor.pedidos_hoy || 0}
      </div>

      {/* Última Actualización */}
      <div style={{
        marginTop: '5px',
        fontSize: '10px',
        color: '#999'
      }}>
        🕐 {formatearHora(vendedor.ultima_actualizacion)}
      </div>
    </div>
  );
}

// Componente: Mapa con Vendedores
function MapContainer({ vendedores }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '600px', backgroundColor: '#e0e0e0' }}>
      {/* Simulación de Mapa (usando iframe de Google Maps) */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://www.google.com/maps/embed/v1/search?key=YOUR_API_KEY&q=Santiago+Chile&zoom=12`}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 'none' }}
        />

        {/* Overlay con indicadores de vendedores */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none'
        }}>
          {vendedores.map((vendedor, index) => (
            <VendedorMarker
              key={vendedor.id}
              vendedor={vendedor}
              index={index}
            />
          ))}
        </div>

        {/* Leyenda */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <div><span style={{ color: '#ffc107', fontWeight: 'bold' }}>●</span> En Ruta</div>
          <div><span style={{ color: '#28a745', fontWeight: 'bold' }}>●</span> En Cliente</div>
          <div><span style={{ color: '#6c757d', fontWeight: 'bold' }}>●</span> En Almacén</div>
          <div><span style={{ color: '#dc3545', fontWeight: 'bold' }}>●</span> Offline</div>
        </div>

        {/* Información de Google Maps API */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#fff3cd',
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '11px',
          maxWidth: '250px'
        }}>
          ⚠️ <strong>Nota:</strong> Para mostrar el mapa, debes obtener una API key de Google Maps en
          <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', marginLeft: '5px' }}>
            Google Cloud Console
          </a>
        </div>
      </div>
    </div>
  );
}

// Componente: Marcador de Vendedor en el Mapa
function VendedorMarker({ vendedor, index }) {
  const getMarkerColor = (estado) => {
    switch (estado) {
      case 'en_ruta':
        return '#ffc107';
      case 'en_cliente':
        return '#28a745';
      case 'almacen':
        return '#6c757d';
      default:
        return '#dc3545';
    }
  };

  // Calcular posición del marcador (esto sería dinámico con coordenadas reales)
  const posX = (index * 15) % 90;
  const posY = 20 + (Math.floor(index / 6) * 30);

  return (
    <div style={{
      position: 'absolute',
      left: `${posX}%`,
      top: `${posY}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: 10
    }}>
      <div style={{
        width: '30px',
        height: '30px',
        backgroundColor: getMarkerColor(vendedor.estado),
        borderRadius: '50%',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.3)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}>
        {index + 1}
      </div>
      <div style={{
        position: 'absolute',
        top: '35px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '3px',
        fontSize: '10px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}>
        {vendedor.nombre.split(' ')[0]}
      </div>
    </div>
  );
}

// Utilidad: Formatear hora
function formatearHora(fecha) {
  if (!fecha) return 'Desconocida';
  const date = new Date(fecha);
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}
