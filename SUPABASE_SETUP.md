# Configuração Supabase - SuperABC

## 1. Criar conta no Supabase

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub
4. Crie uma nova organização

## 2. Criar Projeto

1. Clique em "New Project"
2. Nome: `superabc-transicao`
3. Senha do banco: (guarde bem!)
4. Região: São Paulo (sa-east-1)
5. Clique em "Create new project"

## 3. Criar Tabelas

Acesse o SQL Editor e execute:

```sql
-- Tabela de tarefas
CREATE TABLE tarefas (
    id TEXT PRIMARY KEY,
    tarefa TEXT NOT NULL,
    responsavel TEXT,
    inicio TEXT,
    fim TEXT,
    dias INTEGER,
    percentual INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDENTE',
    departamento TEXT,
    observacoes TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de checklist
CREATE TABLE checklist (
    id SERIAL PRIMARY KEY,
    categoria TEXT,
    documento TEXT NOT NULL,
    empresa TEXT,
    entregue BOOLEAN DEFAULT FALSE,
    data_entrega TEXT,
    responsavel TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de empresas
CREATE TABLE empresas (
    id INTEGER PRIMARY KEY,
    nome TEXT,
    cnpj TEXT,
    estado TEXT,
    funcionarios INTEGER,
    status TEXT
);

-- Enable Row Level Security
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Create policy (public access for demo)
CREATE POLICY "Allow all" ON tarefas FOR ALL USING (true);
CREATE POLICY "Allow all" ON checklist FOR ALL USING (true);
CREATE POLICY "Allow all" ON empresas FOR ALL USING (true);
```

## 4. Obter credenciais

1. Vá em Project Settings > API
2. Copie:
   - **URL:** https://xxxx.supabase.co
   - **anon public:** eyJ...

## 5. Integrar no código

Adicione no `index.html` antes dos scripts:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Crie `assets/js/supabase.js`:

```javascript
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_KEY = 'SUA_KEY_AQUI';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Funções CRUD
async function loadFromSupabase() {
    const { data: tarefas } = await supabase.from('tarefas').select('*');
    const { data: checklist } = await supabase.from('checklist').select('*');
    return { tarefas, checklist };
}

async function saveToSupabase(tabela, dados) {
    await supabase.from(tabela).upsert(dados);
}
```

## 6. Sync automático

Modifique o `app.js` para sincronizar:

```javascript
// Após saveData()
async syncWithSupabase() {
    await saveToSupabase('tarefas', this.data.tarefas);
    await saveToSupabase('checklist', this.data.checklist);
}
```

## 7. Deploy

### Vercel (com Supabase)

1. `npm i -g vercel`
2. `vercel --prod`
3. Adicione variáveis de ambiente no dashboard

### Netlify

1. Faça upload dos arquivos
2. Adicione variáveis em Site Settings > Build & Deploy > Environment

---

**Nota:** Para uso offline-first, o sistema já usa LocalStorage.
O Supabase adiciona sincronização em nuvem quando houver conexão.
