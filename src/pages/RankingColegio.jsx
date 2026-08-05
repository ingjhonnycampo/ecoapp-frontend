// frontend/src/pages/RankingColegio.jsx
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { estadisticasAPI, reciclajeAPI } from '../services/api';
import '../components/GestionColegio.css';
const BASE_UPLOADS = import.meta.env.VITE_UPLOADS_BASE_URL;
function formatear1Decimal(valor) {
  if (valor == null || isNaN(valor)) return '0.0';
  return Number(valor).toFixed(1);
}

function renderMedalla(posicion) {
  if (posicion === 1) return '🥇';
  if (posicion === 2) return '🥈';
  if (posicion === 3) return '🥉';
  return posicion;
}

function calcularEstadoRetoPorFecha(reto) {
  if (!reto.fecha_inicio || !reto.fecha_fin) {
    return reto.estado || 'borrador';
  }
  const hoy = new Date();
  const [yIni, mIni, dIni] = reto.fecha_inicio.split('-').map(Number);
  const [yFin, mFin, dFin] = reto.fecha_fin.split('-').map(Number);
  const inicio = new Date(yIni, mIni - 1, dIni, 0, 0, 0);
  const fin = new Date(yFin, mFin - 1, dFin, 23, 59, 59);
  if (hoy < inicio) return 'por_comenzar';
  if (hoy > fin) return 'cerrado';
  return 'activo';
}

function RankingColegio() {
  const { usuario, colegio } = useContext(AuthContext);
  const colegioId = usuario?.colegio_id;

  const [statsReciclaje, setStatsReciclaje] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState('');

  const [retosColegio, setRetosColegio] = useState([]);
  const [retoSeleccionado, setRetoSeleccionado] = useState(null);
  const [rankingReto, setRankingReto] = useState(null);
  const [loadingRankingReto, setLoadingRankingReto] = useState(false);
  const [errorRankingReto, setErrorRankingReto] = useState('');

  const [rankingHistorico, setRankingHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [errorHistorico, setErrorHistorico] = useState('');

  const refResumen = useRef(null);
  const refTablaReto = useRef(null);
  const refHistorico = useRef(null);

  useEffect(() => {
    if (!colegioId) return;

    const cargarResumen = async () => {
      try {
        setLoadingStats(true);
        setErrorStats('');
        const res = await estadisticasAPI.getColegioReciclajeStats(colegioId);
        setStatsReciclaje(res.data?.data ?? null);
      } catch (err) {
        console.error('Error al cargar estadísticas de reciclaje:', err);
        setErrorStats('No se pudieron cargar las estadísticas de reciclaje.');
      } finally {
        setLoadingStats(false);
      }
    };

    const cargarHistorico = async () => {
      try {
        setLoadingHistorico(true);
        setErrorHistorico('');
        const res = await estadisticasAPI.getRankingHistoricoColegio(colegioId);
        setRankingHistorico(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error al cargar ranking histórico:', err);
        setErrorHistorico('No se pudo cargar el ranking histórico del colegio.');
      } finally {
        setLoadingHistorico(false);
      }
    };

    const cargarRetos = async () => {
      try {
        const res = await reciclajeAPI.getRetosPorColegio(colegioId);
        setRetosColegio(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error al cargar retos del colegio:', err);
      }
    };

    cargarResumen();
    cargarHistorico();
    cargarRetos();
  }, [colegioId]);

  const cargarRankingDeReto = async (reto) => {
    if (!reto || !colegioId) return;
    try {
      setLoadingRankingReto(true);
      setErrorRankingReto('');
      const res = await reciclajeAPI.getRankingReto(reto.id, colegioId);
      const filas = Array.isArray(res.data?.data) ? res.data.data : [];
      setRetoSeleccionado(reto);
      setRankingReto({ reto, filas });
    } catch (err) {
      console.error('Error al cargar ranking del reto:', err);
      setErrorRankingReto('No se pudo cargar la tabla de posiciones del reto.');
    } finally {
      setLoadingRankingReto(false);
    }
  };

  useEffect(() => {
    if (retosColegio.length > 0 && !retoSeleccionado) {
      cargarRankingDeReto(retosColegio[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retosColegio]);

  const resumenRetos = (() => {
    if (!retosColegio.length) return { total: 0, activos: 0, cerrados: 0, porComenzar: 0 };
    let activos = 0, cerrados = 0, porComenzar = 0;
    retosColegio.forEach((r) => {
      const estado = calcularEstadoRetoPorFecha(r);
      if (estado === 'activo') activos += 1;
      else if (estado === 'cerrado') cerrados += 1;
      else if (estado === 'por_comenzar') porComenzar += 1;
    });
    return { total: retosColegio.length, activos, cerrados, porComenzar };
  })();

  const imprimirSeccion = (ref, opciones = {}) => {
  if (!ref.current || !colegio) return;
  const { titulo, subtitulo } = opciones;
  const contenido = ref.current.innerHTML;
  const ventana = window.open('', '_blank', 'width=900,height=700');


  const encabezadoHtml = `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px;">
        <img src="${BASE_UPLOADS}/escudos/${colegio.escudo}" alt="${colegio.nombre}" style="width:70px;height:70px;object-fit:contain;display:block;" />
        <img src="/imagen.png" alt="Logo EcoApp" style="width:70px;height:70px;object-fit:contain;display:block;" />
      </div>
      <h1 style="margin:0;font-size:24pt;">${colegio.nombre}</h1>
      ${titulo ? `<h2 style="margin:0;font-size:16pt;">${titulo}</h2>` : ''}
      ${subtitulo ? `<p style="margin:2px 0 0 0;font-size:11pt;color:#555;">${subtitulo}</p>` : ''}
    </div>
  `;

    ventana.document.write(`
      <html>
        <head>
          <title>Reporte de reciclaje - ${colegio.nombre}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #222; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #333; padding: 8px 6px; font-size: 11pt; text-align: center; }
            thead tr { background: #e0f7fa; }
            tbody tr:nth-child(even) { background: #f5f5f5; }
            tbody tr:nth-child(1) { background: #fff9c4; font-weight: bold; }
            tbody tr:nth-child(2) { background: #e1f5fe; }
            tbody tr:nth-child(3) { background: #fce4ec; }
            .medalla { font-size: 14pt; }
            .nota-pie { margin-top: 12px; font-size: 9pt; color: #666; text-align: right; }
            button { display: none !important; }
            .resumen-retos { margin-bottom: 16px; }
            .resumen-retos-titulo { margin: 0 0 8px 0; font-size: 14pt; font-weight: 600; }
            .resumen-retos-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .resumen-retos-item { border: 1px solid #ddd; border-radius: 6px; padding: 8px 10px; background: #f9fafb; text-align: center; }
          </style>
        </head>
        <body>
          ${encabezadoHtml}
          ${contenido}
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.onload = () => {
      setTimeout(() => {
        ventana.focus();
        ventana.print();
        ventana.close();
      }, 500);
    };
  };

  if (!colegioId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>⚠️ Sin colegio asignado</h2>
        <p>Tu usuario no tiene un colegio asignado. Contacta al administrador.</p>
      </div>
    );
  }

  return (
    <div className="seccion-contenido" style={{ padding: '1.5rem' }}>
      <div className="seccion-header">
        <div>
          <h2>🏆 Ranking y desempeño</h2>
          <p className="seccion-descripcion">{colegio?.nombre}</p>
        </div>
      </div>

      <div className="seccion-body seccion-estadisticas">
        {/* Resumen general */}
        <div className="bloque-estadistica">
          <div className="bloque-header">
            <h3>Resumen general</h3>
          </div>
          <div ref={refResumen}>
            {loadingStats ? (
              <p className="texto-auxiliar">Cargando estadísticas...</p>
            ) : errorStats ? (
              <div className="empty-state"><span className="empty-icon">⚠️</span><p>{errorStats}</p></div>
            ) : statsReciclaje ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">♻️</div>
                  <div className="stat-info">
                    <div className="stat-numero">{formatear1Decimal(statsReciclaje.totales.kilos_totales)} kg</div>
                    <div className="stat-label">Kilos reciclados</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-info">
                    <div className="stat-numero">{statsReciclaje.totales.num_pesajes}</div>
                    <div className="stat-label">Pesajes registrados</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏫</div>
                  <div className="stat-info">
                    <div className="stat-numero">{statsReciclaje.totales.salones_participantes}</div>
                    <div className="stat-label">Salones participantes</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-info">
                    <div className="stat-numero">{statsReciclaje.totales.num_retos}</div>
                    <div className="stat-label">Retos realizados</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="texto-auxiliar">Aún no hay datos de reciclaje para tu colegio.</p>
            )}
          </div>
        </div>

        {/* Resumen por reto */}
        <div className="bloque-estadistica">
          <h3>Retos de reciclaje del colegio</h3>
          {statsReciclaje?.retos?.length > 0 ? (
            <div className="tabla-retos-resumen">
              <table>
                <thead>
                  <tr><th>Reto</th><th>Fechas</th><th>Puntos por kg</th><th>Kilos totales</th><th>Puntos totales</th></tr>
                </thead>
                <tbody>
                  {statsReciclaje.retos.map((r) => (
                    <tr key={r.id}>
                      <td>{r.nombre}</td>
                      <td>{r.fecha_inicio} → {r.fecha_fin}</td>
                      <td>{formatear1Decimal(r.puntos_por_kilo)}</td>
                      <td>{formatear1Decimal(r.kilos_totales)} kg</td>
                      <td>{formatear1Decimal(r.puntos_totales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="texto-auxiliar">Aún no hay retos con pesajes registrados.</p>
          )}
        </div>

        {/* Tabla de posiciones por reto */}
        <div className="bloque-estadistica">
          <div className="ranking-header">
            <h3>🏆 Tabla de posiciones por reto</h3>
            {retosColegio.length > 0 && (
              <div className="selector-reto-ranking">
                <label>
                  Reto:
                  <select
                    value={retoSeleccionado?.id || retosColegio[0]?.id || ''}
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      const reto = retosColegio.find((r) => r.id === id);
                      if (reto) cargarRankingDeReto(reto);
                    }}
                  >
                    {retosColegio.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre} ({r.fecha_inicio} → {r.fecha_fin})</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <button
              type="button"
              className="btn-accion btn-accion-imprimir"
              onClick={() => imprimirSeccion(refTablaReto, {
                titulo: 'Tabla de posiciones por reto',
                subtitulo: rankingReto?.reto ? `Reto: ${rankingReto.reto.nombre} — Fechas: ${rankingReto.reto.fecha_inicio} → ${rankingReto.reto.fecha_fin}` : '',
              })}
            >
              🖨️ Imprimir
            </button>
          </div>

          <div ref={refTablaReto}>
            {rankingReto?.reto?.puntos_por_kilo != null && (
              <p className="seccion-descripcion">
                Puntos por kg: {formatear1Decimal(rankingReto.reto.puntos_por_kilo)} (puntos = kilos reciclados × puntos por kg)
              </p>
            )}
            {loadingRankingReto ? (
              <p className="texto-auxiliar">Cargando tabla de posiciones...</p>
            ) : errorRankingReto ? (
              <div className="empty-state"><span className="empty-icon">⚠️</span><p>{errorRankingReto}</p></div>
            ) : !rankingReto || !rankingReto.filas || rankingReto.filas.length === 0 ? (
              <p className="texto-auxiliar">
                El reto &quot;{rankingReto?.reto?.nombre || 'seleccionado'}&quot; todavía no tiene pesajes registrados.
              </p>
            ) : (
              <div className="tabla-ranking-retos">
                <table>
                  <thead>
                    <tr><th>Posición</th><th>Grado</th><th>Salón</th><th>Pesajes</th><th>Kilos</th><th>Puntos</th></tr>
                  </thead>
                  <tbody>
                    {rankingReto.filas.map((fila) => (
                      <tr key={fila.salon_id}>
                        <td className="medalla">{renderMedalla(fila.posicion)}</td>
                        <td>{fila.grado_nombre}</td>
                        <td>{fila.salon_nombre}</td>
                        <td>{fila.num_pesajes}</td>
                        <td>{formatear1Decimal(fila.kilos)}</td>
                        <td>{formatear1Decimal(fila.puntos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="nota-pie">Generado por EcoApp Escolar</div>
              </div>
            )}
          </div>
        </div>

        {/* Ranking histórico */}
        <div className="bloque-estadistica">
          <div className="ranking-header">
            <div>
              <h3>🏅 Ranking histórico del colegio</h3>
              <p className="seccion-descripcion">
                Suma de puntos de todos los retos (puntos = kilos × puntos por kg de cada reto).
              </p>
            </div>
            <button
              type="button"
              className="btn-accion btn-accion-imprimir"
              onClick={() => imprimirSeccion(refHistorico, {
                titulo: 'Ranking histórico del colegio',
                subtitulo: 'Suma de puntos de todos los retos (puntos = kilos × puntos por kg de cada reto)',
              })}
            >
              🖨️ Imprimir
            </button>
          </div>

          <div ref={refHistorico}>
            <div className="resumen-retos">
              <h4 className="resumen-retos-titulo">📋 Resumen de retos</h4>
              <div className="resumen-retos-grid">
                <div className="resumen-retos-item">
                  <div className="resumen-retos-icon">📦</div>
                  <div className="resumen-retos-label">Total de retos</div>
                  <div className="resumen-retos-valor">{resumenRetos.total}</div>
                </div>
                <div className="resumen-retos-item">
                  <div className="resumen-retos-icon">🔥</div>
                  <div className="resumen-retos-label">Retos activos</div>
                  <div className="resumen-retos-valor">{resumenRetos.activos}</div>
                </div>
                <div className="resumen-retos-item">
                  <div className="resumen-retos-icon">✅</div>
                  <div className="resumen-retos-label">Retos cerrados</div>
                  <div className="resumen-retos-valor">{resumenRetos.cerrados}</div>
                </div>
                <div className="resumen-retos-item">
                  <div className="resumen-retos-icon">⏳</div>
                  <div className="resumen-retos-label">Retos por comenzar</div>
                  <div className="resumen-retos-valor">{resumenRetos.porComenzar}</div>
                </div>
              </div>
            </div>

            {loadingHistorico ? (
              <p className="texto-auxiliar">Cargando ranking histórico...</p>
            ) : errorHistorico ? (
              <div className="empty-state"><span className="empty-icon">⚠️</span><p>{errorHistorico}</p></div>
            ) : rankingHistorico.length === 0 ? (
              <p className="texto-auxiliar">Aún no hay suficientes datos para mostrar un ranking histórico.</p>
            ) : (
              <div className="tabla-ranking-historico">
                <table>
                  <thead>
                    <tr><th>Posición</th><th>Grado</th><th>Salón</th><th>Pesajes</th><th>Kilos totales</th><th>Puntos totales</th></tr>
                  </thead>
                  <tbody>
                    {rankingHistorico.map((fila) => (
                      <tr key={fila.salon_id}>
                        <td className="medalla">{renderMedalla(fila.posicion)}</td>
                        <td>{fila.grado_nombre}</td>
                        <td>{fila.salon_nombre}</td>
                        <td>{fila.num_pesajes}</td>
                        <td>{formatear1Decimal(fila.kilos)}</td>
                        <td>{formatear1Decimal(fila.puntos_totales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="nota-pie">Generado por EcoApp</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RankingColegio;
