# B2TRAC v1.0 - CRM SaaS Multi-Tenant

**B2TRAC** es una plataforma SaaS de código completo para la gestión de ventas y distribución en ruta. Diseñada como base comercializable para empresas de ventas, distribución y logística.

## 🎯 Características Principales

### Portal Dual
- **Portal Vendedor**: Gestión de pedidos, clientes y seguimiento de entregas
- **Portal Cliente/Distribuidor**: Visualización de pedidos, historial de compras, descargas

### Funcionalidades Core
- Gestión de pedidos con estados (confirmación, preparación, despacho, entregado)
- Administración de clientes/distribuidores
- Carga de documentos (facturas, guías de despacho, fotos)
- Almacenamiento de archivos en Supabase Storage
- Estadísticas y dashboards por portal
- Descargas en Excel

### Stack Tecnológico
- **Frontend**: Next.js 14, React 18
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Librerías**: Axios, XLSX, PapaParse

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Uso](#uso)
- [Personalización](#personalización)
- [Deployment](#deployment)
- [Licencia](#licencia)

## 🚀 Instalación

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Vercel (para deployment)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/rodofabio-cloud/b2trac.git
cd b2trac
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno** (ver sección Configuración)

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. Abrir [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Branding (Personalización por Cliente)
NEXT_PUBLIC_APP_NAME=B2TRAC
NEXT_PUBLIC_COMPANY_NAME=Tu Empresa
NEXT_PUBLIC_COMPANY_RUT=XX.XXX.XXX-X
NEXT_PUBLIC_COMPANY_EMAIL=contacto@empresa.com
NEXT_PUBLIC_COMPANY_PHONE=+56 2 XXXX XXXX
NEXT_PUBLIC_COMPANY_WEBSITE=www.empresa.com
NEXT_PUBLIC_COMPANY_ADDRESS=Dirección de la Empresa

# Theme
NEXT_PUBLIC_PRIMARY_COLOR=#007bff
NEXT_PUBLIC_SUCCESS_COLOR=#28a745
NEXT_PUBLIC_WARNING_COLOR=#ffc107
NEXT_PUBLIC_DANGER_COLOR=#dc3545
```

### Base de Datos Supabase

Crear las siguientes tablas:

#### Tabla: `clientes`
```sql
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255) NOT NULL,
  rut VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  telefono VARCHAR(20),
  direccion TEXT,
  ciudad VARCHAR(100),
  estado VARCHAR(50) DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(50) NOT NULL
);
```

#### Tabla: `pedidos`
```sql
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) UNIQUE NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id),
  vendedor_id INTEGER,
  monto DECIMAL(12, 2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  foto_url TEXT,
  factura_url TEXT,
  guia_url TEXT,
  fecha_pedido TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(50) NOT NULL
);
```

#### Tabla: `vendedores`
```sql
CREATE TABLE vendedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  rut VARCHAR(20) UNIQUE,
  telefono VARCHAR(20),
  estado VARCHAR(50) DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(50) NOT NULL
);
```

### Storage Supabase

Crear los siguientes buckets:
- `fotos` - Para fotos de pedidos
- `documentos` - Para facturas y guías

## 📁 Estructura del Proyecto

```
b2trac/
├── pages/
│   ├── _app.jsx              # Wrapper principal
│   ├── index.jsx             # Home - Selector de portales
│   ├── cliente/
│   │   ├── index.jsx         # Router
│   │   └── cliente.jsx       # Portal Cliente
│   ├── vendedor/
│   │   ├── index.jsx         # Router
│   │   └── vendedor.jsx      # Portal Vendedor
│   └── pedidos/
│       ├── index.jsx         # Listado de pedidos
│       └── nuevo.jsx         # Crear nuevo pedido
├── styles/
│   └── globals.css           # Estilos globales
├── utils/
│   └── supabase.js           # Cliente Supabase + funciones
├── public/                   # Assets estáticos
├── .env.local                # Variables de entorno (git-ignored)
├── next.config.js            # Configuración Next.js
├── package.json              # Dependencias y scripts
└── README.md                 # Este archivo
```

## 💻 Uso

### Portal Home
Selecciona entre Portal Vendedor o Portal Cliente al ingresar.

### Portal Vendedor
**Ruta**: `/vendedor`

Funcionalidades:
- Ver estadísticas de pedidos
- Crear nuevo pedido
- Ver lista de pedidos
- Ver detalles de cada pedido

### Portal Cliente
**Ruta**: `/cliente`

Funcionalidades:
- Ver resumen de pedidos
- Ver historial de compras
- Descargar reportes en Excel
- Ver estado de pedidos

### Crear Pedido
**Ruta**: `/pedidos/nuevo`

Campos requeridos:
- Número de pedido
- Cliente
- Monto
- Factura PDF (obligatoria)
- Guía de despacho PDF (obligatoria)
- Foto del pedido (opcional)

## 🎨 Personalización

### Por Cliente (White Label)

Cada cliente puede tener su propia personalización:

1. **Variables de entorno personalizadas** por tenant
2. **Colores de tema** configurables
3. **Logo y branding** por cliente
4. **Datos de empresa** personalizados

### Agregar Campos Personalizados

Edita las tablas Supabase para agregar campos adicionales según necesidades del cliente.

### Modificar Estilos

Los estilos se encuentran en `styles/globals.css`. Usa variables CSS para facilitar personalización.

## 🚀 Deployment

### Deployment en Vercel

1. **Conectar repositorio** a Vercel
2. **Agregar variables de entorno** en Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Todas las variables de branding

3. **Deploy automático** en cada push a main

### Deployment Manual

```bash
npm run build
npm run start
```

## 📊 Scripts Disponibles

```bash
npm run dev      # Ejecutar en desarrollo
npm run build    # Compilar para producción
npm run start    # Ejecutar en producción
npm run lint     # Validar código
```

## 🔐 Seguridad

- Usar RLS (Row Level Security) en Supabase para multi-tenant
- Validar `tenant_id` en todas las queries
- Variables sensibles en `.env.local` (no en git)
- HTTPS en producción (Vercel)

## 📝 Licencia

Licencia Propietaria - B2TRAC SaaS Base v1.0
Contactar a: rodofabio@gmail.com para licensing

## 🤝 Soporte

Para soporte técnico o consultas de licensing:
- Email: rodofabio@gmail.com
- GitHub: https://github.com/rodofabio-cloud/b2trac

---

**Version**: 1.0.0  
**Última actualización**: 2026-08-10  
**Autor**: Fabio Said (ICLA)
