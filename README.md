# Project Apex

Rede social mobile para carros esportivos e performance: **Discover + Garage + Feed + Meets + mensagens + Marketplace**.

## v0.4

- mensagens diretas independentes de Garage Match
- contato com vendedor diretamente pelo Marketplace
- caixa de entrada com não lidas
- chat Realtime com contexto de anúncio
- Garage Match continua existindo, mas não é necessário para conversar
- safe area inferior corrigida em comentários, chat e barra de abas
- renderização de mídia migrada para `expo-image`
- suporte a URL pública ou path do Supabase Storage
- fallback visual para mídia quebrada
- troca/adicionamento de fotos em carros já existentes
- gerenciamento de anúncios: reservado, vendido e excluir
- links de privacidade/termos no app
- configuração EAS inicial

## Atualizar

```bash
git pull origin main
npm install
npx expo start -c
```

## Banco

Depois das migrations v0.1–v0.3, execute somente:

```text
supabase/migrations/20260921_apex_direct_messages_media.sql
```

## Recuperação de senha

Em Supabase → Authentication → URL Configuration, mantenha:

```text
projectapex://reset-password
```

## Teste de fotos antigas

Abra **Garage → seu carro → Editar carro → Adicionar / trocar fotos**. Escolha até 6 fotos e salve. A primeira passa a ser a capa.

## Build

O arquivo `eas.json` já contém perfis development, preview e production. A associação do projeto à conta Expo ainda precisa ser feita com `eas init`, pois depende da conta do proprietário.

## Pré-lançamento

Veja `docs/RELEASE_CHECKLIST.md`. Política e termos atuais são rascunhos técnicos e precisam de revisão jurídica e URL pública antes de submissão às lojas.
