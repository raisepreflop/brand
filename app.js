// FictionOS - Application Logic

// DOM Elements
const contentArea = document.getElementById('content-area');
const pageTitle = document.getElementById('page-title');
const navItems = document.querySelectorAll('.nav-item');
const btnRefresh = document.getElementById('refresh-btn');
const btnGenerate = document.getElementById('generate-btn');

// State
let projectTitle = "The Ides of Summit"; // Default, ideally read from metadata file
const MAX_TITLE_LENGTH = 50;

// Icon initialization
const initIcons = () => lucide.createIcons();
initIcons();

// --- Disk Status ---
function updateDiskStatus() {
    const dot = document.getElementById('disk-status-dot');
    const text = document.getElementById('disk-status-text');
    if (!dot || !text) return;

    if (FileSystem.dirHandle) {
        dot.classList.remove('offline');
        dot.classList.add('online');
        text.innerText = 'Disk: Connected';
    } else {
        dot.classList.remove('online');
        dot.classList.add('offline');
        text.innerText = 'Disk: Disconnected';
    }
}

// --- Navigation Handler ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.dataset.tab);
    });
});

function navigateTo(tabName) {
    // Update active class
    navItems.forEach(n => {
        if (n.dataset.tab === tabName) n.classList.add('active');
        else n.classList.remove('active');
    });

    // Render content
    loadView(tabName);
}

// --- Disk Logic ---
// --- Disk Logic ---
async function connectDisk() {
    console.log("Attempting to connect disk... UI Button clicked.");

    // Diagnostic: Protocol check
    if (window.location.protocol === 'file:') {
        alert("⚠️ PROTOCOLO NO COMPATIBLE: Estás abriendo el archivo localmente (file://). \n\nPor seguridad, Chrome y Edge BLOQUEAN el acceso al disco en este modo. \n\nSOLUCIÓN: \n1. Abre una terminal en esta carpeta.\n2. Escribe: npx serve\n3. Abre la dirección http://localhost:3000 que aparecerá.");
    }

    if (!window.showDirectoryPicker) {
        alert("❌ NAVEGADOR NO COMPATIBLE: Safari y Firefox no permiten esta función. \n\nPor favor, usa la última versión de GOOGLE CHROME o MICROSOFT EDGE.");
        return;
    }

    try {
        // Clear previous handle to force a new picker
        FileSystem.dirHandle = null;
        await FileSystem.connect(true);
        updateDiskStatus();

        alert("✅ ¡Disco Conectado con Éxito!");

        if (getCurrentTab() === 'dashboard') renderDashboard();
    } catch (e) {
        console.error("Connection failed", e);
        if (e.name === 'AbortError') {
            showNotification("Conexión cancelada.");
        } else {
            alert("❌ ERROR TÉCNICO:\n\nNombre: " + e.name + "\nDetalle: " + e.message + "\n\nSi el error es 'SecurityError', necesitas usar un servidor local (localhost) para que el explorador dé permiso.");
        }
    }
}

// Bind sidebar button immediately
const sidebarDiskBtn = document.getElementById('sidebar-disk-btn');
if (sidebarDiskBtn) {
    sidebarDiskBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        connectDisk();
    });
}
updateDiskStatus();

// --- Global Actions ---
if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
        const icon = btnRefresh.querySelector('i');
        if (icon) {
            icon.style.transition = 'transform 1s';
            icon.style.transform = 'rotate(360deg)';
        }
        setTimeout(() => location.reload(), 800);
    });
}

if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
        showGenerationModal();
    });
}

function getCurrentTab() {
    const active = document.querySelector('.nav-item.active');
    return active ? active.dataset.tab : 'dashboard';
}

// --- View Controller ---
function loadView(viewName) {
    pageTitle.innerText = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    contentArea.innerHTML = '';

    // Inject "New Project" button in sidebar if not there (concept only, keeping valid UI)

    switch (viewName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'agents':
            renderAgentsView();
            break;
        case 'foundation':
            renderFileList(systemData.sections.foundation, 'Story Foundation');
            break;
        case 'characters':
            renderFileList(systemData.sections.characters, 'Characters');
            break;
        case 'worldbuilding':
            renderFileList(systemData.sections.worldbuilding, 'Worldbuilding');
            break;
        case 'manuscript':
            renderManuscriptView(); // Specialized view for export
            break;
        case 'review':
            contentArea.innerHTML = `<div style="text-align:center; padding:3rem; color:#94a3b8"><h2>Revision Queue</h2><p>No pending revisions.</p></div>`;
            break;
        default:
            contentArea.innerHTML = `<h2>Work in Progress</h2>`;
    }
    initIcons();
}

// --- Render Functions ---

function renderDashboard() {
    const totalFiles = Object.values(systemData.sections).flat().length - systemData.sections.agents.length;
    const activeAgents = systemData.sections.agents.filter(a => a.status === 'active').length;

    const html = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <span class="stat-title">Current Project</span>
                <span class="stat-value text-accent" style="font-size:1.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${projectTitle}">${projectTitle}</span>
                <button id="btn-new-project" class="btn-primary" style="margin-top:0.5rem; width:100%; font-size:0.8rem">New Project</button>
            </div>
            <div class="stat-card">
                <span class="stat-title">Files Tracked</span>
                <span class="stat-value">${totalFiles}</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">System Actions</span>
                <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
                     <button id="btn-changelog" class="btn-secondary" style="width:100%; font-size:0.8rem">View Changelog</button>
                     <button class="btn-secondary" onclick="showNotification('System Health: 100%')" style="width:100%; font-size:0.8rem">System Check</button>
                     <button id="btn-connect-disk" class="btn-primary" style="width:100%; font-size:0.8rem; margin-top:0.5rem; background-color: #8b5cf6;">Connect Disk</button>
                </div>
            </div>

            <div class="agent-status-panel">
                <div class="panel-header">
                    <h3>Active Agent Swarm</h3>
                    <div style="display:flex; gap:0.5rem;">
                        <span class="stat-value" style="font-size:1rem; margin-right:1rem">${activeAgents} Active</span>
                        <button id="btn-manage-agents" class="btn-secondary" style="font-size:0.8rem">Manage Agents</button>
                    </div>
                </div>
                <div class="agent-grid">
                    ${systemData.sections.agents.map(agent => renderAgentCard(agent)).join('')}
                </div>
            </div>
        </div>
    `;

    contentArea.innerHTML = html;

    document.getElementById('btn-manage-agents').addEventListener('click', () => navigateTo('agents'));
    document.getElementById('btn-new-project').addEventListener('click', showNewProjectModal);
    document.getElementById('btn-changelog').addEventListener('click', showChangelogModal);

    const btnConnect = document.getElementById('btn-connect-disk');
    if (btnConnect) {
        if (FileSystem.dirHandle) {
            btnConnect.innerText = "Disk Connected";
            btnConnect.style.backgroundColor = "#10b981";
        }
        btnConnect.addEventListener('click', connectDisk);
    }
}

function renderAgentsView() {
    const html = `
        <div class="dashboard-grid" style="grid-template-columns: 1fr;">
            <div class="agent-status-panel" style="margin-top:0">
                 <div class="panel-header">
                    <h3>Agent Swarm Control Center</h3>
                    <button class="btn-primary" onclick="showGenerationModal()">+ New Task</button>
                </div>
                <div class="agent-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                    ${systemData.sections.agents.map(agent => renderAgentCard(agent, true)).join('')}
                </div>
            </div>
        </div>
    `;
    contentArea.innerHTML = html;

    // Attach listeners to dynamic buttons
    document.querySelectorAll('.btn-agent-logs').forEach(btn => {
        btn.addEventListener('click', (e) => showAgentLogModal(e.target.dataset.agent));
    });
    document.querySelectorAll('.btn-agent-config').forEach(btn => {
        btn.addEventListener('click', (e) => showAgentConfigModal(e.target.dataset.agent));
    });
}

function renderAgentCard(agent, expanded = false) {
    const statusColor = agent.status === 'active' ? '#10b981' : '#94a3b8';
    const statusClass = `status-${agent.status.toLowerCase()}`;

    let extraControls = '';
    if (expanded) {
        extraControls = `
            <div style="margin-top:1rem; display:flex; gap:0.5rem;">
                <button class="btn-secondary btn-agent-logs" data-agent="${agent.name}" style="font-size:0.75rem; padding:0.4rem; flex:1">Logs</button>
                <button class="btn-secondary btn-agent-config" data-agent="${agent.name}" style="font-size:0.75rem; padding:0.4rem; flex:1">Config</button>
            </div>
        `;
    }

    return `
        <div class="agent-card">
            <div class="agent-header">
                <i data-lucide="bot" style="width:16px; color: ${statusColor}"></i>
                <span class="agent-name">${agent.name}</span>
            </div>
             <span class="agent-status ${statusClass}">${agent.status}</span>
            <div style="font-size:0.8rem; margin-top:0.5rem; color:#94a3b8">${agent.role}</div>
            ${extraControls}
        </div>
    `;
}

function renderFileList(files, sectionTitle) {
    renderGenericList(files, sectionTitle);
}

function renderManuscriptView() {
    const files = systemData.sections.manuscript;
    const listHtml = files.map((file, index) => renderFileItem(file, index)).join('');

    contentArea.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
            <h2>Manuscript</h2>
            <div style="display:flex; gap:0.5rem">
                <button id="btn-export-md" class="btn-secondary">
                    <i data-lucide="file-text" style="width:16px; margin-right:5px; vertical-align:middle"></i> MD
                </button>
                <button id="btn-export-docx" class="btn-primary" style="background: #3b82f6;">
                    <i data-lucide="download" style="width:16px; margin-right:5px; vertical-align:middle"></i> Export DOCX
                </button>
            </div>
        </div>
        <div class="file-list">
            ${listHtml}
        </div>
    `;

    bindEditListeners(files);
    document.getElementById('btn-export-docx').addEventListener('click', exportToDocx);
    document.getElementById('btn-export-md').addEventListener('click', exportToMarkdown);
}

function renderGenericList(files, sectionTitle) {
    const listHtml = files.map((file, index) => renderFileItem(file, index)).join('');
    contentArea.innerHTML = `
        <h2 style="margin-bottom:1.5rem">${sectionTitle}</h2>
        <div class="file-list">${listHtml}</div>
    `;
    bindEditListeners(files);
}

function renderFileItem(file, index) {
    let badgeClass = 'badge-pending';
    if (file.status === 'writing' || file.status === 'draft') badgeClass = 'badge-writing';
    if (file.status === 'finished') badgeClass = 'badge-finished';

    return `
            <div class="file-item">
                <div class="file-info">
                    <i data-lucide="file" class="file-icon"></i>
                    <div>
                        <div style="font-weight:600">${file.title}</div>
                        <div class="file-path">${file.path}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:1rem">
                    ${file.wordCount ? `<span style="font-family:monospace; font-size:0.8rem; color:#64748b">${file.wordCount} words</span>` : ''}
                    <span class="status-badge ${badgeClass}">${file.status}</span>
                    <button class="btn-secondary btn-edit" data-index="${index}" style="padding:0.3rem">Edit</button>
                </div>
            </div>
        `;
}

function bindEditListeners(files) {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            showEditor(files[index]);
        });
    });
}


// --- New Feature Functions ---

function exportToDocx() {
    // 1. Concatenate all chapter content
    let fullText = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${projectTitle}</title>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.5; }
        h1 { text-align: center; font-size: 24pt; margin-bottom: 24pt; page-break-before: always; }
        h2 { text-align: center; font-size: 18pt; margin-top: 18pt; margin-bottom: 12pt; }
        p { margin-bottom: 12pt; text-align: justify; text-indent: 18pt; }
        .chapter-break { page-break-before: always; }
    </style>
    </head><body>`;

    // Title Page
    fullText += `<div style="text-align:center; margin-top:200pt;">
        <h1 style="font-size:36pt; border:none;">${projectTitle}</h1>
        <p style="text-align:center; font-size:14pt;">A Novel</p>
    </div><br clear=all style='mso-special-character:line-break;page-break-before:always'>`;

    systemData.sections.manuscript.forEach(ch => {
        if (ch.content) {
            let htmlContent = ch.content
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
                .replace(/\*(.*)\*/gim, '<i>$1</i>')
                .replace(/\n\n/gim, '</p><p>')
                .replace(/^/gim, '')
                .replace(/$/gim, '');

            fullText += `<div class="chapter">${htmlContent}</div><br clear=all style='mso-special-character:line-break;page-break-before:always'>`;
        }
    });

    fullText += `</body></html>`;

    // 2. Create Blob (MIME type for Word)
    const blob = new Blob(['\ufeff', fullText], {
        type: 'application/msword'
    });

    const filename = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.doc';

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    showNotification(`Exported DOCX manuscript: ${filename}`);
    document.body.removeChild(link);
}

function exportToMarkdown() {
    let fullText = `# ${projectTitle}\n\n`;

    systemData.sections.manuscript.forEach(ch => {
        if (ch.content) {
            fullText += `${ch.content}\n\n---\n\n`;
        }
    });

    const blob = new Blob([fullText], { type: 'text/markdown' });
    const filename = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_full.md';

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    showNotification(`Exported Markdown manuscript: ${filename}`);
    document.body.removeChild(link);
}

function showNewProjectModal() {
    createModal('Create New Project', `
        <div style="margin-bottom: 1.5rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:#94a3b8">Project Title (Max ${MAX_TITLE_LENGTH} chars)</label>
            <input type="text" id="new-project-title" maxlength="${MAX_TITLE_LENGTH}" 
                style="width:100%; padding:0.8rem; background: var(--bg-dark); border: 1px solid var(--border); color:white; border-radius:6px; font-size:1rem;" 
                placeholder="Enter novel title...">
             <div style="text-align:right; font-size:0.75rem; color:#64748b; margin-top:0.3rem" id="char-count">0/${MAX_TITLE_LENGTH}</div>
        </div>
        <div style="margin-bottom: 1.5rem; display:flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" id="backup-checkbox" checked>
            <label for="backup-checkbox" style="color:#e2e8f0; font-size:0.9rem">Download ZIP backup of current project?</label>
        </div>
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px;">
            <p style="color: #fca5a5; font-size: 0.85rem; margin:0;">
                <strong style="color: #f87171;">WARNING:</strong> This will overwrite all data in the current workspace with a blank template after backup.
            </p>
        </div>
    `, (modal) => {
        const input = modal.querySelector('#new-project-title');
        const counter = modal.querySelector('#char-count');
        const backupCheck = modal.querySelector('#backup-checkbox');

        input.addEventListener('input', (e) => {
            counter.innerText = `${e.target.value.length}/${MAX_TITLE_LENGTH}`;
        });

        return async () => {
            const title = input.value.trim();
            if (!title) return alert("Title required");

            try {
                // 1. Ensure Disk Connected
                if (!FileSystem.dirHandle) {
                    await FileSystem.connect(true);
                    updateDiskStatus();
                }

                // 2. Trigger Backup if checked
                if (backupCheck.checked) {
                    showNotification("Creating Backup ZIP...");
                    await FileSystem.createBackupZip(projectTitle);
                }

                // 3. Create NEW Folder Structure
                showNotification(`Creating folder structure for: ${title}...`);
                const slug = await FileSystem.createProjectStructure(title);

                // 4. Update Memory Context
                projectTitle = title;
                systemData.projectInfo.title = title;

                // Prefixe paths with project slug
                for (const sec in systemData.sections) {
                    if (sec === 'agents') continue;
                    systemData.sections[sec].forEach(f => {
                        // Ensure we don't double prefix if reset is called multiple times
                        const lastPart = f.path.split('/').pop();
                        const subDir = f.path.includes('manuscript') ? 'manuscript' :
                            f.path.includes('story_foundation') ? 'docs/story_foundation' :
                                f.path.includes('characters') ? 'docs/characters' :
                                    f.path.includes('worldbuilding') ? 'docs/worldbuilding' :
                                        f.path.includes('style') ? 'docs/style' : 'docs';

                        f.path = `${slug}/${subDir}/${lastPart}`;
                        f.status = 'pending';
                        f.content = `# ${f.title}\n\n[New project content for ${title}]`;
                        f.wordCount = 0;
                    });
                }

                // 5. Save initial files to disk
                await FileSystem.saveAllFiles();
                await FileSystem.saveSystemData();

                showNotification(`New Project '${title}' Created at /${slug}`);
                setTimeout(() => location.reload(), 2000);
            } catch (e) {
                console.error(e);
                alert("Error creating new project. Did you grant folder permissions?");
            }
        }
    }, "Create New Folder");
}

function showChangelogModal() {
    // In a real app, read from changelog.md
    const logContent = `
# System Changelog

## 2026-01-11
- **[SYSTEM]** Dashboard initialized. Version 1.0.
- **[USER]** Created "The Ides of Summit" project structure.
- **[AGENT:Drafting]** Drafted Chapters 1, 2, 3, 4, 5.
- **[AGENT:Visual]** Generated mood board.
- **[SYSTEM]** Export functionality added.
    `;

    const htmlContent = logContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    createModal('System Changelog', `
        <div style="background:#0f0c15; padding:1.5rem; border-radius:8px; height:300px; overflow-y:auto; font-family:monospace; line-height:1.6; border:1px solid #334155;">
            ${htmlContent}
        </div>
    `, () => { });
}

function showAgentLogModal(agentName) {
    createModal(`Logs: ${agentName}`, `
        <div style="background:#0f0c15; padding:1rem; border-radius:8px; height:200px; overflow-y:auto; font-family:monospace; color:#94a3b8;">
            <span style="color:#10b981">[INFO]</span> Agent initialized.<br>
            <span style="color:#10b981">[INFO]</span> Context loaded (5k tokens).<br>
            <span style="color:#f59e0b">[WARN]</span> Ambiguity in plot point C detected.<br>
            <span style="color:#10b981">[INFO]</span> Task completed successfully.
        </div>
    `, () => { });
}

function showAgentConfigModal(agentName) {
    createModal(`Config: ${agentName}`, `
         <div style="margin-bottom: 1rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:#94a3b8">Primary Model</label>
            <select style="width:100%; padding:0.5rem; background: var(--bg-dark); border: 1px solid var(--border); color:white; border-radius:6px;">
                <option selected>Gemini 3 Pro</option>
                <option>Claude Sonnet 4.5</option>
                <option>Claude Opus 4.5</option>
            </select>
        </div>
         <div style="margin-bottom: 1rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:#94a3b8">Temperature</label>
            <input type="range" min="0" max="1" step="0.1" value="0.7" style="width:100%">
        </div>
         <div style="margin-bottom: 1rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:#94a3b8">Max Tokens</label>
            <select style="width:100%; padding:0.5rem; background: var(--bg-dark); border: 1px solid var(--border); color:white; border-radius:6px;">
                <option>2048</option>
                <option selected>4096</option>
                <option>8192</option>
            </select>
        </div>
    `, (modal) => {
        return () => showNotification(`Configuration saved for ${agentName}`);
    }, 'Save Config');
}

// --- Generic Modal Helper ---
function createModal(title, contentHtml, onConfirmSetup, confirmText = 'Confirm') {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
        z-index: 3000; backdrop-filter: blur(5px);
    `;

    modal.innerHTML = `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); padding: 2rem; border-radius: 12px; width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <h3 style="margin-bottom: 1.5rem;">${title}</h3>
            ${contentHtml}
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem">
                <button class="btn-secondary" id="modal-cancel">Close</button>
                ${onConfirmSetup ? `<button class="btn-primary" id="modal-confirm">${confirmText}</button>` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#modal-cancel').addEventListener('click', close);

    if (onConfirmSetup) {
        const onConfirm = onConfirmSetup(modal);
        modal.querySelector('#modal-confirm').addEventListener('click', () => {
            if (onConfirm) onConfirm();
            close();
        });
    }
}


// --- Editor Modal (Preserved) ---
function showEditor(file) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
        z-index: 2000; backdrop-filter: blur(5px);
    `;

    // Use stored content if available, or placeholder
    const content = file.content || `(Content for ${file.path} not loaded in demo)\n\nTry opening Manuscript chapters - they have content loaded.`;

    modal.innerHTML = `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); width: 80%; height: 80%; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <div style="padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #1f1a2e; border-radius: 12px 12px 0 0;">
                <h3 style="margin: 0;">Editing: ${file.title}</h3>
                <span style="font-family:monospace; color:#94a3b8; font-size:0.8rem;">${file.path}</span>
            </div>
            <div style="flex: 1; position: relative;">
                <textarea id="editor-textarea" style="width: 100%; height: 100%; background: #0f0c15; color: #e2e8f0; border: none; padding: 2rem; font-family: 'JetBrains Mono', monospace; font-size: 1rem; line-height: 1.6; resize: none; outline: none;">${content}</textarea>
            </div>
            <div style="padding: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; background: #1f1a2e; border-radius: 0 0 12px 12px;">
                <button class="btn-secondary" id="editor-cancel">Cancel</button>
                <button class="btn-primary" id="editor-save">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close Handler
    const close = () => modal.remove();
    modal.querySelector('#editor-cancel').addEventListener('click', close);

    // Save Handler
    // Save Handler
    modal.querySelector('#editor-save').addEventListener('click', async () => {
        const newContent = modal.querySelector('#editor-textarea').value;
        file.content = newContent; // Update memory

        try {
            showNotification('Saving to disk...');
            if (!FileSystem.dirHandle) {
                await FileSystem.connect(true);
                updateDiskStatus();
            }

            await FileSystem.saveFile(file.path, newContent);
            await FileSystem.saveSystemData();
            showNotification('Changes saved to disk!');
        } catch (err) {
            console.error(err);
            showNotification('Memory updated (Disk saving error)');
        }
        close();
    });
}

// --- File System Helper ---
const FileSystem = {
    dirHandle: null,

    async connect(force = false) {
        if (!this.dirHandle || force) {
            try {
                this.dirHandle = await window.showDirectoryPicker({
                    mode: 'readwrite'
                });
            } catch (e) {
                console.log("Directory picker cancelled or failed", e);
                throw e;
            }
        }
        return this.dirHandle;
    },

    async saveFile(relativePath, content) {
        const root = await this.connect();
        const parts = relativePath.split('/');

        let currentDir = root;
        // Navigate through subdirectories, creating them if they don't exist
        for (let i = 0; i < parts.length - 1; i++) {
            const dirName = parts[i];
            currentDir = await currentDir.getDirectoryHandle(dirName, { create: true });
        }

        // Write file
        const fileName = parts[parts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    },

    async createProjectStructure(projectName) {
        const slug = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const root = await this.connect();
        const projectDir = await root.getDirectoryHandle(slug, { create: true });

        // Setup initial structure
        const subDirs = ['docs/story_foundation', 'docs/characters', 'docs/worldbuilding', 'docs/style', 'manuscript'];
        for (const sd of subDirs) {
            let current = projectDir;
            const parts = sd.split('/');
            for (const p of parts) {
                current = await current.getDirectoryHandle(p, { create: true });
            }
        }
        return slug;
    },

    async saveAllFiles() {
        for (const sec in systemData.sections) {
            if (sec === 'agents') continue;
            for (const file of systemData.sections[sec]) {
                await this.saveFile(file.path, file.content || "");
            }
        }
    },

    async readFile(relativePath) {
        try {
            const root = await this.connect();
            const parts = relativePath.split('/');
            let currentDir = root;
            for (let i = 0; i < parts.length - 1; i++) {
                currentDir = await currentDir.getDirectoryHandle(parts[i]);
            }
            const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1]);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (e) {
            return null;
        }
    },

    async createBackupZip(currentTitle) {
        if (!window.JSZip) return alert("JSZip library not loaded.");
        const zip = new JSZip();

        const sections = ['foundation', 'characters', 'worldbuilding', 'style', 'manuscript'];
        for (const sec of sections) {
            if (systemData.sections[sec]) {
                const folder = zip.folder(sec);
                for (const file of systemData.sections[sec]) {
                    const content = await this.readFile(file.path) || file.content || "";
                    folder.file(file.title.replace(/[^a-z0-9]/gi, '_') + ".md", content);
                }
            }
        }

        zip.file("system_data.js", `const systemData = ${JSON.stringify(systemData, null, 4)};`);
        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${currentTitle.replace(/[^a-z0-9]/gi, '_')}_backup.zip`;
        link.click();
    },

    async saveSystemData() {
        const content = `const systemData = ${JSON.stringify(systemData, null, 4)};`;
        await this.saveFile('system_data.js', content);
    }
};

function showGenerationModal() {
    createModal('Trigger Agent Task', `
         <div style="margin-bottom: 1rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:#94a3b8">Select Agent</label>
            <select style="width:100%; padding:0.5rem; background: var(--bg-dark); border: 1px solid var(--border); color:white; border-radius:6px;">
                <option>Drafting Agent</option>
                <option>Revision Agent</option>
                <option>Visual Agent</option>
                <option>Research Agent</option>
            </select>
        </div>
        <div style="margin-bottom: 1rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:#94a3b8">Model</label>
            <select style="width:100%; padding:0.5rem; background: var(--bg-dark); border: 1px solid var(--border); color:white; border-radius:6px;">
                <option value="gemini-pro">Gemini 3 Pro</option>
                <option value="claude-sonnet">Claude Sonnet 4.5</option>
                <option value="claude-opus">Claude Opus 4.5</option>
            </select>
        </div>
        <div style="margin-bottom: 1rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem; color:#94a3b8">Task Prompt</label>
            <textarea style="width:100%; height:80px; padding:0.5rem; background: var(--bg-dark); border: 1px solid var(--border); color:white; border-radius:6px; font-family:sans-serif;" placeholder="Describe what the agent should do..."></textarea>
        </div>
    `, () => showNotification('Task dispatched to agent swarm'), 'Run Task');
}

function showNotification(message, duration = 3000) {
    const notif = document.createElement('div');
    notif.innerText = message;
    notif.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem;
        background: #3b82f6; color: white; padding: 1rem 2rem;
        border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        transform: translateY(100px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 9999;
        border: 1px solid rgba(255,255,255,0.2);
    `;
    document.body.appendChild(notif);

    requestAnimationFrame(() => notif.style.transform = 'translateY(0)');

    setTimeout(() => {
        notif.style.transform = 'translateY(100px)';
        setTimeout(() => notif.remove(), 300);
    }, duration);
}

// Initial Load
navigateTo('dashboard');
