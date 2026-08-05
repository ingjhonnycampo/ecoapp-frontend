import React, { useEffect, useState } from 'react';
import RankingColegio from './RankingColegio';

 function Ranking() { 
  const [usuario, setUsuario] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener usuario logueado (ajusta según tu forma de auth)
  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    if (!usuarioStr || !token) {
      setUsuario(null);
      return;
    }

    const usuarioData = JSON.parse(usuarioStr);
    setUsuario(usuarioData);
  }, []);

  // Cargar ranking cuando tengamos usuario (el coordinador usa su propia vista enriquecida)
  useEffect(() => {
    if (!usuario?.colegio_id || usuario.rol === 'coordinador') {
      setLoading(false);
      return;
    }

    const cargarRanking = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/ranking_historico_colegio.php?colegio_id=${usuario.colegio_id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setRanking(data.data);
        } else {
          setRanking([]);
        }
      } catch (error) {
        console.error('Error al cargar ranking:', error);
        setRanking([]);
      } finally {
        setLoading(false);
      }
    };

    cargarRanking();
  }, [usuario?.colegio_id, usuario?.rol]);

  if (!usuario) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>⚠️ No hay sesión activa</h2>
        <p>Inicia sesión para ver el ranking.</p>
      </div>
    );
  }

  if (usuario.rol === 'coordinador') {
    return <RankingColegio />;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>
        {usuario.rol === 'estudiante'
          ? '🏆 Ranking de tu colegio'
          : '🏆 Ranking general'}
      </h1>

      {loading && <p>Cargando ranking...</p>}

      {!loading && ranking.length === 0 && (
        <p>No hay datos de ranking disponibles.</p>
      )}

      {!loading && ranking.length > 0 && (
        <div className="tabla-ranking">
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Curso</th>
                <th>Kilos</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((fila) => {
                const esMiCurso =
                  usuario.rol === 'estudiante' &&
                  usuario.salon_id &&
                  Number(fila.salon_id) === Number(usuario.salon_id);


                  const renderPosicion = (posicion) => {
  if (posicion === 1) return '🥇';
  if (posicion === 2) return '🥈';
  if (posicion === 3) return '🥉';
  return posicion;
 };
                return (

<tr
  key={fila.salon_id}
  className={esMiCurso ? 'fila-mi-curso' : ''}
  style={
    esMiCurso
      ? {
          backgroundColor: '#e8f5e9',
          fontWeight: 'bold',
          borderLeft: '4px solid #26cf2c',
        }
      : {}
  }
>
  <td>{renderPosicion(fila.posicion)}</td>
  <td>
    {fila.grado_nombre} {fila.salon_nombre}
  </td>
  <td>{fila.kilos} kg</td>
  <td>{fila.puntos_totales}</td>
</tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Ranking;