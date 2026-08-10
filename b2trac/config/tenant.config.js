// Configuración por tenant/cliente
// Este archivo contiene la configuración de branding y personalizacion

export const getTenantConfig = () => {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'default';

  const config = {
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'B2TRAC',
      version: '1.0.0',
      description: 'CRM de ventas en ruta',
    },
    company: {
      name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'B2TRAC',
      rut: process.env.NEXT_PUBLIC_COMPANY_RUT || 'XX.XXX.XXX-X',
      email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'contacto@b2trac.com',
      phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '+56 2 XXXX XXXX',
      website: process.env.NEXT_PUBLIC_COMPANY_WEBSITE || 'www.b2trac.com',
      address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Santiago, Chile',
    },
    theme: {
      primary: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#007bff',
      success: process.env.NEXT_PUBLIC_SUCCESS_COLOR || '#28a745',
      warning: process.env.NEXT_PUBLIC_WARNING_COLOR || '#ffc107',
      danger: process.env.NEXT_PUBLIC_DANGER_COLOR || '#dc3545',
      secondary: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#6c757d',
      info: process.env.NEXT_PUBLIC_INFO_COLOR || '#17a2b8',
    },
    portals: {
      vendedor: {
        name: 'Portal Vendedor',
        icon: '👨‍💼',
        description: 'Gestión de ventas y pedidos',
      },
      cliente: {
        name: 'Portal Cliente',
        icon: '📦',
        description: 'Seguimiento de pedidos y descargas',
      },
    },
    features: {
      allowFileUpload: true,
      allowExcelDownload: true,
      allowPdfGeneration: false,
      multiLanguage: false,
      darkMode: false,
    },
    tenantId,
  };

  return config;
};

// Exportar como constante para uso directo
export const TENANT_CONFIG = getTenantConfig();
