# B2TRAC - Arquitectura SaaS Auto-Administrable

**Versión:** 1.1 SaaS  
**Modelo:** Signup → Demo → 30 Días Prueba → Pago Automático  
**Estado:** En Diseño de Implementación

---

## 🎯 Flujo de Usuario (Customer Journey)

```
┌─────────────────────────────────────────────────────────────────┐
│                     LANDING PAGE (b2trac.com)                   │
│  • Héroe con CTA "Comenzar Demo Gratuita"                      │
│  • Features overview                                             │
│  • Pricing plans                                                 │
│  • Testimonios/casos de éxito                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNUP / REGISTRO (1 minuto)                 │
│  • Email                                                         │
│  • Password                                                      │
│  • Nombre empresa                                                │
│  • Plan elegido (Startup/Professional/Enterprise)               │
│  • Método de pago (Tarjeta crédito) - OPCIONAL                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│               ONBOARDING AUTOMATIZADO (5 minutos)               │
│  • Crear ambiente de BD único (Supabase row policies)           │
│  • Setup de Storage buckets                                      │
│  • API keys configuradas                                         │
│  • Acceso a demo con datos ficticios                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DEMO INTERACTIVA (5-10 min)                   │
│  • Portal Vendedor: Crear pedido de prueba                      │
│  • Portal Cliente: Ver pedido creado                            │
│  • Subir foto/documento (Storage demo)                          │
│  • Descargar Excel                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              MINI-TUTORIAL INTERACTIVO (5 minutos)              │
│  • Overlay con pasos: "Ahora crea tu primer cliente"            │
│  • "Crea tu primer pedido"                                       │
│  • "Invita a un vendedor"                                        │
│  • Opción: "Omitir" o "Ver más videos"                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              AI ASSISTANT PARA CONFIGURACIÓN                    │
│  • Chat en vivo con IA para setup:                              │
│    - "¿Cuántos vendedores tienes?"                             │
│    - "¿Qué documentos requieres?"                               │
│    - "¿Deseas integrar con contabilidad?"                       │
│  • IA guía el setup basado en respuestas                        │
│  • Ofrece templates de clientes/vendedores                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              PRUEBA REAL: 30 DÍAS (Gratis/Ilimitado)           │
│  • Acceso completo a todas las features                         │
│  • Datos reales del cliente                                      │
│  • Soporte de IA 24/7                                            │
│  • Sin necesidad de tarjeta (hasta día 28)                      │
│  • Recordatorios por email (día 15, 25, 29)                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                              │
    CONVIERTE                      NO CONVIERTE
        │                              │
        ↓                              ↓
┌──────────────────┐        ┌──────────────────┐
│  PAGO AUTOMÁTICO │        │  OFERTA ESPECIAL │
│  (Día 31)        │        │  (Email: -50%)   │
│  • Cobrar tarjeta│        │  • Follow-up     │
│  • Email confirma│        │  • Encuesta      │
│  • Acceso sin fin│        │  • Reactivación  │
└──────────────────┘        └──────────────────┘
```

---

## 🏗️ Arquitectura Técnica

### Stack Requerido (Adicional a actual)

```
Frontend:
  • Next.js + React 18 (✓ ya existe)
  • Stripe.js para pagos
  • Auth0 o Supabase Auth (autenticación)
  • Crisp.ai o similar (Chat IA)

Backend:
  • Supabase (✓ ya existe)
  • Edge Functions (para webhooks de Stripe)
  • RLS (Row Level Security) por tenant
  • Triggers para crear ambientes

Pagos:
  • Stripe (pagos recurrentes)
  • Webhook para cambios de suscripción
  • Retry automático de pagos fallidos

IA:
  • OpenAI API (para asistente)
  • Embeddings para context window
  • Tools para guiar setup
```

---

## 📋 Componentes Principales

### 1. **Landing Page (b2trac.com)**

```jsx
// pages/index.js (público, sin autenticación)

Secciones:
├── Hero
│   ├── Headline: "Gestión de Ventas en Ruta sin Complicaciones"
│   ├── Subheading: "30 días gratis. Sin tarjeta."
│   └── CTA: "Comenzar Demo Gratuita"
├── Features (3 columnas)
│   ├── Portal Vendedor (icono)
│   ├── Portal Cliente (icono)
│   └── Reportes (icono)
├── Pricing
│   ├── Plan cards (Startup/Pro/Enterprise)
│   ├── Comparativa de features
│   └── CTA por plan
├── FAQ
├── Testimonios
└── Final CTA: "Comenzar Demo"
```

**Archivos nuevos:**
- `pages/landing.jsx` - Landing page pública
- `components/Hero.jsx`
- `components/Features.jsx`
- `components/Pricing.jsx`
- `components/FAQ.jsx`

---

### 2. **Autenticación (Auth)**

```jsx
// pages/auth/signup.jsx

Flujo:
1. Ingresa email
2. Ingresa password
3. Nombre empresa
4. Elige plan (UI con cards)
5. Email de confirmación
6. Redirige a onboarding

Base de datos (nueva tabla):
┌────────────────────────────────────┐
│  users (autenticación + metadata)  │
├────────────────────────────────────┤
│ id (UUID)                          │
│ email (UNIQUE)                     │
│ password_hash                      │
│ company_name                       │
│ plan (startup/pro/enterprise)      │
│ trial_ends_at (NOW + 30 days)      │
│ stripe_customer_id                 │
│ status (active/trial/paused)       │
│ created_at                         │
│ metadata (JSON)                    │
└────────────────────────────────────┘
```

**Archivos nuevos:**
- `pages/auth/signup.jsx`
- `pages/auth/login.jsx`
- `pages/auth/verify-email.jsx`
- `utils/auth.js` - Funciones de autenticación

---

### 3. **Onboarding Automatizado**

```jsx
// pages/onboarding/index.jsx

Pasos:
1. Crear tenant único (tenant_id)
2. Crear Storage buckets personalizados
3. Crear clientes demo (5 de ejemplo)
4. Crear vendedores demo (2 de ejemplo)
5. Crear pedidos demo (3 de ejemplo)
6. Generar API keys
7. Configurar RLS policies
8. Redirige a dashboard
```

**Archivos nuevos:**
- `pages/onboarding/index.jsx`
- `utils/onboarding.js`
  - `createTenant()`
  - `createStorageBuckets()`
  - `createDemoData()`
  - `setupRLSPolicies()`

---

### 4. **Mini-Tutorial Interactivo**

```jsx
// components/OnboardingTutorial.jsx

Componente:
- Overlay modal con "Coach"
- Pasos guiados (5 acciones)
- Botones: "Siguiente" / "Omitir"
- Progreso: "Paso 1/5"
- Videos opcionalmente incrustados

Pasos:
1. "Bienvenido a B2TRAC"
2. "Crea tu primer cliente"
3. "Añade un vendedor"
4. "Crea tu primer pedido"
5. "¡Felicidades! Ahora invita a tu equipo"
```

**Archivos nuevos:**
- `components/OnboardingTutorial.jsx`
- `utils/tutorial.js`

---

### 5. **AI Assistant para Configuración**

```jsx
// components/AIAssistant.jsx

Característica:
- Chat bubble flotante (abajo derecha)
- Disponible en todo el sitio
- Guía setup basado en respuestas
- Tiene acceso a context del usuario

Conversaciones Tipo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IA: "¡Hola! Soy tu asistente B2TRAC. 
     ¿Cuántos vendedores tienes en tu equipo?"

Usuario: "Tenemos 5 vendedores"

IA: "Perfecto. ¿Cuáles son los documentos 
    que necesitas para cada pedido?"

Usuario: "Factura, guía y foto"

IA: "Excelente. Voy a configurar eso para ti.
    ¿Deseas que cargue 5 vendedores de prueba
    para que practiques?"

Usuario: "Sí"

IA: "✓ Listo. Ve a 'Vendedores' y verás 5 vendedores
    de prueba. ¿Necesitas ayuda con algo más?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tools que el IA puede usar:
- create_customers(count)
- create_vendors(count)
- configure_document_types(types)
- create_sample_orders(count)
- schedule_training_call()
```

**Archivos nuevos:**
- `components/AIAssistant.jsx`
- `utils/ai-assistant.js`
- `pages/api/ai-assistant.js` (Edge Function)

---

### 6. **Dashboard (Post-Login)**

```jsx
// pages/dashboard/index.jsx

Información:
├── Estado de la suscripción
│   ├── Plan actual
│   ├── Días restantes (si trial)
│   ├── Próxima facturación
│   └── CTA: "Cambiar plan" / "Actualizar tarjeta"
├── Estadísticas rápidas
│   ├── Pedidos este mes
│   ├── Clientes registrados
│   ├── Vendedores activos
│   └── Ingresos (si sales module)
├── Acceso rápido
│   ├── "Ir a Portal Vendedor"
│   ├── "Ir a Portal Cliente"
│   └── "Configuración"
├── Últimas actividades
└── Próximos pasos sugeridos
```

**Archivos nuevos:**
- `pages/dashboard/index.jsx`

---

### 7. **Pagos (Integración Stripe)**

```jsx
// pages/billing/index.jsx

Funcionalidades:
├── Información de pago
│   ├── Tarjeta guardada
│   ├── Cambiar tarjeta
│   └── Método de facturación
├── Historial de facturas
│   ├── Descargar PDF
│   ├── Reenviar email
│   └── IVA/Impuestos
├── Planes y precios
│   ├── Cambiar plan (upgrade/downgrade)
│   └── Próxima facturación
├── Cancelación
│   ├── Motivo de cancelación (survey)
│   ├── Oferta de retención (-50%)
│   └── Datos guardados 30 días
└── Reintentos de pago fallidos
    ├── Automático cada 3 días
    ├── Email de aviso
    └── Account bloqueado si falla
```

**Flujo Stripe:**
```javascript
// En onboarding al day 28:
1. Crear Stripe customer ID
2. Agregar payment method
3. Crear subscription en Stripe

// Webhook Stripe (Edge Function):
stripe.webhook('customer.subscription.updated')
  → Actualizar plan en BD
  → Enviar email de confirmación

stripe.webhook('invoice.payment_failed')
  → Marcar cuenta como "payment_pending"
  → Enviar email con retry
  → Reintentar día 3 y 5
```

**Archivos nuevos:**
- `pages/billing/index.jsx`
- `pages/api/webhooks/stripe.js` (Edge Function)
- `utils/stripe.js`

---

### 8. **Recordatorios y Emails**

```
Timeline de Emails:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Día 0: "Bienvenido a B2TRAC - Comienza tu prueba"
      - Link a onboarding
      - Tutorial en video (5 min)
      - Chat IA disponible

Día 3: "Primeros pasos completados"
      - Resumen de lo configurado
      - Tips de uso
      - Chat IA disponible

Día 7: "¿Cómo va la prueba?"
      - Encuesta rápida
      - Casos de uso similares
      - Video: "5 tips avanzados"

Día 15: "50% de tu prueba completa"
      - Estadísticas de uso
      - Siguiente paso sugerido
      - Oferta especial si no usa

Día 25: "¡5 días para terminar tu prueba!"
      - Resumen ROI estimado
      - Planes y precios
      - "Continuar por solo $99"
      - Chat IA: "¿Preguntas antes de convertir?"

Día 28: "Actualizaciones de tarjeta necesaria"
      - Paso a paso para agregar tarjeta
      - "Sin preocupaciones, cancela en cualquier momento"

Día 31: (Automático) Cobro de tarjeta
      - Confirmación de pago
      - Acceso continuo
      - Bienvenida a comunidad

Día 31+ (Si no paga): "Tu acceso se ha suspendido"
      - Resumen de facturas
      - Reactivación en 1 click
      - Oferta: "Recupera con -50%"
```

**Archivos nuevos:**
- `utils/emails.js` - Plantillas
- `pages/api/cron/send-reminders.js` (Scheduled function)
- `pages/api/cron/process-subscriptions.js` (Scheduled function)

---

## 📊 Base de Datos Schema Ampliado

```sql
-- Tabla: users (autenticación + suscripción)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'startup', 'pro', 'enterprise'
  trial_ends_at TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50), -- 'trial', 'active', 'paused', 'canceled'
  trial_started_at TIMESTAMP,
  subscription_started_at TIMESTAMP,
  onboarded_at TIMESTAMP,
  tenant_id VARCHAR(50) UNIQUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: subscriptions (historial)
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50),
  status VARCHAR(50),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  reason_canceled VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: payments (historial de pagos)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  status VARCHAR(50), -- 'succeeded', 'failed', 'pending'
  invoice_number VARCHAR(50),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: usage_stats (para analytics)
CREATE TABLE usage_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  period_start DATE,
  period_end DATE,
  orders_created INT,
  orders_completed INT,
  customers_added INT,
  vendors_added INT,
  storage_used_mb INT,
  api_calls INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Pasos de Implementación

### **Fase 1: Core SaaS (2-3 semanas)**
- [ ] Setup Supabase Auth
- [ ] Crear landing page
- [ ] Signup flow automatizado
- [ ] Onboarding automatizado
- [ ] Mini-tutorial
- [ ] RLS policies por tenant
- [ ] Stripe integration básica

### **Fase 2: IA y Pagos (1-2 semanas)**
- [ ] AI Assistant (OpenAI)
- [ ] Webhooks Stripe
- [ ] Billing portal
- [ ] Manejo de errores de pago
- [ ] Email automation

### **Fase 3: Optimización (1 semana)**
- [ ] Analytics y tracking
- [ ] A/B testing de emails
- [ ] Optimización de conversión
- [ ] Documentación
- [ ] Bugfixes

### **Fase 4: Lanzamiento**
- [ ] Setup de dominio (b2trac.com)
- [ ] SSL/HTTPS
- [ ] CDN
- [ ] Monitoreo
- [ ] Soporte 24/7

---

## 💰 Pricing Finalizado

| Plan | Precio | Usuarios | Pedidos/mes | Storage | Soporte |
|------|--------|----------|------------|---------|---------|
| **Startup** | $99/mes | 3 | 100 | 1GB | Email |
| **Professional** | $299/mes | 10 | 500 | 10GB | Chat IA |
| **Enterprise** | $999/mes | Ilimitado | Ilimitado | 100GB | Dedicado |

**Trial:** 30 días gratis, acceso completo a todos los features.

---

## ✅ Checklist Implementación

- [ ] Landing page diseñada
- [ ] Autenticación (Supabase Auth)
- [ ] Signup flow
- [ ] Onboarding automático
- [ ] Mini-tutorial
- [ ] AI Assistant
- [ ] Stripe integration
- [ ] Webhooks
- [ ] Email automation
- [ ] Billing portal
- [ ] RLS por tenant
- [ ] Analytics
- [ ] Documentación
- [ ] Beta testing (5-10 usuarios)
- [ ] Lanzamiento oficial

---

## 🎯 Métricas de Éxito

| Métrica | Target |
|---------|--------|
| Signup to Demo Rate | >80% |
| Demo Completion | >60% |
| Trial to Paid | >25% |
| Churn Rate (MRR) | <5% |
| Customer LTV | >$2,500 |
| CAC | <$150 |
| NPS | >50 |

---

**Versión:** 1.1 SaaS  
**Última actualización:** 2026-08-10  
**Autor:** Fabio Said
