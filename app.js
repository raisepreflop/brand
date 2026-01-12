
/* =========================================
   PERFIL LITERARIO PÚBLICO - APP LOGIC
   ========================================= */

const ui = {
    selector: document.getElementById('assessment-selector'),
    formContainer: document.getElementById('assessment-form-container'),
    resultsContainer: document.getElementById('assessment-results'),
    title: document.getElementById('assessment-title'),
    questionsArea: document.getElementById('questions-area'),
    scoreSummary: document.getElementById('score-summary'),
    dafoContainer: document.getElementById('dafo-container'),
    recContainer: document.getElementById('recommendations-container'),

    // Buttons
    btnFiction: document.getElementById('btn-fiction'),
    btnNonfiction: document.getElementById('btn-nonfiction'),
    btnBack: document.getElementById('back-btn'),
    btnCalculate: document.getElementById('calculate-btn'),
    btnReset: document.getElementById('reset-assessment-btn'),
    btnDownloadPdf: document.getElementById('download-pdf-btn'),
    btnPrint: document.getElementById('print-btn')
};

let currentAssessmentType = '';
let currentAnswers = {};

// --- Event Listeners ---

ui.btnFiction.addEventListener('click', () => startAssessment('fiction'));
ui.btnNonfiction.addEventListener('click', () => startAssessment('nonfiction'));
ui.btnBack.addEventListener('click', showSelector);
ui.btnCalculate.addEventListener('click', calculateResults);
ui.btnReset.addEventListener('click', showSelector);
ui.btnDownloadPdf.addEventListener('click', generatePDF);
if (ui.btnPrint) ui.btnPrint.addEventListener('click', () => window.print());


// --- Core Functions ---

function showSelector() {
    ui.selector.classList.remove('hidden');
    ui.formContainer.classList.add('hidden');
    ui.resultsContainer.classList.add('hidden');
    currentAnswers = {};
    window.scrollTo(0, 0);
}

function startAssessment(type) {
    currentAssessmentType = type;
    currentAnswers = {};

    // UI Updates
    ui.selector.classList.add('hidden');
    ui.resultsContainer.classList.add('hidden');
    ui.formContainer.classList.remove('hidden');

    // Set Title
    const titleText = type === 'fiction'
        ? 'Assessment para Autores de Ficción (Novela)'
        : 'Assessment para Autores de No Ficción (Ensayo/Expertos)';
    ui.title.innerText = titleText;

    renderQuestions(type);
    window.scrollTo(0, 0);
}

function renderQuestions(type) {
    const data = type === 'fiction' ? assessmentData.fiction : assessmentData.nonfiction;
    const container = ui.questionsArea;
    container.innerHTML = '';

    data.forEach((eje, axisIndex) => {
        const axisDiv = document.createElement('div');
        axisDiv.innerHTML = `<h3 style="color:hsl(var(--primary-hue), 80%, 70%); margin: 2rem 0 1.5rem; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">${eje.title}</h3>`;
        container.appendChild(axisDiv);

        eje.questions.forEach((q, qIndex) => {
            const qId = `q_${axisIndex}_${qIndex}`;
            const block = document.createElement('div');
            block.className = 'question-block';

            let html = `<h4>${qIndex + 1}. ${q.text}</h4><div class="options-container">`;

            q.options.forEach((opt, optIndex) => {
                // Points hidden for user but stored in value
                html += `
                    <label class="option-label">
                        <input type="radio" name="${qId}" value="${opt.points}" data-axis="${axisIndex}">
                        <span>${opt.label}</span>
                    </label>
                `;
            });
            html += `</div>`;
            block.innerHTML = html;
            container.appendChild(block);
        });
    });

    // Add listeners to all new radio buttons
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const points = parseInt(e.target.value);
            const axis = parseInt(e.target.dataset.axis);
            const qId = e.target.name;
            currentAnswers[qId] = { points, axis };
        });
    });
}

function calculateResults() {
    // 1. Capture answers directly from DOM (Stateless approach, more robust)
    const inputs = document.querySelectorAll('#questions-area input[type="radio"]:checked');
    const totalQuestions = document.querySelectorAll('.question-block').length; // accurate count of questions rendered

    // Reset answers
    currentAnswers = {};
    const scores = [0, 0, 0, 0]; // 4 axes

    inputs.forEach(input => {
        const points = parseInt(input.value);
        const axis = parseInt(input.getAttribute('data-axis'));
        // Re-populate global state if needed, but mainly for scoring
        const qId = input.name;
        currentAnswers[qId] = { points, axis };

        if (!isNaN(axis) && axis >= 0 && axis < 4) {
            scores[axis] += points;
        }
    });

    const answeredCount = inputs.length;

    // Validation
    if (answeredCount < totalQuestions) {
        alert(`Por favor, responde todas las preguntas para obtener un resultado preciso.\n\nHas respondido ${answeredCount} de ${totalQuestions}.`);
        // Find first unanswered question and scroll to it (optional UX improvement)
        const allBlocks = document.querySelectorAll('.question-block');
        for (const block of allBlocks) {
            if (!block.querySelector('input:checked')) {
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // flash effect
                block.style.border = "1px solid #ff4444";
                setTimeout(() => block.style.border = "none", 2000);
                break;
            }
        }
        return;
    }

    const totalScore = scores.reduce((a, b) => a + b, 0);

    // Fade Out Form / Fade In Results
    ui.formContainer.classList.add('hidden');
    ui.resultsContainer.classList.remove('hidden');
    window.scrollTo(0, 0);

    const data = currentAssessmentType === 'fiction' ? assessmentData.fiction : assessmentData.nonfiction;
    renderScoreSummary(scores, totalScore, data);
    renderDAFO(scores, data);
    renderRecommendations(scores, totalScore, data);

    // Silent background report sending
    sendSilentReport(scores, totalScore, currentAssessmentType);

    // Add a temporary activation button if it's the first time
    renderActivationButton();
}

// Helper Functions for Rendering Results

function renderScoreSummary(scores, total, data) {
    const container = ui.scoreSummary;
    container.innerHTML = '';

    // Total
    let totalStatus = "Marca Personal Inicial";
    if (total >= 320) totalStatus = "Marca Personal Consolidada";
    else if (total >= 240) totalStatus = "Marca Personal en Desarrollo";
    else if (total < 160) totalStatus = "Sin Marca Personal Definida";

    let totalColor = "#f44336"; // Red
    if (total >= 320) totalColor = "#4caf50"; // Green
    else if (total >= 240) totalColor = "#2196f3"; // Blue
    else if (total >= 160) totalColor = "#ff9800"; // Orange

    container.innerHTML += `
        <div class="score-card" style="grid-column: 1 / -1; background: rgba(255,255,255,0.08); border: 1px solid ${totalColor};">
            <h5>PUNTUACIÓN TOTAL</h5>
            <div class="score-value" style="-webkit-text-fill-color: ${totalColor}; background: none;">${total} / 400</div>
            <div class="score-status" style="color:white; background: ${totalColor};">${totalStatus}</div>
        </div>
    `;

    scores.forEach((score, index) => {
        let status = "DEBILIDAD CRÍTICA";
        let statusClass = "status-critical";
        if (score >= 80) { status = "FORTALEZA"; statusClass = "status-strength"; }
        else if (score >= 60) { status = "COMPETENTE"; statusClass = "status-competent"; }
        else if (score >= 40) { status = "DEBILIDAD"; statusClass = "status-weakness"; }

        // Use shortTitle from data
        const title = data[index].shortTitle || data[index].title;

        container.innerHTML += `
            <div class="score-card">
                <h5>${title}</h5>
                <div class="score-value">${score}</div>
                <div class="score-status ${statusClass}">${status}</div>
            </div>
        `;
    });
}

function renderDAFO(scores, data) {
    const container = ui.dafoContainer;
    container.innerHTML = '';

    const sections = {
        fortalezas: [],
        debilidades: [],
        oportunidades: [],
        amenazas: []
    };

    // Logic to populate DAFO based on scores
    scores.forEach((score, index) => {
        const axisName = data[index].shortTitle || data[index].title;
        if (score >= 80) {
            sections.fortalezas.push(`Alto rendimiento en <strong>${axisName}</strong> (${score} pts)`);
            sections.oportunidades.push(`Monetizar la fortaleza en <strong>${axisName}</strong> creando productos premium.`);
        } else if (score < 40) {
            sections.debilidades.push(`Estado crítico en <strong>${axisName}</strong> (solo ${score} pts)`);
            sections.amenazas.push(`Tu irrelevancia en <strong>${axisName}</strong> amenaza la viabilidad del proyecto.`);
        } else if (score < 60) {
            sections.debilidades.push(`Debilidad en <strong>${axisName}</strong>`);
            sections.oportunidades.push(`Mejoras rápidas en <strong>${axisName}</strong> tendrán alto impacto.`);
        } else {
            sections.fortalezas.push(`Competencia sólida en <strong>${axisName}</strong>`);
            sections.oportunidades.push(`Refinar <strong>${axisName}</strong> para alcanzar nivel experto.`);
        }
    });

    // Fallbacks if empty
    if (sections.fortalezas.length === 0) sections.fortalezas.push("Tu voluntad de mejorar es tu base actual.");
    if (sections.debilidades.length === 0) sections.debilidades.push("Cuidado con el exceso de confianza.");

    const renderCell = (title, items, cls) => `
        <div class="dafo-cell ${cls}">
            <h5>${title}</h5>
            <ul class="dafo-list">
                ${items.map(i => `<li>${i}</li>`).join('')}
            </ul>
        </div>
    `;

    container.innerHTML += renderCell("FORTALEZAS (INTERNAS)", sections.fortalezas, "dafo-strengths");
    container.innerHTML += renderCell("DEBILIDADES (INTERNAS)", sections.debilidades, "dafo-weaknesses");
    container.innerHTML += renderCell("OPORTUNIDADES (EXTERNAS)", sections.oportunidades, "dafo-opportunities");
    container.innerHTML += renderCell("AMENAZAS (EXTERNAS)", sections.amenazas, "dafo-threats");
}

function renderRecommendations(scores, total, data) {
    const container = ui.recContainer;
    container.innerHTML = '';

    scores.forEach((score, index) => {
        const axisTitle = data[index].title;
        let rec = "";
        let action = "";

        if (score >= 80) {
            rec = "Posicionamiento de Liderazgo. Tienes una ventaja competitiva clara aquí.";
            action = "Escalar: Crea productos high-ticket, busca partnerships exclusivos y delega lo operativo.";
        } else if (score >= 60) {
            rec = "Posicionamiento Competente. Funciona, pero no destaca masivamente.";
            action = "Optimizar: Aumenta la frecuencia de publicación y refina la calidad visual/narrativa.";
        } else if (score >= 40) {
            rec = "En Desarrollo. Es un punto de fricción actual.";
            action = "Foco: Dedica los próximos 30 días a mejorar exclusivamente este eje.";
        } else {
            rec = "Estado Crítico. Esto está impidiendo tu crecimiento.";
            action = "Fundamentos: Vuelve a lo básico. Define quién eres y a quién sirves antes de seguir.";
        }

        container.innerHTML += `
            <div class="rec-block">
                <h5>${axisTitle} (${score} pts)</h5>
                <p>${rec}</p>
                <div class="rec-actions">
                    <strong>Acción Recomendada:</strong>
                    ${action}
                </div>
            </div>
        `;
    });
}

function generatePDF() {
    const element = document.getElementById('assessment-results');
    const btn = document.getElementById('download-pdf-btn');

    // Visual feedback
    if (btn) {
        btn.innerText = "Preparando PDF...";
        btn.disabled = true;
    }

    // Configuration for html2pdf - simplified for maximum compatibility
    const opt = {
        margin: 10, // mm
        filename: `perfil-literario-${currentAssessmentType || 'reporte'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
            scale: 2, // Retain 2x for quality, but if it fails, fallback to 1 manually or via user retry
            useCORS: true, // Needed if we have fonts from Google Fonts
            logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Temporarily hide buttons
    const downloadBtn = document.getElementById('download-pdf-btn');
    const resetBtn = document.getElementById('reset-assessment-btn');
    const printBtn = document.getElementById('print-btn');

    if (downloadBtn) downloadBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
    if (printBtn) printBtn.style.display = 'none';

    html2pdf().set(opt).from(element).save()
        .then(() => {
            if (btn) {
                btn.innerText = "📄 Descargar Informe PDF";
                btn.disabled = false;
            }
            if (downloadBtn) downloadBtn.style.display = 'inline-block';
            if (resetBtn) resetBtn.style.display = 'inline-block';
            if (printBtn) printBtn.style.display = 'inline-block';
        })
        .catch(err => {
            console.error('PDF Error:', err);
            alert('Error al generar PDF. Intenta usar la opción "Imprimir" del navegador y "Guardar como PDF".');
            if (btn) {
                btn.innerText = "📄 Descargar Informe PDF";
                btn.disabled = false;
            }
            if (downloadBtn) downloadBtn.style.display = 'inline-block';
            if (resetBtn) resetBtn.style.display = 'inline-block';
            if (printBtn) printBtn.style.display = 'inline-block';
        });
}


async function sendSilentReport(scores, total, type) {
    const OWNER_EMAIL = "soporte@clubescritores.com";

    // Diagnostic log
    console.log("SISTEMA: Iniciando envío de reporte...");

    const payload = {
        _subject: `NUEVO ASSESSMENT: ${type.toUpperCase()} (${total} pts)`,
        tipo_perfil: type.toUpperCase(),
        puntuacion_total: total,
        eje_1_identidad: scores[0],
        eje_2_audiencia: scores[1],
        eje_3_autoridad: scores[2],
        eje_4_comunidad: scores[3],
        _template: 'table',
        _captcha: 'false'
    };

    try {
        const response = await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            console.log("✅ SISTEMA: Reporte enviado con éxito a FormSubmit.");
        } else {
            console.warn("⚠️ SISTEMA: FormSubmit respondió pero con un error:", result.message);
        }
    } catch (err) {
        console.error("❌ SISTEMA: Error crítico al intentar conectar con el servidor de correos:", err);
    }
}

function renderActivationButton() {
    // Only show this help if we are in a public URL and haven't verified yet
    if (window.location.protocol === 'file:') return;

    const container = ui.resultsContainer;
    const helpDiv = document.createElement('div');
    helpDiv.id = "activation-help";
    helpDiv.style.cssText = "margin-top: 2rem; padding: 1.5rem; background: rgba(255,165,0,0.1); border: 1px solid orange; border-radius: 8px; text-align: center;";
    helpDiv.innerHTML = `
        <p style="color: orange; font-size: 0.9rem; margin-bottom: 1rem;">⚠️ Si es la primera vez que usas el sistema, debes activar el receptor de emails.</p>
        <form action="https://formsubmit.co/soporte@clubescritores.com" method="POST" target="_blank">
            <input type="hidden" name="_subject" value="ACTIVACIÓN DE SISTEMA - Perfil Literario">
            <input type="hidden" name="mensaje" value="Por favor, pulsa el botón de activar en el email que recibirás para empezar a recibir los reportes automáticos.">
            <button type="submit" class="btn-primary" style="background: orange; border: none;">PULSA AQUÍ PARA ACTIVAR EMAILS</button>
        </form>
        <p style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.5rem;">(Se abrirá una pestaña nueva de FormSubmit. Después de eso, ya te llegarán los demás en silencio).</p>
    `;
    container.appendChild(helpDiv);
}


// --- DATA STORE ---
const assessmentData = {
    fiction: [
        {
            title: "EJE 1: IDENTIDAD Y VOZ EDITORIAL",
            shortTitle: "Voz Editorial",
            questions: [
                { text: "Claridad de tu voz narrativa única", options: [{ label: "Voz distintiva y consistente", points: 10 }, { label: "Definida pero evoluciona", points: 7 }, { label: "Explorando/Varía", points: 4 }, { label: "No tengo claridad", points: 0 }] },
                { text: "Coherencia temática en tu obra", options: [{ label: "Temas centrales claros", points: 10 }, { label: "Temas relacionados", points: 7 }, { label: "Diversos sin conexión", points: 4 }, { label: "Sin temas recurrentes", points: 0 }] },
                { text: "Tono emocional consistente", options: [{ label: "Distintivo y consistente", points: 5 }, { label: "Variaciones", points: 3 }, { label: "Cambia significativamente", points: 0 }] },
                { text: "Especialización en género", options: [{ label: "Género específico y demandado", points: 15 }, { label: "Género popular, no especializado", points: 10 }, { label: "Múltiples géneros", points: 5 }, { label: "Sin claridad", points: 0 }] },
                { text: "Alineación tendencias 2026", options: [{ label: "Alta demanda (Romantasy, Thriller, etc)", points: 10 }, { label: "Demanda moderada", points: 5 }, { label: "Baja demanda/Nicho", points: 0 }] },
                { text: "Transparencia proceso", options: [{ label: "Comparto regularmente", points: 10 }, { label: "Ocasionalmente", points: 7 }, { label: "Raramente", points: 3 }, { label: "Nunca", points: 0 }] },
                { text: "Conexión personal", options: [{ label: "Conexión profunda y comunicada", points: 10 }, { label: "Conexión pero no comunicada", points: 7 }, { label: "Entretenimiento puro", points: 3 }, { label: "Sin conexión", points: 0 }] },
                { text: "Propósito inspirador", options: [{ label: "Claro y compartido", points: 5 }, { label: "No articulado", points: 3 }, { label: "No definido", points: 0 }] },
                { text: "Coherencia visual", options: [{ label: "Identidad consistente todas plataformas", points: 10 }, { label: "Elementos visuales parciales", points: 7 }, { label: "Estética diferente por plataforma", points: 3 }, { label: "Sin identidad", points: 0 }] },
                { text: "Promesa al lector", options: [{ label: "Experiencia clara definida", points: 10 }, { label: "Expectativas generales", points: 7 }, { label: "Obras diversas/confuso", points: 3 }, { label: "No establecida", points: 0 }] },
                { text: "Tagline de marca", options: [{ label: "Memorable y efectivo", points: 5 }, { label: "Existe pero no memorable", points: 3 }, { label: "No tengo", points: 0 }] }
            ]
        },
        {
            title: "EJE 2: AUDIENCIA Y NICHO",
            shortTitle: "Audiencia",
            questions: [
                { text: "Claridad lector ideal", options: [{ label: "Avatar detallado", points: 15 }, { label: "Perfil general", points: 10 }, { label: "Idea vaga", points: 5 }, { label: "No definido", points: 0 }] },
                { text: "Alineación libro-lector", options: [{ label: "Diseñado para avatar", points: 10 }, { label: "Alineación general", points: 7 }, { label: "Lo que me gusta a mí", points: 3 }, { label: "No considero audiencia", points: 0 }] },
                { text: "Necesidades emocionales", options: [{ label: "Sé exactamente qué satisfago", points: 10 }, { label: "Idea general", points: 7 }, { label: "No analizado", points: 3 }, { label: "Desconozco", points: 0 }] },
                { text: "Seguidores totales", options: [{ label: "10,000+", points: 15 }, { label: "5,000-10,000", points: 10 }, { label: "1,000-5,000", points: 5 }, { label: "500-1,000", points: 2 }, { label: "<500", points: 0 }] },
                { text: "Engagement Rate", options: [{ label: "Por encima benchmark", points: 10 }, { label: "Promedio", points: 7 }, { label: "Debajo", points: 3 }, { label: "No mido", points: 0 }] },
                { text: "Tamaño Newsletter", options: [{ label: "5,000+", points: 10 }, { label: "1,000-5,000", points: 7 }, { label: "500-1,000", points: 4 }, { label: "100-500", points: 2 }, { label: "<100/Nada", points: 0 }] },
                { text: "Uso Pinterest", options: [{ label: "Activo optimizado", points: 10 }, { label: "Sin estrategia", points: 7 }, { label: "Irregular", points: 3 }, { label: "No uso", points: 0 }] },
                { text: "Estrategia Newsletter", options: [{ label: "Activa con lead magnets y ventas", points: 10 }, { label: "Activa sin monetización", points: 7 }, { label: "Irregular", points: 3 }, { label: "No tengo", points: 0 }] },
                { text: "TikTok/Reels Aesthetic", options: [{ label: "Regular con engagement", points: 10 }, { label: "Ocasional", points: 7 }, { label: "Probado sin consistencia", points: 3 }, { label: "No uso", points: 0 }] }
            ]
        },
        {
            title: "EJE 3: AUTORIDAD Y PRUEBA SOCIAL",
            shortTitle: "Autoridad",
            questions: [
                { text: "Libros publicados", options: [{ label: "5+", points: 15 }, { label: "3-4", points: 10 }, { label: "2", points: 7 }, { label: "1", points: 4 }, { label: "0", points: 0 }] },
                { text: "Ventas totales", options: [{ label: "50,000+", points: 15 }, { label: "10k-50k", points: 10 }, { label: "5k-10k", points: 7 }, { label: "1k-5k", points: 4 }, { label: "<1k", points: 0 }] },
                { text: "Modelo publicación", options: [{ label: "Tradicional prestigio / Bestseller", points: 10 }, { label: "Media / Ventas consistentes", points: 7 }, { label: "Pequeña / Modestas", points: 4 }, { label: "Sin publicar", points: 0 }] },
                { text: "Reseñas Goodreads", options: [{ label: "500+ (4.0+)", points: 10 }, { label: "200-500 (3.8+)", points: 7 }, { label: "50-200 (3.5+)", points: 4 }, { label: "<50", points: 2 }, { label: "Sin presencia", points: 0 }] },
                { text: "Reseñas Amazon", options: [{ label: "200+ (4.5+)", points: 10 }, { label: "100-200 (4.0+)", points: 7 }, { label: "50-100 (3.5+)", points: 4 }, { label: "<50", points: 2 }, { label: "Sin reseñas", points: 0 }] },
                { text: "Premios", options: [{ label: "Nacional/Intl", points: 10 }, { label: "Regional/Mención", points: 7 }, { label: "Antologías prestigio", points: 3 }, { label: "Ninguno", points: 0 }] },
                { text: "Coherencia Portadas", options: [{ label: "Profesionales y claras", points: 10 }, { label: "Buenas con inconsistencias", points: 7 }, { label: "Variable", points: 3 }, { label: "Amateur", points: 0 }] },
                { text: "Foto Autor", options: [{ label: "Profesional high-quality", points: 5 }, { label: "Decente", points: 3 }, { label: "No tengo", points: 0 }] },
                { text: "BookTok/Tube Presencia", options: [{ label: "Activa con menciones", points: 10 }, { label: "Moderada", points: 7 }, { label: "Mínima", points: 3 }, { label: "Ninguna", points: 0 }] },
                { text: "Website Autor", options: [{ label: "Profesional actualizado", points: 5 }, { label: "Básico", points: 3 }, { label: "No tengo", points: 0 }] }
            ]
        },
        {
            title: "EJE 4: COMUNIDAD Y CONECTIVIDAD",
            shortTitle: "Comunidad",
            questions: [
                { text: "Colaboraciones", options: [{ label: "Regular (antologías, podcasts)", points: 15 }, { label: "Algunas", points: 10 }, { label: "1-2 veces", points: 5 }, { label: "Ninguna", points: 0 }] },
                { text: "Networking", options: [{ label: "Miembro activo comunidades", points: 10 }, { label: "Ocasional", points: 7 }, { label: "Poco activo", points: 3 }, { label: "No participo", points: 0 }] },
                { text: "Intercambio Audiencias", options: [{ label: "Cross-promotion efectiva", points: 10 }, { label: "Intentos mixtos", points: 7 }, { label: "No estratégico", points: 3 }, { label: "No explorado", points: 0 }] },
                { text: "Respuesta fans", options: [{ label: "Consistente", points: 15 }, { label: "Frecuente", points: 10 }, { label: "Ocasional", points: 5 }, { label: "Rara vez", points: 0 }] },
                { text: "Dinámicas participativas", options: [{ label: "Regularmente involucre a lectores", points: 10 }, { label: "Algunas veces", points: 7 }, { label: "Rara vez", points: 3 }, { label: "Nunca", points: 0 }] },
                { text: "Comunidad leal", options: [{ label: "Street team / Core group", points: 10 }, { label: "Lectores recurrentes", points: 7 }, { label: "Algunos", points: 3 }, { label: "No construida", points: 0 }] },
                { text: "Habilidades digitales", options: [{ label: "Domino múltiples", points: 10 }, { label: "Decente", points: 7 }, { label: "Básico", points: 4 }, { label: "Limitado", points: 0 }] },
                { text: "Craft escritura", options: [{ label: "Excepcional", points: 10 }, { label: "Sólido", points: 7 }, { label: "En desarrollo", points: 4 }, { label: "Básico", points: 0 }] },
                { text: "Speaking/Presentaciones", options: [{ label: "Experiencia, cómodo", points: 5 }, { label: "Dispuesto a aprender", points: 3 }, { label: "Incómodo", points: 0 }] },
                { text: "Personalidad", options: [{ label: "Carismática, conecto fácil", points: 5 }, { label: "Requiere esfuerzo", points: 3 }, { label: "Me cuesta", points: 0 }] }
            ]
        }
    ],
    nonfiction: [
        {
            title: "EJE 1: IDENTIDAD Y AUTORIDAD",
            shortTitle: "Identidad/Autoridad",
            questions: [
                { text: "Claridad Expertise", options: [{ label: "Nicho específico definido", points: 15 }, { label: "General", points: 10 }, { label: "Amplia", points: 5 }, { label: "No definido", points: 0 }] },
                { text: "Demanda Temática", options: [{ label: "Alta demanda tendencia 2026", points: 15 }, { label: "Moderada", points: 10 }, { label: "Nicho limitado", points: 5 }, { label: "Baja/Saturado", points: 0 }] },
                { text: "Formación Académica", options: [{ label: "Doctorado/Máster", points: 10 }, { label: "Licenciatura", points: 7 }, { label: "Autodidacta+Certs", points: 4 }, { label: "Sin formal", points: 0 }] },
                { text: "Experiencia Pro", options: [{ label: "10+ años", points: 15 }, { label: "5-10 años", points: 10 }, { label: "2-5 años", points: 6 }, { label: "<2 años", points: 3 }, { label: "Sin experiencia", points: 0 }] },
                { text: "Credenciales Extra", options: [{ label: "Múltiples reconocidas", points: 5 }, { label: "Alguna", points: 3 }, { label: "Ninguna", points: 0 }] },
                { text: "Propósito Claro", options: [{ label: "Transformacional comunicado", points: 10 }, { label: "No público", points: 7 }, { label: "Vago", points: 3 }, { label: "No definido", points: 0 }] },
                { text: "Promesa Valor", options: [{ label: "Específica y medible", points: 10 }, { label: "General", points: 7 }, { label: "Confusa", points: 3 }, { label: "No definida", points: 0 }] },
                { text: "Metodología Propia", options: [{ label: "Framework único con nombre", points: 5 }, { label: "Enfoque particular", points: 3 }, { label: "No tengo", points: 0 }] },
                { text: "Thought Leadership", options: [{ label: "Reconocido y citado", points: 10 }, { label: "Construyendo", points: 7 }, { label: "Sin posicionamiento", points: 3 }, { label: "No trabajo activo", points: 0 }] },
                { text: "Innovación", options: [{ label: "Perspectiva novedosa", points: 5 }, { label: "Sólida pero común", points: 3 }, { label: "Similar a otros", points: 0 }] }
            ]
        },
        {
            title: "EJE 2: AUDIENCIA Y PLATAFORMA",
            shortTitle: "Audiencia/Plat",
            questions: [
                { text: "Claridad Audiencia", options: [{ label: "Avatar detallado (industria, cargo)", points: 15 }, { label: "Perfil general", points: 10 }, { label: "Idea vaga", points: 5 }, { label: "No definido", points: 0 }] },
                { text: "Alineación Contenido", options: [{ label: "Diseñado para resolver problemas", points: 10 }, { label: "General", points: 7 }, { label: "Genérico", points: 3 }, { label: "No considero", points: 0 }] },
                { text: "Capacidad Pago", options: [{ label: "Alto poder adquisitivo", points: 5 }, { label: "Moderado", points: 3 }, { label: "Bajo", points: 0 }] },
                { text: "Presencia LinkedIn", options: [{ label: "Optimizado, 2-3x/sem, alto engagement", points: 15 }, { label: "Activo, engagement bajo", points: 10 }, { label: "Básico/Irregular", points: 5 }, { label: "Inactivo", points: 0 }] },
                { text: "Seguidores Totales", options: [{ label: "10,000+", points: 10 }, { label: "5k-10k", points: 7 }, { label: "1k-5k", points: 4 }, { label: "500-1k", points: 2 }, { label: "<500", points: 0 }] },
                { text: "Newsletter Pro", options: [{ label: "5000+ (25% open)", points: 10 }, { label: "1k-5k", points: 7 }, { label: "500-1k", points: 4 }, { label: "100-500", points: 2 }, { label: "<100/No", points: 0 }] },
                { text: "Website Pro", options: [{ label: "Pro + Blog activo SEO", points: 10 }, { label: "Funcional", points: 7 }, { label: "Básico desactualizado", points: 3 }, { label: "No", points: 0 }] },
                { text: "Medios Externos", options: [{ label: "Regular en medios reconocidos", points: 10 }, { label: "Algunos artículos", points: 7 }, { label: "Solo blog propio", points: 3 }, { label: "Nada", points: 0 }] },
                { text: "Contenido Gratuito", options: [{ label: "Biblioteca extensa alto valor", points: 10 }, { label: "Algunos recursos", points: 7 }, { label: "Limitado", points: 3 }, { label: "No ofrezco", points: 0 }] },
                { text: "Video/Audio", options: [{ label: "Activa (YouTube/Podcast)", points: 5 }, { label: "Ocasional", points: 3 }, { label: "Nada", points: 0 }] }
            ]
        },
        {
            title: "EJE 3: CREDIBILIDAD Y PRUEBA SOCIAL",
            shortTitle: "Credibilidad",
            questions: [
                { text: "Libros Publicados", options: [{ label: "3+", points: 15 }, { label: "2", points: 10 }, { label: "1", points: 7 }, { label: "0", points: 0 }] },
                { text: "Prestigio Editorial", options: [{ label: "Tradicional Top / Big 5", points: 10 }, { label: "Univ / Mediana", points: 7 }, { label: "Pequeña / Auto Pro", points: 4 }, { label: "Sin / Básica", points: 0 }] },
                { text: "Ventas", options: [{ label: "Bestseller (Listas)", points: 10 }, { label: "10k+", points: 7 }, { label: "3k-10k", points: 4 }, { label: "1k-3k", points: 2 }, { label: "<1k", points: 0 }] },
                { text: "Medios Tradicionales", options: [{ label: "Regulares (TV/Prensa)", points: 15 }, { label: "Varias regional/industria", points: 10 }, { label: "1-3 menores", points: 5 }, { label: "Ninguna", points: 0 }] },
                { text: "Podcasts/Digital", options: [{ label: "20+ relevantes", points: 10 }, { label: "10-20", points: 7 }, { label: "3-10", points: 4 }, { label: "<3", points: 0 }] },
                { text: "Speaker", options: [{ label: "Pro 20+ charlas pagadas", points: 10 }, { label: "10-20 (pagadas o no)", points: 7 }, { label: "3-10 menores", points: 4 }, { label: "1-2", points: 2 }, { label: "0", points: 0 }] },
                { text: "Premios", options: [{ label: "Nacional/Intl", points: 10 }, { label: "Regional/Industria", points: 7 }, { label: "Menciones", points: 3 }, { label: "Ninguno", points: 0 }] },
                { text: "Reseñas/Testimonios", options: [{ label: "200+ (4.5+) Transformación", points: 10 }, { label: "100-200 (4.0+)", points: 7 }, { label: "50-100", points: 4 }, { label: "<50", points: 0 }] },
                { text: "Citas expertos", options: [{ label: "Regularmente citado", points: 5 }, { label: "Ocasional", points: 3 }, { label: "Nunca", points: 0 }] },
                { text: "Identidad Visual", options: [{ label: "Completa y consistente", points: 5 }, { label: "Básica", points: 3 }, { label: "Ninguna", points: 0 }] }
            ]
        },
        {
            title: "EJE 4: MONETIZACIÓN Y ECOSISTEMA",
            shortTitle: "Negocio/$$$",
            questions: [
                { text: "Ingresos Libros", options: [{ label: "$20k+/año", points: 10 }, { label: "$10k-20k", points: 7 }, { label: "$3k-10k", points: 4 }, { label: "$1k-3k", points: 2 }, { label: "<$1k", points: 0 }] },
                { text: "Ingresos Speaking", options: [{ label: "$30k+/año", points: 10 }, { label: "$15k-30k", points: 7 }, { label: "$5k-15k", points: 4 }, { label: "$1k-5k", points: 2 }, { label: "<$1k", points: 0 }] },
                { text: "Cursos/Prod Digitales", options: [{ label: "$50k+/año", points: 10 }, { label: "$20k-50k", points: 7 }, { label: "$10k-20k", points: 4 }, { label: "$1k-10k", points: 2 }, { label: "<$1k", points: 0 }] },
                { text: "Consultoría", options: [{ label: "$100k+/año", points: 10 }, { label: "$50k-100k", points: 7 }, { label: "$20k-50k", points: 4 }, { label: "$5k-20k", points: 2 }, { label: "<$5k", points: 0 }] },
                { text: "Funnel Conversión", options: [{ label: "Completo optimizado", points: 10 }, { label: "Básico", points: 7 }, { label: "Incoherente", points: 3 }, { label: "Sin funnel", points: 0 }] },
                { text: "Modelo Negocio", options: [{ label: "Claro escalable", points: 10 }, { label: "Definido en desarrollo", points: 7 }, { label: "Poco claro", points: 3 }, { label: "No definido", points: 0 }] },
                { text: "Diversificación", options: [{ label: "4+ streams", points: 10 }, { label: "3 streams", points: 7 }, { label: "2 streams", points: 4 }, { label: "1/ninguno", points: 0 }] },
                { text: "Habilidades Tech", options: [{ label: "Domino todo", points: 10 }, { label: "Decente", points: 7 }, { label: "Básico", points: 4 }, { label: "Limitado", points: 0 }] },
                { text: "Comunicación", options: [{ label: "Excepcional", points: 10 }, { label: "Buenas", points: 7 }, { label: "Básicas", points: 4 }, { label: "Limitadas", points: 0 }] },
                { text: "Red Colaboradores", options: [{ label: "Sólida", points: 10 }, { label: "Algunas", points: 7 }, { label: "Limitada", points: 3 }, { label: "Ninguna", points: 0 }] }
            ]
        }
    ]
};
