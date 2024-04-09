class Pokemon {
  constructor(name, imageUrl, types, weight, height, stats) {
    this.name = name;
    this.imageUrl = imageUrl;
    this.types = types;
    this.weight = weight;
    this.height = height;
    this.stats = stats;
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

let selector = document.querySelector("#pokemons");
//get all the names and show in a dropdown
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
    } 

  } catch (error) {
    console.error('An error occurred while retrieving Pokemon data:', error);
  }
 
};

const cardContainer = document.querySelector(".card-container");

let displayPokemon = (pokemon) => {
  const card = document.createElement('div');
  card.classList.add('pokemon-card');

  card.innerHTML = `
  <div class='image-container'>
    <img src="${pokemon.imageUrl}" alt="Picture of ${pokemon.name}" class="pokemon-img">
  </div>
  <div class='main-content'>
      <h2>${pokemon.name}</h2>
      <div class="info">
        <p>${pokemon.types.join(', ')}</p>
        <p>Weight: ${pokemon.weight}</p>
        <p>Height: ${pokemon.height}</p>
      </div>
      <div class="stats">
        <h3>Stats:</h3>
        <ul>
          <li>HP: ${pokemon.stats.hp}</li>
          <li>Attack: ${pokemon.stats.attack}</li>
          <li>Special Attack: ${pokemon.stats.specialAttack}</li>
          <li>Defense: ${pokemon.stats.defense}</li>
          <li>Special Defense: ${pokemon.stats.specialDefense}</li>
          <li>Speed: ${pokemon.stats.speed}</li>
        </ul>  
      </div>
    </div>
    <button class="remove-btn">Remove</button>
  `;

  const removeBtn = card.querySelector('.remove-btn');
  removeBtn.addEventListener('click', () => {
    card.remove(); 
    selectedPokemons = selectedPokemons.filter(p => p.name !== pokemon.name); 
  });

  cardContainer.appendChild(card);

  console.log(pokemon);
};

let comparePokemons = (pokemon1, pokemon2) => {
  const categories = ['weight', 'height', ...Object.keys(pokemon1.stats)];
  //saving weight and height in an array. then with the spread-operatorn add the stats from the object
  let wins = { pokemon1: 0, pokemon2: 0 };
  //counts number of wins on each pokemon
  categories.forEach(category => {
    if (category in pokemon1.stats) {
      if (pokemon1.stats[category] > pokemon2.stats[category]) wins.pokemon1++;
      else if (pokemon1.stats[category] < pokemon2.stats[category]) wins.pokemon2++;
    } else {
      if (pokemon1[category] > pokemon2[category]) wins.pokemon1++;
      else if (pokemon1[category] < pokemon2[category]) wins.pokemon2++;
    }
  });

  return wins;
}

let renderComparison = (pokemon1, pokemon2) => {
  const comparisonResult = comparePokemons(pokemon1, pokemon2);
  const comparisonContainer = document.querySelector(".comparison-container");

  comparisonContainer.innerHTML = '';

  const resultText = document.createElement('p');
  if (comparisonResult.pokemon1 > comparisonResult.pokemon2) {
    resultText.textContent = `${pokemon1.name} wins in most categories`;

  } else if (comparisonResult.pokemon1 < comparisonResult.pokemon2) {
    resultText.textContent = `${pokemon2.name} wins in most categories`;

  } else {
    resultText.textContent = "It is a tie!";
  }
  comparisonContainer.appendChild(resultText);
}

