import { useState, useEffect, useContext } from 'react';
import { reciclajeAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './GestionRetosReciclaje.css';

function GestionRetosReciclaje({ colegio }) {
  const { user } = useContext(AuthContext);

  const [retos, setRetos] = useState([]);
  const [salones, setSalones] = useState([]);
  const [salonesSeleccionados, setSalonesSeleccionados] = useState([]);

  const [loading, setLoading] = useState(false);        // crear/editar
  const [loadingRetos, setLoadingRetos] = useState(false);
  const [eliminando, setEliminando] = useState(false);  // eliminar

  const [error, setError] = useState(null);
  const [mensajeOk, setMensajeOk] = useState('');

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  // ya no pedimos estado en el formulario
  const [estado] = useState('borrador');

  // 🔹 Nuevo: puntos por kilo
  const [puntosPorKilo, setPuntosPorKilo] = useState('1');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [retoEnEdicion, setRetoEnEdicion] = useState(null);

  // Modal detalle
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [retoDetalle, setRetoDetalle] = useState(null);

  // Modal eliminar
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [retoAEliminar, setRetoAEliminar] = useState(null);

  const ordenarSalones = (lista) => {
    if (!lista || lista.length === 0) return [];
    if (lista[0].grado_numero === undefined && lista[0].orden === undefined) {
      return [...lista];
    }
    return [...lista].sort((a, b) => {
      const ga = a.grado_numero ?? a.orden ?? 0;
      const gb = b.grado_numero ?? b.orden ?? 0;
      return ga - gb;
    });
  };

  const cargarRetos = async () => {
    try {
      setLoadingRetos(true);
      setError(null);
      const res = await reciclajeAPI.getRetosPorColegio(colegio.id);
      setRetos(res.data.data || res.data || []);
    } catch (err) {
      console.error('Error al cargar retos:', err);
      setError('No se pudieron cargar los retos de reciclaje.');
    } finally {
      setLoadingRetos(false);
    }
  };

  const cargarSalones = async () => {
    try {
      const res = await reciclajeAPI.getSalonesPorColegio(colegio.id);
      const data = res.data.data || res.data || [];
      setSalones(ordenarSalones(data));
    } catch (err) {
      console.error('Error al cargar salones:', err);
      setError('No se pudieron cargar los salones del colegio.');
    }
  };

  useEffect(() => {
    if (colegio && colegio.id) {
      cargarRetos();
      cargarSalones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colegio]);

  // Auto-cierre toasts
  useEffect(() => {
    if (!mensajeOk) return;
    const t = setTimeout(() => setMensajeOk(''), 3500);
    return () => clearTimeout(t);
  }, [mensajeOk]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const toggleSalonSeleccionado = (salonId) => {
    setSalonesSeleccionados((prev) =>
      prev.includes(salonId)
        ? prev.filter((id) => id !== salonId)
        : [...prev, salonId]
    );
  };

  const seleccionarTodosSalones = () => {
    if (salonesSeleccionados.length === salones.length) {
      setSalonesSeleccionados([]);
    } else {
      const todosIds = salones.map((s) => s.id);
      setSalonesSeleccionados(todosIds);
    }
  };

  const validarFechas = () => {
    if (!fechaInicio || !fechaFin) return true;
    return fechaFin >= fechaInicio;
  };

  const limpiarFormulario = () => {
    setNombre('');
    setDescripcion('');
    setFechaInicio('');
    setFechaFin('');
    setSalonesSeleccionados([]);
    setRetoEnEdicion(null);
    setPuntosPorKilo('1'); // valor por defecto
  };

  const handleSubmitReto = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeOk('');

    if (!nombre || !fechaInicio || !fechaFin) {
      setError('Nombre, fecha de inicio y fecha de fin son obligatorios.');
      return;
    }

    if (!validarFechas()) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    if (salonesSeleccionados.length === 0) {
      setError('Selecciona al menos un salón participante para el reto.');
      return;
    }

    const valorPuntos = parseFloat(puntosPorKilo || '0');
    if (Number.isNaN(valorPuntos) || valorPuntos <= 0) {
      setError('Los puntos por kilogramo deben ser un número mayor que 0.');
      return;
    }

    const payload = {
      colegio_id: colegio.id,
      nombre,
      descripcion,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado, // se guarda como 'borrador', pero la UI calcula el estado real
      salones_ids: salonesSeleccionados,
      puntos_por_kilo: valorPuntos, // 🔹 nuevo campo que va al backend
      ...(retoEnEdicion ? {} : { created_by: user ? user.id : null }),
    };

    try {
      setLoading(true);

      if (retoEnEdicion) {
        await reciclajeAPI.actualizarReto(retoEnEdicion.id, payload);
        setMensajeOk('Reto actualizado correctamente.');
      } else {
        await reciclajeAPI.crearReto(payload);
        setMensajeOk('Reto creado correctamente.');
      }

      limpiarFormulario();
      setMostrarForm(false);
      await cargarRetos();
    } catch (err) {
      console.error('Error al guardar reto:', err);
      setError(
        retoEnEdicion
          ? 'No se pudo actualizar el reto. Inténtalo de nuevo.'
          : 'No se pudo crear el reto. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const extraerSalonesIdsDeReto = (reto) => {
    if (!reto) return [];
    if (Array.isArray(reto.salones_ids)) {
      return reto.salones_ids;
    }
    if (Array.isArray(reto.salones)) {
      return reto.salones.map((s) => s.salon_id || s.id).filter(Boolean);
    }
    return [];
  };

  const manejarClickEditar = (reto) => {
    setRetoEnEdicion(reto);
    setNombre(reto.nombre || '');
    setDescripcion(reto.descripcion || '');
    setFechaInicio(reto.fecha_inicio || '');
    setFechaFin(reto.fecha_fin || '');

    // puntos_por_kilo puede venir como número o string desde la API
    const pk = reto.puntos_por_kilo != null ? String(reto.puntos_por_kilo) : '1';
    setPuntosPorKilo(pk);

    const salonesIds = extraerSalonesIdsDeReto(reto);
    setSalonesSeleccionados(salonesIds);

    setMostrarForm(true);
    setMensajeOk('');
    setError(null);
  };

  const abrirModalEliminar = (reto) => {
    setRetoAEliminar(reto);
    setMostrarModalEliminar(true);
  };

  const cerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setRetoAEliminar(null);
  };

  const confirmarEliminarReto = async () => {
    if (!retoAEliminar) return;
    setError(null);

    try {
      setEliminando(true);
      await reciclajeAPI.eliminarReto(retoAEliminar.id);
      setMensajeOk(`Reto "${retoAEliminar.nombre}" eliminado correctamente.`);
      await cargarRetos();
    } catch (err) {
      console.error('Error al eliminar reto:', err);
      setError('No se pudo eliminar el reto. Intenta nuevamente.');
    } finally {
      setEliminando(false);
      cerrarModalEliminar();
    }
  };

  // Modal detalle
  const abrirModalDetalle = (reto) => {
    setRetoDetalle(reto);
    setMostrarModalDetalle(true);
  };

  const cerrarModalDetalle = () => {
    setMostrarModalDetalle(false);
    setRetoDetalle(null);
  };

  // Estado derivado por fecha (fin del día a las 23:59:59)
  const calcularEstadoPorFecha = (reto) => {
    if (!reto.fecha_inicio || !reto.fecha_fin) {
      return reto.estado || 'borrador';
    }

    const hoy = new Date(); // hora actual

    const [yIni, mIni, dIni] = reto.fecha_inicio.split('-').map(Number);
    const [yFin, mFin, dFin] = reto.fecha_fin.split('-').map(Number);

    // Inicio: 00:00 del día
    const inicio = new Date(yIni, mIni - 1, dIni, 0, 0, 0);
    // Fin: 23:59:59 del día
    const fin = new Date(yFin, mFin - 1, dFin, 23, 59, 59);

    if (hoy < inicio) return 'por_comenzar';
    if (hoy > fin) return 'cerrado';
    return 'activo';
  };

  const getEstadoInfo = (reto) => {
    const estadoCalc = calcularEstadoPorFecha(reto);

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

  return (
    <div className="gestion-retos-reciclaje">
      {/* Toast éxito */}
      {mensajeOk && (
        <div className="toast toast-exito">
          <span className="toast-icono">✅</span>
          <span>{mensajeOk}</span>
        </div>
      )}

      {/* Toast error */}
      {error && (
        <div className="toast toast-error">
          <span className="toast-icono">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Header principal */}
      <div className="header-retos">
        <div className="header-retos-inner">
          <h2 className="titulo-seccion-retos">
            ♻️ Gestión de Reciclaje
          </h2>
          <p className="descripcion-seccion-retos">
            Crea retos de reciclaje y asigna los salones participantes de este colegio.
          </p>
        </div>
        <div className="acciones-retos">
          <button
            type="button"
            className="btn-primario"
            onClick={() => {
              if (!mostrarForm) limpiarFormulario();
              setMostrarForm((v) => !v);
              setError(null);
              setMensajeOk('');
            }}
          >
            {mostrarForm ? 'Cancelar' : '➕ Nuevo reto'}
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div
          className={
            'card-retos form-retos' +
            (retoEnEdicion ? ' form-retos-editando' : '')
          }
        >
          <div className="form-header">
            <h3 className="form-title">
              {retoEnEdicion ? 'Editar reto' : 'Crear nuevo reto'}
            </h3>
            {retoEnEdicion && (
              <span className="badge-editando">
                Editando: {retoEnEdicion.nombre}
              </span>
            )}
          </div>
          <form onSubmit={handleSubmitReto} className="form-retos-grid">
            <div className="form-group">
              <label>Nombre del reto</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Reto Semana Ambiental 2026"
              />
            </div>

            <div className="form-group form-group-full">
              <label>Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Objetivo del reto, condiciones, etc."
              />
            </div>

            <div className="form-group">
              <label>Fecha de inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Fecha de fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            {/* 🔹 Nuevo: puntos por kilo */}
            <div className="form-group">
              <label>Puntos por kilogramo</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={puntosPorKilo}
                onChange={(e) => setPuntosPorKilo(e.target.value)}
                placeholder="Ej. 1, 2.5, 3..."
              />
              <small className="texto-auxiliar">
                Se usará para calcular los puntos: puntos = kilos reciclados × puntos por kg.
              </small>
            </div>

            <div className="form-group form-group-full">
              <label>Salones participantes</label>

              {salones.length === 0 && (
                <p className="texto-auxiliar">
                  No hay salones activos para este colegio.
                </p>
              )}

              {salones.length > 0 && (
                <>
                  <div className="select-all-salones">
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          salones.length > 0 &&
                          salonesSeleccionados.length === salones.length
                        }
                        onChange={seleccionarTodosSalones}
                      />
                      <span>
                        Seleccionar todos los salones
                        {salonesSeleccionados.length > 0 &&
                          ` (${salonesSeleccionados.length} seleccionados)`}
                      </span>
                    </label>
                  </div>

                  <div className="lista-salones-participantes">
                    {salones.map((salon) => (
                      <label key={salon.id} className="item-salon">
                        <input
                          type="checkbox"
                          checked={salonesSeleccionados.includes(salon.id)}
                          onChange={() => toggleSalonSeleccionado(salon.id)}
                        />
                        <span className="texto-salon">
                          {salon.grado_nombre} - {salon.nombre}
                          {salon.jornada ? ` (${salon.jornada})` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primario"
                disabled={loading}
              >
                {loading
                  ? 'Guardando...'
                  : retoEnEdicion
                  ? 'Guardar cambios'
                  : 'Crear reto'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-retos lista-retos">
        <div className="lista-retos-header">
          <h3>Retos existentes</h3>
          {retos.length > 0 && (
            <span className="badge-conteo">
              {retos.length} reto{retos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingRetos && retos.length === 0 && (
          <p className="texto-auxiliar">Cargando retos...</p>
        )}

        {!loadingRetos && retos.length === 0 && (
          <div className="empty-state-retos">
            <p>No hay retos creados aún.</p>
            <p className="texto-auxiliar">
              Crea el primer reto para motivar a los salones a reciclar.
            </p>
          </div>
        )}

        {retos.length > 0 && (
          <div className="tabla-retos-wrapper">
            <table className="tabla-retos">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fechas</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {retos.map((reto) => {
                  const info = getEstadoInfo(reto);
                  return (
                    <tr key={reto.id}>
                      <td className="celda-nombre-reto">
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
                      <td className="celda-fechas">
                        <span className="texto-fecha">
                          {reto.fecha_inicio} → {reto.fecha_fin}
                        </span>
                      </td>
                      <td className="celda-estado">
                        <span className={info.clase}>{info.texto}</span>
                      </td>
                      <td className="celda-creado">
                        <span className="texto-fecha">
                          {reto.created_at}
                        </span>
                      </td>
                      <td className="celda-acciones-reto">
                        <button
                          type="button"
                          className="btn-icono ver"
                          onClick={() => abrirModalDetalle(reto)}
                          title="Ver detalle del reto"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="btn-icono editar"
                          onClick={() => manejarClickEditar(reto)}
                          title="Editar reto"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn-icono eliminar"
                          onClick={() => abrirModalEliminar(reto)}
                          title="Eliminar reto"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Vista móvil */}
            <div className="lista-retos-mobile">
              {retos.map((reto) => {
                const info = getEstadoInfo(reto);
                return (
                  <div key={reto.id} className="reto-card-mobile">
                    <div className="reto-card-header">
                      <span className={info.clase}>{info.texto}</span>
                    </div>
                    <div className="reto-card-body">
                      <h4>{reto.nombre}</h4>
                      {reto.descripcion && (
                        <p className="reto-card-descripcion">
                          {reto.descripcion}
                        </p>
                      )}
                      <p className="reto-card-fechas">
                        {reto.fecha_inicio} → {reto.fecha_fin}
                      </p>
                      <p className="reto-card-creado">
                        Creado: {reto.created_at}
                      </p>
                    </div>
                    <div className="reto-card-footer">
                      <button
                        type="button"
                        className="btn-icono ver"
                        onClick={() => abrirModalDetalle(reto)}
                        title="Ver detalle del reto"
                      >
                        👁️
                      </button>
                      <button
                        type="button"
                        className="btn-icono editar"
                        onClick={() => manejarClickEditar(reto)}
                        title="Editar reto"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icono eliminar"
                        onClick={() => abrirModalEliminar(reto)}
                        title="Eliminar reto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle del reto - ancho */}
      {mostrarModalDetalle && retoDetalle && (
        <div className="modal-overlay modal-detalle-overlay">
          <div className="modal-detalle-panel">
            <div className="modal-detalle-header">
              <div>
                <h3 className="modal-detalle-titulo">Detalle del reto de reciclaje</h3>
                <p className="modal-detalle-subtitulo">
                  Revisa la información completa del reto y los salones participantes.
                </p>
              </div>
              <button
                type="button"
                className="modal-detalle-cerrar"
                onClick={cerrarModalDetalle}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="modal-detalle-body">
              {/* Columna izquierda: info del reto */}
              <div className="modal-detalle-col">
                <h4 className="detalle-reto-nombre">{retoDetalle.nombre}</h4>
                {retoDetalle.descripcion && (
                  <p className="detalle-reto-descripcion">
                    {retoDetalle.descripcion}
                  </p>
                )}

                <div className="detalle-reto-datos-grid">
                  <div className="detalle-item">
                    <span className="detalle-label">Fecha de inicio</span>
                    <span className="detalle-valor">{retoDetalle.fecha_inicio}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Fecha de fin</span>
                    <span className="detalle-valor">{retoDetalle.fecha_fin}</span>
                  </div>
                  {(() => {
                    const info = getEstadoInfo(retoDetalle);
                    return (
                      <div className="detalle-item">
                        <span className="detalle-label">Estado</span>
                        <span className={`detalle-estado-pill ${info.clase}`}>
                          {info.texto}
                        </span>
                      </div>
                    );
                  })()}
                  {retoDetalle.puntos_por_kilo != null && (
                    <div className="detalle-item">
                      <span className="detalle-label">Puntos por kg</span>
                      <span className="detalle-valor">
                        {Number(retoDetalle.puntos_por_kilo).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {retoDetalle.created_at && (
                    <div className="detalle-item">
                      <span className="detalle-label">Creado</span>
                      <span className="detalle-valor">{retoDetalle.created_at}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna derecha: salones */}
              <div className="modal-detalle-col modal-detalle-col-salones">
                <h4 className="detalle-reto-nombre">Salones participantes</h4>
                {(() => {
                  const ids = extraerSalonesIdsDeReto(retoDetalle);
                  const salonesReto = salones.filter((s) => ids.includes(s.id));

                  if (salonesReto.length === 0) {
                    return (
                      <p className="texto-auxiliar">
                        Este reto no tiene salones asignados.
                      </p>
                    );
                  }

                  return (
                    <ul className="lista-salones-detalle">
                      {salonesReto.map((s) => (
                        <li key={s.id}>
                          <span className="salon-titulo">
                            {s.grado_nombre} - {s.nombre}
                          </span>
                          {s.jornada && (
                            <span className="salon-jornada">Jornada: {s.jornada}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            </div>

            <div className="modal-detalle-footer">
              <button
                type="button"
                className="btn-secundario"
                onClick={cerrarModalDetalle}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {mostrarModalEliminar && retoAEliminar && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <h3 className="modal-titulo">Eliminar reto</h3>
            <p className="modal-texto">
              ¿Seguro que quieres eliminar el reto
              <span className="modal-resaltado">
                {' '}
                "{retoAEliminar.nombre}"
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="modal-acciones">
              <button
                type="button"
                className="btn-secundario"
                onClick={cerrarModalEliminar}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-peligro"
                onClick={confirmarEliminarReto}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionRetosReciclaje;