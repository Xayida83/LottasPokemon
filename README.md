# Pokémon Battle System

## Översikt
Detta system simulerar strider mellan två Pokémon. Användare kan välja två Pokémon från en dropdown-lista, jämföra deras statistik och starta en strid mellan dem.

## Funktionalitet

### Val av Pokémon
- Användaren presenteras med en dropdown där alla tillgängliga Pokémon kan väljas.
- När en Pokémon väljs, hämtas dess data från en extern API och visar dess statistik på skärmen.
- Användaren kan välja upp till två Pokémon för en strid. Systemet varnar om användaren försöker välja fler än två.

### Jämförelse av Pokémon
- När två Pokémon är valda, kan användaren se en jämförelse av deras statistik.
- Statistik inkluderar HP (Health Points), Attack, Defense, Special Attack, Special Defense och Speed.
- Jämförelsen visar vilken Pokémon som har högre värden i de olika kategorierna.

### Starta en Strid
- När två Pokémon är valda och presenterade, blir en "Start Battle"-knapp tillgänglig.
- Att klicka på denna knapp initierar striden.

### Stridssimulering
- Striden är tur-baserad där Pokémon med högre Speed-statistik attackerar först.
- Varje attack väljer en slumpmässig "move" från Pokémonens moveset, där varje move har en viss "power" som påverkar mängden skada den gör.
- Skadan beräknas med formeln:
  \[
  \text{Skada} = (\text{Attack} + \text{Move Power}) - (\text{Opponent's Defense} + \text{Opponent's Special Defense}) \times 0.8
  \]
  Skadan kan aldrig vara mindre än 10.
- HP för den attackerade Pokémon minskas med den beräknade skadan.
- Striden fortsätter tills en av Pokémonens HP når 0.

### Resultat av Strid
- När en Pokémon's HP når 0, deklareras den andra Pokémon som vinnare.
- En sammanfattning av striden och dess utfall visas på skärmen, och en "reset"-knapp tillåter användaren att starta om från början.

## Tekniska Detaljer

### `class Pokemon`
- Grundklass för att skapa Pokémon-objekt.
- Inkluderar metoder för att skapa Pokémon (`createPokemon`) och jämföra två Pokémon (`comparePokemons`).

### `class BattlePokemon extends Pokemon`
- Subklass till `Pokemon` som lägger till funktionalitet för strid, inklusive att hämta moves och beräkna skada.
 Varje BattlePokemon har sitt eget unika tillstånd, inklusive hp, som uppdateras oberoende av andra instanser. Detta gör att varje Pokémon kan ha sin egen hälsostatus som individuellt påverkas under striden.

### `fetchMoves()`
- Asynkron metod för att hämta moves från API. Använder Pokémonens ID för att göra API-anrop och lagrar upp till 10 moves med deras namn och power.

### `attack()`
- Beräknar skadan baserat på en slumpmässigt vald move och motståndarens försvarsstatistik. Minskar motståndarens HP med den beräknade skadan.


## Användargränssnitt
- Användargränssnittet inkluderar HTML-element och CSS-stylingför att visa Pokémon-kort och stridsmode.
