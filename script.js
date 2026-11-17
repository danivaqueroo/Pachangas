// =====================================================
// AJUSTES: cosas fáciles de cambiar
// =====================================================
const NOMBRE_EQUIPO_A = "Solteros";
const NOMBRE_EQUIPO_B = "Casados";


// =====================================================
// 1. DATOS
// Aquí vive la lista de jugadores. Cada jugador es así:
//   { nombre: "Pedro", nivel: 4 }
// =====================================================
let jugadores = cargarJugadores();
let ultimosEquipos = null; // los últimos equipos que hemos hecho


// =====================================================
// 2. ELEMENTOS DE LA PÁGINA
// "Agarramos" las piezas del HTML por su id para poder usarlas
// =====================================================
const formulario = document.getElementById("form-jugador");
const campoNombre = document.getElementById("nombre");
const campoNivel = document.getElementById("nivel");
const lista = document.getElementById("lista-jugadores");
const contador = document.getElementById("contador");
const botonRepartir = document.getElementById("boton-repartir");
const zonaEquipos = document.getElementById("equipos");
const botonCopiar = document.getElementById("boton-copiar");


// =====================================================
// 3. AÑADIR Y BORRAR JUGADORES
// =====================================================

// Cuando se pulsa "Añadir"...
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue

  const nombre = campoNombre.value.trim(); // trim() quita espacios sobrantes
  if (nombre === "") return;

  jugadores.push({ nombre: nombre, nivel: Number(campoNivel.value) });

  campoNombre.value = ""; // vaciamos la casilla
  campoNombre.focus();    // y dejamos el cursor listo para el siguiente
  guardarJugadores();
  pintarLista();
});

function borrarJugador(posicion) {
  jugadores.splice(posicion, 1); // quita 1 jugador en esa posición
  guardarJugadores();
  pintarLista();
}

// Dibuja la lista de jugadores en pantalla
function pintarLista() {
  lista.innerHTML = ""; // borramos lo que había y lo dibujamos de nuevo

  jugadores.forEach(function (jugador, posicion) {
    const fila = document.createElement("li");

    const texto = document.createElement("span");
    texto.textContent = jugador.nombre + "  " + "⭐".repeat(jugador.nivel);

    const botonBorrar = document.createElement("button");
    botonBorrar.textContent = "✕";
    botonBorrar.className = "borrar";
    botonBorrar.setAttribute("aria-label", "Borrar a " + jugador.nombre);
    botonBorrar.addEventListener("click", function () {
      borrarJugador(posicion);
    });

    fila.append(texto, botonBorrar);
    lista.append(fila);
  });

  if (jugadores.length === 0) {
    contador.textContent = "Todavía no hay jugadores. ¡Añade el primero!";
  } else {
    contador.textContent = jugadores.length + " jugadores apuntados";
  }
}


// =====================================================
// 4. HACER LOS EQUIPOS (el "cerebro" de la web)
//
// La idea:
//   1) Barajamos a los jugadores para que no salga siempre lo mismo.
//   2) Los ordenamos de mejor a peor nivel.
//   3) Uno a uno, cada jugador va al equipo que tenga MENOS nivel
//      sumado (sin que ningún equipo tenga más jugadores de la cuenta).
// =====================================================
botonRepartir.addEventListener("click", function () {
  if (jugadores.length < 2) {
    alert("Necesitas al menos 2 jugadores para hacer equipos.");
    return;
  }

  const ordenados = barajar([...jugadores]); // [...] hace una copia
  ordenados.sort(function (a, b) {
    return b.nivel - a.nivel; // de mayor a menor nivel
  });

  const equipoA = { nombre: NOMBRE_EQUIPO_A, jugadores: [], total: 0 };
  const equipoB = { nombre: NOMBRE_EQUIPO_B, jugadores: [], total: 0 };
  const maximoPorEquipo = Math.ceil(ordenados.length / 2);

  for (const jugador of ordenados) {
    const aLleno = equipoA.jugadores.length >= maximoPorEquipo;
    const bLleno = equipoB.jugadores.length >= maximoPorEquipo;

    let destino;
    if (aLleno) {
      destino = equipoB;
    } else if (bLleno) {
      destino = equipoA;
    } else if (equipoA.total <= equipoB.total) {
      destino = equipoA;
    } else {
      destino = equipoB;
    }

    destino.jugadores.push(jugador);
    destino.total += jugador.nivel;
  }

  ultimosEquipos = [equipoA, equipoB];
  pintarEquipos();
  botonRepartir.textContent = "🔄 Repartir otra vez";
});

// Mezcla una lista al azar (método "Fisher-Yates")
function barajar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

// Dibuja los dos equipos en pantalla
function pintarEquipos() {
  zonaEquipos.innerHTML = "";

  ultimosEquipos.forEach(function (equipo, indice) {
    const caja = document.createElement("div");
    caja.className = "equipo " + (indice === 0 ? "equipo-a" : "equipo-b");

    const titulo = document.createElement("h3");
    titulo.textContent = equipo.nombre;

    const total = document.createElement("div");
    total.className = "total";
    total.textContent = "Nivel total: " + equipo.total;

    const listaEquipo = document.createElement("ul");
    for (const jugador of equipo.jugadores) {
      const fila = document.createElement("li");
      fila.textContent = jugador.nombre;
      listaEquipo.append(fila);
    }

    caja.append(titulo, total, listaEquipo);
    zonaEquipos.append(caja);
  });

  botonCopiar.hidden = false;
}


// =====================================================
// 5. COPIAR PARA WHATSAPP
// =====================================================
botonCopiar.addEventListener("click", async function () {
  let texto = "⚽ *Equipos de la pachanga*\n";
  for (const equipo of ultimosEquipos) {
    texto += "\n*" + equipo.nombre + "*\n";
    for (const jugador of equipo.jugadores) {
      texto += "- " + jugador.nombre + "\n";
    }
  }

  try {
    await navigator.clipboard.writeText(texto);
    botonCopiar.textContent = "✅ ¡Copiado! Pégalo en WhatsApp";
  } catch (error) {
    // Si el navegador no deja copiar, mostramos el texto para copiarlo a mano
    prompt("Copia este texto:", texto);
  }

  setTimeout(function () {
    botonCopiar.textContent = "📋 Copiar para WhatsApp";
  }, 2500);
});


// =====================================================
// 6. GUARDAR Y CARGAR
// El navegador recuerda la lista aunque cierres la página,
// así no tienes que apuntar a los mismos cada semana.
// =====================================================
function guardarJugadores() {
  try {
    localStorage.setItem("pachanga-jugadores", JSON.stringify(jugadores));
  } catch (error) {
    // Si el navegador no deja guardar, no pasa nada: la web sigue funcionando
  }
}

function cargarJugadores() {
  try {
    const guardado = localStorage.getItem("pachanga-jugadores");
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    return [];
  }
}


// Al abrir la página, dibujamos la lista por primera vez
pintarLista();
