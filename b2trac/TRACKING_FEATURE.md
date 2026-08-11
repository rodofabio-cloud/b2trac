# 📍 B2TRAC - Feature de Rastreo de Vendedores

**Versión:** 1.0  
**Estado:** Implementado (Básico)  
**Próximas fases:** Integración GPS, Rutas en tiempo real, Optimización

---

## 🎯 ¿Qué es el Rastreo?

Módulo que permite ver en **tiempo real**:
- **Ubicación actual** de cada vendedor en mapa
- **Próximo cliente** a visitar (ruta planificada)
- **Distancia** al próximo cliente
- **Estado del vendedor** (En ruta, En cliente, En almacén, Offline)
- **Historial de visitas** hoy

---

## 📍 Acceso

**URL:** `/vendedor/tracking`

**Botón:** En Portal Vendedor hay botón rojo "📍 Rastreo de Vendedores"

---

## 🎨 Interfaz

### Panel Izquierdo (Resumen de Vendedores)

```
┌─────────────────────────────────┐
│ 📍 Vendedores en Ruta (5)        │
├─────────────────────────────────┤
│ 1. Juan Pérez                   │
│    juan@empresa.com             │
│    🟡 En Ruta                   │
│                                  │
│    📍 Ubicación:                │
│    Centro, Santiago             │
│    (-33.8688, -151.2093)        │
│                                  │
│    🎯 Próximo: Supermercado     │
│    Jumbo Providencia            │
│    2.3 km                       │
│                                  │
│    📋 Pedidos hoy: 5            │
│    🕐 14:32                     │
│                                  │
├─────────────────────────────────┤
│ 2. María González               │
│    [similar...]                 │
│                                  │
│ 3. Carlos López                 │
│    [similar...]                 │
└─────────────────────────────────┘
```

### Panel Derecho (Mapa)

```
┌─────────────────────────────────────────────┐
│                                              │
│          🗺️ MAPA CON VENDEDORES              │
│                                              │
│    ●1 ●2 ●3 ●4 ●5                         │
│                                              │
│         (Marcadores interactivos)            │
│                                              │
│    Leyenda:                                 │
│    ● En Ruta       (Amarillo)               │
│    ● En Cliente    (Verde)                  │
│    ● En Almacén    (Gris)                   │
│    ● Offline       (Rojo)                   │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 📊 Estados de Vendedores

| Estado | Color | Significado |
|--------|-------|------------|
| 🟡 En Ruta | Amarillo | Viajando al próximo cliente |
| 🟢 En Cliente | Verde | Visitando un cliente |
| ⚫ En Almacén | Gris | En bodega/oficina |
| 🔴 Offline | Rojo | Sin conexión/inactivo |

---

## 🗺️ Información del Mapa

### Características Actuales
- ✅ Marcadores de vendedores (números 1-5)
- ✅ Información al pasar mouse (nombre)
- ✅ Zoom interactivo
- ✅ Leyenda de colores

### Próximas Fases
- ⏳ Integración Google Maps API (requiere API key)
- ⏳ Rutas en polylines (línea que conecta clientes)
- ⏳ Optimización de rutas automática
- ⏳ Heat maps de actividad
- ⏳ Historial de movimientos

---

## 💾 Estructura de Datos

### Tabla: `vendedores` (Ampliada)

```sql
ALTER TABLE vendedores ADD COLUMN (
  estado VARCHAR(50) DEFAULT 'almacen', -- 'en_ruta', 'en_cliente', 'almacen', 'offline'
  ubicacion_actual JSONB, -- {lat, lng, address, timestamp}
  ruta_planificada JSONB, -- [{cliente, lat, lng}, ...]
  pedidos_hoy INT DEFAULT 0,
  ultima_actualizacion TIMESTAMP
);
```

**Ejemplo de dato:**
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "email": "juan@empresa.com",
  "estado": "en_ruta",
  "ubicacion_actual": {
    "lat": -33.8688,
    "lng": -151.2093,
    "address": "Centro, Santiago",
    "timestamp": "2026-08-10T14:32:00Z"
  },
  "ruta_planificada": [
    {
      "cliente": "Supermercado Jumbo Providencia",
      "lat": -33.8989,
      "lng": -151.2093
    },
    {
      "cliente": "Multitienda La Florida",
      "lat": -33.4069,
      "lng": -151.2093
    }
  ],
  "pedidos_hoy": 5,
  "ultima_actualizacion": "2026-08-10T14:32:00Z"
}
```

### Tabla: `rutas_diarias` (Nueva - Opcional)

```sql
CREATE TABLE rutas_diarias (
  id SERIAL PRIMARY KEY,
  vendedor_id INTEGER REFERENCES vendedores(id),
  fecha DATE,
  cliente_id INTEGER REFERENCES clientes(id),
  orden INT, -- Orden en la ruta
  completado BOOLEAN DEFAULT FALSE,
  hora_visita TIMESTAMP,
  tenant_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ Funciones Disponibles

### `obtenerVendedoresConLocalizacion()`
Obtiene todos los vendedores con ubicación actual y ruta planificada.

```javascript
import { obtenerVendedoresConLocalizacion } from '@/utils/tracking';

const vendedores = await obtenerVendedoresConLocalizacion();
// Retorna array con ubicaciones en tiempo real
```

### `actualizarUbicacionVendedor(vendedorId, ubicacion)`
Actualiza la ubicación de un vendedor (llamado desde app móvil con GPS).

```javascript
import { actualizarUbicacionVendedor } from '@/utils/tracking';

await actualizarUbicacionVendedor(1, {
  latitude: -33.8688,
  longitude: -151.2093,
  address: 'Centro, Santiago'
});
```

### `calcularDistancia(lat1, lon1, lat2, lon2)`
Calcula distancia entre dos puntos usando Haversine formula.

```javascript
import { calcularDistancia } from '@/utils/tracking';

const km = calcularDistancia(
  -33.8688, -151.2093, // Ubicación actual
  -33.8989, -151.2093  // Próximo cliente
);
// Retorna: 3.2 (km)
```

---

## 🔌 Integración Google Maps (Próximas Fases)

### Paso 1: Obtener API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo
3. Habilita "Maps JavaScript API"
4. Crea una credencial (API Key)
5. Agrega a `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...
```

### Paso 2: Implementación

```jsx
import { GoogleMap, MarkerF } from '@react-google-maps/api';

export function MapWithMarkers({ vendedores }) {
  return (
    <GoogleMap
      center={{ lat: -33.8688, lng: -151.2093 }}
      zoom={12}
    >
      {vendedores.map(v => (
        <MarkerF
          key={v.id}
          position={{ lat: v.ubicacion_actual.lat, lng: v.ubicacion_actual.lng }}
          title={v.nombre}
        />
      ))}
    </GoogleMap>
  );
}
```

---

## 📡 Actualización en Tiempo Real

### Opción 1: Polling (Actual)
Actualiza cada 30 segundos.

```javascript
useEffect(() => {
  cargarVendedores();
  const interval = setInterval(cargarVendedores, 30000); // 30 seg
  return () => clearInterval(interval);
}, []);
```

### Opción 2: WebSocket (Próxima Fase)
Actualización instantánea.

```javascript
// Escuchar cambios en Supabase en tiempo real
const subscription = supabase
  .from('vendedores')
  .on('*', payload => {
    console.log('Vendedor actualizado:', payload);
  })
  .subscribe();
```

### Opción 3: Firebase Realtime (Alternativa)
Para máxima velocidad en tiempo real.

---

## 📱 App Móvil (Futuro)

### Funcionalidad Esperada

```javascript
// Capturar ubicación GPS cada 5 minutos
if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(position => {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Enviar al servidor
    await actualizarUbicacionVendedor(vendedorId, {
      latitude,
      longitude,
      accuracy
    });
  }, error => {
    console.error('Error GPS:', error);
  }, {
    maximumAge: 10000, // 10 seg
    timeout: 5000
  });
}
```

---

## 🎯 Casos de Uso

### 1. Supervisor Controlando Vendedores
- Abre `/vendedor/tracking`
- Ve dónde está cada vendedor
- Verifica si está visitando clientes
- Puede replanificar ruta si es necesario

### 2. Optimización de Rutas
- Sistema automático sugiere mejor orden de clientes
- Minimiza distancia total del día
- Maximiza pedidos por vendedor

### 3. Alertas de Desvío
- Si vendedor se desvía de ruta → Alerta
- Si vendedor permanece demasiado tiempo en lugar → Notificación
- Si está offline > 1 hora → Alert

### 4. Análisis de Productividad
- Cuántos clientes visitó
- Distancia total recorrida
- Tiempo dedicado por cliente
- Promedio de pedidos por hora

---

## 📊 Métricas Capturadas

```javascript
{
  vendedor_id: 1,
  fecha: "2026-08-10",
  
  // Ubicación
  ubicacion_inicial: { lat, lng },
  ubicacion_final: { lat, lng },
  
  // Movimiento
  distancia_total_km: 24.5,
  tiempo_conduccion: "45 min",
  paradas: 5,
  
  // Productividad
  clientes_visitados: 5,
  pedidos_creados: 8,
  documentos_subidos: 8,
  promedio_pedidos_por_cliente: 1.6,
  
  // Eficiencia
  pedidos_por_km: 0.33,
  tiempo_por_cliente_min: 18,
  
  // Horario
  hora_inicio: "08:00",
  hora_fin: "17:30",
  tiempo_total_horas: 9.5,
  tiempo_activo_horas: 8.2 // (sin descansos)
}
```

---

## 🔐 Privacidad y Seguridad

- ✅ Solo administradores ven ubicaciones
- ✅ Historial guardado 30 días
- ✅ GPS datos encriptados
- ✅ RLS policies por tenant
- ✅ Consentimiento del vendedor requerido

---

## 🚀 Roadmap Tracking

### Fase 1: Básica ✅
- [x] Panel de vendedores con ubicación
- [x] Mapa estático (placeholder)
- [x] Próximo cliente información
- [x] Distancia calculada
- [x] Actualización cada 30 seg

### Fase 2: Google Maps (2 semanas)
- [ ] Integración Google Maps API
- [ ] Marcadores en mapa real
- [ ] Rutas en polylines
- [ ] Información de tráfico

### Fase 3: GPS Real (3 semanas)
- [ ] App móvil con GPS
- [ ] Captura automática cada 5 min
- [ ] WebSocket para tiempo real
- [ ] Historial de movimientos

### Fase 4: Optimización (4 semanas)
- [ ] Algoritmo de optimización de rutas
- [ ] Alertas automáticas
- [ ] Dashboard de analítica
- [ ] Reportes de productividad

### Fase 5: Avanzado (Futuro)
- [ ] Heat maps
- [ ] Predicción de tiempos
- [ ] Integración con delivery
- [ ] Machine learning

---

## 📝 Notas de Desarrollo

### Para Agregar Google Maps

1. Instalar dependencias:
```bash
npm install @react-google-maps/api
```

2. Reemplazar `MapContainer` en `pages/vendedor/tracking.jsx`

3. Obtener API key en Google Cloud

### Para Capturar GPS en App Móvil

1. Usar Capacitor o React Native
2. Llamar `actualizarUbicacionVendedor()` cada 5 minutos
3. Enviar también accuracy/speed

### Para WebSocket

1. Usar Supabase Realtime
2. Escuchar cambios en tabla `vendedores`
3. Actualizar UI sin refresh

---

**Versión:** 1.0 - Básica  
**Próxima Actualización:** Google Maps + GPS  
**Autor:** Fabio Said
