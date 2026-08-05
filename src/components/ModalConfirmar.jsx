import './ModalConfirmar.css';

function ModalConfirmar({ titulo, mensaje, onConfirmar, onCancelar }) {
    return (
        <div className="modal-overlay-confirmar" onClick={onCancelar}>
            <div className="modal-confirmar" onClick={(e) => e.stopPropagation()}>
                <div className="modal-confirmar-header">
                    <span className="modal-confirmar-icono">⚠️</span>
                </div>
                
                <div className="modal-confirmar-body">
                    <h3>{titulo}</h3>
                    <p>{mensaje}</p>
                </div>

                <div className="modal-confirmar-footer">
                    <button className="btn-modal-cancelar" onClick={onCancelar}>
                        Cancelar
                    </button>
                    <button className="btn-modal-confirmar" onClick={onConfirmar}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalConfirmar;