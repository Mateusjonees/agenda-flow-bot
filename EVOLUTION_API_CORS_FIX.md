# CORREÇÃO URGENTE: CORS na Evolution API

## Problema
Frontend rodando em `http://localhost:8080` ou `https://seu-dominio.vercel.app` não consegue fazer requests para `http://72.60.155.81:8080` por causa de CORS.

## Solução

### 1. SSH na VPS e editar .env da Evolution API

```bash
ssh root@72.60.155.81
cd /root/evolution-api
nano .env
```

### 2. Adicionar/alterar estas linhas no .env:

```env
# CORS Configuration
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_CREDENTIALS=true
```

**OU** se quiser restringir apenas para seu domínio:

```env
CORS_ORIGIN=http://localhost:8080,https://seu-dominio.vercel.app
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_CREDENTIALS=true
```

### 3. Reiniciar PM2

```bash
pm2 restart evolution-api --update-env
pm2 logs evolution-api --lines 20
```

### 4. Testar CORS

No navegador, abra DevTools Console e execute:

```javascript
fetch('http://72.60.155.81:8080/', {
  headers: {
    'apikey': 'vh123A1SkFhtjP2rwTBdUSqr0sKcpgTztuwWNaCurfA='
  }
}).then(r => r.json()).then(console.log)
```

Se retornar dados sem erro CORS = funcionou! ✅

## Alternativa: Usar Edge Function como Proxy

Se CORS continuar bloqueando, criar Edge Function no Supabase que faz proxy:

```typescript
// supabase/functions/evolution-proxy/index.ts
serve(async (req) => {
  const { endpoint, method, body } = await req.json();
  
  const response = await fetch(`http://72.60.155.81:8080${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'vh123A1SkFhtjP2rwTBdUSqr0sKcpgTztuwWNaCurfA=',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return new Response(await response.text(), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Frontend chama Edge Function ao invés de Evolution API diretamente.
