// AJUSTES PARA MODO TEORÍA Y ESTUDIO
// Este archivo añade funcionalidad adicional sin modificar el client.js principal

(function () {
    'use strict';

    console.log('📚 Study Mode Enhancements cargado');

    // Esperar a que el DOM esté listo
    $(document).ready(function () {

        // DETECTAR SI ES MÓVIL
        const isMobile = window.innerWidth < 768;

        // 1. SELECTOR DE COLOR EN MODO TEORÍA (Eliminado a petición del usuario)
        function addStudyColorSelector() {
            console.log('Selector de color omitido por petición.');
        }

        // 2. MODAL PARA MÓVIL - Selector de Apertura en Primer Plano
        function createMobileOpeningModal() {
            if (isMobile && $('#mobile-opening-modal').length === 0) {
                const modalHTML = `
                    <div id="mobile-opening-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; overflow-y:auto; padding:20px;">
                        <div style="max-width:500px; margin:0 auto;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                <h2 style="color:#38bdf8; font-size:1.2rem; margin:0;">📖 Selecciona Apertura</h2>
                                <button id="close-opening-modal" style="background:none; border:none; color:#ef4444; font-size:1.5rem; cursor:pointer;">✕</button>
                            </div>
                            
                            <div id="modal-opening-selector" style="margin-bottom:20px;">
                                <!-- El selector se clonará aquí -->
                            </div>
                            
                            <div id="modal-color-selector" style="margin-bottom:20px;">
                                <!-- El selector de color se clonará aquí -->
                            </div>
                            
                            <button id="confirm-opening-selection" class="btn-primary" style="width:100%; padding:15px; font-size:1rem; background:#38bdf8; border:none; border-radius:8px; color:#fff; font-weight:700; cursor:pointer;">
                                ✅ CONFIRMAR Y VER TABLERO
                            </button>
                        </div>
                    </div>
                `;

                $('body').append(modalHTML);

                // Cerrar modal
                $('#close-opening-modal, #confirm-opening-selection').on('click', function () {
                    $('#mobile-opening-modal').fadeOut(300);
                });

                console.log('📱 Modal móvil creado');
            }
        }

        // Mostrar modal en móvil cuando se selecciona modo teoría
        function showMobileOpeningModal() {
            if (isMobile) {
                // Clonar selectores al modal
                const $openingSel = $('#opening-sel').clone().attr('id', 'modal-opening-sel');
                const $colorSel = $('#study-color-sel').clone().attr('id', 'modal-color-sel');

                $('#modal-opening-selector').html($openingSel);
                $('#modal-color-selector').html(`
                    <label class="label-tiny" style="color:#38bdf8; display:block; margin-bottom:8px; font-weight:700;">🎨 COLOR</label>
                `).append($colorSel);

                // Sincronizar cambios
                $('#modal-opening-sel').on('change', function () {
                    $('#opening-sel').val($(this).val()).trigger('change');
                });

                $('#modal-color-sel').on('change', function () {
                    $('#study-color-sel').val($(this).val()).trigger('change');
                });

                $('#mobile-opening-modal').fadeIn(300);
                console.log('📱 Modal móvil mostrado');
            }
        }

        // Intentar añadir el selector después de un delay (para asegurar que el DOM está listo)
        setTimeout(addStudyColorSelector, 1000);

        // Crear modal si es móvil
        if (isMobile) {
            setTimeout(createMobileOpeningModal, 1000);
        }

        // También añadirlo cuando se cambie al modo study
        const originalSetMode = window.setMode;
        if (typeof originalSetMode === 'function') {
            window.setMode = function (mode) {
                originalSetMode.apply(this, arguments);

                if (mode === 'study') {
                    setTimeout(addStudyColorSelector, 500);

                    // Mostrar modal en móvil
                    if (isMobile) {
                        setTimeout(function () {
                            createMobileOpeningModal();
                            showMobileOpeningModal();
                        }, 800);
                    }

                    // Ocultar timers
                    $('.timer, #my-timer, #opp-timer, .timer-display, [class*="timer"]').hide();
                    console.log('⏱️ Timers ocultados en modo estudio');
                } else {
                    // Mostrar timers en otros modos
                    $('.timer, #my-timer, #opp-timer, .timer-display, [class*="timer"]').show();
                }
            };
        }

        // 3. OCULTAR TIMERS EN MODO ESTUDIO
        // Observar cambios en el modo actual
        const observer = new MutationObserver(function (mutations) {
            // Verificar si estamos en modo estudio
            if ($('[data-mode="study"]').hasClass('active') ||
                $('#sec-study').hasClass('active') ||
                (typeof currentMode !== 'undefined' && currentMode === 'study')) {
                $('.timer, #my-timer, #opp-timer, .timer-display, [class*="timer"]').hide();
            }
        });

        // Observar cambios en el body
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class']
        });

        // Ocultar timers inmediatamente si ya estamos en modo estudio
        setTimeout(function () {
            if ($('[data-mode="study"]').hasClass('active') ||
                $('#sec-study').hasClass('active')) {
                $('.timer, #my-timer, #opp-timer, .timer-display, [class*="timer"]').hide();
                console.log('⏱️ Timers ocultados (check inicial)');
            }
        }, 2000);

        console.log('✅ Study Mode Enhancements inicializado');
    });

})();
