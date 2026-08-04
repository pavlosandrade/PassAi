# PassAi — Gerenciador de Senhas Local, Seguro e Personalizável

O PassAi é uma aplicação de gerenciamento de senhas e credenciais digitais
projetada para oferecer controle total, privacidade e operação offline.

[TOC]

## Visão geral e propósito

O objetivo do PassAi é permitir a criação de uma conta local para armazenar
senhas de forma organizada em pastas com proteção por camadas de segurança.
Toda a operação do sistema funciona de maneira 100% local no dispositivo do
usuário, eliminando a dependência de bancos de dados ou servidores externos.

## O problema que o PassAi resolve

Armazenar credenciais em arquivos de texto sem criptografia expõe informações a
vazamentos, enquanto soluções na nuvem exigem conexões constantes e confiança
em terceiros.

O PassAi resolve esse dilema com os seguintes pilares:

*   **Autonomia total:** os dados pertencem exclusivamente ao usuário e residem
    em seu próprio dispositivo.
*   **Organização clara:** separação de credenciais através de pastas visuais.
*   **Proteção gradativa:** níveis independentes de segurança para pastas de
    diferentes sensibilidades.
*   **Portabilidade simples:** funcionalidade de exportação e importação de
    backups em formato JSON.

## Funcionalidades principais

### Autenticação e acesso local

1.  **Tela de Cadastro (`RegisterScreen.tsx`):** no primeiro acesso, o usuário cadastra seu **Nome**, **E-mail**, define sua **Senha Mestra**, **Dica de Senha** opcional, escolhe o **Modo de Sincronização** (Local/Offline, Google Drive ou P2P WebRTC) e recebe sua **Chave de Recuperação de Emergência**.
2.  **Tela de Login (`LoginScreen.tsx`):** login rápido com senha mestra para o perfil cadastrado no dispositivo.
3.  **Tela de Recuperação (`RecoveryScreen.tsx`):** permite redefinir a Senha Mestra utilizando a **Chave de Recuperação de Emergência**, consultar a **Dica de Senha** ou **Restaurar um Backup JSON**.
4.  **Controle de sessão:** a aplicação tranca automaticamente por inatividade (5 minutos) ou ao ser fechada pelo usuário.

### Organização por pastas e subpastas dinâmicas

*   **Estrutura hierárquica livre:** criação dinâmica de pastas e subpastas aninhadas sem pastas fixas obrigatórias.
*   **Visualização em Cards de Pasta (`FolderCard.tsx`):** exibição de pastas e subpastas como cartões visuais interativos na grade principal, renderizados com a cor personalizada, ícone, badges de total de senhas/subpastas e atalhos rápidos.
*   **Trilha de Navegação Breadcrumb:** navegação por níveis (`Todas as Senhas > Pasta > Subpasta`) para facilidade de retorno e navegação em profundidade.
*   **Busca e navegação em árvore:** expansão e colapso de nós da árvore de pastas com contagem automática de credenciais (incluindo subpastas).

### Dupla camada de segurança em pastas e subpastas sensíveis

*   **Proteção opcional por PIN:** ao criar ou editar qualquer pasta ou subpasta, o usuário pode definir um PIN/Senha secundário exclusivo.
*   **Ocultação total pré-PIN:** credenciais de pastas/subpastas protegidas (ou com ancestrais protegidos) ficam 100% ocultas da listagem geral, dos favoritos e do painel até a validação do PIN.

### Sincronização Híbrida Zero-Knowledge (Multi-Dispositivo)

*   **Escolha no Cadastro & Ajuste a qualquer momento:** o usuário seleciona o modo de sincronização preferido na tela inicial de registro ou altera via modal de perfil/configurações da conta.
*   **Modo 1 — Apenas Local (Offline):** nenhum dado sai do navegador. Sincronização realizada estritamente por exportação/importação manual de arquivos JSON.
*   **Modo 2 — Google Drive Cloud Sync:** integração 100% client-side via OAuth2 (Google Identity Services) armazenando o cofre encriptado em pasta reservada e isolada (`appDataFolder`). Em produção, a sincronização funciona em 1-clique com Client ID oficial da aplicação, mantendo a opção manual restrita ao ambiente de desenvolvimento (`NODE_ENV === 'development'`).
*   **Modo 3 — P2P Direct Sync (WebRTC):** conexão direta entre dispositivos (ex: PC e Smartphone) via leitura de QR Code contendo oferta/token WebRTC, transferindo o cofre encriptado diretamente pelo navegador sem intermediários.
*   **Fusão Inteligente de Conflitos (`syncMergeService`):** resolução automática de divergências baseada nos timestamps das credenciais (`updatedAt`), preservando alterações sem sobrescrever dados.

### Gerenciamento de credenciais

*   **Campos Dinâmicos Flexíveis (0 a 5 por tipo):** suporte a múltiplos campos de E-mail, Nome de Usuário, CPF/CNPJ, Telefone e Endereço com opção de remover todos os campos para registrar apenas Título e Senha.
*   **Cadastro completo:** armazenamento de título, campos dinâmicos, senha, URL, pasta correspondente, notas e favoritos.
*   **Linhas dedicadas no cartão:** cada campo cadastrado possui sua própria linha estilizada com botão de cópia rápida em 1 clique.
*   **Menu de Conta & Gerador Pill com Destaque no Topo:** atalho do Gerador de Senhas em formato Pill com gradiente ciano, brilho e altura padronizada de 38px (alinhamento exato com o botão de dropdown da conta) no topo da aplicação.
*   **Design 100% Mobile-First & Grade Responsiva:** arquitetura completamente adaptável com menu gaveta deslizante (`vault-sidebar.is-open`), toolbar de busca e ações empilhadas verticalmente em mobile (`.body-toolbar`), prevenção de transbordamento horizontal de texto com `minWidth: 0` e `flex: 1` nos cartões de credenciais e conversão automática das grades (`folders-grid`, `credentials-grid`) em 1 coluna única para smartphones (`< 768px` e `< 480px`).
*   **Skeleton Loading Futurista:** carregamento otimizado com animações shimmer cyber (`@keyframes shimmer`, `.skeleton`) aplicadas em cartões de credenciais (`CredentialCardSkeleton`), pastas (`FolderCardSkeleton`) e tela completa (`VaultSkeletonLoader`), elevando a percepção de performance da aplicação.
*   **Tipografia Futurista e Elegante (Outfit):** toda a interface da aplicação utiliza a família de fontes **Outfit** (`--font-main: 'Outfit', sans-serif`) combinada com **JetBrains Mono** para senhas e hashes.
*   **Padronização 100% de Ícones com Lucide-React:** eliminação completa de emojis em textos, cartões e botões, utilizando vetores Lucide (`Clock`, `User`, `Star`, `Lock`, `FolderPlus`, etc.) em toda a interface.
*   **Arquitetura de Modais com Cabeçalho e Rodapé Fixos (Sticky):** padronização visual em todos os modais da aplicação (`CredentialFormModal`, `FolderFormModal`, `BackupManagerModal`, `PasswordGeneratorModal`, `ProtectedFolderModal`, `ConfirmModal`, `SyncSettingsModal`), mantendo o título, o botão de fechar e os botões de ação (Salvar/Cancelar) 100% visíveis no topo e no rodapé enquanto apenas o corpo do formulário faz rolagem.
*   **Estilização Padronizada de Selects Dropdown:** implementação de componente `<select class="input-field">` universal em CSS com fundo obsidian escuro, chevron customizado em vetor SVG ciano e opções de alto contraste totalmente visíveis e legíveis.
*   **Validação Visual da Aplicação (sem balões nativos):** desativação completa da validação HTML5 do navegador (`noValidate`) com alertas e destaque visual de bordas vermelhas (`var(--color-danger)`) nativos da UI do PassAi.
*   **Visualização segura:** mascaramento padrão de senhas com opção de revelação temporária.
*   **Cópia com auto-limpeza:** cópia rápida para a área de transferência com
    limpeza automática após 15 segundos.

### Gerador e auditoria de senhas

*   **Gerador avançado:** criação de senhas aleatórias fortes com tamanho e
    caracteres configuráveis.
*   **Diagnóstico de força:** indicador de vulnerabilidade para identificação de
    senhas fracas.

### Sistema de backup e restauração em JSON

*   **Backup criptografado (.json):** exportação de todo o cofre protegido pela
    Senha Mestra.
*   **Backup legível (.json):** exportação opcional em formato texto plano com
    aviso de segurança.
*   **Backup de Conta (.json):** exportação do perfil e chave de recuperação (LGPD) com criação/registro instantâneo da conta no dispositivo ao importar, direcionando o usuário direto para o login.
*   **Restauração de dados:** importação e validação inteligente de backups armazenados em arquivos JSON.

### Conformidade Legal, Privacidade e Termos de Serviço (LGPD / GDPR)

*   **Política de Privacidade Transparente (`PrivacyPolicyModal.tsx`):** declaração explícita do modelo Zero-Knowledge, Zero-Server e Zero-Telemetry, garantindo que o desenvolvedor do PassAi não coleta, não monitora, não rastreia e não armazena nenhuma informação pessoal, e-mail ou senha do usuário.
*   **Termos de Uso e Isenção de Responsabilidade (`TermsOfServiceModal.tsx`):** termos claros sobre a responsabilidade exclusiva do usuário de guardar a Senha Mestra e a Chave de Recuperação de Emergência, ressaltando que, pelo modelo de criptografia local, a equipe do PassAi não possui capacidade técnica para recuperar cofres com senhas perdidas.
*   **Conformidade com a Política de Dados do Usuário dos Serviços de API do Google:** uso do escopo restrito `drive.appdata` limitado estritamente à sincronização do cofre criptografado a pedido do próprio usuário.
*   **Acesso em Toda a Aplicação:** modais acessíveis na tela de cadastro (`RegisterScreen`), tela de login (`LoginScreen`), perfil (`AccountProfileModal`) e rodapé do cofre.

## Regras de negócio e princípios

1.  **Privacidade absoluta:** o sistema opera no modelo zero-knowledge. Sem a
    Senha Mestra ou a senha da pasta protegida, os dados não podem ser
    desbloqueados.
2.  **Operação offline:** nenhuma informação ou telemetria é enviada para
    servidores externos da aplicação.
3.  **Controle pelo usuário:** definição manual de quais pastas exigem camada
    extra de proteção e qual modalidade de sincronização utilizar.

## Jornada do usuário

1.  Abre a aplicação, lê a Política de Privacidade e Termos de Uso, realiza o cadastro escolhendo a modalidade de sincronização (Local, Google Drive ou WebRTC) ou digita sua Senha Mestra para login.
2.  Navega pelas pastas comuns ou acessa uma pasta protegida digitando o PIN.
3.  Cadastra ou gera novas senhas com suporte do gerador integrado.
4.  Sincroniza automaticamente (Google Drive) ou via leitura de QR Code (P2P WebRTC) com outros dispositivos cadastrados.
5.  Copia dados com um clique para uso diário.
6.  Exporta backups em JSON periodicamente para garantir redundância local.
