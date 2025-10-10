# Instruções de Deploy para Firebase Hosting

## Pré-requisitos
1. Instale o Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Faça login no Firebase:
   ```bash
   firebase login
   ```

## Configuração do CORS para Firebase Storage

**IMPORTANTE**: O erro de upload está ocorrendo devido às configurações de CORS do Firebase Storage. Para resolver:

1. Instale o Google Cloud SDK:
   ```bash
   # No macOS:
   brew install google-cloud-sdk
   
   # No Linux:
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. Configure o CORS para o Firebase Storage:
   ```bash
   gsutil cors set cors.json gs://app-hinos.appspot.com
   ```

3. Verifique se o CORS foi aplicado:
   ```bash
   gsutil cors get gs://app-hinos.appspot.com
   ```

## Deploy do Firebase Hosting

1. Faça o build da aplicação:
   ```bash
   npm run build
   ```

2. Faça o deploy:
   ```bash
   firebase deploy
   ```

3. Deploy apenas do hosting (se necessário):
   ```bash
   firebase deploy --only hosting
   ```

## Configuração das Regras de Segurança

1. Deploy das regras do Storage:
   ```bash
   firebase deploy --only storage
   ```

2. Deploy das regras do Firestore:
   ```bash
   firebase deploy --only firestore
   ```

## Verificação do Deploy

Após o deploy, a aplicação estará disponível em:
- https://app-hinos.web.app
- https://app-hinos.firebaseapp.com

## Troubleshooting

### Erro de CORS
Se ainda houver erro de CORS após configurar:

1. Verifique se o bucket correto foi configurado:
   ```bash
   gsutil ls
   ```

2. Verifique as configurações atuais:
   ```bash
   gsutil cors get gs://app-hinos.appspot.com
   ```

3. Se necessário, remova e reconfigure:
   ```bash
   gsutil cors set cors.json gs://app-hinos.appspot.com
   ```

### Erro de Permissões
Se houver erro de permissões:

1. Verifique se as regras de segurança estão corretas
2. Teste a autenticação no console do Firebase
3. Verifique se o projeto está selecionado corretamente:
   ```bash
   firebase projects:list
   firebase use app-hinos
   ```

## Alternativa: Teste Local

Para testar localmente com Firebase Hosting:

1. Instale o Firebase CLI
2. Execute:
   ```bash
   npm run build
   firebase serve
   ```

Isso irá servir a aplicação localmente na porta 5050.
