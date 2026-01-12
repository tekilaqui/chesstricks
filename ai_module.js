// ========================================
// AI GENERATIVA - EXPLICACIONES HUMANAS
// ========================================

// Configuración de IA Generativa
window.aiConfig = {
    enabled: false,
    provider: 'openai',
    apiKey: null
};

// Cargar configuración guardada
function loadAIConfig() {
    const saved = localStorage.getItem('chess_ai_config');
    if (saved) {
        try {
            window.aiConfig = JSON.parse(saved);
            window.aiConfig.enabled = false; // Forzar apagado a petición
            $('#ai-enabled-toggle').prop('checked', false);
            $('#ai-provider-sel').val(window.aiConfig.provider);
            if (window.aiConfig.apiKey) {
                $('#ai-api-key-input').val(window.aiConfig.apiKey);
            }
            // No mostrar el panel
            $('#ai-config-panel').hide();
        } catch (e) {
            console.error('Error loading AI config:', e);
        }
    }
}

// Guardar configuración
function saveAIConfig() {
    window.aiConfig.provider = $('#ai-provider-sel').val();
    window.aiConfig.apiKey = $('#ai-api-key-input').val().trim();

    localStorage.setItem('chess_ai_config', JSON.stringify(window.aiConfig));

    if (window.aiConfig.enabled && window.aiConfig.apiKey) {
        showToast('✅ Configuración de IA guardada', 'success');
    }
}

// Toggle AI Explanations
function toggleAIExplanations(enabled) {
    window.aiConfig.enabled = enabled;

    if (enabled) {
        $('#ai-config-panel').slideDown();
        if (!window.aiConfig.apiKey) {
            showToast('⚠️ Ingresa tu API Key para activar la IA', 'warning');
        } else {
            showToast('🤖 Explicaciones de IA activadas', 'success');
        }
    } else {
        $('#ai-config-panel').slideUp();
        showToast('ℹ️ Explicaciones de IA desactivadas', 'info');
    }

    saveAIConfig();
}

// Mostrar ayuda sobre cómo obtener API keys
function showAIHelp() {
    const provider = $('#ai-provider-sel').val();
    let helpText = '';
    let url = '';

    switch (provider) {
        case 'openai':
            helpText = '1. Ve a platform.openai.com\n2. Crea una cuenta o inicia sesión\n3. Ve a API Keys\n4. Crea una nueva clave\n5. Copia y pega aquí';
            url = 'https://platform.openai.com/api-keys';
            break;
        case 'claude':
            helpText = '1. Ve a console.anthropic.com\n2. Crea una cuenta\n3. Ve a API Keys\n4. Genera una nueva clave\n5. Copia y pega aquí';
            url = 'https://console.anthropic.com/';
            break;
        case 'perplexity':
            helpText = '1. Ve a perplexity.ai\n2. Crea una cuenta\n3. Ve a Settings > API\n4. Genera tu API key\n5. Copia y pega aquí';
            url = 'https://www.perplexity.ai/settings/api';
            break;
    }

    if (confirm(helpText + '\n\n¿Abrir la página ahora?')) {
        window.open(url, '_blank');
    }
}

// Obtener explicación de IA para una posición
async function getAIExplanation(fen, lastMove, evaluation, context = '') {
    if (!window.aiConfig.enabled || !window.aiConfig.apiKey) {
        return null;
    }

    const prompt = `Eres un maestro de ajedrez explicando una posición. 

FEN: ${fen}
Última jugada: ${lastMove || 'Posición inicial'}
Evaluación: ${evaluation}
Contexto: ${context}

Explica en 2-3 frases cortas y claras:
1. Qué está pasando en la posición
2. Cuál es el plan recomendado
3. Qué debe evitar el jugador

Sé conciso, didáctico y motivador.`;

    try {
        const response = await callAIProvider(prompt);
        return response;
    } catch (error) {
        console.error('AI Error:', error);
        showToast('⚠️ Error al obtener explicación de IA', 'error');
        return null;
    }
}

// Llamar al proveedor de IA a través del túnel WebSockets (CORS-free)
async function callAIProvider(prompt) {
    const provider = window.aiConfig.provider;
    const apiKey = window.aiConfig.apiKey;

    if (typeof socket === 'undefined' || !socket || !socket.connected) {
        throw new Error('Sin conexión con el servidor de IA.');
    }

    return new Promise((resolve, reject) => {
        // Timeout de seguridad para no quedar esperando siempre
        const timeout = setTimeout(() => {
            reject(new Error('Tiempo de espera agotado para la respuesta de IA.'));
        }, 30000);

        // Enviar petición al servidor para que él haga el fetch (Proxy)
        socket.emit('ai_request', {
            provider: provider,
            apiKey: apiKey,
            prompt: prompt
        });

        // Escuchar la respuesta (una sola vez)
        socket.once('ai_response', (data) => {
            clearTimeout(timeout);
            if (data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data.text);
            }
        });
    });
}

// Integrar con el sistema de coach existente
async function enhanceCoachWithAI(quality, theory, tactical, fen, lastMove, evaluation) {
    if (!window.aiConfig.enabled || !window.aiConfig.apiKey) {
        return null; // Sin IA, usar explicaciones normales
    }

    // Construir contexto
    let context = `Calidad de jugada: ${quality.text}. `;
    if (theory.name) {
        context += `Apertura: ${theory.name}. `;
    }
    if (tactical) {
        context += `Consejo táctico: ${tactical}`;
    }

    const aiExplanation = await getAIExplanation(fen, lastMove, evaluation, context);
    return aiExplanation;
}
