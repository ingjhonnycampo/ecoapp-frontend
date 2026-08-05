// frontend/src/pages/UsuariosGlobal.jsx
import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import "./UsuariosGlobal.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function UsuariosGlobal() {
  const { usuario, token } = useContext(AuthContext);
  const formularioRef = useRef(null);
  const [usuarios, setUsuarios] = useState([]);
  const [colegios, setColegios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [salones, setSalones] = useState([]);

  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingColegios, setLoadingColegios] = useState(true);
  const [loadingGrados, setLoadingGrados] = useState(false);
  const [loadingSalones, setLoadingSalones] = useState(false);

  const [errorGlobal, setErrorGlobal] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    colegio_id: "",
    rol: "estudiante",
    grado_id: "",
    salon_id: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Cargar usuarios globales (GET usuarios.php)
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        setErrorGlobal("");

        const tokenActual = localStorage.getItem('token');
        console.log('Token enviado:', tokenActual);

        if (!tokenActual) {
          setErrorGlobal("No hay sesión válida (token faltante).");
          setLoadingUsuarios(false);
          return;
        }

        const res = await fetch(
          `${BASE_URL}/usuarios.php`,
          {
            headers: {
              Authorization: `Bearer ${tokenActual}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) {
          const texto = await res.text();
          console.error("Respuesta no JSON de usuarios.php:", texto);
          throw new Error(
            "El endpoint usuarios.php no está devolviendo JSON válido"
          );
        }

        const data = await res.json();
        console.log('Respuesta de usuarios.php:', data);

        if (data.success) {
          setUsuarios(data.data || []);
        } else {
          setErrorGlobal(data.message || "Error al cargar usuarios");
        }
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        setErrorGlobal("Error al cargar usuarios globales");
      } finally {
        setLoadingUsuarios(false);
      }
    };

    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar colegios
  useEffect(() => {
    const cargarColegios = async () => {
      try {
        setLoadingColegios(true);
        const res = await fetch(
          `${BASE_URL}/colegios_publicos.php`
        );
        const data = await res.json();
        if (data.success) {
          setColegios(data.data || []);
        } else {
          setErrorGlobal(data.message || "Error al cargar colegios");
        }
      } catch (err) {
        console.error("Error al cargar colegios:", err);
        setErrorGlobal("Error al cargar listado de colegios");
      } finally {
        setLoadingColegios(false);
      }
    };

    cargarColegios();
  }, []);

  // Cargar grados según colegio (solo para estudiantes)
  useEffect(() => {
    const { colegio_id, rol } = formData;
    if (rol === "estudiante" && colegio_id) {
      const cargarGrados = async () => {
        try {
          setLoadingGrados(true);
          const res = await fetch(
            `${BASE_URL}/grados_select.php?colegio_id=${colegio_id}`
          );
          const data = await res.json();
          if (data.success) {
            setGrados(data.data || []);
          } else {
            setErrorGlobal(data.message || "Error al cargar grados");
          }
        } catch (err) {
          console.error("Error al cargar grados:", err);
          setErrorGlobal("Error al cargar grados");
        } finally {
          setLoadingGrados(false);
        }
      };
      cargarGrados();
    } else {
      setGrados([]);
      setSalones([]);
      setFormData((prev) => ({
        ...prev,
        grado_id: "",
        salon_id: "",
      }));
    }
  }, [formData.colegio_id, formData.rol]);

  // Cargar salones según colegio y grado (solo estudiantes)
  useEffect(() => {
    const { colegio_id, grado_id, rol } = formData;
    if (rol === "estudiante" && colegio_id && grado_id) {
      const cargarSalones = async () => {
        try {
          setLoadingSalones(true);
          const res = await fetch(
            `${BASE_URL}/salones_select.php?colegio_id=${colegio_id}&grado_id=${grado_id}`
          );
          const data = await res.json();
          if (data.success) {
            setSalones(data.data || []);
          } else {
            setErrorGlobal(data.message || "Error al cargar salones");
          }
        } catch (err) {
          console.error("Error al cargar salones:", err);
          setErrorGlobal("Error al cargar salones");
        } finally {
          setLoadingSalones(false);
        }
      };
      cargarSalones();
    } else {
      setSalones([]);
      setFormData((prev) => ({
        ...prev,
        salon_id: "",
      }));
    }
  }, [formData.grado_id, formData.colegio_id, formData.rol]);

  // Filtro por nombre (solo activos para la tabla principal)
  const usuariosFiltrados = usuarios
    .filter((u) => u.activo !== 0)
    .filter((u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      // Orden de rol: coordinador -> estudiante -> superadmin
      const ordenRol = { coordinador: 1, estudiante: 2, superadmin: 3 };
      const rolA = ordenRol[a.rol] ?? 99;
      const rolB = ordenRol[b.rol] ?? 99;

      if (rolA !== rolB) {
        return rolA - rolB;
      }

      // Si mismo rol, orden alfabético por nombre
      return a.nombre.localeCompare(b.nombre);
    });

  // Usuarios desactivados
  const usuariosDesactivados = usuarios.filter((u) => u.activo === 0);

  // Agrupar usuarios por colegio_nombre (o por id si no hay nombre)
  const usuariosPorColegio = usuariosFiltrados.reduce((acc, u) => {
    const key = u.colegio_nombre || `Colegio #${u.colegio_id || "Sin colegio"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  const abrirFormularioNuevo = () => {
    setFormData({
      id: null,
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
      colegio_id: "",
      rol: "estudiante",
      grado_id: "",
      salon_id: "",
    });
    setFormErrors({});
    setErrorGlobal("");
    setModoEdicion(false);
    setMostrarFormulario(true);

    // Scroll al formulario
    setTimeout(() => {
      if (formularioRef.current) {
        formularioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  };

  const abrirFormularioEdicion = (usuarioSel) => {
    setFormData({
      id: usuarioSel.id,
      nombre: usuarioSel.nombre || "",
      email: usuarioSel.email || "",
      password: "",
      confirmPassword: "",
      colegio_id: usuarioSel.colegio_id || "",
      rol: usuarioSel.rol || "estudiante",
      grado_id: usuarioSel.grado_id || "",
      salon_id: usuarioSel.salon_id || "",
    });
    setFormErrors({});
    setErrorGlobal("");
    setModoEdicion(true);
    setMostrarFormulario(true);

    // Scroll al formulario
    setTimeout(() => {
      if (formularioRef.current) {
        formularioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nuevoValor = name === "nombre" ? value.toUpperCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nuevoValor,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRolChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      rol: value,
      grado_id: value === "estudiante" ? prev.grado_id : "",
      salon_id: value === "estudiante" ? prev.salon_id : "",
    }));
    setFormErrors((prev) => ({
      ...prev,
      grado_id: "",
      salon_id: "",
    }));
  };

  const handleGradoChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      grado_id: value,
      salon_id: "",
    }));
    if (formErrors.grado_id) {
      setFormErrors((prev) => ({
        ...prev,
        grado_id: "",
      }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!modoEdicion) {
      if (!formData.password) {
        newErrors.password = "La contraseña es obligatoria";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mínimo 6 caracteres";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }

    if (!formData.colegio_id) {
      newErrors.colegio_id = "Selecciona la institución";
    }

    if (!formData.rol) {
      newErrors.rol = "Selecciona el rol";
    }

    if (formData.rol === "estudiante") {
      if (!formData.grado_id) {
        newErrors.grado_id = "Selecciona el grado";
      }
      if (!formData.salon_id) {
        newErrors.salon_id = "Selecciona el salón";
      }
    }

    const emailExiste = usuarios.some(
      (u) =>
        u.email.toLowerCase() === formData.email.toLowerCase() &&
        u.id !== formData.id
    );
    if (emailExiste) {
      newErrors.email = "El email ya está registrado en el sistema";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [modalMensaje, setModalMensaje] = useState("");
  const [modalTipo, setModalTipo] = useState("success");
  const [modalVisible, setModalVisible] = useState(false);

  const abrirModalMensaje = (mensaje, tipo = "success") => {
    setModalMensaje(mensaje);
    setModalTipo(tipo);
    setModalVisible(true);
  };

  const cerrarModalMensaje = () => {
    setModalVisible(false);
    setModalMensaje("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGlobal("");

    if (!validarFormulario()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nombre: formData.nombre.trim().toUpperCase(),
        email: formData.email.trim(),
        rol: formData.rol,
        colegio_id: formData.colegio_id || null,
        grado_id:
          formData.rol === "estudiante" ? formData.grado_id || null : null,
        salon_id:
          formData.rol === "estudiante" ? formData.salon_id || null : null,
      };

      let res;
      if (!modoEdicion) {
        // Crear usuario desde administración (3 roles)
        res = await fetch(
          `${BASE_URL}/usuarios_create.php`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({
              ...payload,
              password: formData.password,
            }),
          }
        );
      } else {
        // Actualizar usuario
        res = await fetch(
          `${BASE_URL}/usuarios.php?id=${formData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();

      if (!data.success) {
        const mensajeError = data.message || "Error al guardar usuario";
        if (data.message === "El email ya está registrado") {
          setFormErrors((prev) => ({
            ...prev,
            email: data.message,
          }));
        } else {
          setErrorGlobal(mensajeError);
        }
        abrirModalMensaje(mensajeError, "error");
        return;
      }

      // Éxito
      abrirModalMensaje(
        modoEdicion
          ? (data.message || "Usuario actualizado exitosamente")
          : (data.message || "Usuario creado exitosamente"),
        "success"
      );

      if (!modoEdicion) {
        const nuevoUsuario = {
          id: data.id,
          nombre: payload.nombre,
          email: payload.email,
          rol: payload.rol,
          colegio_id: payload.colegio_id,
          colegio_nombre:
            colegios.find((c) => c.id === Number(payload.colegio_id))?.nombre ||
            "",
          grado_id: payload.grado_id,
          salon_id: payload.salon_id,
          grado_nombre:
            payload.grado_id
              ? grados.find((g) => g.id === Number(payload.grado_id))?.nombre || null
              : null,
          salon_nombre:
            payload.salon_id
              ? salones.find((s) => s.id === Number(payload.salon_id))?.nombre || null
              : null,
          activo: 1,
        };
        setUsuarios((prev) => [nuevoUsuario, ...prev]);
      } else {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === formData.id
              ? {
                  ...u,
                  nombre: payload.nombre,
                  email: payload.email,
                  rol: payload.rol,
                  colegio_id: payload.colegio_id,
                  colegio_nombre:
                    colegios.find(
                      (c) => c.id === Number(payload.colegio_id)
                    )?.nombre || "",
                  grado_id: payload.grado_id,
                  salon_id: payload.salon_id,
                  grado_nombre:
                    payload.grado_id
                      ? grados.find((g) => g.id === Number(payload.grado_id))?.nombre || null
                      : null,
                  salon_nombre:
                    payload.salon_id
                      ? salones.find((s) => s.id === Number(payload.salon_id))?.nombre || null
                      : null,
                }
              : u
          )
        );
      }

      cerrarFormulario();
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      setErrorGlobal("Error al guardar usuario. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const desactivarUsuario = async (usuarioSel) => {
    if (!window.confirm(`¿Desactivar al usuario ${usuarioSel.nombre}?`)) {
      return;
    }

    try {
      const res = await fetch(
        `${BASE_URL}/usuarios.php?id=${usuarioSel.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );
      const data = await res.json();

      if (!data.success) {
        const mensajeError = data.message || "Error al desactivar usuario";
        setErrorGlobal(mensajeError);
        abrirModalMensaje(mensajeError, "error");
        return;
      }

      // No lo eliminamos, lo marcamos como inactivo
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioSel.id ? { ...u, activo: 0 } : u
        )
      );

      // Mensaje de éxito
      abrirModalMensaje(
        data.message || "Usuario desactivado exitosamente",
        "success"
      );
    } catch (err) {
      console.error("Error al desactivar usuario:", err);
      const mensajeError = "Error al desactivar usuario. Intenta de nuevo.";
      setErrorGlobal(mensajeError);
      abrirModalMensaje(mensajeError, "error");
    }
  };

  const activarUsuario = async (usuarioSel) => {
    try {
      const res = await fetch(
        `${BASE_URL}/usuarios.php?id=${usuarioSel.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ activo: 1 }),
        }
      );
      const data = await res.json();

      if (!data.success) {
        const mensajeError = data.message || "Error al reactivar usuario";
        setErrorGlobal(mensajeError);
        abrirModalMensaje(mensajeError, "error");
        return;
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioSel.id ? { ...u, activo: 1 } : u
        )
      );

      // Mensaje de éxito
      abrirModalMensaje(
        data.message || "Usuario reactivado exitosamente",
        "success"
      );
    } catch (err) {
      console.error("Error al reactivar usuario:", err);
      const mensajeError = "Error al reactivar usuario. Intenta de nuevo.";
      setErrorGlobal(mensajeError);
      abrirModalMensaje(mensajeError, "error");
    }
  };

  return (
    <div className="page-container usuarios-global-page">
      <div className="page-header">
        <div>
          <h1>👤 Gestión global de usuarios</h1>
          <p>
            Lista de usuarios por institución y formulario para crear y gestionar cuentas.
          </p>
        </div>
        {usuario?.rol === "superadmin" && (
          <button
            className="btn-primario"
            onClick={abrirFormularioNuevo}
          >
            ➕ Nuevo usuario
          </button>
        )}
      </div>

      <div className="barra-busqueda">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {errorGlobal && (
        <p className="mensaje-error">{errorGlobal}</p>
      )}

      {/* Formulario de creación/edición */}
      {mostrarFormulario && (
        <div
          className="card formulario-usuario-global"
          ref={formularioRef}
        >
          <h2>
            {modoEdicion ? "Editar usuario" : "Crear nuevo usuario"}
          </h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: JUAN PÉREZ"
                  disabled={saving}
                />
                {formErrors.nombre && (
                  <span className="error-text">
                    {formErrors.nombre}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@colegio.edu.co"
                  disabled={saving}
                />
                {formErrors.email && (
                  <span className="error-text">
                    {formErrors.email}
                  </span>
                )}
              </div>

              {!modoEdicion && (
                <>
                  <div className="form-group">
                    <label>Contraseña *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      disabled={saving}
                    />
                    {formErrors.password && (
                      <span className="error-text">
                        {formErrors.password}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Confirmar contraseña *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repite la contraseña"
                      disabled={saving}
                    />
                    {formErrors.confirmPassword && (
                      <span className="error-text">
                        {formErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Rol *</label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleRolChange}
                  disabled={saving}
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="superadmin">Superadmin</option>
                </select>
                {formErrors.rol && (
                  <span className="error-text">
                    {formErrors.rol}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Institución *</label>
                {loadingColegios ? (
                  <p>Cargando colegios...</p>
                ) : (
                  <select
                    name="colegio_id"
                    value={formData.colegio_id}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">
                      Selecciona un colegio
                    </option>
                    {colegios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - {c.ciudad}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.colegio_id && (
                  <span className="error-text">
                    {formErrors.colegio_id}
                  </span>
                )}
              </div>

              {formData.rol === "estudiante" && (
                <>
                  <div className="form-group">
                    <label>Grado *</label>
                    {loadingGrados ? (
                      <p>Cargando grados...</p>
                    ) : (
                      <select
                        name="grado_id"
                        value={formData.grado_id}
                        onChange={handleGradoChange}
                        disabled={
                          saving || !formData.colegio_id
                        }
                      >
                        <option value="">Selecciona</option>
                        {grados.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                    {formErrors.grado_id && (
                      <span className="error-text">
                        {formErrors.grado_id}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Salón *</label>
                    {loadingSalones ? (
                      <p>Cargando salones...</p>
                    ) : (
                      <select
                        name="salon_id"
                        value={formData.salon_id}
                        onChange={handleChange}
                        disabled={
                          saving || !formData.grado_id
                        }
                      >
                        <option value="">Selecciona</option>
                        {salones.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                    {formErrors.salon_id && (
                      <span className="error-text">
                        {formErrors.salon_id}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secundario"
                onClick={cerrarFormulario}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primario"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : modoEdicion
                  ? "Actualizar usuario"
                  : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado por institución */}
      <div className="usuarios-global-lista">
        {loadingUsuarios ? (
          <p>Cargando usuarios...</p>
        ) : Object.keys(usuariosPorColegio).length === 0 ? (
          <p>No hay usuarios registrados con ese filtro.</p>
        ) : (
          Object.entries(usuariosPorColegio).map(
            ([colegioNombre, lista]) => (
              <div className="card" key={colegioNombre}>
                <h2>
                  <span className="institucion-icon">🏫</span>
                  {colegioNombre}
                </h2>
                <p className="tabla-subtitulo">Usuarios activos en esta institución</p>
                <table className="tabla-usuarios">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Grado</th>
                      <th>Salón</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((u) => {
                      let filaClase = "";
                      let chipClase = "";
                      let rolTexto = "";

                      switch (u.rol) {
                        case "coordinador":
                          filaClase = "fila-coordinador";
                          chipClase = "chip-rol chip-coordinador";
                          rolTexto = "Coordinador";
                          break;
                        case "superadmin":
                          filaClase = "fila-superadmin";
                          chipClase = "chip-rol chip-superadmin";
                          rolTexto = "Superadmin";
                          break;
                        default:
                          filaClase = "fila-estudiante";
                          chipClase = "chip-rol chip-estudiante";
                          rolTexto = "Estudiante";
                      }

                      return (
                        <tr key={u.id} className={filaClase}>
                          <td>{u.nombre}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={chipClase}>{rolTexto}</span>
                          </td>
                          <td>{u.grado_nombre || "—"}</td>
                          <td>{u.salon_nombre || "—"}</td>
                          <td>
                            <button
                              className="btn-accion btn-editar"
                              title="Editar"
                              onClick={() => abrirFormularioEdicion(u)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-accion btn-danger"
                              title="Desactivar"
                              onClick={() => desactivarUsuario(u)}
                            >
                              🛑
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )
        )}
      </div>

      {/* Lista de usuarios desactivados */}
      {usuariosDesactivados.length > 0 && (
        <div className="usuarios-global-desactivados">
          <h2>Usuarios desactivados</h2>
          <table className="tabla-usuarios tabla-usuarios-desactivados">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Institución</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuariosDesactivados.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>{u.rol}</td>
                  <td>{u.colegio_nombre || `Colegio #${u.colegio_id}`}</td>
                  <td>
                    <button
                      className="btn-accion btn-reactivar"
                      title="Reactivar"
                      onClick={() => activarUsuario(u)}
                    >
                      🔄
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalVisible && (
        <div className="modal-overlay">
          <div className={`modal-card modal-${modalTipo}`}>
            <h3>{modalTipo === "success" ? "Operación exitosa" : "Error"}</h3>
            <p>{modalMensaje}</p>
            <div className="modal-actions">
              <button
                className="btn-primario"
                onClick={cerrarModalMensaje}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosGlobal;