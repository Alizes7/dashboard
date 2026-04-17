// SuperABC - Sistema de Transição Contábil 2026
class SuperABCApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.renderNavigation();
    }

    loadData() {
        const saved = localStorage.getItem('superabc_data');
        if (saved) return JSON.parse(saved);
        return {
            tarefas: SUPERABC_DATA.tarefas.map(t => ({...t})),
            checklist: SUPERABC_DATA.checklist.map(c => ({...c})),
            empresas: [...SUPERABC_DATA.empresas],
            equipe: [...SUPERABC_DATA.equipe],
            prazos: [...SUPERABC_DATA.prazos],
            links: [...SUPERABC_DATA.links],
            projeto: {...SUPERABC_DATA.projeto}
        };
    }

    saveData() {
        localStorage.setItem('superabc_data', JSON.stringify(this.data));
        this.showToast('Dados salvos com sucesso!', 'success');
    }

    checkAuth() {
        const user = localStorage.getItem('superabc_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    login(email, password) {
        const validUsers = [
            { email: 'admin@a2consultores.com', password: 'superabc2026', name: 'Administrador', role: 'admin' },
            { email: 'andre@a2consultores.com', password: 'a2consultores', name: 'André Alves', role: 'diretor' },
            { email: 'tatiane@a2consultores.com', password: 'a2consultores', name: 'Tatiane Ferreira', role: 'contabil' }
        ];
        const user = validUsers.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = { name: user.name, email: user.email, role: user.role };
            localStorage.setItem('superabc_user', JSON.stringify(this.currentUser));
            this.showApp();
            this.showToast(`Bem-vindo, ${user.name}!`, 'success');
            return true;
        }
        this.showToast('E-mail ou senha incorretos!', 'error');
        return false;
    }

    logout() {
        localStorage.removeItem('superabc_user');
        this.currentUser = null;
        location.reload();
    }

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        this.navigateTo('dashboard');
    }

    navigateTo(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) {
            pageEl.classList.remove('hidden');
            this.renderPage(page);
        }
    }

    renderPage(page) {
        switch(page) {
            case 'dashboard': this.renderDashboard(); break;
            case 'cronograma': this.renderCronograma(); break;
            case 'status': this.renderStatus(); break;
            case 'checklist': this.renderChecklist(); break;
            case 'empresas': this.renderEmpresas(); break;
            case 'guia': this.renderGuia(); break;
            case 'contatos': this.renderContatos(); break;
        }
    }

    calculateStats() {
        const tarefas = this.data.tarefas;
        const total = tarefas.length;
        const concluidas = tarefas.filter(t => t.percentual === 100).length;
        const andamento = tarefas.filter(t => t.percentual > 0 && t.percentual < 100).length;
        const pendentes = tarefas.filter(t => t.percentual === 0).length;
        const progressoGeral = Math.round(tarefas.reduce((acc, t) => acc + t.percentual, 0) / total);
        const folha = tarefas.filter(t => t.departamento === 'Folha de Pagamento');
        const contabil = tarefas.filter(t => t.departamento === 'Informações Contábeis');
        const fiscal = tarefas.filter(t => t.departamento === 'Informações Fiscais');
        return {
            total, concluidas, andamento, pendentes, progressoGeral,
            folha: this.calcDeptStats(folha),
            contabil: this.calcDeptStats(contabil),
            fiscal: this.calcDeptStats(fiscal)
        };
    }

    calcDeptStats(tarefas) {
        const total = tarefas.length;
        const concluidas = tarefas.filter(t => t.percentual === 100).length;
        const progresso = total > 0 ? Math.round(tarefas.reduce((acc, t) => acc + t.percentual, 0) / total) : 0;
        return { total, concluidas, progresso };
    }

    renderDashboard() {
        const stats = this.calculateStats();
        document.getElementById('dash-total-tarefas').textContent = stats.total;
        document.getElementById('dash-concluidas').textContent = stats.concluidas;
        document.getElementById('dash-andamento').textContent = stats.andamento;
        document.getElementById('dash-pendentes').textContent = stats.pendentes;
        document.getElementById('dash-progresso-geral').textContent = stats.progressoGeral + '%';
        document.getElementById('dash-progresso-bar').style.width = stats.progressoGeral + '%';
        this.renderDeptChart('chart-folha', stats.folha, 'blue');
        this.renderDeptChart('chart-contabil', stats.contabil, 'purple');
        this.renderDeptChart('chart-fiscal', stats.fiscal, 'orange');
    }

    renderDeptChart(elementId, stats, color) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = `
            <div class="chart-bar">
                <div class="chart-label">Concluídas</div>
                <div class="chart-progress">
                    <div class="chart-fill ${color}" style="width: ${stats.progresso}%"></div>
                </div>
                <div class="chart-value">${stats.concluidas}/${stats.total}</div>
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--text-medium);">Progresso: ${stats.progresso}%</div>
        `;
    }

    renderCronograma() {
        const tbody = document.getElementById('cronograma-body');
        const filter = document.getElementById('filter-dept')?.value || 'all';
        let tarefas = this.data.tarefas;
        if (filter !== 'all') tarefas = tarefas.filter(t => t.departamento === filter);
        tbody.innerHTML = tarefas.map(t => `
            <tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.tarefa}</td>
                <td>${t.responsavel}</td>
                <td>${t.inicio}</td>
                <td>${t.fim}</td>
                <td>${t.dias}</td>
                <td><div class="editable" onclick="app.editPercentual('${t.id}')">${t.percentual}%</div></td>
                <td>${this.renderStatusBadge(t.status)}</td>
                <td class="editable" onclick="app.editObservacao('${t.id}')">${t.observacoes || '-'}</td>
            </tr>
        `).join('');
    }

    renderStatus() {
        const tbody = document.getElementById('status-body');
        const filter = document.getElementById('filter-status')?.value || 'all';
        let tarefas = this.data.tarefas;
        if (filter !== 'all') {
            tarefas = tarefas.filter(t => {
                if (filter === 'pendente') return t.percentual === 0;
                if (filter === 'andamento') return t.percentual > 0 && t.percentual < 100;
                if (filter === 'concluido') return t.percentual === 100;
                return true;
            });
        }
        tbody.innerHTML = tarefas.map(t => `
            <tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.tarefa}</td>
                <td>${this.renderPrioridadeBadge('ALTA')}</td>
                <td>${t.responsavel}</td>
                <td>${t.inicio}</td>
                <td>${t.fim}</td>
                <td>
                    <select class="filter-select" onchange="app.updatePercentual('${t.id}', this.value)">
                        <option value="0" ${t.percentual == 0 ? 'selected' : ''}>0%</option>
                        <option value="25" ${t.percentual == 25 ? 'selected' : ''}>25%</option>
                        <option value="50" ${t.percentual == 50 ? 'selected' : ''}>50%</option>
                        <option value="75" ${t.percentual == 75 ? 'selected' : ''}>75%</option>
                        <option value="100" ${t.percentual == 100 ? 'selected' : ''}>100%</option>
                    </select>
                </td>
                <td>${this.renderStatusBadge(t.status)}</td>
                <td class="editable" onclick="app.editObservacao('${t.id}')">${t.observacoes || '-'}</td>
            </tr>
        `).join('');
    }

    updatePercentual(id, percentual) {
        const tarefa = this.data.tarefas.find(t => t.id === id);
        if (tarefa) {
            tarefa.percentual = parseInt(percentual);
            tarefa.status = percentual == 0 ? 'PENDENTE' : (percentual == 100 ? 'CONCLUÍDO' : 'EM ANDAMENTO');
            this.saveData();
            this.renderStatus();
            this.renderDashboard();
        }
    }

    renderChecklist() {
        const tbody = document.getElementById('checklist-body');
        const filter = document.getElementById('filter-check')?.value || 'all';
        let items = this.data.checklist;
        if (filter !== 'all') items = items.filter(c => c.categoria === filter);
        tbody.innerHTML = items.map(c => `
            <tr>
                <td><span class="dept-${c.categoria.toLowerCase().replace(/[^a-z]/g, '')}">${c.categoria}</span></td>
                <td>${c.documento}</td>
                <td>${c.empresa}</td>
                <td>
                    <div class="custom-checkbox ${c.entregue ? 'checked' : ''}" onclick="app.toggleChecklist(${c.id})">
                        ${c.entregue ? '✓' : ''}
                    </div>
                </td>
                <td>
                    <input type="date" class="form-input" style="padding: 4px 8px; font-size: 12px;" 
                           value="${c.data_entrega}" onchange="app.updateChecklistDate(${c.id}, this.value)">
                </td>
                <td>${c.responsavel}</td>
            </tr>
        `).join('');
        const entregues = this.data.checklist.filter(c => c.entregue).length;
        const total = this.data.checklist.length;
        const el = document.getElementById('checklist-stats');
        if (el) el.textContent = `${entregues}/${total} documentos entregues`;
    }

    toggleChecklist(id) {
        const item = this.data.checklist.find(c => c.id === id);
        if (item) {
            item.entregue = !item.entregue;
            if (item.entregue && !item.data_entrega) item.data_entrega = new Date().toISOString().split('T')[0];
            this.saveData();
            this.renderChecklist();
        }
    }

    updateChecklistDate(id, date) {
        const item = this.data.checklist.find(c => c.id === id);
        if (item) { item.data_entrega = date; this.saveData(); }
    }

    renderEmpresas() {
        const tbody = document.getElementById('empresas-body');
        tbody.innerHTML = this.data.empresas.map(e => `
            <tr>
                <td><strong>${e.id}</strong></td>
                <td>${e.nome}</td>
                <td>${e.cnpj}</td>
                <td>${e.estado}</td>
                <td>${e.funcionarios}</td>
                <td><span class="badge badge-concluido">${e.status}</span></td>
            </tr>
        `).join('');
    }

    renderGuia() {
        const equipeEl = document.getElementById('guia-equipe');
        if (equipeEl) {
            equipeEl.innerHTML = this.data.equipe.map(m => `
                <div class="card" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: var(--primary-dark);">${m.nome}</div>
                            <div style="font-size: 13px; color: var(--text-medium);">${m.departamento}</div>
                        </div>
                        <div style="text-align: right; font-size: 13px;">
                            <div>${m.email}</div>
                            <div style="color: var(--text-light);">${m.telefone}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        const prazosEl = document.getElementById('guia-prazos');
        if (prazosEl) {
            prazosEl.innerHTML = this.data.prazos.map(p => `
                <div class="card" style="margin-bottom: 12px; border-left: 4px solid ${p.tipo === 'CRÍTICO' ? 'var(--accent-red)' : p.tipo === 'URGENTE' ? 'var(--accent-orange)' : 'var(--accent-green)'};">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <span class="badge ${p.tipo === 'CRÍTICO' ? 'badge-alta' : p.tipo === 'URGENTE' ? 'badge-media' : 'badge-baixa'}">${p.tipo}</span>
                            <div style="margin-top: 8px; font-weight: 600;">${p.descricao}</div>
                            <div style="font-size: 13px; color: var(--text-medium);">Responsável: ${p.responsavel}</div>
                        </div>
                        <div style="text-align: right; font-weight: 700; color: var(--primary-dark);">${p.prazo}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    renderContatos() {
        const linksEl = document.getElementById('contatos-links');
        if (linksEl) {
            linksEl.innerHTML = this.data.links.map(l => `
                <div class="card" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: var(--primary-dark);">${l.sistema}</div>
                            <div style="font-size: 13px; color: var(--text-medium);">${l.descricao}</div>
                        </div>
                        <div style="text-align: right;">
                            <a href="${l.url}" target="_blank" class="btn btn-sm btn-primary">Acessar</a>
                            <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">${l.acesso}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    renderStatusBadge(status) {
        const classes = { 'PENDENTE': 'badge-pendente', 'EM ANDAMENTO': 'badge-andamento', 'CONCLUÍDO': 'badge-concluido', 'NÃO INICIADO': 'badge-pendente' };
        return `<span class="badge ${classes[status] || 'badge-pendente'}">${status}</span>`;
    }

    renderPrioridadeBadge(prio) {
        const classes = { 'ALTA': 'badge-alta', 'MÉDIA': 'badge-media', 'BAIXA': 'badge-baixa' };
        return `<span class="badge ${classes[prio] || 'badge-media'}">${prio}</span>`;
    }

    editPercentual(id) {
        const tarefa = this.data.tarefas.find(t => t.id === id);
        if (!tarefa) return;
        const novo = prompt('Percentual concluído (0, 25, 50, 75, 100):', tarefa.percentual);
        if (novo !== null && !isNaN(novo)) this.updatePercentual(id, novo);
    }

    editObservacao(id) {
        const tarefa = this.data.tarefas.find(t => t.id === id);
        if (!tarefa) return;
        const novo = prompt('Observações:', tarefa.observacoes || '');
        if (novo !== null) { tarefa.observacoes = novo; this.saveData(); this.renderCronograma(); this.renderStatus(); }
    }

    exportToExcel() {
        let csv = 'Nº,Tarefa,Responsável,Início,Fim,Dias,% Concluído,Status,Observações\n';
        this.data.tarefas.forEach(t => {
            csv += `${t.id},"${t.tarefa}",${t.responsavel},${t.inicio},${t.fim},${t.dias},${t.percentual}%,${t.status},"${t.observacoes || ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'SuperABC_Cronograma_' + new Date().toISOString().split('T')[0] + '.csv';
        link.click();
        this.showToast('Arquivo exportado com sucesso!', 'success');
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('superabc_theme', next);
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
            });
        }
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => { const page = link.dataset.page; if (page) this.navigateTo(page); });
        });
        const savedTheme = localStorage.getItem('superabc_theme');
        if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
        ['filter-dept', 'filter-status', 'filter-check'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => { if (id === 'filter-dept') this.renderCronograma(); if (id === 'filter-status') this.renderStatus(); if (id === 'filter-check') this.renderChecklist(); });
        });
    }

    renderNavigation() {
        const userEl = document.getElementById('user-name');
        if (userEl && this.currentUser) userEl.textContent = this.currentUser.name;
    }
}

const app = new SuperABCApp();
