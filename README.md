# FitFlow

Aplicativo pessoal de treino. Funciona 100% offline, sem login e sem nuvem.
Os dados ficam no próprio aparelho (IndexedDB, via Dexie).

## Tecnologias

React, Vite, TypeScript, TailwindCSS, Dexie.js, Zustand (instalado, ainda sem uso),
Recharts, React Router e Capacitor (para gerar o APK Android).

## Funcionalidades

- Biblioteca de exercícios (24 pré-cadastrados + os seus)
- Treinos (rotinas): criar, editar, duplicar e excluir
- Sessão ativa com timer de descanso (vibração e som). O estado sobrevive ao fechar o app
- Histórico com comparação "última vez"
- Progresso: gráficos de carga e volume, e recordes pessoais
- Backup: exportar e importar JSON

## Estrutura de pastas

```
src/
  components/   peças reutilizáveis (menu, modal, formulários)
  pages/        telas do app
  hooks/        hooks do React (ex.: relógio do timer)
  db/           banco de dados, sessões, histórico, progresso e backup
  types/        tipos TypeScript
  utils/        funções auxiliares (formatação, som, arquivos)
```

## Rodar no navegador (para testar)

Requisito: Node.js LTS instalado.

```powershell
cd C:\Users\gabri\Documents\Projetos\fitflow
npm install
npm run dev
```

Abra http://localhost:5173/ no Chrome. Para parar, aperte Ctrl + C.
Dica: F12 e o ícone de celular mostram o app em tamanho de celular.

## Gerar o APK

Requisito: Android Studio instalado.

```powershell
npm run build
npx cap sync android
npx cap open android
```

No Android Studio, espere o Gradle terminar e use:
Build > Generate App Bundles or APKs > Generate APKs.

O arquivo fica em:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Instalar no celular

1. Copie o `app-debug.apk` para o celular (cabo USB, Google Drive ou WhatsApp).
2. Toque no arquivo e permita a instalação de fontes desconhecidas.
3. Se o Play Protect avisar, toque em "Mais detalhes" e "Instalar mesmo assim".
4. Para atualizar, gere um novo APK e instale por cima (os dados são mantidos).

## Backup

Em Ajustes, use "Exportar backup" para salvar um arquivo .json e "Importar backup"
para restaurar. Desinstalar o app apaga todos os dados, então exporte antes.
