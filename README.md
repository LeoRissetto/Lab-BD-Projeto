O Projeto Lar Temporário é uma iniciativa criada para apoiar uma ONG de São Carlos reconhecida pelo acolhimento e cuidado de gatos resgatados. A plataforma organiza processos de adoção, lares temporários, voluntariado e doações, ajudando a transformar resgates em novas histórias de família.

**Visão Geral**
Plataforma completa para gestão de resgates, lares temporários e adoções de gatos, com:
1. Frontend público para conhecer gatos disponíveis e registrar interesse de adoção.
2. Painel administrativo para gestão operacional, financeira e de eventos.
3. Backend FastAPI com integração ao PostgreSQL via Supabase e rotinas SQL avançadas.

**Principais Funcionalidades**
- Catálogo público de gatos disponíveis para adoção.
- Formulário de interesse em adoção com envio de dados e URLs de fotos para triagem.
- Gestão administrativa de gatos, adoções, triagens, voluntários, veterinários, lares temporários, gastos, doações e eventos.
- Relatórios analíticos com ROLLUP, GROUPING SETS, Window Functions, funções PL/pgSQL e cursores.
- Dashboard com indicadores e logs recentes.

**Arquitetura**
- `frontend/`: Next.js (App Router) com Tailwind CSS e integração com Supabase.
- `backend/`: FastAPI com acesso ao PostgreSQL via `psycopg` e conexão gerenciada por pool.

**Stack**
- Frontend: Next.js 16, React 19, Tailwind CSS 4, Recharts, Radix UI.
- Backend: FastAPI, Uvicorn, psycopg (pool), Supabase SDK, python-dotenv.
- Banco: PostgreSQL (via Supabase).

**Estrutura de Pastas**
- `backend/`
- `backend/main.py`: registra todos os routers.
- `backend/routers/`: módulos REST por domínio (gatos, adoções, triagem, etc).
- `backend/database.py`: pool de conexões e helpers de query.
- `backend/supabase_client.py`: client do Supabase para healthcheck.
- `frontend/`
- `frontend/app/`: páginas públicas e administrativas.
- `frontend/lib/`: helpers de API, auth local, Supabase SSR/Browser.

**Variáveis de Ambiente**

Backend (`backend/`):
- `SUPABASE_DB_URL` (obrigatória): conexão PostgreSQL.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (para healthcheck Supabase).

Frontend (`frontend/`):
- `NEXT_PUBLIC_BACKEND_URL` ou `BACKEND_URL` (base do FastAPI).
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (helpers Supabase).

**Como Rodar Localmente**

Backend:
1. `cd backend`
2. Crie um `.env` com `SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Instale dependências: `pip install -r requirements.txt`
4. Inicie o servidor: `uvicorn main:app --reload`

Frontend:
1. `cd frontend`
2. Crie `.env.local` com `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Instale dependências: `npm install`
4. Rode: `npm run dev`

**Rotas Principais do Backend**
- `/auth`: login e cadastro de usuários (Admin, Voluntário, Veterinário).
- `/gatos`: CRUD de gatos e consulta de endereços.
- `/adocoes`: registros e histórico de adoções.
- `/triagem`: triagens e fotos de adotantes.
- `/voluntarios`, `/veterinarios`, `/lares`: cadastros e gestão.
- `/gastos`, `/doacoes`, `/eventos`: financeiro e eventos.
- `/queries`: relatórios analíticos.
- `/logs/recentes`: auditoria de acesso.
- `/health/supabase`: verificação de conectividade com Supabase.

**Dependências de Banco**
O backend espera as seguintes estruturas no PostgreSQL:
- Tabelas principais: `gato`, `adocao`, `triagem`, `fotos_triagem`, `pessoa`, `adotante`, `voluntario`, `funcao`, `veterinario`, `lar_temporario`, `hospedagem`, `gasto`, `doacao`, `evento`, `participantes`, `users`, `log_table`, `endereco`, `campanha`.
- Funções e procedures: `fn_ranking_doadores()`, `fn_gasto_total_gato(...)`, `fn_resumo_gastos_cursor()`, procedure `registrar_adocao(...)`.
- View opcional: `vw_veterinarios_visao` (fallback automático se ausente).

**Observações**
- O frontend armazena o usuário autenticado localmente em `localStorage` (`lt_user`) e envia `X-User-Id` em todas as requisições.
- O painel administrativo requer login.

**Créditos**
Projeto desenvolvido a partir da matéria de Laborátório de Base de dados por: 
- Leonardo Rissetto
- Luciano Lopez 
- Pedro Zenatte
- Rauany Secci