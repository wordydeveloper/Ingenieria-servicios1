const API_URL = "http://127.0.0.1:8000/internal/categoria-evento";
const token = localStorage.getItem("token");

function cargarCategorias() {
  fetch(API_URL + "/", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById("tablaCategorias");
    tbody.innerHTML = "";
    data.data.forEach(cat => {
      tbody.innerHTML += `
        <tr>
          <td>${cat.categoriaEventoId}</td>
          <td><input type="text" class="form-control" id="nombre-${cat.categoriaEventoId}" value="${cat.nombre}"></td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="actualizarCategoria(${cat.categoriaEventoId})">Actualizar</button>
          </td>
        </tr>
      `;
    });
  })
  .catch(error => alert("Error cargando categorías: " + error));
}

function registrarCategoria() {
  const nombre = document.getElementById("nombreCategoria").value;
  fetch(API_URL + "/registrar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ nombre })
  })
  .then(res => {
    if (res.status === 201) {
      alert("Categoría registrada correctamente");
      cargarCategorias();
      document.getElementById("nombreCategoria").value = "";
    } else {
      return res.json().then(err => { throw new Error(err.detail); });
    }
  })
  .catch(error => alert("Error registrando: " + error.message));
}

function actualizarCategoria(id) {
  const nombre = document.getElementById(`nombre-${id}`).value;
  fetch(API_URL + "/actualizar", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ categoriaEventoId: id, nombre })
  })
  .then(res => {
    if (res.ok) {
      alert("Categoría actualizada");
      cargarCategorias();
    } else {
      return res.json().then(err => { throw new Error(err.detail); });
    }
  })
  .catch(error => alert("Error actualizando: " + error.message));
}

window.onload = cargarCategorias;
