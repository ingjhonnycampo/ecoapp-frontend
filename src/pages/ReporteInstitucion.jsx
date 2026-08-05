import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Reportes.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Reutilizamos el mismo mapa de meses que en Reportes.jsx
const mapaMeses = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

function getLabelMes(mesClave) {
  if (!mesClave) return "";
  const partes = mesClave.split("-");
  if (partes.length !== 2) return mesClave;
  const [anio, mesNumero] = partes;
  const nombreMes = mapaMeses[mesNumero] || mesNumero;
  return `${nombreMes} ${anio}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "0.5rem 0.75rem",
        fontSize: "0.8rem",
      }}
    >
      <strong>{label}</strong>
      <ul style={{ listStyle: "none", padding: 0, margin: "0.25rem 0 0" }}>
        {payload.map((item) => (
          <li key={item.name}>
            {item.name}: {Number(item.value || 0).toFixed(2)} kg
          </li>
        ))}
      </ul>
    </div>
  );
};

function ReporteInstitucion() {
  const { id } = useParams(); // ID del colegio desde la URL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [colegioNombre, setColegioNombre] = useState("");
  const [mensual, setMensual] = useState([]);
  const [totalKilos, setTotalKilos] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError("");

        // Reutilizamos el endpoint global de estadísticas mensuales por colegio
        const res = await fetch(
          "http://localhost/reciclaje-app/backend/api/estadisticas_mensuales_colegios.php"
        );
        const data = await res.json();

        if (!data.success || !Array.isArray(data.data)) {
          setError("No se pudieron cargar las estadísticas de la institución.");
          return;
        }

        // Filtrar solo los registros del colegio con el ID de la URL
        const idColegio = Number(id);
        const filasColegio = data.data.filter(
          (fila) => Number(fila.id_colegio || fila.id) === idColegio
        );

        if (filasColegio.length === 0) {
          setError("No hay datos mensuales para esta institución.");
          return;
        }

        // Tomar nombre (suponemos que es el mismo en todas las filas)
        setColegioNombre(filasColegio[0].nombre_colegio || filasColegio[0].nombre);

        // Preparar datos mensuales
        const mensualPreparado = filasColegio
          .map((fila) => {
            const kilos = Number(fila.kilos_mes_colegio || fila.kilos || 0);
            return {
              mes: fila.mes,
              mesLabel: getLabelMes(fila.mes),
              kilos,
            };
          })
          .sort((a, b) => a.mes.localeCompare(b.mes)); // ordenar por fecha

        setMensual(mensualPreparado);

        // Calcular total de kilos
        const total = mensualPreparado.reduce(
          (acc, fila) => acc + Number(fila.kilos || 0),
          0
        );
        setTotalKilos(total);
      } catch (e) {
        console.error("Error al cargar reporte de institución:", e);
        setError("Error al cargar los datos. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  if (loading) {
    return (
      <div className="reportes-page">
        <h1 className="reportes-titulo">Reporte de institución</h1>
        <p className="texto-auxiliar">Cargando reporte de la institución...</p>
      </div>
    );
  }

  if (error || !colegioNombre) {
    return (
      <div className="reportes-page">
        <h1 className="reportes-titulo">Reporte de institución</h1>
        <p className="texto-auxiliar">{error || "Datos no disponibles."}</p>
      </div>
    );
  }

  const promedioMensual =
    mensual.length > 0 ? (totalKilos / mensual.length).toFixed(2) : "0.00";

  return (
    <div className="reportes-page">
      <h1 className="reportes-titulo">Reporte de institución</h1>
      <p className="reportes-subtitulo">
        {colegioNombre} (ID: {id})
      </p>

      {/* Tarjetas resumen para esta institución */}
      <div className="reportes-stats-grid">
        <div className="reportes-stat-card green">
          <div className="stat-icon">♻️</div>
          <div className="stat-info">
            <h3>Total reciclado</h3>
            <p className="stat-number">{Number(totalKilos).toFixed(2)} kg</p>
            <span className="stat-label">Acumulado en el programa</span>
          </div>
        </div>

        <div className="reportes-stat-card blue">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Promedio mensual</h3>
            <p className="stat-number">{promedioMensual} kg</p>
            <span className="stat-label">Por mes con registro</span>
          </div>
        </div>
      </div>

      {/* Gráfica de barras de desempeño mensual */}
      <div className="reportes-card">
        <h2>Desempeño mensual de la institución</h2>
        <p className="section-subtitle">
          Kilos reciclados por mes para {colegioNombre}.
        </p>

        {mensual.length === 0 ? (
          <p className="texto-auxiliar">
            Aún no hay datos mensuales para esta institución.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={mensual}
              margin={{ top: 30, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mesLabel" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="kilos"
                name="Kilos reciclados"
                fill="#4caf50"
                barSize={30}
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default ReporteInstitucion;