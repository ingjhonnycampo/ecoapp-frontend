import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="main-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>🌱 EcoApp Escolar</h3>
                    <p>Gestión inteligente de reciclaje educativo</p>
                </div>

                <div className="footer-section">
                    <h4>📞 Contacto</h4>
                    <p>📧 info@ecoappescolar.com</p>
                    <p>🌐 www.ecoappescolar.com</p>
                </div>

                <div className="footer-section">
                    <h4>🔗 Enlaces</h4>
                    <p>📖 Manual de usuario</p>
                    <p>❓ Preguntas frecuentes</p>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {currentYear} EcoApp Escolar - Todos los derechos reservados</p>
                <p>Diseñado con 💚 por <strong>Ing. Jhonny Campo Herrera</strong></p>
            </div>
        </footer>
    );
}

export default Footer;