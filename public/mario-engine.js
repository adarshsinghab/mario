
/* --- util.js --- */
(function() {
    if (typeof Mario === 'undefined') {
        window.Mario = {};
    }

    var Util = Mario.Util = {};

    Util.inherits = function(subclass, superclass) {
        function Surrogate() {};

        Surrogate.prototype = superclass.prototype;
        subclass.prototype = new Surrogate();
    }
})()
/* --- input.js --- */
(function() {
    var pressedKeys = {};

    function setKey(event, status) {
        var code = event.keyCode;
        var key;

        switch(code) {
        case 32:
            key = 'SPACE'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'UP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;
        case 88:
            key = 'JUMP'; break;
        case 90:
            key = 'RUN'; break;
        default:
            key = String.fromCharCode(code);
        }

        pressedKeys[key] = status;
    }

    document.addEventListener('keydown', function(e) {
        setKey(e, true);
    });

    document.addEventListener('keyup', function(e) {
        setKey(e, false);
    });

    window.addEventListener('blur', function() {
        pressedKeys = {};
    });

    window.input = {
        isDown: function(key) {
            return pressedKeys[key.toUpperCase()];
        },
        reset: function() {
          pressedKeys['RUN'] = false;
          pressedKeys['LEFT'] = false;
          pressedKeys['RIGHT'] = false;
          pressedKeys['DOWN'] = false;
          pressedKeys['JUMP'] = false;
        }
    };
})();

/* --- resources.js --- */
//simple resource loader
(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    // Load an image url or an array of image urls
    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            urlOrArr.forEach(function(url) {
                _load(url);
            });
        }
        else {
            _load(urlOrArr);
        }
    }

    function _load(url) {
        if(resourceCache[url]) {
            return resourceCache[url];
        }
        else {
            var img = new Image();
            img.onload = function() {
                resourceCache[url] = img;

                if(isReady()) {
                    readyCallbacks.forEach(function(func) { func(); });
                }
            };
            resourceCache[url] = false;
            img.src = url;
        }
    }

    function get(url) {
        return resourceCache[url];
    }

    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    function onReady(func) {
        readyCallbacks.push(func);
    }

    window.resources = {
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();

/* --- sprite.js --- */
(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};

  var Sprite = Mario.Sprite = function(img, pos, size, speed, frames, once) {
    this.pos = pos;
    this.size = size;
    this.speed = speed;
    this._index = 0;
    this.img = img;
    this.once = once;
    this.frames = frames;
  }

  Sprite.prototype.update = function(dt, gameTime) {
    if (gameTime && gameTime == this.lastUpdated) return;
    this._index += this.speed*dt;
    if (gameTime) this.lastUpdated = gameTime;
  }

  Sprite.prototype.setFrame = function(frame) {
    this._index = frame;
  }

  Sprite.prototype.render = function(ctx, posx, posy, vX, vY) {
    var frame;

    if (this.speed > 0) {
      var max = this.frames.length;
      var idx = Math.floor(this._index);
      frame = this.frames[idx % max];

      if (this.once && idx >= max) {
        this.done = true;
        return;
      }
    } else {
      frame = 0;
    }

    var x = this.pos[0];
    var y = this.pos[1];

    x += frame*this.size[0];
    ctx.drawImage(resources.get(this.img), x + (1/3),y + (1/3), this.size[0] - (2/3), this.size[1] - (2/3), Math.round(posx - vX), Math.round(posy - vY), this.size[0],this.size[1]);
  }
})();

/* --- entity.js --- */
(function() {
	if (typeof Mario === 'undefined')
		window.Mario = {};

	var Entity = Mario.Entity = function(options) {
	  this.vel = [0,0];
	  this.acc = [0,0];
		this.standing = true;
	  this.pos = options.pos;
	  this.sprite = options.sprite;
	  this.hitbox = options.hitbox;
	  this.left = false;
	}

	Entity.prototype.render = function(ctx, vX, vY) {
		this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY)
	}

	Entity.prototype.collideWall = function(wall) {
		//the wall will always be a 16x16 block with hitbox = [0,0,16,16].
		if (this.pos[0] > wall.pos[0]) {
			//from the right
			this.pos[0] = wall.pos[0] + wall.hitbox[2] - this.hitbox[0];
			this.vel[0] = Math.max(0, this.vel[0]);
			this.acc[0] = Math.max(0, this.acc[0]);
		} else {
			this.pos[0] = wall.pos[0] + wall.hitbox[0] - this.hitbox[2] - this.hitbox[0];
			this.vel[0] = Math.min(0, this.vel[0]);
			this.acc[0] = Math.min(0, this.acc[0]);
		}
	}

	Entity.prototype.bump = function() {;}
})();

/* --- pipe.js --- */
(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};


  //there are too many possible configurations of pipe to capture in a reasonable
  //set of simple variables. Joints, etc. are just too much.
  //To that end, the pipe class handles simple pipes, and we'll put together
  //anything more complex with individual props. OK? OK.
  Pipe = Mario.Pipe = function(options) {
    this.pos = options.pos

    //NOTE: direction is the direction you move INTO the pipe.
    this.direction = options.direction
    this.destination = options.destination
    this.length = options.length;

    if (this.direction === "UP" || this.direction === "DOWN") {
      this.hitbox = [0,0, 32, this.length * 16];
      this.midsection = level.pipeUpMid;
      this.endsection = level.pipeTop;
    } else {
      this.hitbox = [0,0, 16*this.length, 32];
      this.midsection = level.pipeSideMid;
      this.endsection = level.pipeLeft;
    }
  }

  Pipe.prototype.checkPipe = function() {
    if (this.destination === undefined || !input.isDown(this.direction)) return;

    var h = player.power===0 ? 16 : 32;
    var x = Math.floor(player.pos[0]);
    var y = Math.floor(player.pos[1]);
    switch (this.direction) {
      case 'RIGHT': if (x === this.pos[0]-16 &&
                        y >= this.pos[1] &&
                        y+h <= this.pos[1]+32) {
                          player.pipe(this.direction, this.destination)
                        }
        break;
      case 'LEFT': if (x === this.pos[0]+16*this.length &&
                       y >= this.pos[1] &&
                       y+h <= this.pos[1]+32) {
                         player.pipe(this.direction, this.destination)
                       }
        break;
      case 'UP': if (y === this.pos[1] + 16*this.length &&
                     x >= this.pos[0] &&
                     x+16 <= this.pos[0]+32) {
                       player.pipe(this.direction, this.destination)
                     }
        break;
      case 'DOWN': if (y+h === this.pos[1] &&
                    x >= this.pos[0] &&
                    x+16 <= this.pos[0]+32) {
                      player.pipe(this.direction, this.destination);
                    }
        break;
    }
  }

  //Note to self: next time, decide on a convention for which thing checks for collisions
  //and stick to it. This is a pain.
  Pipe.prototype.checkCollisions = function() {
    var that = this;
    level.enemies.forEach (function(ent) {
      that.isCollideWith(ent);
    });

    level.items.forEach (function(ent) {
      that.isCollideWith(ent);
    });

    fireballs.forEach(function(ent){
      that.isCollideWith(ent)
    });

    if (!player.piping) this.isCollideWith(player);
  }

  Pipe.prototype.isCollideWith = function (ent) {
    //long story short: because we scan every item, and and one 'rubble' item is four things with separate positions
    //we'll crash without this line as soon as we destroy a block. OOPS.
    if (ent.pos === undefined) return;


    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [Math.floor(this.pos[0] + this.hitbox[0]), Math.floor(this.pos[1] + this.hitbox[1])];
    var hpos2 = [Math.floor(ent.pos[0] + ent.hitbox[0]), Math.floor(ent.pos[1] + ent.hitbox[1])];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        //if the entity is over the block, it's basically floor
        var center = hpos2[0] + ent.hitbox[2] / 2;
        if (Math.abs(hpos2[1] + ent.hitbox[3] - hpos1[1]) <= ent.vel[1]) {
          ent.vel[1] = 0;
          ent.pos[1] = hpos1[1] - ent.hitbox[3] - ent.hitbox[1];
          ent.standing = true;
          if (ent instanceof Mario.Player) {
            ent.jumping = 0;
          }
        } else if (Math.abs(hpos2[1] - hpos1[1] - this.hitbox[3]) > ent.vel[1] &&
        center + 2 >= hpos1[0] && center - 2 <= hpos1[0] + this.hitbox[2]) {
          //ent is under the block.
          ent.vel[1] = 0;
          ent.pos[1] = hpos1[1] + this.hitbox[3];
          if (ent instanceof Mario.Player) {
            ent.jumping = 0;
          }
        } else {
          //entity is hitting it from the side, we're a wall
          ent.collideWall(this);
        }
      }
    }
  }

  //we COULD try to write some shenanigans so that the check gets put into the
  //collision code, but there won't ever be more than a handful of pipes in a level
  //so the performance hit of scanning all of them is miniscule.
  Pipe.prototype.update = function(dt) {
    if (this.destination) this.checkPipe();
  }

  //http://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-an-unsorted-array
  //I honestly have no idea if javascript does this, but I feel like it makes sense
  //stylistically to prefer branching outside of loops when possible as convention

  //TODO: edit the spritesheet so UP and LEFT pipes aren't backwards.
  Pipe.prototype.render = function(ctx, vX, vY) {
    switch (this.direction) {
      case "DOWN":
        this.endsection.render(ctx, this.pos[0], this.pos[1], vX, vY);
        for (var i = 1; i < this.length; i++) {
          this.midsection.render(ctx, this.pos[0], this.pos[1]+i*16, vX, vY)
        }
        break;
      case "UP":
        this.endsection.render(ctx, this.pos[0], this.pos[1]+16*(this.length-1), vX, vY)
        for (var i=0; i < this.length - 1; i++) {
          this.midsection.render(ctx, this.pos[0], this.pos[1]+i*16, vX, vY)
        }
        break;
      case "RIGHT":
        this.endsection.render(ctx, this.pos[0], this.pos[1], vX, vY)
        for (var i = 1; i < this.length; i++) {
          this.midsection.render(ctx, this.pos[0]+16*i, this.pos[1], vX, vY)
        }
        break;
      case "LEFT":
        this.endsection.render(ctx, this.pos[0]+16*(this.length-1), this.pos[1], vX, vY)
        for (var i = 0; i < this.legth-1; i++) {
          this.midsection.render(ctx, this.pos[0], this.pos[1]+i*16, vX, vY)
        }
        break;
    }
  }
})();

/* --- coin.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Coin = Mario.Coin = function(pos, sprite) {
    Mario.Entity.call(this, {
      pos: pos,
      sprite: sprite,
      hitbox: [0,0,16,16]
    });
    this.idx = level.items.length
  }

  Mario.Util.inherits(Coin, Mario.Entity);

  Coin.prototype.isPlayerCollided = function() {
    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+player.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+player.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        this.collect();
      }
    }
  }

  Coin.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }

  //money is not affected by gravity, you see.
  Coin.prototype.update = function(dt) {
    this.sprite.update(dt);
  }
  Coin.prototype.checkCollisions = function() {
    this.isPlayerCollided();
  }

  Coin.prototype.collect = function() {
    sounds.coin.currentTime = 0.05;
    sounds.coin.play();
    player.coins += 1;
    window.dispatchEvent(new CustomEvent('COIN_COLLECTED', { detail: { x: (this.pos[0] - vX)*3, y: (this.pos[1] - vY)*3, coins: player.coins, score: 200 } }));
    delete level.items[this.idx];
  }
})();

/* --- bcoin.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Bcoin = Mario.Bcoin = function(pos) {
    Mario.Entity.call(this, {
      pos: pos,
      sprite: level.bcoinSprite(),
      hitbox: [0,0,16,16]
    });
  }

  Mario.Util.inherits(Bcoin, Mario.Entity);

  //I'm not sure whether it makes sense to use an array for vel and acc here
  //in order to keep with convention, or to just use a single value, since
  //it's literally impossible for these to move left or right.
  Bcoin.prototype.spawn = function() {
    sounds.coin.currentTime = 0.05;
    sounds.coin.play();
    this.idx = level.items.length;
    level.items.push(this);
    this.active = true;
    this.vel = -12;
    this.targetpos = this.pos[1] - 32;
  }

  Bcoin.prototype.update = function(dt) {
    if (!this.active) return;

    if (this.vel > 0 && this.pos[1] >= this.targetpos) {
    player.coins += 1;
    window.dispatchEvent(new CustomEvent('COIN_COLLECTED', { detail: { x: (this.pos[0] - vX)*3, y: (this.pos[1] - vY)*3, coins: player.coins, score: 200 } }));
      //spawn a score thingy.
      delete level.items[this.idx];
    }

    this.acc = 0.75;
    this.vel += this.acc;
    this.pos[1] += this.vel;
    this.sprite.update(dt);
  }

  Bcoin.prototype.checkCollisions = function() {;}

})();

/* --- goomba.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  //TODO: On console the hitbox is smaller. Measure it and edit this.

  var Goomba = Mario.Goomba = function(pos, sprite) {
    this.dying = false;
    Mario.Entity.call(this, {
      pos: pos,
      sprite: sprite,
      hitbox: [0,0,16,16]
    });
    this.vel[0] = -0.5;
    this.idx = level.enemies.length;
  };

  Goomba.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  };

  Goomba.prototype.update = function(dt, vX) {
    if (this.pos[0] - vX > 336) { //if we're too far away, do nothing.
      return;
    } else if (this.pos[0] - vX < -32) {
      delete level.enemies[this.idx];
    }

    if (this.dying) {
      this.dying -= 1;
      if (!this.dying) {
        delete level.enemies[this.idx];
      }
    }
    this.acc[1] = 0.2;
    this.vel[1] += this.acc[1];
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.sprite.update(dt);
  };

  Goomba.prototype.collideWall = function() {
    this.vel[0] = -this.vel[0];
  };

  Goomba.prototype.checkCollisions = function() {
    if (this.flipping) {
      return;
    }

    var h = this.pos[1] % 16 === 0 ? 1 : 2;
    var w = this.pos[0] % 16 === 0 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete level.enemies[this.idx];
      return;
    }

    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }
    var that = this;
    level.enemies.forEach(function(enemy){
      if (enemy === that) { //don't check collisions with ourselves.
        return;
      } else if (enemy.pos[0] - vX > 336){ //stop checking once we get to far away dudes.
        return;
      } else {
        that.isCollideWith(enemy);
      }
    });
    this.isCollideWith(player);
  };

  Goomba.prototype.isCollideWith = function(ent) {
    if (ent instanceof Mario.Player && (this.dying || ent.invincibility)) {
      return;
    }

    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [ent.pos[0] + ent.hitbox[0], ent.pos[1] + ent.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        if (ent instanceof Mario.Player) { //if we hit the player
          if (ent.vel[1] > 0) { //then the goomba dies
            this.stomp();
          } else if (ent.starTime) {
            this.bump();
          } else { //or the player gets hit
            ent.damage();
          }
        } else {
          this.collideWall();
        }
      }
    }
  };

  Goomba.prototype.stomp = function() {
    sounds.stomp.play();
    player.bounce = true;
    this.sprite.pos[0] = 32;
    this.sprite.speed = 0;
    this.vel[0] = 0;
    this.dying = 10;
  };

  Goomba.prototype.bump = function() {
    sounds.kick.play();
    this.sprite.img = 'sprites/enemyr.png';
    this.flipping = true;
    this.pos[1] -= 1;
    this.vel[0] = 0;
    this.vel[1] = -2.5;
  };
})();

/* --- koopa.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Koopa = Mario.Koopa = function(pos, sprite, para) {
    this.dying = false;
    this.shell = false;

    this.para = para; //para. As in, is it a paratroopa?

    //So, funny story. The actual hitboxes don't reach all the way to the ground.
    //What that means is, as long as I use them to keep things on the floor
    //making the hitboxes accurate will make enemies sink into the ground.
    Mario.Entity.call(this, {
      pos: pos,
      sprite: sprite,
      hitbox: [2,8,12,24]
    });
    this.vel[0] = -0.5;
    this.idx = level.enemies.length;
  };

  Koopa.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  };

  Koopa.prototype.update = function(dt, vX) {
    if (this.turn) {
      this.vel[0] = -this.vel[0];
      if (this.shell) sounds.bump.play();
      this.turn = false;
    }
    if (this.vel[0] != 0) {
      this.left = (this.vel[0] < 0);
    }

    if (this.left) {
      this.sprite.img = 'sprites/enemy.png';
    } else {
      this.sprite.img = 'sprites/enemyr.png';
    }

    if (this.pos[0] - vX > 336) { //if we're too far away, do nothing.
      return;
    } else if (this.pos[0] - vX < -32) {
      delete level.enemies[this.idx];
    }

    if (this.dying) {
      this.dying -= 1;
      if (!this.dying) {
        delete level.enemies[this.idx];
      }
    }

    if (this.shell) {
      if (this.vel[0] == 0) {
        this.shell -= 1;
        if (this.shell < 120) {
          this.sprite.speed = 5;
        }
        if (this.shell == 0) {
          this.sprite = level.koopaSprite();
          this.hitbox = [2,8,12,24]
          if (this.left) {
            this.sprite.img = 'sprites/enemyr.png';
            this.vel[0] = 0.5;
            this.left = false;
          } else {
            this.vel[0] = -0.5;
            this.left = true;
          }
          this.pos[1] -= 16;
        }
      } else {
        this.shell = 360;
        this.sprite.speed = 0;
        this.sprite.setFrame(0);
      }
    }
    this.acc[1] = 0.2;
    this.vel[1] += this.acc[1];
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.sprite.update(dt);
  };

  Koopa.prototype.collideWall = function() {
    //This stops us from flipping twice on the same frame if we collide
    //with multiple wall tiles simultaneously.
    this.turn = true;
  };

  Koopa.prototype.checkCollisions = function() {
    var h = this.shell ? 1 : 2;
    if (this.pos[1] % 16 !== 0) {
      h += 1;
    }
    var w = this.pos[0] % 16 === 0 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete level.enemies[this.idx];
      return;
    }

    if (this.flipping) {
      return;
    }

    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }
    var that = this;
    level.enemies.forEach(function(enemy){
      if (enemy === that) { //don't check collisions with ourselves.
        return;
      } else if (enemy.pos[0] - vX > 336){ //stop checking once we get to far away dudes.
        return;
      } else {
        that.isCollideWith(enemy);
      }
    });
    this.isCollideWith(player);
  };

  Koopa.prototype.isCollideWith = function(ent) {
    if (ent instanceof Mario.Player && (this.dying || ent.invincibility)) {
      return;
    }

    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [ent.pos[0] + ent.hitbox[0], ent.pos[1] + ent.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        if (ent instanceof Mario.Player) {
          if (ent.vel[1] > 0) {
            player.bounce = true;
          }
          if (this.shell) {
            sounds.kick.play();
            if (this.vel[0] === 0) {
              if (ent.left) { //I'm pretty sure this isn't the real logic.
                this.vel[0] = -4;
              } else {
                this.vel[0] = 4;
              }
            } else {
              if (ent.bounce) {
                this.vel[0] = 0;
              } else ent.damage();
            }
          } else if (ent.vel[1] > 0) { //then we get BOPPED.
            this.stomp();
          } else { //or the player gets hit
            ent.damage();
          }
        } else {
          if (this.shell && (ent instanceof Mario.Goomba)) {
            ent.bump();
          } else this.collideWall();
        }
      }
    }
  };

  Koopa.prototype.stomp = function() {
    //Turn this thing into a shell if it isn't already. Kick it if it is.
    player.bounce = true;
    if (this.para) {
      this.para = false;
      this.sprite.pos[0] -= 32;
    } else {
      sounds.stomp.play();
      this.shell = 360;
      this.sprite.pos[0] += 64;
      this.sprite.pos[1] += 16;
      this.sprite.size = [16,16];
      this.hitbox = [2,0,12,16];
      this.sprite.speed = 0;
      this.frames = [0,1];
      this.vel = [0,0];
      this.pos[1] += 16;
    }

  };

  Koopa.prototype.bump = function() {
    sounds.kick.play();
    if (this.flipping) return;
    this.flipping = true;
    this.sprite.pos = [160, 0];
    this.sprite.size = [16,16];
    this.hitbox = [2, 0, 12, 16];
    this.sprite.speed = 0;
    this.vel[0] = 0;
    this.vel[1] = -2.5;
  };
})();

/* --- floor.js --- */
(function() {
	if (typeof Mario === 'undefined')
		window.Mario = {};

	var Floor = Mario.Floor = function(pos, sprite) {

		Mario.Entity.call(this, {
			pos: pos,
			sprite: sprite,
			hitbox: [0,0,16,16]
		});
	}

	Mario.Util.inherits(Floor, Mario.Entity);

	Floor.prototype.isCollideWith = function (ent) {
		//the first two elements of the hitbox array are an offset, so let's do this now.
		var hpos1 = [Math.floor(this.pos[0] + this.hitbox[0]), Math.floor(this.pos[1] + this.hitbox[1])];
		var hpos2 = [Math.floor(ent.pos[0] + ent.hitbox[0]), Math.floor(ent.pos[1] + ent.hitbox[1])];

		//if the hitboxes actually overlap
		if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
			if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
				if (!this.standing) {
					ent.bump();
				} else {
					//if the entity is over the block, it's basically floor
					var center = hpos2[0] + ent.hitbox[2] / 2;
					if (Math.abs(hpos2[1] + ent.hitbox[3] - hpos1[1]) <= ent.vel[1]) {
						if (level.statics[(this.pos[1] / 16) - 1][this.pos[0] / 16]) {return};
						ent.vel[1] = 0;
						ent.pos[1] = hpos1[1] - ent.hitbox[3] - ent.hitbox[1];
						ent.standing = true;
						if (ent instanceof Mario.Player) {
							ent.jumping = 0;
						}
					} else if (Math.abs(hpos2[1] - hpos1[1] - this.hitbox[3]) > ent.vel[1] &&
					center + 2 >= hpos1[0] && center - 2 <= hpos1[0] + this.hitbox[2]) {
						//ent is under the block.
						ent.vel[1] = 0;
						ent.pos[1] = hpos1[1] + this.hitbox[3];
						if (ent instanceof Mario.Player) {
							this.bonk(ent.power);
							ent.jumping = 0;
						}
					} else {
						//entity is hitting it from the side, we're a wall
						ent.collideWall(this);
					}
				}
			}
		}
	}

	Floor.prototype.bonk = function() {;}
})();

/* --- block.js --- */
(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};

  //TODO: clean up the logic for sprite switching.
  //TODO: There's a weird bug with the collision logic. Look into it.

  var Block = Mario.Block = function(options) {
    this.item = options.item;
    this.usedSprite = options.usedSprite;
    this.bounceSprite = options.bounceSprite;
    this.breakable = options.breakable;

    Mario.Entity.call(this, {
      pos: options.pos,
      sprite: options.sprite,
      hitbox: [0,0,16,16]
    });

    this.standing = true;
  }

  Mario.Util.inherits(Block, Mario.Floor);

  Block.prototype.break = function() {
    sounds.breakBlock.play();
    (new Mario.Rubble()).spawn(this.pos);
    var x = this.pos[0] / 16, y = this.pos[1] / 16;
    delete level.blocks[y][x];
  }

  Block.prototype.bonk = function(power) {
    sounds.bump.play();
    if (power > 0 && this.breakable) {
      this.break();
    } else if (this.standing){
      this.standing = false;
      if (this.item) {
        this.item.spawn();
        this.item = null;
      }
      this.opos = [];
      this.opos[0] = this.pos[0];
      this.opos[1] = this.pos[1];
      if (this.bounceSprite) {
        this.osprite = this.sprite;
        this.sprite = this.bounceSprite;
      } else {
        this.sprite = this.usedSprite;
      }

      this.vel[1] = -2;
    }
  }

  Block.prototype.update = function(dt, gameTime) {
    if (!this.standing) {
      if (this.pos[1] < this.opos[1] - 8) {
        this.vel[1] = 2;
      }
      if (this.pos[1] > this.opos[1]) {
        this.vel[1] = 0;
        this.pos = this.opos;
        if (this.osprite) {
          this.sprite = this.osprite;
        }
        this.standing = true;
      }
    } else {
      if (this.sprite === this.usedSprite) {
        var x = this.pos[0] / 16, y = this.pos[1] / 16;
        level.statics[y][x] = new Mario.Floor(this.pos, this.usedSprite);
        delete level.blocks[y][x];
      }
    }

    this.pos[1] += this.vel[1];
    this.sprite.update(dt, gameTime);
  }

})();

/* --- rubble.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  //TODO: make each rubble an entity, use that render and write in Entity.update
  var Rubble = Mario.Rubble = function() {
    this.sprites = [];
    this.poss = [];
    this.vels = [];
  }

  Rubble.prototype.spawn = function(pos) {
    this.idx = level.items.length;
    level.items.push(this);
    this.sprites[0] = level.rubbleSprite();
    this.sprites[1] = level.rubbleSprite();
    this.sprites[2] = level.rubbleSprite();
    this.sprites[3] = level.rubbleSprite();
    this.poss[0] = pos;
    this.poss[1] = [ pos[0] + 8, pos[1] ];
    this.poss[2] = [ pos[0], pos[1] + 8 ];
    this.poss[3] = [ pos[0] + 8, pos[1] + 8 ];
    this.vels[0] = [-1.25, -5];
    this.vels[1] = [1.25, -5];
    this.vels[2] = [-1.25, -3];
    this.vels[3] = [1.25, -3];
  }

  Rubble.prototype.update = function(dt) {
    for(var i = 0; i < 4; i++) {
      if (this.sprites[i]===undefined) continue;
      this.vels[i][1] += .3;
      this.poss[i][0] += this.vels[i][0];
      this.poss[i][1] += this.vels[i][1];
      this.sprites[i].update(dt);
      if (this.poss[i][1] > 256) {
        delete this.sprites[i];
      }
    }
    if (this.sprites.every(function (el) {return !el})) {
      delete level.items[this.idx];
    }
  }

  //You might argue that things that can't collide are more like scenery
  //but these move and need to be deleted, and i'd rather deal with the 1d array.
  Rubble.prototype.checkCollisions = function() {;}

  Rubble.prototype.render = function() {
    for(var i = 0; i < 4; i++) {
      if (this.sprites[i] === undefined) continue;
      this.sprites[i].render(ctx, this.poss[i][0], this.poss[i][1], vX, vY);
    }
  }
})();

/* --- prop.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  //props do even less than entities, so they don't need to inherit really
  var Prop = Mario.Prop = function(pos, sprite) {
    this.pos = pos;
    this.sprite = sprite;
  }

  //but we will be using the same Render, more or less.
  Prop.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }
})();

/* --- player.js --- */
(function() {
	if (typeof Mario === 'undefined')
		window.Mario = {};

	var Player = Mario.Player = function(pos) {
		//I know, I know, there are a lot of variables tracking Mario's state.
		//Maybe these can be consolidated some way? We'll see once they're all in.
		this.power = 0;
		this.coins = 0;
		this.powering = [];
		this.bounce = false;
		this.jumping = 0;
		this.canJump = true;
		this.invincibility = 0;
		this.crouching = false;
		this.fireballs = 0;
		this.runheld = false;
		this.noInput = false;
		this.targetPos = [];

		Mario.Entity.call(this, {
			pos: pos,
			sprite: new Mario.Sprite('sprites/player.png', [80,32],[16,16],0),
			hitbox: [0,0,16,16]
		});
	};

	Mario.Util.inherits(Player, Mario.Entity);

	Player.prototype.run = function() {
		this.maxSpeed = 2.5;
		if (this.power == 2 && !this.runheld) {
			this.shoot();
		}
		this.runheld = true;
	}

	Player.prototype.shoot = function() {
		if (this.fireballs >= 2) return; //Projectile limit!
		this.fireballs += 1;
		var fb = new Mario.Fireball([this.pos[0]+8,this.pos[1]]); //I hate you, Javascript.
		fb.spawn(this.left);
		this.shooting = 2;
	}

	Player.prototype.noRun = function() {
		this.maxSpeed = 1.5;
		this.moveAcc = 0.07;
		this.runheld = false;
	}

	Player.prototype.moveRight = function() {
		//we're on the ground
		if (this.vel[1] === 0 && this.standing) {
			if (this.crouching) {
				this.noWalk();
				return;
			}
			this.acc[0] = this.moveAcc;
			this.left = false;
		} else {
			this.acc[0] = this.moveAcc;
		}
	};

	Player.prototype.moveLeft = function() {
		if (this.vel[1] === 0 && this.standing) {
			if (this.crouching) {
				this.noWalk();
				return;
			}
			this.acc[0] = -this.moveAcc;
			this.left = true;
		} else {
			this.acc[0] = -this.moveAcc;
		}
	};

	Player.prototype.noWalk = function() {
		this.maxSpeed = 0;
		if (this.vel[0] === 0) return;

		if (Math.abs(this.vel[0]) <= 0.1) {
			this.vel[0] = 0;
			this.acc[0] = 0;
		}

	};

	Player.prototype.crouch = function() {
		if (this.power === 0) {
			this.crouching = false;
			return;
		}

		if (this.standing) this.crouching = true;
	}

	Player.prototype.noCrouch = function() {
		this.crouching = false;
	}

	Player.prototype.jump = function() {
		if (this.vel[1] > 0) {
			return;
		}
		if (this.jumping) {
			this.jumping -= 1;
		} else if (this.standing && this.canJump) {
			this.jumping = 20;
			this.canJump = false;
			this.standing = false;
			this.vel[1] = -6;
			if (this.power === 0) {
				sounds.smallJump.currentTime = 0;
				sounds.smallJump.play();
			} else {
				sounds.bigJump.currentTime = 0;
				sounds.bigJump.play();
			}
		}
	};

	Player.prototype.noJump = function() {
		this.canJump = true;
		if (this.jumping) {
			if (this.jumping <= 16) {
				this.vel[1] = 0;
				this.jumping = 0;
			} else this.jumping -= 1;
		}
	};

  Player.prototype.setAnimation = function() {
		if (this.dying) return;

		if (this.starTime) {
			var index;
			if (this.starTime > 60)
				index = Math.floor(this.starTime / 2) % 3;
			else index = Math.floor(this.starTime / 8) % 3;

			this.sprite.pos[1] = level.invincibility[index];
			if (this.power == 0) {
				this.sprite.pos[1] += 32;
			}
			this.starTime -= 1;
			if (this.starTime == 0) {
				switch(this.power) {
					case 0: this.sprite.pos[1] = 32; break;
					case 1: this.sprite.pos[1] = 0; break;
					case 2: this.sprite.pos[1] = 96; break;
				}
			}
		}
		//okay cool, now set the sprite
		if (this.crouching) {
			this.sprite.pos[0] = 176;
			this.sprite.speed = 0;
			return;
		}

    if (this.jumping) {
			this.sprite.pos[0] = 160;
			this.sprite.speed = 0;
		} else if (this.standing) {
			if (Math.abs(this.vel[0]) > 0) {
				if (this.vel[0] * this.acc[0] >= 0) {
					this.sprite.pos[0] = 96;
					this.sprite.frames = [0,1,2];
					if (this.vel[0] < 0.2) {
						this.sprite.speed = 5;
					} else {
						this.sprite.speed = Math.abs(this.vel[0]) * 8;
					}
				} else if ((this.vel[0] > 0 && this.left) || (this.vel[0] < 0 && !this.left)){
					this.sprite.pos[0] = 144;
					this.sprite.speed = 0;
				}
			} else {
				this.sprite.pos[0] = 80;
				this.sprite.speed = 0;
			}
			if (this.shooting) {
				this.sprite.pos[0] += 160;
				this.shooting -= 1;
			}
		}

		if (this.flagging) {
			this.sprite.pos[0] = 192;
			this.sprite.frames = [0,1];
			this.sprite.speed = 10;
			if (this.vel[1] === 0) this.sprite.frames = [0];
		}

		//which way are we facing?
		if (this.left) {
			this.sprite.img = 'sprites/playerl.png';
		} else {
			this.sprite.img = 'sprites/player.png';
		}
  };

	Player.prototype.update = function(dt, vX) {
		if (this.powering.length !== 0) {
			var next = this.powering.shift();
			if (next == 5) return;
			this.sprite.pos = this.powerSprites[next];
			this.sprite.size = this.powerSizes[next];
			this.pos[1] += this.shift[next];
			if (this.powering.length === 0) {
				delete level.items[this.touchedItem];
			}
			return;
		}

		if (this.invincibility) {
			this.invincibility -= Math.round(dt * 60);
		}

		if (this.waiting) {
			this.waiting -= dt;
			if (this.waiting <= 0) {
				this.waiting = 0;
			} else return;
		}

		if (this.bounce) {
			this.bounce = false;
			this.standing = false;
			this.vel[1] = -3;
		}

		if (this.pos[0] <= vX) {
			this.pos[0] = vX;
			this.vel[0] = Math.max(this.vel[0], 0);
		}

		if (Math.abs(this.vel[0]) > this.maxSpeed) {
			this.vel[0] -= 0.05 *  this.vel[0] / Math.abs(this.vel[0]);
			this.acc[0] = 0;
		}

		if (this.dying){
			if (this.pos[1] < this.targetPos[1]) {
				this.vel[1] = 1;
			}
			this.dying -= 1 * dt;
			if (this.dying <= 0) {
				player = new Mario.Player(level.playerPos);
				level.loader.call();
				input.reset(); music.overworld.play().catch(e=>console.log(e));
			}
		}
		else {
			this.acc[1] = 0.25
			if (this.pos[1] > 240) {
				this.die();
			}
		}

		if (this.piping) {
			this.acc = [0,0];
			var pos = [Math.round(this.pos[0]), Math.round(this.pos[1])]
			if (pos[0] === this.targetPos[0] && pos[1] === this.targetPos[1]) {
				this.piping = false;
				this.pipeLoc.call();
			}
		}

		if (this.flagging) {
			this.acc = [0,0];
		}

		if (this.exiting) {
			this.left = false;
			this.flagging = false;
			this.vel[0] = 1.5;
			if (this.pos[0] >= this.targetPos[0]) {
				this.sprite.size = [0,0];
				this.vel = [0,0];
				window.setTimeout(function() {
					player.sprite.size = player.power===0 ? [16,16] : [16,32];
					player.exiting = false;
					player.noInput = false;
					level.loader();
					if (player.power !== 0) player.pos[1] -= 16;
					music.overworld.currentTime = 0;
				}, 5000);
			}
		}

		//approximate acceleration
		this.vel[0] += this.acc[0];
		this.vel[1] += this.acc[1];
		this.pos[0] += this.vel[0];
		this.pos[1] += this.vel[1];

    this.setAnimation();
		this.sprite.update(dt);
	};

	Player.prototype.checkCollisions = function() {
		if (this.piping || this.dying) return;
		//x-axis first!
		var h = this.power > 0 ? 2 : 1;
		var w = 1;
		if (this.pos[1] % 16 !== 0) {
			h += 1;
		}
		if (this.pos[0] % 16 !== 0) {
			w += 1;
		}
		var baseX = Math.floor(this.pos[0] / 16);
		var baseY = Math.floor(this.pos[1] / 16);

		for (var i = 0; i < h; i++) {
			if (baseY + i < 0 || baseY + i >= 15) continue;
			for (var j = 0; j < w; j++) {
				if (baseY < 0) { i++;}
				if (level.statics[baseY + i][baseX + j]) {
					level.statics[baseY + i][baseX + j].isCollideWith(this);
				}
				if (level.blocks[baseY + i][baseX + j]) {
					level.blocks[baseY + i][baseX + j].isCollideWith(this);
				}
			}
		}
	};

	Player.prototype.powerUp = function(idx) {
		sounds.powerup.play();
	  this.powering = [0,5,2,5,1,5,2,5,1,5,2,5,3,5,1,5,2,5,3,5,1,5,4];
		this.touchedItem = idx;

		if (this.power === 0) {
			this.sprite.pos[0] = 80;
			var newy = this.sprite.pos[1] - 32;
			this.powerSprites = [[80, newy+32], [80, newy+32], [320, newy], [80, newy], [128, newy]];
			this.powerSizes = [[16,16],[16,16],[16,32],[16,32],[16,32]];
			this.shift = [0,16,-16,0,-16];
			this.power = 1;
			this.hitbox = [0,0,16,32];
		} else if (this.power == 1) {
			var curx = this.sprite.pos[0];
			this.powerSprites = [[curx, 96], [curx, level.invincibility[0]],
				[curx, level.invincibility[1]], [curx, level.invincibility[2]],
				[curx, 96]];
			this.powerSizes[[16,32],[16,32],[16,32],[16,32],[16,32]];
			this.shift = [0,0,0,0,0];
			this.power = 2;
		} else {
			this.powering = [];
			delete level.items[idx];
			//no animation, but we play the sound and you get 5000 points.
		}
	};

	Player.prototype.damage = function() {
		if (this.power === 0) { //if you're already small, you dead!
			this.die();
		} else { //otherwise, you get turned into small mario
			sounds.pipe.play();
			this.powering = [0,5,1,5,2,5,1,5,2,5,1,5,2,5,1,5,2,5,1,5,2,5,3];
			this.shift = [0,16,-16,16];
			this.sprite.pos = [160, 0];
			this.powerSprites = [[160,0], [240, 32], [240, 0], [160, 32]];
			this.powerSizes = [[16, 32], [16,16], [16,32], [16,16]];
			this.invincibility = 120;
			this.power = 0;
			this.hitbox = [0,0,16,16];
		}
	};

	Player.prototype.die = function () {
		//TODO: rewrite the way sounds work to emulate the channels of an NES.
		music.overworld.pause();
		music.underground.pause();
		music.overworld.currentTime = 0;
		music.death.play();
		this.noWalk();
		this.noRun();
		this.noJump();

		this.acc[0] = 0;
		this.sprite.pos = [176, 32];
		this.sprite.speed = 0;
		this.power = 0;
		this.waiting = 0.5;
		this.dying = 2;

		if (this.pos[1] < 240) { //falling into a pit doesn't do the animation.
			this.targetPos = [this.pos[0], this.pos[1]-128];
			this.vel = [0,-5];
		} else {
			this.vel = [0,0];
			this.targetPos = [this.pos[0], this.pos[1] - 16];
		}
	};

	Player.prototype.star = function(idx) {
		delete level.items[idx];
		this.starTime = 660;
	}

	Player.prototype.pipe = function(direction, destination) {
		sounds.pipe.play();
		this.piping = true;
		this.pipeLoc = destination;
		switch(direction) {
			case "LEFT":
				this.vel = [-1,0];
				this.targetPos = [Math.round(this.pos[0]-16), Math.round(this.pos[1])]
				break;
			case "RIGHT":
				this.vel = [1,0];
				this.targetPos = [Math.round(this.pos[0]+16), Math.round(this.pos[1])]
				break;
			case "DOWN":
				this.vel = [0,1];
				this.targetPos = [Math.round(this.pos[0]), Math.round(this.pos[1]+this.hitbox[3])]
				break;
			case "UP":
				this.vel = [0,-1];
				this.targetPos = [Math.round(this.pos[0]), Math.round(this.pos[1]-this.hitbox[3])]
				break;
		}
	}

	Player.prototype.flag = function() {
		this.noInput = true;
		this.flagging = true;
		this.vel = [0, 2];
		this.acc = [0, 0];
	}

	Player.prototype.exit = function() {
		this.pos[0] += 16;
		this.targetPos[0] = level.exit * 16;
		this.left = true;
		this.setAnimation();
		this.waiting = 1;
		this.exiting = true;
	}
})();

/* --- flag.js --- */
(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};

  Flag = Mario.Flag = function(pos) {
    //afaik flags always have the same height and Y-position
    this.pos = [pos, 49];
    this.hitbox = [0,0,0,0];
    this.vel = [0,0];
    this.acc = [0,0];
  }

  Flag.prototype.collideWall = function() {;
  }

  Flag.prototype.update = function(dt){
    if (!this.done && this.pos[1] >= 170) {
      this.vel = [0,0];
      this.pos[1] = 170;
      player.exit();
      this.done = true;
    }
    this.pos[1] += this.vel[1];
  }

  Flag.prototype.checkCollisions = function() {
    this.isPlayerCollided();
  }

  Flag.prototype.isPlayerCollided = function() {
    if (this.hit) return;
    if (player.pos[0] + 8 >= this.pos[0]) {
      music.overworld.pause();
      sounds.flagpole.play();
      setTimeout(function() {
        music.clear.play();
      }, 2000);
      this.hit = true;
      player.flag();
      this.vel = [0, 2];
    }
  }

  Flag.prototype.render = function() {
    level.flagpoleSprites[2].render(ctx, this.pos[0]-8, this.pos[1], vX, vY);
  }
})();

/* --- fireflower.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Fireflower = Mario.Fireflower = function(pos) {
    this.spawning = false;
    this.waiting = 0;

    Mario.Entity.call(this, {
      pos: pos,
      sprite: level.fireFlowerSprite,
      hitbox: [0,0,16,16]
    });
  }

  Mario.Util.inherits(Fireflower, Mario.Entity);

  Fireflower.prototype.render = function(ctx, vX, vY) {
    if (this.spawning > 1) return;
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }

  Fireflower.prototype.spawn = function() {
    sounds.itemAppear.play();
    this.idx = level.items.length;
    level.items.push(this);
    this.spawning = 12;
    this.targetpos = [];
    this.targetpos[0] = this.pos[0];
    this.targetpos[1] = this.pos[1] - 16;
  }

  Fireflower.prototype.update = function(dt) {
    if (this.spawning > 1) {
      this.spawning -= 1;
      if (this.spawning == 1) this.vel[1] = -.5;
      return;
    }
    if (this.spawning) {
      if (this.pos[1] <= this.targetpos[1]) {
        this.pos[1] = this.targetpos[1];
        this.vel[1] = 0;
        this.spawning = 0;
      }
    }

      this.vel[1] += this.acc[1];
      this.pos[0] += this.vel[0];
      this.pos[1] += this.vel[1];
      this.sprite.update(dt);
  }

  Fireflower.prototype.checkCollisions = function() {
    if (this.spawning) {return;}
    this.isPlayerCollided();
  }

  Fireflower.prototype.isPlayerCollided = function() {
    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+player.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+player.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        player.powerUp(this.idx);
      }
    }
  }

  //This should never be called, but just in case.
  Fireflower.prototype.bump = function() {;}

})();

/* --- star.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Star = Mario.Star = function(pos) {
    this.spawning = false;
    this.waiting = 0;

    Mario.Entity.call(this, {
      pos: pos,
      sprite: level.starSprite,
      hitbox: [0,0,16,16]
    });
  }

  Mario.Util.inherits(Star, Mario.Entity);

  Star.prototype.render = function(ctx, vX, vY) {
    if (this.spawning > 1) return;
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }

  Star.prototype.spawn = function() {
    this.idx = level.items.length;
    level.items.push(this);
    this.spawning = 12;
    this.targetpos = [];
    this.targetpos[0] = this.pos[0];
    this.targetpos[1] = this.pos[1] - 16;
  }

  Star.prototype.update = function(dt) {
    if (this.spawning > 1) {
      this.spawning -= 1;
      if (this.spawning == 1) this.vel[1] = -.5;
      return;
    }
    if (this.spawning) {
      if (this.pos[1] <= this.targetpos[1]) {
        this.pos[1] = this.targetpos[1];
        this.vel[1] = 0;
        this.waiting = 5;
        this.spawning = 0;
        this.vel[0] = 1;
      }
    } else {
      this.acc[1] = 0.2;
    }

    if (this.standing) {
      this.standing = false;
      this.vel[1] = -3;
    }

    if (this.waiting) {
      this.waiting -= 1;
    } else {
      this.vel[1] += this.acc[1];
      this.pos[0] += this.vel[0];
      this.pos[1] += this.vel[1];
      this.sprite.update(dt);
    }
  }

  Star.prototype.collideWall = function() {
    this.vel[0] = -this.vel[0];
  }

  Star.prototype.checkCollisions = function() {
    if(this.spawning) {
      return;
    }
    var h = this.pos[1] % 16 == 0 ? 1 : 2;
    var w = this.pos[0] % 16 == 0 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete level.items[this.idx];
      return;
    }

    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }

    this.isPlayerCollided();
  }

  //we have access to player everywhere, so let's just do this.
  Star.prototype.isPlayerCollided = function() {
    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+player.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+player.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        player.star(this.idx);
      }
    }
  }

  Star.prototype.bump = function() {
    this.vel[1] = -2;
  }

})();

/* --- fireball.js --- */
(function() {
  if (typeof Mario === 'undefined')
    window.Mario = {};

  var Fireball = Mario.Fireball = function(pos) {
    this.hit = 0;
    this.standing = false;

    Mario.Entity.call(this, {
      pos: pos,
      sprite: new Mario.Sprite('sprites/items.png', [96, 144], [8,8], 5, [0,1,2,3]),
      hitbox: [0,0,8,8]
    });
  }

  Mario.Util.inherits(Fireball, Mario.Entity);

  Fireball.prototype.spawn = function(left) {
    sounds.fireball.currentTime = 0;
    sounds.fireball.play();
    if (fireballs[0]) {
      this.idx = 1;
      fireballs[1] = this;
    } else {
      this.idx = 0;
      fireballs[0] = this;
    }
    this.vel[0] = (left ? -5 : 5);
    this.standing = false;
    this.vel[1] = 0;
  }

  Fireball.prototype.render = function(ctx, vX, vY) {
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }

  Fireball.prototype.update = function(dt) {
    if (this.hit == 1) {
      this.sprite.pos = [96, 160];
      this.sprite.size = [16,16];
      this.sprite.frames = [0,1,2];
      this.sprite.speed = 8;
      this.hit += 1;
      return;
    } else if (this.hit == 5) {
      delete fireballs[this.idx];
      player.fireballs -= 1;
      return;
    } else if (this.hit) {
      this.hit += 1;
      return;
    }

    //In retrospect, the way collision is being handled is RIDICULOUS
    //but I don't have to use some horrible kludge for this.
    if (this.standing) {
      this.standing = false;
      this.vel[1] = -4;
    }

    this.acc[1] = 0.5;

    this.vel[1] += this.acc[1];
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    if (this.pos[0] < vX || this.pos[0] > vX + 256) {
      this.hit = 1;
    }
    this.sprite.update(dt);
  }

  Fireball.prototype.collideWall = function() {
    if (!this.hit) this.hit = 1;
  }

  Fireball.prototype.checkCollisions = function() {
    if (this.hit) return;
    var h = this.pos[1] % 16 < 8 ? 1 : 2;
    var w = this.pos[0] % 16 < 8 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete fireballs[this.idx];
      player.fireballs -= 1;
      return;
    }

    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }

    var that = this;
    level.enemies.forEach(function(enemy){
      if (enemy.flipping || enemy.pos[0] - vX > 336){ //stop checking once we get to far away dudes.
        return;
      } else {
        that.isCollideWith(enemy);
      }
    });
  }

  Fireball.prototype.isCollideWith = function(ent) {
    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [ent.pos[0] + ent.hitbox[0], ent.pos[1] + ent.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+ent.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+ent.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        this.hit = 1;
        ent.bump();
      }
    }
  };

  Fireball.prototype.bump = function() {;}
})();

/* --- mushroom.js --- */
(function() {
  if (typeof Mario === 'undefined')
  window.Mario = {};

  var Mushroom = Mario.Mushroom = function(pos) {
    this.spawning = false;
    this.waiting = 0;

    Mario.Entity.call(this, {
      pos: pos,
      sprite: level.superShroomSprite,
      hitbox: [0,0,16,16]
    });
  }

  Mario.Util.inherits(Mushroom, Mario.Entity);

  Mushroom.prototype.render = function(ctx, vX, vY) {
    if (this.spawning > 1) return;
    this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
  }

  Mushroom.prototype.spawn = function() {
    if (player.power > 0) {
      //replace this with a fire flower
      var ff = new Mario.Fireflower(this.pos)
      ff.spawn();
      return;
    }
    sounds.itemAppear.play();
    this.idx = level.items.length;
    level.items.push(this);
    this.spawning = 12;
    this.targetpos = [];
    this.targetpos[0] = this.pos[0];
    this.targetpos[1] = this.pos[1] - 16;
  }

  Mushroom.prototype.update = function(dt) {
    if (this.spawning > 1) {
      this.spawning -= 1;
      if (this.spawning == 1) this.vel[1] = -.5;
      return;
    }
    if (this.spawning) {
      if (this.pos[1] <= this.targetpos[1]) {
        this.pos[1] = this.targetpos[1];
        this.vel[1] = 0;
        this.waiting = 5;
        this.spawning = 0;
        this.vel[0] = 1;
      }
    } else {
      this.acc[1] = 0.2;
    }

    if (this.waiting) {
      this.waiting -= 1;
    } else {
      this.vel[1] += this.acc[1];
      this.pos[0] += this.vel[0];
      this.pos[1] += this.vel[1];
      this.sprite.update(dt);
    }
  }

  Mushroom.prototype.collideWall = function() {
    this.vel[0] = -this.vel[0];
  }

  Mushroom.prototype.checkCollisions = function() {
    if(this.spawning) {
      return;
    }
    var h = this.pos[1] % 16 == 0 ? 1 : 2;
    var w = this.pos[0] % 16 == 0 ? 1 : 2;

    var baseX = Math.floor(this.pos[0] / 16);
    var baseY = Math.floor(this.pos[1] / 16);

    if (baseY + h > 15) {
      delete level.items[this.idx];
      return;
    }

    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        if (level.statics[baseY + i][baseX + j]) {
          level.statics[baseY + i][baseX + j].isCollideWith(this);
        }
        if (level.blocks[baseY + i][baseX + j]) {
          level.blocks[baseY + i][baseX + j].isCollideWith(this);
        }
      }
    }

    this.isPlayerCollided();
  }

  //we have access to player everywhere, so let's just do this.
  Mushroom.prototype.isPlayerCollided = function() {
    //the first two elements of the hitbox array are an offset, so let's do this now.
    var hpos1 = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
    var hpos2 = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];

    //if the hitboxes actually overlap
    if (!(hpos1[0] > hpos2[0]+player.hitbox[2] || (hpos1[0]+this.hitbox[2] < hpos2[0]))) {
      if (!(hpos1[1] > hpos2[1]+player.hitbox[3] || (hpos1[1]+this.hitbox[3] < hpos2[1]))) {
        player.powerUp(this.idx);
      }
    }
  }

  Mushroom.prototype.bump = function() {
    this.vel[1] = -2;
  }

})();

/* --- levels/11.js --- */
var oneone = Mario.oneone = function() {
  //The things that need to be passed in are basically just dependent on what
  //tileset we're in, so it makes more sense to just make one variable for that, so
  //TODO: put as much of this in the Level object definition as possible.
  level = new Mario.Level({
    playerPos: [56,192],
    loader: Mario.oneone,
    background: "#7974FF",
    scrolling: true,
    invincibility: [144, 192, 240],
    exit: 204,
    floorSprite:  new Mario.Sprite('sprites/tiles.png', [0,0],[16,16],0),
    cloudSprite:  new Mario.Sprite('sprites/tiles.png', [0,320],[48,32],0),
    wallSprite: new Mario.Sprite('sprites/tiles.png', [0, 16],[16,16],0),
    brickSprite: new Mario.Sprite('sprites/tiles.png', [16, 0], [16,16], 0),
    brickBounceSprite: new Mario.Sprite('sprites/tiles.png',[32,0],[16,16],0),
    rubbleSprite: function () {
      return new Mario.Sprite('sprites/items.png', [64,0], [8,8], 3, [0,1])
    },
    ublockSprite: new Mario.Sprite('sprites/tiles.png', [48, 0], [16,16],0),
    superShroomSprite: new Mario.Sprite('sprites/items.png', [0,0], [16,16], 0),
    fireFlowerSprite: new Mario.Sprite('sprites/items.png', [0,32], [16,16], 20, [0,1,2,3]),
    starSprite: new Mario.Sprite('sprites/items.png', [0,48], [16,16], 20, [0,1,2,3]),
    pipeLEndSprite: new Mario.Sprite('sprites/tiles.png', [0, 128], [16,16], 0),
    pipeREndSprite: new Mario.Sprite('sprites/tiles.png', [16, 128], [16,16], 0),
    pipeLMidSprite: new Mario.Sprite('sprites/tiles.png', [0, 144], [16,16], 0),
    pipeRMidSprite: new Mario.Sprite('sprites/tiles.png', [16, 144], [16,16], 0),

    pipeUpMid: new Mario.Sprite('sprites/tiles.png', [0, 144], [32,16], 0),
    pipeSideMid: new Mario.Sprite('sprites/tiles.png', [48, 128], [16,32], 0),
    pipeLeft: new Mario.Sprite('sprites/tiles.png', [32, 128], [16,32], 0),
    pipeTop: new Mario.Sprite('sprites/tiles.png', [0, 128], [32,16], 0),
    qblockSprite: new Mario.Sprite('sprites/tiles.png', [384, 0], [16,16], 8, [0,0,0,0,1,2,1]),
    bcoinSprite: function() {
      return new Mario.Sprite('sprites/items.png', [0,112],[16,16], 20,[0,1,2,3]);
    },
    cloudSprites:[
      new Mario.Sprite('sprites/tiles.png', [0,320],[16,32],0),
      new Mario.Sprite('sprites/tiles.png', [16,320],[16,32],0),
      new Mario.Sprite('sprites/tiles.png', [32,320],[16,32],0)
    ],
    hillSprites: [
      new Mario.Sprite('sprites/tiles.png', [128,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [144,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [160,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [128,144],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [144,144],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [160,144],[16,16],0)
    ],
    bushSprite: new Mario.Sprite('sprites/tiles.png', [176, 144], [48, 16], 0),
    bushSprites: [
     new Mario.Sprite('sprites/tiles.png', [176,144], [16,16],0),
     new Mario.Sprite('sprites/tiles.png', [192,144], [16,16],0),
     new Mario.Sprite('sprites/tiles.png', [208,144], [16,16],0)],
   goombaSprite: function() {
     return new Mario.Sprite('sprites/enemy.png', [0, 16], [16,16], 3, [0,1]);
   },
   koopaSprite: function() {
     return new Mario.Sprite('sprites/enemy.png', [96,0], [16,32], 2, [0,1]);
   },
   flagPoleSprites: [
     new Mario.Sprite('sprites/tiles.png', [256, 128], [16,16], 0),
     new Mario.Sprite('sprites/tiles.png', [256, 144], [16,16], 0),
     new Mario.Sprite('sprites/items.png', [128, 32], [16,16], 0)
   ]
 });
  ground = [[0,69],[71,86],[89,153],[155,212]];
  player.pos[0] = level.playerPos[0];
  player.pos[1] = level.playerPos[1];
  vX = 0;

  //build THE GROUND
  ground.forEach(function(loc) {
    level.putFloor(loc[0],loc[1]);
  });

  //build scenery
  clouds = [[7,3],[19, 2],[56, 3],[67, 2],[87, 2],[103, 2],[152, 3],[163, 2],[200, 3]];
  clouds.forEach(function(cloud){
    level.putCloud(cloud[0],cloud[1]);
  });

  twoClouds = [[36,2],[132,2],[180,2]];
  twoClouds.forEach(function(cloud){
    level.putTwoCloud(cloud[0],cloud[1]);
  });

  threeClouds = [[27,3],[75,3],[123,3],[171,3]];
  threeClouds.forEach(function(cloud){
    level.putThreeCloud(cloud[0],cloud[1]);
  });

  bHills = [0,48,96,144,192]
  bHills.forEach(function(hill) {
    level.putBigHill(hill, 12);
  });

  sHills = [16,64,111,160];
  sHills.forEach(function(hill) {
    level.putSmallHill(hill, 12);
  });

  bushes = [23,71,118,167];
  bushes.forEach(function(bush) {
    level.putBush(bush, 12);
  });

  twoBushes = [41,89,137];
  twoBushes.forEach(function(bush) {
    level.putTwoBush(bush, 12);
  });

  threeBushes = [11,59,106];
  threeBushes.forEach(function(bush) {
    level.putThreeBush(bush, 12);
  });

  //interactable terrain
  level.putQBlock(16, 9, new Mario.Bcoin([256, 144]));
  level.putBrick(20, 9, null);
  level.putQBlock(21, 9, new Mario.Mushroom([336, 144]));
  level.putBrick(22, 9, null);
  level.putQBlock(22, 5, new Mario.Bcoin([352, 80]));
  level.putQBlock(23, 9, new Mario.Bcoin([368, 144]));
  level.putBrick(24, 9, null);
  level.putPipe(28, 13, 2);
  level.putPipe(38, 13, 3);
  level.putPipe(46, 13, 4);
  level.putRealPipe(57, 9, 4, "DOWN", Mario.oneonetunnel);
  level.putBrick(77, 9, null);
  level.putQBlock(78, 9, new Mario.Mushroom([1248, 144]));
  level.putBrick(79, 9, null);
  level.putBrick(80, 5, null);
  level.putBrick(81, 5, null);
  level.putBrick(82, 5, null);
  level.putBrick(83, 5, null);
  level.putBrick(84, 5, null);
  level.putBrick(85, 5, null);
  level.putBrick(86, 5, null);
  level.putBrick(87, 5, null);
  level.putBrick(91, 5, null);
  level.putBrick(92, 5, null);
  level.putBrick(93, 5, null);
  level.putQBlock(94, 5, new Mario.Bcoin([1504, 80]));
  level.putBrick(94, 9, null);
  level.putBrick(100, 9, new Mario.Star([1600, 144]));
  level.putBrick(101, 9, null);
  level.putQBlock(105, 9, new Mario.Bcoin([1680, 144]));
  level.putQBlock(108, 9, new Mario.Bcoin([1728, 144]));
  level.putQBlock(108, 5, new Mario.Mushroom([1728, 80]));
  level.putQBlock(111, 9, new Mario.Bcoin([1776, 144]));
  level.putBrick(117, 9, null);
  level.putBrick(120, 5, null);
  level.putBrick(121, 5, null);
  level.putBrick(122, 5, null);
  level.putBrick(123, 5, null);
  level.putBrick(128, 5, null);
  level.putQBlock(129, 5, new Mario.Bcoin([2074, 80]));
  level.putBrick(129, 9, null);
  level.putQBlock(130, 5, new Mario.Bcoin([2080, 80]));
  level.putBrick(130, 9, null);
  level.putBrick(131, 5, null);
  level.putWall(134, 13, 1);
  level.putWall(135, 13, 2);
  level.putWall(136, 13, 3);
  level.putWall(137, 13, 4);
  level.putWall(140, 13, 4);
  level.putWall(141, 13, 3);
  level.putWall(142, 13, 2);
  level.putWall(143, 13, 1);
  level.putWall(148, 13, 1);
  level.putWall(149, 13, 2);
  level.putWall(150, 13, 3);
  level.putWall(151, 13, 4);
  level.putWall(152, 13, 4);
  level.putWall(155, 13, 4);
  level.putWall(156, 13, 3);
  level.putWall(157, 13, 2);
  level.putWall(158, 13, 1);
  level.putPipe(163, 13, 2);
  level.putBrick(168, 9, null);
  level.putBrick(169, 9, null);
  level.putQBlock(170, 9, new Mario.Bcoin([2720, 144]));
  level.putBrick(171, 9, null);
  level.putPipe(179, 13, 2);
  level.putWall(181, 13, 1);
  level.putWall(182, 13, 2);
  level.putWall(183, 13, 3);
  level.putWall(184, 13, 4);
  level.putWall(185, 13, 5);
  level.putWall(186, 13, 6);
  level.putWall(187, 13, 7);
  level.putWall(188, 13, 8);
  level.putWall(189, 13, 8);
  level.putFlagpole(198);

  //and enemies
  level.putGoomba(22, 12);
  level.putGoomba(40, 12);
  level.putGoomba(50, 12);
  level.putGoomba(51, 12);
  level.putGoomba(82, 4);
  level.putGoomba(84, 4);
  level.putGoomba(100, 12);
  level.putGoomba(102, 12);
  level.putGoomba(114, 12);
  level.putGoomba(115, 12);
  level.putGoomba(122, 12);
  level.putGoomba(123, 12);
  level.putGoomba(125, 12);
  level.putGoomba(126, 12);
  level.putGoomba(170, 12);
  level.putGoomba(172, 12);
  level.putKoopa(35, 11);

  music.underground.pause();
  // music.overworld.currentTime = 0;
  music.overworld.play();
};

/* --- levels/11tunnel.js --- */
var oneonetunnel = Mario.oneonetunnel = function() {
  level = new Mario.Level({
    playerPos: [40,16],
    loader: Mario.oneonetunnel,
    background: "#000000",
    scrolling: false,
    coinSprite: function() {
      return new Mario.Sprite('sprites/items.png', [0,96],[16,16], 6,[0,0,0,0,1,2,1]);
    },
    floorSprite:  new Mario.Sprite('sprites/tiles.png', [0,32],[16,16],0),
    wallSprite: new Mario.Sprite('sprites/tiles.png', [32, 32],[16,16],0),
    brickSprite: new Mario.Sprite('sprites/tiles.png', [16, 0], [16,16], 0),
    brickBounceSprite: new Mario.Sprite('sprites/tiles.png',[32,0],[16,16],0),
    ublockSprite: new Mario.Sprite('sprites/tiles.png', [48, 0], [16,16],0),
    pipeLMidSprite: new Mario.Sprite('sprites/tiles.png', [0, 144], [16,16], 0),
    pipeRMidSprite: new Mario.Sprite('sprites/tiles.png', [16, 144], [16,16], 0),
    pipeLEndSprite: new Mario.Sprite('sprites/tiles.png', [0, 128], [16,16], 0),
    pipeREndSprite: new Mario.Sprite('sprites/tiles.png', [16, 128], [16,16], 0),
    pipeUpMid: new Mario.Sprite('sprites/tiles.png', [0, 144], [32,16], 0),
    pipeSideMid: new Mario.Sprite('sprites/tiles.png', [48, 128], [16,32], 0),
    pipeLeft: new Mario.Sprite('sprites/tiles.png', [32, 128], [16,32], 0),
    pipeTop: new Mario.Sprite('sprites/tiles.png', [0, 128], [32,16], 0),

    LPipeSprites:[
      new Mario.Sprite('sprites/tiles.png', [32,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [32,144],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [48,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [48,144],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [64,128],[16,16],0),
      new Mario.Sprite('sprites/tiles.png', [64,144],[16,16],0),
    ]

  });

  player.pos[0] = level.playerPos[0];
  player.pos[1] = level.playerPos[1];
  vX = 0;
  level.putFloor(0,16);
  level.putWall(0,13,11);
  walls = [4,5,6,7,8,9,10];
  walls.forEach(function(loc){
    level.putWall(loc,13,3);
    level.putWall(loc,3,1);
  });

  coins = [[5,5], [6,5], [7,5], [8,5], [9,5],
           [4,7], [5,7], [6,7], [7,7], [8,7], [9,7], [10,7],
           [4,9], [5,9], [6,9], [7,9], [8,9], [9,9], [10,9]];
  coins.forEach(function(pos){
    level.putCoin(pos[0],pos[1]);
  });

  //level.putLeftPipe(13,11);
  level.putRealPipe(13,11,3,"RIGHT", function() {
    Mario.oneone.call();
    player.pos = [2616, 177]
    player.pipe("UP", function() {;});
  });

  level.putPipe(15,13,13);

  music.overworld.pause();
  music.underground.currentTime = 0;
  music.underground.play();
};

/* --- game.js --- */
var requestAnimFrame = (function(){
  return window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function(callback){
      window.setTimeout(callback, 1000 / 60);
    };
})();

//create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext('2d');
var updateables = [];
var fireballs = [];
var player = new Mario.Player([0,0]);

//we might have to get the size and calculate the scaling
//but this method should let us make it however big.
//Cool!
//TODO: Automatically scale the game to work and look good on widescreen.
//TODO: fiddling with scaled sprites looks BETTER, but not perfect. Hmm.
canvas.width = 762;
canvas.height = 720;
ctx.scale(3,3);
document.body.appendChild(canvas);

//viewport
var vX = 0,
    vY = 0,
    vWidth = 256,
    vHeight = 240;

//load our images
resources.load([
  'sprites/player.png',
  'sprites/enemy.png',
  'sprites/tiles.png',
  'sprites/playerl.png',
  'sprites/items.png',
  'sprites/enemyr.png',
]);

window.marioInit = init; window.marioResources = resources;
var level;
var sounds;
var music;

//initialize
var lastTime;
function init() {
  music = {
    overworld: new Audio('sounds/aboveground_bgm.ogg'),
    underground: new Audio('sounds/underground_bgm.ogg'),
    clear: new Audio('sounds/stage_clear.wav'),
    death: new Audio('sounds/mariodie.wav')
  };
  sounds = {
    smallJump: new Audio('sounds/jump-small.wav'),
    bigJump: new Audio('sounds/jump-super.wav'),
    breakBlock: new Audio('sounds/breakblock.wav'),
    bump: new Audio('sounds/bump.wav'),
    coin: new Audio('sounds/coin.wav'),
    fireball: new Audio('sounds/fireball.wav'),
    flagpole: new Audio('sounds/flagpole.wav'),
    kick: new Audio('sounds/kick.wav'),
    pipe: new Audio('sounds/pipe.wav'),
    itemAppear: new Audio('sounds/itemAppear.wav'),
    powerup: new Audio('sounds/powerup.wav'),
    stomp: new Audio('sounds/stomp.wav')
  };
  Mario.oneone();
  music.overworld.loop = true; music.overworld.play().catch(e => console.log(e)); lastTime = Date.now();
  main();
}

var gameTime = 0;

//set up the game loop
function main() {
  var now = Date.now();
  var dt = (now - lastTime) / 1000.0;

  update(dt);
  render();

  lastTime = now;
  requestAnimFrame(main);
}

function update(dt) {
  gameTime += dt;

  handleInput(dt);
  updateEntities(dt, gameTime);

  checkCollisions();
}

function handleInput(dt) {
  if (player.piping || player.dying || player.noInput) return; //don't accept input

  if (input.isDown('RUN')){
    player.run();
  } else {
    player.noRun();
  }
  if (input.isDown('JUMP')) {
    player.jump();
  } else {
    //we need this to handle the timing for how long you hold it
    player.noJump();
  }

  if (input.isDown('DOWN')) {
    player.crouch();
  } else {
    player.noCrouch();
  }

  if (input.isDown('LEFT')) { // 'd' or left arrow
    player.moveLeft();
  }
  else if (input.isDown('RIGHT')) { // 'k' or right arrow
    player.moveRight();
  } else {
    player.noWalk();
  }
}

//update all the moving stuff
function updateEntities(dt, gameTime) {
  player.update(dt, vX);
  updateables.forEach (function(ent) {
    ent.update(dt, gameTime);
  });

  //This should stop the jump when he switches sides on the flag.
  if (player.exiting) {
    if (player.pos[0] > vX + 96)
      vX = player.pos[0] - 96
  }else if (level.scrolling && player.pos[0] > vX + 80) {
    vX = player.pos[0] - 80;
  }

  if (player.powering.length !== 0 || player.dying) { return; }
  level.items.forEach (function(ent) {
    ent.update(dt);
  });

  level.enemies.forEach (function(ent) {
    ent.update(dt, vX);
  });

  fireballs.forEach(function(fireball) {
    fireball.update(dt);
  });
  level.pipes.forEach (function(pipe) {
    pipe.update(dt);
  });
}

//scan for collisions
function checkCollisions() {
  if (player.powering.length !== 0 || player.dying) { return; }
  player.checkCollisions();

  //Apparently for each will just skip indices where things were deleted.
  level.items.forEach(function(item) {
    item.checkCollisions();
  });
  level.enemies.forEach (function(ent) {
    ent.checkCollisions();
  });
  fireballs.forEach(function(fireball){
    fireball.checkCollisions();
  });
  level.pipes.forEach (function(pipe) {
    pipe.checkCollisions();
  });
}

//draw the game!
function render() {
  updateables = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = level.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //scenery gets drawn first to get layering right.
  for(var i = 0; i < 15; i++) {
    for (var j = Math.floor(vX / 16) - 1; j < Math.floor(vX / 16) + 20; j++){
      if (level.scenery[i][j]) {
        renderEntity(level.scenery[i][j]);
      }
    }
  }

  //then items
  level.items.forEach (function (item) {
    renderEntity(item);
  });

  level.enemies.forEach (function(enemy) {
    renderEntity(enemy);
  });



  fireballs.forEach(function(fireball) {
    renderEntity(fireball);
  })

  //then we draw every static object.
  for(var i = 0; i < 15; i++) {
    for (var j = Math.floor(vX / 16) - 1; j < Math.floor(vX / 16) + 20; j++){
      if (level.statics[i][j]) {
        renderEntity(level.statics[i][j]);
      }
      if (level.blocks[i][j]) {
        renderEntity(level.blocks[i][j]);
        updateables.push(level.blocks[i][j]);
      }
    }
  }

  //then the player
  if (player.invincibility % 2 === 0) {
    renderEntity(player);
  }

  //Mario goes INTO pipes, so naturally they go after.
  level.pipes.forEach (function(pipe) {
    renderEntity(pipe);
  });
}

function renderEntity(entity) {
  entity.render(ctx, vX, vY);
}
