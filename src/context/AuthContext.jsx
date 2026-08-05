import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext({
  usuario: null,
  colegio: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  verificarAutenticacion: () => {}
});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [colegio, setColegio] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Guardamos el token en estado
      setToken(storedToken);

      const response = await authAPI.verify();

      if (response.data.success) {
        // La estructura es response.data.data.usuario
        setUsuario(response.data.data.usuario);
        setColegio(response.data.data.colegio);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
        setColegio(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUsuario(null);
      setColegio(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);

      if (response.data.success) {
        // La estructura es response.data.data.token, .usuario, .colegio
        const { token: tokenBack, usuario, colegio } = response.data.data;

        localStorage.setItem('token', tokenBack);
        localStorage.setItem('usuario', JSON.stringify(usuario));

        setUsuario(usuario);
        setColegio(colegio);
        setToken(tokenBack);

        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUsuario(null);
      setColegio(null);
      setToken(null);
    }
  };

  const value = {
    usuario,
    colegio,
    token,
    loading,
    login,
    logout,
    verificarAutenticacion
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}