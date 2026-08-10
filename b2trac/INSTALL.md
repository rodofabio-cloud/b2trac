# Guía de Instalación - B2TRAC v1.0

Instrucciones paso a paso para instalar y configurar B2TRAC en tu entorno.

## 📋 Requisitos Previos

- **Node.js**: v18 o superior
- **npm**: v9 o superior (o yarn)
- **Git**: Para clonar el repositorio
- **Cuenta Supabase**: Libre en https://supabase.com
- **Cuenta Vercel**: Libre en https://vercel.com (opcional, para deployment)

## 🚀 Instalación Local

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/rodofabio-cloud/b2trac.git
cd b2trac
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Supabase

#### 3.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se inicialice (toma ~1 minuto)
5. Ve a la pestaña **Settings > API**
6. Copia:
   - **URL del proyecto** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)

#### 3.2 Crear Tablas

En Supabase, ve a **SQL Editor** y ejecuta el siguiente script:

```sql
-- Tabla: clientes
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
  tenant_id VARCHAR(50) NOT NULL DEFAULT 'default'
);

-- Tabla: vendedores
CREATE TABLE vendedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  rut VARCHAR(20) UNIQUE,
  telefono VARCHAR(20),
  estado VARCHAR(50) DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(50) NOT NULL DEFAULT 'default'
);

-- Tabla: pedidos
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) UNIQUE NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id),
  vendedor_id INTEGER REFERENCES vendedores(id),
  monto DECIMAL(12, 2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  foto_url TEXT,
  factura_url TEXT,
  guia_url TEXT,
  fecha_pedido TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(50) NOT NULL DEFAULT 'default'
);

-- Crear índices para performance
CREATE INDEX idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX idx_pedidos_tenant ON pedidos(tenant_id);
CREATE INDEX idx_vendedores_tenant ON vendedores(tenant_id);
```

#### 3.3 Crear Storage Buckets

En Supabase, ve a **Storage** y crea dos buckets públicos:

1. **fotos**
   - Para: Imágenes de pedidos
   - Permisos: Público

2. **documentos**
   - Para: PDFs de facturas y guías
   - Permisos: Público

### Paso 4: Configurar Variables de Entorno

Crea archivo `.env.local` en la raíz del proyecto:

```env
# Supabase (requerido)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Tenant ID (opcional, default: "default")
NEXT_PUBLIC_TENANT_ID=default

# Branding (personalizable por cliente)
NEXT_PUBLIC_APP_NAME=B2TRAC
NEXT_PUBLIC_COMPANY_NAME=Tu Empresa S.A.
NEXT_PUBLIC_COMPANY_RUT=XX.XXX.XXX-X
NEXT_PUBLIC_COMPANY_EMAIL=contacto@empresa.com
NEXT_PUBLIC_COMPANY_PHONE=+56 2 1234 5678
NEXT_PUBLIC_COMPANY_WEBSITE=www.empresa.com
NEXT_PUBLIC_COMPANY_ADDRESS=Calle Principal 123, Santiago

# Colores (tema)
NEXT_PUBLIC_PRIMARY_COLOR=#007bff
NEXT_PUBLIC_SUCCESS_COLOR=#28a745
NEXT_PUBLIC_WARNING_COLOR=#ffc107
NEXT_PUBLIC_DANGER_COLOR=#dc3545
NEXT_PUBLIC_SECONDARY_COLOR=#6c757d
NEXT_PUBLIC_INFO_COLOR=#17a2b8
```

### Paso 5: Agregar Datos de Prueba (Opcional)

En SQL Editor de Supabase:

```sql
-- Agregar cliente de ejemplo
INSERT INTO clientes (nombre, empresa, rut, email, telefono, ciudad, tenant_id) 
VALUES 
('Fabio Leonardo Said', 'Distribuidora B2TRAC', '12.345.678-9', 'fsaid@icla.cl', '+56 9 8765 4321', 'Santiago', 'default');

-- Agregar vendedor de ejemplo
INSERT INTO vendedores (nombre, email, rut, telefono, tenant_id)
VALUES
('Claudio Leclerc', 'claudio@empresa.com', '11.111.111-1', '+56 9 1111 1111', 'default');

-- Agregar pedido de ejemplo
INSERT INTO pedidos (numero, cliente_id, vendedor_id, monto, estado, fecha_pedido, tenant_id)
VALUES
('PED-0001', 1, 1, 1376946.00, 'confirmacion', NOW(), 'default');
```

### Paso 6: Ejecutar en Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 🌐 Deployment en Vercel

### Paso 1: Conectar Repositorio

1. Ve a https://vercel.com/new
2. Conecta tu cuenta GitHub
3. Importa el repositorio `b2trac`
4. Vercel detectará que es un proyecto Next.js

### Paso 2: Configurar Variables de Entorno

En Vercel Dashboard:
1. Proyecto → Settings → Environment Variables
2. Añade todas las variables de `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_NAME=B2TRAC
NEXT_PUBLIC_COMPANY_NAME=Tu Empresa
... (todas las demás)
```

### Paso 3: Deploy

1. Haz push a la rama `main`
2. Vercel deployará automáticamente
3. Tu app estará disponible en `https://b2trac-xxx.vercel.app`

### Paso 4: Dominio Personalizado (Opcional)

En Vercel Settings:
1. Domains → Add Domain
2. Apunta tu dominio a Vercel
3. Obtén certificado SSL automáticamente

## ✅ Verificación Post-Instalación

Una vez instalado, verifica:

1. **Home page**: http://localhost:3000
   - Debe mostrar botones "Portal Vendedor" y "Portal Cliente"

2. **Portal Vendedor**: http://localhost:3000/vendedor
   - Debe mostrar tabla de pedidos (puede estar vacía)
   - Botón "Nuevo Pedido" funcional

3. **Portal Cliente**: http://localhost:3000/cliente
   - Debe mostrar estadísticas
   - Tabla de pedidos

4. **Crear Pedido**: http://localhost:3000/pedidos/nuevo
   - Formulario debe cargar clientes desde BD

## 🔧 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"
Verifica que `.env.local` esté en la raíz del proyecto y contiene las variables.

### Pedidos no aparecen en la tabla
1. Verifica que la tabla `pedidos` fue creada en Supabase
2. Verifica que hay datos insertados
3. Abre DevTools → Console para ver errores

### Storage: Error al subir archivos
1. Verifica que los buckets `fotos` y `documentos` existen
2. Verifica permisos: deben ser públicos
3. Verifica tamaño máximo de archivo (default: 50MB)

## 📞 Soporte

Para problemas de instalación:
- Email: rodofabio@gmail.com
- GitHub Issues: https://github.com/rodofabio-cloud/b2trac/issues

## 🎯 Próximos Pasos

Después de instalar:

1. **Personalizar branding**: Edita variables en `.env.local`
2. **Agregar más clientes**: Ve a Supabase → Editor SQL
3. **Crear más vendedores**: A través de SQL o interfaz
4. **Customizar estilos**: Edita `styles/globals.css`

¡Tu B2TRAC está listo para usar! 🚀

