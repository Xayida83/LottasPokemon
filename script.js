class Pokemon {
  constructor(id, name, imageUrl, types, weight, height, stats) {
    this.id = id;
    this.name = name;
    this.imageUrl = imageUrl;
    this.types = types;
    this.weight = weight;
    this.height = height;
    this.stats = stats;
  }
}
class BattlePokemon extends Pokemon{
  constructor(data) {
    super(data.id, data.name, data.imageUrl, data.types, data.weight, data.height, data.stats);
    this.moves = [];
  }

  async fetchMoves() {
    try {
        const data = await getData(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
        const movesUrls = data.moves.slice(0, 10).map(move => move.move.url);

        const movesDetailsPromises = movesUrls.map(url => 
            getData(url).catch(err => {
                console.error("Failed to fetch move details:", err);
                return null; // Returnera null om ett specifikt anrop misslyckas
            })
        );

        const movesDetails = await Promise.all(movesDetailsPromises);

        this.moves = movesDetails.map(moveDetail => {
            if (moveDetail && moveDetail.power) {
                return {
                    name: moveDetail.name,
                    power: moveDetail.power                   
                };                
            } else {
                // Sätt power till 10 om moveDetail saknas eller power inte är tillgänglig
                return {
                    name: moveDetail ? moveDetail.name : 'Unknown Move',
                    power: 10
                };
            }
        });

        if (this.moves.length === 0) {
            console.error("No moves found for this Pokémon.");
        }
    } catch (error) {
        console.error("Fail to fetch moves:", error);
    }
    
  }

  setRole (role) {
    const cardElement = document.getElementById(`pokemon-card-${this.id}`);
    if (cardElement) {
      cardElement.classList.remove("attack", "defend");
      cardElement.classList.add(role);
    }    
  }
  
  calculateDamage(opponent) {
    if (this.moves.length === 0) {
      console.error("No moves loaded. Cannot proceed with the attack.");
      return 0; 
    }
    
    let randomIndex = Math.floor(Math.random() * this.moves.length);
    let selectedMove = this.moves[randomIndex];
    console.log(selectedMove.name, selectedMove.power);
    
    let damage = (this.stats.attack + selectedMove.power) -
                  (opponent.stats.defense + opponent.stats.specialDefense) * 0.8;
    return {
      move: selectedMove.name,
      damage: damage < 10 ? 10 : Math.round(damage) //Ensure damage is min 10
    };
    
  }

  attack(opponent) {
    const { move, damage } = this.calculateDamage(opponent);
    opponent.stats.hp = Math.max(0, opponent.stats.hp - damage);
    return {
      attacker: this.name,
      move,
      damage,
      opponentName: opponent.name,
      remainingHp: opponent.stats.hp
    };
  }
}
//Get API data
let getData = async (url) => {
  try {
    let response = await fetch(url);
    if (response.ok) {
      let data = await response.json();
      return data;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
  } catch (error) {
    console.error(error);
  }
}
//Create object
let createPokemon = (data) => {
  return new Pokemon(
    data.id,
    data.name,
    data.sprites.other['showdown'].front_default,
    data.types.map(typeInfo => typeInfo.type.name),
    data.weight,
    data.height,
    {
      hp: data.stats.find(stat => stat.stat.name === 'hp').base_stat,
      attack: data.stats.find(stat => stat.stat.name === 'attack').base_stat,
      specialAttack: data.stats.find(stat => stat.stat.name === 'special-attack').base_stat,
      defense: data.stats.find(stat => stat.stat.name === 'defense').base_stat,
      specialDefense: data.stats.find(stat => stat.stat.name === 'special-defense').base_stat,
      speed: data.stats.find(stat => stat.stat.name === 'speed').base_stat,
    }
  );
}

//Create Containers showing at loding document
const comparisonContainer = document.createElement("div");
comparisonContainer.classList.add("comparison-container");

const battleContainer = document.createElement("div");
battleContainer.classList.add("battle-container");

const cardContainer = document.createElement("div");
cardContainer.classList.add("card-container");

const battleTextWrap = document.createElement("div");
battleTextWrap.classList.add("battle-text-wrap")

document.body.append(comparisonContainer, battleContainer, cardContainer );

//Fill the selector whit names from api
let selector = document.querySelector("#pokemons");
let renderSelector = async (selector) => {
  try {
    const data = await getData("https://pokeapi.co/api/v2/pokemon?limit=151");
    
    data.results.forEach(pokemon => {
      let option = document.createElement('option');
      option.value = pokemon.url;
      option.textContent = pokemon.name;
      
      selector.appendChild(option);
    });
  } catch (error) {
    console.error("OBS!", error);
  }  
  //Use the funtion to get details from API when change on selector
  selector.addEventListener('change', fetchPokemonDetails);
};
renderSelector(selector);

//An array to collect selected name from the selector
let selectedPokemons = [];
//Event on selector 
let fetchPokemonDetails = async (event) => {
  
  if(selectedPokemons.length >= 2) {
    alert("You can only pic two Pokémons");
    return;
  }  

  const url = event.target.value;
  try {
    const data = await getData(url);
    const pokemon = createPokemon(data);

    //Check if the pokemon already has been picked, show and push to array selectedPokemons 
    if (!selectedPokemons.find(p => p.name === pokemon.name)) {
      displayPokemon(pokemon);
      selectedPokemons.push(pokemon);
      if (selectedPokemons.length === 2) {
        renderComparison(selectedPokemons[0], selectedPokemons[1]);
        renderStartBattle();      
      }
    } else {
      alert(`${pokemon.name} has already been selected`)
    }   
    //Check if the pokemons are two and call funktion to compare them and able to start a battle
    
  } catch (error) {
    console.error('An error occurred while retrieving Pokemon data:', error);
  } 
  // Resets the select element to the default value
  selector.value = "";
};

let renderComparison = (pokemon1, pokemon2) => {
  const comparisonResult = comparePokemons(pokemon1, pokemon2);
  console.log("Selected:", selectedPokemons);
  // Empty content from before
  comparisonContainer.innerHTML = '';

  const resultText = document.createElement('p');
  comparisonContainer.appendChild(resultText);
  
  let wins = { pokemon1: 0, pokemon2: 0 };
  
  Object.keys(comparisonResult).forEach(category => {
    const winner = comparisonResult[category];
    const element1 = document.getElementById(`${category}-${pokemon1.id}`);
    const element2 = document.getElementById(`${category}-${pokemon2.id}`);
  
    //Clear previous color of winning stats
    if (element1) element1.classList.remove('color');
    if (element2) element2.classList.remove('color');
  
    if (winner === 'pokemon1') {
      wins.pokemon1++;
      if (element1) element1.classList.add('color');
    } else if (winner === 'pokemon2') {
      wins.pokemon2++;
      if (element2) element2.classList.add('color');
    }
  });
  
    if (wins.pokemon1 > wins.pokemon2) {
      resultText.textContent = `${pokemon1.name} wins in most categories`;
    } else if (wins.pokemon1 < wins.pokemon2) {
      resultText.textContent = `${pokemon2.name} wins in most categories`;
    } else {
      resultText.textContent = "It is a tie!";
    }  
}
//Compare the selected pokemons
let comparePokemons = (pokemon1, pokemon2) => {
  //Saving weight and height in an array. Then with the spread-operatorn add the stats from the object
  const categories = ['weight', 'height', ...Object.keys(pokemon1.stats)];
  //A "results" object is created to store the result of the comparisons for each category
  let results = {};

  categories.forEach(category => {
    //if the value is in stats put value1 otherwise take the value for weght and height which is directly on the object and put as value1
    let value1 = category in pokemon1.stats ? pokemon1.stats[category] : pokemon1[category];
    let value2 = category in pokemon2.stats ? pokemon2.stats[category] : pokemon2[category];
    //Compare the values
    if (value1 > value2) {
      results[category] = 'pokemon1';
    } else if (value1 < value2) {
      results[category] = 'pokemon2';
    } else {
      results[category] = 'tie';
    }
  });

  return results;
}

let displayPokemon = (pokemon) => {
  const card = document.createElement('div');
  card.classList.add('pokemon-card');
  card.id = `pokemon-card-${pokemon.id}`;

  card.innerHTML = `
  <div class='image-container'>
    <img src="${pokemon.imageUrl}" alt="Picture of ${pokemon.name}" class="pokemon-img">
  </div>
  <div class='main-content'>
      <h2>${pokemon.name}</h2>
      <div class="info">
        <p>${pokemon.types.join(', ')}</p>
        <p id="weight-${pokemon.id}">Weight: ${pokemon.weight}</p>
        <p id="height-${pokemon.id}">Height: ${pokemon.height}</p>
      </div>
      <div class="stats">
        <h3>Stats:</h3>
        <ul>
          <li id="hp-${pokemon.id}">HP: ${pokemon.stats.hp}</li>
          <li id="attack-${pokemon.id}">Attack: ${pokemon.stats.attack}</li>
          <li id="specialAttack-${pokemon.id}">Special Attack: ${pokemon.stats.specialAttack}</li>
          <li id="defense-${pokemon.id}">Defense: ${pokemon.stats.defense}</li>
          <li id="specialDefense-${pokemon.id}">Special Defense: ${pokemon.stats.specialDefense}</li>
          <li id="speed-${pokemon.id}">Speed: ${pokemon.stats.speed}</li>
        </ul>  
      </div>
    </div>
    <button class="btn remove-btn">Remove</button>
  `;

  const removeBtn = card.querySelector('.remove-btn');
  removeBtn.addEventListener('click', () => {
    card.remove();     
    selectedPokemons = selectedPokemons.filter(p => p.id !== pokemon.id);
    console.log("Slected:", selectedPokemons);
    restartBattle();
  });
  cardContainer.appendChild(card);
};

let updateBattleLog = (attackResult) => {
  const logElement = document.createElement('p');
  logElement.classList.add("battle-log");
  //Out of curiosity I choose to render the sentences in this way. made them span to be able to style them
  const logParts = [
      { text: attackResult.attacker, class: "attacker-name" },
      { text: "used", class: "text-normal" },
      { text: attackResult.move, class: "attack-move" },
      { text: "and did", class: "text-normal" },
      { text: `${attackResult.damage}`, class: "damage-info" },
      { text: "damage.", class: "text-normal" },
      { text: attackResult.opponentName, class: "opponent-name" },
      { text: "remaining", class: "text-normal" },
      { text: `HP: ${attackResult.remainingHp}`, class: "remaining-hp" }
  ];

  logParts.forEach(part => {
      const span = document.createElement('span');
      span.textContent = part.text;
      span.classList.add(part.class);
      logElement.appendChild(span);
      logElement.appendChild(document.createTextNode(" ")); // Lägg till ett mellanslag efter varje span
  });

  battleTextWrap.appendChild(logElement);
}

let displayWinner = (winner) => {
  const winnerElement = document.createElement('h3');
  winnerElement.classList.add("winner-log");
  winnerElement.textContent = `${winner} wins the battle!`;
  battleTextWrap.appendChild(winnerElement);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = "reset";
  resetBtn.classList.add("btn", "reset-btn");
  
  resetBtn.addEventListener('click', () => {
    location.reload();
  });
  battleTextWrap.appendChild(resetBtn);
}
let currentTimeout;

let battle = async (pokemon1, pokemon2) => {
  //See which pokemon starts with an attack
  let currentAttacker = pokemon1.stats.speed > pokemon2.stats.speed ? pokemon1 : pokemon2;
  let currentDefender = currentAttacker === pokemon1 ? pokemon2 : pokemon1;

  currentAttacker.setRole("attack");
  currentDefender.setRole("defend");

  while (pokemon1.stats.hp > 0 && pokemon2.stats.hp > 0) {
    const attackResult = currentAttacker.attack(currentDefender);
    updateBattleLog(attackResult);
    
    if (currentDefender.stats.hp <= 0) {
      // If any Pokemon reaches 0 HP, reveal the winner after 1 second
      await new Promise(resolve => currentTimeout = setTimeout(resolve, 1000));
      displayWinner(currentAttacker.name);
      break;
    }

    await new Promise(resolve => currentTimeout = setTimeout(resolve, 3500));
    
    // Switch attack and defender roles
    [currentAttacker, currentDefender] = [currentDefender, currentAttacker];
    currentAttacker.setRole("attack");
    currentDefender.setRole("defend");    
  } 
};

//show button for starting battle and creating BatllePokemon
let renderStartBattle = () => {
  const battleBtn = document.createElement("button");
  battleBtn.classList.add("btn","battle-btn" );
  battleBtn.textContent="start battle"
  
  battleBtn.addEventListener("click", async () => {    
    const battlePokemon1 = new BattlePokemon(selectedPokemons[0]);
    const battlePokemon2 = new BattlePokemon(selectedPokemons[1]);

    await Promise.all([battlePokemon1.fetchMoves(), battlePokemon2.fetchMoves()]);

    battle(battlePokemon1, battlePokemon2)
    console.log(battlePokemon1, battlePokemon2);
  })

  battleContainer.append(battleBtn, battleTextWrap);
}

let restartBattle = () => {
  clearTimeout(currentTimeout);
  battleTextWrap.innerHTML = ''; 
  battleContainer.innerHTML = ''; 
  comparisonContainer.innerHTML = ''; 
  const allCards = document.querySelectorAll('.pokemon-card');
  allCards.forEach(card => {
    card.classList.remove('attack', 'defend');
  });
 }