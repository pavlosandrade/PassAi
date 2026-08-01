# PassAi — Resumo Executivo e Guia de Contexto para I.A.

Este documento consolida a visão funcional e a arquitetura técnica do PassAi para servir de referência rápida a assistentes de Inteligência Artificial.

[TOC]

> [!IMPORTANT]
> **REGRA OBRIGATÓRIA DE GOVERNANÇA PARA ASSISTENTES DE I.A.**
>
> Toda e qualquer I.A. que realizar modificações, adições de código ou refatorações neste repositório **DEVE OBRIGATORIAMENTE** manter atualizados os três arquivos de documentação do projeto:
>
> 1. [context.md](context.md): regras de negócio, escopo funcional e UX.
> 2. [architecture.md](architecture.md): arquitetura, stack técnica e dados.
> 3. [SUMMARY.md](SUMMARY.md): resumo executivo e índice de governança.

## Status do Projeto (Concluído — 100%)

Todas as **6 Etapas de Desenvolvimento** foram implementadas e validadas:
- **Etapa 1**: Infraestrutura Next.js (App Router), TypeScript, PWA Manifest/SW e Design System.
- **Etapa 2**: Motor Criptográfico (PBKDF2 SHA-256 + AES-GCM 256 bits via Web Crypto API).
- **Etapa 3**: Serviços de Persistência Local (IndexedDB/LocalStorage), Pastas e Utilitários de Segurança.
- **Etapa 4**: Interface de Autenticação Mestra, Login e Guardião de Inatividade (5 min).
- **Etapa 5**: Cofre Completo, Credenciais Mascaradas, Cópia Temporária de 15s e Pastas Protegidas por PIN.
- **Etapa 6**: Gerador de Senhas Standalone, Gerenciador de Backup JSON e Workflow de Deploy GitHub Pages.

## O que é o PassAi

O **PassAi** é um gerenciador de senhas pessoal 100% local, seguro e offline. Ele permite armazenar credenciais em pastas personalizadas com opção de proteção por dupla camada de criptografia em pastas sensíveis, além de exportação e importação de backups em formato JSON.

Para a visão funcional detalhada, consulte o [context.md](context.md).

## Resumo das funcionalidades principais

* **Autenticação Mestra:** login local via Senha Mestra Zero-Knowledge com trancamento automático por inatividade.
* **Gerenciamento por Pastas:** organização flexível de credenciais com badges e contadores.
* **Dupla Proteção em Pastas Sensíveis:** PIN/Senha secundário opcional por pasta com segunda camada de criptografia AES-256.
* **Cópia Segura com Auto-limpeza:** cópia temporária para a área de transferência com expiração em 15 segundos.
* **Gerador e Auditor de Senhas:** criação de senhas fortes com alta entropia e diagnóstico visual.
* **Backup e Restauração JSON:** exportação/importação criptografada ou em texto simples.

## Resumo da stack técnica e arquitetura

* **Framework e Linguagem:** Next.js (App Router) + TypeScript.
* **Modelo de Deploy:** exportação estática (`output: 'export'`) para o GitHub Pages.
* **Modo de Operação:** Progressive Web App (PWA) 100% offline (Zero-Server Architecture).
* **Motor de Criptografia:** Web Crypto API (`AES-GCM` 256 bits + `PBKDF2` 100.000 iterações).
* **Persistência:** IndexedDB / LocalStorage no navegador do usuário.

Para a especificação técnica detalhada, consulte o [architecture.md](architecture.md).

## Estrutura rápida da documentação

1. [context.md](context.md) — Visão do produto, problemas resolvidos, regras de negócio e jornada do usuário.
2. [architecture.md](architecture.md) — Arquitetura de software, estrutura de pastas `src/`, fluxo de criptografia e deploy.
3. [SUMMARY.md](SUMMARY.md) — Este documento de resumo executivo e regras de governança para assistentes de I.A.
