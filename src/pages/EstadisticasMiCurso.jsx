import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EstadisticasMiCurso() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario');
    const usuarioData = usuarioStr ? JSON.parse(usuarioStr) : null;
    setUsuario(usuarioData);
  }, []);

  useEffect(() => {
    if (!usuario?.colegio_id || !usuario?.salon_id) {
      setLoading(false);
      return;
    }

    const cargarStats = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');

        const response = await fetch(
          'http://localhost/reciclaje-app/backend/api/estadisticas_curso_por_reto.php',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success && data.data) {
          setStats(data.data);
        } else {
          setStats(null);
        }
      } catch (error) {
        console.error('Error al cargar estadísticas del curso:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    cargarStats();
  }, [usuario]);

  const renderPosicion = (posicion) => {
    if (!posicion) return '—';
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return `#${posicion}`;
  };

  if (!usuario) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>⚠️ No hay sesión activa</h2>
        <p>Inicia sesión para ver las estadísticas de tu curso.</p>
      </div>
    );
  }

 return (
  <div style={{ padding: '2rem' }} className="estadisticas-fade-in">
    <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
      📊 Estadísticas de mi curso
    </h1>

    {loading && (
      <p style={{ textAlign: 'center' }}>Cargando estadísticas...</p>
    )}

    {!loading && !stats && (
      <p style={{ textAlign: 'center' }}>
        No hay datos disponibles para tu curso.
      </p>
    )}

    {!loading && stats && (
      <>
        {/* Tarjetas por reto */}
        <h2 style={{ marginBottom: '1rem' }}>🏆 Desempeño por reto</h2>

        {stats.retos.length === 0 && (
          <p style={{ textAlign: 'center' }}>
            Aún no hay retos registrados para tu colegio.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {stats.retos.map((reto) => {
            const participo = reto.kilos_en_reto > 0;

            return (
              <div
                key={reto.reto_id}
                className="reto-card"
              >
                <h3>{reto.nombre_reto}</h3>

                {participo ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '14px',
                    }}
                  >
                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Tu posición
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '18px' }}>
                        {renderPosicion(reto.posicion_en_reto)}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Puntos
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '18px' }}>
                        {reto.puntos_en_reto.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Kilos
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '18px' }}>
                        {reto.kilos_en_reto.toFixed(2)} kg
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 0',
                    }}
                  >
                    <div style={{ fontSize: '36px' }}>😢</div>
                    <div style={{ color: '#777', fontSize: '14px' }}>
                      Tu salón no participó en este reto
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tarjeta resumen general (abajo, centrada) */}
        <div className="resumen-card" style={{ maxWidth: 500, margin: '0 auto 2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '18px' }}>
            📈 Resumen general de tu curso
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                Kilos totales
              </div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>
                {stats.resumen.kilos_totales.toFixed(2)} kg
              </div>
            </div>

            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                Puntos totales
              </div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>
                {stats.resumen.puntos_totales.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                Posición actual
              </div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>
                {renderPosicion(stats.resumen.posicion_actual)}
              </div>
            </div>
          </div>
        </div>
      </>
    )}

    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <button
        className="action-btn"
        onClick={() => navigate('/dashboard')}
        style={{ padding: '10px 20px', fontSize: '14px' }}
      >
        ⬅ Volver al dashboard
      </button>
    </div>
  </div>
);
}

export default EstadisticasMiCurso;