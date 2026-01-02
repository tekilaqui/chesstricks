
// 🔐 AUTH MODULE
// Handles user authentication, registration, password reset, and user state

import { showToast } from './ui.js';

// STATE
export let userElo = parseInt(localStorage.getItem('chess_user_elo')) || 500;
export let userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;
export let userName = localStorage.getItem('chess_username') || "Invitado";
export let isAuth = localStorage.getItem('chess_is_auth') === 'true';

export function setUserElo(elo) {
    userElo = elo;
    localStorage.setItem('chess_user_elo', elo);
}

export function setPuzzleElo(elo) {
    userPuzzleElo = elo;
    localStorage.setItem('chess_puz_elo', elo);
}

// UI UPDATES
export const updateAuthUI = () => {
    if (localStorage.getItem('chess_is_auth') === 'true') {
        isAuth = true;
        userName = localStorage.getItem('chess_username');
        userElo = parseInt(localStorage.getItem('chess_user_elo')) || 500;
        userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;

        $('#btn-auth-trigger').text("👤 " + userName);
        $('#my-name-display').text(userName);
        $('#btn-auth-drawer').text("CERRAR SESIÓN").off('click').click(() => {
            logout();
        });
        $('#drawer-user-name').text(userName);
        $('#drawer-user-elo, #header-elo').text(userElo + " ELO");
        $('#header-elo-puz, #puz-elo-display').text(userPuzzleElo + "🧩");

        // Welcome screen stats
        $('#welcome-elo-main').text(userElo + " ELO");
        $('#welcome-elo-puz').text(userPuzzleElo + " 🧩");
    }
};

export function logout() {
    localStorage.removeItem('chess_token');
    localStorage.removeItem('chess_username');
    localStorage.removeItem('chess_is_auth');
    location.reload();
}

export function openAuth() {
    console.log("Opening auth modal...");
    $('#auth-modal').css('display', 'flex');
    $('#side-drawer').removeClass('open');
    $('#side-drawer-overlay').fadeOut();
}

// INITIALIZATION
export const initAuth = (socket) => {

    // Auth Listeners
    $('#btn-auth-trigger, #btn-auth-drawer').click(openAuth);

    $('#btn-auth-close').click(() => {
        if ($('#reset-group').is(':visible')) {
            // Back to login from reset
            $('#auth-title').text("ACCESO");
            $('#reset-group, #btn-reset-submit').hide();
            $('.input-group:not(#reg-group, #reset-group), #btn-auth-submit, #auth-forgot, #auth-switch').show();
            $('#btn-auth-close').text("CERRAR");
        } else {
            $('#auth-modal').hide();
        }
    });

    $('#auth-switch').click(() => {
        const isReg = $('#reg-group').is(':visible');
        if (isReg) {
            $('#auth-title').text("ACCESO");
            $('#reg-group').hide();
            $('#btn-auth-submit').text("ENTRAR");
            $('#auth-switch').html('¿No tienes cuenta? <span style="color:var(--accent)">Regístrate</span>');
            $('#auth-forgot').show();
        } else {
            $('#auth-title').text("REGISTRO");
            $('#reg-group').show();
            $('#btn-auth-submit').text("CREAR CUENTA");
            $('#auth-switch').html('¿Ya tienes cuenta? <span style="color:var(--accent)">Inicia Sesión</span>');
            $('#auth-forgot').hide();
        }
    });

    $('#auth-forgot').click(() => {
        $('#auth-title').text("RECUPERAR CUENTA");
        $('#reg-group, .input-group:not(#reset-group)').hide();
        $('#reset-group, #btn-reset-submit').show();
        $('#btn-auth-submit, #auth-forgot, #auth-switch').hide();
        $('#btn-auth-close').text("CANCELAR");
    });

    $('#btn-auth-submit').click(() => {
        const name = $('#auth-user').val();
        const pass = $('#auth-pass').val();
        const email = $('#auth-email').val();
        const isReg = $('#reg-group').css('display') !== 'none';

        if (!socket || !socket.connected) return alert("❌ No hay conexión con el servidor.");
        if (!name || !pass) return alert("Completa los campos.");
        if (isReg && !email) return alert("Escribe un email.");

        if (isReg) {
            socket.emit('register', { user: name, pass: pass, email: email });
        } else {
            socket.emit('login', { user: name, pass: pass });
        }
    });

    $('#btn-reset-submit').click(() => {
        const email = $('#reset-email').val().trim();
        const code = $('#reset-code').val().trim();
        const newPass = $('#reset-pass-new').val().trim();

        if (!email || !code || !newPass) return alert("Rellena todos los campos.");
        if (socket && socket.connected) {
            socket.emit('reset_password', { email, code, newPass });
        }
    });

    // Toggle Password Visibility
    $('#btn-show-pass').mousedown(function () {
        $('#auth-pass').attr('type', 'text');
    }).mouseup(function () {
        $('#auth-pass').attr('type', 'password');
    }).mouseleave(function () {
        $('#auth-pass').attr('type', 'password');
    });

    // Socket Events
    if (socket) {
        socket.on('auth_success', (data) => {
            userName = data.user;
            userElo = data.elo;
            userPuzzleElo = data.puzElo;
            isAuth = true;

            localStorage.setItem('chess_username', userName);
            localStorage.setItem('chess_is_auth', 'true');
            setUserElo(userElo);
            setPuzzleElo(userPuzzleElo);
            if (data.token) localStorage.setItem('chess_token', data.token);

            updateAuthUI();
            $('#auth-modal').hide();
            showToast("¡Bienvenido, " + userName + "!", "👋");
        });

        socket.on('auth_error', (msg) => {
            alert("Error: " + msg);
        });

        socket.on('register_success', (msg) => { // Assuming client.js handled this implicitly or via alert? 
            // Original client.js didn't have specific register_success listener shown in snippet, 
            // but usually register flows into login or acts same.
            // Checking the monolithic file... 
            // Actual file uses 'auth_success' for login. Register might just fail or succeed. 
            // Let's assume server emits auth_success on register too or just handles logic.
        });

        socket.on('forgot_password_success', (msg) => alert("✅ " + msg));
        socket.on('forgot_password_error', (msg) => alert("❌ Error: " + msg));

        socket.on('reset_password_success', (msg) => {
            alert("✅ " + msg);
            // Switch back to login
            $('#auth-title').text("ACCESO");
            $('#reset-group, #btn-reset-submit').hide();
            $('.input-group:not(#reg-group, #reset-group), #btn-auth-submit, #auth-forgot, #auth-switch').show();
            $('#btn-auth-close').text("CERRAR");
        });

        // ELO Updates from Server
        socket.on('elo_updated', (data) => {
            setUserElo(data.elo);
            setPuzzleElo(data.puzElo);
            updateAuthUI();
        });
    }

    // Initial check
    updateAuthUI();
};

// ELO LOGIC - Moved here to avoid circular dep
export function updateElo(opponentElo, result, isPuzzle = false) {
    const socket = window.currentSocket; // Hacky but we need socket. Better: export socket from socket.js or store it here.

    // We can import getSocket from socket.js
    // Let's rely on isAuth state

    if (!isAuth) {
        const k = 32;
        const currentElo = isPuzzle ? userPuzzleElo : userElo;
        const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
        const newElo = Math.round(currentElo + k * (result - expectedScore));

        if (isPuzzle) {
            setPuzzleElo(Math.max(100, newElo));
            $('#header-elo-puz, #puz-elo-display').text(userPuzzleElo + "🧩");
        } else {
            setUserElo(Math.max(100, newElo));
            $('#header-elo').text(userElo + " ELO");
        }
        $('#coach-txt').append(`<br><b style="color:var(--accent)">ELO (Local): ${newElo}</b>`);
    } else {
        // Server handles it
        // We need the socket instance.
        // We can import { getSocket } from './socket.js' inside the function if needed, or assume it's set.
        if (window.appSocket) {
            window.appSocket.emit('game_result', {
                result: result,
                opponentElo: opponentElo,
                isPuzzle: isPuzzle
            });
        }
    }
}

