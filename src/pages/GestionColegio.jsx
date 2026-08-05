// frontend/src/pages/GestionColegio.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  colegiosAPI,
  reciclajeAPI,
  estadisticasAPI,
} from '../services/api';

import GestionRetosReciclaje from '../components/GestionRetosReciclaje';
import GestionSalones from '../components/GestionSalones';
import ModalUsuario from '../components/ModalUsuario';
import ModalConfirmar from '../components/ModalConfirmar';
import ModalCambiarPassword from '../components/ModalCambiarPassword';
import { useLocation } from "react-router-dom";
import '../components/GestionColegio.css';
import './GestionColegio.css';



function GestionColegio() {
  const { colegioId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario } = useContext(AuthContext);

  const [colegio, setColegio] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [stats, setStats] = useState({ usuarios: 0, salones: 0 });
  const [loading, setLoading] = useState(true);

const location = useLocation();
const params = new URLSearchParams(location.search);
const tabInicial = params.get("tab") || "usuarios";

const [seccionActiva, setSeccionActiva] = useState(tabInicial);
  // Modales
  const [modalUsuario, setModalUsuario] = useState({
    abierto: false,
    usuario: null,
    modo: 'crear',
  });
  const [modalPassword, setModalPassword] = useState({
    abierto: false,
    usuario: null,
  });
  const [modalConfirmar, setModalConfirmar] = useState({
    abierto: false,
    titulo: '',
    mensaje: '',
    onConfirmar: null,
  });


    // Si el usuario es coordinador, solo puede gestionar su propio colegio
  useEffect(() => {
    if (usuario?.rol === 'coordinador' && usuario?.colegio_id) {
      const idUrl = parseInt(colegioId, 10);
      const idUsuario = parseInt(usuario.colegio_id, 10);

      if (idUrl !== idUsuario) {
        // Redirige al colegio del coordinador
        navigate(`/colegio/${idUsuario}/gestion?tab=usuarios`);
      }
    }
  }, [usuario, colegioId, navigate]);
  // Estadísticas de reciclaje del colegio
  const [statsReciclajeColegio, setStatsReciclajeColegio] = useState(null);
  const [loadingStatsReciclaje, setLoadingStatsReciclaje] = useState(false);
  const [errorStatsReciclaje, setErrorStatsReciclaje] = useState('');

  // Ranking por reto
  const [rankingReto, setRankingReto] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [errorRanking, setErrorRanking] = useState('');
  const [retoSeleccionadoRanking, setRetoSeleccionadoRanking] = useState(null);

  // Ranking histórico del colegio
  const [rankingHistorico, setRankingHistorico] = useState([]);
  const [loadingRankingHistorico, setLoadingRankingHistorico] = useState(false);
  const [errorRankingHistorico, setErrorRankingHistorico] = useState('');

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  // Retos para sección Pesaje / Estadísticas
  const [retosColegio, setRetosColegio] = useState([]);
  const [loadingRetosPesaje, setLoadingRetosPesaje] = useState(false);

  // ================== FUNCIONES DE CARGA NUEVAS (RECICLAJE) ==================

  const cargarEstadisticasColegioReciclaje = async () => {
    if (!colegio) return;
    try {
      setLoadingStatsReciclaje(true);
      setErrorStatsReciclaje('');

      const res = await estadisticasAPI.getColegioReciclajeStats(colegio.id);
      console.log('estadisticas_colegio_reciclaje =>', res.data);

      const data = res.data && res.data.data ? res.data.data : null;
      setStatsReciclajeColegio(data);
    } catch (err) {
      console.error(
        'Error al cargar estadísticas de reciclaje del colegio:',
        err
      );
      setErrorStatsReciclaje(
        'No se pudieron cargar las estadísticas de reciclaje.'
      );
    } finally {
      setLoadingStatsReciclaje(false);
    }
  };

  const cargarRankingHistorico = async () => {
    if (!colegio) return;
    try {
      setLoadingRankingHistorico(true);
      setErrorRankingHistorico('');

      const res = await estadisticasAPI.getRankingHistoricoColegio(colegio.id);
      console.log('ranking_historico_colegio =>', res.data);

      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setRankingHistorico(data);
    } catch (err) {
      console.error('Error al cargar ranking histórico:', err);
      setErrorRankingHistorico(
        'No se pudo cargar el ranking histórico del colegio.'
      );
    } finally {
      setLoadingRankingHistorico(false);
    }
  };

  const cargarRetosColegio = async () => {
    if (!colegio) return;
    try {
      setLoadingRetosPesaje(true);
      const res = await reciclajeAPI.getRetosPorColegio(colegio.id);
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setRetosColegio(data);
    } catch (error) {
      console.error('Error al cargar retos para pesaje/estadísticas:', error);
    } finally {
      setLoadingRetosPesaje(false);
    }
  };

  const cargarRankingReto = async (retoForzado = null) => {
    if (!colegio) return;
    try {
      setLoadingRanking(true);
      setErrorRanking('');

      const listaRetos = retosColegio;
      if (!listaRetos.length) {
        setRankingReto(null);
        return;
      }

      const retoBase = retoForzado || retoSeleccionadoRanking || listaRetos[0];

      const resRanking = await reciclajeAPI.getRankingReto(
        retoBase.id,
        colegio.id
      );
      console.log('ranking_reto =>', resRanking.data);

      const filas = Array.isArray(resRanking.data.data)
        ? resRanking.data.data
        : [];

      setRetoSeleccionadoRanking(retoBase);
      setRankingReto({
        reto: retoBase,
        filas,
      });
    } catch (err) {
      console.error('Error al cargar ranking del reto:', err);
      setErrorRanking('No se pudo cargar la tabla de posiciones del reto.');
    } finally {
      setLoadingRanking(false);
    }
  };

  const renderMedalla = (posicion) => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return posicion;
  };

  // ================== USEEFFECTS ==================

  useEffect(() => {
    cargarDatos();
  }, [colegioId]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pesaje') {
      setSeccionActiva('pesaje');
    }
  }, [searchParams]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroNombre, filtroRol, usuarios]);

  useEffect(() => {
    if (seccionActiva === 'pesaje' && colegio) {
      cargarRetosColegio();
    }
  }, [seccionActiva, colegio]);

  // Cargar estadísticas de reciclaje apenas el colegio esté disponible
useEffect(() => {
  if (colegio) {
    cargarEstadisticasColegioReciclaje();
  }
}, [colegio]);

// Cargar retos y ranking histórico solo cuando se entra a Estadísticas
useEffect(() => {
  if (seccionActiva === 'estadisticas' && colegio) {
    cargarRetosColegio();
    cargarRankingHistorico();
  }
}, [seccionActiva, colegio]);

  useEffect(() => {
    if (
      seccionActiva === 'estadisticas' &&
      colegio &&
      retosColegio.length > 0
    ) {
      cargarRankingReto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccionActiva, colegio, retosColegio]);

  // ================== FUNCIONES EXISTENTES ==================
  // Refs para impresión de secciones
  // Refs para impresión de secciones
const refResumenColegio = useRef(null);
const refRankingHistorico = useRef(null);
const refTablaPosicionesReto = useRef(null);
  // Formatear a 1 decimal
  const formatear1Decimal = (valor) => {
    if (valor == null || isNaN(valor)) return '0.0';
    return Number(valor).toFixed(1);
  };

 // Función para imprimir una sección
const imprimirSeccion = (ref, opciones = {}) => {
  if (!ref.current || !colegio) return;

  const { titulo, subtitulo } = opciones;
  const contenido = ref.current.innerHTML;
  const ventana = window.open('', '_blank', 'width=900,height=700');

  // Encabezado con escudo + logo app
  const encabezadoHtml = `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px;">
        <img
          src="${import.meta.env.VITE_UPLOADS_BASE_URL}/escudos/${colegio.escudo}"
          alt="${colegio.nombre}"
          style="width:70px;height:70px;object-fit:contain;display:block;"
        />
        <img
        src="/imagen.png"
        alt="Logo EcoApp"
        style="width:70px;height:70px;object-fit:contain;display:block;"
      />
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
        @page {
          size: A4 portrait;
          margin: 15mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #222;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        th, td {
          border: 1px solid #333;
          padding: 8px 6px;
          font-size: 11pt;
          text-align: center;
        }

        thead tr {
          background: #e0f7fa;
        }

        tbody tr:nth-child(even) {
          background: #f5f5f5;
        }

        tbody tr:nth-child(1) {
          background: #fff9c4;
          font-weight: bold;
        }

        tbody tr:nth-child(2) {
          background: #e1f5fe;
        }

        tbody tr:nth-child(3) {
          background: #fce4ec;
        }

        .medalla {
          font-size: 14pt;
        }

        .nota-pie {
          margin-top: 12px;
          font-size: 9pt;
          color: #666;
          text-align: right;
        }

        button {
          display: none !important;
        }

        /* Estilos del resumen de retos (para impresión) */
        .resumen-retos {
          margin-bottom: 16px;
        }

        .resumen-retos-titulo {
          margin: 0 0 8px 0;
          font-size: 14pt;
          font-weight: 600;
        }

        .resumen-retos-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .resumen-retos-item {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 8px 10px;
          background: #f9fafb;
          text-align: center;
        }

        .resumen-retos-icon {
          font-size: 18pt;
          margin-bottom: 4px;
        }

        .resumen-retos-label {
          font-size: 10pt;
          color: #555;
          margin-bottom: 2px;
        }

        .resumen-retos-valor {
          font-size: 14pt;
          font-weight: 700;
          color: #222;
        }

        @media (max-width: 768px) {
          .resumen-retos-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      </style>
    </head>
    <body>
      ${encabezadoHtml}
      ${contenido}
    </body>
  </html>
`);

ventana.document.close();

  // Esperar a que cargue la ventana + imágenes antes de imprimir
  ventana.onload = () => {
    setTimeout(() => {
      ventana.focus();
      ventana.print();
      ventana.close();
    }, 500);
  };
};

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const response = await colegiosAPI.getAll();
      const colegioEncontrado = response.data.data.find(
        (c) => c.id === parseInt(colegioId)
      );
      setColegio(colegioEncontrado);

      const responseStats = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/estadisticas_colegio.php?colegio_id=${colegioId}`
      );
      const dataStats = await responseStats.json();

      if (dataStats.success) {
        setStats(dataStats.data);
      }

      await cargarUsuarios();
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/usuarios_colegio.php?colegio_id=${colegioId}`
      );
      const data = await response.json();

      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...usuarios];

    if (filtroNombre) {
      resultado = resultado.filter(
        (u) =>
          u.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) ||
          u.email.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    if (filtroRol) {
      resultado = resultado.filter((u) => u.rol === filtroRol);
    }

    setUsuariosFiltrados(resultado);
  };

  const abrirModalCrear = () => {
    setModalUsuario({ abierto: true, usuario: null, modo: 'crear' });
  };

  const abrirModalEditar = (usuario) => {
    setModalUsuario({ abierto: true, usuario, modo: 'editar' });
  };

  const abrirModalPassword = (usuario) => {
    setModalPassword({ abierto: true, usuario });
  };

  const confirmarDesactivar = (usuario) => {
    setModalConfirmar({
      abierto: true,
      titulo: 'Desactivar Usuario',
      mensaje: `¿Estás seguro de desactivar a ${usuario.nombre}? El usuario no podrá acceder al sistema.`,
      onConfirmar: () => desactivarUsuario(usuario.id),
    });
  };

  const confirmarActivar = (usuario) => {
    setModalConfirmar({
      abierto: true,
      titulo: 'Activar Usuario',
      mensaje: `¿Deseas activar a ${usuario.nombre}?`,
      onConfirmar: () => activarUsuario(usuario.id),
    });
  };

  const desactivarUsuario = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/usuarios_colegio.php?id=${id}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();

      if (data.success) {
        await cargarUsuarios();
        await cargarDatos();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const activarUsuario = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/usuarios_colegio.php`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, activo: 1 }),
        }
      );
      const data = await response.json();

      if (data.success) {
        await cargarUsuarios();
        await cargarDatos();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calcularEstadoRetoPorFecha = (reto) => {
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
  };

  const getEstadoRetoInfo = (reto) => {
    const estadoCalc = calcularEstadoRetoPorFecha(reto);

    switch (estadoCalc) {
      case 'activo':
        return { clase: 'estado-badge estado-activo', texto: 'Activo' };
      case 'por_comenzar':
        return { clase: 'estado-badge estado-borrador', texto: 'Por comenzar' };
      case 'cerrado':
        return { clase: 'estado-badge estado-cerrado', texto: 'Cerrado' };
      default:
        return { clase: 'estado-badge estado-borrador', texto: 'Borrador' };
    }
  };









  const retosVisiblesPesaje = retosColegio.filter((reto) => {
    const rol = usuario?.rol ? usuario.rol.toLowerCase() : '';

    if (rol === 'superadmin') {
      return true;
    }

    if (rol === 'coordinador') {
      const estado = calcularEstadoRetoPorFecha(reto);
      return estado === 'activo';
    }

    return false;
  });



const getResumenRetos = () => {
  if (!Array.isArray(retosColegio) || retosColegio.length === 0) {
    return { total: 0, activos: 0, cerrados: 0, porComenzar: 0 };
  }

  let activos = 0;
  let cerrados = 0;
  let porComenzar = 0;

  retosColegio.forEach((reto) => {
    const estado = calcularEstadoRetoPorFecha(reto);

    if (estado === 'activo') activos += 1;
    else if (estado === 'cerrado') cerrados += 1;
    else if (estado === 'por_comenzar') porComenzar += 1;
  });

  return {
    total: retosColegio.length,
    activos,
    cerrados,
    porComenzar,
  };
};





  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando información del colegio...</p>
      </div>
    );
  }

  if (!colegio) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <span className="empty-icon">❌</span>
          <p>Colegio no encontrado</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/colegios')}
          >
            Volver a Colegios
          </button>
        </div>
      </div>
    );
  }


const resumenRetos = getResumenRetos();

  return (
    <div className="gestion-colegio-container">
      {/* Header */}
      <div className="header-gestion">
        <button className="btn-volver" onClick={() => navigate('/colegios')}>
          ← Volver
        </button>

        <div className="header-info-colegio">
          <div className="escudo-compacto">
            {colegio.escudo ? (
              <img
                src={`${import.meta.env.VITE_UPLOADS_BASE_URL}/escudos/${colegio.escudo}`}
                alt={colegio.nombre}
              />
            ) : (
              <div className="sin-escudo-compacto">🏫</div>
            )}
          </div>
          <div className="info-text-colegio">
            <h1>{colegio.nombre}</h1>
            <div className="detalles-colegio">
              <span className="detalle-item">
                <span className="detalle-icon">🔢</span>
                DANE: {colegio.codigo}
              </span>
              {colegio.ciudad && (
                <span className="detalle-item">
                  <span className="detalle-icon">📍</span>
                  {colegio.ciudad}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menú */}
      <div className="gestion-nav">
        <button
          className={`nav-btn ${
            seccionActiva === 'usuarios' ? 'active' : ''
          }`}
          onClick={() => setSeccionActiva('usuarios')}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-text">Usuarios</span>
        </button>
        <button
          className={`nav-btn ${seccionActiva === 'salones' ? 'active' : ''}`}
          onClick={() => setSeccionActiva('salones')}
        >
          <span className="nav-icon">🏫</span>
          <span className="nav-text">Salones</span>
        </button>
        <button
          className={`nav-btn ${
            seccionActiva === 'reciclaje' ? 'active' : ''
          }`}
          onClick={() => setSeccionActiva('reciclaje')}
        >
          <span className="nav-icon">♻️</span>
          <span className="nav-text">Retos y Reciclaje</span>
        </button>
        <button
          className={`nav-btn ${seccionActiva === 'pesaje' ? 'active' : ''}`}
          onClick={() => setSeccionActiva('pesaje')}
        >
          <span className="nav-icon">⚖️</span>
          <span className="nav-text">Pesaje</span>
        </button>
        <button
          className={`nav-btn ${
            seccionActiva === 'estadisticas' ? 'active' : ''
          }`}
          onClick={() => setSeccionActiva('estadisticas')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Estadísticas</span>
        </button>
      </div>

      {/* Contenido secciones */}
      <div className="gestion-content">
        {/* Usuarios */}
       {/* Usuarios */}
{/* Usuarios */}
{seccionActiva === 'usuarios' && (
  <div className="seccion-contenido">
    <div className="seccion-header">
      <div>
        <h2>👥 Usuarios</h2>
        <p className="seccion-descripcion">
          Gestiona los usuarios del colegio
        </p>
      </div>
      <div className="seccion-header-actions">
        <button className="btn-primario" onClick={abrirModalCrear}>
          + Nuevo Usuario
        </button>
      </div>
    </div>

    <div className="seccion-body">
      {/* FILTROS */}
      <div className="filtros-container">
        <div className="filtro-item">
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            className="input-filtro"
          />
        </div>
        <div className="filtro-item">
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="select-filtro"
          >
            <option value="">Todos</option>
            <option value="superadmin">Superadmin</option>
            <option value="coordinador">Coordinador</option>
            <option value="adulto">Adulto</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      {usuariosFiltrados.length === 0 ? (
        <p className="texto-auxiliar">No hay usuarios para mostrar.</p>
      ) : (
        <div className="tabla-usuarios">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className={u.activo ? '' : 'usuario-inactivo'}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge-rol-tabla ${u.rol}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        u.activo
                          ? 'badge-estado activo'
                          : 'badge-estado inactivo'
                      }
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="acciones-cell">
                      <button
                        type="button"
                        className="btn-accion editar"
                        onClick={() => abrirModalEditar(u)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-accion password"
                        onClick={() => abrirModalPassword(u)}
                      >
                        🔑
                      </button>
                      {u.activo ? (
                        <button
                          type="button"
                          className="btn-accion desactivar"
                          onClick={() => confirmarDesactivar(u)}
                        >
                          ⛔
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-accion activar"
                          onClick={() => confirmarActivar(u)}
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}

        {/* Salones */}
        {seccionActiva === 'salones' && (
          <div className="seccion-contenido">
            <GestionSalones
              colegioId={parseInt(colegioId)}
              colegioNombre={colegio.nombre}
            />
          </div>
        )}

        {/* Retos y Reciclaje */}
        {seccionActiva === 'reciclaje' && (
          <div className="seccion-contenido">
            <div className="seccion-body">
              <GestionRetosReciclaje colegio={colegio} />
            </div>
          </div>
        )}

        {/* Pesaje */}
        {seccionActiva === 'pesaje' && (
          <div className="seccion-contenido">
            <div className="seccion-header seccion-header-centrado">
              <div className="seccion-header-inner-centrado">
                <h2 className="titulo-pesaje">⚖️ Pesaje de reciclaje</h2>
                <p className="seccion-descripcion">
                  Registra el peso de los materiales reciclados por cada salón de este colegio.
                </p>
              </div>
            </div>
            <div className="seccion-body">
              {loadingRetosPesaje ? (
                <p className="texto-auxiliar">Cargando retos...</p>
              ) : retosVisiblesPesaje.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">♻️</span>
                  <p>No hay retos disponibles para pesaje.</p>
                  <p className="seccion-descripcion">
                    Crea un reto de reciclaje o espera a que haya uno activo.
                  </p>
                </div>
              ) : (
                <div className="tabla-retos-pesaje">
                  <table>
                    <thead>
                      <tr>
                        <th>Reto</th>
                        <th>Fechas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retosVisiblesPesaje.map((reto) => {
                        const info = getEstadoRetoInfo(reto);
                        return (
                          <tr key={reto.id}>
                            <td>
                              <div className="nombre-reto">
                                <span className="nombre-reto-texto">
                                  {reto.nombre}
                                </span>
                                {reto.descripcion && (
                                  <span className="nombre-reto-descripcion">
                                    {reto.descripcion}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {reto.fecha_inicio} → {reto.fecha_fin}
                            </td>
                            <td>
                              <span className={info.clase}>{info.texto}</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-primario btn-pesaje-reto"
                                onClick={() => {
                                  navigate(
                                    `/colegios/${colegio.id}/retos/${reto.id}/pesaje`
                                  );
                                }}
                              >
                                Registrar pesaje
                              </button>
                            </td>
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

        {/* Estadísticas */}
        {seccionActiva === 'estadisticas' && (
          <div className="seccion-contenido">
            <div className="seccion-header">
              <div>
                <h2>📊 Estadísticas</h2>
                <p className="seccion-descripcion">
                  Métricas y reportes del colegio
                </p>
              </div>
            </div>

            <div className="seccion-body seccion-estadisticas">
              {/* 1. Resumen general del colegio */}
              <div className="bloque-estadistica">
  <div className="bloque-header">
    <h3>Resumen general del colegio</h3>
   
  </div>

  <div ref={refResumenColegio}>
    {loadingStatsReciclaje ? (
      <p className="texto-auxiliar">
        Cargando estadísticas de reciclaje...
      </p>
    ) : errorStatsReciclaje ? (
      <div className="empty-state">
        <span className="empty-icon">⚠️</span>
        <p>{errorStatsReciclaje}</p>
      </div>
    ) : statsReciclajeColegio ? (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">♻️</div>
          <div className="stat-info">
            <div className="stat-numero">
              {formatear1Decimal(
                statsReciclajeColegio.totales.kilos_totales
              )}{' '}
              kg
            </div>
            <div className="stat-label">Kilos reciclados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-numero">
              {statsReciclajeColegio.totales.num_pesajes}
            </div>
            <div className="stat-label">Pesajes registrados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-info">
            <div className="stat-numero">
              {statsReciclajeColegio.totales.salones_participantes}
            </div>
            <div className="stat-label">
              Salones participantes
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <div className="stat-numero">
              {statsReciclajeColegio.totales.num_retos}
            </div>
            <div className="stat-label">Retos realizados</div>
          </div>
        </div>
      </div>
    ) : (
      <p className="texto-auxiliar">
        Aún no hay datos de reciclaje para este colegio.
      </p>
    )}
  </div>
</div>

              {/* 2. Resumen por reto */}
              <div className="bloque-estadistica">
                <h3>Retos de reciclaje del colegio</h3>

                {statsReciclajeColegio &&
                statsReciclajeColegio.retos &&
                statsReciclajeColegio.retos.length > 0 ? (
                  <div className="tabla-retos-resumen">
                    <table>
                      <thead>
                        <tr>
                          <th>Reto</th>
                          <th>Fechas</th>
                          <th>Puntos por kg</th>
                          <th>Kilos totales</th>
                          <th>Puntos totales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsReciclajeColegio.retos.map((r) => (
                          <tr key={r.id}>
                            <td>{r.nombre}</td>
                            <td>
                              {r.fecha_inicio} → {r.fecha_fin}
                            </td>
                            <td>{formatear1Decimal(r.puntos_por_kilo)}</td>
<td>{formatear1Decimal(r.kilos_totales)} kg</td>
<td>{formatear1Decimal(r.puntos_totales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="texto-auxiliar">
                    Aún no hay retos con pesajes registrados para mostrar
                    resumen.
                  </p>
                )}
              </div>

             {/* 3. Tabla de posiciones por retos */}
<div className="bloque-estadistica">
  <div className="ranking-header">
    <h3>🏆 Tabla de posiciones por retos</h3>

    {retosColegio.length > 0 && (
      <div className="selector-reto-ranking">
        <label>
          Reto:
          <select
            value={retoSeleccionadoRanking?.id || retosColegio[0]?.id || ''}
            onChange={(e) => {
              const idSeleccionado = parseInt(e.target.value, 10);
              const reto = retosColegio.find(
                (r) => r.id === idSeleccionado
              );
              if (reto) {
                setRetoSeleccionadoRanking(reto);
                cargarRankingReto(reto);
              }
            }}
          >
            {retosColegio.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} ({r.fecha_inicio} → {r.fecha_fin})
              </option>
            ))}
          </select>
        </label>
      </div>
    )}

    <button
      type="button"
      className="btn-accion btn-accion-imprimir"
      onClick={() =>
        imprimirSeccion(refTablaPosicionesReto, {
          titulo: 'Tabla de posiciones por reto',
          subtitulo: rankingReto?.reto
            ? `Reto: ${rankingReto.reto.nombre} — Fechas: ${rankingReto.reto.fecha_inicio} → ${rankingReto.reto.fecha_fin}`
            : '',
        })
      }
    >
      🖨️ Imprimir
    </button>
  </div>

  <div ref={refTablaPosicionesReto}>
    {rankingReto &&
      rankingReto.reto &&
      rankingReto.reto.puntos_por_kilo != null && (
        <p className="seccion-descripcion">
          Puntos por kg:{' '}
          {formatear1Decimal(rankingReto.reto.puntos_por_kilo)}{' '}
          (puntos = kilos reciclados × puntos por kg)
        </p>
      )}

    {loadingRanking ? (
      <p className="texto-auxiliar">
        Cargando tabla de posiciones...
      </p>
    ) : errorRanking ? (
      <div className="empty-state">
        <span className="empty-icon">⚠️</span>
        <p>{errorRanking}</p>
      </div>
    ) : !rankingReto ||
      !rankingReto.filas ||
      rankingReto.filas.length === 0 ? (
      <p className="texto-auxiliar">
        El reto "{rankingReto?.reto?.nombre || 'seleccionado'}" todavía no tiene pesajes registrados.
      </p>
    ) : (
      <div className="tabla-ranking-retos">
        <table>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Grado</th>
              <th>Salón</th>
              <th>Pesajes</th>
              <th>Kilos</th>
              <th>Puntos</th>
            </tr>
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
        <div className="nota-pie">
          Generado por EcoApp Escolar
        </div>
      </div>
    )}
  </div>
</div>
            {/* 4. Ranking histórico del colegio */}
<div className="bloque-estadistica">
  <div className="ranking-header">
    <div>
      <h3>🏅 Ranking histórico del colegio</h3>
      <p className="seccion-descripcion">
        Suma de puntos de todos los retos (puntos = kilos × puntos
        por kg de cada reto).
      </p>
    </div>
    <button
      type="button"
      className="btn-accion btn-accion-imprimir"
      onClick={() =>
        imprimirSeccion(refRankingHistorico, {
          titulo: 'Ranking histórico del colegio',
          subtitulo:
            'Suma de puntos de todos los retos (puntos = kilos × puntos por kg de cada reto)',
        })
      }
    >
      🖨️ Imprimir
    </button>
  </div>

  <div ref={refRankingHistorico}>
  {/* Resumen de retos para este colegio */}
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
        <div className="resumen-retos-valor">
          {resumenRetos.porComenzar}
        </div>
      </div>
    </div>
  </div>
    {loadingRankingHistorico ? (
      <p className="texto-auxiliar">
        Cargando ranking histórico...
      </p>
    ) : errorRankingHistorico ? (
      <div className="empty-state">
        <span className="empty-icon">⚠️</span>
        <p>{errorRankingHistorico}</p>
      </div>
    ) : !rankingHistorico || rankingHistorico.length === 0 ? (
      <p className="texto-auxiliar">
        Aún no hay suficientes datos para mostrar un ranking
        histórico.
      </p>
    ) : (
      <div className="tabla-ranking-historico">
        <table>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Grado</th>
              <th>Salón</th>
              <th>Pesajes</th>
              <th>Kilos totales</th>
              <th>Puntos totales</th>
            </tr>
          </thead>
          <tbody>
            {rankingHistorico.map((fila) => (
              <tr key={fila.salon_id}>
                <td className="medalla">
                  {renderMedalla(fila.posicion)}
                </td>
                <td>{fila.grado_nombre}</td>
                <td>{fila.salon_nombre}</td>
                <td>{fila.num_pesajes}</td>
                <td>{formatear1Decimal(fila.kilos)}</td>
                <td>{formatear1Decimal(fila.puntos_totales)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="nota-pie">
          Generado por EcoApp
        </div>
      </div>
    )}
  </div>
</div>
            </div>
          </div>
        )}
      </div>
      
     {/* Stats footer */}
<div className="stats-rapidas-footer">
  <h3 className="stats-title">📊 Estadísticas Generales</h3>
  <div className="stats-grid">
    <div className="stat-card">
      <div className="stat-icon">👥</div>
      <div className="stat-info">
        <div className="stat-numero">{stats.usuarios}</div>
        <div className="stat-label">Usuarios</div>
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-icon">🏫</div>
      <div className="stat-info">
        <div className="stat-numero">{stats.salones}</div>
        <div className="stat-label">Salones</div>
      </div>
    </div>
    <div className="stat-card">
  <div className="stat-icon">♻️</div>
  <div className="stat-info">
    <div className="stat-numero">
      {loadingStatsReciclaje
        ? '...'
        : statsReciclajeColegio?.totales
          ? `${formatear1Decimal(statsReciclajeColegio.totales.kilos_totales)} kg`
          : '0.0 kg'}
    </div>
    <div className="stat-label">Reciclado</div>
  </div>
</div>

<div className="stat-card">
  <div className="stat-icon">🏆</div>
  <div className="stat-info">
    <div className="stat-numero">
      {loadingStatsReciclaje
        ? '...'
        : statsReciclajeColegio
          ? formatear1Decimal(
              (statsReciclajeColegio.retos || []).reduce(
                (suma, r) => suma + (r.puntos_totales || 0),
                0
              )
            )
          : '0.0'}
    </div>
    <div className="stat-label">Puntos</div>
  </div>
</div>
  </div>
</div>

      {/* Modales */}
      {modalUsuario.abierto && (
        <ModalUsuario
          usuario={modalUsuario.usuario}
          modo={modalUsuario.modo}
          colegioId={colegioId}
          onCerrar={() =>
            setModalUsuario({ abierto: false, usuario: null, modo: 'crear' })
          }
          onGuardar={() => {
            setModalUsuario({ abierto: false, usuario: null, modo: 'crear' });
            cargarUsuarios();
            cargarDatos();
          }}
        />
      )}

      {modalPassword.abierto && (
        <ModalCambiarPassword
          usuario={modalPassword.usuario}
          onCerrar={() =>
            setModalPassword({ abierto: false, usuario: null })
          }
        />
      )}

      {modalConfirmar.abierto && (
        <ModalConfirmar
          titulo={modalConfirmar.titulo}
          mensaje={modalConfirmar.mensaje}
          onConfirmar={() => {
            modalConfirmar.onConfirmar();
            setModalConfirmar({
              abierto: false,
              titulo: '',
              mensaje: '',
              onConfirmar: null,
            });
          }}
          onCancelar={() =>
            setModalConfirmar({
              abierto: false,
              titulo: '',
              mensaje: '',
              onConfirmar: null,
            })
          }
        />
      )}
    </div>
  );
}

export default GestionColegio;