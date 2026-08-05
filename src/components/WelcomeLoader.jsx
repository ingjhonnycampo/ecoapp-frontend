import { useState, useEffect } from 'react';
import './WelcomeLoader.css';

function WelcomeLoader({ onComplete }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 300);
                    return 100;
                }
                return prev + 4;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="welcome-loader">
            <div className="welcome-content">
                <img src="/image.jpg" alt="EcoApp" className="welcome-logo" />
                <h1 className="welcome-title">
                    <span className="eco">🌱 Eco</span>
                    <span className="app">App</span>
                    <span className="escolar">🎓 Escolar</span>
                </h1>
                <p className="welcome-message">¡Bienvenido a esta gran aventura! 🚀</p>
                <p className="welcome-submessage">Juntos hacemos la diferencia 🌍💚</p>
                
                <div className="progress-container">
                    <div className="progress-bar" style={{width: `${progress}%`}}></div>
                </div>
                <p className="progress-text">{progress}%</p>
            </div>
        </div>
    );
}

export default WelcomeLoader;