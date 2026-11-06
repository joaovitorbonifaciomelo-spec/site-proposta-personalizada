# Proposta digital Perboni · Bonifácio

Página única, estática, sem backend. Vite + JavaScript puro, GSAP (ScrollTrigger, SplitText) e Lenis.

```bash
npm install
npm run dev       # desenvolvimento
npm run build     # gera dist/, que é o que vai para a hospedagem
npm run preview   # serve dist/ em http://localhost:4173
```

Para publicar, envie o conteúdo de `dist/` para qualquer hospedagem estática. Os caminhos são relativos,
então funciona em subpasta. A página tem `noindex`: não aparece em buscadores, mas quem tiver o link abre.

## Onde mexer

- **Texto:** todo em `index.html`, na ordem de leitura.
- **Valor e condições:** em `#investimento`, `#modelo`, no resumo (`.index__facts`) e no encerramento (`.close`).
- **WhatsApp:** link e número em `.cta`.
- **Cores:** carvão, off-white, verde profundo e cinza suave, no início de `src/style.css`.

## Ligar a Forma DJR Display

A direção pede Forma DJR Display nos títulos. É uma fonte comercial, então este projeto não a inclui.
Enquanto ela não for ligada, os títulos usam Inter Tight.

1. Em [fonts.adobe.com/fonts/forma-djr-display](https://fonts.adobe.com/fonts/forma-djr-display), crie um
   projeto web com os pesos desejados e autorize o domínio final.
2. Em `index.html`, descomente a linha do `use.typekit.net` e troque `KITID` pelo código do projeto.
3. Ajuste `--display-weight` em `src/style.css`, se o peso 500 não for o desejado.
4. Rode `npm run build` e reveja a página: as métricas mudam. `Perboni`, o preço, o relógio e "Meio-dia."
   se reajustam sozinhos à largura, mas as quebras dos outros títulos precisam de um olhar.

Se a licença vier de outra fonte (DJR ou Type Network), coloque os `.woff2` em `public/fonts/`, declare o
`@font-face` com o nome `Forma DJR Display` e o CSS passa a usá-la.

## Como funciona o movimento

- **Superfície das Necessidades:** `buildMorph`, em `src/main.js`, transforma uma única peça 3D em CSS, ligada à rolagem. Os estados ficam na tabela `STATES`.
- **Módulos do Compromisso:** ficam empilhados e se abrem com a rolagem no desktop. No toque, viram coluna.
- **Universos das Competências:** quatro telas em `.uni__panel`. Respondem a mouse, clique, teclado (setas) e toque.
- **Curvas de nível:** `contour` calcula isolinhas reais de um relevo gerado.
- **Segurança:** com `prefers-reduced-motion`, sem JavaScript ou se o JS não iniciar em 4 s, tudo aparece sem animação. Qualquer gesto encerra a abertura na hora.

## Versões anteriores

`_arquivo-v1/`, `_arquivo-rev02/` e `_arquivo-rev03/` guardam o código das versões anteriores, como referência. Essas pastas não entram no build
e não devem ser publicadas: a da v1 contém imagens de outros clientes.
