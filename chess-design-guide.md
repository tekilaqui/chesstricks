# Chess Drez - Nuevo Diseño

## 📋 Estructura del Proyecto

### Archivos Principales
```
src/
├── components/
│   ├── Navbar.jsx          # Barra superior con logo, nav, perfil
│   ├── Sidebar.jsx         # Navegación lateral compacta
│   ├── ChessBoard.jsx      # Tablero interactivo
│   ├── AnalysisPanel.jsx   # Panel de análisis (básico + avanzado)
│   ├── LandingPage.jsx     # Portada atractiva
│   └── GameShare.jsx       # Compartir partidas por enlace
├── pages/
│   ├── Home.jsx            # Portada
│   ├── Play.jsx            # Jugar contra IA
│   ├── Learn.jsx           # Aprender/teoría
│   ├── Tactics.jsx         # Problemas tácticos
│   ├── Analysis.jsx        # Análisis de partidas
│   └── SharedGame.jsx      # Ver partida por enlace
└── styles/
    └── design-system.css   # Variables de color, tipografía

```

## 🎨 Sistema de Colores

```css
/* Colores Principales */
--primary: #2196F3        /* Azul */
--primary-dark: #1976D2   /* Azul oscuro */
--accent: #00BCD4         /* Teal/Cian */
--success: #4CAF50        /* Verde */
--warning: #FF9800        /* Naranja */
--danger: #F44336         /* Rojo */

/* Neutrales (Dark Mode) */
--bg-primary: #0f0f0f     /* Negro profundo */
--bg-secondary: #1a1a1a   /* Gris muy oscuro */
--bg-tertiary: #2a2a2a    /* Gris oscuro */
--text-primary: #ffffff   /* Blanco */
--text-secondary: #b0b0b0 /* Gris claro */
--border: #3a3a3a         /* Borde oscuro */
```

## 📐 Layout Principal

### Navbar (Top)
- **Alto:** 64px
- **Contenido:** Logo | Nav Center | Perfil + Stats (derecha)
- **Sticky:** Sí

### Sidebar (Left)
- **Ancho:** 220px (desktop), colapsable en mobile
- **Contenido:** 6-7 opciones principales con iconos
- **Estilo:** Cards independientes, hover effect, active state

### Main Content (Center)
- **Ancho:** Flexible (principal)
- **Contenido:** Tablero + Controles

### Analysis Panel (Right)
- **Ancho:** 350px (desktop), full-width en tablet
- **Contenido:** Evaluación + Variantes + Estadísticas

---

## 🎯 Componentes Principales

### 1. **Portada (Landing Page)**
Elementos:
- Hero section con tablero grande
- "Juega Ahora" CTA prominente
- Estadísticas rápidas del usuario (si logueado)
- Características principales listadas
- Botón "Entrar" vs "Registrarse"

### 2. **Panel de Análisis (Analysis Panel)**
Secciones:
- **Evaluación Visual**: Barra con ventaja blanco/negro
- **Mejores Movimientos**: Top 3 con líneas y evaluación
- **Variantes Principales**: Árbol de variantes expandible
- **Información de Apertura**: Nombre de la apertura, estadísticas
- **Estadísticas de Posición**: Material, estructura, etc.

### 3. **Partidas Compartidas**
- URL: `/game/:gameId`
- Tablero con historia de movimientos
- Botón "Jugar de nuevo" o "Analizar"
- Opción de compartir en redes

---

## ✨ Mejoras Visuales vs Actual

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Portada** | Básica | Atractiva, moderna |
| **Análisis** | Oculto/No visible | Panel prominente, visual |
| **Sidebar** | Ancho | Compacto, eficiente |
| **Tablero** | Pequeño | Grande, protagonista |
| **Información** | Dispersa | Organizada, jerárquica |
| **Mobile** | Complejo | Responsive, limpio |

---

## 🔧 Pasos de Implementación

1. **Crear Navbar** con estilos nuevos
2. **Rediseñar Sidebar** (más compacto)
3. **Ampliar Tablero** y reorganizar contenido
4. **Crear Panel de Análisis** con componentes:
   - Evaluación (gráfico)
   - Mejores movimientos
   - Variantes
5. **Portada Nueva** con landing elegante
6. **Integrar WebSocket** para partidas compartidas
7. **Mobile Responsivo** (collapse sidebar, stack vertical)

---

## 📱 Responsive Design

### Desktop (1200px+)
- Sidebar 220px | Tablero | Analysis 350px
- Navbar horizontal completo

### Tablet (768px-1199px)
- Sidebar colapsable
- Analysis en segundo plano o tab
- Layout 2 columnas

### Mobile (< 768px)
- Sidebar drawer lateral
- Tablero full-width
- Analysis deslizable o tabs
- Navbar simplificado
