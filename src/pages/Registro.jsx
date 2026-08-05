import { useState, useEffect } from 'react';
import './Registro.css';

function Registro({ onVolver }) {
    const [colegios, setColegios] = useState([]);
    const [grados, setGrados] = useState([]);
    const [salones, setSalones] = useState([]);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        colegio_id: '',
        grado_id: '',
        salon_id: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [mostrarModalExito, setMostrarModalExito] = useState(false);

    useEffect(() => {
        cargarColegios();
    }, []);

    useEffect(() => {
        if (formData.colegio_id) {
            cargarGrados(formData.colegio_id);
        } else {
            setGrados([]);
            setSalones([]);
            setFormData(prev => ({ ...prev, grado_id: '', salon_id: '' }));
        }
    }, [formData.colegio_id]);

    useEffect(() => {
        if (formData.grado_id && formData.colegio_id) {
            cargarSalones(formData.colegio_id, formData.grado_id);
        } else {
            setSalones([]);
            setFormData(prev => ({ ...prev, salon_id: '' }));
        }
    }, [formData.grado_id, formData.colegio_id]);

    const cargarColegios = async () => {
        try {
            const response = await fetch('${import.meta.env.VITE_API_BASE_URL}/colegios_publicos.php');
            const data = await response.json();
            if (data.success) {
                setColegios(data.data);
            }
        } catch (error) {
            console.error('Error al cargar colegios:', error);
        }
    };

    const cargarGrados = async (colegioId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/grados_select.php?colegio_id=${colegioId}`);
            const data = await response.json();
            if (data.success) {
                setGrados(data.data);
            }
        } catch (error) {
            console.error('Error al cargar grados:', error);
        }
    };

    const cargarSalones = async (colegioId, gradoId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/salones_select.php?colegio_id=${colegioId}&grado_id=${gradoId}`);
            const data = await response.json();
            if (data.success) {
                setSalones(data.data);
            }
        } catch (error) {
            console.error('Error al cargar salones:', error);
        }
    };

    const validarFormulario = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.password) {
            newErrors.password = 'La contraseña es obligatoria';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener mínimo 6 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (!formData.colegio_id) {
            newErrors.colegio_id = 'Selecciona tu institución';
        }

        if (!formData.grado_id) {
            newErrors.grado_id = 'Selecciona tu grado';
        }

        if (!formData.salon_id) {
            newErrors.salon_id = 'Selecciona tu salón';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('${import.meta.env.VITE_API_BASE_URL}/registro_estudiante.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    email: formData.email,
                    password: formData.password,
                    colegio_id: formData.colegio_id,
                    grado_id: formData.grado_id,
                    salon_id: formData.salon_id
                })
            });

            const data = await response.json();

            if (data.success) {
                setMostrarModalExito(true);
                setTimeout(() => {
                    setMostrarModalExito(false);
                    onVolver();
                }, 2500);
            } else {
                setErrors({ general: data.message });
            }
        } catch (error) {
            setErrors({ general: 'Error al registrar. Intenta de nuevo.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const handleGradoChange = (e) => {
        const { value } = e.target;
        setFormData({
            ...formData,
            grado_id: value,
            salon_id: '' // Limpiar salón al cambiar grado
        });
        
        if (errors.grado_id) {
            setErrors({
                ...errors,
                grado_id: ''
            });
        }
    };

    return (
        <>
            <div className="registro-form">
                <h2>Registro de Estudiante</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre Completo *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Juan Pérez"
                            disabled={loading}
                        />
                        {errors.nombre && <span className="error-text">{errors.nombre}</span>}
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="estudiante@ejemplo.com"
                            disabled={loading}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label>Contraseña *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Mínimo 6 caracteres"
                            disabled={loading}
                        />
                        {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label>Confirmar Contraseña *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repite tu contraseña"
                            disabled={loading}
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                    </div>

                    <div className="form-group">
                        <label>Institución Educativa *</label>
                        <select
                            name="colegio_id"
                            value={formData.colegio_id}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="">Selecciona tu colegio</option>
                            {colegios.map(colegio => (
                                <option key={colegio.id} value={colegio.id}>
                                    {colegio.nombre} - {colegio.ciudad}
                                </option>
                            ))}
                        </select>
                        {errors.colegio_id && <span className="error-text">{errors.colegio_id}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Grado *</label>
                            <select
                                name="grado_id"
                                value={formData.grado_id}
                                onChange={handleGradoChange}
                                disabled={loading || !formData.colegio_id}
                            >
                                <option value="">Selecciona</option>
                                {grados.map(grado => (
                                    <option key={grado.id} value={grado.id}>
                                        {grado.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.grado_id && <span className="error-text">{errors.grado_id}</span>}
                        </div>

                        <div className="form-group">
                            <label>Salón *</label>
                            <select
                                name="salon_id"
                                value={formData.salon_id}
                                onChange={handleChange}
                                disabled={loading || !formData.grado_id}
                            >
                                <option value="">Selecciona</option>
                                {salones.map(salon => (
                                    <option key={salon.id} value={salon.id}>
                                        {salon.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.salon_id && <span className="error-text">{errors.salon_id}</span>}
                        </div>
                    </div>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <button type="submit" className="btn-registro" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>

                    <button type="button" className="btn-volver" onClick={onVolver} disabled={loading}>
                        Volver al Login
                    </button>
                </form>
            </div>

            {/* Modal de éxito */}
            {mostrarModalExito && (
                <div className="modal-overlay">
                    <div className="modal-exito">
                        <div className="modal-icono">✅</div>
                        <h2>¡Registro Exitoso!</h2>
                        <p>Tu cuenta ha sido creada correctamente</p>
                        <div className="modal-loader"></div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Registro;