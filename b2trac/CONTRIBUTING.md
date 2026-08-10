# Guía de Contribución - B2TRAC

Gracias por tu interés en contribuir a B2TRAC. Este documento describe cómo trabajar con el proyecto.

## 📋 Requisitos

- Node.js 18+
- Git
- Cuenta Supabase (para pruebas)
- Familiaridad con Next.js y React

## 🚀 Configuración para Desarrollo

### 1. Clonar y Configurar

```bash
git clone https://github.com/rodofabio-cloud/b2trac.git
cd b2trac
npm install
```

### 2. Crear rama de desarrollo

```bash
git checkout -b feature/tu-feature
# o
git checkout -b fix/tu-fix
```

### 3. Configurar .env.local

Copia `.env.example` a `.env.local` y completa valores.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

## 📝 Estándares de Código

### Nombres de Archivos

- **Componentes**: PascalCase (ej: `ClientPortal.jsx`)
- **Utilidades**: camelCase (ej: `supabaseClient.js`)
- **Páginas**: camelCase (ej: `nuevo.jsx`)

### Estructura de Componentes

```javascript
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { obtenerDatos } from '../utils/supabase';

export default function ComponentName() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const data = await obtenerDatos();
      setState(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* JSX aquí */}
    </div>
  );
}
```

### Funciones Supabase

```javascript
// Siempre incluir manejo de errores
export async function crearRecurso(datos) {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'default';
  
  const { data, error } = await supabase
    .from('tabla')
    .insert([{ ...datos, tenant_id: tenantId }])
    .select();
  
  if (error) throw error;
  return data;
}
```

### Comentarios

- Usar comentarios solo cuando sea necesario
- Explicar el "por qué", no el "qué"
- Nombres de variables/funciones claros y descriptivos

```javascript
// ✅ Bueno
const isOrderDelivered = order.estado === 'entregado';

// ❌ Malo
const x = order.estado === 'entregado'; // Verificar si está entregado
```

## 🔄 Flujo de Contribución

### 1. Crear Rama

```bash
# Feature
git checkout -b feature/nueva-funcionalidad

# Fix
git checkout -b fix/bug-a-arreglar

# Docs
git checkout -b docs/mejora-documentacion
```

### 2. Hacer Cambios

Editar archivos y hacer commits significativos:

```bash
git add .
git commit -m "feat: agregar nueva funcionalidad"
```

### 3. Tipos de Commits

```
feat:     Nueva funcionalidad
fix:      Arreglo de bug
docs:     Cambios en documentación
style:    Cambios de formato (sin lógica)
refactor: Refactorización
test:     Agregar o mejorar tests
chore:    Cambios en build/deps
```

### 4. Push y Pull Request

```bash
git push origin feature/tu-feature
```

Luego crear un Pull Request en GitHub con:
- Descripción clara del cambio
- Razón del cambio
- Testing realizado
- Screenshots (si aplica)

## 🧪 Testing

### Verificaciones Manuales

Antes de hacer PR:

```bash
# 1. Verificar que compila
npm run build

# 2. Ejecutar en desarrollo
npm run dev

# 3. Probar funcionalidad afectada
# - Portal Vendedor
# - Portal Cliente
# - Crear Pedido
# - Descargar archivos

# 4. Probar en diferentes navegadores
# - Chrome
# - Firefox
# - Safari
```

### Responsiva

Probar en diferentes tamaños:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x812)

## 🚨 Cosas Críticas

### ⚠️ NUNCA

- Subir `.env.local` o variables sensibles
- Hacer cambios sin probar localmente
- Commitear código con console.log()
- Usar variables globales
- Hardcodear valores que deberían ser env vars

### ✅ SIEMPRE

- Validar tenant_id en queries Supabase
- Manejar errores con try/catch
- Usar variables de entorno para config
- Probar en desarrollo antes de PR
- Mantener backwards compatibility

## 📚 Documentación

Si tu contribución afecta funcionalidad:

1. Actualiza README.md
2. Agrega ejemplos si es necesario
3. Documenta nuevas variables env en .env.example
4. Actualiza CHANGELOG.md

## 🐛 Reportar Bugs

Crear un issue con:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Ambiente (navegador, OS, versión)
- Screenshots/logs si disponible

## 💡 Sugerir Features

Crear un issue con:
- Descripción de la feature
- Caso de uso/problema que resuelve
- Posible implementación (opcional)
- Prioridad (alta/media/baja)

## 📞 Preguntas?

Contactar a: rodofabio@gmail.com

---

**Gracias por contribuir a B2TRAC!** 🙌

