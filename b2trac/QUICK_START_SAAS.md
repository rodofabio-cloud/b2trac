# 🚀 B2TRAC SaaS - Quick Start (Iniciar Implementación YA)

**Para empezar hoy:** Sigue esta guía paso a paso para tener los primeros componentes SaaS en producción en 1 semana.

---

## 📋 Prerequisitos (15 minutos)

```bash
# 1. Cuentas necesarias (crear si no las tienes)
□ Supabase (supabase.com) - Gratis
□ Stripe (stripe.com) - Gratis para testing
□ OpenAI (openai.com) - API keys
□ SendGrid o similar (sendgrid.com) - Gratis para testing
□ Vercel (vercel.com) - Gratis para hosting

# 2. Instalar en tu máquina
npm install stripe
npm install @supabase/supabase-js
npm install openai
```

---

## 🎯 Fase 1: Setup Básico (Hoy - 1 hora)

### Paso 1: Configurar Supabase Auth

En Supabase dashboard:

```
1. Tu proyecto → Authentication → Providers
2. Habilitar Email
3. Habilitar Google OAuth (opcional)
4. Copiar API credentials

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Paso 2: Crear Landing Page Mínima

Archivo: `pages/landing.jsx`

```jsx
export default function Landing() {
  return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <h1>B2TRAC - Gestión de Ventas en Ruta</h1>
      <p>30 días gratis. Sin tarjeta.</p>
      <a href="/auth/signup">
        <button style={{
          backgroundColor: '#28a745',
          padding: '15px 30px',
          fontSize: '18px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Comenzar Demo Gratuita
        </button>
      </a>
    </div>
  );
}
```

Actualizar `pages/index.jsx`:
```jsx
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>B2TRAC</h1>
      <Link href="/landing">
        <button>Ver Landing</button>
      </Link>
      <Link href="/vendedor">
        <button>Portal Vendedor</button>
      </Link>
      <Link href="/cliente">
        <button>Portal Cliente</button>
      </Link>
    </div>
  );
}
```

### Paso 3: Crear Signup Simple

Archivo: `pages/auth/signup.jsx`

```jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    company_name: '',
    plan: 'startup'
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            company_name: form.company_name,
            plan: form.plan,
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      });

      if (authError) throw authError;

      // 2. Crear usuario en tabla users
      const tenantId = `tenant-${Date.now()}`;
      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: form.email,
          company_name: form.company_name,
          plan: form.plan,
          tenant_id: tenantId,
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'trial'
        }]);

      if (dbError) throw dbError;

      alert('¡Verifica tu email para confirmar!');
      router.push('/');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1>Crear Cuenta</h1>
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Nombre Empresa</label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Plan</label>
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="startup">Startup ($99/mes)</option>
            <option value="pro">Professional ($299/mes)</option>
            <option value="enterprise">Enterprise ($999/mes)</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            width: '100%',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}
```

---

## ⚙️ Fase 2: Base de Datos (Hoy - 30 minutos)

En Supabase SQL Editor:

```sql
-- Crear tabla users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'startup', 'pro', 'enterprise'
  tenant_id VARCHAR(50) UNIQUE NOT NULL,
  trial_ends_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'trial', -- 'trial', 'active', 'paused'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10, 2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_payments_user ON payments(user_id);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (simple versión)
CREATE POLICY "users_can_view_own" ON users
  FOR SELECT
  USING (auth.uid() = id);
```

---

## 🎬 Fase 3: Onboarding Básico (Mañana - 2 horas)

Archivo: `pages/onboarding/index.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Pasos de onboarding
      const steps = [
        { name: 'Crear ambiente', fn: createTenant },
        { name: 'Crear storage', fn: createStorage },
        { name: 'Cargar datos demo', fn: createDemoData },
        { name: 'Configurar seguridad', fn: setupRLS },
      ];

      for (let i = 0; i < steps.length; i++) {
        setProgress(((i + 1) / steps.length) * 100);
        await steps[i].fn(user.id);
      }

      setLoading(false);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Error en onboarding: ' + error.message);
    }
  };

  const createTenant = async (userId) => {
    // Ya creado en signup
    console.log('Tenant listo');
  };

  const createStorage = async (userId) => {
    // Storage buckets ya existen en Supabase
    console.log('Storage listo');
  };

  const createDemoData = async (userId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    // Crear 5 clientes de ejemplo
    await supabase
      .from('clientes')
      .insert([
        { nombre: 'Cliente Demo 1', empresa: 'Empresa 1', tenant_id: userData.tenant_id },
        { nombre: 'Cliente Demo 2', empresa: 'Empresa 2', tenant_id: userData.tenant_id },
        { nombre: 'Cliente Demo 3', empresa: 'Empresa 3', tenant_id: userData.tenant_id },
        { nombre: 'Cliente Demo 4', empresa: 'Empresa 4', tenant_id: userData.tenant_id },
        { nombre: 'Cliente Demo 5', empresa: 'Empresa 5', tenant_id: userData.tenant_id },
      ]);

    console.log('Demo data cargada');
  };

  const setupRLS = async (userId) => {
    console.log('RLS configurado');
  };

  return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <h1>Preparando tu ambiente...</h1>
      <div style={{
        width: '300px',
        height: '30px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        margin: '20px auto',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#28a745',
          transition: 'width 0.3s'
        }} />
      </div>
      <p>{Math.round(progress)}%</p>
      {!loading && <p>¡Listo! Redirigiendo...</p>}
    </div>
  );
}
```

---

## 📊 Fase 4: Dashboard Básico (Mañana - 1 hora)

Archivo: `pages/dashboard/index.jsx`

```jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    setUser(userData);

    // Calcular días restantes
    const trialEnds = new Date(userData.trial_ends_at);
    const today = new Date();
    const daysLeft = Math.ceil((trialEnds - today) / (1000 * 60 * 60 * 24));
    setDaysLeft(daysLeft);
  };

  if (!user) return <div>Cargando...</div>;

  return (
    <div style={{ padding: '30px' }}>
      <h1>Bienvenido, {user.company_name}</h1>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '5px',
        marginBottom: '30px'
      }}>
        <h3>Plan: {user.plan}</h3>
        <p style={{ fontSize: '18px', color: '#28a745' }}>
          Días restantes de prueba: <strong>{daysLeft}</strong>
        </p>
        {daysLeft <= 7 && (
          <p style={{ color: '#dc3545' }}>
            ⚠️ Tu prueba está por terminar. Agrega tu tarjeta.
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <a href="/vendedor">
          <button style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            👨‍💼 Portal Vendedor
          </button>
        </a>

        <a href="/cliente">
          <button style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            📦 Portal Cliente
          </button>
        </a>
      </div>
    </div>
  );
}
```

---

## 🔑 Configurar .env.local

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe (testing keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# OpenAI
OPENAI_API_KEY=sk-...

# Email
SENDGRID_API_KEY=SG....
```

---

## ✅ Testing (Hoy - 30 minutos)

Pasos de prueba:

```
1. npm run dev
2. Ir a http://localhost:3000/landing
3. Click "Comenzar Demo Gratuita"
4. Llenar formulario:
   - Email: test@example.com
   - Password: Test123!
   - Empresa: Mi Empresa
   - Plan: Startup
5. Click "Registrarse"
6. Verificar en Supabase:
   - Usuario creado en auth
   - Registro en tabla users
   - tenant_id generado
7. Confirmación de email
8. Login
9. Redirige a onboarding
10. Onboarding completa (progreso bar)
11. Dashboard muestra información
12. Acceso a portales funciona
```

---

## 🚀 Próximos (Esta Semana)

- [ ] Email confirmación funciona
- [ ] Página de login funciona
- [ ] Dashboard muestra datos correctamente
- [ ] Protección de rutas (requireAuth middleware)
- [ ] Tutorial interactivo (5 pasos)
- [ ] AI Assistant básico (responde en chat)

---

## 📞 Troubleshooting

**Error: "Unauthorized"**
→ Verificar NEXT_PUBLIC_SUPABASE_URL y ANON_KEY

**Error: "Tabla no existe"**
→ Ejecutar SQL en Supabase

**Supabase Auth no envia email**
→ Verificar SMTP settings en Supabase dashboard

**Usuario se ve en otros tenants**
→ Verificar RLS policies (deben filtrar por tenant_id)

---

## 📊 Métricas Básicas

Agregar esto a `utils/analytics.js`:

```javascript
export function track(event, properties = {}) {
  console.log(`[ANALYTICS] ${event}`, properties);
  
  // En producción: enviar a Mixpanel, Segment, etc
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify({ event, properties })
  // });
}
```

Usar en signup:
```javascript
import { track } from '@/utils/analytics';

track('signup_started', { plan: form.plan });
// ... después de éxito:
track('signup_completed', { plan: form.plan, email: form.email });
```

---

## ✨ Timeline Optimista

```
HOY:           Landing + Signup + BD
MAÑANA:        Onboarding + Dashboard
PRÓXIMOS 2D:   Tutorial + AI Assistant
PRÓXIMA SEM:   Stripe integration
PRÓXIMAS 2SEM: Emails automáticos
```

---

**¿Listo para empezar?**

Comienza por el Paso 1 de Fase 1. Toma 15 minutos.  
Luego, ejecuta `npm run dev` y prueba el flujo completo.

**Documentación:** Lee SAAS_ARCHITECTURE.md para entender el flujo completo.  
**Roadmap:** Ve IMPLEMENTATION_ROADMAP.md para timeline detallado.

¡Vamos! 🚀
