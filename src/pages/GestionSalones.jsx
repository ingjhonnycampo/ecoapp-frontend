// frontend/src/pages/GestionSalones.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import GestionSalonesPanel from '../components/GestionSalones';

function GestionSalones() {
  const { usuario, colegio } = useContext(AuthContext);

  if (!usuario?.colegio_id) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>⚠️ Sin colegio asignado</h2>
        <p>Tu usuario no tiene un colegio asignado. Contacta al administrador.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>🚪 Gestión de Salones</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>{colegio?.nombre}</p>
      </div>

      <GestionSalonesPanel
        colegioId={usuario.colegio_id}
        colegioNombre={colegio?.nombre}
      />
    </div>
  );
}

export default GestionSalones;
