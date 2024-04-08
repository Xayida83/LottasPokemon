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
    let response = await fetch(url)
    let data = await response.json();
    return data;
  } catch (error) {
    console.log("OBS!", error);
  }
}

let selector = document.querySelector("#pokemons");
//get all the names and show in DOM
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
    console.log("OBS!", error);
  }  

  selector.addEventListener('change', fetchPokemonDetails);
};

renderSelector(selector);

selector.addEventListener("change", () => {

})

let fetchPokemonDetails = async (event) => {
  const url = event.target.value;
  try {
    const pokemonData = await getData(url);

    const pokemon = new Pokemon(
      pokemonData.name,
      pokemonData.sprites.other.showdown.front_default,
      pokemonData.types.map(typeInfo => typeInfo.type.name),
      pokemonData.weight,
      pokemonData.height,
      {
        hp: pokemonData.stats.find(stat => stat.stat.name === 'hp').base_stat,
        attack: pokemonData.stats.find(stat => stat.stat.name === 'attack').base_stat,
        specialAttack: pokemonData.stats.find(stat => stat.stat.name === 'special-attack').base_stat,
        defense: pokemonData.stats.find(stat => stat.stat.name === 'defense').base_stat,
        specialDefense: pokemonData.stats.find(stat => stat.stat.name === 'special-defense').base_stat,
        speed: pokemonData.stats.find(stat => stat.stat.name === 'speed').base_stat,
      }
    );

    displayPokemon(pokemon);

  } catch (error) {
    console.error('Ett fel inträffade vid hämtning av Pokémon-data:', error);
  }
};
const cardContainer = document.querySelector(".card-container");
let displayPokemon = (pokemon) => {

  console.log(pokemon);
}