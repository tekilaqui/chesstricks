import { showToast, playSnd, updateWelcomeStats } from './ui.js';
import { isAuth, userElo, userName } from './auth.js';
import { ensureGameLoaded, ensurePuzzlesLoaded } from './index.js';

let OPENINGS_DATA = [];

// Helper to detect mobile
function isMobileDevice() {
    return window.innerWidth <= 900; // Increased threshold to match CSS media queries often used
}

export function initWelcome() {
    console.log("📱 Initializing Mobile Welcome & Menus...");

    // Show on load if mobile
    if (isMobileDevice()) {
        $('#mobile-welcome-screen').addClass('active');
        if (typeof updateWelcomeStats === 'function') updateWelcomeStats();
        showWelcomeSubView('view-main');
    }

    // Resize handler
    $(window).on('resize', function () {
        if (isMobileDevice() && !sessionStorage.getItem('chess_welcome_seen')) {
            $('#mobile-welcome-screen').addClass('active');
        }
    });

    setupWelcomeListeners();
    setupBottomNav();
    setupMobileActions();
}

function showWelcomeSubView(viewId) {
    $('.welcome-view').removeClass('active');
    $('#' + viewId).addClass('active');
}

function hideMobileWelcome() {
    $('#mobile-welcome-screen').removeClass('active');
    sessionStorage.setItem('chess_welcome_seen', 'true');
}

// Openings data will be populated after game module lazy load

async function populateWelcomeOpenings() {
    const gm = await ensureGameLoaded();
    OPENINGS_DATA = gm.getOpenings();
    const list = $('#welcome-openings-list');
    list.empty();
    OPENINGS_DATA.forEach((group, gIdx) => {
        const groupTitle = $(`<div style="font-size:0.7rem; color:#94a3b8; margin:10px 0 5px 0; font-weight:bold;">${group.group}</div>`);
        list.append(groupTitle);
        group.items.forEach((op, iIdx) => {
            const item = $(`<div class="welcome-list-item" style="padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:8px; cursor:pointer; font-size:0.8rem;">${op.name}</div>`);
            item.click(function () {
                applyMode('study', 'openings');
                // Auto-select in sidebar
                setTimeout(() => {
                    const targetVal = `${gIdx}-${iIdx}`; // values in game.js logic might need checking
                    // Assuming game.js populates sidebar with indices or names
                    // For now, let's just try to set it if logic exists, otherwise just notifying user
                    $('#opening-sel').val(targetVal).trigger('change');
                }, 200);
            });
            list.append(item);
        });
    });
}

// Central Function to Switch Mode from Welcome Screen
async function applyMode(mode, subMode = null) {
    // 0. Ensure module is loaded
    const gm = await ensureGameLoaded();

    // 1. Hide Welcome
    hideMobileWelcome();

    // 2. Update Bottom Nav
    $('.nav-item').removeClass('active');
    if (mode === 'exercises') $('#nav-puzzles').addClass('active');
    else if (mode === 'study' && subMode === 'analysis') $('#nav-analysis').addClass('active');
    else if (mode === 'ai' || mode === 'local' || mode === 'friend') $('#nav-play').addClass('active');
    else $('#nav-home').addClass('active');

    // 3. Trigger Game Mode
    gm.setMode(mode, subMode); // This handles internal game state & logic

    // 4. Update UI visuals (Pills & Sections)
    $('.mode-pill').removeClass('active');
    $(`.mode-pill[data-mode="${mode}"]`).addClass('active');

    // Logic for toggling sidebars/sections handled in setMode or here?
    // Let's ensure sections are visible
    $('.mode-section').removeClass('active');
    if (mode === 'friend') $('#sec-local').addClass('active'); // Friend uses local UI
    else $('#sec-' + mode).addClass('active');

    // 5. Specific Actions based on subMode
    if (mode === 'study') {
        if (isMobileDevice()) $('#study-hud-mobile').css('display', 'flex');

        if (subMode === 'analysis') {
            showToast('Modo Análisis Activado', '🔍');
            $('#btn-ai-hint').click(); // Turn on hints
        } else if (subMode === 'editor') {
            $('#btn-editor').click(); // Toggle Editor
        } else if (subMode === 'pgn') {
            $('#btn-pgn').click(); // Open PGN modal if exists or focus area
        }
    } else {
        $('#study-hud-mobile').hide();
    }
}

function setupWelcomeListeners() {

    // MAIN MENU NAV
    $('#btn-show-play-view').click(() => showWelcomeSubView('view-play'));
    $('#btn-show-study-view').click(() => showWelcomeSubView('view-study'));
    $('#btn-show-puzzles-view').click(() => {
        showWelcomeSubView('view-puzzles-setup');
        // updateWelcomeStats();
    });

    // PLAY SUB-MENUS
    $('#btn-sub-ai').click(() => showWelcomeSubView('view-ai-setup'));
    $('#btn-sub-online').click(() => showWelcomeSubView('view-online-setup'));
    $('#btn-sub-friend').click(() => showWelcomeSubView('view-friend-setup'));

    // STUDY SUB-MENUS
    $('#btn-sub-analysis').click(() => showWelcomeSubView('view-analysis'));
    $('#btn-sub-openings').click(() => {
        showWelcomeSubView('view-openings');
        populateWelcomeOpenings();
    });
    $('#btn-sub-pgn').click(() => showWelcomeSubView('view-pgn'));
    $('#btn-sub-editor').click(() => showWelcomeSubView('view-editor'));

    // ACTIONS IN SUB-WIEWS

    // AI Start
    $('#btn-welcome-start-ai').click(function () {
        // Transfer settings to sidebar
        const diff = $('#welcome-diff-sel').val();
        const color = $('.welcome-color-btn.active').data('color') || 'random';

        $('#diff-sel').val(diff);
        $('#ai-color-sel').val(color);

        applyMode('ai');
        setTimeout(() => $('#btn-start-ai').click(), 300); // Auto-start
    });

    // Friend Start
    $('#btn-welcome-start-friend').click(function () {
        applyMode('friend');
    });

    // Online Create
    $('#btn-welcome-create-challenge').click(function () {
        applyMode('local'); // Online lobby uses local/online section
        setTimeout(() => $('#btn-create').click(), 300);
    });

    // Puzzles Start
    $('#btn-welcome-start-puzzles').click(async function () {
        const cat = $('#welcome-puz-cat-sel').val();
        $('#puz-cat-sel').val(cat);
        await ensurePuzzlesLoaded();
        applyMode('exercises');
    });

    // Analysis Start
    $('#btn-welcome-start-analysis').click(() => applyMode('study', 'analysis'));

    // Editor Start
    $('#btn-welcome-start-editor').click(() => applyMode('study', 'editor'));

    // PGN Load
    $('#btn-welcome-load-pgn').click(async function () {
        const pgn = $('#welcome-pgn-input').val();
        if (!pgn) return showToast("Introduce un PGN", "❌");

        await applyMode('study', 'pgn');
        const gm = await ensureGameLoaded();

        setTimeout(() => {
            try {
                if (gm.game.load_pgn(pgn)) {
                    gm.board.position(gm.game.fen());
                    gm.updateUI(true);
                    showToast("Partida cargada", "📂");
                } else {
                    showToast("PGN inválido", "❌");
                }
            } catch (e) { showToast("Error al cargar", "❌"); }
        }, 500);
    });

    // BACK BUTTONS
    $('.btn-back-welcome').click(function () {
        const target = $(this).data('target') || 'view-main';
        showWelcomeSubView(target);
    });

    // HAMBURGER
    $('#hamburger-menu-welcome').click((e) => {
        e.stopPropagation();
        $('#hamburger-menu').click(); // Trigger main drawer
    });

    // COLOR PICKER AI
    $('.welcome-color-btn').click(function () {
        $('.welcome-color-btn').removeClass('active');
        $(this).addClass('active');
    });
}

function setupBottomNav() {
    $('.nav-item').click(function () {
        const id = $(this).attr('id');

        // Visual Active State
        $('.nav-item').removeClass('active');
        $(this).addClass('active');

        $('#mobile-welcome-screen').addClass('active').fadeIn(200);

        if (id === 'nav-home') showWelcomeSubView('view-main');
        else if (id === 'nav-play') showWelcomeSubView('view-play');
        else if (id === 'nav-puzzles') showWelcomeSubView('view-puzzles-setup');
        else if (id === 'nav-analysis') showWelcomeSubView('view-analysis');
        else if (id === 'nav-ranking') {
            // Show ranking tab in sidebar (PC style but on mobile) or navigate to it
            // For now, let's open the sidebar and select ranking
            $('#mobile-welcome-screen').removeClass('active').fadeOut(); // Close welcome to show sidebar
            $('#hamburger-menu').click();
            setTimeout(() => $('.tab-btn[data-tab="tab-ranking"]').click(), 300);
        }
    });
}

function setupMobileActions() {
    // Actions Menu (The 3 dots on board)
    $('#btn-more-options').on('click', function (e) {
        e.stopPropagation();
        $('#mobile-actions-menu').fadeToggle(200);
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#mobile-actions-menu, #btn-more-options').length) {
            $('#mobile-actions-menu').fadeOut(200);
        }
    });

    $('#btn-flip-mobile').click(() => {
        board.flip();
        $('#mobile-actions-menu').fadeOut();
    });

    $('#btn-analyze-mobile').click(() => {
        $('#mobile-actions-menu').fadeOut();
        applyMode('study', 'analysis');
    });

    // ... add others as needed

    $('#btn-welcome-mobile').click(() => {
        $('#mobile-actions-menu').fadeOut();
        $('#mobile-welcome-screen').addClass('active');
    });

    // Drawer Navigation
    $('.btn-drawer-nav').click(function () {
        const target = $(this).data('target');
        // Close drawer (simulate overlay click)
        $('#side-drawer-overlay').click();

        if (target === 'home') {
            $('#mobile-welcome-screen').addClass('active').fadeIn();
            showWelcomeSubView('view-main');
        } else if (target === 'play') {
            applyMode('local'); // or show welcome play view? User probably wants the game area
            // If we want the welcome menu Play view:
            // $('#mobile-welcome-screen').addClass('active');
            // showWelcomeSubView('view-play');
            // But usually sidebar nav implies going to that section's main screen
            applyMode('local');
        } else if (target === 'study') {
            applyMode('study');
        } else if (target === 'puzzles') {
            applyMode('exercises');
        }
    });

    // Header Logo -> Home
    $('.logo-inline').click(() => {
        $('#mobile-welcome-screen').addClass('active').fadeIn();
        showWelcomeSubView('view-main');
    });
}
