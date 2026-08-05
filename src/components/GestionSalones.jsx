import { useState, useEffect } from 'react';
import './GestionSalones.css';
import ModalMensaje from './ModalMensaje';
import ModalConfirmar from './ModalConfirmar';

function GestionSalones({ colegioId, colegioNombre }) {
    const [modalMensaje, setModalMensaje] = useState({ mostrar: false, tipo: '', mensaje: '' }); 
    const [modalConfirmar, setModalConfirmar] = useState({ mostrar: false, titulo: '', mensaje: '', onConfirmar: null });
    const [salones, setSalones] = useState([]);
    const [grados, setGrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [salonSeleccionado, setSalonSeleccionado] = useState(null);
    const [filtroGrado, setFiltroGrado] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        grado_id: '',
        jornada: '',
        orden: ''
    });

    useEffect(() => {
        cargarGrados();
        cargarSalones();
    }, [colegioId]);

    const cargarGrados = async () => {
        try {
            const response = await fetch(`http://localhost/reciclaje-app/backend/api/grados_estandar.php`);
            const data = await response.json();
            if (data.success) {
                setGrados(data.data);
            }
        } catch (error) {
            console.error('Error al cargar grados:', error);
        }
    };

    const cargarSalones = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost/reciclaje-app/backend/api/salones.php?colegio_id=${colegioId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setSalones(data.data);
            }
        } catch (error) {
            console.error('Error al cargar salones:', error);
        } finally {
            setLoading(false);
        }
    };

    const mostrarMensaje = (tipo, mensaje, titulo = null) => {
        setModalMensaje({ mostrar: true, tipo, mensaje, titulo });
    };

    const abrirModalCrear = () => {
        setModoEdicion(false);
        setSalonSeleccionado(null);
        setFormData({
            nombre: '',
            grado_id: '',
            jornada: '',
            orden: ''
        });
        setModalAbierto(true);
    };

    const abrirModalEditar = (salon) => {
        setModoEdicion(true);
        setSalonSeleccionado(salon);
        setFormData({
            nombre: salon.nombre,
            grado_id: salon.grado_id,
            jornada: salon.jornada || '',
            orden: salon.orden || ''
        });
        setModalAbierto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const url = modoEdicion 
            ? `http://localhost/reciclaje-app/backend/api/salones.php?id=${salonSeleccionado.id}`
            : 'http://localhost/reciclaje-app/backend/api/salones.php';
        const method = modoEdicion ? 'PUT' : 'POST';

        const dataToSend = {
            ...formData,
            colegio_id: colegioId
        };

        if (modoEdicion) {
            dataToSend.id = salonSeleccionado.id;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (data.success) {
                mostrarMensaje('exito', data.message);
                setModalAbierto(false);
                cargarSalones();
            } else {
                mostrarMensaje('error', data.message);
            }
        } catch (error) {
            mostrarMensaje('error', 'Error al guardar el salón. Intenta nuevamente.');
        }
    };

    const confirmarCambiarEstado = (salon) => {
        setModalConfirmar({
            mostrar: true,
            titulo: salon.activo ? 'Desactivar Salón' : 'Activar Salón',
            mensaje: `¿Estás seguro de ${salon.activo ? 'desactivar' : 'activar'} el salón ${salon.nombre_completo}?`,
            onConfirmar: () => cambiarEstado(salon)
        });
    };

    const cambiarEstado = async (salon) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost/reciclaje-app/backend/api/salones.php?id=${salon.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: salon.id,
                    activo: salon.activo ? 0 : 1
                })
            });

            const data = await response.json();
            if (data.success) {
                cargarSalones();
                mostrarMensaje('exito', `Salón ${salon.activo ? 'desactivado' : 'activado'} correctamente`);
            } else {
                mostrarMensaje('error', data.message);
            }
        } catch (error) {
            mostrarMensaje('error', 'Error al cambiar estado del salón');
        }
    };

    const confirmarEliminar = (salon) => {
        setModalConfirmar({
            mostrar: true,
            titulo: 'Eliminar Salón',
            mensaje: `¿Estás seguro de eliminar el salón ${salon.nombre_completo}?\n\nEsta acción no se puede deshacer.`,
            onConfirmar: () => eliminarSalon(salon)
        });
    };

    const eliminarSalon = async (salon) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost/reciclaje-app/backend/api/salones.php?id=${salon.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                mostrarMensaje('exito', data.message);
                cargarSalones();
            } else {
                mostrarMensaje('error', data.message);
            }
        } catch (error) {
            mostrarMensaje('error', 'Error al eliminar el salón');
        }
    };

    // AJUSTE: filtro por NOMBRE de grado, que coincide con grado_nombre
    const salonesFiltrados = salones.filter((salon) => {
        const textoBusqueda = busqueda.toLowerCase();

        const cumpleBusqueda =
            salon.nombre.toLowerCase().includes(textoBusqueda) ||
            salon.nombre_completo.toLowerCase().includes(textoBusqueda);

        const cumpleGrado =
            filtroGrado === '' || salon.grado_nombre === filtroGrado;

        return cumpleBusqueda && cumpleGrado;
    });

    return (
        <div className="gestion-salones">
            <div className="header-salones">
                <div>
                    <h2>🚪 Gestión de Salones</h2>
                    <p className="subtitulo-colegio">{colegioNombre}</p>
                </div>
                <button className="btn-crear" onClick={abrirModalCrear}>
                    ➕ Nuevo Salón
                </button>
            </div>

            <div className="filtros-salones">
                <input
                    type="text"
                    placeholder="🔍 Buscar salón..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="input-busqueda"
                />
                {/* AJUSTE: el value es el NOMBRE del grado */}
                <select
                    value={filtroGrado}
                    onChange={(e) => setFiltroGrado(e.target.value)}
                    className="filtro-grado"
                >
                    <option value="">Todos los grados</option>
                    {grados.map((grado) => (
                        <option key={grado.id} value={grado.nombre}>
                            {grado.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading">⏳ Cargando salones...</div>
            ) : (
                <div className="tabla-container">
                    <table className="tabla-salones">
                        <thead>
                            <tr>
                                <th>Grado</th>
                                <th>Salón</th>
                                <th>Jornada</th>
                                <th>Estudiantes</th>
                                <th>Orden</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salonesFiltrados.length > 0 ? (
                                salonesFiltrados.map((salon) => (
                                    <tr key={salon.id} className={!salon.activo ? 'inactivo' : ''}>
                                        <td>{salon.grado_nombre}</td>
                                        <td><strong>{salon.nombre}</strong></td>
                                        <td>{salon.jornada || '-'}</td>
                                        <td className="centro">{salon.total_estudiantes}</td>
                                        <td className="centro">{salon.orden}</td>
                                        <td>
                                            <span className={`badge ${salon.activo ? 'activo' : 'inactivo'}`}>
                                                {salon.activo ? '✅ Activo' : '❌ Inactivo'}
                                            </span>
                                        </td>
                                        <td className="acciones">
                                            <button
                                                className="btn-icon btn-editar"
                                                onClick={() => abrirModalEditar(salon)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon btn-estado"
                                                onClick={() => confirmarCambiarEstado(salon)}
                                                title={salon.activo ? 'Desactivar' : 'Activar'}
                                            >
                                                {salon.activo ? '🔴' : '🟢'}
                                            </button>
                                            <button
                                                className="btn-icon btn-eliminar"
                                                onClick={() => confirmarEliminar(salon)}
                                                title="Eliminar"
                                                disabled={salon.total_estudiantes > 0}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        📭 No se encontraron salones
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="total-info">
                <p>
                    Total de salones: <strong>{salonesFiltrados.length}</strong>
                </p>
            </div>

            {/* MODAL CREAR/EDITAR */}
            {modalAbierto && (
                <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modoEdicion ? '✏️ Editar Salón' : '➕ Nuevo Salón'}</h3>
                            <button className="btn-cerrar" onClick={() => setModalAbierto(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Grado *</label>
                                <select
                                    value={formData.grado_id}
                                    onChange={(e) => setFormData({ ...formData, grado_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar grado</option>
                                    {grados.map((grado) => (
                                        <option key={grado.id} value={grado.id}>
                                            {grado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Nombre del Salón *</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: A, B, 01, 02"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Jornada</label>
                                <select
                                    value={formData.jornada}
                                    onChange={(e) => setFormData({ ...formData, jornada: e.target.value })}
                                >
                                    <option value="">Sin jornada</option>
                                    <option value="Mañana">Mañana</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Única">Única</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Orden</label>
                                <input
                                    type="number"
                                    value={formData.orden}
                                    onChange={(e) => setFormData({ ...formData, orden: e.target.value })}
                                    placeholder="Ej: 1, 2, 3..."
                                    min="1"
                                />
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="btn-cancelar"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar">
                                    {modoEdicion ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE MENSAJE */}
            {modalMensaje.mostrar && (
                <ModalMensaje
                    tipo={modalMensaje.tipo}
                    titulo={modalMensaje.titulo}
                    mensaje={modalMensaje.mensaje}
                    onCerrar={() =>
                        setModalMensaje({ mostrar: false, tipo: '', mensaje: '' })
                    }
                />
            )}

            {/* MODAL DE CONFIRMACIÓN */}
            {modalConfirmar.mostrar && (
                <ModalConfirmar
                    titulo={modalConfirmar.titulo}
                    mensaje={modalConfirmar.mensaje}
                    onConfirmar={() => {
                        modalConfirmar.onConfirmar();
                        setModalConfirmar({
                            mostrar: false,
                            titulo: '',
                            mensaje: '',
                            onConfirmar: null
                        });
                    }}
                    onCancelar={() =>
                        setModalConfirmar({
                            mostrar: false,
                            titulo: '',
                            mensaje: '',
                            onConfirmar: null
                        })
                    }
                />
            )}
        </div>
    );
}

export default GestionSalones;