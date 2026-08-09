import { useState, useEffect } from 'react';
import Link from 'next/link';
import { obtenerPedidos } from '../../utils/supabase';

export default function PedidosIndex() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>📋 Listado de Pedidos</h1>

      <div style={{ marginBottom: '20px' }}>
        <Link href="/pedidos/nuevo">
          <button style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            ➕ Nuevo Pedido
          </button>
        </Link>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : pedidos.length === 0 ? (
        <p>No hay pedidos aún.</p>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '20px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Número
              </th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Cliente
              </th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Monto
              </th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Estado
              </th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>
                  <Link href={`/pedidos/${pedido.id}`}>
                    #{pedido.numero}
                  </Link>
                </td>
                <td style={{ padding: '10px' }}>
                  {pedido.clientes?.nombre || 'N/A'}
                </td>
                <td style={{ padding: '10px' }}>
                  ${pedido.monto.toFixed(2)}
                </td>
                <td style={{ padding: '10px' }}>
                  {pedido.estado}
                </td>
                <td style={{ padding: '10px' }}>
                  {new Date(pedido.fecha_pedido).toLocaleDateString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
