import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { usuario, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    if (!usuario) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(usuario.rol)) {
        return <div className="unauthorized">No tiene permiso para acceder a esta página</div>;
    }

    return children;
}

export default ProtectedRoute;