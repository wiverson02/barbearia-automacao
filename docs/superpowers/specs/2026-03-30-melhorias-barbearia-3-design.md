# Melhorias da Barbearia — Rodada 3

**Data:** 2026-03-30
**Objetivo:** Validação em assinaturas, filtro de clientes por nome, edição de agendamentos, e card de progresso financeiro no dashboard.

---

## Contexto

Com a Rodada 2 consolidada (modal, validações, loading state), esta rodada foca em completar lacunas funcionais: assinaturas ainda não têm validação de frontend, agendamentos só permitem criação (sem edição), clientes não têm busca, e o dashboard não mostra quanto se espera receber no mês.

---

## 1. Validação — `handlers/subscriptions.js`

### Campos obrigatórios

| Campo | Condição inválida | Mensagem |
|-------|------------------|----------|
| `clientId` | vazio ou `Number(clientId) <= 0` | `"Selecione um cliente"` |
| `valorMensal` | `<= 0` ou `NaN` | `"Informe um valor mensal válido"` |

### Padrão
`throw new Error(msg)` — capturado pelo listener de `submit` em `handlers/index.js` → `toast.error()`. Idêntico ao padrão já usado em `handlers/appointments.js` e `handlers/payments.js`.

### Aplica-se a
- `handleCreateSubscription`
- `handleUpdateSubscription`

### Arquivos modificados
| Ação | Arquivo |
|------|---------|
| Modificar | `frontend/src/handlers/subscriptions.js` |

---

## 2. Filtro de clientes por nome — `views/clients.js`

### Comportamento
- Input de busca no topo da seção "Lista" em `#/clients`
- Evento `oninput` chama `filterClients(value)` — função inline no HTML gerado
- Filtragem client-side: compara `textContent` da célula de nome com o valor digitado (case-insensitive, `toLowerCase`)
- Mostra/oculta linhas da `<tbody>` via `style.display`
- Zero requisições ao backend

### Estrutura do HTML adicionado
```
<input id="client-search" placeholder="Buscar por nome…" oninput="filterClients(this.value)" />
<script>
  function filterClients(q) {
    const term = q.toLowerCase();
    document.querySelectorAll('#clients-tbody tr[data-name]').forEach(tr => {
      tr.style.display = tr.dataset.name.toLowerCase().includes(term) ? '' : 'none';
    });
  }
</script>
```

Cada `<tr>` da tabela recebe `data-name="${escapeHtml(c.nome)}"` para a filtragem.

### Arquivos modificados
| Ação | Arquivo |
|------|---------|
| Modificar | `frontend/src/views/clients.js` |

---

## 3. Editar agendamentos — `#/appointments`

### Comportamento
- Botão **Editar** em cada linha da tabela (`data-action="edit-appointment"`, `data-id="${a.id}"`)
- Clicar busca `GET /api/appointments/:id` e popula o painel `#edit-appointment-wrap`
- Painel contém `form[data-form="update-appointment"]` com os mesmos campos do criar: `clientId` (select), `dataHora`, `servico`, `observacoes`, `duracaoMinutos`, `status`
- Botões "Salvar alterações" e "Cancelar"
- Salvar chama `PUT /api/appointments/:id` (já implementado no backend)
- Após salvar: oculta painel, reset do form, `toast.success("Agendamento atualizado!")`, `spa:refresh`

### Painel HTML (inserido abaixo do form de criação)
```
<div id="edit-appointment-wrap" class="mt-6 hidden ...">
  <h2>Editar agendamento</h2>
  <form data-form="update-appointment">
    <input type="hidden" name="id" />
    <!-- mesmos campos: clientId select, dataHora, servico, observacoes, duracaoMinutos, status -->
    <button type="submit">Salvar alterações</button>
    <button type="button" data-action="cancel-edit-appointment">Cancelar</button>
  </form>
</div>
```

### Novos handlers
- `handleUpdateAppointment(e)` — lê form, valida (clientId, dataHora, servico), chama `PUT /api/appointments/:id`
- `handleEditAppointment(btn)` — busca dados, popula form, exibe painel
- `handleCancelEditAppointment()` — reseta form, oculta painel

### Arquivos modificados
| Ação | Arquivo |
|------|---------|
| Modificar | `frontend/src/views/appointments.js` |
| Modificar | `frontend/src/handlers/appointments.js` |
| Modificar | `frontend/src/handlers/index.js` |

---

## 4. Dashboard — card "Recebido / Esperado" com barra de progresso

### Backend
`GET /api/dashboard/summary` adiciona `esperadoMes` na resposta: soma dos `valor_mensal` de todas as assinaturas com `ativo = 1`.

```js
const esperadoMes = subsAtivas.reduce((acc, s) => acc + (s.valor_mensal ?? 0), 0);
// incluído no res.json(...)
```

### Frontend
O card "Recebido no mês (PIX pago)" é substituído por um card com:
- Texto: `R$ X,XX recebido de R$ Y,YY esperado`
- Barra de progresso: largura = `Math.min(100, (recebido/esperado)*100)%`
- Cor da barra:
  - ≥ 100% → verde (`#22c55e`)
  - ≥ 50% → amarelo (`#f59e0b`)
  - < 50% → vermelho (`#ef4444`)
- Se `esperadoMes === 0`: exibe apenas o valor recebido sem barra (evita divisão por zero)

### Arquivos modificados
| Ação | Arquivo |
|------|---------|
| Modificar | `backend/src/routes/dashboard.js` |
| Modificar | `frontend/src/views/dashboard.js` |

---

## Verificação manual

Com backend e frontend rodando:

1. **Assinaturas:** `#/subscriptions` → salvar sem cliente ou sem valor → toast de erro correspondente
2. **Filtro:** `#/clients` → digitar parte de um nome → lista filtra em tempo real, sem reload
3. **Editar agendamento:** `#/appointments` → clicar Editar → painel aparece com dados preenchidos → alterar serviço → Salvar → toast verde e lista atualizada; clicar Cancelar fecha sem salvar
4. **Dashboard:** `#/` → card mostra valor recebido vs esperado com barra colorida
