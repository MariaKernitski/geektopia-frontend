NEXUS / GEEKTOPIA — Frontend
============================

Site do sistema NEXUS, do CCPOP (Conselho de Cultura POP de Ponta Grossa), para vender ingressos e organizar a Geektopia e os Pockets. Precisa do backend (geektopia-backend) rodando.

O que precisa para rodar
------------------------

- Node.js 22 ou mais novo (testado com v22.23.4)
- npm 10 (testado com 10.9.9)
- Backend rodando em http://localhost:3333 (veja o README do geektopia-backend)

Como rodar
----------

    npm install
    npm run dev

O site abre em http://localhost:5173.

Se a API estiver em outro endereço, copie .env.example para .env e ajuste VITE_API_URL.

Dependências
------------

- react 19.2.8
- react-dom 19.2.8
- react-router-dom 7.18.2
- axios 1.19.0
- chart.js 4.5.1
- qrcode.react 4.2.0
- html5-qrcode 2.3.8
- react-icons 5.7.0

Só para desenvolvimento:

- vite 8.2.1
- @vitejs/plugin-react 6.0.5
- vitest 5.0.1
- eslint 10.8.1
- @eslint/js 10.0.1
- eslint-plugin-react-hooks 7.1.1
- eslint-plugin-react-refresh 0.5.4
- globals 17.9.0
- tailwindcss 3.4.19
- postcss 8.5.26
- autoprefixer 10.5.4
- @types/react 19.2.18
- @types/react-dom 19.2.4

Funcionalidades
---------------

Usuário:

- Cadastro com termos de uso e login
- Perfil com ingressos (QR code e PDF)
- Comprar ingressos e pagar pelo Mercado Pago
- Pedir espaço como expositor
- Inscrever-se em competições
- Enviar eventos da comunidade para divulgação

Administrador:

- Criar e gerenciar edições
- Aprovar ou recusar solicitações
- Gerenciar usuários
- Editar a página inicial e a página Geektopia
- Check-in por QR code
- Relatórios com filtros e exportação para Excel

Estrutura
---------

- src/pages uma tela por rota
- src/components peças reutilizáveis
- src/utils validações e regras
- src/style CSS de cada tela
- tests testes automatizados

Testes
------

    npm test
