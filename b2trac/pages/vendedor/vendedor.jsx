import { useEffect, useState } from 'react';
import Link from 'next/link';
import { obtenerPedidos } from '../../utils/supabase';

export default function PortalVendedor() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState('resumen');

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    try {
      const data = await obtenerPedidos();
      setPedidos(data || []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    totalPedidos: pedidos.length,
    pedidosEnCurso: pedidos.filter(p => p.estado === 'pendiente').length,
    totalMonto: pedidos.reduce((sum, p) => sum + (p.monto || 0), 0),
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
            Portal Vendedor
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

      {/* MAIN */}
      <div style={{ padding: '20px' }}>
        {/* STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <StatCard titulo="Pedidos Totales" valor={stats.totalPedidos} color="#007bff" />
          <StatCard titulo="En Curso" valor={stats.pedidosEnCurso} color="#ffc107" />
          <StatCard titulo="Monto Total" valor={`$${stats.totalMonto.toLocaleString('es-CL')}`} color="#28a745" />
        </div>

        {/* CONTROLES */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <Link href="/pedidos/nuevo">
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              ➕ Nuevo Pedido
            </button>
          </Link>
          <button
            onClick={() => setSeccion('pedidos')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📋 Ver Pedidos
          </button>
        </div>

        {/* TABLA */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Cargando pedidos...
            </div>
          ) : pedidos.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No hay pedidos aún. ¡Crea uno nuevo!
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Número</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Cliente</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      #{pedido.numero}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {pedido.clientes?.nombre || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      ${pedido.monto?.toLocaleString('es-CL') || '0'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: '#ffc107',
                        color: '#333',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Link href={`/pedidos/${pedido.id}`}>
                        <button style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          padding: '4px 8px',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          Ver
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ titulo, valor, color }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{titulo}</p>
      <h3 style={{ margin: '10px 0 0 0', color, fontSize: '28px' }}>
        {valor}
      </h3>
    </div>
  );
}
