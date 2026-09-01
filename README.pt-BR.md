<h1>Projeto: Coffe.exe</h1>
<p>Descrição: Desenvolvimento de um projeto prático aplicando os conceitos da arquitetura de
microsserviços com a temática de uma Cafeteria Tech.</p>

<h2>Arquitetura do projeto</h2>
<img width="2720" height="1760" alt="arquitetura_coffee_exe_v2" src="https://github.com/user-attachments/assets/3604ab51-f761-4cbc-92c3-c6316afd9cd7" />

<ul>
  <li>Frontend: interface do usuário onde ele poderá visualizar o cardápio e realizar pedidos.</li>
  <li>Microsserviço cardápio: gerencia o catálogo de itens da cafeteria.</li>
  <li>Microsserviço pedidos: gerencia os pedidos dos clientes.</li>
  <li>Banco de dados do cardápio: armazena os dados do catálogo de produtos.</li>
  <li>Banco de dados de pedidos: armazena o histórico de pedidos realizados.</li>
  <li>Comunicação validação/snapshot: chamada síncrona que o microsserviço de Pedidos faz ao de Cardápio para confirmar que o item existe, checar estoque e capturar preço/nome no momento da compra.</li>
</ul>
