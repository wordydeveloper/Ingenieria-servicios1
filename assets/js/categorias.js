document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
});

async function cargarCategorias() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    alert("No estás autenticado.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/internal/categoria-evento/", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.data) {
      llenarTabla(data.data);
    } else {
      alert("Error al cargar categorías.");
    }
  } catch (error) {
    alert("Error de red al cargar categorías.");
    console.error(error);
  }
}

function llenarTabla(categorias) {
  const tabla = document.getElementById("tablaCategorias");
  tabla.innerHTML = "";

  categorias.forEach(cat => {
    const estadoTexto = cat.estado === "AC" ? "Activo" : "Inactivo";
    const estadoBadge = cat.estado === "AC" ? "success" : "secondary";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${cat.categoriaEventoId}</td>
      <td><strong>${cat.nombre}</strong></td>
      <td><span class="badge bg-${estadoBadge}">${estadoTexto}</span></td>
    `;
    tabla.appendChild(fila);
  });
}

async function registrarCategoria() {
  const nombre = document.getElementById("nombreCategoria").value.trim();
  const estado = document.getElementById("estadoCategoria").value;
  const token = localStorage.getItem("access_token");

  if (!nombre) {
    alert("El nombre es obligatorio.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/internal/categoria-evento/registrar", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre, estado })
    });

    if (response.ok) {
      alert("Categoría registrada correctamente.");
      bootstrap.Modal.getInstance(document.getElementById("modalRegistrar")).hide();
      document.getElementById("nombreCategoria").value = "";
      document.getElementById("estadoCategoria").value = "AC";
      cargarCategorias();
    } else {
      alert("Error al registrar categoría.");
    }
  } catch (error) {
    alert("Error de red al registrar.");
    console.error(error);
  }
}

async function buscarCategoriaPorId() {
  const id = document.getElementById("idCategoriaActualizar").value.trim();
  const token = localStorage.getItem("access_token");

  if (!id) {
    alert("Ingresa un ID.");
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/internal/categoria-evento/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.data) {
      document.getElementById("nombreCategoriaActualizar").value = data.data.nombre;
      document.getElementById("estadoCategoriaActualizar").value = data.data.estado;
    } else {
      alert("Categoría no encontrada.");
    }
  } catch (error) {
    alert("Error de red.");
    console.error(error);
  }
}

async function actualizarCategoria() {
  const id = parseInt(document.getElementById("idCategoriaActualizar").value.trim());
  const nombre = document.getElementById("nombreCategoriaActualizar").value.trim();
  const estado = document.getElementById("estadoCategoriaActualizar").value;
  const token = localStorage.getItem("access_token");

  if (!id || !nombre) {
    alert("ID y nombre obligatorios.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/internal/categoria-evento/actualizar", {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ categoriaEventoId: id, nombre, estado })
    });

    if (response.ok) {
      alert("Categoría actualizada.");
      bootstrap.Modal.getInstance(document.getElementById("modalActualizar")).hide();
      cargarCategorias();
    } else {
      alert("Error al actualizar.");
    }
  } catch (error) {
    alert("Error de red.");
    console.error(error);
  }
}

async function eliminarCategoria() {
  const id = document.getElementById("idCategoriaActualizar").value.trim();
  const token = localStorage.getItem("access_token");

  if (!id) {
    alert("ID obligatorio.");
    return;
  }

  if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;

  try {
    const response = await fetch(`http://127.0.0.1:8000/internal/categoria-evento/eliminar/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      alert("Categoría eliminada.");
      bootstrap.Modal.getInstance(document.getElementById("modalActualizar")).hide();
      cargarCategorias();
    } else {
      alert("Error al eliminar.");
    }
  } catch (error) {
    alert("Error de red.");
    console.error(error);
  }
}
