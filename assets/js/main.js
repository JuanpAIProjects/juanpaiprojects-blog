/* ============================================================
   JUANPAI PROJECTS — Blog
   Lee posts.json, ig.json, x.json, tiktok.json, youtube.json,
   ultima-hora.json, en-desarrollo.json, seguimientos.json y
   pronosticos.json y pinta:
   banda de última hora, la tarjeta «En desarrollo», la sección
   «Seguimiento» dentro de los posts cuya historia siguió, el
   registro público de pronósticos, la franja de registro de la
   portada, destacado, recientes, archivo por mes y la línea
   compacta «La pieza de hoy también en…» (iconos que enlazan a
   la última pieza de cada red).
   Además: barra de progreso de lectura, barra de suscripción en los
   posts, formularios que delegan en el de Brevo, botones de
   compartir, aparición al hacer scroll, el botón "Copiar" del
   prompt y la cabecera en dos estados (expandida arriba, compacta
   al bajar). Sin build, JS plano.
   Ver README.md para el flujo de publicación.
   ============================================================ */

(function () {
  "use strict";

  var MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  var MESES_CORTOS = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
  ];

  // Las páginas de post viven en /posts/; el resto en la raíz.
  function base() {
    return window.location.pathname.indexOf("/posts/") !== -1 ? "../" : "";
  }

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // "2026-11-15" -> { dia: 15, mes: 10, anio: 2026 } sin problemas de zona horaria.
  function partirFecha(iso) {
    var p = String(iso).split("-");
    return { anio: parseInt(p[0], 10), mes: parseInt(p[1], 10) - 1, dia: parseInt(p[2], 10) };
  }

  function fechaLarga(iso) {
    var f = partirFecha(iso);
    return f.dia + " de " + MESES[f.mes] + " de " + f.anio;
  }

  function fechaCorta(iso) {
    var f = partirFecha(iso);
    return f.dia + " " + MESES_CORTOS[f.mes] + " " + f.anio;
  }

  function cargarJSON(nombre) {
    return fetch(base() + nombre, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("No se pudo cargar " + nombre);
      return r.json();
    });
  }

  function copiarTexto(texto, boton, textoHecho) {
    function listo() {
      if (!boton) return;
      var original = boton.textContent;
      boton.textContent = textoHecho;
      setTimeout(function () { boton.textContent = original; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(listo, listo);
    } else {
      var area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); } catch (e) { /* sin portapapeles */ }
      document.body.removeChild(area);
      listo();
    }
  }

  // Distintivo del tipo de post: "noticia" (coral sólido) o "tip" (borde verde).
  function tipoChip(post) {
    if (post.tipo === "noticia") return '<span class="tipo-chip tipo-noticia">Noticia</span>';
    if (post.tipo === "tip") return '<span class="tipo-chip tipo-tip">Tip y análisis</span>';
    return "";
  }

  // Tiempo de lectura opcional (campo "lectura" en posts.json, ej. "2 min").
  function lecturaTexto(post) {
    return post.lectura ? esc(post.lectura) + " de lectura" : "";
  }

  function filaPost(post) {
    var lectura = lecturaTexto(post);
    return (
      '<a class="post-fila" href="' + esc(base() + post.url) + '">' +
        '<span class="post-fecha">' + esc(fechaCorta(post.fecha)) + "</span>" +
        '<span class="post-info">' +
          '<span class="post-titulo">' + esc(post.titulo) + "</span>" +
          '<span class="post-resumen">' + esc(post.resumen) + "</span>" +
          (lectura ? '<span class="post-lectura">' + lectura + "</span>" : "") +
        "</span>" +
        '<span class="post-chips">' + tipoChip(post) +
          '<span class="tema-chip">' + esc(post.tema) + "</span>" +
        "</span>" +
      "</a>"
    );
  }

  // Banda de última hora: SOLO breaking real. Se pinta desde
  // ultima-hora.json, que escribe el job de breaking al publicar una
  // (titulo, url de destino — el hilo de X o el post del blog —, fecha
  // y hora). Sin breaking registrada, la banda no aparece: nunca se
  // rellena con el post del día (decisión de Juanpa, 18 nov 2026).
  // Frescura: con más de 24 h la banda se apaga sola — una «última
  // hora» de hace dos días ya no es última hora (regla de Juanpa,
  // 27 nov 2026). La historia sigue viva en En desarrollo /
  // En seguimiento; el archivo no se borra.
  function pintarUltimaHora() {
    var banda = document.getElementById("ultima-hora");
    if (!banda) return;
    cargarJSON("ultima-hora.json").then(function (d) {
      if (!d || !d.titulo || !d.url) { banda.hidden = true; return; }
      var cuando = new Date(d.fecha + "T" + (d.hora || "00:00") + ":00-06:00");
      if (!isNaN(cuando) && Date.now() - cuando.getTime() > 24 * 60 * 60 * 1000) { banda.hidden = true; return; }
      if (/^https?:\/\//.test(d.url)) {
        banda.href = d.url;
        banda.target = "_blank";
        banda.rel = "noopener";
      } else {
        banda.href = base() + d.url;
      }
      document.getElementById("uh-titulo").textContent = d.titulo;
      document.getElementById("uh-fecha").textContent =
        fechaCorta(d.fecha) + (d.hora ? " · " + d.hora : "");
      banda.hidden = false;
    }).catch(function () { banda.hidden = true; });
  }

  // Tarjeta «En desarrollo»: la historia del día (destacada) con sus
  // actualizaciones con hora, más la lista «En seguimiento» con hasta 4
  // historias vivas del día y su estado en una línea (desde
  // en-desarrollo.json; lo siembra el generador cada mañana y lo
  // actualiza el job de breaking con cada desarrollo verificado).
  // Solo se muestra si el archivo es de HOY en hora de México; un
  // archivo de otro día no se muestra (nada de historias viejas
  // disfrazadas de actuales).
  function pintarEnDesarrollo() {
    var caja = document.getElementById("en-desarrollo");
    if (!caja) return;
    cargarJSON("en-desarrollo.json").then(function (d) {
      if (!d || !d.titulo || !d.fecha) { caja.hidden = true; return; }
      var hoyMX = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
      if (d.fecha !== hoyMX) { caja.hidden = true; return; }
      function enlazar(el, url, texto) {
        if (url) {
          var a = document.createElement("a");
          if (/^https?:\/\//.test(url)) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
          else { a.href = base() + url; }
          a.textContent = texto;
          el.appendChild(a);
        } else {
          el.textContent = texto;
        }
      }
      enlazar(document.getElementById("ed-titulo"), d.url, d.titulo);
      var res = document.getElementById("ed-resumen");
      if (d.resumen) { res.textContent = d.resumen; } else { res.hidden = true; }
      var lista = document.getElementById("ed-lista");
      var acts = Array.isArray(d.actualizaciones) ? d.actualizaciones.slice(-6).reverse() : [];
      for (var i = 0; i < acts.length; i++) {
        var li = document.createElement("li");
        var h = document.createElement("span");
        h.className = "ed-hora";
        h.textContent = (acts[i].fecha && acts[i].fecha !== d.fecha ? fechaCorta(acts[i].fecha) + " · " : "") + (acts[i].hora || "");
        var tx = document.createElement("span");
        tx.textContent = acts[i].texto || "";
        li.appendChild(h);
        li.appendChild(tx);
        lista.appendChild(li);
      }
      var seg = Array.isArray(d.seguimiento) ? d.seguimiento.slice(0, 4)
        : (Array.isArray(d.tambien) ? d.tambien.slice(0, 2) : []);
      if (seg.length) {
        var tl = document.getElementById("ed-tambien-lista");
        for (var j = 0; j < seg.length; j++) {
          var li2 = document.createElement("li");
          if (seg[j].hora) {
            var sh = document.createElement("span");
            sh.className = "ed-hora";
            sh.textContent = (seg[j].fecha && seg[j].fecha !== d.fecha ? fechaCorta(seg[j].fecha) + " · " : "") + seg[j].hora;
            li2.appendChild(sh);
          }
          var cuerpo = document.createElement("span");
          var tt = document.createElement("span");
          tt.className = "ed-t-titulo";
          enlazar(tt, seg[j].url, seg[j].titulo || "");
          cuerpo.appendChild(tt);
          if (seg[j].cierre && seg[j].cierre.desenlace) {
            var tc = document.createElement("span");
            tc.className = "ed-t-cierre";
            tc.appendChild(document.createTextNode(" — "));
            var sello = document.createElement("span");
            sello.className = "ed-t-sello";
            sello.textContent = "Historia cerrada";
            tc.appendChild(sello);
            tc.appendChild(document.createTextNode(": "));
            enlazar(tc, seg[j].cierre.url, seg[j].cierre.desenlace);
            cuerpo.appendChild(tc);
          } else if (seg[j].estado) {
            var te = document.createElement("span");
            te.className = "ed-t-estado";
            te.textContent = " — " + seg[j].estado;
            cuerpo.appendChild(te);
          }
          li2.appendChild(cuerpo);
          tl.appendChild(li2);
        }
        document.getElementById("ed-tambien").hidden = false;
      }
      var ultimaF = "", ultimaH = "";
      function considerar(f, h) {
        if (!h) return;
        f = f || d.fecha;
        if (f + " " + h > ultimaF + " " + ultimaH) { ultimaF = f; ultimaH = h; }
      }
      for (var a = 0; a < acts.length; a++) considerar(acts[a].fecha, acts[a].hora);
      for (var k = 0; k < seg.length; k++) considerar(seg[k].fecha, seg[k].hora);
      if (ultimaH) {
        document.getElementById("ed-actualizado").textContent = "Última actualización " + fechaCorta(ultimaF) + " · " + ultimaH;
      }
      caja.hidden = false;
    }).catch(function () { caja.hidden = true; });
  }

  // Sección «Seguimiento» dentro de cada post: si la historia de un post
  // siguió desarrollándose después de publicarlo, sus actualizaciones
  // viven en seguimientos.json (las anexa el job de breaking con cada
  // seguimiento verificado) y se pintan aquí, justo antes de «Sigue
  // leyendo». Sin entradas para ese post, la sección no aparece: el
  // seguimiento que se promete es el que existe de verdad.
  function pintarSeguimiento() {
    var nav = document.getElementById("sigue-leyendo");
    if (!nav || !nav.parentNode) return;
    var m = window.location.pathname.match(/posts\/([^\/]+)\.html$/);
    if (!m) return;
    cargarJSON("seguimientos.json").then(function (d) {
      var s = d && d[m[1]];
      var acts = s && Array.isArray(s.actualizaciones) ? s.actualizaciones.slice(-8).reverse() : [];
      var cierre = s && s.cierre && s.cierre.desenlace ? s.cierre : null;
      if (!acts.length && !cierre) return;
      var sec = document.createElement("section");
      sec.className = "seguimiento";
      sec.id = "seguimiento";
      var cab = document.createElement("div");
      cab.className = "ed-cabecera";
      var badge = document.createElement("span");
      badge.className = "ed-badge";
      var punto = document.createElement("span");
      punto.className = "uh-punto";
      badge.appendChild(punto);
      badge.appendChild(document.createTextNode(cierre ? "Seguimiento · historia cerrada" : "Seguimiento"));
      cab.appendChild(badge);
      var ult = document.createElement("span");
      ult.className = "ed-actualizado";
      var ultF = acts.length ? acts[0].fecha : cierre.fecha, ultH = acts.length ? (acts[0].hora || "") : (cierre.hora || "");
      if (cierre && acts.length && (cierre.fecha + " " + (cierre.hora || "") > acts[0].fecha + " " + (acts[0].hora || ""))) { ultF = cierre.fecha; ultH = cierre.hora || ""; }
      ult.textContent = "Última actualización " + fechaCorta(ultF) + (ultH ? " · " + ultH : "");
      cab.appendChild(ult);
      sec.appendChild(cab);
      var intro = document.createElement("p");
      intro.className = "seg-intro";
      intro.textContent = "Esta historia siguió después de publicado el post. Aquí va lo nuevo, en orden, solo con datos verificados:";
      sec.appendChild(intro);
      var ul = document.createElement("ul");
      ul.className = "ed-lista";
      for (var i = 0; i < acts.length; i++) {
        var li = document.createElement("li");
        var h = document.createElement("span");
        h.className = "ed-hora";
        h.textContent = (acts[i].fecha ? fechaCorta(acts[i].fecha) + " · " : "") + (acts[i].hora || "");
        var tx = document.createElement("span");
        tx.textContent = acts[i].texto || "";
        li.appendChild(h);
        li.appendChild(tx);
        ul.appendChild(li);
      }
      if (acts.length) sec.appendChild(ul);
      if (cierre) {
        var pc = document.createElement("p");
        pc.className = "seg-cierre";
        var rot = document.createElement("span");
        rot.className = "seg-cierre-rotulo";
        rot.textContent = "Cierre de esta historia";
        pc.appendChild(rot);
        pc.appendChild(document.createTextNode(" — "));
        if (cierre.url) {
          var ac = document.createElement("a");
          if (/^https?:\/\//.test(cierre.url)) { ac.href = cierre.url; ac.target = "_blank"; ac.rel = "noopener"; }
          else { ac.href = base() + cierre.url; }
          ac.textContent = cierre.desenlace;
          pc.appendChild(ac);
        } else {
          pc.appendChild(document.createTextNode(cierre.desenlace));
        }
        pc.appendChild(document.createTextNode(" · " + fechaCorta(cierre.fecha) + (cierre.hora ? " · " + cierre.hora : "")));
        sec.appendChild(pc);
      }
      nav.parentNode.insertBefore(sec, nav);
    }).catch(function () {});
  }

  // Página «Pronósticos a la vista»: el registro público de
  // calibración de la marca, pintado desde pronosticos.json (el mismo
  // registro que el generador escribe antes de cada pieza y que la
  // vanguardia califica cada lunes). Dos secciones por el campo
  // «tipo»: predicciones de EVENTOS (con su probabilidad declarada y
  // su «resolucion» cuando el evento ya pasó) y pronósticos de
  // CONTENIDO (las entradas sin «tipo» cuentan como contenido).
  // Marcador calculado por sección (totales por resultado; el % de
  // acierto solo aparece con 20+ calificados) y lista del más
  // reciente al más viejo.
  // Sin datos, la página enseña el trato y un vacío honesto: nunca
  // una lista inventada.
  function pintarPronosticos() {
    var marcadorC = document.getElementById("pronosticos-marcador");
    var listaC = document.getElementById("pronosticos-lista");
    if (!marcadorC || !listaC) return;
    var vacioC = document.getElementById("pronosticos-vacio");
    var marcadorE = document.getElementById("pronosticos-marcador-eventos");
    var listaE = document.getElementById("pronosticos-lista-eventos");
    var vacioE = document.getElementById("pronosticos-vacio-eventos");
    function pintarSeccion(items, marcador, lista, vacio, txt) {
      var aciertos = 0, parciales = 0, fallos = 0, pendientes = 0;
      items.forEach(function (p) {
        if (p.resultado === "acierto") aciertos++;
        else if (p.resultado === "parcial") parciales++;
        else if (p.resultado === "fallo") fallos++;
        else pendientes++;
      });
      var calificados = aciertos + parciales + fallos;
      var texto = items.length + " " + (items.length === 1 ? txt.uno + " " + txt.publicado : txt.muchos + " " + txt.publicados);
      if (calificados) {
        texto += " · " + aciertos + (aciertos === 1 ? " acierto" : " aciertos") +
          " · " + parciales + (parciales === 1 ? " parcial" : " parciales") +
          " · " + fallos + (fallos === 1 ? " fallo" : " fallos");
        // El % solo se enseña con muestra que pese (20+ calificados):
        // con pocos, un 17% se lee como condena y no calibra nada.
        // Misma regla que la franja de la portada (27 nov 2026).
        if (calificados >= 20) texto += " · acierto en el " + Math.round((aciertos / calificados) * 100) + "% de los calificados";
        if (pendientes) texto += " · " + pendientes + " en espera de calificación";
      } else if (items.length) {
        texto += txt.sinCalificados;
      } else {
        texto = txt.vacioMarcador;
      }
      if (marcador) marcador.textContent = texto;
      if (!items.length) {
        if (vacio) { vacio.textContent = txt.vacioLista; vacio.hidden = false; }
        return;
      }
      if (vacio) vacio.hidden = true;
      items.forEach(function (p) {
        var li = document.createElement("li");
        var h = document.createElement("span");
        h.className = "ed-hora";
        h.textContent = p.fecha ? fechaCorta(p.fecha) : "";
        li.appendChild(h);
        var cuerpo = document.createElement("span");
        var t = document.createElement("strong");
        t.textContent = p.tema || "";
        cuerpo.appendChild(t);
        if (p.pronostico) {
          cuerpo.appendChild(document.createTextNode(" — " + p.pronostico));
        }
        if (p.probabilidad != null && p.probabilidad !== "") {
          cuerpo.appendChild(document.createTextNode(" "));
          var pb = document.createElement("span");
          pb.className = "tema-chip";
          pb.textContent = "Probabilidad: " + p.probabilidad + "%";
          cuerpo.appendChild(pb);
        }
        cuerpo.appendChild(document.createTextNode(" "));
        var chip = document.createElement("span");
        if (p.resultado === "acierto") { chip.className = "tipo-chip tipo-tip"; chip.textContent = "Acierto"; }
        else if (p.resultado === "fallo") { chip.className = "tipo-chip tipo-noticia"; chip.textContent = "Fallo"; }
        else if (p.resultado === "parcial") { chip.className = "tema-chip"; chip.textContent = "Parcial"; }
        else { chip.className = "tema-chip"; chip.textContent = "Pendiente"; }
        cuerpo.appendChild(chip);
        if (p.resolucion) {
          cuerpo.appendChild(document.createTextNode(" Resultado: " + p.resolucion));
        }
        if (p.nota) {
          cuerpo.appendChild(document.createTextNode(" " + p.nota));
        }
        li.appendChild(cuerpo);
        lista.appendChild(li);
      });
    }
    cargarJSON("pronosticos.json").then(function (d) {
      var items = (d && Array.isArray(d.pronosticos)) ? d.pronosticos.slice() : [];
      items.sort(function (a, b) { return String(b.fecha || "").localeCompare(String(a.fecha || "")); });
      var eventos = items.filter(function (p) { return p.tipo === "evento"; });
      var contenido = items.filter(function (p) { return p.tipo !== "evento"; });
      var act = document.getElementById("pronosticos-actualizado");
      if (act && d && d.actualizado) act.textContent = "Actualizado " + fechaCorta(d.actualizado);
      if (marcadorE && listaE) {
        pintarSeccion(eventos, marcadorE, listaE, vacioE, {
          uno: "predicción de evento", muchos: "predicciones de eventos",
          publicado: "publicada", publicados: "publicadas",
          sinCalificados: " · primeras calificaciones: el lunes, contra lo que de verdad pasó",
          vacioMarcador: "Todavía no hay predicciones de eventos publicadas ni calificadas.",
          vacioLista: "Todavía no hay predicciones de eventos publicadas: la primera entra cuando una cobertura abra una predicción medible."
        });
      }
      pintarSeccion(contenido, marcadorC, listaC, vacioC, {
        uno: "pronóstico", muchos: "pronósticos",
        publicado: "publicado", publicados: "publicados",
        sinCalificados: " · primeras calificaciones: el lunes, contra las métricas medidas",
        vacioMarcador: "Todavía no hay pronósticos publicados ni calificados.",
        vacioLista: "Todavía no hay pronósticos publicados."
      });
    }).catch(function () {
      if (vacioC) { vacioC.textContent = "No se pudo cargar el registro."; vacioC.hidden = false; }
      if (vacioE) { vacioE.textContent = "No se pudo cargar el registro."; vacioE.hidden = false; }
    });
  }

  // Mini-bloque del registro al final de cada post (lo trae la
  // plantilla): una línea con el marcador acumulado del registro
  // público — aciertos de calificados cuando ya los hay; si no,
  // solo el conteo de pronósticos — y el enlace al registro
  // completo, pintada desde pronosticos.json (eventos + contenido).
  // Si no hay ningún pronóstico registrado, el bloque no se pinta.
  function pintarRegistroMini() {
    var el = document.getElementById("registro-mini");
    if (!el) return;
    cargarJSON("pronosticos.json").then(function (d) {
      var items = (d && Array.isArray(d.pronosticos)) ? d.pronosticos : [];
      if (!items.length) return;
      var aciertos = 0, calificados = 0;
      items.forEach(function (p) {
        if (p.resultado === "acierto") { aciertos++; calificados++; }
        else if (p.resultado === "parcial" || p.resultado === "fallo") { calificados++; }
      });
      var texto = "Registro público: " + items.length + (items.length === 1 ? " pronóstico" : " pronósticos");
      if (calificados) {
        texto += " · " + aciertos + (aciertos === 1 ? " acierto" : " aciertos") +
          " de " + calificados + (calificados === 1 ? " calificado" : " calificados");
      }
      el.textContent = texto + " — ";
      var a = document.createElement("a");
      a.href = base() + "pronosticos.html";
      a.textContent = "Ver el registro →";
      el.appendChild(a);
      el.hidden = false;
    }).catch(function () {});
  }

  function pintarDestacado(post) {
    var el = document.getElementById("post-destacado");
    if (!el || !post) return;
    var lectura = lecturaTexto(post);
    el.innerHTML =
      '<p class="destacado-etiqueta">Post del día</p>' +
      '<p class="meta">' + tipoChip(post) +
      '<time datetime="' + esc(post.fecha) + '">' + esc(fechaLarga(post.fecha)) + "</time>" +
      (lectura ? "<span>· " + lectura + "</span>" : "") +
      '<span class="tema-chip">' + esc(post.tema) + "</span></p>" +
      '<h3><a href="' + esc(base() + post.url) + '">' + esc(post.titulo) + "</a></h3>" +
      '<p class="destacado-resumen">' + esc(post.resumen) + "</p>" +
      '<a class="enlace-leer" href="' + esc(base() + post.url) + '">Leer el post completo →</a>';
  }

  function pintarRecientes(posts) {
    var el = document.getElementById("lista-recientes");
    if (!el) return;
    var recientes = posts.slice(1, 7);
    if (!recientes.length) {
      el.innerHTML = '<p class="lista-vacia">El primer post está arriba. Los siguientes aparecen aquí, un post nuevo cada día.</p>';
      return;
    }
    el.innerHTML = recientes.map(filaPost).join("");
  }

  // Vacío honesto del archivo filtrado. Cuando la vista es una de
  // las dos secciones nuevas (Finanzas personales / Motivación) y
  // todavía no tiene posts, la vista explica qué es la sección,
  // avisa que sus primeras piezas llegan esta semana y ofrece dos
  // salidas: el archivo completo y la suscripción al dato diario.
  // En cuanto exista un post con ese tema exacto, la vista lista
  // posts como siempre y este vacío deja de verse.
  var VACIOS_SECCION = {
    "Finanzas personales": "El sistema para tu dinero: principios aplicables, sin humo.",
    "Motivación": "La mentalidad que sostiene los sistemas: sustancia, nada de frases de gurú."
  };

  function vacioArchivo(tema, tipo) {
    if (tema && VACIOS_SECCION[tema]) {
      return (
        '<div class="destacado">' +
        '<p class="destacado-etiqueta">' + esc(tema) + "</p>" +
        '<p class="destacado-resumen">' + esc(VACIOS_SECCION[tema]) + "</p>" +
        "<p>Las primeras piezas de esta sección llegan esta semana. Mientras tanto, todo lo publicado está en el archivo completo, y el dato diario llega a tu correo cada mañana.</p>" +
        '<p style="margin-bottom: 0;"><a class="boton boton-solido" href="' + esc(base() + "archivo.html") + '">Ver el archivo completo</a> ' +
        '<a class="boton boton-contorno" href="' + esc(base() + "index.html#suscripcion") + '">Suscribirme al dato diario</a></p>' +
        "</div>"
      );
    }
    return '<p class="lista-vacia">' + (tema || tipo ? "Todavía no hay posts en esta sección." : "Todavía no hay posts publicados.") + "</p>";
  }

  function pintarArchivo(posts) {
    var el = document.getElementById("archivo-lista");
    if (!el) return;
    // Filtros por sección: ?tema=Finanzas%20personales, ?tema=Motivación,
    // ?tipo=noticia, ?tipo=tip (enlaces del pie y de la barra del archivo).
    var params = new URLSearchParams(window.location.search);
    var tema = params.get("tema");
    var tipo = params.get("tipo");
    if (tema) posts = posts.filter(function (p) { return p.tema === tema; });
    if (tipo) posts = posts.filter(function (p) { return p.tipo === tipo; });
    if (!posts.length) {
      el.innerHTML = vacioArchivo(tema, tipo);
      return;
    }
    var grupos = {};
    var orden = [];
    posts.forEach(function (post) {
      var f = partirFecha(post.fecha);
      var clave = f.anio + "-" + f.mes;
      if (!grupos[clave]) {
        grupos[clave] = { titulo: MESES[f.mes] + " de " + f.anio, posts: [] };
        orden.push(clave);
      }
      grupos[clave].posts.push(post);
    });
    el.innerHTML = orden.map(function (clave) {
      var g = grupos[clave];
      return (
        '<div class="archivo-grupo"><h2 class="archivo-mes">' + esc(g.titulo) + "</h2>" +
        '<div class="lista-posts">' + g.posts.map(filaPost).join("") + "</div></div>"
      );
    }).join("");
  }

  // Franja de registro público (portada): una sola línea-invitación
  // al registro, sin cifras. El contador de días hacía ver nuevo al
  // blog y el % de acierto con pocos calificados se leía como
  // «falla casi siempre» (17% = 1 de 6). Decisión de Juanpa,
  // 27 nov 2026: fuera el % y los días de la franja; el % vuelve
  // cuando haya ~20 pronósticos calificados. Las cifras completas
  // viven en pronosticos.html, con su metodología.
  function pintarFranjaRegistro() {
    var franja = document.getElementById("franja-registro");
    if (!franja) return;
    franja.innerHTML =
      '<span class="fr-dato"><strong>Registro público</strong> — cada predicción se escribe antes y se califica a la vista</span>' +
      '<a class="fr-enlace" href="' + esc(base() + "pronosticos.html") + '">Ver el registro público \u2192</a>';
    franja.hidden = false;
  }

  // Línea compacta «La pieza de hoy también en…» (portada): los
  // iconos ya vienen en el HTML enlazando a cada perfil; aquí solo
  // se apunta el de Instagram, X, TikTok y YouTube a la pieza de
  // hoy en su red, con la URL de la primera entrada de ig.json,
  // x.json, tiktok.json y youtube.json (los mismos enlaces que
  // antes llevaban las tarjetas). Si un JSON no trae pieza o la
  // carga falla, el icono conserva su enlace al perfil. Facebook
  // no tiene JSON: su icono siempre enlaza a la Página.
  function pintarIconosRedes() {
    var enlaces = {};
    Array.prototype.forEach.call(document.querySelectorAll(".pieza-iconos a[data-red]"), function (a) {
      enlaces[a.getAttribute("data-red")] = a;
    });
    if (!enlaces.ig && !enlaces.x && !enlaces.tk && !enlaces.yt) return;
    function aplicar(red, url, nombre) {
      var a = enlaces[red];
      if (!a || !url) return;
      a.href = url;
      a.setAttribute("aria-label", nombre + " — la pieza de hoy");
    }
    cargarJSON("ig.json").then(function (d) {
      if (d && d.publicaciones && d.publicaciones.length) aplicar("ig", d.publicaciones[0].url, "Instagram");
    }).catch(function () {});
    cargarJSON("x.json").then(function (d) {
      if (d && d.entradas && d.entradas.length) aplicar("x", d.entradas[0].url, "X");
    }).catch(function () {});
    cargarJSON("tiktok.json").then(function (d) {
      if (d && d.videos && d.videos.length) aplicar("tk", d.videos[0].url, "TikTok");
    }).catch(function () {});
    cargarJSON("youtube.json").then(function (d) {
      if (d && d.videos && d.videos.length) aplicar("yt", d.videos[0].url, "YouTube");
    }).catch(function () {});
  }

  // Formularios que delegan en el formulario real de Brevo de la
  // página (#sib-form): el del hero de la portada y la caja tras la
  // Aplicable en los posts. Brevo necesita sus ID únicos por página,
  // así que su formulario NO se duplica: el formulario chico copia el
  // correo al campo real, deja la frecuencia en Diario (valor 1) y
  // pulsa el botón real de envío; el resultado (éxito o error) se ve
  // en los paneles del formulario real, al que se desplaza la vista.
  function activarFormulariosDelegados() {
    var chicos = document.querySelectorAll("form[data-delegar-suscripcion]");
    if (!chicos.length) return;
    var formReal = document.getElementById("sib-form");
    var emailReal = document.getElementById("EMAIL");
    if (!formReal || !emailReal) return;
    Array.prototype.forEach.call(chicos, function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var campo = form.querySelector("[data-email-delegado]");
        if (!campo || !campo.value) return;
        emailReal.value = campo.value;
        var diario = formReal.querySelector('input[name="FRECUENCIA"][value="1"]');
        if (diario) diario.checked = true;
        var boton = form.querySelector('button[type="submit"]');
        if (boton) boton.disabled = true;
        var enviar = formReal.querySelector('button[type="submit"]');
        if (enviar) enviar.click();
        var destino = document.getElementById("sib-form-container") || formReal;
        setTimeout(function () {
          destino.scrollIntoView({ behavior: "smooth", block: "center" });
          if (boton) boton.disabled = false;
        }, 400);
      });
    });
  }

  // Barra de suscripción de los posts: fina y descartable, aparece
  // tras leer ~45 % del post y enlaza al formulario del propio post
  // (#sib-form). Se crea desde JS para que aplique también a los
  // posts ya publicados, sin remontarlos. Al cerrarla no vuelve en
  // la misma sesión (sessionStorage). Es el único elemento
  // persistente de la página y se oculta mientras el formulario
  // está a la vista.
  function activarBarraCorreo() {
    if (window.location.pathname.indexOf("/posts/") === -1) return;
    var form = document.getElementById("sib-form");
    if (!form) return;
    var descartada = false;
    try { descartada = window.sessionStorage.getItem("barraCorreoCerrada") === "1"; } catch (e) {}
    if (descartada) return;
    var barra = document.createElement("div");
    barra.className = "barra-correo";
    barra.id = "barra-correo";
    barra.hidden = true;
    barra.innerHTML =
      '<span class="barra-correo-texto">Recíbelo mañana en tu correo — gratis</span>' +
      '<a class="barra-correo-boton" href="#sib-form">Suscribirme</a>' +
      '<button class="barra-correo-cerrar" type="button" aria-label="Cerrar aviso">×</button>';
    document.body.appendChild(barra);
    var visible = false;
    var formVisible = false;
    function actualizar() {
      if (descartada) { barra.hidden = true; return; }
      var doc = document.documentElement;
      var alto = doc.scrollHeight - window.innerHeight;
      var avance = alto > 0 ? window.scrollY / alto : 0;
      var debe = avance >= 0.45 && !formVisible;
      if (debe !== visible) { visible = debe; barra.hidden = !debe; }
    }
    window.addEventListener("scroll", actualizar, { passive: true });
    window.addEventListener("resize", actualizar);
    var observador = null;
    if ("IntersectionObserver" in window) {
      observador = new IntersectionObserver(function (entradas) {
        formVisible = entradas[0].isIntersecting;
        actualizar();
      }, { threshold: 0.05 });
      observador.observe(form);
    }
    barra.querySelector(".barra-correo-cerrar").addEventListener("click", function () {
      descartada = true;
      visible = false;
      barra.hidden = true;
      try { window.sessionStorage.setItem("barraCorreoCerrada", "1"); } catch (e) {}
      if (observador) observador.disconnect();
    });
    actualizar();
  }

  function activarCopiar() {
    var botones = document.querySelectorAll("[data-copiar]");
    Array.prototype.forEach.call(botones, function (boton) {
      boton.addEventListener("click", function () {
        var destino = document.getElementById(boton.getAttribute("data-copiar"));
        if (!destino) return;
        copiarTexto(destino.innerText || destino.textContent, boton, "Copiado");
      });
    });
  }

  // Botones de compartir del post: X, WhatsApp, Facebook, copiar enlace
  // y el botón nativo (Web Share API) cuando el dispositivo lo soporta.
  function activarCompartir() {
    var botones = document.querySelectorAll("[data-compartir]");
    if (!botones.length) return;
    var url = window.location.href;
    var titulo = document.title.replace(/\s+—\s+Juanpai Projects\s*$/, "");
    var texto = titulo + " — vía Juanpai Projects";
    Array.prototype.forEach.call(botones, function (boton) {
      var tipo = boton.getAttribute("data-compartir");
      if (tipo === "nativo") {
        if (navigator.share) { boton.hidden = false; } else { boton.remove(); return; }
      }
      boton.addEventListener("click", function () {
        if (tipo === "nativo" && navigator.share) {
          navigator.share({ title: titulo, text: texto, url: url }).catch(function () { /* cancelado */ });
        } else if (tipo === "x") {
          window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(texto) +
            "&url=" + encodeURIComponent(url), "_blank", "noopener,width=600,height=460");
        } else if (tipo === "whatsapp") {
          window.open("https://wa.me/?text=" + encodeURIComponent(texto + " " + url), "_blank", "noopener");
        } else if (tipo === "facebook") {
          window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),
            "_blank", "noopener,width=600,height=460");
        } else if (tipo === "copiar") {
          copiarTexto(url, boton, "Enlace copiado");
        }
      });
    });
  }

  // Barra de progreso de lectura (solo existe en las páginas de post).
  function activarProgreso() {
    var barra = document.getElementById("progreso");
    if (!barra) return;
    function actualizar() {
      var doc = document.documentElement;
      var alto = doc.scrollHeight - window.innerHeight;
      var avance = alto > 0 ? window.scrollY / alto : 0;
      if (avance < 0) avance = 0;
      if (avance > 1) avance = 1;
      barra.style.width = (avance * 100).toFixed(2) + "%";
    }
    window.addEventListener("scroll", actualizar, { passive: true });
    window.addEventListener("resize", actualizar);
    actualizar();
  }

  // «Sigue leyendo» al final del post: enlaza al post anterior y al
  // siguiente según el orden de posts.json (más reciente primero).
  // «Sigue leyendo» al final del post: hasta 3 relacionados según el
  // orden de posts.json (más reciente primero): el anterior, el más
  // reciente (si no es ya vecino) y el siguiente.
  function pintarSigueLeyendo(posts) {
    var nav = document.getElementById("sigue-leyendo");
    if (!nav || !posts || !posts.length) return;
    var ruta = window.location.pathname;
    var idx = -1;
    for (var i = 0; i < posts.length; i++) {
      if (ruta.indexOf(posts[i].url) !== -1) { idx = i; break; }
    }
    if (idx === -1) return;
    var tarjetas = [];
    if (idx + 1 < posts.length) {
      tarjetas.push({ dir: "\u2190 Anterior", post: posts[idx + 1], der: false });
    }
    var ultimo = posts[0];
    if (idx !== 0 && ultimo !== posts[idx + 1] && ultimo !== posts[idx - 1] && tarjetas.length < 3) {
      tarjetas.push({ dir: "Lo último", post: ultimo, der: false });
    }
    if (idx - 1 >= 0) {
      tarjetas.push({ dir: "Siguiente \u2192", post: posts[idx - 1], der: true });
    }
    if (!tarjetas.length) return;
    var html = "<p class=\"sigue-titulo\">Sigue leyendo</p><div class=\"sigue-enlaces\">";
    tarjetas.slice(0, 3).forEach(function (t) {
      html += "<a class=\"sigue-link" + (t.der ? " sigue-der" : "") + "\" href=\"../" + t.post.url +
        "\"><span class=\"sigue-dir\">" + t.dir + "</span><span class=\"sigue-nombre\">" +
        esc(t.post.titulo) + "</span></a>";
    });
    html += "</div>";
    nav.innerHTML = html;
  }

  // Aparición suave al hacer scroll (respeta prefers-reduced-motion).
  function activarRevelar() {
    var els = document.querySelectorAll(".revelar");
    if (!els.length) return;
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add("visible"); });
      return;
    }
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.1 });
    Array.prototype.forEach.call(els, function (el) { observador.observe(el); });
  }

  // Cabecera en dos estados: expandida arriba (lockup completo —
  // foco y nombre — con la navegación en su propia hilera) y
  // compacta al bajar: al pasar ~40 px se le pone la clase
  // «compacto» y el CSS la adelgaza a una hilera (solo el foco,
  // nav deslizable y botón chico), patrón del blog de Don Rosendo.
  // Sin JS, la cabecera queda siempre expandida.
  function activarCabeceraCompacta() {
    var cabecera = document.querySelector("header.cabecera");
    if (!cabecera) return;
    function actualizar() {
      var y = window.scrollY || window.pageYOffset || 0;
      cabecera.classList.toggle("compacto", y > 40);
    }
    window.addEventListener("scroll", actualizar, { passive: true });
    window.addEventListener("resize", actualizar);
    actualizar();
  }

  function iniciar() {
    var anio = document.getElementById("anio");
    if (anio) anio.textContent = new Date().getFullYear();
    activarCabeceraCompacta();
    activarCopiar();
    activarCompartir();
    activarProgreso();
    activarRevelar();
    activarFormulariosDelegados();
    activarBarraCorreo();

    var hayInicio = document.getElementById("post-destacado") || document.getElementById("lista-recientes") || document.getElementById("ultima-hora");
    var hayArchivo = document.getElementById("archivo-lista");
    pintarUltimaHora();
    pintarEnDesarrollo();
    pintarSeguimiento();
    pintarPronosticos();
    if (hayInicio || hayArchivo) {
      cargarJSON("posts.json").then(function (posts) {
        posts = Array.isArray(posts) ? posts : [];
        if (hayInicio) { pintarDestacado(posts[0]); pintarRecientes(posts); }
        if (hayArchivo) pintarArchivo(posts);
      }).catch(function () { /* si falla, las secciones quedan con su texto base */ });
    }

    if (document.getElementById("sigue-leyendo")) {
      cargarJSON("posts.json").then(function (posts) {
        pintarSigueLeyendo(Array.isArray(posts) ? posts : []);
      }).catch(function () { /* sin encadenado si falla la carga */ });
    }

    if (document.querySelector(".pieza-iconos")) pintarIconosRedes();
    if (document.getElementById("franja-registro")) pintarFranjaRegistro();
    if (document.getElementById("registro-mini")) pintarRegistroMini();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
