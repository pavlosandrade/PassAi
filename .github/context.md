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

1.  **Tela de Cadastro (`RegisterScreen.tsx`):** no primeiro acesso, o usuário cadastra seu **Nome**, **E-mail**, define sua **Senha Mestra**, **Dica de Senha** opcional e recebe sua **Chave de Recuperação de Emergência**.
2.  **Tela de Login (`LoginScreen.tsx`):** login rápido com senha mestra para o perfil cadastrado no dispositivo.
3.  **Tela de Recuperação (`RecoveryScreen.tsx`):** permite redefinir a Senha Mestra utilizando a **Chave de Recuperação de Emergência**, consultar a **Dica de Senha** ou **Restaurar um Backup JSON**.
4.  **Controle de sessão:** a aplicação tranca automaticamente por inatividade (5 minutos) ou ao ser fechada pelo usuário.

### Organização por pastas personalizáveis

*   **Estrutura de pastas:** agrupamento livre de credenciais (ex: Trabalho,
    Finanças, Redes Sociais).
*   **Personalização visual:** atribuição de nomes, ícones e identificadores
    visuais por pasta.
*   **Busca e filtros:** localização instantânea de registros por palavra-chave
    ou status de favorito.

### Dupla camada de segurança em pastas sensíveis

*   **Proteção opcional por pasta:** ao criar ou editar uma pasta, o usuário
    pode ativar uma Senha/PIN secundário.
*   **Acesso restrito:** pastas protegidas exigem a digitação do seu PIN
    específico para liberar a visualização e cópia das senhas contidas nela.

### Gerenciamento de credenciais

*   **Cadastro completo:** armazenamento de título, usuário/e-mail, senha,
    URL, pasta correspondente, notas e favoritos.
*   **Visualização segura:** mascaramento padrão de senhas com opção de
    revelação temporária.
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
*   **Restauração de dados:** importação e validação de backups armazenados em
    arquivos JSON.

## Regras de negócio e princípios

1.  **Privacidade absoluta:** o sistema opera no modelo zero-knowledge. Sem a
    Senha Mestra ou a senha da pasta protegida, os dados não podem ser
    desbloqueados.
2.  **Operação offline:** nenhuma informação ou telemetria é enviada para
    servidores externos.
3.  **Controle pelo usuário:** definição manual de quais pastas exigem camada
    extra de proteção.

## Jornada do usuário

1.  Abre a aplicação e digita sua Senha Mestra.
2.  Navega pelas pastas comuns ou acessa uma pasta protegida digitando o PIN.
3.  Cadastra ou gera novas senhas com suporte do gerador integrado.
4.  Copia dados com um clique para uso diário.
5.  Exporta backups em JSON periodicamente para garantir redundância local.
