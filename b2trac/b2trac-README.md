# B2TRAC - CRM para Vendedores ICLA

## Instalación Rápida

### 1. Descargar los archivos

He creado los siguientes archivos para b2trac. Descárgalos y organízalos así:

```
b2trac/
├── package.json
├── next.config.js (crear vacío)
├── .env.local (crear con variables)
├── pages/
│   ├── _app.jsx (renombrar app.jsx)
│   ├── index.jsx
│   └── pedidos/
│       └── nuevo.jsx
├── utils/
│   └── supabase.js
├── styles/
│   └── globals.css
├── public/
└── .gitignore (crear)
```

### 2. Crear archivos faltantes

**next.config.js** (vacío):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
```

**.env.local** (en la raíz):
```
NEXT_PUBLIC_SUPABASE_URL=https://zjsfwIsdqmpggIyhIfcx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**.gitignore**:
```
node_modules/
.next/
.env.local
.env*.local
```

### 3. Subir a GitHub

```bash
# En tu PC, en la carpeta b2trac:
cd b2trac

# Inicializar git
git init

# Agregar archivos
git add .

# Commit
git commit -m "Initial B2TRAC setup with Supabase"

# Agregar remote
git remote add origin https://github.com/rodofabio-cloud/b2trac.git

# Push a main
git branch -M main
git push -u origin main
```

### 4. Vercel se deployará automáticamente

Una vez hagas push a GitHub, Vercel:
- Detectará los cambios
- Instalará dependencias
- Compilará la app
- Deployará automáticamente en: https://b2trac.vercel.app

## Funcionalidades

✅ Dashboard con pedidos
✅ Crear nuevo pedido
✅ Upload de fotos
✅ Upload de PDF (facturas y guías)
✅ Gestión de clientes desde Supabase
✅ Storage en Supabase (fotos en bucket "fotos", PDFs en "documentos")

## Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL       # URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Clave anon de Supabase
```

Ya las agregaste a Vercel, así que automáticamente funcionarán.

## Próximos pasos

1. Descarga todos los archivos
2. Organiza la estructura
3. Crea los archivos faltantes
4. Sube a GitHub
5. Vercel deployará automáticamente

¿Preguntas? Pregunta en el chat.
