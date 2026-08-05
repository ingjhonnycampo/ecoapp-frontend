import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

function Header() {
    const { usuario, colegio, logout } = useContext(AuthContext);
    const [mostrarModalLogout, setMostrarModalLogout] = useState(false);
    const [cerrando, setCerrando] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        setCerrando(true);
        setTimeout(async () => {
            await logout();
            navigate('/');
        }, 2500);
    };

    const getMenuItems = () => {
        const baseItems = [
            { path: '/dashboard', label: '🏠 Inicio', roles: ['superadmin', 'coordinador', 'estudiante'] }
        ];

        if (usuario?.rol === 'superadmin') {
            return [
                ...baseItems,
                { path: '/colegios', label: '🏫 Colegios', roles: ['superadmin'] },
                { path: '/usuarios', label: '👥 Usuarios', roles: ['superadmin'] },
                { path: '/reportes', label: '📊 Reportes', roles: ['superadmin'] }
            ];
        }

        if (usuario?.rol === 'coordinador') {
            return [
                ...baseItems,
                { path: '/usuarios', label: '👥 Usuarios', roles: ['coordinador'] },
                { path: '/salones', label: '🚪 Salones', roles: ['coordinador'] },
                { path: '/ranking', label: '🏆 Ranking', roles: ['coordinador'] },
                { path: '/registro', label: '♻️ Registro', roles: ['coordinador'] }
            ];
        }

        if (usuario?.rol === 'estudiante') {
            return [
                ...baseItems,
                { path: '/mi-perfil', label: '👤 Mi Perfil', roles: ['estudiante'] },
                { path: '/ranking', label: '🏆 Ranking', roles: ['estudiante'] },
               
            ];
        }

        return baseItems;
    };

    const getRolBadge = () => {
        const badges = {
            superadmin: { text: 'Super Admin', icon: '👑', color: '#e74c3c' },
            coordinador: { text: 'Coordinador', icon: '🎯', color: '#3498db' },
            estudiante: { text: 'Estudiante', icon: '🎓', color: '#27ae60' }
        };
        return badges[usuario?.rol] || badges.estudiante;
    };

    const menuItems = getMenuItems();
    const rolBadge = getRolBadge();

    const cerrarMenu = () => {
        setMenuAbierto(false);
    };

    return (
        <>
            <header className="main-header">
                <div className="header-container">
                    {/* Logo */}
                    <Link to="/dashboard" className="logo-link" onClick={cerrarMenu}>
                        <img src="/image.jpg" alt="EcoApp" className="header-logo" />
                        <div className="logo-text">
                            <span className="eco-text">🌱 Eco</span>
                            <span className="app-text">App</span>
                        </div>
                    </Link>

                    {/* Navegación Desktop */}
                    <nav className="header-nav desktop-nav">
                        {menuItems.map((item, index) => (
                            <Link key={index} to={item.path} className="nav-link">
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Info Usuario y Logout */}
                    <div className="header-right">
                        <div className="user-info">
                            <div className="user-details">
                                <span className="user-name">{usuario?.nombre}</span>
                                <span className="user-colegio">{colegio?.nombre}</span>
                            </div>
                            <div className="user-rol-badge" style={{background: rolBadge.color}}>
                                {rolBadge.icon}
                            </div>
                        </div>
                        
                        <button 
                            className="btn-logout desktop-logout"
                            onClick={() => setMostrarModalLogout(true)}
                        >
                            🚪 Salir
                        </button>

                        {/* Botón hamburguesa móvil */}
                        <button 
                            className="menu-hamburguesa"
                            onClick={() => setMenuAbierto(!menuAbierto)}
                            aria-label="Menú"
                        >
                            {menuAbierto ? '✖' : '☰'}
                        </button>
                    </div>
                </div>

                {/* Menú móvil desplegable */}
                {menuAbierto && (
                    <div className="mobile-menu">
                        <nav className="mobile-nav">
                            {menuItems.map((item, index) => (
                                <Link 
                                    key={index} 
                                    to={item.path} 
                                    className="mobile-nav-link"
                                    onClick={cerrarMenu}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <button 
                            className="btn-logout mobile-logout"
                            onClick={() => {
                                setMostrarModalLogout(true);
                                cerrarMenu();
                            }}
                        >
                            🚪 Cerrar Sesión
                        </button>
                    </div>
                )}
            </header>

            {/* Modal de confirmación de logout */}
            {mostrarModalLogout && !cerrando && (
                <div className="modal-overlay" onClick={() => setMostrarModalLogout(false)}>
                    <div className="modal-logout" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">⚠️</div>
                        <h2>¿Cerrar Sesión?</h2>
                        <p>¿Estás seguro de que deseas salir?</p>
                        <div className="modal-buttons">
                            <button 
                                className="btn-confirmar"
                                onClick={handleLogout}
                            >
                                ✅ Sí, salir
                            </button>
                            <button 
                                className="btn-cancelar"
                                onClick={() => setMostrarModalLogout(false)}
                            >
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de despedida */}
            {cerrando && (
                <div className="modal-overlay">
                    <div className="modal-despedida">
                        <div className="despedida-icon">👋</div>
                        <h2>¡Hasta Pronto!</h2>
                        <p>Gracias por cuidar el planeta 🌍</p>
                        <div className="despedida-loader"></div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;