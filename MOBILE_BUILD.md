# 📱 Guia de Build Mobile - Foguete App

Este guia explica como gerar as versões mobile nativas do Foguete (APK para Android e IPA para iOS).

## 🚀 Opção 1: PWA (Progressive Web App) - Instalável pelo Navegador

**✅ Já está configurado e funcional!**

### Como instalar:

#### No Celular:
1. Acesse https://seu-dominio.com/download pelo celular
2. **iPhone/iPad**: Toque em Compartilhar (□⬆) → "Adicionar à Tela Inicial"
3. **Android**: Toque no menu (⋮) → "Instalar app" ou "Adicionar à tela inicial"

#### No Computador:
1. Acesse https://seu-dominio.com/download pelo navegador
2. **Chrome/Edge**: Clique no ícone ⊕ na barra de endereço
3. **Firefox**: Menu → "Instalar site como app"
4. **Safari (Mac)**: Arquivo → "Adicionar à Dock"

### Vantagens do PWA:
- ✅ Funciona em todos os dispositivos (iOS, Android, Windows, Mac, Linux)
- ✅ Instalação instantânea sem downloads
- ✅ Atualizações automáticas
- ✅ Funciona offline
- ✅ Sem necessidade de lojas de apps

---

## 📦 Opção 2: App Nativo (Capacitor) - APK/IPA Real

### Pré-requisitos:

- Node.js instalado (versão 18+)
- Git instalado
- **Para Android**: Android Studio instalado
- **Para iOS**: Mac com Xcode instalado

### Passos para Gerar o APK (Android):

1. **Exportar projeto do Lovable para Github**
   - Clique no botão "Export to Github" no Lovable
   - Faça git clone do repositório

2. **Instalar dependências**
   ```bash
   cd agenda-flow-bot
   npm install
   ```

3. **Adicionar plataforma Android**
   ```bash
   npx cap add android
   ```

4. **Build do projeto**
   ```bash
   npm run build
   ```

5. **Sincronizar com Capacitor**
   ```bash
   npx cap sync android
   ```

6. **Abrir no Android Studio**
   ```bash
   npx cap open android
   ```

7. **No Android Studio:**
   - Aguarde o Gradle finalizar a sincronização
   - Menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Aguarde a build concluir
   - O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

8. **Para build de produção (Google Play)**
   - Menu: Build → Generate Signed Bundle / APK
   - Selecione "APK" ou "Android App Bundle" (recomendado para Play Store)
   - Crie ou selecione uma keystore
   - Configure as assinaturas
   - O arquivo estará em: `android/app/release/`

### Passos para Gerar o IPA (iOS):

1. **Seguir passos 1-4 acima**

2. **Adicionar plataforma iOS**
   ```bash
   npx cap add ios
   npx cap sync ios
   ```

3. **Abrir no Xcode**
   ```bash
   npx cap open ios
   ```

4. **No Xcode:**
   - Configure seu Team (Apple Developer Account necessária)
   - Selecione um device ou simulador
   - Product → Archive
   - Distribute App → escolha método (App Store, Ad Hoc, etc.)

### Hot Reload durante Desenvolvimento:

O app já está configurado para hot reload! Enquanto desenvolve no Lovable:

1. Abra o app no emulador/dispositivo físico
2. O app carrega diretamente da URL do Lovable
3. Mudanças aparecem em tempo real

**URL configurada:** `https://04803414-cc41-4ed8-883c-354d6b3c2a06.lovableproject.com`

### Atualizações Futuras:

Sempre que fizer mudanças no código:

```bash
npm run build
npx cap sync
```

Depois reabra no Android Studio ou Xcode e faça novo build.

---

## 🎯 Qual Opção Escolher?

### Use PWA se:
- ✅ Quer distribuir rapidamente
- ✅ Precisa funcionar em todos os dispositivos
- ✅ Não quer complexidade de lojas de apps
- ✅ Quer atualizações instantâneas

### Use App Nativo se:
- ✅ Precisa publicar na Google Play / App Store
- ✅ Precisa de recursos avançados do celular
- ✅ Quer performance máxima
- ✅ Tem experiência com desenvolvimento mobile

---

## 🔧 Configuração Atual:

### Capacitor Config:
- **App ID**: `app.lovable.04803414cc414ed8883c354d6b3c2a06`
- **App Name**: `Foguete Gestão`
- **Bundle ID** (para lojas): Use o mesmo App ID acima

### URLs importantes:
- **Site**: https://04803414-cc41-4ed8-883c-354d6b3c2a06.lovableproject.com
- **Página de Download**: /download

---

## 📚 Recursos Adicionais:

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Guia Android Build](https://capacitorjs.com/docs/android)
- [Guia iOS Build](https://capacitorjs.com/docs/ios)
- [PWA no Lovable](https://docs.lovable.dev/tips-tricks/pwa)

---

## ⚠️ Notas Importantes:

1. **Hot Reload está ativo**: O app mobile carrega do Lovable durante desenvolvimento
2. **Para produção**: Mude a configuração no `capacitor.config.ts`:
   ```typescript
   server: {
     // Remova ou comente estas linhas para produção
     // url: 'https://...',
     // cleartext: true
   }
   ```
3. **Publish na Play Store**: Precisa criar conta Google Play Developer (US$ 25 única vez)
4. **Publish na App Store**: Precisa conta Apple Developer (US$ 99/ano)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas durante o build:
1. Verifique se todas as dependências estão instaladas
2. Limpe o cache: `npm run build && npx cap sync`
3. No Android Studio: File → Invalidate Caches / Restart
4. Consulte os logs de erro detalhados

**Sucesso no seu build! 🚀**
