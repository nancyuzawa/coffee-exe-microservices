-- Dados de exemplo para o cardápio 
USE coffee_cardapio;

INSERT INTO itens_cardapio (id, nome, preco, descricao, estoque) VALUES
  (UUID(), 'Espresso',        6.50, 'Dose curta e intensa, o "hello world" do café.',      50),
  (UUID(), 'Cappuccino',     12.50, 'Espresso com leite vaporizado e espuma cremosa.',     30),
  (UUID(), 'Latte',          13.00, 'Suave: muito leite, pouco café.',                     30),
  (UUID(), 'Cold Brew',      14.00, 'Extração a frio por 18h. Sem bugs de amargor.',       20),
  (UUID(), 'Pão de Queijo',   7.00, 'Quentinho, direto do forno (versão estável).',        40);
