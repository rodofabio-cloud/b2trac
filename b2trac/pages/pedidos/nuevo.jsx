import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, crearPedido, obtenerClientes, subirArchivo } from '../../utils/supabase';

export default function NuevoPedido() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numero: '',
    cliente_id: '',
    vendedor_id: '1', // Temp: usuario hardcodeado
    monto: '',
    estado: 'pendiente'
  });
  const [archivos, setArchivos] = useState({
    foto: null,
    factura: null,
    guia: null
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    try {
      const data = await obtenerClientes();
      setClientes(data || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert('Error cargando clientes');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let urls = {
        foto_url: null,
        factura_url: null,
        guia_url: null
      };

      // Subir archivos
      if (archivos.foto) {
        const nombreFoto = `fotos/${Date.now()}-${archivos.foto.name}`;
        urls.foto_url = await subirArchivo('fotos', nombreFoto, archivos.foto);
      }

      if (archivos.factura) {
        const nombreFactura = `${form.numero}-factura-${Date.now()}.pdf`;
        urls.factura_url = await subirArchivo('documentos', nombreFactura, archivos.factura);
      }

      if (archivos.guia) {
        const nombreGuia = `${form.numero}-guia-${Date.now()}.pdf`;
        urls.guia_url = await subirArchivo('documentos', nombreGuia, archivos.guia);
      }

      // Crear pedido
      await crearPedido({
        ...form,
        cliente_id: parseInt(form.cliente_id),
        monto: parseFloat(form.monto),
        ...urls
      });

      alert('Pedido creado exitosamente');
      router.push('/');
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nuevo Pedido</h1>

      <form onSubmit={handleSubmit}>
        {/* Número de Pedido */}
        <div style={{ marginBottom: '15px' }}>
          <label>Número de Pedido *</label>
          <input
            type="text"
            placeholder="Ej: 2024-001"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        {/* Cliente */}
        <div style={{ marginBottom: '15px' }}>
          <label>Cliente *</label>
          <select
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.empresa}
              </option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div style={{ marginBottom: '15px' }}>
          <label>Monto (CLP) *</label>
          <input
            type="number"
            placeholder="Ej: 50000"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
            required
            step="0.01"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        {/* Foto */}
        <div style={{ marginBottom: '15px' }}>
          <label>📷 Foto del Pedido</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setArchivos({ ...archivos, foto: e.target.files[0] })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {archivos.foto && <small>✅ {archivos.foto.name}</small>}
        </div>

        {/* Factura PDF */}
        <div style={{ marginBottom: '15px' }}>
          <label>📄 Factura PDF *</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setArchivos({ ...archivos, factura: e.target.files[0] })}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {archivos.factura && <small>✅ {archivos.factura.name}</small>}
        </div>

        {/* Guía PDF */}
        <div style={{ marginBottom: '15px' }}>
          <label>📦 Guía de Despacho PDF *</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setArchivos({ ...archivos, guia: e.target.files[0] })}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {archivos.guia && <small>✅ {archivos.guia.name}</small>}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Guardando...' : '✅ Guardar Pedido'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
