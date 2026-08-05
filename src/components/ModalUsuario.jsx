import { useState, useEffect } from 'react';
import './ModalUsuario.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ModalUsuario({ usuario, modo, colegioId, onCerrar, onGuardar, soloEstudiantes = false }) {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'estudiante',
        grado_id: '',
        salon_id: ''
    });
    const [grados, setGrados] = useState([]);
    const [salones, setSalones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    useEffect(() => {
        if (colegioId) {
            cargarGrados();
        }

        if (modo === 'editar' && usuario) {
            setFormData({
                nombre: usuario.nombre,
                email: usuario.email,
                password: '',
                rol: usuario.rol,
                grado_id: usuario.grado_id || '',
                salon_id: usuario.salon_id || ''
            });
        }
    }, [usuario, modo, colegioId]);

    useEffect(() => {
        if (formData.grado_id && colegioId) {
            cargarSalones(formData.grado_id);
        } else {
            setSalones([]);
        }
    }, [formData.grado_id, colegioId]);

    const cargarGrados = async () => {
        try {
            const response = await fetch(`${BASE_URL}/grados_select.php?colegio_id=${colegioId}`);
            const data = await response.json();

            if (data.success) {
                setGrados(data.data);
            }
        } catch (error) {
            console.error('Error al cargar grados:', error);
        }
    };

    const cargarSalones = async (gradoId) => {
        try {
            const response = await fetch(`${BASE_URL}/salones_select.php?colegio_id=${colegioId}&grado_id=${gradoId}`);
            const data = await response.json();

            if (data.success) {
                setSalones(data.data);
            }
        } catch (error) {
            console.error('Error al cargar salones:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGradoChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            grado_id: value,
            salon_id: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const url = `${BASE_URL}/usuarios_colegio.php`;
            const method = modo === 'crear' ? 'POST' : 'PUT';

            const dataToSend = {
                ...formData,
                colegio_id: colegioId
            };

            if (formData.rol === 'coordinador') {
                delete dataToSend.grado_id;
                delete dataToSend.salon_id;
            }

            if (modo === 'editar') {
                dataToSend.id = usuario.id;
                if (!formData.password) {
                    delete dataToSend.password;
                }
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (data.success) {
                setExito(true);
                setTimeout(() => {
                    onGuardar();
                }, 2000);
            } else {
                setError(data.message || 'Error al guardar usuario');
            }
        } catch (error) {
            setError('Error de conexión');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCerrar();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{modo === 'crear' ? '➕ Nuevo Usuario' : '✏️ Editar Usuario'}</h2>
                    <button className="btn-cerrar-modal" onClick={onCerrar}>✕</button>
                </div>

                {exito ? (
                    <div className="exito-mensaje">
                        <div className="exito-icon">✅</div>
                        <h3>{modo === 'crear' ? 'Usuario creado' : 'Usuario actualizado'}</h3>
                        <p>
                            {modo === 'crear'
                                ? `${formData.nombre} ha sido registrado exitosamente.`
                                : `Los datos de ${formData.nombre} han sido actualizados.`
                            }
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="modal-form">
                        {error && (
                            <div className="alert-error">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Nombre completo *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Juan Pérez"
                                autoComplete="off"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="ejemplo@correo.com"
                                autoComplete="off"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                {modo === 'crear' ? 'Contraseña *' : 'Contraseña (dejar vacío para no cambiar)'}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={modo === 'crear'}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="form-group">
                            <label>Rol *</label>
                            {soloEstudiantes && formData.rol !== 'estudiante' ? (
                                <input type="text" value={`${formData.rol} (no editable aquí)`} disabled />
                            ) : (
                                <select
                                    name="rol"
                                    value={formData.rol}
                                    onChange={handleChange}
                                    required
                                    disabled={soloEstudiantes}
                                >
                                    <option value="estudiante">Estudiante</option>
                                    {!soloEstudiantes && (
                                        <option value="coordinador">Coordinador</option>
                                    )}
                                </select>
                            )}
                        </div>

                        {formData.rol === 'estudiante' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="grado_id">
                                        <i className="fas fa-layer-group"></i> Grado *
                                    </label>
                                    <select
                                        id="grado_id"
                                        name="grado_id"
                                        value={formData.grado_id}
                                        onChange={handleGradoChange}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Seleccionar grado</option>
                                        {grados.map(grado => (
                                            <option key={grado.id} value={grado.id}>
                                                {grado.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {formData.grado_id && (
                                    <div className="form-group">
                                        <label htmlFor="salon_id">
                                            <i className="fas fa-door-open"></i> Salón *
                                        </label>
                                        <select
                                            id="salon_id"
                                            name="salon_id"
                                            value={formData.salon_id}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Seleccionar salón</option>
                                            {salones.map(salon => (
                                                <option key={salon.id} value={salon.id}>
                                                    {salon.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="modal-footer">
                            <button type="button" className="btn-cancelar" onClick={onCerrar}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-guardar" disabled={loading}>