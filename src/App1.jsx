import './styles/Global.css';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Colegios from './pages/Colegios';
import GestionColegio from './pages/GestionColegio';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GestionPesajeReto from './pages/GestionPesajeReto';
import UsuariosGlobal from './pages/UsuariosGlobal';
import ReportesGlobales from "./pages/ReportesGlobales";
import Reportes from "./pages/Reportes";
import Ranking from './pages/Ranking';
import EstadisticasMiCurso from './pages/EstadisticasMiCurso';
import MiPerfil from './pages/MiPerfil';





function AppRoutes() {
  const { usuario, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={usuario ? <Navigate to="/dashboard" /> : <Login />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/colegios"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Layout>
              <Colegios />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/colegio/:colegioId/gestion"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Layout>
              <GestionColegio />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
  path="/usuarios"
  element={
    <ProtectedRoute allowedRoles={['superadmin', 'coordinador']}>
      <Layout>
        <UsuariosGlobal />
      </Layout>
    </ProtectedRoute>
  }
/>

      <Route
        path="/salones"
        element={
          <ProtectedRoute allowedRoles={['coordinador']}>
            <Layout>
              <h1>Salones (próximamente)</h1>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/registro"
        element={
          <ProtectedRoute allowedRoles={['coordinador', 'estudiante']}>
            <Layout>
              <h1>Registro (próximamente)</h1>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
  path="/ranking"
  element={
    <ProtectedRoute allowedRoles={['coordinador', 'estudiante']}>
      <Layout>
        <Ranking />
      </Layout>
    </ProtectedRoute>
  }
/>

      <Route
  path="/mi-perfil"
  element={
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout>
        <MiPerfil />
      </Layout>
    </ProtectedRoute>
  }
/>

   

      <Route
        path="/colegios/:colegioId/retos/:retoId/pesaje"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'coordinador']}>
            <Layout>
              <GestionPesajeReto />
            </Layout>
          </ProtectedRoute>
        }
      />


<Route
  path="/reportes"
  element={
    <ProtectedRoute allowedRoles={['superadmin']}>
      <Layout>
        <Reportes />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/mi-curso/estadisticas"
  element={
    <ProtectedRoute allowedRoles={['estudiante']}>
      <Layout>
        <EstadisticasMiCurso />
      </Layout>
    </ProtectedRoute>
  }
/>
    </Routes>




  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;