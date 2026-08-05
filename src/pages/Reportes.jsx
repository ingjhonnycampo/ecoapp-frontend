import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Reportes.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const mapaMeses = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

function getLabelMes(mesClave) {
  if (!mesClave) return "";
  const partes = mesClave.split("-");
  if (partes.length !== 2) return mesClave;
  const [anio, mesNumero] = partes;
  const nombreMes = mapaMeses[mesNumero] || mesNumero;
  return `${nombreMes} ${anio}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "0.5rem 0.75rem",
        fontSize: "0.8rem",
      }}
    >
      <strong>{label}</strong>
      <ul style={{ listStyle: "none", padding: 0, margin: "0.25rem 0 0" }}>
        {payload.map((item) => (
          <li key={item.name}>
            {item.name}: {item.value.toFixed(2)} kg
          </li>
        ))}
      </ul>
    </div>
  );
};

function Reportes() {
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

  const [statsMensuales, setStatsMensuales] = useState([]);
  const [statsMensualesPorColegio, setStatsMensualesPorColegio] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const [institucionesSeleccionadas, setInstitucionesSeleccionadas] =
    useState([]);

  const [filtroAnio, setFiltroAnio] = useState("todos");

  useEffect(() => {
    if (!usuario || usuario.rol !== "superadmin") {
      navigate("/");
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        setLoadingExtra(true);
        setErrorGlobal("");

        const [
          resColegios,
          resUsuarios,
          resGlobal,
          resMensuales,
          resMensualesPorColegio,
        ] = await Promise.all([
          fetch(
            "http://localhost/reciclaje-app/backend/api/contar_colegios.php"
          ),
          fetch(
            "http://localhost/reciclaje-app/backend/api/contar_usuarios.php"
          ),
          fetch(
            "http://localhost/reciclaje-app/backend/api/estadisticas_globales.php"
          ),
          fetch(
            "http://localhost/reciclaje-app/backend/api/estadisticas_mensuales.php"
          ),
          fetch(
            "http://localhost/reciclaje-app/backend/api/estadisticas_mensuales_colegios.php"
          ),
        ]);

        const dataColegios = await resColegios.json();
        const dataUsuarios = await resUsuarios.json();
        const dataGlobal = await resGlobal.json();
        const dataMensuales = await resMensuales.json();
        const dataMensualesPorColegio = await resMensualesPorColegio.json();

        if (dataColegios.success) {
          setTotalColegios(dataColegios.total || 0);
        }

        if (dataUsuarios.success) {
          setTotalUsuarios(dataUsuarios.total || 0);
        }

        if (dataGlobal.success && dataGlobal.data) {
          const kilosTotales = Number(
            dataGlobal.data.kilos_totales ||
              dataGlobal.data.kilos_totales_globales ||
              0
          );
          const topColegios = Array.isArray(dataGlobal.data.top_colegios)
            ? dataGlobal.data.top_colegios
            : Array.isArray(dataGlobal.data.ranking_colegios)
            ? dataGlobal.data.ranking_colegios
            : [];

          const numColegios = dataColegios.total || 0;
          let promedioPorColegio = 0;

          if (kilosTotales > 0 && numColegios > 0) {
            promedioPorColegio = Number(
              (kilosTotales / numColegios).toFixed(2)
            );
          }

          setStatsGlobal({
            kilosTotales,
            promedioPorColegio,
            topColegios,
          });
        }

        if (dataMensuales.success && Array.isArray(dataMensuales.data)) {
          setStatsMensuales(dataMensuales.data);
        }

        if (
          dataMensualesPorColegio.success &&
          Array.isArray(dataMensualesPorColegio.data)
        ) {
          setStatsMensualesPorColegio(dataMensualesPorColegio.data);
        }
      } catch (err) {
        console.error("Error al cargar reportes globales:", err);
        setErrorGlobal("Error al cargar reportes globales. Intenta de nuevo.");
      } finally {
        setLoading(false);
        setLoadingExtra(false);
      }
    };

    cargarDatos();
  }, [usuario, navigate]);

  if (loading) {
    return (
      <div className="reportes-page">
        <h1 className="reportes-titulo">Reportes</h1>
        <p className="texto-auxiliar">Cargando reportes globales...</p>
      </div>
    );
  }

  const añosDisponibles = Array.from(
    new Set(
      statsMensualesPorColegio.map((fila) => fila.mes.split("-")[0])
    )
  ).sort();

  const statsMensualesFiltrados =
    filtroAnio === "todos"
      ? statsMensuales
      : statsMensuales.filter(
          (fila) => fila.mes.split("-")[0] === filtroAnio
        );

  const datosInstitucionesPorMes = (() => {
    const mapa = {};

    statsMensualesPorColegio.forEach((fila) => {
      const anio = fila.mes.split("-")[0];
      if (filtroAnio !== "todos" && anio !== filtroAnio) return;

      const mes = fila.mes;
      const mesLabel = getLabelMes(mes);
      const nombre = fila.nombre_colegio;
      const kilos = Number(fila.kilos_mes_colegio || 0);

      if (!mapa[mes]) {
        mapa[mes] = { mes, mesLabel };
      }
      mapa[mes][nombre] = kilos;
    });

    return Object.values(mapa).sort((a, b) => a.mes.localeCompare(b.mes));
  })();

  const todasLasInstituciones = Array.from(
    new Set(statsMensualesPorColegio.map((fila) => fila.nombre_colegio))
  ).sort();

  if (
    todasLasInstituciones.length > 0 &&
    institucionesSeleccionadas.length === 0
  ) {
    setInstitucionesSeleccionadas(todasLasInstituciones);
  }

  const toggleInstitucion = (nombre) => {
    setInstitucionesSeleccionadas((prev) =>
      prev.includes(nombre)
        ? prev.filter((n) => n !== nombre)
        : [...prev, nombre]
    );
  };

  const colores = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#00bcd4"];

  const imprimirDesempenoMensual = () => {
  const contenido = document.getElementById("seccion-desempeno-mensual");
  if (!contenido) {
    window.print();
    return;
  }

  const ventana = window.open("", "_blank", "width=800,height=600");
  ventana.document.write("<html><head><title>Desempeño mensual</title>");

  ventana.document.write(`
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
        padding: 1rem;
      }

      /* Contenedor principal con marca de agua del logo */
      #seccion-desempeno-mensual {
        margin: 0 auto;
        max-width: 800px;
        position: relative;
        background-image: url("/imagen.png");
        background-repeat: no-repeat;
        background-position: center center;
        background-size: 60%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Ocultar el logo como imagen normal en la impresión */
      .reportes-logo {
        display: none !important;
      }

      #seccion-desempeno-mensual h2,
      #seccion-desempeno-mensual .section-subtitle {
        text-align: center;
      }

      .reportes-tabla {
        margin: 1rem auto;
        width: 90%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      .reportes-tabla thead {
        background-color: #f3f4f6;
      }
      .reportes-tabla th,
      .reportes-tabla td {
        border: 1px solid #e5e7eb;
        padding: 0.5rem 0.75rem;
        text-align: center;
      }
      .reportes-tabla th {
        font-weight: 600;
        color: #374151;
      }
      .reportes-tabla tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }

      .leyenda-instituciones {
        margin-top: 0.75rem;
        font-size: 0.8rem;
      }
      .leyenda-instituciones ul {
        list-style: none;
        padding: 0;
        margin: 0.25rem 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        justify-content: center;
      }
      .leyenda-color {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 0.35rem;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .grafico-mensual-instituciones h3 {
        text-align: center;
      }

      .no-print {
        display: none !important;
      }
    </style>
  `);

  ventana.document.write("</head><body>");
  ventana.document.write(contenido.innerHTML);
  ventana.document.write("</body></html>");
  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
};

  return (
    <div className="reportes-page">
      <h1 className="reportes-titulo no-print">Reportes globales</h1>
      <p className="reportes-subtitulo no-print">
        Vista general del rendimiento de todas las instituciones educativas en
        el programa de reciclaje.
      </p>

      {errorGlobal && (
        <div className="mensaje-error no-print">{errorGlobal}</div>
      )}

      {/* Tarjetas resumen (no se imprimen) */}
      <div className="reportes-stats-grid no-print">
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
            <p className="stat-number">
              {Number(statsGlobal.kilosTotales || 0).toFixed(2)} kg
            </p>
            <span className="stat-label">Total recolectado</span>
          </div>
        </div>

        <div className="reportes-stat-card orange">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Promedio por institución</h3>
            <p className="stat-number">
              {Number(statsGlobal.promedioPorColegio || 0).toFixed(2)} kg
            </p>
            <span className="stat-label">
              Kg reciclados por colegio (promedio)
            </span>
          </div>
        </div>
      </div>

      {/* Ranking global (no se imprime) */}
      <div className="reportes-card no-print">
        <h2>🏆 Ranking global de instituciones</h2>
        <p className="section-subtitle">
          Todas las instituciones ordenadas según kilos de reciclaje
          recolectados.
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
                <th>ID</th>
                <th>Kilos reciclados</th>
              </tr>
            </thead>
            <tbody>
              {statsGlobal.topColegios.map((colegioTop, index) => {
                const kilos = Number(
                  colegioTop.kilos_totales || colegioTop.puntos || 0
                );
                return (
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
                    <td>
                      <button
                        type="button"
                        className="link-colegio"
                        onClick={() =>
                          navigate(
                            `/colegio/${colegioTop.id}/gestion?tab=estadisticas`
                          )
                        }
                      >
                        {colegioTop.nombre}
                      </button>
                    </td>
                    <td>{colegioTop.id}</td>
                    <td>{kilos.toFixed(2)} kg</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Desempeño mensual global: única sección que se imprime */}
      <div
        className="reportes-card"
        id="seccion-desempeno-mensual"
      >
        <div className="reportes-card-header">
          <div className="reportes-card-title">
  <img
    src="/imagen.png"
    alt="Logo reciclaje"
    className="reportes-logo"
  />
  <div>
    <h2>📅 Desempeño mensual global</h2>
    <p className="section-subtitle">
      Kilos reciclados por mes y por institución.
    </p>
  </div>
</div>

          <div className="reportes-card-actions no-print">
            {añosDisponibles.length > 0 && (
              <div className="filtro-anio">
                <label>
                  Año:
                  <select
                    value={filtroAnio}
                    onChange={(e) => setFiltroAnio(e.target.value)}
                  >
                    <option value="todos">Todos</option>
                    {añosDisponibles.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <button
              type="button"
              className="btn-imprimir"
              onClick={imprimirDesempenoMensual}
            >
              Imprimir desempeño mensual
            </button>
          </div>
        </div>

        {loadingExtra ? (
          <p className="texto-auxiliar">
            Cargando estadísticas mensuales...
          </p>
        ) : statsMensualesFiltrados.length === 0 ? (
          <p className="texto-auxiliar">
            Aún no hay datos suficientes para mostrar el desempeño mensual.
          </p>
        ) : (
          <>
            {/* Tabla mensual global filtrada por año */}
            <table className="tabla-usuarios reportes-tabla">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Kilos totales</th>
                  <th>Colegios participantes</th>
                  <th>Promedio por colegio</th>
                </tr>
              </thead>
              <tbody>
                {statsMensualesFiltrados.map((fila) => {
                  const kilos = Number(fila.kilos_totales || 0);
                  const colegios = Number(fila.colegios_participantes || 0);
                  const promedio =
                    kilos > 0 && colegios > 0
                      ? (kilos / colegios).toFixed(2)
                      : "0.00";

                  return (
                    <tr key={fila.mes}>
                      <td>{getLabelMes(fila.mes)}</td>
                      <td>{kilos.toFixed(2)} kg</td>
                      <td>{colegios}</td>
                      <td>{promedio} kg</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Checklist solo en pantalla */}
            {todasLasInstituciones.length > 0 && (
              <div className="selector-instituciones no-print">
                <h3>Instituciones en la gráfica</h3>
                <div className="selector-instituciones-grid">
                  {todasLasInstituciones.map((nombre) => (
                    <label
                      key={nombre}
                      className="selector-institucion-item"
                    >
                      <input
                        type="checkbox"
                        checked={institucionesSeleccionadas.includes(nombre)}
                        onChange={() => toggleInstitucion(nombre)}
                      />
                      <span>{nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Leyenda visible también al imprimir */}
            {institucionesSeleccionadas.length > 0 && (
              <div className="leyenda-instituciones">
                <span>Colores por institución:</span>
                <ul>
                  {institucionesSeleccionadas.map((nombre, idx) => (
                    <li key={nombre}>
                      <span
                        className="leyenda-color"
                        style={{
                          backgroundColor: colores[idx % colores.length],
                        }}
                      />
                      {nombre}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Única gráfica de barras múltiples por institución */}
            {datosInstitucionesPorMes.length > 0 &&
              institucionesSeleccionadas.length > 0 && (
                <div className="grafico-mensual-instituciones">
                  <h3>
                    Gráfica de barras múltiples por institución (mes
                    ascendente)
                  </h3>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={datosInstitucionesPorMes}
                      margin={{ top: 30, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="mesLabel"
                        label={{
                          value: "Mes",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        label={{
                          value: "Kilos reciclados",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {institucionesSeleccionadas.map((nombre, idx) => (
                        <Bar
                          key={nombre}
                          dataKey={nombre}
                          fill={colores[idx % colores.length]}
                          barSize={20}
                          radius={[10, 10, 0, 0]}
                        >
                          <LabelList
                            dataKey={nombre}
                            position="top"
                            formatter={(value) => `${value.toFixed(1)} kg`}
                            style={{ fontSize: "0.7rem" }}
                          />
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

export default Reportes;