
// 🚀 INDEX MODULE
// Main entry point that orchestrates all modules

// 📊 Initialize Sentry monitoring (must be first)
import './sentry.js';

import { initSocket } from './socket.js';
import { initAuth, isAuth } from './auth.js';
import { setLanguage, currentLang } from './ui.js';
import { initWelcome } from './welcome.js';

let gameModule = null;
let puzzlesModule = null;
let modulesLoaded = false;

// 🎨 Styles (Webpack will extract these)
import '../styles/variables.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/controls.css';
import '../styles/responsive.css';
import '../../../mobile-welcome.css'; // Adjust path relative to modules/index.js (src/client/modules) -> ../../../

$(document).ready(() => {
    const socket = initSocket({});
    window.appSocket = socket;
    window.currentSocket = socket;

    initAuth(socket);
    initWelcome();
    setLanguage(currentLang, isAuth);

    // 🖥️ PC: Cargar juego inmediatamente
    if (window.innerWidth > 900) {
        ensureGameLoaded().then(() => {
            console.log("🖥️ PC: Juego inicializado automáticamente.");
        });
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.error('SW Error', err));
    }
});

// ⚡ TAREA 16: Lazy Loading Orchestrator
export async function ensureGameLoaded() {
    if (gameModule) return gameModule;
    console.log("📦 Lazy Loading: Game Module...");
    gameModule = await import('./game.js');
    gameModule.initGame();
    return gameModule;
}

export async function ensurePuzzlesLoaded() {
    if (puzzlesModule) return puzzlesModule;
    const gm = await ensureGameLoaded();
    console.log("📦 Lazy Loading: Puzzles Module...");
    puzzlesModule = await import('./puzzles.js');
    puzzlesModule.initPuzzles({
        game: gm.game,
        getBoard: () => gm.board,
        updateUI: gm.updateUI
    });
    return puzzlesModule;
}

export { gameModule, puzzlesModule };
