import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import WelcomeLoader from '../components/WelcomeLoader';
import { useNavigate } from 'react-router-dom';
import { estadisticasAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { usuario, colegio } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showLoader, setShowLoader] = useState(true);
  const [totalColegios, setTotalColegios] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loadingColegios, setLoadingColegios] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [statsGlobal, setStatsGlobal] = useState({
    kilosTotales: 0,
    promedioPorColegio: 0,
    topColegios: [],
  });
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [statsCurso, setStatsCurso] = useState(null);
  const [loadingCurso, setLoadingCurso] = useState(false);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [rankingColegio, setRankingColegio] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [statsCoordinador, setStatsCoordinador] = useState(null);
  const [loadingCoordinador, setLoadingCoordinador] = useState(false);
  const cargarTotalColegios = async () => {
    try {
      const response = await fetch(
        '${import.meta.env.VITE_API_BASE_URL}/contar_colegios.php'
      );
      const data = await response.json();

      if (data.success) {
        setTotalColegios(data.total);
      }
    } catch (error) {
      console.error('Error al cargar total de colegios:', error);
    } finally {
      setLoadingColegios(false);
    }
  };

const cargarRankingColegio = async () => {
  try {
    setLoadingRanking(true);

    const token = localStorage.getItem('token');

    if (!usuario?.colegio_id) {
      console.warn('Estudiante sin colegio_id');
      setRankingColegio([]);
      return;
    }

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
      setRankingColegio(data.data);
    } else {
      setRankingColegio([]);
    }
  } catch (error) {
    console.error('Error al cargar ranking del colegio:', error);
    setRankingColegio([]);
  } finally {
    setLoadingRanking(false);
  }
};

const toggleRanking = () => {
  if (!mostrarRanking) {
    cargarRankingColegio();
  }
  setMostrarRanking(prev => !prev);
};


  const cargarTotalUsuarios = async () => {
    try {
      const response = await fetch(
        '${import.meta.env.VITE_API_BASE_URL}/contar_usuarios.php'
      );
      const data = await response.json();

      if (data.success) {
        setTotalUsuarios(data.total);
      }
    } catch (error) {
      console.error('Error al cargar total de usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };


  const cargarStatsCurso = async () => {
  try {
    setLoadingCurso(true);

    const token = localStorage.getItem('token');

    const response = await fetch(
      '${import.meta.env.VITE_API_BASE_URL}/dashboard_curso_estudiante.php',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log('dashboard_curso_estudiante ->', data);

    if (!data.success || !data.data) {
      console.warn('dashboard_curso_estudiante no devolvió datos válidos');
      setStatsCurso(null);
      return;
    }

    // data.data ya tiene:
    // nombre_curso, puntos_curso, kilos_curso, posicion_curso_en_colegio,
    // meta_mensual_kilos, kilos_mes_curso
    setStatsCurso(data.data);
  } catch (error) {
    console.error(
      'Error al cargar stats del curso desde dashboard_curso_estudiante:',
      error
    );
    setStatsCurso(null);
  } finally {
    setLoadingCurso(false);
  }
};

  const cargarStatsCoordinador = async () => {
    if (!usuario?.colegio_id) {
      setStatsCoordinador(null);
      return;
    }

    try {
      setLoadingCoordinador(true);
      const response = await estadisticasAPI.getCoordinadorStats(usuario.colegio_id);
      const data = response.data;

      if (data.success && data.data) {
        setStatsCoordinador(data.data);
      } else {
        setStatsCoordinador(null);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas del coordinador:', error);
      setStatsCoordinador(null);
    } finally {
      setLoadingCoordinador(false);
    }
  };

useEffect(() => {
    if (!showLoader && usuario?.rol === 'superadmin') {
      cargarTotalColegios();
      cargarTotalUsuarios();
      cargarStatsGlobal();
    }

    if (!showLoader && usuario?.rol === 'estudiante') {
      cargarStatsCurso();
    }

    if (!showLoader && usuario?.rol === 'coordinador') {
      cargarStatsCoordinador();
    }
  }, [showLoader, usuario]);

  const cargarStatsGlobal = async () => {
    try {
      setLoadingGlobal(true);

      const response = await fetch(
        '${import.meta.env.VITE_API_BASE_URL}/estadisticas_globales.php'
      );
      const data = await response.json();

      if (data.success && data.data) {
        const kilosTotales = data.data.kilos_totales || 0;

        setStatsGlobal(prev => ({
          ...prev,
          kilosTotales,
          topColegios: Array.isArray(data.data.top_colegios)
            ? data.data.top_colegios
            : [],
        }));
      }
    } catch (error) {
      console.error('Error al cargar estadísticas globales:', error);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    if (statsGlobal.kilosTotales > 0 && totalColegios > 0) {
      const promedio = Number(
        (statsGlobal.kilosTotales / totalColegios).toFixed(2)
      );
      setStatsGlobal(prev => ({
        ...prev,
        promedioPorColegio: promedio,
      }));
    }
  }, [statsGlobal.kilosTotales, totalColegios]);

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

  const handleIrColegios = () => {
    navigate('/colegios');
  };

  const handleIrUsuarios = () => {
    navigate('/usuarios');
  };

  const handleIrRetosReciclaje = () => {
    navigate('/retos');
  };

  const handleIrReportesGlobales = () => {
  navigate('/reportes');
};

  const handleIrRankingGlobal = () => {
    navigate('/reportes/ranking-global');
  };

  if (showLoader) {
    return <WelcomeLoader onComplete={handleLoaderComplete} />;
  }

  if (usuario?.rol === 'superadmin') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>👑 Panel de Super Administrador</h1>
          <p>Vista general de toda la plataforma</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-icon">🏫</div>
            <div className="stat-info">
              <h3>Colegios</h3>
              <p className="stat-number">
                {loadingColegios ? '...' : totalColegios}
              </p>
              <span className="stat-label">Instituciones activas</span>
            </div>
          </div>

          <div className="stat-card blue">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Usuarios</h3>
              <p className="stat-number">
                {loadingUsuarios ? '...' : totalUsuarios}
              </p>
              <span className="stat-label">Total registrados</span>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">♻️</div>
            <div className="stat-info">
              <h3>Reciclaje</h3>
              <p className="stat-number">
                {loadingGlobal ? '...' : `${statsGlobal.kilosTotales} kg`}
              </p>
              <span className="stat-label">Total recolectado global</span>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Promedio por institución</h3>
              <p className="stat-number">
                {loadingGlobal ? '...' : `${statsGlobal.promedioPorColegio} kg`}
              </p>
              <span className="stat-label">
                Kg reciclados por colegio (promedio)
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-card">
            <h2>📊 Estadísticas Recientes</h2>
            <div className="card-content">
              <p>🔝 Top 3 colegios por reciclaje (kg)</p>
              <div className="ranking-mini">
                {loadingGlobal ? (
                  <p className="texto-auxiliar">Cargando ranking global...</p>
                ) : statsGlobal.topColegios.length === 0 ? (
                  <p className="texto-auxiliar">
                    Aún no hay datos para mostrar un ranking global.
                  </p>
                ) : (
                  statsGlobal.topColegios.slice(0, 3).map((colegioTop, index) => (
                    <div className="ranking-item" key={colegioTop.id || index}>
                      <span className="rank">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <span>{colegioTop.nombre}</span>
                      <span className="points">
                        {colegioTop.puntos} kg
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>🎯 Acciones Rápidas</h2>
            <div className="card-content acciones-rapidas-grid">
              <div className="acciones-bloque">
                <h3>Gestión</h3>
                <button className="action-btn" onClick={handleIrColegios}>
                  ➕ Crear Colegio
                </button>
                <button className="action-btn" onClick={handleIrUsuarios}>
                  👤 Crear Usuario
                </button>
              {/*   <button className="action-btn" onClick={handleIrRetosReciclaje}>
                  ♻️ Configuración
                </button>*/}
              </div>

              <div className="acciones-bloque">
                <h3>Consulta</h3>
                <button className="action-btn" onClick={handleIrReportesGlobales}>
                  📈 Ver Reportes
                </button>
                <button className="action-btn" onClick={handleIrColegios}>
                  🏫 Ver Instituciones
                </button>
                {/* <button className="action-btn" onClick={handleIrRankingGlobal}>
                  🏆 Ver Ranking Global
                </button>*/}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (usuario?.rol === 'coordinador') {
    const topSalones = statsCoordinador?.top_salones ?? [];
    const medallas = ['🥇', '🥈', '🥉'];

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>🎯 Panel de Coordinador</h1>
          <p>Gestión de {colegio?.nombre}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-info">
              <h3>Estudiantes</h3>
              <p className="stat-number">
                {loadingCoordinador ? '...' : statsCoordinador?.estudiantes ?? 0}
              </p>
              <span className="stat-label">Total en tu colegio</span>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">♻️</div>
            <div className="stat-info">
              <h3>Reciclaje</h3>
              <p className="stat-number">
                {loadingCoordinador ? '...' : `${statsCoordinador?.kilos_mes ?? 0} kg`}
              </p>
              <span className="stat-label">Este mes</span>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">🚪</div>
            <div className="stat-info">
              <h3>Salones</h3>
              <p className="stat-number">
                {loadingCoordinador ? '...' : statsCoordinador?.salones ?? 0}
              </p>
              <span className="stat-label">Activos</span>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h3>Puntos</h3>
              <p className="stat-number">
                {loadingCoordinador ? '...' : statsCoordinador?.puntos_totales ?? 0}
              </p>
              <span className="stat-label">Total del colegio</span>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-card">
            <h2>🏅 Top Salones</h2>
            <div className="card-content">
              {loadingCoordinador && (
                <p className="texto-auxiliar">Cargando ranking...</p>
              )}

              {!loadingCoordinador && topSalones.length === 0 && (
                <p className="texto-auxiliar">
                  Aún no hay pesajes registrados en tu colegio.
                </p>
              )}

              {!loadingCoordinador && topSalones.length > 0 && (
                <div className="ranking-mini">
                  {topSalones.map((salon, index) => (
                    <div className="ranking-item" key={salon.salon_id}>
                      <span className="rank">{medallas[index] ?? `#${index + 1}`}</span>
                      <span>{salon.nombre}</span>
                      <span className="points">{salon.puntos_totales} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h2>🎯 Acciones Rápidas</h2>
            <div className="card-content">
              <button
                className="action-btn"
                onClick={() => navigate('/registro')}
              >
                ♻️ Registrar Reciclaje
              </button>
                        <button
            className="action-btn"
            onClick={() => {
              if (usuario?.colegio_id) {
                navigate(`/colegio/${usuario.colegio_id}/gestion?tab=usuarios`);
              } else {
                // Si por alguna razón no hay colegio_id, usa la vista global como fallback
                navigate('/usuarios');
              }
            }}
          >
            👥 Ver Estudiantes
          </button>
              <button
                className="action-btn"
                onClick={() => navigate('/ranking')}
              >
                🏆 Ver Ranking
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/salones')}
              >
                🚪 Ver Salones
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

   if (usuario?.rol === 'estudiante') {
  const puntosCurso = statsCurso?.puntos_curso ?? 0;
  const kilosCurso = statsCurso?.kilos_curso ?? 0;
  const posicionCurso = statsCurso?.posicion_curso_en_colegio ?? null;
  const nombreCurso = statsCurso?.nombre_curso ?? 'tu curso';

  const metaMensual = 50; // Fijo: 50 kg al mes
  const kilosMes = statsCurso?.kilos_mes_curso ?? 0;

  // Mes actual en formato "julio 2026", "agosto 2026", etc.
  const ahora = new Date();
  const opcionesMes = { month: 'long', year: 'numeric' };
  const mesActualTexto = ahora.toLocaleDateString('es-ES', opcionesMes);
  const mesActualCapitalizado =
    mesActualTexto.charAt(0).toUpperCase() + mesActualTexto.slice(1);

  // Logros basados en kilos del mes
  const logroPrimerPaso = kilosMes >= 5;
  const logroRumboMeta = kilosMes >= 20;
  const logroMetaMensual = kilosMes >= 50;

  // ¿Hay al menos un logro desbloqueado?
  const hayAlgunLogro = logroPrimerPaso || logroRumboMeta || logroMetaMensual;

  const porcentajeProgreso =
    metaMensual > 0
      ? Math.min(100, Math.round((kilosMes / metaMensual) * 100))
      : 0;

  const sinDatos =
    !loadingCurso &&
    kilosCurso === 0 &&
    puntosCurso === 0 &&
    !posicionCurso;

  return (
    <div className="dashboard">
        <div className="dashboard-header">
        <h1>🎓 Mi Panel Estudiantil</h1>
        <p>¡Sigue creciendo en tu aventura ecológica! 🌱</p>
        </div>
{mostrarRanking && (
  <div className="dashboard-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <h2>🏆 Ranking de tu colegio</h2>
      <button
        className="action-btn"
        onClick={toggleRanking}
        style={{ padding: '6px 12px', fontSize: '14px' }}
      >
        ✕ Cerrar
      </button>
    </div>
    <div className="card-content">
      {loadingRanking && (
        <p className="texto-auxiliar">Cargando ranking...</p>
      )}

      {!loadingRanking && rankingColegio.length === 0 && (
        <p className="texto-auxiliar">
          No hay datos de ranking disponibles.
        </p>
      )}

      {!loadingRanking && rankingColegio.length > 0 && (
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
              {rankingColegio.map((fila) => {
                const esMiCurso =
                  usuario?.salon_id &&
                  Number(fila.salon_id) === Number(usuario.salon_id);

                return (
                  <tr
  key={fila.salon_id}
  className={esMiCurso ? 'fila-mi-curso' : ''}
>
  <td>{fila.posicion}</td>
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
  </div>
)}


      {loadingCurso && (
        <p className="texto-auxiliar">Cargando información de tu curso...</p>
      )}

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>Puntos de {nombreCurso}</h3>
            <p className="stat-number">
              {loadingCurso ? '...' : puntosCurso}
            </p>
            <span className="stat-label">Puntos acumulados del curso</span>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">♻️</div>
          <div className="stat-info">
            <h3>Reciclaje de {nombreCurso}</h3>
            <p className="stat-number">
              {loadingCurso ? '...' : `${kilosCurso.toFixed(2)} kg`}
            </p>
            <span className="stat-label">Total recolectado por tu curso</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <h3>Posición de {nombreCurso}</h3>
            <p className="stat-number">
              {loadingCurso
                ? '...'
                : posicionCurso
                ? `#${posicionCurso}`
                : '--'}
            </p>
            <span className="stat-label">En el ranking de tu colegio</span>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>Tu curso</h3>
            <p className="stat-number">
              {loadingCurso ? '...' : nombreCurso}
            </p>
            <span className="stat-label">Grupo al que perteneces</span>
          </div>
        </div>
      </div>

     <div className="dashboard-sections">
      <div className="dashboard-card">
      <h2>🏆 Progreso de tu curso – {mesActualCapitalizado}</h2>
       <div className="card-content">
      <div className="progress-item">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>🎯 Meta mensual</span>
          <span style={{ fontWeight: 600 }}>
            {kilosMes.toFixed(2)} kg / {metaMensual} kg
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${porcentajeProgreso}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {porcentajeProgreso}% completado
        </span>
      </div>

      <div className="achievements">
        <h4>🏅 Logros de tu curso</h4>
        {sinDatos ? (
          <p className="texto-auxiliar">
            Aún no hay datos registrados para tu salón.
          </p>
        ) : (
          <>
            {logroPrimerPaso && (
              <div className="badge">🌱 Primer paso (5 kg)</div>
            )}
            {logroRumboMeta && (
              <div className="badge">♻️ Rumbo a la meta (20 kg)</div>
            )}
            {logroMetaMensual && (
              <div className="badge">🎯 Objetivo del mes cumplido (50 kg)</div>
            )}
            {!hayAlgunLogro && (
              <div className="badge">❌ Ningún objetivo cumplido aún</div>
            )}
          </>
        )}
      </div>
    </div>
  </div>

  <div className="dashboard-card">
    <h2>🎯 Acciones Rápidas</h2>
    <div className="card-content">
      <button
  className="action-btn"
  onClick={() => navigate('/ranking')}
>
  🏆 Ver Ranking
</button>
      <button
  className="action-btn"
  onClick={() => navigate('/mi-perfil')}
>
  👤 Mi Perfil
</button>
      <button
  className="action-btn"
  onClick={() => navigate('/mi-curso/estadisticas')}
>
  📊 Estadísticas de mi curso
</button>
      
    </div>
  </div>
</div>
    </div>
  );
}
return null;
}

export default Dashboard;