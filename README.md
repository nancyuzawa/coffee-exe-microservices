🌐 [[Português](README.pt-BR.md)]

<h1>Project: Coffee.exe</h1>
<p>Description: Development of a practical project applying the concepts of microservices architecture, based on a tech coffee shop.</p>

<h2>Project Architecture</h2>
<img width="2720" height="1760" alt="coffee_exe_architecture_en" src="https://github.com/user-attachments/assets/866e9306-c837-4d5b-9a4c-a8c47cfc82c2" />

<ul>
  <li>Frontend: User interface where users can view the menu and place orders.
  </li> <li>Menu Microservice: Manages the coffee shop's product catalog.</li>
  <li>Orders Microservice: Manages customer orders.</li>
  <li>Menu Database: Stores product catalog data.</li>
  <li>Orders Database: Stores the history of placed orders.</li>
  <li>Validation/Snapshot Communication: Synchronous call made by the Orders Microservice to the Menu Microservice to confirm that the item exists, check its stock, and capture its price/name at the time of purchase.</li> </ul>
