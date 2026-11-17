// =====================================================
// AJUSTES: cosas fáciles de cambiar
// Nombres que salen si no escribes otros
// =====================================================
const NOMBRE_POR_DEFECTO_1 = "Equipo 1";
const NOMBRE_POR_DEFECTO_2 = "Equipo 2";


// =====================================================
// 1. DATOS
// Aquí vive la lista de jugadores. Cada jugador es así:
//   { nombre: "Pedro", nivel: 4, portero: false }
// =====================================================
let jugadores = cargar("pachanga-jugadores", []);
let nombresEquipos = cargar("pachanga-nombres", ["", ""]);
let ultimosEquipos = null; // los últimos equipos que hemos hecho


// =====================================================
// 2. ELEMENTOS DE LA PÁGINA
// "Agarramos" las piezas del HTML por su id para poder usarlas
// =====================================================
const formulario = document.getElementById("form-jugador");
const campoNombre = document.getElementById("nombre");
const campoNivel = document.getElementById("nivel");
const campoPortero = document.getElementById("es-portero");
const lista = document.getElementById("lista-jugadores");
const contador = document.getElementById("contador");
const inputEquipo1 = document.getElementById("nombre-equipo-1");
const inputEquipo2 = document.getElementById("nombre-equipo-2");
const botonRepartir = document.getElementById("boton-repartir");
const resultado = document.getElementById("resultado");
const botonCopiar = document.getElementById("boton-copiar");


// =====================================================
// 3. AÑADIR, BORRAR Y MARCAR PORTEROS
// =====================================================

// Cuando se pulsa "Añadir"...
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue

  const nombre = campoNombre.value.trim(); // trim() quita espacios sobrantes
  if (nombre === "") return;

  jugadores.push({
    nombre: nombre,
    nivel: Number(campoNivel.value),
    portero: campoPortero.checked,
  });

  campoNombre.value = "";     // vaciamos la casilla
  campoPortero.checked = false;
  campoNombre.focus();        // y dejamos el cursor listo para el siguiente
  guardar("pachanga-jugadores", jugadores);
  pintarLista();
});

function borrarJugador(posicion) {
  jugadores.splice(posicion, 1); // quita 1 jugador en esa posición
  guardar("pachanga-jugadores", jugadores);
  pintarLista();
}

// Pulsar el guante 🧤 convierte a un jugador en portero (o al revés)
function cambiarPortero(posicion) {
  jugadores[posicion].portero = !jugadores[posicion].portero; // "!" = lo contrario
  guardar("pachanga-jugadores", jugadores);
  pintarLista();
}

// Dibuja la lista de jugadores en pantalla
function pintarLista() {
  lista.innerHTML = ""; // borramos lo que había y lo dibujamos de nuevo

  jugadores.forEach(function (jugador, posicion) {
    const fila = document.createElement("li");

    const texto = document.createElement("span");
    texto.className = "texto-jugador";
    texto.textContent = jugador.nombre + "  " + "⭐".repeat(jugador.nivel);

    const botonPortero = document.createElement("button");
    botonPortero.textContent = "🧤";
    botonPortero.className = "icono portero";
    botonPortero.setAttribute("aria-pressed", jugador.portero ? "true" : "false");
    botonPortero.title = jugador.portero ? "Es portero (pulsa para quitar)" : "Marcar como portero";
    botonPortero.setAttribute("aria-label", "Portero: " + jugador.nombre);
    botonPortero.addEventListener("click", function () {
      cambiarPortero(posicion);
    });

    const botonBorrar = document.createElement("button");
    botonBorrar.textContent = "✕";
    botonBorrar.className = "icono borrar";
    botonBorrar.setAttribute("aria-label", "Borrar a " + jugador.nombre);
    botonBorrar.addEventListener("click", function () {
      borrarJugador(posicion);
    });

    fila.append(texto, botonPortero, botonBorrar);
    lista.append(fila);
  });

  const numPorteros = jugadores.filter(function (j) { return j.portero; }).length;

  if (jugadores.length === 0) {
    contador.textContent = "Todavía no hay jugadores. ¡Añade el primero!";
  } else {
    contador.textContent = jugadores.length + " jugadores apuntados · " +
      numPorteros + (numPorteros === 1 ? " portero" : " porteros") +
      " (pulsa 🧤 para marcar porteros)";
  }
}


// =====================================================
// 4. NOMBRES DE LOS EQUIPOS
// Se pueden cambiar escribiendo. Si se deja vacío, sale "Equipo 1/2".
// =====================================================
inputEquipo1.value = nombresEquipos[0];
inputEquipo2.value = nombresEquipos[1];
inputEquipo1.placeholder = NOMBRE_POR_DEFECTO_1;
inputEquipo2.placeholder = NOMBRE_POR_DEFECTO_2;

function nombreEquipo(numero) {
  const escrito = (numero === 1 ? inputEquipo1 : inputEquipo2).value.trim();
  if (escrito !== "") return escrito;
  return numero === 1 ? NOMBRE_POR_DEFECTO_1 : NOMBRE_POR_DEFECTO_2;
}

// Cada vez que escribes en un nombre, se guarda y se actualiza el marcador
for (const input of [inputEquipo1, inputEquipo2]) {
  input.addEventListener("input", function () {
    nombresEquipos = [inputEquipo1.value, inputEquipo2.value];
    guardar("pachanga-nombres", nombresEquipos);
    if (ultimosEquipos) pintarMarcador();
  });
}


// =====================================================
// 5. HACER LOS EQUIPOS (el "cerebro" de la web)
//
// La idea:
//   1) Primero repartimos a los PORTEROS: uno para cada equipo.
//   2) Luego, al resto los barajamos y ordenamos de mejor a peor.
//   3) Uno a uno, cada jugador va al equipo que tenga MENOS nivel
//      sumado (sin que ningún equipo tenga más jugadores de la cuenta).
// =====================================================
botonRepartir.addEventListener("click", function () {
  if (jugadores.length < 2) {
    alert("Necesitas al menos 2 jugadores para hacer equipos.");
    return;
  }

  const porteros = ordenarPorNivel(jugadores.filter(function (j) { return j.portero; }));
  const deCampo = ordenarPorNivel(jugadores.filter(function (j) { return !j.portero; }));

  const equipo1 = { jugadores: [], total: 0 };
  const equipo2 = { jugadores: [], total: 0 };
  const maximoPorEquipo = Math.ceil(jugadores.length / 2);

  for (const jugador of porteros.concat(deCampo)) {
    const destino = elegirEquipo(equipo1, equipo2, maximoPorEquipo, jugador.portero);
    destino.jugadores.push(jugador);
    destino.total += jugador.nivel;
  }

  ultimosEquipos = [equipo1, equipo2];
  pintarEquipos();
  botonRepartir.textContent = "🔄 Repartir otra vez";
});

// Decide a qué equipo va un jugador
function elegirEquipo(e1, e2, maximo, esPortero) {
  // Si un equipo está lleno, va al otro
  if (e1.jugadores.length >= maximo) return e2;
  if (e2.jugadores.length >= maximo) return e1;

  // Los porteros van al equipo que tenga menos porteros
  if (esPortero) {
    const p1 = contarPorteros(e1);
    const p2 = contarPorteros(e2);
    if (p1 !== p2) return p1 < p2 ? e1 : e2;
  }

  // Si no, al que tenga menos nivel (y si empatan, a suertes)
  if (e1.total !== e2.total) return e1.total < e2.total ? e1 : e2;
  return Math.random() < 0.5 ? e1 : e2;
}

function contarPorteros(equipo) {
  return equipo.jugadores.filter(function (j) { return j.portero; }).length;
}

// Baraja y luego ordena de mejor a peor (así los empates salen mezclados)
function ordenarPorNivel(grupo) {
  return barajar([...grupo]).sort(function (a, b) {
    return b.nivel - a.nivel;
  });
}

// Mezcla una lista al azar (método "Fisher-Yates")
function barajar(grupo) {
  for (let i = grupo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grupo[i], grupo[j]] = [grupo[j], grupo[i]];
  }
  return grupo;
}


// =====================================================
// 6. DIBUJAR LOS EQUIPOS EN EL CAMPO 3D
// =====================================================
function pintarEquipos() {
  resultado.hidden = false;
  pintarMarcador();
  pintarMitad(document.getElementById("mitad-1"), ultimosEquipos[0], "abajo");
  pintarMitad(document.getElementById("mitad-2"), ultimosEquipos[1], "arriba");
}

function pintarMarcador() {
  for (let i = 0; i < 2; i++) {
    const equipo = ultimosEquipos[i];
    document.getElementById("marcador-nombre-" + (i + 1)).textContent = nombreEquipo(i + 1);
    document.getElementById("marcador-total-" + (i + 1)).textContent =
      equipo.jugadores.length + " jugadores · nivel " + equipo.total;
  }
}

// Coloca a un equipo en su mitad: el portero junto a su portería
function pintarMitad(mitad, equipo, porteria) {
  mitad.innerHTML = "";

  const porterosEquipo = equipo.jugadores.filter(function (j) { return j.portero; });
  const deCampo = equipo.jugadores.filter(function (j) { return !j.portero; });

  // Fila del portero
  const filaPortero = document.createElement("div");
  filaPortero.className = "fila";
  if (porterosEquipo.length === 0) {
    const aviso = document.createElement("span");
    aviso.className = "sin-portero";
    aviso.textContent = "Sin portero";
    filaPortero.append(aviso);
  }
  for (const jugador of porterosEquipo) {
    filaPortero.append(crearFicha(jugador));
  }

  // Filas de jugadores de campo (de 3 en 3, o de 4 si son muchos)
  const porFila = deCampo.length > 6 ? 4 : 3;
  const filas = [];
  for (let i = 0; i < deCampo.length; i += porFila) {
    const fila = document.createElement("div");
    fila.className = "fila";
    for (const jugador of deCampo.slice(i, i + porFila)) {
      fila.append(crearFicha(jugador));
    }
    filas.push(fila);
  }

  // Arriba: portero primero. Abajo: portero al final (junto a su portería)
  const orden = porteria === "arriba" ? [filaPortero].concat(filas) : filas.concat([filaPortero]);
  mitad.append(...orden);
}

// Crea la "ficha" de un jugador: camiseta con iniciales + nombre
function crearFicha(jugador) {
  const ficha = document.createElement("div");
  ficha.className = "jugador" + (jugador.portero ? " es-portero" : "");
  ficha.title = jugador.nombre + " · " + "⭐".repeat(jugador.nivel);

  const camiseta = document.createElement("div");
  camiseta.className = "camiseta";
  camiseta.textContent = iniciales(jugador.nombre);

  if (jugador.portero) {
    const guante = document.createElement("span");
    guante.className = "guante";
    guante.textContent = "🧤";
    camiseta.append(guante);
  }

  const etiqueta = document.createElement("div");
  etiqueta.className = "etiqueta";
  etiqueta.textContent = jugador.nombre;

  ficha.append(camiseta, etiqueta);
  return ficha;
}

// "Pedro Gómez" → "PG"   ·   "Luis" → "LU"
function iniciales(nombre) {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length >= 2) {
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }
  return nombre.trim().slice(0, 2).toUpperCase();
}


// =====================================================
// 7. COPIAR PARA WHATSAPP
// =====================================================
botonCopiar.addEventListener("click", async function () {
  let texto = "⚽ *Equipos de la pachanga*\n";

  ultimosEquipos.forEach(function (equipo, i) {
    texto += "\n*" + nombreEquipo(i + 1) + "*\n";
    // Los porteros primero
    const ordenados = equipo.jugadores.slice().sort(function (a, b) {
      return Number(b.portero) - Number(a.portero);
    });
    for (const jugador of ordenados) {
      texto += "- " + jugador.nombre + (jugador.portero ? " 🧤" : "") + "\n";
    }
  });

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
// 8. GUARDAR Y CARGAR
// El navegador recuerda los datos aunque cierres la página,
// así no tienes que apuntar a los mismos cada semana.
// =====================================================
function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    // Si el navegador no deja guardar, no pasa nada: la web sigue funcionando
  }
}

function cargar(clave, valorSiNoHay) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : valorSiNoHay;
  } catch (error) {
    return valorSiNoHay;
  }
}


// Al abrir la página, dibujamos la lista por primera vez
pintarLista();
