import { useState } from 'react';
import './ModalUsuario.css';

function ModalCambiarPassword({ usuario, onCerrar }) {
    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmarPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/usuarios_colegio.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: usuario.id,
                    nueva_password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                setExito(true);
                setTimeout(() => {
                    onCerrar();
                }, 2000);
            } else {
                setError(data.message || 'Error al cambiar contraseña');
            }
        } catch (error) {
            setError('Error de conexión');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onCerrar}>
            <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🔑 Cambiar Contraseña</h2>
                    <button className="btn-cerrar-modal" onClick={onCerrar}>✕</button>
                </div>

                {exito ? (
                    <div className="exito-mensaje">
                        <div className="exito-icon">✅</div>
                        <h3>Contraseña actualizada</h3>
                        <p>La contraseña de {usuario.nombre} se ha cambiado exitosamente.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="info-usuario-password">
                            <div className="avatar-password">
                                {usuario.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3>{usuario.nombre}</h3>
                                <p>{usuario.email}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="alert-error">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Nueva contraseña *</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Mínimo 6 caracteres"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar contraseña *</label>
                            <input
                                type="password"
                                value={confirmarPassword}
                                onChange={(e) => setConfirmarPassword(e.target.value)}
                                required
                                placeholder="Repite la contraseña"
                            />
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancelar" onClick={onCerrar}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-guardar" disabled={loading}>
                                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ModalCambiarPassword;