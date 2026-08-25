# Pocket Trap (protótipo de redesign)

Protótipo de redesign para o site da [Pocket Trap](https://pocket-trap.com), estúdio indie de jogos de São Paulo. Conceito visual: "console portátil" (o Pocket Trap Game System, que aparece dentro do jogo Pipistrello and the Cursed Yoyo), bilíngue (PT-BR / EN), com Home e um template de página de jogo aplicado a Ninjin: Clash of Carrots, Dodgeball Academia e Pipistrello and the Cursed Yoyo.

**Site ao vivo:** https://cardboardpirates.github.io/pocket-trap/

> Aviso: isto é um protótipo de estudo de redesign, não é o site oficial da Pocket Trap.

## Estrutura

```
index.html          marcação e conteúdo
assets/style.css     estilos
assets/script.js     i18n PT/EN, transições, tilt dos cartuchos, easter egg
```

## Notas técnicas

- Ícones das plataformas (Steam, PlayStation, Xbox) e das redes sociais no rodapé usam o [Font Awesome Free](https://fontawesome.com/) via CDN. O Font Awesome não publica um ícone oficial de Nintendo/Switch, então usamos `fa-gamepad` como equivalente neutro nesse caso específico.
- Cada badge de plataforma na página de um jogo já linka direto pra loja correspondente (Steam, Nintendo eShop, PlayStation Store, Xbox).
- Placeholders assumidos até receber assets reais da Pocket Trap: screenshots dos jogos, logos de imprensa/prêmios e links das redes sociais no rodapé.
