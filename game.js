var PokeAuto = {};

//read data
var pokedex, types;
$.ajax({
     async: false,
     type: 'GET',
     url: '/data/pokedex.json',
     success: function(data) {
          pokedex = data;
     }
});
$.ajax({
     async: false,
     type: 'GET',
     url: '/data/types.json',
     success: function(data) {
          types = data;
     }
});

types_dict = {
  en: {},
  cn: {}
};
types.forEach(function(type) {
  types_dict.cn[type.cname] = type;
});

types.forEach(function(type) {
  types_dict.en[type.ename] = type;
});

type_colors = {
  flying: "#A890F0",
  bug: "#A8B820",
  dark: "#705848",
  dragon: "#7038F8",
  electric: "#F8D030",
  fairy: "#EE99AC",
  fighting: "#C03028",
  fire: "#F08030",
  ghost: "#705898",
  grass: "#78C850",
  ground: "#E0C068",
  ice: "#98D8D8",
  normal: "#A8A878",
  poison: "#A040A0",
  pyschic: "#F85888",
  rock: "#B8A038",
  steel: "#B8B8D0",
  water: "#6890F0"
};

//define Pokemon
PokeAuto.Pokemon = function(name, types, stats) {
    this.name = name;
    this.stats = stats;
    this.types = types;
    this.hp = stats.HP;
    this.alive = true;
}

PokeAuto.Pokemon.constructor = PokeAuto.Pokemon;

PokeAuto.Pokemon.prototype.fight = function(other) {
  var damage = 0;
  if (this.stats["Sp.Atk"] > this.stats["Attack"]) {
    damage = (this.stats["Sp.Atk"] - other.stats["Sp.Def"])
      * other.typeDefEffectiveness(this.types);
  } else {
    damage = (this.stats["Attack"] - other.stats["Defense"])
      * other.typeDefEffectiveness(this.types);
  }
  if (damage < 0) {
    damage = 0;
  }
  other.takeDamage(damage);
}

PokeAuto.Pokemon.prototype.typeDefEffectiveness = function(types) {
  var eff = 1;
  types.forEach(function(type) {
    this.types.forEach(function(thisType) {
      eff *= types_dict.cn[type].effective[thisType];
    }, this);
  }, this);
  return eff;
}

PokeAuto.Pokemon.prototype.takeDamage = function(damage) {
  this.hp -= damage;
  if (this.hp <= 0) {
    this.alive = false;
  }
}

var testBulbasaur = new PokeAuto.Pokemon("Test Bulbasaur", [
    "\u8349",
    "\u6bd2"
], {
    "Attack": 49,
    "Defense": 49,
    "HP": 45,
    "Sp.Atk": 65,
    "Sp.Def": 65,
    "Speed": 45
});
var testCharizard = new PokeAuto.Pokemon("Test Charizard",[
    "\u708e",
    "\u98de\u884c"
],
{
    "Attack": 84,
    "Defense": 78,
    "HP": 78,
    "Sp.Atk": 109,
    "Sp.Def": 85,
    "Speed": 100
});
console.log(testCharizard);
testBulbasaur.fight(testCharizard);
console.log(testCharizard.typeDefEffectiveness(testBulbasaur.types));
console.log(testCharizard);
console.log(testBulbasaur);
testCharizard.fight(testBulbasaur);
console.log(testBulbasaur.typeDefEffectiveness(testCharizard.types));
console.log(testBulbasaur);

//build canvas
var canvas = document.createElement("canvas");

canvas.width = 500;
canvas.height = 500;

document.body.appendChild(canvas);

var context = canvas.getContext("2d");
context.fillStyle = "#000";
context.fillRect(0, 0, canvas.width, canvas.height);
