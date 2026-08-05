import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./ReportesGlobales.css";

function ReportesGlobales() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState("");

  const [totalColegios, setTotalColegios] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [statsGlobal, setStatsGlobal] = useState({
    kilosTotales: 0,
    promedioPorColegio: 0,
    topColegios: [],
  });

  useEffect(() => {
    if (!usuario || usuario.rol !== "superadmin") {
      // Sólo superadmin entra aquí, si quieres permitir coordinador, ajusta rol.
      navigate("/");
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        setErrorGlobal("");

        const [resColegios, resUsuarios, resGlobal] = await Promise.all([
          fetch("${import.meta.env.VITE_API_BASE_URL}/contar_colegios.php"),
          fetch("${import.meta.env.VITE_API_BASE_URL}/contar_usuarios.php"),
          fetch("${import.meta.env.VITE_API_BASE_URL}/estadisticas_globales.php"),
        ]);

        const dataColegios = await resColegios.json();
        const dataUsuarios = await resUsuarios.json();
        const dataGlobal = await resGlobal.json();

        if (dataColegios.success) {
          setTotalColegios(dataColegios.total || 0);
        }

        if (dataUsuarios.success) {
          setTotalUsuarios(dataUsuarios.total || 0);
        }

        if (dataGlobal.success && dataGlobal.data) {
          const kilosTotales = dataGlobal.data.kilos_totales || 0;
          const topColegios = Array.isArray(dataGlobal.data.top_colegios)
            ? dataGlobal.data.top_colegios
            : [];

          let promedioPorColegio = 0;
          if (kilosTotales > 0 && (dataColegios.total || 0) > 0) {
            promedioPorColegio = Number(
              (kilosTotales / (dataColegios.total || 1)).toFixed(2)
            );
          }

          setStatsGlobal({
            kilosTotales,
            promedioPorColegio,
            topColegios,
          });
        }
      } catch (err) {
        console.error("Error al cargar reportes globales:", err);
        setErrorGlobal("Error al cargar reportes globales. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [usuario, navigate]);

  if (loading) {
    return (
      <div className="reportes-globales-page">
        <p className="texto-auxiliar">Cargando reportes globales...</p>
      </div>
    );
  }

  return (
    <div className="reportes-globales-page">
      <div className="reportes-header">
        <h1>📈 Reportes Globales</h1>
        <p>
          Vista consolidada del desempeño de todas las instituciones educativas
          en el programa de reciclaje.
        </p>
      </div>

      {errorGlobal && (
        <div className="mensaje-error">
          {errorGlobal}
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="reportes-stats-grid">
        <div className="reportes-stat-card purple">
          <div className="stat-icon">🏫</div>
          <div className="stat-info">
            <h3>Colegios</h3>
            <p className="stat-number">{totalColegios}</p>
            <span className="stat-label">Instituciones activas</span>
          </div>
        </div>

        <div className="reportes-stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Usuarios</h3>
            <p className="stat-number">{totalUsuarios}</p>
            <span className="stat-label">Total registrados</span>
          </div>
        </div>

        <div className="reportes-stat-card green">
          <div className="stat-icon">♻️</div>
          <div className="stat-info">
            <h3>Reciclaje global</h3>
            <p className="stat-number">{statsGlobal.kilosTotales} kg</p>
            <span className="stat-label">Total recolectado</span>
          </div>
        </div>

        <div className="reportes-stat-card orange">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Promedio por institución</h3>
            <p className="stat-number">{statsGlobal.promedioPorColegio} kg</p>
            <span className="stat-label">
              Kg reciclados por colegio (promedio)
            </span>
          </div>
        </div>
      </div>

      {/* Ranking de colegios */}
      <div className="reportes-section-card">
        <h2>🏆 Ranking Global de Instituciones</h2>
        <p className="section-subtitle">
          Top colegios según kilos de reciclaje recolectados.
        </p>

        {statsGlobal.topColegios.length === 0 ? (
          <p className="texto-auxiliar">
            Aún no hay datos suficientes para mostrar un ranking global.
          </p>
        ) : (
          <table className="tabla-usuarios reportes-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Institución</th>
                <th>Colegio ID</th>
                <th>Kilos reciclados</th>
              </tr>
            </thead>
            <tbody>
              {statsGlobal.topColegios.map((colegioTop, index) => (
                <tr key={colegioTop.id || index}>
                  <td>
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : index + 1}
                  </td>
                  <td>{colegioTop.nombre}</td>
                  <td>{colegioTop.id}</td>
                  <td>{colegioTop.puntos} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Acciones adicionales */}
      <div className="reportes-section-card">
        <h2>🎯 Acciones</h2>
        <div className="acciones-rapidas-grid">
          <button className="action-btn" onClick={() => navigate("/colegios")}>
            🏫 Ver detalle por institución
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/reportes/ranking-global")}
          >
            🏆 Ver ranking detallado
          </button>
          <button
            className="action-btn"
            onClick={() => navigate("/usuarios")}
          >
            👥 Ver usuarios
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportesGlobales;