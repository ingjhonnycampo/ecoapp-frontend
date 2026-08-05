import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Registro from './Registro';
import './Login.css';

// ✅ Agregamos esto al inicio
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
    const [emailRecuperar, setEmailRecuperar] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const { login } = useContext(AuthContext);
    const formRef = useRef(null);
    const formRecuperarRef = useRef(null);


    // Prevenir submit del formulario a nivel DOM
    useEffect(() => {
        const form = formRef.current;
        if (form) {
            const preventSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
            form.addEventListener('submit', preventSubmit);
            return () => form.removeEventListener('submit', preventSubmit);
        }
    }, []);


    useEffect(() => {
        const form = formRecuperarRef.current;
        if (form) {
            const preventSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
            form.addEventListener('submit', preventSubmit);
            return () => form.removeEventListener('submit', preventSubmit);
        }
    }, [mostrarRecuperar]);


    const handleSubmit = async () => {
        setError('');
        setMensajeExito('');


        if (!email.trim()) {
            setError('El email es obligatorio');
            return;
        }


        if (!password) {
            setError('La contraseña es obligatoria');
            return;
        }


        setLoading(true);


        const result = await login(email, password);
        
        if (!result.success) {
            setError(result.message);
        }
        
        setLoading(false);
    };


    const handleRecuperarPassword = async () => {
        setError('');
        setMensajeExito('');


        if (!emailRecuperar.trim()) {
            setError('Ingresa tu email para recuperar la contraseña');
            return;
        }


        if (!/\S+@\S+\.\S+/.test(emailRecuperar)) {
            setError('Email inválido');
            return;
        }


        setLoading(true);


        try {
            // ✅ Usamos BASE_URL en lugar de import.meta.env directo
            const response = await fetch(`${BASE_URL}/recuperar_password.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: emailRecuperar })
            });


            const data = await response.json();


            if (data.success) {
                setMensajeExito(data.message);
                setTimeout(() => {
                    setMostrarRecuperar(false);
                    setEmailRecuperar('');
                    setMensajeExito('');
                }, 15000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };


    if (mostrarRecuperar) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <div className="login-header">
                        <img src="/image.jpg" alt="EcoApp Escolar" className="logo-small" />
                        <h1 className="titulo-app">
                            <span className="eco">🔑 Recuperar</span> <span className="app">Contraseña</span>
                        </h1>
                        <p className="subtitulo">Te enviaremos tu contraseña por email</p>
                    </div>


                    <form ref={formRecuperarRef} className="login-form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-group">
                            <label>📧 Email registrado</label>
                            <input
                                type="text"
                                value={emailRecuperar}
                                onChange={(e) => {
                                    setEmailRecuperar(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleRecuperarPassword();
                                    }
                                }}
                                placeholder="correo@ejemplo.com"
                                disabled={loading}
                                autoComplete="off"
                            />
                        </div>


                        {error && <div className="error-message">❌ {error}</div>}
                        {mensajeExito && <div className="success-message">✅ {mensajeExito}</div>}


                        <button 
                            type="button"
                            className="btn-login" 
                            onClick={handleRecuperarPassword}
                            disabled={loading}
                        >
                            {loading ? '⏳ Enviando...' : '📧 Enviar Contraseña'}
                        </button>


                        <button 
                            type="button" 
                            className="btn-volver-login"
                            onClick={() => {
                                setMostrarRecuperar(false);
                                setEmailRecuperar('');
                                setError('');
                                setMensajeExito('');
                            }}
                            disabled={loading}
                        >
                            ← Volver al Login
                        </button>
                    </form>
                </div>


                <footer className="login-footer-bottom">
                    <p>© 2026 EcoApp Escolar - Todos los derechos reservados</p>
                    <p>Diseñado por <strong>Ing. Jhonny Campo Herrera</strong></p>
                </footer>
            </div>
        );
    }


    if (mostrarRegistro) {
        return (
            <div className="login-container">
                <div className="login-box registro-box">
                    <div className="login-header">
                        <img src="/image.jpg" alt="EcoApp Escolar" className="logo" />
                        <h1 className="titulo-app">
                            <span className="eco">🌱 Eco</span><span className="app">App</span> <span className="escolar">🎓 Escolar</span>
                        </h1>
                        <p className="subtitulo">♻️ Sistema de Gestión de Reciclaje 🌍</p>
                    </div>
                    <Registro onVolver={() => setMostrarRegistro(false)} />
                </div>
                <footer className="login-footer-bottom">
                    <p>© 2026 EcoApp Escolar - Todos los derechos reservados</p>
                    <p>Diseñado por <strong>Ing. Jhonny Campo Herrera</strong></p>
                </footer>
            </div>
        );
    }


    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <img src="/image.jpg" alt="EcoApp Escolar" className="logo" />
                    <h1 className="titulo-app">
                        <span className="eco">🌱 Eco</span><span className="app">App</span> <span className="escolar">🎓 Escolar</span>
                    </h1>
                    <p className="subtitulo">♻️ Sistema de Gestión de Reciclaje 🌍</p>
                </div>
                
                <form ref={formRef} className="login-form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label>📧 Email</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder="correo@ejemplo.com"
                            disabled={loading}
                            autoComplete="off"
                        />
                    </div>


                    <div className="form-group">
                        <label>🔒 Contraseña</label>
                        <div className="password-input-wrapper">
                            <input
                                type={mostrarPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="••••••••"
                                disabled={loading}
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                disabled={loading}
                                title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {mostrarPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        <button
                            type="button"
                            className="link-recuperar"
                            onClick={() => setMostrarRecuperar(true)}
                            disabled={loading}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>


                    {error && <div className="error-message">❌ {error}</div>}


                    <button 
                        type="button"
                        className="btn-login" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? '⏳ Iniciando sesión...' : '✅ Iniciar Sesión'}
                    </button>
                </form>


                <div className="divider">
                    <span>o</span>
                </div>


                <button 
                    type="button" 
                    className="btn-registro-link"
                    onClick={() => setMostrarRegistro(true)}
                    disabled={loading}
                >
                    👨‍🎓 ¿Eres estudiante? Regístrate aquí
                </button>
            </div>


            <footer className="login-footer-bottom">
                <p>© 2026 EcoApp Escolar - Todos los derechos reservados</p>
                <p>Diseñado por <strong>Ing. Jhonny Campo Herrera</strong></p>
            </footer>
        </div>
    );
}


export default Login;