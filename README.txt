UI Pack r1 — visual moderno com NativeWind/Tailwind

Conteúdo:
- tailwind.config.js
- babel.config.js.patch.md (como ativar nativewind/babel)
- components/ui/* (TopBar, Card, SectionHeader, Button, InputMoney, NameValueRow, QuickCounter, SummaryBar)
- example/FechamentoPretty.tsx (tela exemplo com novo visual)

Como aplicar:
1) Instale:
   npm i nativewind tailwindcss
   npx tailwindcss init
   # edite babel.config.js com 'nativewind/babel' (veja babel.config.js.patch.md)

2) Copie a pasta components/ para o seu projeto.
3) Copie tailwind.config.js para a raiz do projeto (ou mescle com o seu).
4) Use o exemplo de layout em example/FechamentoPretty.tsx como referência para reestilizar seu app/(tabs)/index.tsx.
   - Os componentes são "bobos": você conecta nos seus estados/handlers atuais.
   - Cores e espaçamentos já seguem o tema dark com cartões arredondados.

Dica: se já usa seu próprio estado (entrada/saída, etc.), apenas substitua a UI antiga
pelos componentes do pack e mantenha a lógica igual.
