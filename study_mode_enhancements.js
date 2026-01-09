// AJUSTES PARA MODO TEORÍA Y ENTRENAMIENTO - CON BOTÓN MANUAL MÓVIL
// Este archivo añade funcionalidad adicional sin modificar el client.js principal

(function () {
    'use strict';

    console.log('📚 Study & Training Mode Enhancements cargado');

    // Esperar a que el DOM esté listo
    $(document).ready(function () {

        // DETECTAR SI ES MÓVIL
        const isMobile = () => window.innerWidth < 768;

        console.log('📱 ¿Es móvil?', isMobile());

        // 1. SELECTOR DE COLOR EN MODO TEORÍA (PC)
        function addStudyColorSelector() {
            if ($('#study-color-selector').length === 0) {
                const colorSelector = `
                    <div id="study-color-selector" style="margin:15px 0; padding:12px; background:rgba(56, 189, 248, 0.1); border-radius:8px; border:1px solid rgba(56, 189, 248, 0.3);">
                        <label class="label-tiny" style="color:#38bdf8; display:block; margin-bottom:8px; font-weight:700;">🎨 COLOR PARA ESTUDIAR</label>
                        <select class="btn-control" id="study-color-sel" style="width:100%;">
                            <option value="w">⚪ Estudiar con Blancas</option>
                            <option value="b">⚫ Estudiar con Negras</option>
                        </select>
                    </div>
                `;

                const $openingSel = $('select[id*="opening"]').first();
                if ($openingSel.length > 0) {
                    $openingSel.closest('div').after(colorSelector);
                    console.log('✅ Selector de color añadido');

                    $('#study-color-sel').on('change', function () {
                        const selectedColor = $(this).val();
                        if (typeof board !== 'undefined' && board) {
                            board.orientation(selectedColor === 'w' ? 'white' : 'black');
                            console.log('🎨 Orientación cambiada a:', selectedColor === 'w' ? 'Blancas' : 'Negras');
                        }
                    });
                }
            }
        }

        // 2. MODAL PARA MÓVIL (TEORÍA Y ENTRENAMIENTO)
        function createAndShowMobileModal(mode) {
            console.log('📱 Creando modal móvil para modo:', mode);

            $('#mobile-opening-modal').remove();

            const isTraining = mode === 'ai';
            const title = isTraining ? '⚔️ Configurar Entrenamiento' : '📖 Configurar Estudio';
            const confirmText = isTraining ? '⚔️ Iniciar Entrenamiento' : '✅ Iniciar Estudio';

            const modalHTML = `
                <div id="mobile-opening-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(2, 6, 23, 0.98);
                    z-index: 99999;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                ">
                    <div style="max-width: 500px; margin: 0 auto; width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h2 style="color: #38bdf8; font-size: 1.3rem; margin: 0; font-weight: 800;">
                                ${title}
                            </h2>
                            <button id="close-opening-modal" style="
                                background: rgba(239, 68, 68, 0.2);
                                border: 1px solid #ef4444;
                                color: #ef4444;
                                font-size: 1.5rem;
                                cursor: pointer;
                                width: 40px;
                                height: 40px;
                                border-radius: 8px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">✕</button>
                        </div>
                        
                        <div style="margin-bottom: 20px; background: rgba(30, 41, 59, 0.5); padding: 15px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.3);">
                            <label style="color: #38bdf8; display: block; margin-bottom: 10px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">
                                📚 Selecciona Apertura
                            </label>
                            <select id="modal-opening-sel" class="btn-control" style="width: 100%; font-size: 0.9rem; padding: 12px;">
                                <option value="">-- ${isTraining ? 'Juego Libre' : 'Elige una apertura'} --</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 20px; background: rgba(30, 41, 59, 0.5); padding: 15px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.3);">
                            <label style="color: #38bdf8; display: block; margin-bottom: 10px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">
                                🎨 Tu Color
                            </label>
                            <select id="modal-color-sel" class="btn-control" style="width: 100%; font-size: 0.9rem; padding: 12px;">
                                <option value="w">⚪ Blancas</option>
                                <option value="b">⚫ Negras</option>
                                ${isTraining ? '<option value="random">🎲 Aleatorio</option>' : ''}
                            </select>
                        </div>
                        
                        ${isTraining ? `
                        <div style="margin-bottom: 25px; background: rgba(30, 41, 59, 0.5); padding: 15px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.3);">
                            <label style="color: #38bdf8; display: block; margin-bottom: 10px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">
                                🎯 Nivel de Dificultad
                            </label>
                            <select id="modal-difficulty-sel" class="btn-control" style="width: 100%; font-size: 0.9rem; padding: 12px;">
                                <option value="1">♟️ Principiante (600)</option>
                                <option value="5" selected>♝ Intermedio (1200)</option>
                                <option value="10">♜ Avanzado (1800)</option>
                                <option value="15">♛ Experto (2200)</option>
                                <option value="20">♚ Maestro (2500+)</option>
                            </select>
                        </div>
                        ` : ''}
                        
                        <button id="confirm-opening-selection" style="
                            width: 100%;
                            padding: 18px;
                            font-size: 1.1rem;
                            background: linear-gradient(135deg, ${isTraining ? '#a78bfa, #8b5cf6' : '#38bdf8, #0ea5e9'});
                            border: none;
                            border-radius: 10px;
                            color: #fff;
                            font-weight: 800;
                            cursor: pointer;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            box-shadow: 0 4px 15px rgba(${isTraining ? '139, 92, 246' : '56, 189, 248'}, 0.4);
                        ">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            $('body').append(modalHTML);
            console.log('✅ Modal añadido al DOM');

            // Copiar opciones de aperturas
            const $originalSelect = isTraining ? $('#ai-opening-practice') : $('select[id*="opening"]').first();
            if ($originalSelect.length > 0) {
                $('#modal-opening-sel').html($originalSelect.html());
                console.log('✅ Opciones copiadas');
            }

            // Cerrar modal
            $('#close-opening-modal').on('click', function () {
                $('#mobile-opening-modal').fadeOut(300, function () { $(this).remove(); });
            });

            // Confirmar selección
            $('#confirm-opening-selection').on('click', function () {
                const selectedOpening = $('#modal-opening-sel').val();
                const selectedColor = $('#modal-color-sel').val();
                const selectedDifficulty = $('#modal-difficulty-sel').val();

                console.log('✅ Configuración:', { apertura: selectedOpening, color: selectedColor, dificultad: selectedDifficulty });

                if (isTraining) {
                    // Aplicar configuración de entrenamiento
                    if ($('#ai-opening-practice').length > 0) {
                        $('#ai-opening-practice').val(selectedOpening);
                    }
                    if ($('#ai-color-sel').length > 0) {
                        $('#ai-color-sel').val(selectedColor);
                    }
                    if ($('#diff-sel').length > 0 && selectedDifficulty) {
                        $('#diff-sel').val(selectedDifficulty);
                    }

                    // Iniciar juego AI
                    setTimeout(function () {
                        if ($('#btn-start-ai').length > 0) {
                            $('#btn-start-ai').click();
                        }
                    }, 300);
                } else {
                    // Aplicar configuración de estudio
                    if ($originalSelect.length > 0) {
                        $originalSelect.val(selectedOpening).trigger('change');
                    }

                    if (typeof board !== 'undefined' && board) {
                        board.orientation(selectedColor === 'w' ? 'white' : 'black');
                    }
                }

                $('#mobile-opening-modal').fadeOut(300, function () { $(this).remove(); });
            });
        }

        // 3. BOTÓN FLOTANTE PARA MÓVIL
        function createFloatingButton() {
            if (isMobile() && $('#mobile-config-btn').length === 0) {
                const floatingBtn = `
                    <button id="mobile-config-btn" style="
                        position: fixed;
                        bottom: 80px;
                        right: 20px;
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #38bdf8, #0ea5e9);
                        border: none;
                        color: white;
                        font-size: 1.8rem;
                        cursor: pointer;
                        z-index: 9998;
                        box-shadow: 0 4px 20px rgba(56, 189, 248, 0.6);
                        display: none;
                        align-items: center;
                        justify-content: center;
                    ">⚙️</button>
                `;

                $('body').append(floatingBtn);

                $('#mobile-config-btn').on('click', function () {
                    console.log('🔘 Botón flotante pulsado');
                    const currentModeValue = typeof currentMode !== 'undefined' ? currentMode : 'study';
                    createAndShowMobileModal(currentModeValue);
                });

                console.log('✅ Botón flotante creado');
            }
        }

        // 4. MOSTRAR/OCULTAR BOTÓN SEGÚN MODO
        function toggleFloatingButton(show, mode) {
            if (isMobile()) {
                if (show) {
                    // Cambiar color según modo
                    const gradient = mode === 'ai'
                        ? 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
                        : 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
                    const shadow = mode === 'ai'
                        ? '0 4px 20px rgba(139, 92, 246, 0.6)'
                        : '0 4px 20px rgba(56, 189, 248, 0.6)';

                    $('#mobile-config-btn')
                        .css({
                            'background': gradient,
                            'box-shadow': shadow,
                            'display': 'flex'
                        })
                        .hide()
                        .fadeIn(300);
                    console.log('👁️ Botón flotante mostrado para modo:', mode);
                } else {
                    $('#mobile-config-btn').fadeOut(300);
                }
            }
        }

        // 5. INTERCEPTAR CAMBIO A MODO STUDY O AI
        const originalSetMode = window.setMode;

        window.setMode = function (mode) {
            console.log('🔄 Cambiando a modo:', mode);

            if (typeof originalSetMode === 'function') {
                originalSetMode.apply(this, arguments);
            }

            if (mode === 'study' || mode === 'ai') {
                console.log('📖 Modo', mode, 'activado');

                if (!isMobile()) {
                    setTimeout(addStudyColorSelector, 500);
                } else {
                    createFloatingButton();
                    toggleFloatingButton(true, mode);
                    // Mostrar modal automáticamente la primera vez
                    setTimeout(() => createAndShowMobileModal(mode), 800);
                }

                if (mode === 'study') {
                    $('.timer, #my-timer, #opp-timer, .timer-display, [class*="timer"]').hide();
                }
            } else {
                toggleFloatingButton(false);
                $('.timer, #my-timer, #opp-timer, .timer-display, [class*="timer"]').show();
            }
        };

        // 6. OCULTAR TIMERS EN MODO ESTUDIO
        const observer = new MutationObserver(function () {
            const isStudyMode = $('[data-mode="study"]').hasClass('active') ||
                $('#sec-study').hasClass('active') ||
                (typeof currentMode !== 'undefined' && currentMode === 'study');

            const isAiMode = $('[data-mode="ai"]').hasClass('active') ||
                $('#sec-ai').hasClass('active') ||
                (typeof currentMode !== 'undefined' && currentMode === 'ai');

            if (isStudyMode) {
                $('.timer, #my-timer, #opp-timer, .timer-display, [class*="timer"]').hide();

                if (isMobile()) {
                    createFloatingButton();
                    toggleFloatingButton(true, 'study');
                }
            }

            if (isAiMode && isMobile()) {
                createFloatingButton();
                toggleFloatingButton(true, 'ai');
            }
        });

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class']
        });

        console.log('✅ Study & Training Mode Enhancements inicializado');
    });

})();
