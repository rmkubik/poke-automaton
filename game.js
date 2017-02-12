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

PokeAuto.Pokemon.prototype.attack = function(other) {
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
  return damage;
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
    row = this.height + row;
  } else if (row > this.height - 1) {
    row = row - this.height;
  }
  if (col < 0) {
    col = this.width + col;
  } else if (col > this.width - 1) {
    col = col - this.width;
  }
  return this.map[row][col];
}

PokeAuto.Map.prototype.set = function(row, col, pokemon) {
  if (row < 0) {
    row = this.height + row;
  } else if (row > this.height - 1) {
    row = row - this.height;
  }
  if (col < 0) {
    col = this.width + col;
  } else if (col > this.width - 1) {
    col = col - this.width;
  }
  this.map[row][col] = pokemon;
}


PokeAuto.update = function(map, map_buffer) {
  var attacks = [];
  for (var row = 0; row < height; row++) {
    for (var col = 0; col < width; col++) {
      var curr = map.get(row, col);
      var up = map.get(row - 1, col);
      var down = map.get(row + 1, col);
      var left = map.get(row, col - 1);
      var right = map.get(row, col + 1);

      //which neighbor will take most damage?
      var max;
      var maxDamage = -1;
      if (curr.attack(up) > maxDamage && up.id !== curr.id) {
        maxDamage = curr.attack(up);
        max = {row: row - 1, col: col};
      }
      if (curr.attack(down) > maxDamage && down.id !== curr.id) {
        maxDamage = curr.attack(down);
        max = {row: row + 1, col: col};
      }
      if (curr.attack(left) > maxDamage && left.id !== curr.id) {
        maxDamage = curr.attack(left);
        max = {row: row, col: col - 1};
      }
      if (curr.attack(right) > maxDamage && right.id !== curr.id) {
        maxDamage = curr.attack(right);
        max = {row: row, col: col + 1};
      }
      //attack that neighbor
      if (max !== undefined) {
        map_buffer.get(max.row, max.col).takeDamage(maxDamage);
      }
      //place claim in buffer on cell
      attacks.push({
        target: map_buffer.get(max.row, max.col),
        target_loc: max,
        attacker: curr
      });
    }
  }

  //check each cell in buffer for claims
  for (var i = 0; i < attacks.length; i++) {
    var attack = attacks[i];
    if (!attack.target.alive) {
      if (attack.attacker.stats.Speed
        > map_buffer.get(attack.target_loc.row, attack.target_loc.col).stats.Speed) {
          //highest speed claimant wins cell
          map_buffer.set(attack.target_loc.row, attack.target_loc.col, attack.attacker);
      } else if (attack.attacker.stats.Speed
        === map_buffer.get(attack.target_loc.row, attack.target_loc.col).stats.Speed) {
          //in tie, randomly decide
          if (Math.random() > 0.5) {
            map_buffer.set(attack.target_loc.row, attack.target_loc.col, attack.attacker);
          }
      }
    }
  }
}

PokeAuto.bufferToggle = true;

PokeAuto.draw = function(context, map) {
  for (var row = 0; row < height; row++) {
    for (var col = 0; col < width; col++) {
      context.fillStyle = type_colors[types_dict.cn[map.get(row, col).types[0]].ename];
      context.fillRect(col, row, 1, 1);
    }
  }
}

//build game
var height = 500;
var width = 500;

var map = new PokeAuto.Map(height, width);
map.generate();

var map_buffer = map.clone();

var canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = height;
canvas.height = width;

canvas.addEventListener("click", function(e) {
  PokeAuto.gameLoop();
});

PokeAuto.gameLoop = function() {
  console.log(PokeAuto.bufferToggle);
  if (PokeAuto.bufferToggle) {
    PokeAuto.update(map, map_buffer);
  } else {
    PokeAuto.update(map_buffer, map);
  }
  if (PokeAuto.bufferToggle) {
    PokeAuto.draw(context, map);
    PokeAuto.bufferToggle = false;
  } else {
    PokeAuto.draw(context, map_buffer);
    PokeAuto.bufferToggle = true;
  }
  window.requestAnimationFrame(PokeAuto.gameLoop);
}

document.body.appendChild(canvas);

var context = canvas.getContext("2d");
context.fillStyle = "#000";
context.fillRect(0, 0, canvas.width, canvas.height);

PokeAuto.draw(context, map);
