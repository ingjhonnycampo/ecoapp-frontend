// frontend/src/pages/UsuariosColegio.jsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import ModalUsuario from '../components/ModalUsuario';
import ModalConfirmar from '../components/ModalConfirmar';
import ModalCambiarPassword from '../components/ModalCambiarPassword';
import '../components/GestionColegio.css';

function UsuariosColegio() {
  const { usuario, colegio } = useContext(AuthContext);

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  const [modalUsuario, setModalUsuario] = useState({ abierto: false, usuario: null, modo: 'crear' });
  const [modalConfirmar, setModalConfirmar] = useState({ abierto: false, titulo: '', mensaje: '', onConfirmar: null });
  const [modalPassword, setModalPassword] = useState({ abierto: false, usuario: null });

  const colegioId = usuario?.colegio_id;

  useEffect(() => {
    if (colegioId) {
      cargarUsuarios();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colegioId]);

  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroNombre, filtroRol, usuarios]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/usuarios_colegio.php?colegio_id=${colegioId}`
      );
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
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

  const abrirModalEditar = (u) => {
    setModalUsuario({ abierto: true, usuario: u, modo: 'editar' });
  };

  const abrirModalPassword = (u) => {
    setModalPassword({ abierto: true, usuario: u });
  };

  const confirmarDesactivar = (u) => {
    setModalConfirmar({
      abierto: true,
      titulo: 'Desactivar Usuario',
      mensaje: `¿Estás seguro de desactivar a ${u.nombre}? El usuario no podrá acceder al sistema.`,
      onConfirmar: () => desactivarUsuario(u.id),
    });
  };

  const confirmarActivar = (u) => {
    setModalConfirmar({
      abierto: true,
      titulo: 'Activar Usuario',
      mensaje: `¿Deseas activar a ${u.nombre}?`,
      onConfirmar: () => activarUsuario(u.id),
    });
  };

  const desactivarUsuario = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/usuarios_colegio.php?id=${id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        await cargarUsuarios();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setModalConfirmar({ abierto: false, titulo: '', mensaje: '', onConfirmar: null });
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
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setModalConfirmar({ abierto: false, titulo: '', mensaje: '', onConfirmar: null });
    }
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
          <h2>👥 Usuarios</h2>
          <p className="seccion-descripcion">
            Estudiantes y usuarios registrados en {colegio?.nombre}
          </p>
        </div>
        <div className="seccion-header-actions">
          <button className="btn-primario" onClick={abrirModalCrear}>
            + Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="seccion-body">
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
              <option value="estudiante">Estudiante</option>
              <option value="coordinador">Coordinador</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="texto-auxiliar">Cargando usuarios...</p>
        ) : usuariosFiltrados.length === 0 ? (
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
                      <span className={`badge-rol-tabla ${u.rol}`}>{u.rol}</span>
                    </td>
                    <td>
                      <span className={u.activo ? 'badge-estado activo' : 'badge-estado inactivo'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-cell">
                        <button
                          type="button"
                          className="btn-accion editar"
                          onClick={() => abrirModalEditar(u)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn-accion password"
                          onClick={() => abrirModalPassword(u)}
                          title="Restablecer contraseña"
                        >
                          🔑
                        </button>
                        {u.activo ? (
                          <button
                            type="button"
                            className="btn-accion desactivar"
                            onClick={() => confirmarDesactivar(u)}
                            title="Desactivar"
                          >
                            ⛔
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-accion activar"
                            onClick={() => confirmarActivar(u)}
                            title="Activar"
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

      {modalUsuario.abierto && (
        <ModalUsuario
          usuario={modalUsuario.usuario}
          modo={modalUsuario.modo}
          colegioId={colegioId}
          soloEstudiantes
          onCerrar={() => setModalUsuario({ abierto: false, usuario: null, modo: 'crear' })}
          onGuardar={() => {
            setModalUsuario({ abierto: false, usuario: null, modo: 'crear' });
            cargarUsuarios();
          }}
        />
      )}

      {modalPassword.abierto && (
        <ModalCambiarPassword
          usuario={modalPassword.usuario}
          onCerrar={() => setModalPassword({ abierto: false, usuario: null })}
        />
      )}

      {modalConfirmar.abierto && (
        <ModalConfirmar
          titulo={modalConfirmar.titulo}
          mensaje={modalConfirmar.mensaje}
          onConfirmar={modalConfirmar.onConfirmar}
          onCancelar={() => setModalConfirmar({ abierto: false, titulo: '', mensaje: '', onConfirmar: null })}
        />
      )}
    </div>
  );
}

export default UsuariosColegio;
