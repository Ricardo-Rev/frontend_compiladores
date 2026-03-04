# Frontend Architecture – React + TypeScript

## 🧠 Filosofía de esta arquitectura

Esta arquitectura está diseñada bajo un enfoque **Feature-Based + Separación por Capas**, lo que permite:

* Escalabilidad a largo plazo
* Mantenimiento sencillo
* Trabajo en equipo sin conflictos
* Separación clara de responsabilidades
* Preparación para crecimiento empresarial

La estructura se divide en tres bloques principales: `app`, `features` y `shared`.

---

# 🔹 app/

Contiene la **infraestructura global del frontend**.

Aquí vive todo lo que afecta a la aplicación completa.

## Incluye:

* **Router global**
* **Providers** (Context, Redux, React Query, etc.)
* **Layout principal**
* Configuración base de la aplicación

### Responsabilidad

Inicializar la aplicación y conectar todas las piezas globales.

Ejemplo de contenido:

```
src/app/
 ├── router/
 ├── providers/
 └── App.tsx
```

---

# 🔹 features/

Cada dominio del sistema es independiente.

Ejemplo:

```
features/rover
```

Este módulo contiene **TODO lo relacionado al rover**, incluyendo:

* Componentes
* Llamadas API
* Tipos
* Hooks
* Páginas

Ejemplo de estructura:

```
features/rover/
 ├── components/
 ├── pages/
 ├── services/
 ├── hooks/
 └── types/
```

### Esto permite:

* Escalar sin mezclar responsabilidades
* Borrar un feature sin romper todo
* Trabajar en equipo sin conflictos
* Aislar lógica de negocio por dominio

Cada feature es prácticamente un módulo independiente.

---

# 🔹 shared/

Contiene elementos reutilizables en toda la aplicación.

Nunca debe contener lógica de negocio específica.

## Incluye:

* Botones
* Inputs
* Modal
* Helpers
* Tipos globales
* Cliente HTTP base
* Hooks genéricos

Ejemplo:

```
shared/
 ├── components/
 ├── hooks/
 ├── services/
 ├── utils/
 └── types/
```

### Regla importante

`shared` no debe depender de ningún feature.
Los features pueden depender de `shared`, pero no al revés.

---

# 📦 Estructura General del Proyecto

```
src/
 ├── app/
 ├── features/
 ├── shared/
 ├── config/
 ├── assets/
 └── main.tsx
```

---

# 🚀 Instalación del Proyecto

## 1️⃣ Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd frontend
```

---

## 2️⃣ Instalar dependencias

```bash
npm install
```

---

# ▶️ Ejecutar el Proyecto en VSCode

## Paso 1: Abrir el proyecto

En VSCode:

* File
* Open Folder
* Seleccionar la carpeta `frontend`

---

## Paso 2: Abrir la terminal integrada

En VSCode:

```
Ctrl + ñ
```

O:

```
Terminal → New Terminal
```

---

## Paso 3: Ejecutar el proyecto

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo (Vite).

Verás algo como:

```
Local: http://localhost:5173/
```

Abre esa URL en tu navegador.

---

# 🏗 Compilar para Producción

Para generar la versión optimizada:

```bash
npm run build
```

Esto generará una carpeta:

```
dist/
```

Ese contenido es el que se usa para despliegue en producción.

---

# 🔍 Vista previa del build

Para probar el build localmente:

```bash
npm run preview
```

---

# ⚙ Variables de Entorno

Archivo:

```
.env
```

Ejemplo:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Regla importante:

Todas las variables deben comenzar con:

```
VITE_
```

---

# 📌 Buenas Prácticas

* No trabajar directamente en `main`
* Crear ramas tipo:

  * `feature/nombre-funcionalidad`
  * `fix/descripcion-bug`
* Mantener cada feature autocontenida
* No mezclar lógica de negocio en `shared`
* Usar tipado fuerte en TypeScript

---

# 🎯 Objetivo de la Arquitectura

Construir un frontend:

* Escalable
* Profesional
* Fácil de mantener
* Preparado para crecimiento empresarial
* Compatible con backend desacoplado (.NET API)

---

Proyecto listo para desarrollo profesional 🚀
