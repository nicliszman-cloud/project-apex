# Política de Privacidade — rascunho pré-lançamento

Este documento é um rascunho técnico para o Project Apex e precisa de revisão jurídica antes da publicação comercial.

## Dados tratados

O aplicativo pode tratar dados de conta e perfil, localização informada manualmente (cidade/UF), carros e especificações, fotos e mídia, posts, comentários, curtidas, seguidores, eventos, anúncios do marketplace, mensagens diretas, matches, bloqueios, denúncias e dados técnicos necessários à operação.

## Finalidades

Os dados são usados para autenticação, funcionamento do perfil e garagem, descoberta de carros, feed social, mensagens, eventos, marketplace, segurança, prevenção de abuso e moderação.

## Visibilidade

Conteúdo publicado em perfis, carros, posts, eventos e marketplace pode ser visível a outros usuários autenticados. Mensagens diretas são limitadas aos participantes pela camada de autorização do banco.

## Controle do usuário

O usuário pode editar dados do perfil, bloquear outros usuários e excluir a própria conta pelo aplicativo. A arquitetura usa exclusão em cascata em diversos registros vinculados à conta.

## Armazenamento

O backend atual usa Supabase para autenticação, banco de dados e armazenamento de mídia.

## Antes do lançamento

Definir a entidade controladora, contato de privacidade, bases legais aplicáveis, prazos de retenção, fluxo LGPD para acesso/correção/portabilidade, fornecedores/subprocessadores, transferências internacionais e URL pública definitiva.
