const API_URL = 'http://127.0.0.1:8000/internal/evento'; // Ajusta si usas dominio distinto

document.addEventListener('DOMContentLoaded', () => {
  cargarEventos();

  document.getElementById('formEvento').addEventListener('submit', guardarEvento);
  document.getElementById('btnNuevoEvento').addEventListener('click', () => {
    document.getElementById('modalEventoTitulo').innerHTML = '<i class="bi bi-calendar-plus"></i> Nuevo Evento';
    document.getElementById('formEvento').reset();
    document.getElementById('eventoId').value = '';
    new bootstrap.Modal(document.getElementById('modalEvento')).show();
  });
});

async function cargarEventos() {
  const tbody = document.querySelector('#tablaEventos tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="table-loading">
        <div class="spinner-border text-primary"></div>
        <div>Cargando eventos...</div>
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`${API_URL}/`);
    const data = await res.json();

    document.getElementById('eventCount').textContent = data.length;

    tbody.innerHTML = data.map(evento => `
      <tr>
        <td>${evento.id}</td>
        <td>${evento.nombre}</td>
        <td>${evento.fecha}</td>
        <td>
          <span class="badge ${evento.estado === 'AC' ? 'badge-active' : 'badge-inactive'}">
            ${evento.estado === 'AC' ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td class="table-actions">
          <button class="btn btn-warning" onclick="editarEvento(${evento.id})"><i class="bi bi-pencil-square"></i></button>
          <button class="btn btn-danger" onclick="confirmarEliminar(${evento.id})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5"><div class="alert alert-danger">Error al cargar eventos</div></td></tr>`;
  }
}

async function guardarEvento(e) {
  e.preventDefault();

  const id = document.getElementById('eventoId').value;
  const nombre = document.getElementById('nombreEvento').value;
  const fecha = document.getElementById('fechaEvento').value;
  const estado = document.getElementById('estadoEvento').value;

  const payload = { nombre, fecha, estado };

  const btn = document.getElementById('btnGuardarEvento');
  document.getElementById('eventoBtnText').classList.add('d-none');
  document.getElementById('eventoSpinner').classList.remove('d-none');

  try {
    const res = await fetch(`${API_URL}/${id ? 'actualizar' : 'registrar'}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id: parseInt(id), ...payload } : payload)
    });

    if (!res.ok) throw new Error('Error al guardar');

    bootstrap.Modal.getInstance(document.getElementById('modalEvento')).hide();
    cargarEventos();
  } catch (err) {
    alert('Error al guardar el evento');
  } finally {
    document.getElementById('eventoBtnText').classList.remove('d-none');
    document.getElementById('eventoSpinner').classList.add('d-none');
  }
}

async function editarEvento(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const evento = await res.json();

    document.getElementById('modalEventoTitulo').innerHTML = '<i class="bi bi-pencil-square"></i> Editar Evento';
    document.getElementById('eventoId').value = evento.id;
    document.getElementById('nombreEvento').value = evento.nombre;
    document.getElementById('fechaEvento').value = evento.fecha;
    document.getElementById('estadoEvento').value = evento.estado;

    new bootstrap.Modal(document.getElementById('modalEvento')).show();
  } catch (err) {
    alert('No se pudo cargar el evento');
  }
}

let idAEliminar = null;
function confirmarEliminar(id) {
  idAEliminar = id;
  new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
}

document.getElementById('btnConfirmarEliminar').addEventListener('click', async () => {
  try {
    const res = await fetch(`${API_URL}/${idAEliminar}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar');
    bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar')).hide();
    cargarEventos();
  } catch (err) {
    alert('Error al eliminar evento');
  }
});
