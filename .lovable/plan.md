
## Alteração do Número de WhatsApp para Vendas

### Objetivo
Atualizar o número de WhatsApp de vendas no site de **(48) 98843-0812** para **(48) 98812-7520**.

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/PublicFooter.tsx` | Linha 79: trocar link e texto do número de vendas |

---

## Detalhes da Alteração

### PublicFooter.tsx (linhas 77-86)

**De:**
```tsx
<a 
  href="https://wa.me/5548988430812" 
  ...
>
  <MessageCircle className="w-4 h-4 text-red-500" />
  Vendas: (48) 98843-0812
</a>
```

**Para:**
```tsx
<a 
  href="https://wa.me/5548988127520" 
  ...
>
  <MessageCircle className="w-4 h-4 text-red-500" />
  Vendas: (48) 98812-7520
</a>
```

---

## Observação

O número de **suporte** (48) 99075-1889 permanecerá o mesmo. Apenas o número de **vendas** será alterado conforme solicitado.
