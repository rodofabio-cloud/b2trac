import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>🚀 B2TRAC</h1>
        <p style={{ color: '#666', marginBottom: '40px', fontSize: '14px' }}>
          Sistema integrado de gestión de ventas
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <Link href="/vendedor">
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              👨‍💼 Portal Vendedor
            </button>
          </Link>

          <Link href="/cliente">
            <button style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              📦 Portal Cliente
            </button>
          </Link>

          <Link href="/vendedor/tracking">
            <button style={{
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              📍 Rastreo de Vendedores
            </button>
          </Link>

        </div>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <Link href="/dashboard">
            <button style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%'
            }}>
              📊 Ver Dashboard
            </button>
          </Link>
          <p style={{
            color: '#999',
            fontSize: '12px',
            margin: '10px 0 0 0'
          }}>
            B2TRAC v1.0 | Gestión de Distribución
          </p>
        </div>
      </div>
    </div>
  );
}
