# BRANCHING.md — Lei de Ambientes do Funnlio

> Este documento é LEI. Nenhuma exceção é aceita sem registro e aprovação explícita
> de todos os responsáveis técnicos. Violações resultam em rollback imediato.

---

## Os três ambientes

| Ambiente | Branch  | Quem acessa   | Propósito                        |
|----------|---------|---------------|----------------------------------|
| Produção | develop | Time de dev   | Desenvolvimento ativo e contínuo |
| Stage    | stage   | Time interno  | Validação antes do live          |
| Live     | main    | Clientes      | Somente código 100% validado     |

---

## Fluxo obrigatório — sem atalhos

```
feature/xyz  →  develop  →  stage  →  main
               (Produção)  (Stage)   (Live)
```

### Regra de ouro

**Nunca pule etapas.** `main` só recebe código que veio do `stage`.
`stage` só recebe código que veio do `develop`. Sem exceções.

---

## Como trabalhar no dia a dia

### 1. Começar uma nova feature ou correção

Sempre crie um branch a partir de `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feat/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 2. Enviar para Produção (develop)

Abra um PR de `feat/...` → `develop`.
- CI deve passar (type-check + build)
- Merge liberado sem review obrigatório

### 3. Enviar para Stage

Abra um PR de `develop` → `stage`.
- CI deve passar
- Exige 1 aprovação de review
- **Nunca abra PR de feature branch diretamente para stage**

### 4. Enviar para Live (main)

Abra um PR de `stage` → `main`.
- CI deve passar
- Exige 1 aprovação de review
- **O CI bloqueia PRs que não venham de `stage`**
- Depois do merge, crie uma tag de versão: `git tag vX.Y.Z`

---

## Nomenclatura de branches

| Tipo           | Padrão             | Exemplo                       |
|----------------|--------------------|-------------------------------|
| Feature        | `feat/descricao`   | `feat/onboarding-wizard`      |
| Bug fix        | `fix/descricao`    | `fix/trpc-provider-missing`   |
| Hotfix urgente | `hotfix/descricao` | `hotfix/login-crash`          |
| Chore / infra  | `chore/descricao`  | `chore/update-deps`           |

---

## Regras de segurança — o que NUNCA pode acontecer

### PROIBIDO em `stage` e `main`

- Push direto (sem PR) — bloqueado por branch protection no GitHub
- Merge sem CI verde — bloqueado por branch protection no GitHub
- Reverter um merge sem abrir issue documentando o motivo
- `git push --force` — jamais em branches protegidos

### PROIBIDO em qualquer branch

- Commitar arquivos `.env`, `.env.local`, `.env.production`
- Commitar credenciais, tokens, API keys, senhas
- Commitar arquivos de `node_modules/`, `dist/`, `.next/`
- Commit com mensagem vazia ou genérica (`"fix"`, `"update"`, `"wip"` sem contexto)

---

## Mensagens de commit — padrão obrigatório

Seguir **Conventional Commits**:

```
<tipo>(<escopo opcional>): <descrição curta>
```

**Exemplos:**
```
feat(auth): add Google OAuth login
fix(schema): change users.id from uuid to text
chore(deps): update better-auth to 1.2.0
refactor(trpc): add TRPCProvider to root layout
ci: add branch protection workflows
```

**Tipos válidos:** `feat` · `fix` · `chore` · `refactor` · `docs` · `style` · `test` · `ci`

---

## Hotfix — único fluxo de exceção

Quando um bug crítico é encontrado em `main` (Live):

```
hotfix/nome  →  main    (corrige o live imediatamente)
hotfix/nome  →  stage   (sincroniza o stage)
hotfix/nome  →  develop (sincroniza o develop)
```

1. Crie `hotfix/nome` a partir de `main`
2. Corrija o bug
3. PR para `main` com label `hotfix` — exige aprovação urgente do responsável técnico
4. Após merge em `main`, abra PRs idênticos para `stage` e `develop`
5. Crie tag de versão patch: `vX.Y.(Z+1)`

---

## Versionamento semântico

Toda merge em `main` deve ser acompanhada de uma tag:

```
v1.0.0  — versão inicial
v1.1.0  — nova feature adicionada
v1.1.1  — bug fix
v2.0.0  — breaking change
```

```bash
git tag -a v1.0.0 -m "Release v1.0.0: onboarding + login"
git push origin v1.0.0
```

---

## Resumo rápido para o dia a dia

```
1. git checkout develop && git pull
2. git checkout -b feat/minha-feature
3. ... trabalha ...
4. PR: feat/minha-feature → develop   (CI obrigatório)
5. PR: develop → stage                 (CI + 1 review)
6. Testa no stage, aprova
7. PR: stage → main                    (CI + 1 review)
8. git tag -a vX.Y.Z && git push origin vX.Y.Z
```
