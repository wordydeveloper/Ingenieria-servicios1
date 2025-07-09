document.addEventListener('DOMContentLoaded', function() {
    const tabla = document.querySelector('#tablaEventos tbody');
    const alertManager = new AlertManager('alertContainer');
    const modalEvento = new bootstrap.Modal(document.getElementById('modalEvento'));
    const formEvento = document.getElementById('formEvento');
    const btnNuevoEvento = document.getElementById('btnNuevoEvento');
    const btnGuardarEvento = document.getElementById('btnGuardarEvento');
    const eventoBtnText = document.getElementById('eventoBtnText');
    const eventoSpinner = document.getElementById('eventoSpinner');

    // Campos del formulario
    const eventoId = document.getElementById('eventoId');
    const nombreEvento = document.getElementById('nombreEvento');
    const fechaEvento = document.getElementById('fechaEvento');
    const estadoEvento = document.getElementById('estadoEvento');
    const modalTitulo = document.getElementById('modalEventoTitulo');

    // Loading manager para el botón guardar
    const loadingManager = new LoadingManager('btnGuardarEvento', 'eventoBtnText', 'eventoSpinner');

    // Listar eventos
    async function cargarEventos() {
        tabla.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
        try {
            const data = await apiClient.get('/internal/evento/');
            tabla.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(ev => {
                    tabla.innerHTML += `
                        <tr>
                            <td>${ev.id}</td>
                            <td>${ev.nombre}</td>
                            <td>${ev.fecha ? ev.fecha.split('T')[0] : ''}</td>
                            <td>${ev.estado === 'AC' ? 'Activo' : 'Inactivo'}</td>
                            <td>
                                <button class="btn btn-sm btn-warning btn-editar" data-id="${ev.id}"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-danger btn-eliminar" data-id="${ev.id}"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                tabla.innerHTML = '<tr><td colspan="5" class="text-center">No hay eventos registrados.</td></tr>';
            }
        } catch (err) {
            tabla.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar eventos.</td></tr>';
            alertManager.show('No se pudieron cargar los eventos.', 'danger');
        }
    }

    // Mostrar modal para nuevo evento
    btnNuevoEvento.addEventListener('click', () => {
        formEvento.reset();
        eventoId.value = '';
        modalTitulo.textContent = 'Nuevo Evento';
        modalEvento.show();
    });

    // Guardar evento (crear o actualizar)
    formEvento.addEventListener('submit', async function(e) {
        e.preventDefault();
        loadingManager.setLoading(true);

        const evento = {
            nombre: nombreEvento.value.trim(),
            fecha: fechaEvento.value,
            estado: estadoEvento.value
        };

        try {
            if (eventoId.value) {
                // Actualizar
                await apiClient.request('/internal/evento/actualizar', {
                    method: 'PATCH',
                    body: JSON.stringify({ id: eventoId.value, ...evento }),
                    headers: { 'Content-Type': 'application/json' }
                });
                alertManager.show('Evento actualizado correctamente', 'success');
            } else {
                // Crear
                await apiClient.post('/internal/evento/registrar', evento);
                alertManager.show('Evento registrado correctamente', 'success');
            }
            modalEvento.hide();
            cargarEventos();
        } catch (err) {
            alertManager.show('Error al guardar el evento', 'danger');
        } finally {
            loadingManager.setLoading(false);
        }
    });

    // Editar evento
    tabla.addEventListener('click', async function(e) {
        if (e.target.closest('.btn-editar')) {
            const id = e.target.closest('.btn-editar').dataset.id;
            try {
                const data = await apiClient.get(`/internal/evento/${id}`);
                eventoId.value = data.id;
                nombreEvento.value = data.nombre;
                fechaEvento.value = data.fecha ? data.fecha.split('T')[0] : '';
                estadoEvento.value = data.estado;
                modalTitulo.textContent = 'Editar Evento';
                modalEvento.show();
            } catch (err) {
                alertManager.show('No se pudo cargar el evento', 'danger');
            }
        }
    });

    // Eliminar evento
    tabla.addEventListener('click', async function(e) {
        if (e.target.closest('.btn-eliminar')) {
            const id = e.target.closest('.btn-eliminar').dataset.id;
            if (confirm('¿Seguro que deseas eliminar este evento?')) {
                try {
                    await apiClient.delete(`/internal/evento/${id}`);
                    alertManager.show('Evento eliminado', 'success');
                    cargarEventos();
                } catch (err) {
                    alertManager.show('No se pudo eliminar el evento', 'danger');
                }
            }
        }
    });

    // Inicializar
    cargarEventos();
});