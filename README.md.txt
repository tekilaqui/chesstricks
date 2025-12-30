# ♟️ Chess Pro Online - Versión 2.0

Aplicación de ajedrez en tiempo real con sistema ELO, multijugador y análisis IA.

## 🆕 Novedades Versión 2.0 (Mejoras de Seguridad)

- ✅ **Autenticación JWT** con tokens de 7 días
- ✅ **Hash PBKDF2** con 100,000 iteraciones para contraseñas
- ✅ **Rate limiting** contra ataques de fuerza bruta
- ✅ **Validación estricta** de inputs (usuario, contraseña, email)
- ✅ **Helmet.js** para headers de seguridad HTTP
- ✅ **Sanitización** de mensajes de chat
- ✅ **Sistema de estadísticas** (victorias/derrotas/empates)
- ✅ **ELO inicial estándar** (1200 en lugar de 500)
- ✅ **Health check endpoint** para monitoreo

## 📋 Requisitos

- Node.js 16+ 
- npm o yarn

## 🚀 Instalación

### 1. Instalar dependencias

