/* ============================================================
   JUANPAI PROJECTS — Blog
   Lee posts.json, ig.json, x.json, tiktok.json, youtube.json,
   ultima-hora.json, en-desarrollo.json y seguimientos.json y pinta:
   banda de última hora, la tarjeta «En desarrollo», la sección
   «Seguimiento» dentro de los posts cuya historia siguió, destacado,
   recientes, archivo por mes, la
   tira «En todas partes» (la última pieza de cada red) y el detalle
   por red en desplegables. Además: barra de progreso de lectura,
   botones de compartir, aparición al hacer scroll y el botón
   "Copiar" del prompt. Sin build, JS plano.
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
  function pintarUltimaHora() {
    var banda = document.getElementById("ultima-hora");
    if (!banda) return;
    cargarJSON("ultima-hora.json").then(function (d) {
      if (!d || !d.titulo || !d.url) { banda.hidden = true; return; }
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
        h.textContent = acts[i].hora || "";
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
            sh.textContent = seg[j].hora;
            li2.appendChild(sh);
          }
          var cuerpo = document.createElement("span");
          var tt = document.createElement("span");
          tt.className = "ed-t-titulo";
          enlazar(tt, seg[j].url, seg[j].titulo || "");
          cuerpo.appendChild(tt);
          if (seg[j].estado) {
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
      var ultima = acts.length ? (acts[0].hora || "") : "";
      for (var k = 0; k < seg.length; k++) {
        if (seg[k].hora && seg[k].hora > ultima) ultima = seg[k].hora;
      }
      if (ultima) {
        document.getElementById("ed-actualizado").textContent = "Última actualización " + ultima;
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
      if (!acts.length) return;
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
      badge.appendChild(document.createTextNode("Seguimiento"));
      cab.appendChild(badge);
      var ult = document.createElement("span");
      ult.className = "ed-actualizado";
      ult.textContent = "Última actualización " + fechaCorta(acts[0].fecha) + (acts[0].hora ? " · " + acts[0].hora : "");
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
      sec.appendChild(ul);
      nav.parentNode.insertBefore(sec, nav);
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

  function pintarArchivo(posts) {
    var el = document.getElementById("archivo-lista");
    if (!el) return;
    if (!posts.length) {
      el.innerHTML = '<p class="lista-vacia">Todavía no hay posts publicados.</p>';
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

  function pintarInstagram(ig) {
    var el = document.getElementById("ig-grid");
    if (!el) return;
    var pubs = (ig && ig.publicaciones) || [];
    if (!pubs.length) { el.innerHTML = ""; return; }
    el.innerHTML = pubs.slice(0, 6).map(function (pub) {
      // Campo opcional "imagen": URL pública de la foto del post.
      // Si la imagen falla al cargar, se retira y la tarjeta queda de texto.
      var imagen = pub.imagen
        ? '<img class="ig-imagen" src="' + esc(pub.imagen) + '" alt="' + esc(pub.titulo) +
          '" loading="lazy" onerror="this.remove()">'
        : "";
      return (
        '<a class="ig-tarjeta" href="' + esc(pub.url) + '" target="_blank" rel="noopener">' +
          imagen +
          '<span class="tema-chip">' + esc(pub.tipo || "Post") + "</span>" +
          '<span class="ig-titulo">' + esc(pub.titulo) + "</span>" +
          '<span class="ig-resumen">' + esc(pub.resumen) + "</span>" +
          '<span class="ig-meta">' + esc(fechaCorta(pub.fecha)) + " · Ver en Instagram →</span>" +
        "</a>"
      );
    }).join("");
  }

  function pintarX(datos) {
    var el = document.getElementById("x-grid");
    if (!el) return;
    var entradas = (datos && datos.entradas) || [];
    if (!entradas.length) { el.innerHTML = ""; return; }
    el.innerHTML = entradas.slice(0, 6).map(function (entrada) {
      var imagen = entrada.imagen
        ? '<img class="ig-imagen" src="' + esc(entrada.imagen) + '" alt="" loading="lazy" onerror="this.remove()">'
        : "";
      return (
        '<a class="x-tarjeta" href="' + esc(entrada.url) + '" target="_blank" rel="noopener">' +
          imagen +
          '<span class="tema-chip">En X</span>' +
          '<span class="x-texto">' + esc(entrada.texto) + "</span>" +
          '<span class="ig-meta">' + esc(fechaCorta(entrada.fecha)) + " · Ver en X →</span>" +
        "</a>"
      );
    }).join("");
  }


  function tarjetaVideo(pub, red, cta) {
    var imagen = pub.imagen
      ? '<img class="ig-imagen ig-imagen-vertical" src="' + esc(pub.imagen) + '" alt="' + esc(pub.titulo) +
        '" loading="lazy" onerror="this.remove()">'
      : "";
    return (
      '<a class="ig-tarjeta" href="' + esc(pub.url) + '" target="_blank" rel="noopener">' +
        imagen +
        '<span class="tema-chip">' + esc(red) + "</span>" +
        '<span class="ig-titulo">' + esc(pub.titulo) + "</span>" +
        '<span class="ig-meta">' + esc(fechaCorta(pub.fecha)) + " · " + esc(cta) + "</span>" +
      "</a>"
    );
  }

  function pintarTikTok(datos) {
    var el = document.getElementById("tk-grid");
    if (!el) return;
    var vids = (datos && datos.videos) || [];
    if (!vids.length) { el.innerHTML = ""; return; }
    el.innerHTML = vids.slice(0, 3).map(function (v) {
      return tarjetaVideo(v, "TikTok", "Ver en TikTok →");
    }).join("");
  }

  function pintarYouTube(datos) {
    var vids = (datos && datos.videos) || [];
    var emb = document.getElementById("yt-embed");
    if (emb && vids.length && vids[0].videoId) {
      emb.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(vids[0].videoId) +
        '" title="' + esc(vids[0].titulo) + '" loading="lazy" ' +
        'allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    }
    var el = document.getElementById("yt-grid");
    if (!el) return;
    if (!vids.length) { el.innerHTML = ""; return; }
    el.innerHTML = vids.slice(0, 3).map(function (v) {
      return tarjetaVideo(v, "YouTube Shorts", "Ver en YouTube →");
    }).join("");
  }

  // Tira «En todas partes» de la portada: la última pieza de cada red
  // (Instagram, X, TikTok, YouTube) en una sola fila mixta. Se repinta
  // conforme llega cada JSON; el detalle completo de cada red vive en
  // los desplegables de la misma sección (ig-grid, x-grid, tk-grid,
  // yt-grid), que pintan las funciones de arriba sin cambios.
  var datosTira = {};

  function tarjetaTiraIG(pub) {
    var imagen = pub.imagen
      ? '<img class="ig-imagen" src="' + esc(pub.imagen) + '" alt="' + esc(pub.titulo) +
        '" loading="lazy" onerror="this.remove()">'
      : "";
    return (
      '<a class="ig-tarjeta" href="' + esc(pub.url) + '" target="_blank" rel="noopener">' +
        imagen +
        '<span class="tema-chip">Instagram</span>' +
        '<span class="ig-titulo">' + esc(pub.titulo) + "</span>" +
        '<span class="ig-resumen">' + esc(pub.resumen) + "</span>" +
        '<span class="ig-meta">' + esc(fechaCorta(pub.fecha)) + " · Ver en Instagram →</span>" +
      "</a>"
    );
  }

  function tarjetaTiraX(entrada) {
    var imagen = entrada.imagen
      ? '<img class="ig-imagen" src="' + esc(entrada.imagen) + '" alt="" loading="lazy" onerror="this.remove()">'
      : "";
    return (
      '<a class="x-tarjeta" href="' + esc(entrada.url) + '" target="_blank" rel="noopener">' +
        imagen +
        '<span class="tema-chip">X</span>' +
        '<span class="x-texto">' + esc(entrada.texto) + "</span>" +
        '<span class="ig-meta">' + esc(fechaCorta(entrada.fecha)) + " · Ver en X →</span>" +
      "</a>"
    );
  }

  function pintarTira() {
    var el = document.getElementById("redes-tira");
    if (!el) return;
    var tarjetas = [];
    var ig = datosTira.ig, x = datosTira.x, tk = datosTira.tk, yt = datosTira.yt;
    if (ig && ig.publicaciones && ig.publicaciones.length) tarjetas.push(tarjetaTiraIG(ig.publicaciones[0]));
    if (x && x.entradas && x.entradas.length) tarjetas.push(tarjetaTiraX(x.entradas[0]));
    if (tk && tk.videos && tk.videos.length) tarjetas.push(tarjetaVideo(tk.videos[0], "TikTok", "Ver en TikTok →"));
    if (yt && yt.videos && yt.videos.length) tarjetas.push(tarjetaVideo(yt.videos[0], "YouTube", "Ver en YouTube →"));
    el.innerHTML = tarjetas.join("");
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
  function pintarSigueLeyendo(posts) {
    var nav = document.getElementById("sigue-leyendo");
    if (!nav || !posts || !posts.length) return;
    var ruta = window.location.pathname;
    var idx = -1;
    for (var i = 0; i < posts.length; i++) {
      if (ruta.indexOf(posts[i].url) !== -1) { idx = i; break; }
    }
    if (idx === -1) return;
    var hay = false;
    var html = "<p class=\"sigue-titulo\">Sigue leyendo</p><div class=\"sigue-enlaces\">";
    if (idx + 1 < posts.length) {
      hay = true;
      html += "<a class=\"sigue-link\" href=\"../" + posts[idx + 1].url + "\"><span class=\"sigue-dir\">← Anterior</span><span class=\"sigue-nombre\">" + esc(posts[idx + 1].titulo) + "</span></a>";
    }
    if (idx - 1 >= 0) {
      hay = true;
      html += "<a class=\"sigue-link sigue-der\" href=\"../" + posts[idx - 1].url + "\"><span class=\"sigue-dir\">Siguiente →</span><span class=\"sigue-nombre\">" + esc(posts[idx - 1].titulo) + "</span></a>";
    }
    html += "</div>";
    if (hay) nav.innerHTML = html;
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

  function iniciar() {
    var anio = document.getElementById("anio");
    if (anio) anio.textContent = new Date().getFullYear();
    activarCopiar();
    activarCompartir();
    activarProgreso();
    activarRevelar();

    var hayInicio = document.getElementById("post-destacado") || document.getElementById("lista-recientes") || document.getElementById("ultima-hora");
    var hayArchivo = document.getElementById("archivo-lista");
    pintarUltimaHora();
    pintarEnDesarrollo();
    pintarSeguimiento();
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

    if (document.getElementById("ig-grid")) {
      cargarJSON("ig.json").then(function (d) {
        pintarInstagram(d); datosTira.ig = d; pintarTira();
      }).catch(function () { /* la tarjeta de perfil sigue visible */ });
    }

    if (document.getElementById("x-grid")) {
      cargarJSON("x.json").then(function (d) {
        pintarX(d); datosTira.x = d; pintarTira();
      }).catch(function () { /* la sección queda sin tarjetas */ });
    }

    if (document.getElementById("tk-grid")) {
      cargarJSON("tiktok.json").then(function (d) {
        pintarTikTok(d); datosTira.tk = d; pintarTira();
      }).catch(function () { /* sin tarjetas de TikTok */ });
    }

    if (document.getElementById("yt-grid")) {
      cargarJSON("youtube.json").then(function (d) {
        pintarYouTube(d); datosTira.yt = d; pintarTira();
      }).catch(function () { /* sin video de YouTube */ });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
