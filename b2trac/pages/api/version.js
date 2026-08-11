export default function handler(req, res) {
  res.status(200).json({
    name: 'B2TRAC',
    version: '1.0.0',
    status: 'running',
    features: ['vendedor', 'cliente', 'tracking', 'dashboard'],
    message: 'B2TRAC SaaS - Sistema de Gestión de Ventas en Ruta'
  });
}
