import React, { useEffect, useState } from 'react';

function MiPerfil() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');

  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [confirmarNueva, setConfirmarNueva] = useState('');
  
  // Mensaje para perfil
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Mensaje para contraseña
  const [mensajePass, setMensajePass] = useState({ tipo: '', texto: '' });
  
  const [mostrarPassActual, setMostrarPassActual] = useState(false);
  const [mostrarPassNueva, setMostrarPassNueva] = useState(false);
  const [mostrarConfirmarNueva, setMostrarConfirmarNueva] = useState(false);

  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario');
    const usuarioData = usuarioStr ? JSON.parse(usuarioStr) : null;
    setUsuario(usuarioData);
  }, []);

  useEffect(() => {
    if (!usuario) {
      setLoading(false);
      return;
    }

    const cargarPerfil = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');

        const response = await fetch(
          '${import.meta.env.VITE_API_BASE_URL}/perfil_estudiante.php',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success && data.data) {
          setPerfil(data.data);
          setNombre(data.data.nombre || '');
          setEmail(data.data.email || '');
        } else {
          setPerfil(null);
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        setPerfil(null);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [usuario]);

  const handleActualizarPerfil = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        '${import.meta.env.VITE_API_BASE_URL}/actualizar_perfil_estudiante.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre, email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMensaje({ tipo: 'success', texto: 'Perfil actualizado correctamente.' });
        setEditando(false);
        // Recargar perfil
        const token2 = localStorage.getItem('token');
        const res2 = await fetch(
          '${import.meta.env.VITE_API_BASE_URL}/perfil_estudiante.php',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token2}`,
            },
          }
        );
        const data2 = await res2.json();
        if (data2.success && data2.data) {
          setPerfil(data2.data);
        }
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al actualizar perfil.' });
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar perfil.' });
    }
  };

  const handleCambiarContrasena = async (e) => {
    e.preventDefault();
    setMensajePass({ tipo: '', texto: '' });

    if (passNueva !== confirmarNueva) {
      setMensajePass({ tipo: 'error', texto: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        '${import.meta.env.VITE_API_BASE_URL}/cambiar_contrasena_estudiante.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            password_actual: passActual,
            password_nueva: passNueva,
            confirmar_nueva: confirmarNueva,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
  setMensajePass({ tipo: 'success', texto: 'Contraseña actualizada correctamente.' });
  
  // Opcional: cerrar el formulario después de 2 segundos
  setTimeout(() => {
    setCambiandoPass(false);
    setPassActual('');
    setPassNueva('');
    setConfirmarNueva('');
    setMensajePass({ tipo: '', texto: '' });
  }, 2000);
  
  return; // Salimos para que no haga nada más

      } else {
        setMensajePass({ tipo: 'error', texto: data.message || 'Error al cambiar contraseña.' });
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setMensajePass({ tipo: 'error', texto: 'Error al cambiar contraseña.' });
    }
  };

  if (!usuario) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>⚠️ No hay sesión activa</h2>
        <p>Inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        👤 Mi Perfil
      </h1>

      {loading && (
        <p style={{ textAlign: 'center' }}>Cargando perfil...</p>
      )}

      {!loading && !perfil && (
        <p style={{ textAlign: 'center' }}>
          No se pudo cargar la información de tu perfil.
        </p>
      )}

      {!loading && perfil && (
        <>
          <div
            style={{
              maxWidth: 700,
              margin: '0 auto',
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.08)',
              padding: '1.5rem',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '48px', marginBottom: '0.5rem' }}>🎓</div>
              <h2 style={{ margin: 0, fontSize: '22px' }}>{perfil.nombre}</h2>
              <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '14px' }}>
                {perfil.email}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                fontSize: '14px',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>Rol</div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>{perfil.rol}</div>
              </div>

              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>Colegio</div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>
                  {perfil.colegio_nombre || '—'}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#666', fontSize: '12px' }}>Curso</div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>
                  {perfil.curso_completo || '—'}
                </div>
                <div style={{ color: '#999', fontSize: '12px', marginTop: '0.25rem' }}>
                  El curso no puede ser modificado por el estudiante.
                </div>
              </div>
            </div>

            {/* Mensaje de perfil */}
            {mensaje.texto && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 8,
                  marginBottom: '1rem',
                  background: mensaje.tipo === 'success' ? '#e8f5e9' : '#ffebee',
                  color: mensaje.tipo === 'success' ? '#2e7d32' : '#c62828',
                  fontSize: '14px',
                }}
              >
                {mensaje.texto}
              </div>
            )}

            {/* Sección de datos básicos */}
            {!editando ? (
              <>
                <h3 style={{ marginBottom: '0.75rem' }}>Datos básicos</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#666', fontSize: '13px' }}>Nombre</div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>
                    {perfil.nombre}
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#666', fontSize: '13px' }}>Email</div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>
                    {perfil.email}
                  </div>
                </div>

                <button
  className="perfil-btn"
  onClick={() => setEditando(true)}
  style={{ marginRight: '0.5rem' }}
>
  ✏️ Editar datos
</button>

<button
  className="perfil-btn"
  onClick={() => {
    setCambiandoPass(true);
    setMensajePass({ tipo: '', texto: '' });
  }}
>
  🔑 Cambiar contraseña
</button>
              </>
            ) : (
              <form onSubmit={handleActualizarPerfil}>
                <h3 style={{ marginBottom: '0.75rem' }}>Editar datos</h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '13px' }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #ccc',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '13px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #ccc',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="action-btn"
                  style={{ marginRight: '0.5rem' }}
                >
                  💾 Guardar cambios
                </button>

                <button
                  type="button"
                  className="perfil-btn"
                  onClick={() => {
                    setEditando(false);
                    setMensaje({ tipo: '', texto: '' });
                  }}
                >
                  ❌ Cancelar
                </button>
              </form>
            )}

            {/* Cambiar contraseña */}
            {cambiandoPass && (
              <form
                onSubmit={handleCambiarContrasena}
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#f5f7fa',
                  borderRadius: 10,
                }}
              >
                <h3 style={{ marginBottom: '0.75rem' }}>Cambiar contraseña</h3>

                {/* Mensaje de contraseña */}
                {mensajePass.texto && (
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 8,
                      marginBottom: '1rem',
                      background: mensajePass.tipo === 'success' ? '#e8f5e9' : '#ffebee',
                      color: mensajePass.tipo === 'success' ? '#2e7d32' : '#c62828',
                      fontSize: '14px',
                    }}
                  >
                    {mensajePass.texto}
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '13px' }}>
                    Contraseña actual
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={mostrarPassActual ? 'text' : 'password'}
                      className="perfil-input"
                      value={passActual}
                      onChange={(e) => setPassActual(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setMostrarPassActual((v) => !v)}
                      title={mostrarPassActual ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarPassActual ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '13px' }}>
                    Nueva contraseña
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={mostrarPassNueva ? 'text' : 'password'}
                      className="perfil-input"
                      value={passNueva}
                      onChange={(e) => setPassNueva(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setMostrarPassNueva((v) => !v)}
                      title={mostrarPassNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarPassNueva ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '13px' }}>
                    Confirmar nueva contraseña
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={mostrarConfirmarNueva ? 'text' : 'password'}
                      className="perfil-input"
                      value={confirmarNueva}
                      onChange={(e) => setConfirmarNueva(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setMostrarConfirmarNueva((v) => !v)}
                      title={mostrarConfirmarNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarConfirmarNueva ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="perfil-buttons">
                  <button type="submit" className="perfil-btn perfil-btn-primary">
                    💾 Guardar contraseña
                  </button>

                  <button
                    type="button"
                    className="perfil-btn"
                    onClick={() => {
                      setCambiandoPass(false);
                      setPassActual('');
                      setPassNueva('');
                      setConfirmarNueva('');
                      setMensajePass({ tipo: '', texto: '' });
                    }}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MiPerfil;