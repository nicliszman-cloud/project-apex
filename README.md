# Project Apex

Rede social mobile para carros esportivos e performance: **Discover + Garage + Feed + Meets + Garage Match + Chat + Peças**.

## Estado atual — v0.3

### Conta e perfil
- autenticação real com Supabase
- perfil persistente, avatar e bio
- perfil público
- seguir usuários
- bloquear e denunciar
- recuperação de senha por deep link
- exclusão da própria conta

### Garagem
- cadastro técnico completo
- até 6 fotos por carro via Supabase Storage
- galeria do carro
- edição e exclusão do próprio carro

### Social
- feed real
- likes persistentes
- comentários
- edição/exclusão do próprio post
- notificações internas de follow, comentário e match
- filtros no Discover por categoria, marca/modelo e potência
- bloqueios aplicados também por RLS
- Garage Match por curtida mútua
- chat persistente com Supabase Realtime

### Eventos
- criação de meets/eventos
- confirmação de presença
- tela de detalhes
- edição básica e exclusão pelo organizador

### Marketplace inicial
- vendo / troco / procuro
- foto da peça
- preço
- categoria
- compatibilidade
- cidade/UF
- associação opcional a um carro
- busca e filtros

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
npx expo start -c
```

## Banco de dados

Quem já executou o schema inicial e a migration v0.2 deve executar apenas:

```text
supabase/migrations/20260921_apex_community_marketplace.sql
```

no SQL Editor do Supabase.

## Recuperação de senha

Em **Supabase → Authentication → URL Configuration**, adicione aos Redirect URLs:

```text
projectapex://reset-password
```

## Variáveis locais

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_PUBLISHABLE_KEY
```

Nunca use uma service-role key no aplicativo cliente.

## Ainda necessário antes de lançamento público

O núcleo do MVP está funcional, mas publicação comercial ainda exige trabalho operacional e de loja: política de privacidade/LGPD, termos/regras da comunidade, processo/painel de moderação, notificações push, testes E2E, analytics/crash reporting, assets definitivos, builds de produção e submissão às lojas.
