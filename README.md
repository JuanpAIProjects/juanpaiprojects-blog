# Juanpai Projects — Blog

Blog estático de **Juanpai Projects**: noticias verificadas de IA, finanzas y temas globales, e IA aplicada a negocios reales. HTML/CSS/JS planos, **sin paso de build**: Netlify sirve los archivos tal cual desde la raíz del repo.

- URL provisional: https://juanpaiprojects.netlify.app
- Instagram: https://www.instagram.com/juanpaiprojects/
- Todo el contenido está en español. Sin emojis en el sitio.

## Estructura

```
index.html                  Inicio: hero, banda de Última hora, post destacado, recientes, sección Instagram
archivo.html                Archivo de posts agrupado por mes (se pinta desde posts.json)
sobre-mi.html               Página "Sobre mí"
posts/
  plantilla-post.html       Plantilla para crear posts nuevos (NO se enlaza en el sitio)
  AAAA-MM-DD-slug.html      Un archivo por post publicado
posts.json                  Índice de posts (el sitio lo lee con JS)
ig.json                     Índice de publicaciones de Instagram para la sección "En Instagram"
assets/
  css/estilos.css           Estilos (editorial oscuro, acento dorado)
  js/main.js                Pinta última hora/destacado/recientes/archivo/Instagram y el botón "Copiar"
  img/logo.jpg              Logotipo de la marca (imagen social / Open Graph)
netlify.toml                Configuración de Netlify (publish ".", sin build)
sitemap.xml                 Mapa del sitio (actualizar con cada post)
robots.txt                  Permite todo y apunta al sitemap
favicon.svg                 Favicon (J dorada sobre fondo oscuro)
```

### Los índices JSON

`posts.json` es un arreglo, **el post más reciente va primero**. Cada entrada:

```json
{
  "fecha": "2026-11-15",
  "titulo": "El jueves la IA sale a bolsa. Y tu contestador todavía suena a 1998",
  "resumen": "Resumen de 1-2 frases, el mismo de la meta description del post.",
  "url": "posts/2026-11-15-la-ia-sale-a-bolsa.html",
  "tema": "IA aplicada",
  "tipo": "noticia"
}
```

El campo `tipo` distingue los dos tipos de post:

- `"noticia"` — información verificada del día (IA, finanzas, temas globales). Se muestra con distintivo dorado sólido y el post de noticia más reciente aparece además en la **banda de Última hora** del inicio. Si no hay ningún post tipo noticia, la banda no se muestra.
- `"tip"` — tip o análisis: herramienta, prompt e ideas de IA aplicada. Se muestra con distintivo de borde.

El campo `tema` es la etiqueta de tema: "IA aplicada", "Finanzas", "Global", etc.

`ig.json` alimenta la sección "En Instagram" del inicio. Cada entrada de `publicaciones`:

```json
{
  "titulo": "Título corto del carrusel",
  "resumen": "Una línea que invite a verlo.",
  "url": "https://www.instagram.com/p/XXXXXXXXXXX/",
  "fecha": "2026-11-15",
  "tipo": "Carrusel"
}
```

(`tipo` puede ser "Carrusel", "Post" o "Historia destacada". Solo se muestran las 6 más recientes; la tarjeta de perfil se muestra siempre.)

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
   - `{{TITULO}}`, `{{DESCRIPCION}}` (resumen de 1-2 frases), `{{FECHA_ISO}}` (AAAA-MM-DD), `{{FECHA_LARGA}}` (ej. "16 de noviembre de 2026"), `{{TEMA}}`, `{{LECTURA}}` (ej. "2 min de lectura"), `{{SLUG}}`.
   - El distintivo de tipo en la meta del artículo: si es `noticia`, dejar la línea de la plantilla tal cual; si es `tip`, cambiar la clase a `tipo-tip` y el texto a "Tip y análisis" (la plantilla trae el comentario que lo indica).
   - Contenido: `{{DATO}}` (qué pasó + por qué importa), `{{HERRAMIENTA}}`, `{{PROMPT_INTRO}}`, `{{PROMPT}}`, `{{CIERRE}}`, `{{FRASE_CIERRE}}` (la pregunta o frase final que va en la cita grande).
   - La sección 4 de la pieza ("visual sugerido") es metadato de producción para Instagram: **no** va en el artículo del blog.
   - Si un párrafo es largo, se puede partir en dos `<p>` dentro de la misma sección.
3. **Actualizar `posts.json`.** Agregar la entrada nueva **hasta arriba** del arreglo (el primero es el destacado del inicio), con su campo `tipo`. La `url` es la ruta relativa: `posts/AAAA-MM-DD-slug.html`.
4. **Actualizar `sitemap.xml`.** Agregar un `<url>` con la URL absoluta del post (`https://juanpaiprojects.netlify.app/posts/AAAA-MM-DD-slug.html`) y `lastmod` con la fecha del post. Actualizar también el `lastmod` de la portada y del archivo.
5. **Registrar el Instagram del día en `ig.json`.** Cuando el carrusel del día esté publicado en @juanpaiprojects, agregar su entrada **hasta arriba** de `publicaciones` con la URL real del post de Instagram.
6. **Guardar los cambios en el repo** (commit y push). Netlify despliega solo con cada push; no hay build que esperar.

Verificación rápida antes de dar por publicado: abrir el HTML nuevo y confirmar que no quedó ningún `{{...}}` sin reemplazar, y validar que `posts.json` e `ig.json` sigan siendo JSON válido.

## Qué falta para desplegar (una sola vez)

El sitio está listo; falta conectarlo. Pasos, en orden:

1. **Crear el repo en GitHub** (cuenta JuanpAIProjects): repo nuevo, ej. `juanpaiprojects-blog`, y subir el contenido de esta carpeta como raíz del repo.
2. **Conectar Netlify**: en Netlify, "Add new site" → "Import an existing project" → elegir el repo. Configuración: build command **vacío** y publish directory **`.`** (ya viene en `netlify.toml`, Netlify lo lee solo).
3. **Nombre del sitio**: en la configuración del sitio en Netlify, fijar el nombre `juanpaiprojects` para que la URL quede https://juanpaiprojects.netlify.app. Si ese nombre estuviera ocupado, elegir variante y actualizar la base en el paso 4.
4. **Base provisional**: todas las URLs absolutas (canonical, Open Graph, `sitemap.xml`, `robots.txt`) ya apuntan a `https://juanpaiprojects.netlify.app`. Si el subdominio final fuera otro, buscar y reemplazar esa cadena en todo el repo.
5. **(Futuro) Dominio propio**: cuando exista un dominio (ej. juanpaiprojects.com), conectarlo en Netlify y repetir el reemplazo de base del paso 4 por el dominio final.

## Notas de diseño

- Identidad: editorial oscuro con acento dorado, tipografía Fraunces (titulares) + Inter (texto), cargadas de Google Fonts. Sin librerías ni frameworks.
- La marca en la cabecera es tipográfica a propósito: el logotipo (foco sobre fondo crema) se usa como imagen social (Open Graph) y en "Sobre mí", donde sí luce sobre su tarjeta.
- La banda de Última hora usa un distintivo rojo oscuro con punto pulsante: es el código visual universal de "noticia en curso" y se reserva solo para eso; todo lo demás vive en la paleta oscuro/dorado.
- El sitio funciona sin JavaScript para leer un post (cada post es HTML completo); el JS solo pinta las listas desde los JSON y el botón de copiar el prompt.

## Estrategia de 3 canales

Instagram, X y este blog se mandan tráfico entre sí de forma natural, nunca forzado (regla de Juanpa, 15 nov 2026). El blog enlaza a Instagram y a X (https://x.com/juanpaiprojects) en la navegación, el pie y el cierre de cada post. La versión de X de cada pieza se prepara en el pipeline diario de publicaciones y queda lista para copiar y pegar (no hay conector de X). El caption de Instagram invita al blog o a X solo cuando viene al caso, alternando, nunca en todos los posts.
