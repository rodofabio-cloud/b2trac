import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import Link from "next/link";

/* ============================================================
   B2TRAC - PORTAL CLIENTE
   Sistema de gestión para clientes/distribuidores
   ============================================================ */

const mem = {};
const APP_VERSION = "v1.0-cliente";

const EMPRESA_DATOS = {
  razonSocial: "B2TRAC",
  rut: "XX.XXX.XXX-X",
  direccion: "Calle Principal 123, Santiago",
  ciudad: "Santiago, Chile",
  telefono: "+56 2 XXXX XXXX",
  email: "contacto@b2trac.com",
  sitio: "www.b2trac.com",
};

const ESTADOS_PEDIDO = [
  { id: "confirmacion", label: "Confirmación", color: "#FFC107" },
  { id: "preparacion", label: "Preparación", color: "#17A2B8" },
  { id: "despacho", label: "Despacho", color: "#6F42C1" },
  { id: "entregado", label: "Entregado", color: "#28A745" },
];

export default function PortalCliente() {
  const [seccion, setSeccion] = useState("resumen");
  const [cliente, setCliente] = useState({
    nombre: "FABIO LEONARDO SAID RODOVÁLHO",
    empresa: "Distribuidora B2TRAC",
    vendedor: "Claudio Leclerc",
    contacto: "fsaid@icla.cl",
  });

  // Datos de ejemplo (en prod, vendrían de Supabase)
  const [pedidos] = useState([
    {
      id: 1,
      numero: "PED-0020",
      fecha: "2024-08-07",
      estado: "confirmacion",
      monto: 1376946,
      items: 1,
      detalles: [
        { producto: "Lubricante Ipone", cantidad: 10, precio: 137694.6 },
      ],
    },
    {
      id: 2,
      numero: "PED-0019",
      fecha: "2024-08-06",
      estado: "entregado",
      monto: 2500000,
      items: 2,
    },
  ]);

  const stats = useMemo(() => {
    const totalPedidos = pedidos.length;
    const pedidosEnCurso = pedidos.filter((p) => p.estado !== "entregado").length;
    const totalComprado = pedidos.reduce((sum, p) => sum + p.monto, 0);
    const deudaActual = pedidos
      .filter((p) => p.estado !== "entregado")
      .reduce((sum, p) => sum + p.monto, 0);

    return { totalPedidos, pedidosEnCurso, totalComprado, deudaActual };
  }, [pedidos]);

  const handleDescargar = (formato) => {
    const datos = pedidos.map((p) => ({
      Número: p.numero,
      Fecha: p.fecha,
      Estado: p.estado,
      Monto: p.monto,
    }));

    if (formato === "excel") {
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
      XLSX.writeFile(wb, `B2TRAC_Pedidos_${new Date().toISOString().split("T")[0]}.xlsx`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          backgroundColor: "#1a1a1a",
          color: "white",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "20px" }}>🚀 B2TRAC</h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#aaa" }}>
            Portal Cliente
          </p>
        </div>
        <Link href="/">
          <button
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "8px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← Volver
          </button>
        </Link>
      </header>

      {/* MAIN CONTENT */}
      <div style={{ padding: "20px" }}>
        {/* BIENVENIDA */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ margin: 0, color: "#333" }}>
            Bienvenido, {cliente.nombre}
          </h2>
          <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
            Empresa: <strong>{cliente.empresa}</strong> | Vendedor:{" "}
            <strong>{cliente.vendedor}</strong>
          </p>
          <p style={{ margin: "5px 0 0 0", color: "#999", fontSize: "12px" }}>
            {cliente.contacto}
          </p>
        </div>

        {/* ESTADÍSTICAS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            titulo="Pedidos Totales"
            valor={stats.totalPedidos}
            color="#007bff"
          />
          <StatCard
            titulo="En Curso"
            valor={stats.pedidosEnCurso}
            color="#ffc107"
          />
          <StatCard
            titulo="Total Comprado"
            valor={`$${stats.totalComprado.toLocaleString("es-CL")}`}
            color="#28a745"
          />
          <StatCard
            titulo="Deuda Actual"
            valor={`$${stats.deudaActual.toLocaleString("es-CL")}`}
            color="#dc3545"
          />
        </div>

        {/* CONTROLES */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => handleDescargar("excel")}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              marginRight: "10px",
            }}
          >
            📥 Descargar Excel
          </button>
          <button
            onClick={() => setSeccion("pedidos")}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            📋 Ver Todos los Pedidos
          </button>
        </div>

        {/* TABLA DE PEDIDOS */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Pedido</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Fecha</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Estado</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Monto</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => {
                const estadoData = ESTADOS_PEDIDO.find(
                  (e) => e.id === pedido.estado
                );
                return (
                  <tr
                    key={pedido.id}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: "12px", fontWeight: "bold" }}>
                      {pedido.numero}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {new Date(pedido.fecha).toLocaleDateString("es-CL")}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          backgroundColor: estadoData.color,
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {estadoData.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      ${pedido.monto.toLocaleString("es-CL")}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        style={{
                          backgroundColor: "#007bff",
                          color: "white",
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#666",
            textAlign: "center",
          }}
        >
          <p>
            <strong>{EMPRESA_DATOS.razonSocial}</strong> | {EMPRESA_DATOS.email}{" "}
            | {EMPRESA_DATOS.telefono}
          </p>
          <p>{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ titulo, valor, color }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>{titulo}</p>
      <h3 style={{ margin: "10px 0 0 0", color, fontSize: "28px" }}>
        {valor}
      </h3>
    </div>
  );
}
