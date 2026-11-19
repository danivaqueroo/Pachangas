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
const campoNivel = $("nivel");
const campoPortero = $("es-portero");
const lista = $("lista-jugadores");
const contador = $("contador");
const listaNombres = $("nombres-jugadores");
const botonBorrarLista = $("boton-borrar-lista");

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


// =====================================================
// 3. AÑADIR, BORRAR Y MARCAR PORTEROS
// =====================================================
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue

  const nombre = campoNombre.value.trim(); // trim() quita espacios sobrantes
  if (nombre === "") return;

  jugadores.push({
    nombre: nombre,
    nivel: Number(campoNivel.value),
    portero: campoPortero.checked,
  });

  campoNombre.value = "";
  campoPortero.checked = false;
  campoNombre.focus();
  guardar("pachanga-jugadores", jugadores);
  pintarLista();
});

function borrarJugador(posicion) {
  jugadores.splice(posicion, 1); // quita 1 jugador en esa posición
  guardar("pachanga-jugadores", jugadores);
  pintarLista();
}

// Borrar toda la lista de golpe (para empezar una pachanga nueva).
// También quita los equipos hechos, porque eran con esos jugadores.
// El nombre, color, fecha y lugar se quedan: suelen repetirse.
botonBorrarLista.addEventListener("click", function () {
  const seguro = confirm("¿Borrar los " + jugadores.length + " jugadores de la lista?");
  if (!seguro) return; // si pulsa "Cancelar", no hacemos nada

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
  actualizarCompartir();
});

// Pulsar el guante 🧤 convierte a un jugador en portero (o al revés)
function cambiarPortero(posicion) {
  jugadores[posicion].portero = !jugadores[posicion].portero; // "!" = lo contrario
  guardar("pachanga-jugadores", jugadores);
  pintarLista();
}

function pintarLista() {
  lista.innerHTML = "";
  listaNombres.innerHTML = "";

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

    // Sugerencias para la casilla "Ha pagado el campo"
    const opcion = document.createElement("option");
    opcion.value = jugador.nombre;
    listaNombres.append(opcion);
  });

  const numPorteros = jugadores.filter(function (j) { return j.portero; }).length;

  botonBorrarLista.hidden = jugadores.length === 0; // sin jugadores, no hace falta

  if (jugadores.length === 0) {
    contador.textContent = "Todavía no hay jugadores. ¡Añade el primero!";
  } else {
    contador.textContent = jugadores.length + " jugadores apuntados · " +
      numPorteros + (numPorteros === 1 ? " portero" : " porteros") +
      " (pulsa 🧤 para marcar porteros)";
  }

  pintarPago(); // si cambia el número de jugadores, cambia lo que paga cada uno
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
function esClaro(colorHex) {
  const [r, g, b] = hexARgb(colorHex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
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

  // Equipos nuevos = todavía no ha perdido nadie
  partido.perdedor = "";
  campoPerdedor.value = "";
  guardar("pachanga-partido", partido);

  pintarEquipos();
  pintarPago();
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
function pintarEquipos() {
  resultado.hidden = false;
  botonRepartir.textContent = "🔄 Repartir otra vez";
  pintarMarcador();
  pintarMitad($("mitad-1"), ultimosEquipos[0], "abajo");
  pintarMitad($("mitad-2"), ultimosEquipos[1], "arriba");
}

function pintarMarcador() {
  for (let i = 0; i < 2; i++) {
    const equipo = ultimosEquipos[i];
    $("marcador-nombre-" + (i + 1)).textContent = nombreEquipo(i + 1);
    $("marcador-total-" + (i + 1)).textContent =
      equipo.jugadores.length + " jug. · nivel " + equipo.total;
  }
}

// Coloca a un equipo en su mitad: el portero junto a su portería
function pintarMitad(mitad, equipo, porteria) {
  mitad.innerHTML = "";

  const porterosEquipo = equipo.jugadores.filter(function (j) { return j.portero; });
  const deCampo = equipo.jugadores.filter(function (j) { return !j.portero; });

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

  // Jugadores de campo en filas de 3 (o de 4 si son muchos)
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

  const orden = porteria === "arriba" ? [filaPortero].concat(filas) : filas.concat([filaPortero]);
  mitad.append(...orden);
}

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
    añadir("p", pago.aviso, "aviso");
    return;
  }

  if (pago.opciones) {
    for (const opcion of pago.opciones) {
      añadir("p", "Si pierde " + opcion.equipo + ": " + euros(opcion.cada) +
        " cada uno (" + opcion.cuantos + " jugadores)");
    }
    añadir("p", "Cuando acabe el partido, elige arriba quién ha perdido.", "aviso");
  } else {
    añadir("div", euros(pago.cada) + " cada uno", "cantidad");
    añadir("p", pago.quien);
  }

  const destino = textoDestino();
  if (destino === "") {
    añadir("p", "Escribe quién ha pagado el campo para saber a quién mandar el dinero.", "aviso");
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
  avisoCompartir.textContent = "⚠️ Primero haz los equipos (apartado 2) o rellena el día y el lugar (apartado 3).";
  avisoCompartir.hidden = false;
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
    botonCopiar.textContent = "✅ ¡Copiado!";
  } catch (error) {
    prompt("Copia este texto:", texto);
  }
  setTimeout(function () {
    botonCopiar.textContent = "📋 Copiar texto";
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
// AL ABRIR LA PÁGINA: lo dibujamos todo por primera vez
// =====================================================
aplicarColores();
actualizarNombres();
pintarLista();
if (ultimosEquipos) pintarEquipos();
