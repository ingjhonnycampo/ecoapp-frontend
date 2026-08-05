// frontend/src/pages/GestionPesajeReto.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { pesajesAPI, colegiosAPI, reciclajeAPI } from '../services/api';
import '../styles/GestionPesajeReto.css';

const GRAMOS_POR_LIBRA = 500;

function GestionPesajeReto() {
  const { colegioId, retoId } = useParams();
  const navigate = useNavigate();

  const [salones, setSalones] = useState([]);
  const [unidad, setUnidad] = useState('kg');
  const [pesos, setPesos] = useState({});
  const [loading, setLoading] = useState(true);
  const [colegio, setColegio] = useState(null);
  const [reto, setReto] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);

  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Historial
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historialPesajes, setHistorialPesajes] = useState([]);
  const [historialCargando, setHistorialCargando] = useState(false);
  const [salonHistorial, setSalonHistorial] = useState(null);

  // 🔹 Usuario actual (desde localStorage)
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    try {
      const usuarioStr = localStorage.getItem('usuario');
      if (usuarioStr) {
        // Debe ser algo como: { id, nombre, ... }
        const usuario = JSON.parse(usuarioStr);
        setUsuarioActual(usuario);
      }
    } catch (e) {
      console.error('Error leyendo usuario de localStorage:', e);
    }
  }, []);

  const convertirAGramos = (valor, unidadActual) => {
    const v = parseFloat(valor || '0');
    if (Number.isNaN(v) || v <= 0) return 0;
    if (unidadActual === 'g') return Math.round(v);
    if (unidadActual === 'kg') return Math.round(v * 1000);
    if (unidadActual === 'lb') return Math.round(v * GRAMOS_POR_LIBRA);
    return 0;
  };

  const cargarSalonesConPesos = async () => {
    try {
      setLoading(true);
      const res = await pesajesAPI.getSalonesConPesos(colegioId, retoId);

      let data = res.data;
      if (data && Array.isArray(data.data)) {
        data = data.data;
      }
      if (!Array.isArray(data)) {
        console.warn('Respuesta inesperada en pesajes_reto:', data);
        data = [];
      }

      setSalones(data);
    } catch (error) {
      console.error('Error al cargar salones/pesos:', error);
      setSalones([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarColegio = async () => {
    try {
      const res = await colegiosAPI.getAll();
      const lista = res.data?.data || res.data || [];
      const encontrado = Array.isArray(lista)
        ? lista.find((c) => String(c.id) === String(colegioId))
        : null;
      setColegio(encontrado || null);
    } catch (error) {
      console.error('Error al cargar colegio:', error);
    }
  };

  const cargarReto = async () => {
    try {
      const res = await reciclajeAPI.getRetosPorColegio(colegioId);
      const lista = res.data?.data || res.data || [];
      const encontrado = Array.isArray(lista)
        ? lista.find((r) => String(r.id) === String(retoId))
        : null;
      setReto(encontrado || null);
    } catch (error) {
      console.error('Error al cargar reto:', error);
    }
  };

  useEffect(() => {
    cargarSalonesConPesos();
    cargarColegio();
    cargarReto();
  }, [colegioId, retoId]);

  const handleCambiarPeso = (salonId, valor) => {
    setPesos((prev) => ({ ...prev, [salonId]: valor }));
  };

  const handleAbrirModal = (salon) => {
    setSalonSeleccionado(salon);
    setMostrarModal(true);
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setSalonSeleccionado(null);
  };

  // 🔹 Registrar pesaje enviando usuario_id
  const handleConfirmarRegistrar = async () => {
    if (!salonSeleccionado) return;

    if (!usuarioActual || !usuarioActual.id) {
      alert('No se ha identificado el usuario. Vuelve a iniciar sesión.');
      handleCerrarModal();
      return;
    }

    const salon = salonSeleccionado;
    const valor = pesos[salon.id];
    const gramos = convertirAGramos(valor, unidad);
    if (!gramos) {
      handleCerrarModal();
      return;
    }

    try {
      await pesajesAPI.registrarPesaje({
        reto_id: parseInt(retoId),
        salon_id: salon.id,
        peso_gramos: gramos,
        usuario_id: usuarioActual.id, // 👈 enviamos el usuario que registra
      });

      setPesos((prev) => ({ ...prev, [salon.id]: '' }));
      await cargarSalonesConPesos();

      const nombreGrado = salon.grado_nombre || '';
      const nombreSalon = salon.salon_nombre || '';
      setMensajeExito(
        'Se registró correctamente el pesaje para ' +
          nombreGrado +
          ' - ' +
          nombreSalon +
          '.'
      );
      setMostrarExito(true);
    } catch (error) {
      console.error('Error al registrar pesaje:', error);
    } finally {
      handleCerrarModal();
    }
  };

  const handleVolverColegio = () => {
    navigate('/colegio/' + colegioId + '/gestion?tab=pesaje');
  };

  // ---------- Ranking, posición y colores de filas ----------

  const salonesOrdenados = [...salones].sort((a, b) => {
    const pa = a.peso_total_gramos || 0;
    const pb = b.peso_total_gramos || 0;
    return pb - pa;
  });

  const top1 = salonesOrdenados[0] ? salonesOrdenados[0].id : null;
  const top2 = salonesOrdenados[1] ? salonesOrdenados[1].id : null;
  const top3 = salonesOrdenados[2] ? salonesOrdenados[2].id : null;

  const getMedalla = (salonId) => {
    if (salonId === top1) return '🥇';
    if (salonId === top2) return '🥈';
    if (salonId === top3) return '🥉';
    return null;
  };

  const getPosicionEnReto = (salonId) => {
    const idx = salonesOrdenados.findIndex((s) => s.id === salonId);
    if (idx === -1) return '-';
    return idx + 1;
  };

  const getClaseFilaSalon = (salon) => {
    const tienePeso = (salon.peso_total_gramos || 0) > 0;
    return tienePeso ? 'fila-salon-verde' : 'fila-salon-roja';
  };

  // ---------- Historial de pesajes por salón ----------

  const handleAbrirHistorial = async (salon) => {
    setSalonHistorial(salon);
    setMostrarHistorial(true);
    setHistorialCargando(true);
    setHistorialPesajes([]);

    try {
      const res = await pesajesAPI.getHistorialPesajes(retoId, salon.id);

      // res.data = { success: true, data: [ {...}, {...} ] }
      let data = res.data?.data || [];

      if (!Array.isArray(data)) {
        data = [];
      }

      // Solo pesos > 0 (opcional)
      data = data.filter((item) => Number(item.peso_gramos || 0) > 0);

      // Ordenar del más reciente al más antiguo por created_at
      data.sort((a, b) => {
        const fa = new Date(a.created_at || 0);
        const fb = new Date(b.created_at || 0);
        return fb - fa;
      });

      setHistorialPesajes(data);
    } catch (error) {
      console.error('Error al cargar historial de pesajes:', error);
      setHistorialPesajes([]);
    } finally {
      setHistorialCargando(false);
    }
  };

  const handleCerrarHistorial = () => {
    setMostrarHistorial(false);
    setSalonHistorial(null);
    setHistorialPesajes([]);
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (Number.isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleString();
  };

  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="gestion-pesaje-reto-container">
        <button className="btn-volver" onClick={handleVolverColegio}>
          ← Volver
        </button>
        <p>Cargando salones y pesos...</p>
      </div>
    );
  }

  return (
    <div className="gestion-pesaje-reto-container">
      <button className="btn-volver" onClick={handleVolverColegio}>
        ← Volver
      </button>

      <div className="seccion-header seccion-header-centrado">
        <div className="seccion-header-inner-centrado">
          <h2 className="titulo-pesaje">⚖️ Pesaje por salón</h2>
          <p className="seccion-descripcion">
            {colegio && reto ? (
              <>
                Colegio <strong>{colegio.nombre}</strong> – Reto{' '}
                <strong>{reto.nombre}</strong>
              </>
            ) : colegio ? (
              <>
                Colegio <strong>{colegio.nombre}</strong>
              </>
            ) : reto ? (
              <>
                Reto <strong>{reto.nombre}</strong>
              </>
            ) : (
              <>Cargando información del reto...</>
            )}
          </p>
        </div>
      </div>

      <div className="unidad-selector">
        <span>Registrar en:</span>
        <select
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
        >
          <option value="g">Gramos (g)</option>
          <option value="kg">Kilogramos (kg)</option>
          <option value="lb">Libras (lb)</option>
        </select>
      </div>

      <div className="tabla-pesaje-salones">
        <div className="tabla-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Grado</th>
                <th>Salón</th>
                <th>Posición en el reto</th>
                <th>Peso acumulado (kg)</th>
                <th>Nuevo pesaje ({unidad})</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(salones) &&
                salones.map((salon, index) => {
                  const valorInput = pesos[salon.id] || '';
                  const deshabilitarBoton =
                    !valorInput || Number(valorInput) <= 0;

                  const medalla = getMedalla(salon.id);
                  const claseFila = getClaseFilaSalon(salon);
                  const posicion = getPosicionEnReto(salon.id);

                  return (
                    <tr key={salon.id} className={claseFila}>
                      <td>{index + 1}</td>
                      <td>{salon.grado_nombre || '—'}</td>
                      <td>{salon.salon_nombre}</td>
                      <td className="celda-posicion">
                        <span className="celda-posicion-content">
                          <span className="posicion-numero">{posicion}</span>
                          {medalla && (
                            <span className="medalla-icono">{medalla}</span>
                          )}
                        </span>
                      </td>
                      <td>{(salon.peso_total_gramos / 1000).toFixed(2)} kg</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={valorInput}
                          onChange={(e) =>
                            handleCambiarPeso(salon.id, e.target.value)
                          }
                        />
                      </td>
                      <td className="celda-acciones">
                        <button
                          type="button"
                          className="btn-primario"
                          onClick={() => handleAbrirModal(salon)}
                          disabled={deshabilitarBoton}
                        >
                          Agregar pesaje
                        </button>
                        <button
                          type="button"
                          className="btn-icono-historial"
                          onClick={() => handleAbrirHistorial(salon)}
                          title="Historial"
                        >
                          ⏱️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {Array.isArray(salones) && salones.length === 0 && (
                <tr>
                  <td colSpan="7">
                    No hay salones registrados para este colegio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && salonSeleccionado && (
        <div className="modal-pesaje-backdrop">
          <div className="modal-pesaje">
            <div className="modal-pesaje-icono modal-pesaje-icono-warning">
              !
            </div>
            <h3>Confirmar registro</h3>
            <p>
              ¿Estás seguro de registrar{' '}
              <strong>{pesos[salonSeleccionado.id]}</strong>{' '}
              {unidad === 'g'
                ? 'gramos'
                : unidad === 'kg'
                ? 'kilogramos'
                : 'libras'}{' '}
              para{' '}
              <strong>
                {salonSeleccionado.grado_nombre || ''} -{' '}
                {salonSeleccionado.salon_nombre}
              </strong>
              ?
            </p>
            <p className="modal-pesaje-subtexto">
              Recuerda que en este sistema 1 libra equivale a 500 gramos.
            </p>
            <div className="modal-pesaje-acciones">
              <button type="button" onClick={handleCerrarModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primario"
                onClick={handleConfirmarRegistrar}
              >
                Sí, registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarExito && (
        <div className="modal-exito-backdrop">
          <div className="modal-exito">
            <div className="modal-exito-icono">✓</div>
            <h3>Registro exitoso</h3>
            <p>{mensajeExito}</p>
            <div className="modal-exito-acciones">
              <button
                type="button"
                className="btn-primario"
                onClick={() => setMostrarExito(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarHistorial && (
        <div className="modal-historial-backdrop">
          <div className="modal-historial">
            <h3>
              Historial de pesajes{' '}
              {salonHistorial && (
                <>
                  – {salonHistorial.grado_nombre || ''} -{' '}
                  {salonHistorial.salon_nombre}
                </>
              )}
            </h3>

            {historialCargando ? (
              <p>Cargando historial...</p>
            ) : historialPesajes.length === 0 ? (
              <p>No hay registros de pesaje para este salón en este reto.</p>
            ) : (
              <div className="tabla-historial-wrapper">
                <table className="tabla-historial">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Peso registrado (kg)</th>
                      <th>Registrado por</th>
                      <th>Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPesajes.map((item, index) => {
                      const pesoKg = (item.peso_gramos || 0) / 1000;

                      return (
                        <tr key={item.id || index}>
                          <td>{index + 1}</td>
                          <td>{pesoKg.toFixed(2)} kg</td>
                          <td>{item.usuario_nombre || 'Usuario desconocido'}</td>
                          <td>{formatearFechaHora(item.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-historial-acciones">
              <button
                type="button"
                className="btn-primario"
                onClick={handleCerrarHistorial}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionPesajeReto;