class DashboardContabil {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.currentEmpresaFilter = '';
        this.modalMode = null;
        this.modalData = null;
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.populateEmpresaSelects();
    }

    getDefaultData() {
        return {
            projeto: {
                nome: "Novo Projeto Contábil",
                cliente: "Cliente",
                consultoria: "Sua Empresa",
                periodo: "-",
                duracao: "-",
                data_inicio: new Date().toISOString().split('T')[0],
                descricao: "Descrição do projeto"
            },
            empresas: [],
            tarefas: [],
            checklist: [],
            equipe: [
                { id: 1, departamento: "DIRETORIA", nome: "Administrador", email: "admin@sistema.com", telefone: "" }
            ],
            links: [
                { sistema: "eSocial", descricao: "Folha de pagamento", url: "https://portal.esocial.gov.br", acesso: "Certificado A1" },
                { sistema: "SPED", descricao: "Escrituração fiscal", url: "https://www.sped.fazenda.gov.br", acesso: "Certificado A1" },
                { sistema: "RFB", descricao: "Receita Federal", url: "https://www.gov.br/receitafederal", acesso: "Certificado" }
            ],
            config: {
                tema: 'light',
                ultimoAcesso: new Date().toISOString()
            }
        };
    }

    loadData() {
        const saved = localStorage.getItem('dashboard_contabil_data');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Erro ao carregar dados:', e);
            }
        }
        return this.getDefaultData();
    }

    saveData() {
        localStorage.setItem('dashboard_contabil_data', JSON.stringify(this.data));
        this.showToast('Dados salvos com sucesso!', 'success');
    }

    checkAuth() {
        const user = localStorage.getItem('dashboard_contabil_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    login(email, password) {
        const validUsers = [
            { email: 'admin@sistema.com', password: 'admin123', name: 'Administrador', role: 'admin' },
            { email: 'user@sistema.com', password: 'user123', name: 'Usuário', role: 'user' }
        ];
        
        const user = validUsers.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = { name: user.name, email: user.email, role: user.role };
            localStorage.setItem('dashboard_contabil_user', JSON.stringify(this.currentUser));
            this.showApp();
            this.showToast(`Bem-vindo, ${user.name}!`, 'success');
            return true;
        }
        this.showToast('E-mail ou senha incorretos!', 'error');
        return false;
    }

    logout() {
        localStorage.removeItem('dashboard_contabil_user');
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
        document.getElementById('user-name').textContent = this.currentUser?.name || 'Usuário';
        this.updateProjectInfo();
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
        window.scrollTo(0, 0);
    }

    renderPage(page) {
        switch(page) {
            case 'dashboard': this.renderDashboard(); break;
            case 'empresas': this.renderEmpresas(); break;
            case 'tarefas': this.renderTarefas(); break;
            case 'cronograma': this.renderCronograma(); break;
            case 'checklist': this.renderChecklist(); break;
            case 'equipe': this.renderEquipe(); break;
        }
    }

    updateProjectInfo() {
        const p = this.data.projeto;
        document.getElementById('project-name').textContent = p.nome;
        document.getElementById('project-client').textContent = p.cliente;
    }

    populateEmpresaSelects() {
        const selects = [
            document.getElementById('empresa-select'),
            document.getElementById('filter-empresa-tarefa'),
            document.getElementById('filter-empresa-check')
        ];
        
        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            this.data.empresas.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.nome.substring(0, 30) + (emp.nome.length > 30 ? '...' : '');
                select.appendChild(option);
            });
            
            if (currentValue) select.value = currentValue;
        });
    }

    changeEmpresa() {
        const select = document.getElementById('empresa-select');
        this.currentEmpresaFilter = select.value;
        this.renderDashboard();
        this.showToast(this.currentEmpresaFilter ? 'Filtro aplicado' : 'Mostrando todas as empresas', 'success');
    }

    renderDashboard() {
        const stats = this.calculateStats();
        const p = this.data.projeto;
        
        document.getElementById('dash-total-empresas').textContent = stats.totalEmpresas;
        document.getElementById('dash-total-tarefas').textContent = stats.totalTarefas;
        document.getElementById('dash-concluidas').textContent = stats.tarefasConcluidas;
        document.getElementById('dash-taxa-conclusao').textContent = stats.taxaConclusao + '% concluído';
        document.getElementById('dash-checklist').textContent = `${stats.checklistEntregue}/${stats.totalChecklist}`;
        document.getElementById('dash-checklist-pct').textContent = stats.checklistPct + '% entregue';
        
        document.getElementById('dash-progresso-geral').textContent = stats.progressoGeral + '%';
        document.getElementById('dash-progresso-bar').style.width = stats.progressoGeral + '%';
        document.getElementById('dash-periodo').textContent = `Período: ${p.periodo}`;
        document.getElementById('dash-duracao').textContent = `Duração: ${p.duracao}`;
        document.getElementById('dash-subtitle').textContent = `Visão geral - ${p.nome}`;
        
        this.renderChartDepartamentos(stats);
        this.renderChartEmpresas();
    }

    calculateStats() {
        let tarefas = this.data.tarefas;
        let checklist = this.data.checklist;
        
        if (this.currentEmpresaFilter) {
            tarefas = tarefas.filter(t => t.empresa_id == this.currentEmpresaFilter);
            checklist = checklist.filter(c => c.empresa_id == this.currentEmpresaFilter);
        }
        
        const totalTarefas = tarefas.length;
        const tarefasConcluidas = tarefas.filter(t => t.percentual === 100).length;
        const taxaConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
        const progressoGeral = totalTarefas > 0 ? Math.round(tarefas.reduce((acc, t) => acc + t.percentual, 0) / totalTarefas) : 0;
        
        const totalChecklist = checklist.length;
        const checklistEntregue = checklist.filter(c => c.entregue).length;
        const checklistPct = totalChecklist > 0 ? Math.round((checklistEntregue / totalChecklist) * 100) : 0;
        
        return {
            totalEmpresas: this.data.empresas.length,
            totalTarefas,
            tarefasConcluidas,
            taxaConclusao,
            progressoGeral,
            totalChecklist,
            checklistEntregue,
            checklistPct
        };
    }

    renderChartDepartamentos(stats) {
        const container = document.getElementById('chart-departamentos');
        if (!container) return;
        
        let tarefas = this.data.tarefas;
        if (this.currentEmpresaFilter) {
            tarefas = tarefas.filter(t => t.empresa_id == this.currentEmpresaFilter);
        }
        
        const deptStats = {};
        tarefas.forEach(t => {
            if (!deptStats[t.departamento]) {
                deptStats[t.departamento] = { total: 0, concluidas: 0, pct: 0 };
            }
            deptStats[t.departamento].total++;
            if (t.percentual === 100) deptStats[t.departamento].concluidas++;
        });
        
        Object.keys(deptStats).forEach(d => {
            deptStats[d].pct = Math.round((deptStats[d].concluidas / deptStats[d].total) * 100);
        });
        
        const colors = ['#2563eb', '#9333ea', '#ea580c', '#16a34a', '#d97706'];
        let html = '';
        Object.keys(deptStats).forEach((dept, idx) => {
            const stat = deptStats[dept];
            const color = colors[idx % colors.length];
            html += `
                <div class="chart-bar">
                    <div class="chart-label">${dept}</div>
                    <div class="chart-progress">
                        <div class="chart-fill" style="width: ${stat.pct}%; background: ${color};">${stat.pct > 0 ? stat.pct + '%' : ''}</div>
                    </div>
                    <div class="chart-value">${stat.concluidas}/${stat.total}</div>
                </div>
            `;
        });
        
        container.innerHTML = html || '<p style="color: var(--text-light); text-align: center;">Nenhuma tarefa cadastrada</p>';
    }

    renderChartEmpresas() {
        const container = document.getElementById('chart-empresas');
        if (!container) return;
        
        const empStats = {};
        this.data.tarefas.forEach(t => {
            const emp = this.data.empresas.find(e => e.id == t.empresa_id);
            const empNome = emp ? emp.nome.substring(0, 20) : 'Sem empresa';
            if (!empStats[empNome]) empStats[empNome] = { total: 0, pct: 0, sum: 0 };
            empStats[empNome].total++;
            empStats[empNome].sum += t.percentual;
        });
        
        Object.keys(empStats).forEach(e => {
            empStats[e].pct = Math.round(empStats[e].sum / empStats[e].total);
        });
        
        const colors = ['#27ae60', '#e67e22', '#9333ea', '#2563eb', '#e8b339', '#e74c3c'];
        let html = '';
        Object.keys(empStats).forEach((emp, idx) => {
            const stat = empStats[emp];
            const color = colors[idx % colors.length];
            html += `
                <div class="chart-bar">
                    <div class="chart-label" title="${emp}">${emp}${emp.length > 20 ? '...' : ''}</div>
                    <div class="chart-progress">
                        <div class="chart-fill" style="width: ${stat.pct}%; background: ${color};">${stat.pct > 0 ? stat.pct + '%' : ''}</div>
                    </div>
                    <div class="chart-value">${stat.total}</div>
                </div>
            `;
        });
        
        container.innerHTML = html || '<p style="color: var(--text-light); text-align: center;">Nenhuma tarefa cadastrada</p>';
    }

    renderEmpresas() {
        const tbody = document.getElementById('empresas-body');
        tbody.innerHTML = this.data.empresas.map(e => `
            <tr>
                <td><strong>#${e.id}</strong></td>
                <td>${e.nome}</td>
                <td>${e.cnpj || '-'}</td>
                <td>${e.estado || '-'}</td>
                <td>${e.funcionarios || 0}</td>
                <td><span class="badge badge-concluido">${e.status || 'Ativa'}</span></td>
                <td>
                    <button onclick="app.editEmpresa(${e.id})" class="btn btn-sm btn-outline">✏️</button>
                    <button onclick="app.deleteEmpresa(${e.id})" class="btn btn-sm btn-danger">🗑️</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="text-center" style="padding: 40px; color: var(--text-light);">Nenhuma empresa cadastrada. Clique em "+ Nova Empresa" para adicionar.</td></tr>';
    }

    renderTarefas() {
        const tbody = document.getElementById('tarefas-body');
        const filterEmpresa = document.getElementById('filter-empresa-tarefa')?.value || '';
        const filterDept = document.getElementById('filter-dept-tarefa')?.value || '';
        const filterStatus = document.getElementById('filter-status-tarefa')?.value || '';
        
        let tarefas = this.data.tarefas;
        
        if (filterEmpresa) tarefas = tarefas.filter(t => t.empresa_id == filterEmpresa);
        if (filterDept) tarefas = tarefas.filter(t => t.departamento === filterDept);
        if (filterStatus) {
            if (filterStatus === 'PENDENTE') tarefas = tarefas.filter(t => t.percentual === 0);
            else if (filterStatus === 'EM ANDAMENTO') tarefas = tarefas.filter(t => t.percentual > 0 && t.percentual < 100);
            else if (filterStatus === 'CONCLUÍDO') tarefas = tarefas.filter(t => t.percentual === 100);
        }
        
        tbody.innerHTML = tarefas.map(t => {
            const emp = this.data.empresas.find(e => e.id == t.empresa_id);
            return `
                <tr>
                    <td><strong>${t.codigo || t.id}</strong></td>
                    <td>${t.tarefa}</td>
                    <td>${emp ? emp.nome.substring(0, 25) : '-'}</td>
                    <td><span class="badge badge-media">${t.departamento}</span></td>
                    <td>${t.responsavel}</td>
                    <td>${t.inicio}</td>
                    <td>${t.fim}</td>
                    <td>
                        <div class="progress-bar" style="width: 60px; display: inline-block; vertical-align: middle; margin-right: 8px;">
                            <div class="progress-fill ${t.percentual === 100 ? 'green' : t.percentual > 0 ? 'orange' : 'blue'}" style="width: ${t.percentual}%"></div>
                        </div>
                        ${t.percentual}%
                    </td>
                    <td>${this.renderStatusBadge(t.percentual === 100 ? 'CONCLUÍDO' : t.percentual > 0 ? 'EM ANDAMENTO' : 'PENDENTE')}</td>
                    <td>
                        <button onclick="app.editTarefa(${t.id})" class="btn btn-sm btn-outline">✏️</button>
                        <button onclick="app.deleteTarefa(${t.id})" class="btn btn-sm btn-danger">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="10" class="text-center" style="padding: 40px; color: var(--text-light);">Nenhuma tarefa encontrada com os filtros selecionados.</td></tr>';
        
        const emp = filterEmpresa ? this.data.empresas.find(e => e.id == filterEmpresa) : null;
        document.getElementById('tarefas-subtitle').textContent = emp ? `Filtrado: ${emp.nome}` : 'Todas as empresas';
    }

    renderCronograma() {
        const container = document.getElementById('cronograma-timeline');
        const tarefas = this.data.tarefas.sort((a, b) => {
            const da = a.inicio ? new Date(a.inicio.split('/').reverse().join('-')) : new Date(0);
            const db = b.inicio ? new Date(b.inicio.split('/').reverse().join('-')) : new Date(0);
            return da - db;
        });
        
        container.innerHTML = tarefas.map(t => {
            const emp = this.data.empresas.find(e => e.id == t.empresa_id);
            let statusClass = '';
            if (t.percentual === 100) statusClass = 'completed';
            else if (t.percentual > 0) statusClass = 'in-progress';
            
            return `
                <div class="timeline-item ${statusClass}">
                    <div class="timeline-date">${t.inicio || '-'}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${t.tarefa}</div>
                        <div class="timeline-meta">
                            ${emp ? `<strong>${emp.nome}</strong> | ` : ''}
                            ${t.departamento} | 
                            Responsável: ${t.responsavel || '-'} | 
                            Progresso: ${t.percentual || 0}%
                        </div>
                    </div>
                </div>
            `;
        }).join('') || '<p style="text-align: center; padding: 40px; color: var(--text-light);">Nenhuma tarefa cadastrada.</p>';
    }

    renderChecklist() {
        const tbody = document.getElementById('checklist-body');
        const filterEmpresa = document.getElementById('filter-empresa-check')?.value || '';
        const filterCat = document.getElementById('filter-cat-check')?.value || '';
        
        let items = this.data.checklist;
        if (filterEmpresa) items = items.filter(c => c.empresa_id == filterEmpresa);
        if (filterCat) items = items.filter(c => c.categoria === filterCat);
        
        tbody.innerHTML = items.map(c => {
            const emp = this.data.empresas.find(e => e.id == c.empresa_id);
            return `
                <tr>
                    <td>
                        <div class="custom-checkbox ${c.entregue ? 'checked' : ''}" onclick="app.toggleChecklist(${c.id})">
                            ${c.entregue ? '✓' : ''}
                        </div>
                    </td>
                    <td><span class="badge badge-media">${c.categoria}</span></td>
                    <td>${c.documento}</td>
                    <td>${emp ? emp.nome.substring(0, 30) : 'Todas'}</td>
                    <td>
                        <input type="date" class="form-input" style="padding: 4px 8px; font-size: 12px; width: 130px;" 
                               value="${c.data_entrega || ''}" onchange="app.updateChecklistDate(${c.id}, this.value)">
                    </td>
                    <td>${c.responsavel}</td>
                    <td class="editable" onclick="app.editChecklistObs(${c.id})">${c.observacoes || '-'}</td>
                    <td>
                        <button onclick="app.editChecklist(${c.id})" class="btn btn-sm btn-outline">✏️</button>
                        <button onclick="app.deleteChecklist(${c.id})" class="btn btn-sm btn-danger">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="8" class="text-center" style="padding: 40px; color: var(--text-light);">Nenhum item no checklist.</td></tr>';
        
        const entregues = this.data.checklist.filter(c => c.entregue).length;
        const total = this.data.checklist.length;
        document.getElementById('checklist-subtitle').textContent = `${entregues}/${total} documentos entregues (${total > 0 ? Math.round((entregues/total)*100) : 0}%)`;
    }

    toggleChecklist(id) {
        const item = this.data.checklist.find(c => c.id === id);
        if (item) {
            item.entregue = !item.entregue;
            if (item.entregue && !item.data_entrega) {
                item.data_entrega = new Date().toISOString().split('T')[0];
            }
            this.saveData();
            this.renderChecklist();
            this.renderDashboard();
        }
    }

    updateChecklistDate(id, date) {
        const item = this.data.checklist.find(c => c.id === id);
        if (item) {
            item.data_entrega = date;
            this.saveData();
        }
    }

    renderEquipe() {
        const container = document.getElementById('equipe-grid');
        container.innerHTML = this.data.equipe.map(m => `
            <div class="member-card">
                <div class="member-header">
                    <div class="member-avatar">${m.nome.charAt(0).toUpperCase()}</div>
                    <div class="member-info">
                        <h4>${m.nome}</h4>
                        <span>${m.departamento}</span>
                    </div>
                </div>
                <div class="member-contact">
                    <div>📧 ${m.email}</div>
                    ${m.telefone ? `<div>📱 ${m.telefone}</div>` : ''}
                </div>
                <div class="member-actions">
                    <button onclick="app.editMembro(${m.id})" class="btn btn-sm btn-outline">✏️ Editar</button>
                    <button onclick="app.deleteMembro(${m.id})" class="btn btn-sm btn-danger">🗑️</button>
                </div>
            </div>
        `).join('') || '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light);">Nenhum membro cadastrado.</p>';
    }

    openModal(type, id = null) {
        this.modalMode = type;
        this.modalData = id ? this.getItemByType(type, id) : null;
        
        const modal = document.getElementById('modal-crud');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        modal.classList.remove('hidden');
        
        switch(type) {
            case 'projeto':
                title.textContent = id ? 'Editar Projeto' : 'Configurar Projeto';
                body.innerHTML = this.formProjeto();
                break;
            case 'empresa':
                title.textContent = id ? 'Editar Empresa' : 'Nova Empresa';
                body.innerHTML = this.formEmpresa();
                break;
            case 'tarefa':
                title.textContent = id ? 'Editar Tarefa' : 'Nova Tarefa';
                body.innerHTML = this.formTarefa();
                break;
            case 'checklist-item':
                title.textContent = id ? 'Editar Item' : 'Novo Item do Checklist';
                body.innerHTML = this.formChecklist();
                break;
            case 'membro':
                title.textContent = id ? 'Editar Membro' : 'Novo Membro';
                body.innerHTML = this.formMembro();
                break;
        }
    }

    closeModal() {
        document.getElementById('modal-crud').classList.add('hidden');
        this.modalMode = null;
        this.modalData = null;
    }

    saveModal() {
        const form = document.getElementById('modal-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        switch(this.modalMode) {
            case 'projeto':
                this.data.projeto = { ...this.data.projeto, ...data };
                this.updateProjectInfo();
                break;
            case 'empresa':
                if (this.modalData) {
                    const idx = this.data.empresas.findIndex(e => e.id === this.modalData.id);
                    if (idx >= 0) this.data.empresas[idx] = { ...this.modalData, ...data, id: this.modalData.id };
                } else {
                    const newId = Math.max(0, ...this.data.empresas.map(e => e.id)) + 1;
                    this.data.empresas.push({ ...data, id: newId, status: 'Ativa' });
                }
                this.populateEmpresaSelects();
                this.renderEmpresas();
                break;
            case 'tarefa':
                if (this.modalData) {
                    const idx = this.data.tarefas.findIndex(t => t.id === this.modalData.id);
                    if (idx >= 0) {
                        this.data.tarefas[idx] = { 
                            ...this.modalData, 
                            ...data, 
                            id: this.modalData.id,
                            percentual: parseInt(data.percentual) || 0,
                            empresa_id: parseInt(data.empresa_id) || null
                        };
                    }
                } else {
                    const newId = Math.max(0, ...this.data.tarefas.map(t => t.id)) + 1;
                    this.data.tarefas.push({ 
                        ...data, 
                        id: newId, 
                        codigo: `T${String(newId).padStart(3, '0')}`,
                        percentual: parseInt(data.percentual) || 0,
                        empresa_id: parseInt(data.empresa_id) || null
                    });
                }
                this.renderTarefas();
                break;
            case 'checklist-item':
                if (this.modalData) {
                    const idx = this.data.checklist.findIndex(c => c.id === this.modalData.id);
                    if (idx >= 0) {
                        this.data.checklist[idx] = { 
                            ...this.modalData, 
                            ...data, 
                            id: this.modalData.id,
                            empresa_id: parseInt(data.empresa_id) || null
                        };
                    }
                } else {
                    const newId = Math.max(0, ...this.data.checklist.map(c => c.id)) + 1;
                    this.data.checklist.push({ 
                        ...data, 
                        id: newId, 
                        entregue: false,
                        empresa_id: parseInt(data.empresa_id) || null
                    });
                }
                this.renderChecklist();
                break;
            case 'membro':
                if (this.modalData) {
                    const idx = this.data.equipe.findIndex(m => m.id === this.modalData.id);
                    if (idx >= 0) this.data.equipe[idx] = { ...this.modalData, ...data, id: this.modalData.id };
                } else {
                    const newId = Math.max(0, ...this.data.equipe.map(m => m.id)) + 1;
                    this.data.equipe.push({ ...data, id: newId });
                }
                this.renderEquipe();
                break;
        }
        
        this.saveData();
        this.closeModal();
        this.renderDashboard();
    }

    formProjeto() {
        const p = this.modalData || this.data.projeto;
        return `
            <form id="modal-form">
                <div class="form-group">
                    <label class="form-label">Nome do Projeto</label>
                    <input type="text" name="nome" class="form-input" value="${p.nome || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Cliente</label>
                    <input type="text" name="cliente" class="form-input" value="${p.cliente || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Consultoria/Empresa Responsável</label>
                    <input type="text" name="consultoria" class="form-input" value="${p.consultoria || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Período</label>
                    <input type="text" name="periodo" class="form-input" value="${p.periodo || ''}" placeholder="Ex: Abril/2026 - Junho/2026">
                </div>
                <div class="form-group">
                    <label class="form-label">Duração</label>
                    <input type="text" name="duracao" class="form-input" value="${p.duracao || ''}" placeholder="Ex: 12 semanas">
                </div>
                <div class="form-group">
                    <label class="form-label">Data de Início</label>
                    <input type="date" name="data_inicio" class="form-input" value="${p.data_inicio || ''}">
                </div>
            </form>
        `;
    }

    formEmpresa() {
        const e = this.modalData || {};
        return `
            <form id="modal-form">
                <div class="form-group">
                    <label class="form-label">Razão Social *</label>
                    <input type="text" name="nome" class="form-input" value="${e.nome || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">CNPJ</label>
                    <input type="text" name="cnpj" class="form-input" value="${e.cnpj || ''}" placeholder="00.000.000/0000-00">
                </div>
                <div class="form-group">
                    <label class="form-label">Estado</label>
                    <select name="estado" class="form-select">
                        <option value="">Selecione...</option>
                        ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf => 
                            `<option value="${uf}" ${e.estado === uf ? 'selected' : ''}>${uf}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Nº de Funcionários</label>
                    <input type="number" name="funcionarios" class="form-input" value="${e.funcionarios || ''}">
                </div>
            </form>
        `;
    }

    formTarefa() {
        const t = this.modalData || {};
        const empresasOptions = this.data.empresas.map(e => 
            `<option value="${e.id}" ${t.empresa_id == e.id ? 'selected' : ''}>${e.nome}</option>`
        ).join('');
        
        return `
            <form id="modal-form">
                <div class="form-group">
                    <label class="form-label">Tarefa *</label>
                    <input type="text" name="tarefa" class="form-input" value="${t.tarefa || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Empresa</label>
                    <select name="empresa_id" class="form-select">
                        <option value="">Selecione...</option>
                        ${empresasOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Departamento</label>
                    <select name="departamento" class="form-select">
                        ${['Folha de Pagamento','Contábil','Fiscal','Financeiro','Legal','Outros'].map(d => 
                            `<option value="${d}" ${t.departamento === d ? 'selected' : ''}>${d}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Responsável</label>
                    <input type="text" name="responsavel" class="form-input" value="${t.responsavel || ''}">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">Data Início</label>
                        <input type="date" name="inicio" class="form-input" value="${t.inicio ? this.convertDate(t.inicio) : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Data Fim</label>
                        <input type="date" name="fim" class="form-input" value="${t.fim ? this.convertDate(t.fim) : ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Progresso (%)</label>
                    <input type="range" name="percentual" class="form-input" min="0" max="100" value="${t.percentual || 0}" oninput="document.getElementById('pct-value').textContent = this.value + '%'">
                    <div style="text-align: center; margin-top: 4px; font-weight: 600;" id="pct-value">${t.percentual || 0}%</div>
                </div>
            </form>
        `;
    }

    formChecklist() {
        const c = this.modalData || {};
        const empresasOptions = this.data.empresas.map(e => 
            `<option value="${e.id}" ${c.empresa_id == e.id ? 'selected' : ''}>${e.nome}</option>`
        ).join('');
        
        return `
            <form id="modal-form">
                <div class="form-group">
                    <label class="form-label">Documento *</label>
                    <input type="text" name="documento" class="form-input" value="${c.documento || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Categoria</label>
                    <select name="categoria" class="form-select">
                        ${['FOLHA','CONTÁBIL','FISCAL','TRABALHISTA','SOCIETÁRIO','OUTROS'].map(cat => 
                            `<option value="${cat}" ${c.categoria === cat ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Empresa</label>
                    <select name="empresa_id" class="form-select">
                        <option value="">Todas</option>
                        ${empresasOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Responsável</label>
                    <input type="text" name="responsavel" class="form-input" value="${c.responsavel || 'Cliente'}">
                </div>
                <div class="form-group">
                    <label class="form-label">Observações</label>
                    <textarea name="observacoes" class="form-textarea">${c.observacoes || ''}</textarea>
                </div>
            </form>
        `;
    }

    formMembro() {
        const m = this.modalData || {};
        return `
            <form id="modal-form">
                <div class="form-group">
                    <label class="form-label">Nome *</label>
                    <input type="text" name="nome" class="form-input" value="${m.nome || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Departamento</label>
                    <input type="text" name="departamento" class="form-input" value="${m.departamento || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">E-mail</label>
                    <input type="email" name="email" class="form-input" value="${m.email || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Telefone</label>
                    <input type="text" name="telefone" class="form-input" value="${m.telefone || ''}">
                </div>
            </form>
        `;
    }

    getItemByType(type, id) {
        switch(type) {
            case 'empresa': return this.data.empresas.find(e => e.id === id);
            case 'tarefa': return this.data.tarefas.find(t => t.id === id);
            case 'checklist-item': return this.data.checklist.find(c => c.id === id);
            case 'membro': return this.data.equipe.find(m => m.id === id);
            default: return null;
        }
    }

    convertDate(dateStr) {
        if (!dateStr) return '';
        if (dateStr.includes('-')) return dateStr;
        const parts = dateStr.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dateStr;
    }

    editEmpresa(id) { this.openModal('empresa', id); }
    editTarefa(id) { this.openModal('tarefa', id); }
    editChecklist(id) { this.openModal('checklist-item', id); }
    editMembro(id) { this.openModal('membro', id); }

    deleteEmpresa(id) {
        if (confirm('Tem certeza que deseja excluir esta empresa?')) {
            this.data.empresas = this.data.empresas.filter(e => e.id !== id);
            this.data.tarefas.forEach(t => { if (t.empresa_id === id) t.empresa_id = null; });
            this.data.checklist.forEach(c => { if (c.empresa_id === id) c.empresa_id = null; });
            this.saveData();
            this.renderEmpresas();
            this.populateEmpresaSelects();
            this.renderDashboard();
            this.showToast('Empresa excluída com sucesso!', 'success');
        }
    }

    deleteTarefa(id) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.data.tarefas = this.data.tarefas.filter(t => t.id !== id);
            this.saveData();
            this.renderTarefas();
            this.renderDashboard();
            this.showToast('Tarefa excluída com sucesso!', 'success');
        }
    }

    deleteChecklist(id) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            this.data.checklist = this.data.checklist.filter(c => c.id !== id);
            this.saveData();
            this.renderChecklist();
            this.renderDashboard();
            this.showToast('Item excluído com sucesso!', 'success');
        }
    }

    deleteMembro(id) {
        if (confirm('Tem certeza que deseja remover este membro?')) {
            this.data.equipe = this.data.equipe.filter(m => m.id !== id);
            this.saveData();
            this.renderEquipe();
            this.showToast('Membro removido com sucesso!', 'success');
        }
    }

    renderStatusBadge(status) {
        const classes = { 
            'PENDENTE': 'badge-pendente', 
            'EM ANDAMENTO': 'badge-andamento', 
            'CONCLUÍDO': 'badge-concluido'
        };
        return `<span class="badge ${classes[status] || 'badge-pendente'}">${status}</span>`;
    }

    editChecklistObs(id) {
        const item = this.data.checklist.find(c => c.id === id);
        if (!item) return;
        const novo = prompt('Observações:', item.observacoes || '');
        if (novo !== null) {
            item.observacoes = novo;
            this.saveData();
            this.renderChecklist();
        }
    }

    exportarExcel() {
        const wb = XLSX.utils.book_new();
        wb.Props = {
            Title: this.data.projeto.nome,
            Subject: "Dashboard Contábil",
            Author: this.data.projeto.consultoria,
            CreatedDate: new Date()
        };

        const resumoData = [
            ['DASHBOARD CONTÁBIL - RELATÓRIO COMPLETO'],
            [''],
            ['PROJETO', this.data.projeto.nome],
            ['CLIENTE', this.data.projeto.cliente],
            ['CONSULTORIA', this.data.projeto.consultoria],
            ['PERÍODO', this.data.projeto.periodo],
            ['DURAÇÃO', this.data.projeto.duracao],
            ['DATA DE EMISSÃO', new Date().toLocaleDateString('pt-BR')],
            [''],
            ['RESUMO GERAL'],
            ['Total de Empresas', this.data.empresas.length],
            ['Total de Tarefas', this.data.tarefas.length],
            ['Tarefas Concluídas', this.data.tarefas.filter(t => t.percentual === 100).length],
            ['Progresso Médio', Math.round(this.data.tarefas.reduce((a,t) => a + t.percentual, 0) / (this.data.tarefas.length || 1)) + '%'],
            ['Itens no Checklist', this.data.checklist.length],
            ['Itens Entregues', this.data.checklist.filter(c => c.entregue).length]
        ];
        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

        const empresasData = [['ID', 'Razão Social', 'CNPJ', 'Estado', 'Funcionários', 'Status']];
        this.data.empresas.forEach(e => {
            empresasData.push([e.id, e.nome, e.cnpj, e.estado, e.funcionarios, e.status]);
        });
        const wsEmpresas = XLSX.utils.aoa_to_sheet(empresasData);
        XLSX.utils.book_append_sheet(wb, wsEmpresas, 'Empresas');

        const tarefasData = [['Código', 'Tarefa', 'Empresa', 'Departamento', 'Responsável', 'Início', 'Fim', 'Progresso', 'Status']];
        this.data.tarefas.forEach(t => {
            const emp = this.data.empresas.find(e => e.id == t.empresa_id);
            tarefasData.push([
                t.codigo || t.id,
                t.tarefa,
                emp ? emp.nome : '-',
                t.departamento,
                t.responsavel,
                t.inicio,
                t.fim,
                t.percentual + '%',
                t.percentual === 100 ? 'CONCLUÍDO' : t.percentual > 0 ? 'EM ANDAMENTO' : 'PENDENTE'
            ]);
        });
        const wsTarefas = XLSX.utils.aoa_to_sheet(tarefasData);
        XLSX.utils.book_append_sheet(wb, wsTarefas, 'Tarefas');

        const checklistData = [['Categoria', 'Documento', 'Empresa', 'Entregue', 'Data Entrega', 'Responsável', 'Observações']];
        this.data.checklist.forEach(c => {
            const emp = this.data.empresas.find(e => e.id == c.empresa_id);
            checklistData.push([
                c.categoria,
                c.documento,
                emp ? emp.nome : 'Todas',
                c.entregue ? 'SIM' : 'NÃO',
                c.data_entrega || '-',
                c.responsavel,
                c.observacoes || '-'
            ]);
        });
        const wsChecklist = XLSX.utils.aoa_to_sheet(checklistData);
        XLSX.utils.book_append_sheet(wb, wsChecklist, 'Checklist');

        const equipeData = [['Nome', 'Departamento', 'E-mail', 'Telefone']];
        this.data.equipe.forEach(m => {
            equipeData.push([m.nome, m.departamento, m.email, m.telefone]);
        });
        const wsEquipe = XLSX.utils.aoa_to_sheet(equipeData);
        XLSX.utils.book_append_sheet(wb, wsEquipe, 'Equipe');

        const fileName = `${this.data.projeto.nome.replace(/[^a-z0-9]/gi, '_')}_Relatorio_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.showToast('Excel exportado com sucesso!', 'success');
    }

    resetarDados() {
        if (confirm('⚠️ ATENÇÃO: Isso apagará TODOS os dados permanentemente! Deseja continuar?')) {
            if (confirm('Tem absoluta certeza? Esta ação não pode ser desfeita.')) {
                localStorage.removeItem('dashboard_contabil_data');
                this.data = this.getDefaultData();
                this.saveData();
                location.reload();
            }
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('dashboard_contabil_theme', next);
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login(
                    document.getElementById('login-email').value,
                    document.getElementById('login-password').value
                );
            });
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const page = link.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        const savedTheme = localStorage.getItem('dashboard_contabil_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }
}

const app = new DashboardContabil();
