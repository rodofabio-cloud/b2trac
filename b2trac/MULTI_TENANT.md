# Guía Multi-Tenant - B2TRAC

Este documento explica cómo B2TRAC está diseñado para soportar múltiples clientes (multi-tenant) en una única instancia.

## 🎯 Concepto Multi-Tenant

B2TRAC utiliza el modelo **database per tenant** donde cada cliente:
- Comparte la misma aplicación/código
- Tiene datos completamente aislados en la BD
- Usa `tenant_id` para segregación lógica de datos
- Puede tener personalización de branding

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────┐
│         Vercel (Aplicación Única)               │
│  B2TRAC v1.0 (Código compartido)                │
└──────────────┬──────────────────────────────────┘
               │
               ├─► Cliente A (.env)
               │   └─► tenant_id: "cliente-a"
               │
               ├─► Cliente B (.env)
               │   └─► tenant_id: "cliente-b"
               │
               └─► Cliente C (.env)
                   └─► tenant_id: "cliente-c"
                   
       ┌────────────────────────────────┐
       │   Supabase (BD Centralizada)   │
       │                                 │
       │  ┌──────────────────────────┐  │
       │  │  clientes (tenant_id)    │  │
       │  │  vendedores (tenant_id)  │  │
       │  │  pedidos (tenant_id)     │  │
       │  └──────────────────────────┘  │
       └────────────────────────────────┘
```

## 🔐 Aislamiento de Datos

### Cada tabla tiene `tenant_id`:

```sql
-- Cliente solo ve sus propios datos
SELECT * FROM pedidos 
WHERE tenant_id = 'cliente-a';

-- Otros tenants no ven los datos
SELECT * FROM pedidos 
WHERE tenant_id = 'cliente-b';  -- Resultados diferentes
```

### En el código:

```javascript
// En utils/supabase.js
export async function obtenerPedidos() {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'default';
  
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, clientes(nombre, empresa)')
    .eq('tenant_id', tenantId);  // ← Filtrado por tenant
  
  if (error) throw error;
  return data;
}
```

## 🚀 Cómo Desplegar por Cliente

### Opción 1: Instancia Separada por Cliente (Recomendada para SaaS)

Cada cliente tiene su propia URL y configuración:

```
Cliente A: https://a.b2trac.com
  └─ NEXT_PUBLIC_TENANT_ID=cliente-a
  └─ NEXT_PUBLIC_COMPANY_NAME=Empresa A
  
Cliente B: https://b.b2trac.com
  └─ NEXT_PUBLIC_TENANT_ID=cliente-b
  └─ NEXT_PUBLIC_COMPANY_NAME=Empresa B
```

**Ventajas:**
- Máximo control por cliente
- Fácil de escalar
- Personalización independiente

**Desventajas:**
- Más recursos en Vercel
- Múltiples dominios

### Opción 2: Instancia Única Compartida

Todos los clientes usan la misma URL:

```
https://b2trac.com/?tenant=cliente-a
https://b2trac.com/?tenant=cliente-b
```

Esto requeriría agregar:
```javascript
// En pages/_app.jsx
const router = useRouter();
const tenantId = router.query.tenant || 'default';
```

**Ventajas:**
- Un solo deployment
- Costos menores

**Desventajas:**
- Más complejo de implementar
- Seguridad más crítica

## 📋 Checklist para Nuevo Cliente

### 1. Preparación Supabase
```sql
-- Insertar clientes
INSERT INTO clientes (nombre, empresa, rut, email, tenant_id) 
VALUES ('Cliente Nuevo', 'Empresa Nueva', '12.345.678-9', 'email@empresa.com', 'cliente-nuevo');

-- Insertar vendedores
INSERT INTO vendedores (nombre, email, rut, tenant_id)
VALUES ('Juan Vendedor', 'juan@empresa.com', '11.111.111-1', 'cliente-nuevo');
```

### 2. Crear Deployment en Vercel

```bash
# Opción A: Fork del repositorio
git clone https://github.com/rodofabio-cloud/b2trac.git
git checkout -b cliente-nuevo
```

### 3. Configurar Variables de Entorno

En Vercel Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co (compartida)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (compartida)
NEXT_PUBLIC_TENANT_ID=cliente-nuevo (ÚNICA POR CLIENTE)
NEXT_PUBLIC_COMPANY_NAME=Empresa Nueva (personalizada)
NEXT_PUBLIC_COMPANY_EMAIL=contacto@empresa-nueva.com (personalizada)
... (otros datos personalizados)
```

### 4. Desplegar

```bash
git push origin cliente-nuevo
```

Vercel deployará automáticamente.

## 🔒 Seguridad Multi-Tenant

### ⚠️ Crítico: Validación en Cada Query

**SIEMPRE** validar `tenant_id`:

```javascript
// ❌ MALO - Sin validación
export async function obtenerPedidos() {
  const { data } = await supabase
    .from('pedidos')
    .select('*');  // Trae datos de TODOS los tenants!
  return data;
}

// ✅ CORRECTO - Con validación
export async function obtenerPedidos() {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  const { data } = await supabase
    .from('pedidos')
    .select('*')
    .eq('tenant_id', tenantId);  // Filtra por tenant
  return data;
}
```

### Usar Row Level Security (RLS) en Supabase

Crear políticas de RLS para mayor seguridad:

```sql
-- Habilitar RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política: Cada tenant solo ve sus datos
CREATE POLICY "clientes pueden ver sus propios pedidos"
  ON pedidos
  FOR SELECT
  USING (tenant_id = current_user_id());

-- (En versiones futuras con auth real)
```

### Nunca Exponer tenant_id en URLs

```javascript
// ❌ MALO
<Link href={`/pedidos?tenant=${clientId}`}>

// ✅ CORRECTO
<Link href={`/pedidos`}>
// tenant_id viene de env vars, no de URL
```

## 📈 Escalabilidad

### Crecimiento de Clientes

| Clientes | Recomendación |
|----------|---------------|
| 1-10 | 1 BD Supabase shared |
| 10-100 | 1 BD Supabase + RLS activo |
| 100+ | Múltiples BDs Supabase |
| 1000+ | Arquitectura sharding |

### Base de Datos Compartida

```sql
-- Índices importantes para performance
CREATE INDEX idx_pedidos_tenant_fecha 
  ON pedidos(tenant_id, fecha_pedido DESC);

CREATE INDEX idx_clientes_tenant 
  ON clientes(tenant_id, estado);

CREATE INDEX idx_vendedores_tenant 
  ON vendedores(tenant_id, estado);
```

## 🎨 Personalización por Tenant

Cada cliente puede tener su propia personalización:

```env
# Cliente A
NEXT_PUBLIC_COMPANY_NAME=Empresa A S.A.
NEXT_PUBLIC_PRIMARY_COLOR=#FF5733
NEXT_PUBLIC_COMPANY_LOGO=https://...

# Cliente B
NEXT_PUBLIC_COMPANY_NAME=Empresa B Ltda.
NEXT_PUBLIC_PRIMARY_COLOR=#2196F3
NEXT_PUBLIC_COMPANY_LOGO=https://...
```

## 🔄 Migración de Clientes

Si un cliente quiere sus propios servidores:

1. **Exportar datos** (SQL dump)
2. **Crear BD independiente** con estructura idéntica
3. **Importar datos** filtrados por tenant_id
4. **Desplegar código** en servidor cliente

## 📞 Soporte Multi-Tenant

Para problemas específicos de un tenant:

```bash
# Ver datos de un cliente específico
SELECT * FROM pedidos 
WHERE tenant_id = 'cliente-problema' 
LIMIT 10;

# Auditoría
SELECT * FROM pedidos 
WHERE tenant_id = 'cliente-problema' 
ORDER BY fecha_pedido DESC;
```

## 🚀 Roadmap Multi-Tenant

- [ ] RLS (Row Level Security) activo
- [ ] Autenticación por tenant
- [ ] Webhooks por tenant
- [ ] Backups independientes
- [ ] Métricas por tenant
- [ ] API Pública por tenant

---

**Versión**: 1.0.0  
**Última actualización**: 2026-08-10  
**Autor**: Fabio Said
