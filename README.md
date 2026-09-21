# Project Apex

MVP de uma rede social para carros esportivos e performance: **Discover + Garage + Feed + Meets + Chat**.

## O que já funciona nesta entrega
- interface mobile em React Native/Expo
- modo demo sem backend
- swipe de carros no Discover
- Garage Match simulado (o BMW M3 da demo gera match)
- feed com curtidas
- eventos com confirmação de presença
- garagem + ficha técnica de carro
- formulário para adicionar carro localmente
- chat demo
- autenticação pronta para Supabase
- schema SQL com RLS para o backend inicial

## Stack
- Expo SDK 57
- React Native 0.86
- Expo Router
- TypeScript
- Supabase (Auth/Postgres/Storage/Realtime na evolução)

## Rodar no computador
1. Instale Node.js LTS e o Expo Go no celular.
2. Dentro desta pasta, rode `npm install`.
3. Rode `npx expo start`.
4. Faça login no Expo Go quando solicitado e escaneie o QR code.
5. Na tela inicial do app, toque em **Entrar no modo demo**.

## Ligar o Supabase
1. Crie um projeto em https://supabase.com.
2. No SQL Editor, execute `supabase/schema.sql`.
3. Copie `.env.example` para `.env`.
4. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Reinicie `npx expo start`.

> As credenciais públicas do cliente podem ficar no app, mas a segurança real deve ser garantida por RLS. Nunca coloque service-role key no aplicativo.

## Próximo passo de engenharia
Substituir o estado demo em `context/AppContext.tsx` por queries/mutations Supabase e adicionar upload de imagens via Storage.
