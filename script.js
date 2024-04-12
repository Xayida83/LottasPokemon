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

  async fetchMoves(){
    try {
      const data = await getData(`https://pokeapi.co/api/v2/pokemon/${this.id}`)
      this.moves = data.moves.slice(0, 10).map(move => move.move.name)
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
    let damage = (this.stats.attack + this.stats.specialAttack) -
                  (opponent.stats.defense + opponent.stats.specialDefense) *0.8;
    return damage < 10 ? 10 : Math.round(damage); //ensure min damage is 10
  }

  attack(opponent){
    if (this.moves.length === 0) {
      console.error("Attempt to attack without moves. Battle cannot proceed.");
      return { error: "No moves loaded" };  
    }
    const damage = this.calculateDamage(opponent);
    opponent.stats.hp = Math.max(0, opponent.stats.hp - damage);
    return {
      attacker: this.name,
      move: this.moves[0],
      damage,
      opponentName: opponent.name,
      remainingHp: opponent.stats.hp
    };
  }
}

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

// Skapa cardContainer och comparisonContainer en gång vid sidans laddning
const comparisonContainer = document.createElement("div");
comparisonContainer.classList.add("comparison-container");

const battleContainer = document.createElement("div");
battleContainer.classList.add("battle-container");

const cardContainer = document.createElement("div");
cardContainer.classList.add("card-container");

const battleTextWrap = document.createElement("div");
battleTextWrap.classList.add("battle-text-wrap")

document.body.append(comparisonContainer, battleContainer, cardContainer );

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

  selector.addEventListener('change', fetchPokemonDetails);
};
renderSelector(selector);

let selectedPokemons = [];

let fetchPokemonDetails = async (event) => {
  
  if(selectedPokemons.length >= 2) {
    alert("You can only pic two Pokémons");
    return;
  }  

  const url = event.target.value;
  try {
    const data = await getData(url);
    const pokemon = createPokemon(data);

    if (!selectedPokemons.find(p => p.name === pokemon.name)) {
      displayPokemon(pokemon);
      selectedPokemons.push(pokemon);
    } else {
      alert(`${pokemon.name} has already been selected`)
    }   
    if (selectedPokemons.length === 2) {
      renderComparison(selectedPokemons[0], selectedPokemons[1]);
      renderStartBattle();
      selector.value = "";
    }else {
      comparisonContainer.innerHTML = '';
    }

  } catch (error) {
    console.error('An error occurred while retrieving Pokemon data:', error);
  }
 
};

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

let comparePokemons = (pokemon1, pokemon2) => {
  const categories = ['weight', 'height', ...Object.keys(pokemon1.stats)];
  //saving weight and height in an array. then with the spread-operatorn add the stats from the object
  let results = {};

  categories.forEach(category => {
    let value1 = category in pokemon1.stats ? pokemon1.stats[category] : pokemon1[category];
    let value2 = category in pokemon2.stats ? pokemon2.stats[category] : pokemon2[category];
    
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
let updateBattleLog = (attackResult) => {
  const logElement = document.createElement('p');
  logElement.textContent = `${attackResult.attacker} used ${attackResult.move} and did ${attackResult.damage} damage. ${attackResult.opponentName} remaining HP: ${attackResult.remainingHp}`;
  battleTextWrap.appendChild(logElement); 
}
let displayWinner = (winner) => {
  const winnerElement = document.createElement('h3');
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

let renderComparison = (pokemon1, pokemon2) => {
  const comparisonResult = comparePokemons(pokemon1, pokemon2);
  console.log("Slected:", selectedPokemons);
  comparisonContainer.innerHTML = '';

    const resultText = document.createElement('p');
    comparisonContainer.appendChild(resultText);
  
    let wins = { pokemon1: 0, pokemon2: 0 };
  
    Object.keys(comparisonResult).forEach(category => {
      const winner = comparisonResult[category];
      const element1 = document.getElementById(`${category}-${pokemon1.id}`);
      const element2 = document.getElementById(`${category}-${pokemon2.id}`);
  
      //clear previously assigned classes to restore the appearance
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

let battle = async (pokemon1, pokemon2) => {
  let currentAttacker = pokemon1.stats.speed > pokemon2.stats.speed ? pokemon1 : pokemon2;
  let currentDefender = currentAttacker ===  pokemon1 ? pokemon2 : pokemon1;

  currentAttacker.setRole("attack");
  currentDefender.setRole("defend");

  console.log("attacker: ", currentAttacker);
  console.log("defender: ", currentDefender);

  battleTextWrap.innerHTML = '';

  while (pokemon1.stats.hp > 0 && pokemon2.stats.hp > 0) {
    const attackResult = currentAttacker.attack(currentDefender);
    updateBattleLog(attackResult); 
    
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    if (currentDefender.stats.hp <= 0) {
      displayWinner(currentAttacker.name);
      break;
    }

    [currentAttacker, currentDefender] = [currentDefender, currentAttacker];
    currentAttacker.setRole("attack");
    currentDefender.setRole("defend");    
  } 
}
let renderStartBattle = () => {
  const battleBtn = document.createElement("button");
  battleBtn.classList.add("btn","battle-btn" );
  battleBtn.textContent="start battle"
  
  battleBtn.addEventListener("click", async () => {    
    const battlePokemon1 = new BattlePokemon(selectedPokemons[0]);
    const battlePokemon2 = new BattlePokemon(selectedPokemons[1]);

    await Promise.all([battlePokemon1.fetchMoves(), battlePokemon2.fetchMoves()]);

    battle(battlePokemon1, battlePokemon2)
  })

  battleContainer.append(battleBtn, battleTextWrap);
}

let restartBattle = () => {
  battleTextWrap.innerHTML = ''; 
  battleContainer.innerHTML = ''; 
  comparisonContainer.innerHTML = ''; 
  const allCards = document.querySelectorAll('.pokemon-card');
  allCards.forEach(card => {
    card.classList.remove('attack', 'defend');
  });
 }