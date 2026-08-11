import { useEffect, useState } from 'react';
import Link from 'next/link';
import { obtenerVendedoresConLocalizacion } from '../utils/tracking';
import { obtenerPedidos } from '../utils/supabase';

export default function Dashboard() {
  const [vendedores, setVendedores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [vendedoresData, pedidosData] = await Promise.all([
        obtenerVendedoresConLocalizacion(),
        obtenerPedidos()
      ]);
      setVendedores(vendedoresData || []);
      setPedidos(pedidosData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    totalVendedores: vendedores.length,
    vendedoresEnRuta: vendedores.filter(v => v.estado === 'en_ruta').length,
    vendedoresEnCliente: vendedores.filter(v => v.estado === 'en_cliente').length,
    vendedoresOffline: vendedores.filter(v => v.estado === 'offline').length,
    totalPedidosHoy: vendedores.reduce((sum, v) => sum + (v.pedidos_hoy || 0), 0),
    totalPedidos: pedidos.length,
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
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
          <h1 style={{ margin: 0, fontSize: '20px' }}>🚀 B2TRAC</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>
            Dashboard Central
          </p>
        </div>
        <Link href="/">
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
      <div style={{ padding: '20px' }}>

        {/* STATS ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <StatCard
            titulo="Vendedores Totales"
            valor={stats.totalVendedores}
            color="#007bff"
            icon="👨‍💼"
          />
          <StatCard
            titulo="En Ruta Ahora"
            valor={stats.vendedoresEnRuta}
            color="#ffc107"
            icon="🚗"
          />
          <StatCard
            titulo="En Cliente Ahora"
            valor={stats.vendedoresEnCliente}
            color="#28a745"
            icon="🏪"
          />
          <StatCard
            titulo="Offline"
            valor={stats.vendedoresOffline}
            color="#dc3545"
            icon="❌"
          />
          <StatCard
            titulo="Pedidos Hoy"
            valor={stats.totalPedidosHoy}
            color="#6c757d"
            icon="📋"
          />
          <StatCard
            titulo="Total Pedidos"
            valor={stats.totalPedidos}
            color="#17a2b8"
            icon="📦"
          />
        </div>

        {/* RESUMEN DE VENDEDORES */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>📍 Donde Anda Cada Vendedor</h2>
            <Link href="/vendedor/tracking">
              <button style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '8px 15px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                Ver Mapa →
              </button>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Cargando ubicaciones...
            </div>
          ) : vendedores.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Sin vendedores registrados
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Vendedor</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Ubicación Actual</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Próximo Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Distancia</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map((vendedor, index) => (
                    <tr key={vendedor.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>
                        {vendedor.nombre}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: getStatusColor(vendedor.estado),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          display: 'inline-block'
                        }}>
                          {getStatusLabel(vendedor.estado)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>
                        {vendedor.ubicacion_actual ? (
                          <>
                            <strong>{vendedor.ubicacion_actual.address || 'Ubicación'}</strong>
                            <br/>
                            <small style={{ color: '#666' }}>
                              ({vendedor.ubicacion_actual.lat?.toFixed(4)}, {vendedor.ubicacion_actual.lng?.toFixed(4)})
                            </small>
                          </>
                        ) : (
                          <span style={{ color: '#ccc' }}>Sin ubicación</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>
                        {vendedor.ruta_planificada && vendedor.ruta_planificada.length > 0 ? (
                          <>
                            <strong>{vendedor.ruta_planificada[0].cliente}</strong>
                            <br/>
                            <small style={{ color: '#2e7d32' }}>
                              {calcularDistancia(vendedor.ubicacion_actual, vendedor.ruta_planificada[0])} km
                            </small>
                          </>
                        ) : (
                          <span style={{ color: '#ccc' }}>Sin ruta</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        <span style={{
                          backgroundColor: '#e8e8e8',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {vendedor.pedidos_hoy || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <Link href="/vendedor">
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s',
              border: '2px solid #28a745'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>👨‍💼</div>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>Portal Vendedor</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Crear pedidos</p>
            </div>
          </Link>

          <Link href="/cliente">
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s',
              border: '2px solid #007bff'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📦</div>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>Portal Cliente</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Ver pedidos</p>
            </div>
          </Link>

          <Link href="/vendedor/tracking">
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s',
              border: '2px solid #dc3545'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📍</div>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>Rastreo en Mapa</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Ubicaciones en tiempo real</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}

function StatCard({ titulo, valor, color, icon }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
      <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{titulo}</p>
      <h3 style={{ margin: '10px 0 0 0', color, fontSize: '32px', fontWeight: 'bold' }}>
        {valor}
      </h3>
    </div>
  );
}

function getStatusColor(estado) {
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
}

function getStatusLabel(estado) {
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
}

function calcularDistancia(ubicacionActual, proximoCliente) {
  if (!ubicacionActual || !proximoCliente) return 'N/A';

  const lat1 = ubicacionActual.lat;
  const lon1 = ubicacionActual.lng;
  const lat2 = proximoCliente.lat;
  const lon2 = proximoCliente.lng;

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance.toFixed(1);
}
