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

var types_dict = {
  en: {},
  cn: {}
};
types.forEach(function(type) {
  types_dict.cn[type.cname] = type;
});

types.forEach(function(type) {
  types_dict.en[type.ename] = type;
});

var type_colors = {
  Flying: "#A890F0",
  Bug: "#A8B820",
  Dark: "#705848",
  Dragon: "#7038F8",
  Electric: "#F8D030",
  Fairy: "#EE99AC",
  Fighting: "#C03028",
  Fire: "#F08030",
  Ghost: "#705898",
  Grass: "#78C850",
  Ground: "#E0C068",
  Ice: "#98D8D8",
  Normal: "#A8A878",
  Poison: "#A040A0",
  Pyschic: "#F85888",
  Rock: "#B8A038",
  Steel: "#B8B8D0",
  Water: "#6890F0"
};

//define Pokemon
PokeAuto.Pokemon = function(id, name, types, stats) {
    this.id = parseInt(id);
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

PokeAuto.createPokemon = function(id) {
  var json = pokedex[id];
  return new PokeAuto.Pokemon(json["id"], json["ename"], json["type"], json["base"]);
}

PokeAuto.Map = function(width, height) {
  this.height = height;
  this.width = width;

  this.map = [];
}
PokeAuto.Pokemon.constructor = PokeAuto.Map;

PokeAuto.Map.prototype.generate = function() {
  for (var row = 0; row < this.height; row++) {
    this.map.push([]);
    for (var col = 0; col < this.width; col++) {
      var id = Math.floor((Math.random() * 720) + 1);
      this.map[row].push(PokeAuto.createPokemon(id));
    }
  }
}

PokeAuto.Map.prototype.clone = function() {
  var clone = new PokeAuto.Map(this.width, this.height);
  for (var row = 0; row < height; row++) {
    clone.map.push([]);
    for (var col = 0; col < width; col++) {
      clone.map[row].push(this.map[row][col]);
    }
  }
  return clone;
}

PokeAuto.Map.prototype.get = function(row, col) {
  if (row < 0) {
    row = this.height - row;
  } else if (row > this.height - 1) {
    row = row - this.height;
  }
  if (col < 0) {
    col = this.height - col;
  } else if (col > this.height - 1) {
    col = col - this.height;
  }
  return this.map[row][col];
}


PokeAuto.update = function(map, map_buffer) {
  for (var row = 0; row < height; row++) {
    for (var col = 0; col < width; col++) {
      map.get(row, col).fight(map(row + 1, col));
      map.get(row, col).fight(map(row - 1, col));
      map.get(row, col).fight(map(row, col + 1));
      map.get(row, col).fight(map(row, col - 1));
    }
  }
}

PokeAuto.draw = function(context, map) {
  for (var row = 0; row < height; row++) {
    for (var col = 0; col < width; col++) {
      context.fillStyle = type_colors[types_dict.cn[map.get(row, col).types[0]].ename];
      context.fillRect(col, row, 1, 1);
    }
  }
}

// var testBulbasaur = new PokeAuto.Pokemon(1, "Test Bulbasaur", [
//     "\u8349",
//     "\u6bd2"
// ], {
//     "Attack": 49,
//     "Defense": 49,
//     "HP": 45,
//     "Sp.Atk": 65,
//     "Sp.Def": 65,
//     "Speed": 45
// });
// var testCharizard = new PokeAuto.Pokemon(6, "Test Charizard", [
//     "\u708e",
//     "\u98de\u884c"
// ], {
//     "Attack": 84,
//     "Defense": 78,
//     "HP": 78,
//     "Sp.Atk": 109,
//     "Sp.Def": 85,
//     "Speed": 100
// });

//build game
var height = 500;
var width = 500;

var map = new PokeAuto.Map(height, width);
map.generate();

var map_buffer = map.clone();

var canvas = document.createElement("canvas");
canvas.width = height;
canvas.height = width;

document.body.appendChild(canvas);

var context = canvas.getContext("2d");
context.fillStyle = "#000";
context.fillRect(0, 0, canvas.width, canvas.height);

PokeAuto.draw(context, map);
