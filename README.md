# Project Apex

Rede social mobile para carros esportivos e performance: **Discover + Garage + Feed + Meets + Garage Match + Chat**.

## Estado atual — v0.2

- autenticação real com Supabase
- perfil persistente e foto de perfil
- garagem real
- cadastro técnico de carro
- até 6 fotos por carro via Supabase Storage
- galeria no perfil do carro
- feed real com criação de posts e curtidas
- criação de eventos e confirmação de presença
- swipe real: curtir, passar e salvar
- Garage Match quando a curtida é mútua
- lista de matches
- chat persistente com Supabase Realtime
- modo demo separado da conta real
- Row Level Security no banco e políticas de Storage

## Stack

- Expo SDK 57 / React Native 0.86
- Expo Router
- TypeScript
- Expo Image Picker
- Supabase Auth, Postgres, Storage e Realtime

## Atualizar e rodar

```bash
git pull origin main
npm install
npx expo start
```

## Banco de dados

A base inicial está em:

```text
supabase/schema.sql
```

A evolução social/Storage da v0.2 está em:

```text
supabase/migrations/20260921_apex_social.sql
```

Em um projeto que já recebeu o `schema.sql`, execute somente a migration acima no **Supabase SQL Editor** antes de abrir a v0.2.

## Variáveis locais

Crie `.env` a partir de `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_PUBLISHABLE_KEY
```

Nunca coloque uma service-role key no aplicativo.

## Próximas etapas para produção

Antes de publicar nas lojas ainda faltam itens de produto/operação, como recuperação de senha, notificações push, comentários, filtros avançados, exclusão de conta/dados, moderação operacional, termos, política de privacidade, testes E2E e builds de produção.
