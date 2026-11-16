# Juanpai Projects — Blog

Blog estático de **Juanpai Projects**: noticias verificadas de IA, finanzas y temas globales, e IA aplicada a negocios reales. HTML/CSS/JS planos, **sin paso de build**: Netlify sirve los archivos tal cual desde la raíz del repo.

- URL: https://juanpaiprojects.netlify.app (en vivo; Netlify despliega solo con cada push al repo)
- Instagram: https://www.instagram.com/juanpaiprojects/
- X: https://x.com/juanpaiprojects
- Todo el contenido está en español. Sin emojis en el sitio.

## Estructura

```
index.html                  Inicio: hero, banda de Última hora, post destacado, recientes,
                            secciones Instagram y X, suscripción por correo (Brevo)
archivo.html                Archivo de posts agrupado por mes (se pinta desde posts.json)
sobre-mi.html               Página "Sobre mí"
posts/
  plantilla-post.html       Plantilla para crear posts nuevos (NO se enlaza en el sitio)
  AAAA-MM-DD-slug.html      Un archivo por post publicado
posts.json                  Índice de posts (el sitio lo lee con JS)
ig.json                     Índice de publicaciones de Instagram para la sección "En Instagram"
x.json                      Índice de publicaciones de X para la sección "En X"
assets/
  css/estilos.css           Estilos (tema claro editorial, paleta del logo)
  js/main.js                Pinta última hora/destacado/recientes/archivo/Instagram/X,
                            progreso de lectura, compartir, aparición al scroll, botón "Copiar"
  img/logo.jpg              Logotipo de la marca (cabecera, pie, imagen social / Open Graph)
netlify.toml                Configuración de Netlify (publish ".", sin build)
sitemap.xml                 Mapa del sitio (actualizar con cada post)
robots.txt                  Permite todo y apunta al sitemap
favicon.svg                 Favicon (foco teal sobre crema, dibujado en SVG)
```

## Sistema de diseño

La identidad sale **del logotipo**, no de una plantilla: el diseño anterior (fondo oscuro, dorado, serif) quedó retirado por no corresponder a la marca.

**Paleta exacta del logo:**

| Color | Hex | Uso |
|---|---|---|
| Crema | `#EFE6D5` | Fondo principal de todo el sitio (es el fondo del logo; la cabecera se funde con él) |
| Tinta teal | `#00343F` | Texto principal, foco del logo y secciones invertidas (suscripción, CTA de post, pie) |
| Verde | `#1D6A4A` | Acento principal: botones sólidos, enlaces, rayos del foco, distintivo de tip |
| Coral | `#D73119` | Solo banda de Última hora, distintivo de noticia y detalles puntuales (números de sección, punta del foco) |

**Tipografía** (Google Fonts, únicas librerías externas del sitio):

- **Archivo** (600–900): titulares, con tracking ajustado y mayúsculas estilo póster donde pega, como el wordmark del logo.
- **Inter** (400–700): cuerpo y controles.

**La marca nunca va como texto tecleado.** En la cabecera va solo el logo como imagen: CSS recorta la zona del foco con rayos (x 170–885, y 45–620 de la imagen 1024×1024) como marca compacta, sin nada de texto al lado; el enlace lleva `aria-label` accesible. En el pie (fondo teal), el logo completo va dentro de una tarjeta crema redondeada, como badge intencional. El logo completo también es la imagen social (Open Graph) y la foto de "Sobre mí".

**Cabecera (auditoría visual, 15 nov 2026).** La navegación trae Inicio, Archivo, Sobre mí, **Newsletter** (ancla a la suscripción) y dos **botones circulares con los glifos SVG** de Instagram y X (`.nav-social`: borde teal, fondo crema, glifo teal; hover verde) — nada de pastillas con texto. En móvil (≤620px) todo cabe en **una sola fila**: el recorte del logo se reduce a 46×37 (misma zona, reescalada: imagen 65.9px, offsets −10.9/−2.9), los iconos a 28px y el enlace "Inicio" se oculta (el logo ya enlaza a la portada). Y una regla que no se toca: el reset global lleva `img { height: auto }` — sin ella, los `<img>` con atributos `width`/`height` (el logo trae 1024×1024) heredan la altura como pista de presentación y el logo del pie y de "Sobre mí" se estira verticalmente a 1024px. **Versionado anti-caché (15 nov 2026):** todas las páginas cargan `estilos.css?v=N` y `main.js?v=N`, y cada vez que cambie el CSS o el JS hay que subir N en las 5 páginas (inicio, archivo, sobre mí, plantilla y los posts). Sin esto, el navegador interno de Instagram, de donde llega casi todo el tráfico, se queda con la hoja vieja guardada en caché y muestra el sitio roto aunque el servidor ya sirva la corregida (pasó el mismo 15 nov: el logo se veía estirado desde el enlace de la bio aunque el arreglo ya estaba en vivo).

**Piezas de engagement** (sin build y sin servicios de pago):

- **Barra de progreso de lectura** fija arriba en cada post (gradiente teal → verde → coral, la mueve `main.js`).
- **Botones de compartir** en cada post: X, WhatsApp, Facebook, copiar enlace y botón nativo con Web Share API cuando el dispositivo lo soporta. `main.js` arma las URLs con la dirección y el título reales de la página.
- **Suscripción por correo con Brevo**: el blog también es un periódico por correo. El formulario (sección invertida teal "Suscríbete a nuestro newsletter" en el inicio, con `id="suscripcion"`, y en el CTA de cada post) es el formulario de Brevo, vestido con la identidad del blog mediante overrides en `estilos.css` sobre las clases `sib-*` (la hoja `sib-styles.css` de Brevo se carga antes que `estilos.css`; los paneles de éxito/error son los de Brevo y los muestra su `main.js`). Envía por POST al endpoint de sibforms y guarda los contactos en la lista **Blog — Suscriptores**, con dos atributos que elige el lector: `FRECUENCIA` (`1` = Diario, el post completo cada mañana; `2` = Semanal, el resumen de la semana los lunes) y `ULTIMAHORA` (`1` = quiere también las noticias de última hora verificadas). El radio **Diario va preseleccionado** (`checked` en el HTML). La navegación de la cabecera trae un enlace **Newsletter** que apunta a `#suscripcion` (desde las demás páginas, a `index.html#suscripcion`). **Netlify Forms ya no se usa**: el formulario `suscripcion` de Netlify quedó retirado del HTML.
- **Datos estructurados JSON-LD**: `WebSite` en el inicio y `BlogPosting` en cada post (viene en la plantilla).
- **Tiempo de lectura** visible en destacado, recientes, archivo y posts (campo `lectura` de `posts.json`).
- **Micro-animaciones** de aparición al hacer scroll (`IntersectionObserver`, clase `.revelar`), respetando `prefers-reduced-motion`; si no hay JS, el contenido se ve completo igual.
- Contraste AA: teal sobre crema como texto principal; botones verdes sólidos con texto crema.

### Los índices JSON

`posts.json` es un arreglo, **el post más reciente va primero**. Cada entrada:

```json
{
  "fecha": "2026-11-15",
  "titulo": "El jueves la IA sale a bolsa. Y tu contestador todavía suena a 1998",
  "resumen": "Resumen de 1-2 frases, el mismo de la meta description del post.",
  "url": "posts/2026-11-15-la-ia-sale-a-bolsa.html",
  "tema": "IA aplicada",
  "tipo": "noticia",
  "lectura": "2 min"
}
```

El campo `tipo` distingue los dos tipos de post:

- `"noticia"` — información verificada del día (IA, finanzas, temas globales). Se muestra con distintivo coral sólido y el post de noticia más reciente aparece además en la **banda de Última hora** del inicio. Si no hay ningún post tipo noticia, la banda no se muestra.
- `"tip"` — tip o análisis: herramienta, prompt e ideas de IA aplicada. Se muestra con distintivo de borde verde.

El campo `tema` es la etiqueta de tema: "IA aplicada", "Finanzas", "Global", etc.

El campo `lectura` es **opcional**: tiempo estimado como `"2 min"`. Se muestra como "2 min de lectura" en el destacado, en las listas y (vía el marcador `{{LECTURA}}`) en el post. Si falta, no se muestra nada.

`ig.json` alimenta la sección "En Instagram" del inicio. Cada entrada de `publicaciones`:

```json
{
  "titulo": "Título corto del carrusel",
  "resumen": "Una línea que invite a verlo.",
  "url": "https://www.instagram.com/p/XXXXXXXXXXX/",
  "fecha": "2026-11-15",
  "tipo": "Carrusel",
  "imagen": "https://www.instagram.com/.../foto.jpg"
}
```

(`tipo` puede ser "Carrusel", "Post" o "Historia destacada". Solo se muestran las 6 más recientes; la tarjeta de perfil se muestra siempre.)

El campo `imagen` es **opcional**: URL pública de la foto del post (la primera del carrusel). Si existe, la tarjeta la muestra arriba, sangrando a los bordes; si la imagen falla al cargar, se retira sola y la tarjeta queda de texto. Las entradas sin `imagen` se ven como siempre.

`x.json` alimenta la sección "En X" del inicio. Esquema:

```json
{
  "perfil": "https://x.com/juanpaiprojects",
  "usuario": "@juanpaiprojects",
  "entradas": [
    {
      "fecha": "2026-11-15",
      "texto": "El texto del post de X, tal cual se publicó.",
      "url": "https://x.com/juanpaiprojects/status/XXXXXXXXXXX"
    }
  ]
}
```

Cómo se alimenta: no hay conector de X, así que la versión de X de cada día se prepara en el pipeline diario de publicaciones y Juanpa la pega a mano. Cuando el post de X del día esté publicado, se agrega su entrada **hasta arriba** de `entradas` con la URL real del post; si todavía no se conoce la URL exacta, se usa la del perfil (`https://x.com/juanpaiprojects`). Solo se muestran las 6 más recientes; la tarjeta de "Seguir en X" se muestra siempre.

## Tono editorial

Claridad de parte de noticias, con voz propia. Cada post responde tres cosas, en orden:

1. **Qué pasó** — el dato, verificado.
2. **Por qué importa** — el contexto y la consecuencia práctica.
3. **Qué hacer** — la herramienta, el prompt o la acción concreta.

La voz es la directa de Juanpa: frases cortas, ejemplos reales, sin humo. No se copia el formato ni las frases de ningún otro creador; la claridad es el estándar, no la plantilla de nadie. Cuando un post es noticia, el dato se verifica contra fuentes serias antes de publicarse; cuando es opinión, se dice que es opinión dentro del texto.

## Publicar un post nuevo (flujo del job diario)

La pieza del día llega en versión newsletter (5 secciones: dato, herramienta, prompt, visual, cierre; el texto completo, no el caption de Instagram). Pasos exactos:

1. **Definir el tipo.** `noticia` si es información verificada del día (IA, finanzas, global); `tip` si es tip/análisis de IA aplicada.
2. **Crear el HTML del post.** Copiar `posts/plantilla-post.html` a `posts/AAAA-MM-DD-slug.html`, donde el slug es el título en minúsculas, sin acentos, con guiones (ej. `2026-11-16-mi-titulo.html`). Reemplazar todos los marcadores:
   - `{{TITULO}}`, `{{DESCRIPCION}}` (resumen de 1-2 frases), `{{FECHA_ISO}}` (AAAA-MM-DD), `{{FECHA_LARGA}}` (ej. "16 de noviembre de 2026"), `{{TEMA}}`, `{{LECTURA}}` (ej. "2 min de lectura"), `{{SLUG}}`. Los marcadores también alimentan el JSON-LD `BlogPosting` de la plantilla.
   - El distintivo de tipo en la meta del artículo: si es `noticia`, dejar la línea de la plantilla tal cual; si es `tip`, cambiar la clase a `tipo-tip` y el texto a "Tip y análisis" (la plantilla trae el comentario que lo indica).
   - Contenido: `{{DATO}}` (qué pasó + por qué importa), `{{HERRAMIENTA}}`, `{{PROMPT_INTRO}}`, `{{PROMPT}}`, `{{CIERRE}}`, `{{FRASE_CIERRE}}` (la pregunta o frase final que va en la cita grande).
   - La sección 4 de la pieza ("visual sugerido") es metadato de producción para Instagram: **no** va en el artículo del blog.
   - Si un párrafo es largo, se puede partir en dos `<p>` dentro de la misma sección.
   - La barra de progreso, los botones de compartir y el formulario de suscripción (Brevo) del CTA vienen en la plantilla y funcionan solos: no llevan marcadores ni hay que tocarlos.
3. **Actualizar `posts.json`.** Agregar la entrada nueva **hasta arriba** del arreglo (el primero es el destacado del inicio), con su campo `tipo` y su `lectura` (ej. `"2 min"`). La `url` es la ruta relativa: `posts/AAAA-MM-DD-slug.html`.
4. **Actualizar `sitemap.xml`.** Agregar un `<url>` con la URL absoluta del post (`https://juanpaiprojects.netlify.app/posts/AAAA-MM-DD-slug.html`) y `lastmod` con la fecha del post. Actualizar también el `lastmod` de la portada y del archivo.
5. **Registrar el Instagram del día en `ig.json`.** Cuando el carrusel del día esté publicado en @juanpaiprojects, agregar su entrada **hasta arriba** de `publicaciones` con la URL real del post de Instagram y, si se tiene a la mano, la URL pública de la primera foto en el campo `imagen`.
6. **Registrar el X del día en `x.json`.** Cuando el post de X esté publicado, agregar su entrada **hasta arriba** de `entradas` con el texto tal cual y su URL (la del post; si no se conoce, la del perfil).
7. **Guardar los cambios en el repo** (commit y push). Netlify despliega solo con cada push; no hay build que esperar.

Verificación rápida antes de dar por publicado: abrir el HTML nuevo y confirmar que no quedó ningún `{{...}}` sin reemplazar, y validar que `posts.json`, `ig.json` y `x.json` sigan siendo JSON válido.

## Despliegue

El sitio ya está desplegado: repo en GitHub conectado a Netlify, publish directory `.` y sin comando de build (ver `netlify.toml`). Cada push despliega solo. La suscripción por correo la opera Brevo (ver "Piezas de engagement"); Netlify solo sirve el sitio y ya no captura correos.

**(Futuro) Dominio propio**: cuando exista un dominio (ej. juanpaiprojects.com), conectarlo en Netlify y buscar y reemplazar `https://juanpaiprojects.netlify.app` por el dominio final en todo el repo (canonical, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`).

## Notas técnicas

- **Icono de pantalla de inicio (apple-touch-icon, 16 nov 2026)**: el sitio trae `assets/img/apple-touch-icon.png` (180×180), enlazado en el `<head>` de las 5 páginas y de la plantilla, junto al favicon. Es el logo completo (el foco con el nombre «JUANPAI PROJECTS»), elegido por Juanpa el 16 nov 2026 entre dos variantes — la otra era solo el foco, más grande — y reemplaza a la composición inicial de solo el foco; sin él, Safari pone una letra genérica al guardar el blog en la pantalla de inicio del iPhone. También quedó `assets/img/icon-512.png` (512×512) en el repo, sin enlazar, para uso futuro. Ojo con iOS: el icono se cachea en el momento de crear el acceso directo, así que si el acceso ya existía con la letra genérica, hay que borrarlo y volver a agregar el blog a pantalla de inicio para ver el icono nuevo.
- Analítica de visitas: Cloudflare Web Analytics (gratis; la cuenta la creó Juanpa el 15 nov 2026 porque el registro de Cloudflare bloquea navegadores automatizados). El beacon va justo antes de `</body>` en TODAS las páginas HTML y en `posts/plantilla-post.html`, para que cada post nuevo nazca medido. No quitarlo al editar páginas. El token del snippet es público por diseño (va en el HTML visible).
- El sitio funciona sin JavaScript para leer un post (cada post es HTML completo); el JS pinta las listas desde los JSON, la barra de progreso, los botones de compartir y las animaciones de aparición.
- Las animaciones de aparición solo ocultan contenido si hay JS activo (clase `con-js` en `<html>`, puesta por un script mínimo en el `<head>`); con `prefers-reduced-motion` todo aparece sin movimiento.
- La marca de cabecera es un recorte CSS del logo: si algún día se regenera `assets/img/logo.jpg` con otra composición, hay que re-medir la zona del foco y ajustar `.marca-logo img` en `estilos.css`.

## Estrategia de 3 canales

Instagram, X y este blog se mandan tráfico entre sí de forma natural, nunca forzado (regla de Juanpa, 15 nov 2026). El blog enlaza a Instagram y a X (https://x.com/juanpaiprojects) en la navegación, el pie y el cierre de cada post, y muestra las publicaciones recientes de ambas redes en el inicio. La versión de X de cada pieza se prepara en el pipeline diario de publicaciones y queda lista para copiar y pegar (no hay conector de X). El caption de Instagram invita al blog o a X solo cuando viene al caso, alternando, nunca en todos los posts.
