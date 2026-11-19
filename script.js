// =====================================================
// AJUSTES: cosas fáciles de cambiar
// Nombres y colores que salen si no eliges otros
// =====================================================
const NOMBRES_POR_DEFECTO = ["Equipo 1", "Equipo 2"];
const COLORES_POR_DEFECTO = ["#ff8c1a", "#2b7bf3"];


// =====================================================
// 1. DATOS
// Todo lo que la web necesita recordar.
// Un jugador es así:  { nombre: "Pedro", nivel: 4, portero: false }
// =====================================================
let jugadores = cargar("pachanga-jugadores", []);
// Cada jugador lleva un "id" único, para reconocerlo aunque haya dos con el
// mismo nombre. A los guardados antes de que existiera el id se lo ponemos ahora.
if (jugadores.some(function (j) { return !j.id; })) {
  jugadores.forEach(function (j) {
    if (!j.id) j.id = nuevoId();
  });
  guardar("pachanga-jugadores", jugadores); // así el id es siempre el mismo
}
let nombresEquipos = cargar("pachanga-nombres", ["", ""]);
let coloresEquipos = cargar("pachanga-colores", COLORES_POR_DEFECTO.slice());
let ultimosEquipos = cargar("pachanga-equipos", null); // los últimos equipos hechos
let partido = cargar("pachanga-partido", {
  fecha: "",
  lugar: "",
  maps: true,         // ¿el mensaje lleva enlace de Google Maps?
  precio: "",
  modo: "todos",      // "todos" o "pierde"
  perdedor: "",       // "", "1", "2" o "empate"
  pagador: "",
  bizum: "",
});


// =====================================================
// 2. ELEMENTOS DE LA PÁGINA
// "Agarramos" las piezas del HTML por su id para poder usarlas
// =====================================================
const $ = function (id) { return document.getElementById(id); }; // atajo

const formulario = $("form-jugador");
const campoNombre = $("nombre");
const campoPortero = $("es-portero");
const lista = $("lista-jugadores");
const contador = $("contador");
const listaNombres = $("nombres-jugadores");
const botonBorrarLista = $("boton-borrar-lista");

let filaNueva = -1;  // posición del jugador recién añadido (solo esa fila entra animada)

const inputsNombre = [$("nombre-equipo-1"), $("nombre-equipo-2")];
const inputsColor = [$("color-equipo-1"), $("color-equipo-2")];
const botonRepartir = $("boton-repartir");
const resultado = $("resultado");

const campoFecha = $("fecha");
const campoLugar = $("lugar");
const radiosMaps = document.querySelectorAll('input[name="maps"]');
const campoPrecio = $("precio");
const radiosModo = document.querySelectorAll('input[name="modo-pago"]');
const bloquePerdedor = $("bloque-perdedor");
const campoPerdedor = $("perdedor");
const campoPagador = $("pagador");
const campoBizum = $("bizum");
const resumenPago = $("resumen-pago");

const botonWhatsapp = $("boton-whatsapp");
const botonCopiar = $("boton-copiar");

const avisoDeshacer = $("aviso-deshacer");
const avisoDeshacerTexto = $("aviso-deshacer-texto");
const botonDeshacer = $("boton-deshacer");


// =====================================================
// 3. AÑADIR, BORRAR Y MARCAR PORTEROS
// =====================================================
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue

  const nombre = campoNombre.value.trim(); // trim() quita espacios sobrantes
  if (nombre === "") return;

  jugadores.push({
    id: nuevoId(),
    nombre: nombre,
    nivel: Number(document.querySelector('input[name="nivel"]:checked').value),
    portero: campoPortero.checked,
  });

  campoNombre.value = "";
  campoPortero.checked = false;
  campoNombre.focus();
  guardar("pachanga-jugadores", jugadores);
  filaNueva = jugadores.length - 1; // el último es el nuevo: ese entra animado
  pintarLista();
});

// Borra a un jugador: su fila se cierra y sale el aviso de "Deshacer"
function borrarJugador(posicion) {
  colapsarFila(lista.children[posicion], function () {
    const quitado = jugadores.splice(posicion, 1)[0]; // quita 1 jugador en esa posición
    guardar("pachanga-jugadores", jugadores);
    pintarLista();

    ofrecerDeshacer("Has borrado a " + quitado.nombre, function () {
      const donde = Math.min(posicion, jugadores.length);
      jugadores.splice(donde, 0, quitado); // lo volvemos a meter donde estaba
      guardar("pachanga-jugadores", jugadores);
      filaNueva = donde;
      pintarLista();
    });
  });
}

// La fila baja su altura hasta 0 y, al acabar, hace "despues"
function colapsarFila(fila, despues) {
  if (!fila || sinMovimiento()) {
    despues();
    return;
  }
  fila.style.height = fila.offsetHeight + "px"; // primero fijamos la altura que tiene
  void fila.offsetHeight;                       // (el navegador la "apunta")
  fila.classList.add("colapsando");
  fila.style.height = "0px";                    // y ahora la bajamos a 0 con transición
  setTimeout(despues, 300);
}

// Borrar toda la lista de golpe (para empezar una pachanga nueva).
// También quita los equipos hechos, porque eran con esos jugadores.
// El nombre, color, fecha y lugar se quedan: suelen repetirse.
// No preguntamos "¿seguro?" con confirm(): algunos navegadores (como el que
// abre WhatsApp) bloquean esas ventanas y el botón parecía no hacer nada.
// En su lugar se borra al momento y sale "Deshacer" durante unos segundos.
botonBorrarLista.addEventListener("click", function () {
  const copiaJugadores = jugadores.slice();
  const copiaEquipos = ultimosEquipos;
  const cuantos = jugadores.length;

  lista.classList.add("vaciando"); // todas las filas se desvanecen a la vez
  setTimeout(function () {
    lista.classList.remove("vaciando");
    vaciarLista();
    vibrar(10);
    ofrecerDeshacer("Lista borrada (" + cuantos + (cuantos === 1 ? " jugador)" : " jugadores)"), function () {
      jugadores = copiaJugadores;
      ultimosEquipos = copiaEquipos;
      guardar("pachanga-jugadores", jugadores);
      if (ultimosEquipos) {
        guardar("pachanga-equipos", ultimosEquipos);
        pintarEquipos();
      }
      pintarLista();
    });
  }, sinMovimiento() ? 0 : 200);
});

function vaciarLista() {
  jugadores = [];
  ultimosEquipos = null;
  try {
    localStorage.removeItem("pachanga-jugadores"); // removeItem = olvida ese dato
    localStorage.removeItem("pachanga-equipos");
  } catch (error) {
    // Si el navegador no deja guardar, tampoco hay nada que borrar
  }

  resultado.hidden = true;
  botonRepartir.textContent = "Hacer equipos";
  pintarLista();
}

// Pulsar "POR" convierte a un jugador en portero (o al revés)
function cambiarPortero(posicion) {
  jugadores[posicion].portero = !jugadores[posicion].portero; // "!" = lo contrario
  guardar("pachanga-jugadores", jugadores);
  pintarLista();
}

// Dibujo de la × (en SVG, para que se vea fina en cualquier pantalla)
const ICONO_CRUZ = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" ' +
  'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';

function pintarLista() {
  lista.innerHTML = "";
  listaNombres.innerHTML = "";
  filaAbierta = null; // las filas son nuevas: ninguna está abierta

  jugadores.forEach(function (jugador, posicion) {
    const fila = document.createElement("li");
    if (posicion === filaNueva) fila.className = "nuevo";

    // Detrás: el fondo rojo con "Borrar" que se ve al deslizar
    const accion = document.createElement("button");
    accion.type = "button";
    accion.className = "accion-borrar";
    accion.tabIndex = -1;                       // con teclado se usa la ×
    accion.setAttribute("aria-hidden", "true");
    accion.innerHTML = "<span>Borrar</span>";

    // Delante: la parte que se mueve con el dedo
    const capa = document.createElement("div");
    capa.className = "deslizable";

    // Dorsal (01, 02…), como en una hoja de alineación
    const dorsal = document.createElement("span");
    dorsal.className = "dorsal";
    dorsal.textContent = String(posicion + 1).padStart(2, "0");

    // Nombre + 5 estrellas: las del nivel encendidas y el resto apagadas
    const texto = document.createElement("span");
    texto.className = "texto-jugador";
    const nombre = document.createElement("span");
    nombre.className = "nombre-jugador";
    nombre.textContent = jugador.nombre;
    const estrellas = document.createElement("span");
    estrellas.className = "estrellas";
    estrellas.setAttribute("role", "img");
    estrellas.setAttribute("aria-label", "Nivel " + jugador.nivel + " de 5");
    const apagadas = document.createElement("span");
    apagadas.className = "apagada";
    apagadas.textContent = "★".repeat(5 - jugador.nivel);
    estrellas.append("★".repeat(jugador.nivel), apagadas);
    texto.append(nombre, estrellas);

    const botonPortero = document.createElement("button");
    botonPortero.type = "button";
    botonPortero.textContent = "POR";
    botonPortero.className = "chip-portero";
    botonPortero.setAttribute("aria-pressed", jugador.portero ? "true" : "false");
    botonPortero.title = jugador.portero ? "Es portero (toca para quitar)" : "Marcar como portero";
    botonPortero.setAttribute("aria-label", "Portero: " + jugador.nombre);
    botonPortero.addEventListener("click", function () {
      cambiarPortero(posicion);
    });

    const botonBorrar = document.createElement("button");
    botonBorrar.type = "button";
    botonBorrar.innerHTML = ICONO_CRUZ;
    botonBorrar.className = "icono borrar";
    botonBorrar.setAttribute("aria-label", "Borrar a " + jugador.nombre);
    botonBorrar.addEventListener("click", function () {
      borrarJugador(posicion);
    });

    capa.append(dorsal, texto, botonPortero, botonBorrar);
    fila.append(accion, capa);
    lista.append(fila);
    activarDeslizar(fila, capa, accion, posicion);

    // Botón con su nombre para la casilla "Lo ha pagado"
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "sugerencia";
    boton.textContent = jugador.nombre;
    boton.addEventListener("click", function () {
      // Si ya era el elegido, lo quitamos; si no, lo ponemos
      campoPagador.value = esElPagador(jugador.nombre) ? "" : jugador.nombre;
      campoPagador.dispatchEvent(new Event("input", { bubbles: true })); // como si lo hubieras escrito
    });
    listaNombres.append(boton);
  });
  listaNombres.hidden = jugadores.length === 0;
  marcarPagador();

  filaNueva = -1; // ya se ha animado: la próxima vez no

  const numPorteros = jugadores.filter(function (j) { return j.portero; }).length;
  botonBorrarLista.hidden = jugadores.length === 0; // sin jugadores, no hace falta

  if (jugadores.length === 0) {
    contador.textContent = "Todavía no hay jugadores.";
  } else {
    contador.textContent =
      (jugadores.length === 1 ? "1 jugador" : jugadores.length + " jugadores") + " · " +
      (numPorteros === 1 ? "1 portero" : numPorteros + " porteros") +
      ". Desliza una fila a la izquierda para borrarla.";
  }

  sincronizarEquipos(); // el campo siempre con los mismos jugadores que la lista
  pintarPago();         // si cambia el número de jugadores, cambia lo que paga cada uno
}

// =====================================================
// LISTA Y CAMPO SINCRONIZADOS
// Si ya hay equipos hechos y cambias la lista:
//  - quien ya no está en la lista, desaparece de su equipo
//  - quien es nuevo, entra en el equipo que más lo necesita
//    (la misma regla que al repartir)
//  - si cambias a alguien a portero, se actualiza también en el campo
// =====================================================
let fichasRecientes = new Set(); // ids de las fichas que acaban de entrar (solo esas se animan)

function sincronizarEquipos() {
  if (!ultimosEquipos) return;

  if (jugadores.length === 0) {
    ultimosEquipos = null;
    guardar("pachanga-equipos", null);
    resultado.hidden = true;
    botonRepartir.textContent = "Hacer equipos";
    return;
  }

  const usados = new Set();
  // Busca en la lista al jugador del equipo: por id y, si es un dato
  // antiguo sin id, por nombre (sin repetir a nadie)
  const buscarEnLista = function (delEquipo) {
    let encontrado = jugadores.find(function (j) { return j.id === delEquipo.id && !usados.has(j.id); });
    if (!encontrado && !delEquipo.id) {
      encontrado = jugadores.find(function (j) { return j.nombre === delEquipo.nombre && !usados.has(j.id); });
    }
    if (encontrado) usados.add(encontrado.id);
    return encontrado;
  };

  // Comparamos con lo GUARDADO (no con ultimosEquipos, que comparte los mismos
  // jugadores con la lista y ya tendría el cambio hecho)
  let antes = null;
  try {
    antes = localStorage.getItem("pachanga-equipos");
  } catch (error) {
    // sin guardado: repintamos siempre
  }
  for (const equipo of ultimosEquipos) {
    equipo.jugadores = equipo.jugadores.map(buscarEnLista).filter(Boolean);
  }

  // Los que están en la lista pero en ningún equipo: al que más lo necesite
  const maximo = Math.ceil(jugadores.length / 2);
  fichasRecientes = new Set();
  for (const jugador of jugadores) {
    if (usados.has(jugador.id)) continue;
    const destino = elegirEquipo(ultimosEquipos[0], ultimosEquipos[1], maximo, jugador.portero);
    destino.jugadores.push(jugador);
    fichasRecientes.add(jugador.id);
  }

  // Volvemos a sumar el nivel de cada equipo
  for (const equipo of ultimosEquipos) {
    equipo.total = equipo.jugadores.reduce(function (suma, j) { return suma + j.nivel; }, 0);
  }

  if (JSON.stringify(ultimosEquipos) === antes) return; // no ha cambiado nada
  guardar("pachanga-equipos", ultimosEquipos);
  if (!resultado.hidden) {
    resultado.classList.add("quieto"); // solo se animan las fichas nuevas
    pintarEquipos();
  }
}

// Un "id" único: la hora en milisegundos + unas letras al azar
function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// =====================================================
// 4. NOMBRES Y COLORES DE LOS EQUIPOS
// =====================================================
inputsNombre.forEach(function (input, i) {
  input.value = nombresEquipos[i];
  input.placeholder = NOMBRES_POR_DEFECTO[i];

  input.addEventListener("input", function () {
    nombresEquipos[i] = input.value;
    guardar("pachanga-nombres", nombresEquipos);
    actualizarNombres();
  });
});

inputsColor.forEach(function (input, i) {
  input.value = coloresEquipos[i];

  // "input" mientras mueves el color; "change" al cerrar la paleta
  for (const tipoEvento of ["input", "change"]) {
    input.addEventListener(tipoEvento, function () {
      coloresEquipos[i] = input.value;
      guardar("pachanga-colores", coloresEquipos);
      aplicarColores(); // cambia camisetas, marcador, casillas y fichas del campo
      pintarPago();     // y el circulito de color del mensaje de WhatsApp
    });
  }
});

// numero = 1 o 2
function nombreEquipo(numero) {
  const escrito = inputsNombre[numero - 1].value.trim();
  return escrito !== "" ? escrito : NOMBRES_POR_DEFECTO[numero - 1];
}

// Cambia los colores en TODA la página de golpe (variables de CSS)
function aplicarColores() {
  coloresEquipos.forEach(function (color, i) {
    const raiz = document.documentElement.style;
    raiz.setProperty("--equipo-" + (i + 1), color);
    // Si el color es clarito, letras oscuras; si es oscuro, letras blancas
    raiz.setProperty("--texto-equipo-" + (i + 1), esClaro(color) ? "#1b1b1b" : "#ffffff");
    // Letra blanca: le ponemos una sombra suave para que destaque en colores medios (rojo, naranja…)
    raiz.setProperty("--sombra-equipo-" + (i + 1), esClaro(color) ? "none" : "0 1px 2px rgba(0, 0, 0, 0.45)");
  });
}

// Cuando cambia un nombre, lo cambiamos en todos los sitios donde sale
function actualizarNombres() {
  campoPerdedor.options[1].textContent = nombreEquipo(1);
  campoPerdedor.options[2].textContent = nombreEquipo(2);
  if (ultimosEquipos) pintarMarcador();
  pintarPago();
}

// ¿Es un color claro? (fórmula de "luminosidad" de un color)
// Mira con qué letra se lee mejor ese color: casi negra o blanca.
// Usa la fórmula oficial de contraste (WCAG) y se queda con la que gana.
function esClaro(colorHex) {
  const luz = luminancia(colorHex);
  const contrasteNegro = (luz + 0.05) / (luminancia("#1b1b1b") + 0.05);
  const contrasteBlanco = 1.05 / (luz + 0.05);
  return contrasteNegro > contrasteBlanco;
}

// Cuánta luz da un color (0 = negro, 1 = blanco), como lo ve el ojo
function luminancia(colorHex) {
  return hexARgb(colorHex).reduce(function (suma, valor, i) {
    let v = valor / 255;
    v = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return suma + v * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

function hexARgb(colorHex) {
  const n = parseInt(colorHex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Busca el emoji de círculo más parecido al color (para WhatsApp)
function emojiDeColor(colorHex) {
  const opciones = [
    ["🔴", "#e53935"], ["🟠", "#fb8c00"], ["🟡", "#fdd835"],
    ["🟢", "#43a047"], ["🔵", "#1e88e5"], ["🟣", "#8e24aa"],
    ["🟤", "#795548"], ["⚫", "#222222"], ["⚪", "#f5f5f5"],
  ];
  const [r, g, b] = hexARgb(colorHex);
  let mejor = opciones[0][0];
  let menorDistancia = Infinity;
  for (const [emoji, hex] of opciones) {
    const [r2, g2, b2] = hexARgb(hex);
    const distancia = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      mejor = emoji;
    }
  }
  return mejor;
}


// =====================================================
// 5. HACER LOS EQUIPOS (el "cerebro" de la web)
//   1) Primero repartimos a los PORTEROS: uno para cada equipo.
//   2) Al resto los barajamos y ordenamos de mejor a peor.
//   3) Uno a uno, cada jugador va al equipo con MENOS nivel sumado
//      (sin que ningún equipo tenga más jugadores de la cuenta).
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
  guardar("pachanga-equipos", ultimosEquipos);
  resultado.classList.remove("quieto"); // reparto nuevo: se animan todas las fichas
  fichasRecientes = new Set();

  // Equipos nuevos = todavía no ha perdido nadie
  partido.perdedor = "";
  campoPerdedor.value = "";
  guardar("pachanga-partido", partido);

  vibrar(10); // pequeña vibración: "¡hecho!" (solo en móviles que la tienen)

  // Si ya había equipos, las fichas viejas se van rápido antes de que lleguen las nuevas
  if (resultado.hidden || sinMovimiento()) {
    pintarEquipos(true);
    pintarPago();
    return;
  }
  resultado.classList.add("barajando");
  setTimeout(function () {
    resultado.classList.remove("barajando");
    pintarEquipos(true);
    pintarPago();
  }, 180);
});

function elegirEquipo(e1, e2, maximo, esPortero) {
  if (e1.jugadores.length >= maximo) return e2;
  if (e2.jugadores.length >= maximo) return e1;

  if (esPortero) {
    const p1 = contarPorteros(e1);
    const p2 = contarPorteros(e2);
    if (p1 !== p2) return p1 < p2 ? e1 : e2;
  }

  if (e1.total !== e2.total) return e1.total < e2.total ? e1 : e2;
  return Math.random() < 0.5 ? e1 : e2;
}

function contarPorteros(equipo) {
  return equipo.jugadores.filter(function (j) { return j.portero; }).length;
}

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
// irHastaEllos = true cuando se acaban de repartir: bajamos la página hasta el campo
function pintarEquipos(irHastaEllos) {
  const primeraVez = resultado.hidden;
  resultado.hidden = false;
  botonRepartir.textContent = "Repartir otra vez";
  pintarMarcador();
  pintarMitad($("mitad-1"), ultimosEquipos[0], "abajo");
  pintarMitad($("mitad-2"), ultimosEquipos[1], "arriba");

  // Las fichas caen una detrás de otra (los dos equipos a la vez).
  // Si el campo acaba de aparecer, esperamos a que termine de tumbarse.
  const espera = primeraVez ? 200 : 0;
  for (const mitad of [$("mitad-1"), $("mitad-2")]) {
    mitad.querySelectorAll(".jugador").forEach(function (ficha, i) {
      ficha.style.setProperty("--retraso", espera + i * 40 + "ms");
    });
  }

  if (irHastaEllos) {
    resultado.scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "nearest" });
  }
}

function pintarMarcador() {
  for (let i = 0; i < 2; i++) {
    const equipo = ultimosEquipos[i];
    $("marcador-nombre-" + (i + 1)).textContent = nombreEquipo(i + 1);
    $("marcador-total-" + (i + 1)).textContent =
      equipo.jugadores.length + " jug · nivel " + equipo.total;
  }
}

// Coloca a un equipo en su mitad: el portero junto a su portería
function pintarMitad(mitad, equipo, porteria) {
  mitad.innerHTML = "";

  const porterosEquipo = equipo.jugadores.filter(function (j) { return j.portero; });
  const deCampo = equipo.jugadores.filter(function (j) { return !j.portero; });

  const filaPortero = document.createElement("div");
  filaPortero.className = "fila-campo";
  if (porterosEquipo.length === 0) {
    const aviso = document.createElement("span");
    aviso.className = "sin-portero";
    aviso.textContent = "Sin portero";
    filaPortero.append(aviso);
  }
  for (const jugador of porterosEquipo) {
    filaPortero.append(crearFicha(jugador));
  }

  // Jugadores de campo en filas de 3 (o de 4 si son muchos)
  const porFila = deCampo.length > 6 ? 4 : 3;
  const filas = [];
  for (let i = 0; i < deCampo.length; i += porFila) {
    const fila = document.createElement("div");
    fila.className = "fila-campo";
    for (const jugador of deCampo.slice(i, i + porFila)) {
      fila.append(crearFicha(jugador));
    }
    filas.push(fila);
  }

  const orden = porteria === "arriba" ? [filaPortero].concat(filas) : filas.concat([filaPortero]);
  mitad.append(...orden);
}

function crearFicha(jugador) {
  const ficha = document.createElement("div");
  ficha.className = "jugador" + (jugador.portero ? " es-portero" : "") +
    (fichasRecientes.has(jugador.id) ? " recien" : "");
  ficha.title = jugador.nombre + " · " + "⭐".repeat(jugador.nivel);

  const camiseta = document.createElement("div");
  camiseta.className = "camiseta";
  camiseta.textContent = iniciales(jugador.nombre);

  // (El portero se distingue por la camiseta amarilla: lo hace el CSS)

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
// 7. PARTIDO Y PAGO DEL CAMPO
// =====================================================

// Rellenamos las casillas con lo que había guardado
campoFecha.value = partido.fecha;
campoLugar.value = partido.lugar;
campoPrecio.value = partido.precio;
campoPerdedor.value = partido.perdedor;
campoPagador.value = partido.pagador;
campoBizum.value = partido.bizum;
radiosModo.forEach(function (radio) {
  radio.checked = radio.value === partido.modo;
});
// Quien ya usaba la web no tiene "maps" guardado: si no está, cuenta como "Sí"
radiosMaps.forEach(function (radio) {
  radio.checked = radio.value === (partido.maps === false ? "no" : "si");
});

// Cada vez que se escribe algo, se guarda y se recalcula
const casillas = {
  fecha: campoFecha, lugar: campoLugar, precio: campoPrecio,
  perdedor: campoPerdedor, pagador: campoPagador, bizum: campoBizum,
};
for (const clave in casillas) {
  // "input" salta al escribir; "change" al elegir en una lista o calendario
  // (algunos móviles solo avisan con "change", así que escuchamos los dos)
  for (const tipoEvento of ["input", "change"]) {
    casillas[clave].addEventListener(tipoEvento, function () {
      partido[clave] = casillas[clave].value;
      guardar("pachanga-partido", partido);
      pintarPago();
    });
  }
}

radiosMaps.forEach(function (radio) {
  radio.addEventListener("change", function () {
    partido.maps = radio.value === "si";
    guardar("pachanga-partido", partido);
  });
});

radiosModo.forEach(function (radio) {
  radio.addEventListener("change", function () {
    partido.modo = radio.value;
    guardar("pachanga-partido", partido);
    pintarPago();
  });
});

// Convierte el precio escrito ("60" o "60,50") a céntimos (6000 o 6050).
// Trabajamos en céntimos para evitar errores de decimales.
function leerPrecioCentimos() {
  const numero = parseFloat(String(partido.precio).replace(",", "."));
  if (isNaN(numero) || numero <= 0) return null;
  return Math.round(numero * 100);
}

// 546 → "5,46 €"
function euros(centimos) {
  return (centimos / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// Divide redondeando hacia arriba al céntimo (así nunca falta dinero)
function partePorPersona(totalCentimos, personas) {
  return Math.ceil(totalCentimos / personas);
}

// Calcula quién paga y cuánto. Devuelve un "resumen" que luego
// se usa para pintarlo en la web y para el mensaje de WhatsApp.
function calcularPago() {
  const total = leerPrecioCentimos();
  if (total === null) {
    return { aviso: "Escribe el precio del campo para calcular lo que paga cada uno." };
  }

  const todos = ultimosEquipos
    ? ultimosEquipos[0].jugadores.concat(ultimosEquipos[1].jugadores)
    : jugadores;

  // Pagan todos (o ha habido empate)
  if (partido.modo === "todos" || partido.perdedor === "empate") {
    if (todos.length === 0) {
      return { total: total, aviso: "Añade jugadores para repartir el precio." };
    }
    return {
      total: total,
      cada: partePorPersona(total, todos.length),
      quien: (partido.modo === "todos" ? "Pagan todos" : "Empate: pagan todos") +
        " (" + todos.length + " jugadores)",
      deudores: todos,
    };
  }

  // Paga el que pierde
  if (!ultimosEquipos) {
    return { total: total, aviso: "Haz los equipos para saber cuánto pagará cada jugador del equipo que pierda." };
  }

  if (partido.perdedor === "1" || partido.perdedor === "2") {
    const numero = Number(partido.perdedor);
    const perdedores = ultimosEquipos[numero - 1].jugadores;
    return {
      total: total,
      cada: partePorPersona(total, perdedores.length),
      quien: "Paga " + nombreEquipo(numero) + " por perder (" + perdedores.length + " jugadores)",
      deudores: perdedores,
    };
  }

  // Todavía no se ha jugado: enseñamos las dos posibilidades
  return {
    total: total,
    opciones: [1, 2].map(function (numero) {
      const cuantos = ultimosEquipos[numero - 1].jugadores.length;
      return { equipo: nombreEquipo(numero), cada: partePorPersona(total, cuantos), cuantos: cuantos };
    }),
  };
}

// ¿Este jugador es el que ha pagado el campo?
function esElPagador(nombre) {
  return partido.pagador.trim() !== "" &&
    nombre.trim().toLowerCase() === partido.pagador.trim().toLowerCase();
}

// Ilumina el botón del nombre que está escrito en "Lo ha pagado"
function marcarPagador() {
  for (const boton of listaNombres.children) {
    boton.setAttribute("aria-pressed", esElPagador(boton.textContent) ? "true" : "false");
  }
}
campoPagador.addEventListener("input", marcarPagador);

function textoDestino() {
  const pagador = partido.pagador.trim();
  if (pagador === "") return "";
  let texto = "Mandad el dinero a " + pagador;
  if (partido.bizum.trim() !== "") texto += " (" + partido.bizum.trim() + ")";
  return texto;
}

// Dibuja la caja del resumen del pago
function pintarPago() {
  pintarResumenPago();
  actualizarCompartir(); // el mensaje de WhatsApp también cambia
}

function pintarResumenPago() {
  bloquePerdedor.hidden = partido.modo !== "pierde";
  const cantidadAntes = resumenPago.querySelector(".cantidad");
  const textoCantidadAntes = cantidadAntes ? cantidadAntes.textContent : "";
  resumenPago.innerHTML = "";

  const pago = calcularPago();
  const añadir = function (etiqueta, texto, clase) {
    const el = document.createElement(etiqueta);
    el.textContent = texto;
    if (clase) el.className = clase;
    resumenPago.append(el);
    return el;
  };

  if (pago.total !== undefined) {
    añadir("p", "Campo: " + euros(pago.total));
  }

  if (pago.aviso) {
    añadir("p", pago.aviso, "aviso-texto");
    return;
  }

  if (pago.opciones) {
    for (const opcion of pago.opciones) {
      añadir("p", "Si pierde " + opcion.equipo + ": " + euros(opcion.cada) +
        " cada uno (" + opcion.cuantos + " jugadores)");
    }
    añadir("p", "Cuando acabe el partido, elige arriba quién ha perdido.", "aviso-texto");
  } else {
    const cantidad = añadir("div", euros(pago.cada) + " cada uno", "cantidad");
    // Si el precio por persona ha cambiado, la cifra da un saltito
    if (textoCantidadAntes && textoCantidadAntes !== cantidad.textContent) {
      cantidad.classList.add("cambio");
    }
    añadir("p", pago.quien);
  }

  const destino = textoDestino();
  if (destino === "") {
    añadir("p", "Escribe quién ha pagado el campo para saber a quién mandar el dinero.", "aviso-texto");
    return;
  }

  const parrafo = añadir("p", "");
  const fuerte = document.createElement("strong");
  fuerte.textContent = destino;
  parrafo.append("👉 ", fuerte);

  // Lista de quién tiene que mandar dinero
  if (pago.deudores) {
    const ul = document.createElement("ul");
    for (const jugador of pago.deudores) {
      const li = document.createElement("li");
      li.textContent = esElPagador(jugador.nombre)
        ? jugador.nombre + ": ya lo ha pagado ✅"
        : jugador.nombre + ": " + euros(pago.cada);
      ul.append(li);
    }
    resumenPago.append(ul);
  }
}


// =====================================================
// 8. COMPARTIR POR WHATSAPP
// =====================================================

// "2026-11-22T18:00" → "Sábado, 22 de noviembre · 18:00 h"
function fechaBonita(valor) {
  const fecha = new Date(valor);
  if (isNaN(fecha)) return "";
  const dia = fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const hora = fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return dia.charAt(0).toUpperCase() + dia.slice(1) + " · " + hora + " h";
}

// Prepara el mensaje completo
function construirMensaje() {
  let texto = "⚽ *PACHANGA*\n";

  if (partido.fecha) texto += "📅 " + fechaBonita(partido.fecha) + "\n";
  if (partido.lugar.trim()) {
    const lugar = partido.lugar.trim();
    texto += "📍 " + lugar + "\n";
    if (partido.maps !== false) {
      texto += "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(lugar) + "\n";
    }
  }

  if (ultimosEquipos) {
    ultimosEquipos.forEach(function (equipo, i) {
      texto += "\n" + emojiDeColor(coloresEquipos[i]) + " *" + nombreEquipo(i + 1) + "*\n";
      // Los porteros primero
      const ordenados = equipo.jugadores.slice().sort(function (a, b) {
        return Number(b.portero) - Number(a.portero);
      });
      for (const jugador of ordenados) {
        texto += "- " + jugador.nombre + (jugador.portero ? " 🧤" : "") + "\n";
      }
    });
  }

  const pago = calcularPago();
  if (pago.total !== undefined && !pago.aviso) {
    texto += "\n💶 *Campo: " + euros(pago.total) + "*\n";
    if (pago.opciones) {
      texto += "Paga el equipo que pierda:\n";
      for (const opcion of pago.opciones) {
        texto += "- Si pierde " + opcion.equipo + ": " + euros(opcion.cada) + " cada uno\n";
      }
    } else {
      texto += pago.quien + ": *" + euros(pago.cada) + " cada uno*\n";
    }
    const destino = textoDestino();
    if (destino) texto += "👉 " + destino + "\n";
  }

  return texto;
}

const avisoCompartir = $("aviso-compartir");
const textoPrevia = $("texto-previa");

// Prepara el enlace de WhatsApp y la vista previa con los datos actuales.
// Se llama cada vez que cambia algo, así el enlace siempre está al día.
function actualizarCompartir() {
  const texto = construirMensaje();
  textoPrevia.textContent = texto;
  // Usamos la dirección directa de WhatsApp. El atajo "wa.me" hace una
  // redirección que estropea los emojis (salen como "?" en WhatsApp Web).
  botonWhatsapp.href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(texto);
  if (hayAlgoQueCompartir()) avisoCompartir.hidden = true;
}

function hayAlgoQueCompartir() {
  return Boolean(ultimosEquipos || partido.fecha || partido.lugar.trim());
}

// Si todavía no hay nada que mandar, avisamos en vez de abrir WhatsApp
function comprobarAntesDeCompartir(evento) {
  if (hayAlgoQueCompartir()) return true;
  evento.preventDefault();
  avisoCompartir.textContent = "Primero haz los equipos o rellena el día y el lugar del partido.";
  avisoCompartir.hidden = false;
  reanimar(avisoCompartir, "temblando"); // tiembla otra vez si vuelves a pulsar
  return false;
}

// El botón de WhatsApp es un enlace que abre WhatsApp con el
// mensaje ya escrito: solo tienes que elegir el grupo y enviarlo.
botonWhatsapp.addEventListener("click", function (evento) {
  if (!comprobarAntesDeCompartir(evento)) return;
  actualizarCompartir(); // por si acaso, justo antes de abrirlo
});

botonCopiar.addEventListener("click", async function (evento) {
  if (!comprobarAntesDeCompartir(evento)) return;
  const texto = construirMensaje();
  try {
    await navigator.clipboard.writeText(texto);
    botonCopiar.textContent = "Copiado";
  } catch (error) {
    prompt("Copia este texto:", texto);
  }
  setTimeout(function () {
    botonCopiar.textContent = "Copiar texto";
  }, 2500);
});


// =====================================================
// 9. GUARDAR Y CARGAR
// El navegador recuerda los datos aunque cierres la página.
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


// =====================================================
// 10. AYUDAS PARA LAS ANIMACIONES
// =====================================================

// ¿La persona ha pedido "menos movimiento" en su móvil u ordenador?
function sinMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Vuelve a lanzar una animación de CSS aunque ya se hubiera hecho antes
function reanimar(elemento, clase) {
  elemento.classList.remove(clase);
  void elemento.offsetWidth; // truco: obliga al navegador a "olvidar" la animación
  elemento.classList.add(clase);
}

// Vibración cortita en los momentos importantes (solo en móviles que la tienen)
function vibrar(milisegundos) {
  try {
    // Solo si la persona ya ha tocado la página (si no, el navegador lo bloquea)
    const haTocado = !navigator.userActivation || navigator.userActivation.hasBeenActive;
    if (navigator.vibrate && haTocado) navigator.vibrate(milisegundos);
  } catch (error) {
    // Si no se puede vibrar, no pasa nada
  }
}

// Un MUELLE de verdad, calculado paso a paso.
//   respuesta     = lo rápido que llega (en segundos; 0,3 es ágil)
//   amortiguacion = 1 → llega sin rebotar (lo normal); 0,8 → rebota un poco
//   velocidad     = con qué velocidad sale (la del dedo al soltar, en px/s)
// Devuelve un objeto con parar() para cortarlo si vuelves a tocar.
function animarMuelle(opciones) {
  const hasta = opciones.hasta;
  const respuesta = opciones.respuesta || 0.3;
  const amortiguacion = opciones.amortiguacion || 1;
  const rigidez = Math.pow((2 * Math.PI) / respuesta, 2);
  const friccion = (4 * Math.PI * amortiguacion) / respuesta;
  let x = opciones.desde;
  let v = opciones.velocidad || 0;
  let anterior = null;
  let id = 0;

  if (sinMovimiento()) {
    opciones.alMover(hasta, 0);
    if (opciones.alAcabar) opciones.alAcabar();
    return { parar: function () {} };
  }

  function paso(ahora) {
    const dt = anterior === null ? 1 / 60 : Math.min((ahora - anterior) / 1000, 1 / 30);
    anterior = ahora;
    // Lo partimos en 4 trocitos para que el cálculo sea estable
    for (let i = 0; i < 4; i++) {
      const h = dt / 4;
      const aceleracion = -rigidez * (x - hasta) - friccion * v;
      v += aceleracion * h;
      x += v * h;
    }
    if (Math.abs(x - hasta) < 0.3 && Math.abs(v) < 5) {
      opciones.alMover(hasta, 0);
      if (opciones.alAcabar) opciones.alAcabar();
      return;
    }
    opciones.alMover(x, v);
    id = requestAnimationFrame(paso);
  }
  id = requestAnimationFrame(paso);

  return { parar: function () { cancelAnimationFrame(id); } };
}

// Al soltar con impulso, ¿hasta dónde llegaría? (fórmula de la skill)
function proyectar(velocidad, frenado) {
  frenado = frenado || 0.998;
  return ((velocidad / 1000) * frenado) / (1 - frenado);
}

// "Goma elástica": si tiras más allá del límite, cuesta cada vez más
function gomaElastica(pasado, tamano) {
  const c = 0.55;
  return (pasado * tamano * c) / (tamano + c * Math.abs(pasado));
}


// =====================================================
// 11. DESLIZAR PARA BORRAR (como en el móvil)
// Reglas de la skill: responde nada más tocar, espera 10 px antes de decidir
// la dirección, "goma elástica" en el borde y, al soltar, mira la velocidad
// del dedo para adivinar a dónde iba. Si la tocas mientras se mueve, la
// coge donde está en ese momento (no salta).
// =====================================================
const ANCHO_BORRAR = 88;  // px que se queda abierta para enseñar "Borrar"
let filaAbierta = null;   // la fila que está abierta ahora (solo una a la vez)

function activarDeslizar(fila, capa, accion, posicion) {
  let x = 0;             // dónde está la fila ahora (px)
  let velocidad = 0;
  let muelle = null;     // animación en marcha
  let inicioX = 0;
  let inicioY = 0;
  let xAlTocar = 0;
  let direccion = null;  // null (aún no se sabe), "horizontal" o "vertical"
  let muestras = [];     // posiciones recientes del dedo, para calcular la velocidad

  function pintar(nuevaX) {
    x = nuevaX;
    capa.style.transform = x === 0 ? "" : "translateX(" + x + "px)";
    accion.style.width = Math.max(0, -x) + "px";
  }

  function irA(destino, alAcabar) {
    if (muelle) muelle.parar();
    muelle = animarMuelle({
      desde: x,
      hasta: destino,
      velocidad: velocidad,
      respuesta: 0.3,
      alMover: function (valor, v) {
        velocidad = v;
        pintar(valor);
      },
      alAcabar: function () {
        muelle = null;
        velocidad = 0;
        if (alAcabar) alAcabar();
      },
    });
  }

  function borrarDeslizando() {
    vibrar(10);
    irA(-capa.offsetWidth, function () {
      borrarJugador(posicion);
    });
  }

  fila.cerrar = function () {
    velocidad = 0;
    irA(0);
    if (filaAbierta === fila) filaAbierta = null;
  };

  accion.addEventListener("click", borrarDeslizando);

  capa.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("button")) return; // los botones hacen lo suyo
    if (muelle) {
      muelle.parar(); // la cogemos donde está AHORA, no donde iba
      muelle = null;
    }
    inicioX = e.clientX;
    inicioY = e.clientY;
    xAlTocar = x;
    direccion = null;
    muestras = [{ t: e.timeStamp, x: e.clientX }];
    if (filaAbierta && filaAbierta !== fila) filaAbierta.cerrar();
  });

  capa.addEventListener("pointermove", function (e) {
    if (muestras.length === 0) return; // no se está tocando esta fila
    const dx = e.clientX - inicioX;
    const dy = e.clientY - inicioY;

    if (direccion === null) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        direccion = "horizontal";
        try {
          capa.setPointerCapture(e.pointerId); // seguimos el dedo aunque salga de la fila
        } catch (error) {
          // Algún navegador antiguo no lo deja: funciona igual mientras no salga de la fila
        }
      } else if (Math.abs(dy) > 10) {
        direccion = "vertical"; // está haciendo scroll: no es para nosotros
        muestras = [];
        return;
      } else {
        return;
      }
    }

    muestras.push({ t: e.timeStamp, x: e.clientX });
    while (muestras.length > 2 && e.timeStamp - muestras[0].t > 100) muestras.shift();

    const ancho = capa.offsetWidth;
    let objetivo = xAlTocar + dx - Math.sign(dx) * 10; // quitamos los 10 px de espera: sin saltos
    if (objetivo > 0) objetivo = gomaElastica(objetivo, ancho);
    else if (objetivo < -ancho) objetivo = -ancho - gomaElastica(-ancho - objetivo, ancho);
    pintar(objetivo);
  });

  function soltar(e) {
    const eraHorizontal = direccion === "horizontal";
    const m = muestras;
    muestras = [];
    direccion = null;
    if (!eraHorizontal || m.length === 0) return;

    // Velocidad del dedo (px por segundo) en los últimos 100 ms antes de soltar.
    // Si el dedo se había parado, la velocidad es 0 (no cuenta como "lanzar").
    if (e.type === "pointercancel") {
      velocidad = 0;
    } else {
      m.push({ t: e.timeStamp, x: e.clientX });
      while (m.length > 1 && e.timeStamp - m[0].t > 100) m.shift();
      const tiempo = (m[m.length - 1].t - m[0].t) / 1000;
      velocidad = tiempo > 0 ? (m[m.length - 1].x - m[0].x) / tiempo : 0;
    }

    const ancho = capa.offsetWidth;
    const aDonde = x + proyectar(velocidad); // dónde acabaría con el impulso que lleva

    // Para borrar de un tirón hay que haber pasado ya la zona roja: así un
    // toque rápido sin querer solo abre la fila, no borra a nadie
    if (aDonde < -ancho * 0.6 && x < -ANCHO_BORRAR) {
      borrarDeslizando();                     // lanzada lejos: se borra
    } else if (aDonde < -ANCHO_BORRAR / 2) {
      filaAbierta = fila;                     // a medias: se queda abierta con "Borrar"
      irA(-ANCHO_BORRAR);
    } else {
      if (filaAbierta === fila) filaAbierta = null;
      irA(0);                                 // poco: vuelve a su sitio
    }
  }

  capa.addEventListener("pointerup", soltar);
  capa.addEventListener("pointercancel", soltar);
}

// Si hay una fila abierta y tocas en otro sitio, se cierra
document.addEventListener("pointerdown", function (e) {
  if (filaAbierta && !filaAbierta.contains(e.target)) filaAbierta.cerrar();
});


// =====================================================
// 12. AVISO CON "DESHACER"
// Mejor que preguntar "¿seguro?": borras al momento y, si te equivocas,
// lo recuperas con un toque durante 5 segundos.
// =====================================================
let accionDeshacer = null;
let temporizadorDeshacer = 0;
let temporizadorSalida = 0;

function ofrecerDeshacer(texto, alDeshacer) {
  clearTimeout(temporizadorDeshacer);
  clearTimeout(temporizadorSalida);
  accionDeshacer = alDeshacer;
  avisoDeshacerTexto.textContent = texto;
  avisoDeshacer.classList.remove("saliendo");
  avisoDeshacer.hidden = true;      // lo escondemos y lo volvemos a enseñar
  void avisoDeshacer.offsetWidth;   // para que la animación de entrada se repita
  avisoDeshacer.hidden = false;
  temporizadorDeshacer = setTimeout(cerrarDeshacer, 5000);
}

function cerrarDeshacer() {
  clearTimeout(temporizadorDeshacer);
  accionDeshacer = null;
  if (avisoDeshacer.hidden) return;
  avisoDeshacer.classList.add("saliendo"); // sale por el mismo camino por el que entró
  temporizadorSalida = setTimeout(function () {
    avisoDeshacer.hidden = true;
    avisoDeshacer.classList.remove("saliendo");
  }, 200);
}

botonDeshacer.addEventListener("click", function () {
  const deshacer = accionDeshacer;
  cerrarDeshacer();
  if (deshacer) deshacer();
});


// =====================================================
// 13. BARRA DE ARRIBA
// Cuando el título grande se esconde por arriba, la barra se vuelve de
// "cristal" y enseña el título pequeño (como en las apps del móvil).
// =====================================================
function prepararBarra() {
  if (!("IntersectionObserver" in window)) return;
  const barra = $("barra");
  const observador = new IntersectionObserver(function (entradas) {
    barra.classList.toggle("con-titulo", !entradas[0].isIntersecting);
  }, { rootMargin: "-44px 0px 0px 0px" }); // 44 px = lo que mide la barra
  observador.observe($("titulo"));
}


// =====================================================
// AL ABRIR LA PÁGINA: lo dibujamos todo por primera vez
// =====================================================
// =====================================================
// 14. TEMA CLARO / OSCURO
// Al principio sigue al móvil. Si tocas el botón, se queda el que elijas
// (se guarda en el navegador). "data-theme" en <html> es lo que mira el CSS.
// =====================================================
const botonTema = $("boton-tema");
const ICONO_SOL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2' +
  'M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const ICONO_LUNA = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
const sistemaOscuro = window.matchMedia("(prefers-color-scheme: dark)");

function temaActual() {
  return document.documentElement.dataset.theme || (sistemaOscuro.matches ? "dark" : "light");
}

// El botón enseña el tema al que vas a cambiar: luna si estás en claro, sol si estás en oscuro
function pintarBotonTema() {
  const oscuro = temaActual() === "dark";
  botonTema.innerHTML = oscuro ? ICONO_SOL : ICONO_LUNA;
  const texto = oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  botonTema.setAttribute("aria-label", texto);
  botonTema.title = texto;
  // Color de la barra del navegador en el móvil
  document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
    meta.content = oscuro ? "#12120e" : "#f1ebdf";
  });
}

botonTema.addEventListener("click", function () {
  const nuevo = temaActual() === "dark" ? "light" : "dark";
  const raiz = document.documentElement;
  raiz.classList.add("cambiando-tema");   // los colores pasan suavemente
  raiz.dataset.theme = nuevo;
  try {
    localStorage.setItem("pachanga-tema", nuevo);
  } catch (error) {
    // si no se puede guardar, vale solo para esta visita
  }
  pintarBotonTema();
  reanimar(botonTema, "girando");
  setTimeout(function () { raiz.classList.remove("cambiando-tema"); }, 350);
});

// Si no has elegido y el móvil cambia de claro a oscuro (por la noche), el botón se entera
sistemaOscuro.addEventListener("change", pintarBotonTema);


// La fecha de hoy en la portada, como en un periódico: "jue 19 nov 2026"
$("fecha-hoy").textContent = new Date().toLocaleDateString("es-ES", {
  weekday: "short", day: "numeric", month: "short", year: "numeric",
}).replace(/,/g, "");

pintarBotonTema();
prepararBarra();
aplicarColores();
actualizarNombres();
pintarLista();
if (ultimosEquipos) pintarEquipos();
