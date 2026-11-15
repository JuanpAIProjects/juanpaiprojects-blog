/* ============================================================
   JUANPAI PROJECTS — Blog
   Lee posts.json, ig.json y x.json y pinta: banda de última hora,
   destacado, recientes, archivo por mes, tarjetas de Instagram
   y tarjetas de X. Además: barra de progreso de lectura,
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

  // Banda de última hora: el post tipo "noticia" más reciente.
  function pintarUltimaHora(posts) {
    var banda = document.getElementById("ultima-hora");
    if (!banda) return;
    var noticia = null;
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].tipo === "noticia") { noticia = posts[i]; break; }
    }
    if (!noticia) { banda.hidden = true; return; }
    banda.href = base() + noticia.url;
    document.getElementById("uh-titulo").textContent = noticia.titulo;
    document.getElementById("uh-fecha").textContent = fechaCorta(noticia.fecha);
    banda.hidden = false;
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
      return (
        '<a class="x-tarjeta" href="' + esc(entrada.url) + '" target="_blank" rel="noopener">' +
          '<span class="tema-chip">En X</span>' +
          '<span class="x-texto">' + esc(entrada.texto) + "</span>" +
          '<span class="ig-meta">' + esc(fechaCorta(entrada.fecha)) + " · Ver en X →</span>" +
        "</a>"
      );
    }).join("");
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
    if (hayInicio || hayArchivo) {
      cargarJSON("posts.json").then(function (posts) {
        posts = Array.isArray(posts) ? posts : [];
        if (hayInicio) { pintarUltimaHora(posts); pintarDestacado(posts[0]); pintarRecientes(posts); }
        if (hayArchivo) pintarArchivo(posts);
      }).catch(function () { /* si falla, las secciones quedan con su texto base */ });
    }

    if (document.getElementById("ig-grid")) {
      cargarJSON("ig.json").then(pintarInstagram).catch(function () { /* la tarjeta de perfil sigue visible */ });
    }

    if (document.getElementById("x-grid")) {
      cargarJSON("x.json").then(pintarX).catch(function () { /* la sección queda sin tarjetas */ });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
