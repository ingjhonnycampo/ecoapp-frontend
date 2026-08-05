// frontend/src/pages/RegistrarReciclaje.jsx
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { reciclajeAPI } from '../services/api';
import GestionRetosReciclaje from '../components/GestionRetosReciclaje';
import '../components/GestionColegio.css';

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

function getEstadoRetoInfo(reto) {
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
}

function PestanaPesaje({ colegioId }) {
  const navigate = useNavigate();
  const [retos, setRetos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!colegioId) return;

    const cargarRetos = async () => {
      try {
        setLoading(true);
        const res = await reciclajeAPI.getRetosPorColegio(colegioId);
        setRetos(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Error al cargar retos para pesaje:', err);
        setRetos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarRetos();
  }, [colegioId]);

  // El coordinador solo pesa retos activos (por fecha), igual que en el panel del administrador
  const retosVisibles = retos.filter((reto) => calcularEstadoRetoPorFecha(reto) === 'activo');

  return (
    <div className="seccion-contenido">
      <div className="seccion-header seccion-header-centrado">
        <div className="seccion-header-inner-centrado">
          <h2 className="titulo-pesaje">⚖️ Pesaje de reciclaje</h2>
          <p className="seccion-descripcion">
            Registra el peso de los materiales reciclados por cada salón.
          </p>
        </div>
      </div>
      <div className="seccion-body">
        {loading ? (
          <p className="texto-auxiliar">Cargando retos...</p>
        ) : retosVisibles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">♻️</span>
            <p>No hay retos activos para pesaje en este momento.</p>
            <p className="seccion-descripcion">
              Crea un reto en la pestaña &quot;Retos&quot; o espera a que uno esté activo.
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
                {retosVisibles.map((reto) => {
                  const info = getEstadoRetoInfo(reto);
                  return (
                    <tr key={reto.id}>
                      <td>
                        <div className="nombre-reto">
                          <span className="nombre-reto-texto">{reto.nombre}</span>
                          {reto.descripcion && (
                            <span className="nombre-reto-descripcion">{reto.descripcion}</span>
                          )}
                        </div>
                      </td>
                      <td>{reto.fecha_inicio} → {reto.fecha_fin}</td>
                      <td><span className={info.clase}>{info.texto}</span></td>
                      <td>
                        <button
                          type="button"
                          className="btn-primario btn-pesaje-reto"
                          onClick={() => navigate(`/colegios/${colegioId}/retos/${reto.id}/pesaje`)}
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
  );
}

function RegistrarReciclaje() {
  const { usuario, colegio } = useContext(AuthContext);
  const [tabActiva, setTabActiva] = useState('pesaje');

  if (!usuario?.colegio_id) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>⚠️ Sin colegio asignado</h2>
        <p>Tu usuario no tiene un colegio asignado. Contacta al administrador.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div className="gestion-nav">
        <button
          className={`nav-btn ${tabActiva === 'pesaje' ? 'active' : ''}`}
          onClick={() => setTabActiva('pesaje')}
        >
          <span className="nav-icon">⚖️</span>
          <span className="nav-text">Pesaje</span>
        </button>
        <button
          className={`nav-btn ${tabActiva === 'retos' ? 'active' : ''}`}
          onClick={() => setTabActiva('retos')}
        >
          <span className="nav-icon">♻️</span>
          <span className="nav-text">Retos</span>
        </button>
      </div>

      {tabActiva === 'pesaje' && <PestanaPesaje colegioId={usuario.colegio_id} />}

      {tabActiva === 'retos' && (
        <div className="seccion-contenido">
          <div className="seccion-body">
            <GestionRetosReciclaje colegio={colegio} />
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarReciclaje;
