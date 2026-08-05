import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { colegiosAPI } from '../services/api';
import './Colegios.css';

// ✅ Agregamos esto al inicio
const BASE_UPLOADS = import.meta.env.VITE_UPLOADS_BASE_URL;

function Colegios() {
    const navigate = useNavigate();
    const { usuario } = useContext(AuthContext);
    const [colegios, setColegios] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalMensaje, setModalMensaje] = useState({ show: false, tipo: '', mensaje: '' });
    const [previewEscudo, setPreviewEscudo] = useState(null);
    const [colegioSeleccionado, setColegioSeleccionado] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        ciudad: '',
        direccion: '',
        telefono: '',
        email: '',
        escudo: null
    });


    useEffect(() => {
        cargarColegios();
    }, []);


    const cargarColegios = async () => {
        try {
            const response = await colegiosAPI.getAll();
            setColegios(response.data.data);
        } catch (error) {
            console.error('Error al cargar colegios:', error);
            mostrarMensaje('error', 'Error al cargar los colegios');
        }
    };


    const mostrarMensaje = (tipo, mensaje) => {
        setModalMensaje({ show: true, tipo, mensaje });
        setTimeout(() => {
            setModalMensaje({ show: false, tipo: '', mensaje: '' });
        }, 3000);
    };


    const abrirDetalles = (colegio) => {
        setColegioSeleccionado(colegio);
    };


    const cerrarDetalles = () => {
        setColegioSeleccionado(null);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);


        try {
            const dataToSend = new FormData();
            dataToSend.append('nombre', formData.nombre);
            dataToSend.append('codigo', formData.codigo);
            dataToSend.append('ciudad', formData.ciudad);
            dataToSend.append('direccion', formData.direccion);
            dataToSend.append('telefono', formData.telefono);
            dataToSend.append('email', formData.email);
            
            if (formData.escudo) {
                dataToSend.append('escudo', formData.escudo);
            }


            if (editando) {
                dataToSend.append('id', editando);
                await colegiosAPI.update(dataToSend);
                mostrarMensaje('success', '✅ Colegio actualizado exitosamente');
            } else {
                await colegiosAPI.create(dataToSend);
                mostrarMensaje('success', '✅ Colegio creado exitosamente');
            }
            
            cerrarFormulario();
            cargarColegios();
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('error', '❌ ' + (error.response?.data?.message || 'Error al guardar el colegio'));
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = (colegio) => {
        setFormData({
            nombre: colegio.nombre,
            codigo: colegio.codigo,
            ciudad: colegio.ciudad || '',
            direccion: colegio.direccion || '',
            telefono: colegio.telefono || '',
            email: colegio.email || '',
            escudo: null
        });
        setPreviewEscudo(
            colegio.escudo ? `${BASE_UPLOADS}/escudos/${colegio.escudo}` : null
        );
        setEditando(colegio.id);
        setShowForm(true);
    };


    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de desactivar este colegio?')) {
            try {
                await colegiosAPI.delete(id);
                mostrarMensaje('success', '✅ Colegio desactivado exitosamente');
                cargarColegios();
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('error', '❌ ' + (error.response?.data?.message || 'Error al desactivar'));
            }
        }
    };


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                mostrarMensaje('error', '❌ Solo se permiten imágenes');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                mostrarMensaje('error', '❌ La imagen no debe superar 2MB');
                return;
            }


            setFormData({
                ...formData,
                escudo: file
            });


            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewEscudo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };


    const cerrarFormulario = () => {
        setShowForm(false);
        setEditando(null);
        setPreviewEscudo(null);
        setFormData({
            nombre: '',
            codigo: '',
            ciudad: '',
            direccion: '',
            telefono: '',
            email: '',
            escudo: null
        });
    };


    return (
        <div className="colegios-container">
            {/* Header */}
            <div className="header-colegios">
                <div className="header-content">
                    <h1>🏫 Gestión de Colegios</h1>
                    <p className="subtitle">Administra las instituciones educativas del sistema</p>
                </div>
                {usuario?.rol === 'superadmin' && (
                    <button 
                        className="btn-nuevo-colegio"
                        onClick={() => {
                            setShowForm(true);
                            setEditando(null);
                            setPreviewEscudo(null);
                            setFormData({
                                nombre: '',
                                codigo: '',
                                ciudad: '',
                                direccion: '',
                                telefono: '',
                                email: '',
                                escudo: null
                            });
                        }}
                    >
                        <span className="icon">➕</span>
                        <span>Nuevo Colegio</span>
                    </button>
                )}
            </div>


            {/* Grid de Tarjetas Elegantes */}
            <div className="colegios-grid">
                {colegios.length === 0 ? (
                    <div className="empty-state" style={{gridColumn: '1 / -1'}}>
                        <span className="empty-icon">🏫</span>
                        <p>No hay colegios registrados</p>
                    </div>
                ) : (
                    colegios.map((colegio, index) => (
                        <div 
                            key={colegio.id} 
                            className="colegio-card-elegante"
                            style={{animationDelay: `${index * 0.1}s`}}
                        >
                            {/* Banner con Escudo */}
                            <div className="card-banner" onClick={() => abrirDetalles(colegio)}>
                                <div className="card-escudo-grande">
                                    {colegio.escudo ? (
                                        <img 
                                            src={`${BASE_UPLOADS}/escudos/${colegio.escudo}`}
                                            alt={colegio.nombre}
                                        />
                                    ) : (
                                        <div className="sin-escudo-grande">🏫</div>
                                    )}
                                </div>
                            </div>


                            {/* Contenido */}
                            <div className="card-contenido" onClick={() => abrirDetalles(colegio)}>
                                <h3 className="card-nombre-principal">{colegio.nombre}</h3>
                                <span className="card-codigo-principal">{colegio.codigo}</span>


                                <div className="card-detalles-preview">
                                    {colegio.ciudad && (
                                        <div className="detalle-preview">
                                            <div className="detalle-preview-icon">🌆</div>
                                            <span className="detalle-preview-texto">{colegio.ciudad}</span>
                                        </div>
                                    )}
                                    {colegio.telefono && (
                                        <div className="detalle-preview">
                                            <div className="detalle-preview-icon">📞</div>
                                            <span className="detalle-preview-texto">{colegio.telefono}</span>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Acciones */}
                            <div className="card-contenido">
                                <div className="card-acciones-footer">
                                    <button 
                                        className="btn-card-accion ver-mas"
                                        onClick={() => abrirDetalles(colegio)}
                                    >
                                        <span>👁️</span>
                                        <span>Ver Más</span>
                                    </button>


                                    {usuario?.rol === 'superadmin' && (
                                        <button 
                                            className="btn-card-accion gestionar"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/colegio/${colegio.id}/gestion`);
                                            }}
                                            title="Gestionar Colegio"
                                        >
                                            <span>⚙️</span>
                                        </button>
                                    )}


                                    {(usuario?.rol === 'superadmin' || 
                                      (usuario?.rol === 'coordinador' && usuario.colegio_id === colegio.id)) && (
                                        <button 
                                            className="btn-card-accion editar"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(colegio);
                                            }}
                                            title="Editar Colegio"
                                        >
                                            <span>✏️</span>
                                        </button>
                                    )}


                                    {usuario?.rol === 'superadmin' && (
                                        <button 
                                            className="btn-card-accion eliminar"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(colegio.id);
                                            }}
                                            title="Desactivar Colegio"
                                        >
                                            <span>🗑️</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            {/* Modal de Detalles */}
            {colegioSeleccionado && (
                <div className="modal-detalles-overlay" onClick={cerrarDetalles}>
                    <div className="modal-detalles-contenido" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-detalles-header">
                            <button className="btn-cerrar-detalles" onClick={cerrarDetalles}>
                                ✕
                            </button>


                            <div className="modal-escudo-grande">
                                {colegioSeleccionado.escudo ? (
                                    <img 
                                        src={`${BASE_UPLOADS}/escudos/${colegioSeleccionado.escudo}`}
                                        alt={colegioSeleccionado.nombre}
                                    />
                                ) : (
                                    <div className="sin-escudo-grande">🏫</div>
                                )}
                            </div>


                            <h2>{colegioSeleccionado.nombre}</h2>
                            <span className="modal-codigo-badge">DANE: {colegioSeleccionado.codigo}</span>
                        </div>


                        <div className="modal-detalles-body">
                            {colegioSeleccionado.ciudad && (
                                <div className="detalle-completo">
                                    <div className="detalle-icono-completo">🌆</div>
                                    <div className="detalle-info-completo">
                                        <div className="detalle-label-completo">Ciudad</div>
                                        <div className="detalle-valor-completo">{colegioSeleccionado.ciudad}</div>
                                    </div>
                                </div>
                            )}


                            {colegioSeleccionado.direccion && (
                                <div className="detalle-completo">
                                    <div className="detalle-icono-completo">📍</div>
                                    <div className="detalle-info-completo">
                                        <div className="detalle-label-completo">Dirección</div>
                                        <div className="detalle-valor-completo">{colegioSeleccionado.direccion}</div>
                                    </div>
                                </div>
                            )}


                            {colegioSeleccionado.telefono && (
                                <div className="detalle-completo">
                                    <div className="detalle-icono-completo">📞</div>
                                    <div className="detalle-info-completo">
                                        <div className="detalle-label-completo">Teléfono</div>
                                        <div className="detalle-valor-completo">{colegioSeleccionado.telefono}</div>
                                    </div>
                                </div>
                            )}


                            {colegioSeleccionado.email && (
                                <div className="detalle-completo">
                                    <div className="detalle-icono-completo">📧</div>
                                    <div className="detalle-info-completo">
                                        <div className="detalle-label-completo">Email</div>
                                        <div className="detalle-valor-completo">{colegioSeleccionado.email}</div>
                                    </div>
                                </div>
                            )}


                            <div className="detalle-completo">
                                <div className="detalle-icono-completo">📅</div>
                                <div className="detalle-info-completo">
                                    <div className="detalle-label-completo">Fecha de Registro</div>
                                    <div className="detalle-valor-completo">
                                        {new Date(colegioSeleccionado.created_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Modal de Formulario */}
            {showForm && (
                <div className="modal-overlay" onClick={cerrarFormulario}>
                    <div className="modal-form-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-form">
                            <div className="modal-title">
                                <div className="icon-title">{editando ? '✏️' : '🏫'}</div>
                                <div>
                                    <h2>{editando ? 'Editar Colegio' : 'Nuevo Colegio'}</h2>
                                    <p>Completa la información del colegio</p>
                                </div>
                            </div>
                            <button className="btn-close-modal" onClick={cerrarFormulario}>✕</button>
                        </div>


                        <form onSubmit={handleSubmit} className="form-elegante">
                            <div className="escudo-upload-section">
                                <label className="escudo-label">
                                    <div className="escudo-preview-container">
                                        {previewEscudo ? (
                                            <img src={previewEscudo} alt="Preview" className="escudo-preview" />
                                        ) : (
                                            <div className="escudo-placeholder">
                                                <span className="upload-icon">🏫</span>
                                                <span>Subir Escudo</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="escudo-hint">Haz clic para {previewEscudo ? 'cambiar' : 'subir'} el escudo</div>
                                </label>
                            </div>


                            <div className="form-grid">
                                <div className="form-field">
                                    <label>
                                        <span className="field-icon">📝</span>
                                        Nombre del Colegio *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ej: Institución Educativa San José"
                                        className="input-elegante"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        <span className="field-icon">🔢</span>
                                        Código DANE *
                                    </label>
                                    <input
                                        type="text"
                                        name="codigo"
                                        value={formData.codigo}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ej: 123456789012"
                                        className="input-elegante"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        <span className="field-icon">🌆</span>
                                        Ciudad
                                    </label>
                                    <input
                                        type="text"
                                        name="ciudad"
                                        value={formData.ciudad}
                                        onChange={handleChange}
                                        placeholder="Ej: Aguachica"
                                        className="input-elegante"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        <span className="field-icon">📍</span>
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        placeholder="Ej: Calle 10 # 15-20"
                                        className="input-elegante"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        <span className="field-icon">📞</span>
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        placeholder="Ej: 3001234567"
                                        className="input-elegante"
                                    />
                                </div>


                                <div className="form-field">
                                    <label>
                                        <span className="field-icon">📧</span>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Ej: contacto@colegio.edu.co"
                                        className="input-elegante"
                                    />
                                </div>
                            </div>


                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancelar-form"
                                    onClick={cerrarFormulario}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-guardar-form"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <span>💾</span>
                                            Guardar Colegio
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Modal de Mensajes */}
            {modalMensaje.show && (
                <div className="modal-mensaje-overlay">
                    <div className={`modal-mensaje ${modalMensaje.tipo}`}>
                        <div className="mensaje-icon">
                            {modalMensaje.tipo === 'success' ? '✅' : '❌'}
                        </div>
                        <div className="mensaje-texto">
                            <h3>{modalMensaje.tipo === 'success' ? '¡Éxito!' : '¡Error!'}</h3>
                            <p>{modalMensaje.mensaje}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default Colegios;