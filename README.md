# StreetClub

Rede social mobile para cultura automotiva, projetos, garages, meets, mensagens e peças.

## v0.5 — identidade StreetClub

A interface foi refatorada para uma linguagem visual preta e vermelha, premium e underground, mantendo a lógica existente do aplicativo.

Principais superfícies:
- Início social com posts reais e empty state
- Explorar carros, peças, usuários e eventos
- Garage Match preservado
- botão central de criação
- Mensagens diretas sem necessidade de match
- perfil social com garagem, posts, eventos e salvos
- página completa de cada projeto
- cadastro e edição de carros
- Meets e visualização de mapa
- Marketplace com mensagem para vendedor
- notificações, menu, configurações e ajuda
- SafeArea em navegação, comentários e chat
- ícones consistentes com Ionicons

## Atualizar

```bash
git pull origin main
npm install
npx expo start -c
```

## Banco

Se a migration de mensagens diretas ainda não foi executada no Supabase, rode:

```text
supabase/migrations/20260921_apex_direct_messages_media.sql
```

## Recuperação de senha

O esquema interno continua sendo:

```text
projectapex://reset-password
```

Mantenha esse endereço nos Redirect URLs do Supabase para não interromper o fluxo já configurado.

## Build

O projeto possui `eas.json` com perfis development, preview e production. A vinculação final à conta Expo e as credenciais das lojas dependem das contas do proprietário.

## Pré-lançamento

Consulte `docs/RELEASE_CHECKLIST.md` para os itens operacionais e de loja que ainda dependem de configuração externa.
