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
      console.error(data);
    }
  } catch (error) {
    console.error("Error de red:", error);
    alert("No se pudo conectar al servidor.");
  }
}

function llenarTabla(categorias) {
  const tabla = document.getElementById("tablaCategorias");
  tabla.innerHTML = "";

  categorias.forEach(cat => {
    const estadoEsActivo = cat.estado === "AC";
    const estadoTexto = estadoEsActivo ? "Activo" : "Inactivo";
    const estadoBadge = estadoEsActivo ? "success" : "secondary";

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
    const body = { nombre: nombre, estado: estado };
    console.log("Enviando:", body);

    const response = await fetch("http://127.0.0.1:8000/internal/categoria-evento/registrar", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      alert("Categoría registrada correctamente");
      document.getElementById("nombreCategoria").value = "";
      cargarCategorias();
    } else {
      alert("Error al registrar categoría.");
      console.error(data);
    }
  } catch (error) {
    console.error("Error de red:", error);
    alert("No se pudo conectar al servidor.");
  }
}

async function actualizarCategoria() {
  const id = document.getElementById("idCategoriaActualizar").value.trim();
  const nombre = document.getElementById("nombreCategoriaActualizar").value.trim();
  const estado = document.getElementById("estadoCategoriaActualizar").value;
  const token = localStorage.getItem("access_token");

  if (!id || !nombre) {
    alert("ID y nombre son obligatorios.");
    return;
  }

  try {
    const body = { nombre, estado };
    console.log("Actualizando:", body);

    const response = await fetch(`http://127.0.0.1:8000/internal/categoria-evento/${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      alert("Categoría actualizada correctamente");
      cargarCategorias();
    } else {
      alert("Error al actualizar categoría.");
      console.error(data);
    }
  } catch (error) {
    console.error("Error de red:", error);
    alert("No se pudo conectar al servidor.");
  }
}
