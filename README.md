# BigQuery Release Notes Hub & Tweeter Dashboard

Este proyecto es un panel interactivo diseñado para consumir, filtrar y compartir las notas de lanzamiento de Google Cloud BigQuery en Twitter/X. El sistema extrae el feed XML oficial de BigQuery, segmenta los anuncios diarios en tarjetas individuales según su categoría (Features, Issues, Changes, Announcements, etc.) y permite componer y twittear cada actualización con un solo clic.

Para ofrecer máxima compatibilidad, el proyecto cuenta con dos implementaciones backend listas para usar: **Node.js (Express)** y **Python (Flask)**. Ambas consumen la misma interfaz frontend.

---

## Requisitos Previos

Dependiendo del entorno que prefieras usar, asegúrate de tener instalado:
* **Node.js** (versión 18 o superior) o
* **Python** (versión 3.8 o superior) junto con `pip`.

---

## Cómo Ejecutar la Aplicación

Elige una de las siguientes dos opciones para correr el servidor localmente:

### Opción A: Usando Node.js (Express) - Recomendado

1. **Instalar dependencias:**
   Abre una terminal en la raíz del proyecto y ejecuta:
   ```bash
   npm install
   ```

2. **Iniciar el servidor:**
   Ejecuta el script de inicio:
   ```bash
   npm start
   ```

3. **Acceder a la aplicación:**
   Abre tu navegador e ingresa a:
   [http://localhost:5000](http://localhost:5000)

---

### Opción B: Usando Python (Flask)

1. **Instalar dependencias:**
   Abre una terminal en la raíz del proyecto e instala los paquetes requeridos usando `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

2. **Iniciar el servidor:**
   Ejecuta el backend de Flask:
   ```bash
   python app.py
   ```

3. **Acceder a la aplicación:**
   Abre tu navegador e ingresa a:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## Características Principales

* **Segmentación Granular:** Los posts de BigQuery que contienen múltiples anuncios se dividen de manera automática en tarjetas independientes para que puedas seleccionar y compartir exactamente lo que te interesa.
* **Filtros Interactivos:** Botones integrados para aislar rápidamente actualizaciones de tipo `Feature`, `Issue`, `Change`, `Breaking`, o `Announcement`.
* **Compositor de Tweets:** Una sección lateral interactiva que formatea de forma inteligente la actualización agregando enlaces directos a la documentación oficial y hashtags automáticos (`#BigQuery #GoogleCloud`), controlando que no se superen los 280 caracteres.
* **Interfaz de Alta Fidelidad:** Diseño oscuro con efecto de vidrio esmerilado (glassmorphism), bordes coloridos basados en la categoría, efectos hover interactivos y spinners dinámicos de refresco.
