// frontend/src/services/api.js
// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config.url.includes('action=login')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post('/auth.php?action=login', { email, password }),
  logout: () => api.post('/auth.php?action=logout'),
  verify: () => api.get('/auth.php?action=verify'),
};

export const colegiosAPI = {
  getAll: () => api.get('/colegios.php'),
  create: (data) =>
    api.post('/colegios.php', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (data) => {
    const id = data.get('id');
    return api.post(`/colegios.php?id=${id}&_method=PUT`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/colegios.php?id=${id}`),
};

export const usuariosAPI = {
  getAll: () => api.get('/usuarios.php'),
  getByColegio: (colegioId) =>
    api.get(`/usuarios.php?colegio_id=${colegioId}`),
  create: (data) => api.post('/usuarios.php', data),
  update: (id, data) => api.put(`/usuarios.php?id=${id}`, data),
  delete: (id) => api.delete(`/usuarios.php?id=${id}`),
};

export const salonesAPI = {
  getAll: () => api.get('/salones.php'),
  getByColegio: (colegioId) =>
    api.get(`/salones.php?colegio_id=${colegioId}`),
  create: (data) => api.post('/salones.php', data),
  update: (id, data) => api.put(`/salones.php?id=${id}`, data),
  delete: (id) => api.delete(`/salones.php?id=${id}`),
};

export const gradosAPI = {
  getAll: () => api.get('/grados.php'),
  getByColegio: (colegioId) =>
    api.get(`/grados.php?colegio_id=${colegioId}`),
};

export const estadisticasAPI = {
  getAdminStats: () => api.get('/estadisticas_admin.php'),
  getCoordinadorStats: (colegioId) =>
    api.get(`/estadisticas_coordinador.php?colegio_id=${colegioId}`),
  getEstudianteStats: (usuarioId) =>
    api.get(`/estadisticas_estudiante.php?usuario_id=${usuarioId}`),

 // 🔹 nuevo: estadísticas de reciclaje por colegio
  getColegioReciclajeStats: (colegioId) =>
    api.get(`/estadisticas_colegio_reciclaje.php?colegio_id=${colegioId}`),

  // 🔹 nuevo: ranking histórico del colegio
  getRankingHistoricoColegio: (colegioId) =>
    api.get(`/ranking_historico_colegio.php?colegio_id=${colegioId}`),

};

// 🔹 API de pesajes por reto (AQUÍ ESTÁN LOS AJUSTES)
export const pesajesAPI = {
  getSalonesConPesos: (colegioId, retoId) =>
    api.get('/pesajes_reto.php', {
      params: { colegio_id: colegioId, reto_id: retoId },
    }),

  // payload DEBE traer: { reto_id, salon_id, peso_gramos, usuario_id }
  registrarPesaje: ({ reto_id, salon_id, peso_gramos, usuario_id }) =>
    api.post('/pesajes_reto.php', {
      reto_id,
      salon_id,
      peso_gramos,
      usuario_id,
    }), // Axios manda este objeto como JSON en el cuerpo del POST[web:31][web:33]

  getHistorialPesajes: (retoId, salonId) =>
    api.get('/pesajes_historial.php', {
      params: { reto_id: retoId, salon_id: salonId },
    }),
};

// 🔹 API de reciclaje (por instituto/colegio)
export const reciclajeAPI = {
  getMateriales: () => api.get('/materiales_reciclaje.php'),

  getRetosPorColegio: (colegioId) =>
    api.get(`/retos_reciclaje.php?colegio_id=${colegioId}`),

  crearReto: (datos) => api.post('/retos_reciclaje.php', datos),

  // Actualizar reto: patrón POST + _method=PUT
  actualizarReto: (id, datos) =>
    api.post(`/retos_reciclaje.php?id=${id}&_method=PUT`, datos),

  eliminarReto: (id) => api.delete(`/retos_reciclaje.php?id=${id}`),

  getSalonesPorColegio: (colegioId) =>
    api.get(`/salones_colegio.php?colegio_id=${colegioId}`),

  // 🔹 Nuevo: ranking del reto (usa axios, como el resto)
  getRankingReto: (retoId, colegioId) =>
    api.get('/ranking_reto.php', {
      params: { reto_id: retoId, colegio_id: colegioId },
    }),
};

export default api;