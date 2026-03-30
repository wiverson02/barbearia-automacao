# Automação para barbearia

Stack: **Vite + JavaScript (ES modules) + Tailwind** no frontend; **Node + Express + SQLite (`better-sqlite3`)** no backend.

## Como rodar

Abra dois terminais na pasta do projeto `barbearia-automacao`.

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

A API sobe em `http://localhost:3001`. O banco fica em `backend/data/barber.db`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (geralmente `http://localhost:5173`). O proxy encaminha `/api` para o backend.

## O que já existe

- Clientes (CRUD básico na interface; excluir na lista)
- Agendamentos (serviço e observações livres; duração opcional)
- Assinaturas mensais por cliente (valor pode mudar ao editar a assinatura pela API; tela de criação)
- Pagamentos PIX **simulados** (competência `YYYY-MM`, txId/comprovante opcionais)
- Painel financeiro por cliente (`#/clients/<id>/finance`) com **pago / pendente / atrasado**
- Dashboard com resumo geral

## Próximos passos (aprendizado)

- Tela para **editar** assinatura e cliente sem usar só a API
- Validações e mensagens de sucesso (toast) no lugar de `alert`
- Autenticação simples, se um dia for para produção
