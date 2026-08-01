# PassAi — Arquitetura de Software e Especificação Técnica

O PassAi é uma aplicação web progressiva (PWA) desenvolvida com Next.js e
TypeScript, projetada para execução 100% cliente e publicação no GitHub Pages.

[TOC]

## Visão geral da arquitetura

A arquitetura do PassAi adota o modelo de aplicação estática cliente (Zero-Server
Architecture). Todo o processamento de dados, controle de sessão, lógica de
interface e operações de criptografia ocorrem exclusivamente no ambiente de
execução do navegador do usuário.

```text
+-------------------------------------------------------------------+
|                        Navegador do Usuário                       |
|                                                                   |
|  +-------------------+   +------------------+   +--------------+  |
|  | Interface (React) |<->|  Camada Crypto   |<->| Armazenamento|  |
|  | Next.js + TS      |   | (Web Crypto API) |   | (IndexedDB)  |  |
|  +-------------------+   +------------------+   +--------------+  |
|            ^                      ^                     ^         |
+------------|----------------------|---------------------|---------+
             v                      v                     v
   +-------------------+  +-------------------+  +------------------+
   | PWA / Service Wkr |  | Criptografia AES  |  | Backup / Restore |
   | Offline First     |  | AES-GCM 256 bits  |  | Arquivos JSON    |
   +-------------------+  +-------------------+  +------------------+
```

## Stack tecnológica

### Core e infraestrutura

*   **Next.js (App Router):** framework React utilizado com o recurso de
    exportação estática (`output: 'export'`), gerando arquivos HTML, JS e CSS
    puros para hospedagem sem necessidade de servidor Node.js em runtime.
*   **TypeScript:** linguagem principal do projeto, garantindo tipagem forte
    para schemas de dados, cargas de criptografia e gerenciamento de estado.
*   **PWA (Progressive Web App):** suporte a Service Workers e Web App Manifest
    para permitir a instalação nativa do PassAi em dispositivos móveis e
    desktops, garantindo funcionamento completo sem acesso à internet.
*   **GitHub Pages:** infraestrutura de hospedagem e distribuição estática
    gratuita, integrada com GitHub Actions para automação de build e deploy.

### Criptografia e segurança nativa

*   **Web Crypto API (`window.crypto.subtle`):** API nativa do navegador para
    derivação de chaves via PBKDF2 (100.000+ iterações SHA-256) e criptografia
    simétrica AES-GCM de 256 bits com Vetor de Inicialização (IV) aleatório de
    96 bits.

## Estrutura de módulos e pastas

```text
src/
├── app/                        # Páginas e layouts da aplicação Next.js
│   ├── layout.tsx              # Layout raiz com suporte a PWA e tema escuro
│   ├── page.tsx                # Ponto de entrada do cofre
│   └── globals.css             # Estilos globais e tokens de design
├── components/                 # Componentes de interface (UI)
│   ├── auth/                   # Autenticação por Senha Mestra
│   ├── vault/                  # Navegação por pastas, cards e modais
│   ├── tools/                  # Gerador de senhas e auditoria
│   └── backup/                 # Gerenciador de importação/exportação JSON
├── crypto/                     # Motor de criptografia pura
│   ├── pbkdf2.ts               # Derivação de chaves a partir de senhas
│   └── cipher.ts               # Encriptação e decriptação AES-GCM
├── services/                   # Serviços de dados e armazenamento
│   ├── storageService.ts       # Persistência local (LocalStorage/IndexedDB)
│   ├── folderService.ts        # Gerenciamento de pastas e validação de PINs
│   └── backupService.ts        # Leitura e geração de arquivos JSON
├── types/                      # Definições de tipos TypeScript
│   ├── vault.ts                # Interfaces de credenciais e pastas
│   └── crypto.ts               # Schemas de dados criptografados
└── utils/                      # Utilitários auxiliares
    ├── passwordGen.ts          # Algoritmo de geração randômica segura
    └── clipboard.ts            # Cópia segura com limpeza da área de transferência
```

## Modelo de dados e segurança

### Fluxo de criptografia de dupla camada

1.  **Cofre geral (Camada 1):**
    *   A Senha Mestra gera uma Chave Principal (Master Key) via PBKDF2 com Salt
        aleatório.
    *   O cofre principal é descriptografado e mantido apenas em memória RAM
        durante a sessão ativa.
2.  **Pastas protegidas (Camada 2):**
    *   Ao marcar uma pasta para exigir proteção adicional, uma nova Chave de
        Pasta (Folder Key) é derivada da Senha/PIN daquela pasta.
    *   Os registros internos recebem uma segunda camada de criptografia
        AES-GCM, sendo descriptografados apenas mediante o fornecimento do PIN
        correto.

### Estrutura do arquivo de backup JSON

O backup exportado em JSON segue um schema validado por TypeScript:

```json
{
  "version": "1.0.0",
  "exportedAt": "2026-08-01T18:00:00.000Z",
  "isEncrypted": true,
  "vault": {
    "salt": "base64-salt-data",
    "iv": "base64-iv-data",
    "ciphertext": "base64-encrypted-vault-payload"
  }
}
```

## Estratégia de deploy no GitHub Pages

Para publicar a aplicação estática no GitHub Pages:

1.  **Configuração de Build (`next.config.mjs`):**
    *   Definição de `output: 'export'`.
    *   Desativação da otimização dinâmica de imagens (`images: { unoptimized: true }`).
2.  **Automação via GitHub Actions:**
    *   Workflow configurado para executar `npm run build` ao realizar push na
        branch `main`.
    *   Publicação automática dos artefatos estáticos da pasta `out/` no GitHub
        Pages.
