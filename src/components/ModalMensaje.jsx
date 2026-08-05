import './ModalMensaje.css';

function ModalMensaje({ tipo, titulo, mensaje, onCerrar }) {
  const iconos = {
    exito: '✅',
    error: '❌',
    advertencia: '⚠️',
    info: 'ℹ️'
  };

  const titulos = {
    exito: titulo || '¡Éxito!',
    error: titulo || 'Error',
    advertencia: titulo || 'Advertencia',
    info: titulo || 'Información'
  };

  return (
    <div className="mm-overlay" onClick={onCerrar}>
      <div className="mm-box" onClick={(e) => e.stopPropagation()}>
        <div className={`mm-header mm-${tipo || 'info'}`}>
          <span className="mm-icono">{iconos[tipo] || iconos.info}</span>
        </div>

        <div className="mm-body">
          <h3>{titulos[tipo] || 'Mensaje'}</h3>
          <p>{mensaje}</p>
        </div>

        <div className="mm-footer">
          <button className="mm-btn" onClick={onCerrar}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalMensaje;