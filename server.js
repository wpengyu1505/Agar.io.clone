function PlayerData(id, x, y, speed, mass, name, color) {
	this.id = id;
	this.posX = x;
	this.posY = y;
	this.speed = speed;
	this.mass = mass;
	this.name = name;
	this.color = color;
	this.alive = true;
	
	// Zero the speed when initializing
	this.speedX = 0;
	this.speedY = 0;
	
	this.update = function() {
		//console.log(this.speedX + '|' + this.speedY);

		// Calculate radius by mass
		this.radius = Math.round(Math.sqrt(this.mass * 10 / Math.PI));
		
		this.posX = Math.round(this.posX + this.speedX);
		this.posY = Math.round(this.posY + this.speedY);
		
		// Make sure object doesn't go out of the boundary
		if (this.posX >= WORLD_WIDTH - this.radius) this.posX = WORLD_WIDTH - this.radius;
		if (this.posX <= this.radius) this.posX = this.radius;
		if (this.posY >= WORLD_HEIGHT - this.radius) this.posY = WORLD_HEIGHT - this.radius;
		if (this.posY <= this.radius) this.posY = this.radius;
	}

	this.updateSpeed = function(speedX, speedY) {
		//console.log("speed is updated");
		this.speedX = speedX;
		this.speedY = speedY;
	}
	
	this.addMass = function(delta) {
		this.mass += delta;
	}	
	
	this.die = function() {
		this.alive = false;
	}
}

function Food(id, x, y) {
	this.id = id;
	this.posX = x;
	this.posY = y;
	this.radius = 10;
}

var WORLD_WIDTH = 2000;
var WORLD_HEIGHT = 1000;
var express = require('express');
var app = express();
var server = require('http').Server(app);

// Anonomous function
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

server.listen(2000);
console.log("Server started");

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var FOOD_LIST = {};
var updatePack = [];
var deletePack = [];
var foodPack = [];
var connectionId = 0;
var foodId = 0;

var io = require('socket.io')(server, {});
io.sockets.on('connection', function(socket){
	console.log('socket connection');
	var address = socket.handshake.address;
	//var id = address + '.' + Math.abs(Math.round(Math.random() * 1000));
	var id = connectionId ++;
	socket.id = id;
	socket.on('signIn', function(data) {
		SOCKET_LIST[id] = socket;
		PLAYER_LIST[id] = new PlayerData(id, 100, 100, 5, 100, data.name, data.color);
		socket.emit('init', {
			player: PLAYER_LIST[id],
			worldWidth: WORLD_WIDTH,
			worldHeight: WORLD_HEIGHT
		});
		
		for (var i in FOOD_LIST) {
			socket.emit('addFood', FOOD_LIST[i]);
		}
		
		socket.on('disconnect', function() {
			delete SOCKET_LIST[socket.id];
			delete PLAYER_LIST[socket.id];
			deletePack.push(socket.id);
		});
		
		socket.on('updateSpeed', function(data) {
			PLAYER_LIST[socket.id].updateSpeed(data.speedX, data.speedY);
		});		
	});

});

function emitPackets() {
	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		if (PLAYER_LIST[i].alive) {
			PLAYER_LIST[i].update();
			// See if any player can eat
			eatNearbyFood(PLAYER_LIST[i]);
			prepareToEatOthers(PLAYER_LIST[i]);
			updatePack.push(PLAYER_LIST[i]);
			
		} else {
			delete SOCKET_LIST[i];
			delete PLAYER_LIST[i];
			deletePack.push(i);
		}
	}

	propogatePacket('update', updatePack);
	propogatePacket('delete', deletePack);
	
	// clear packets
	updatePack = [];
	deletePack = [];
}

function generateFood() {
	var food = new Food(foodId, Math.round(Math.random() * WORLD_WIDTH), Math.round(Math.random() * WORLD_HEIGHT));
	FOOD_LIST[foodId] = food;
	foodId ++;
	propogatePacket('addFood', food);
}

function enemyIsEatable(player, enemy) {
	return distance(player.posX - enemy.posX, player.posY - enemy.posY) < player.radius && player.mass > enemy.mass;
}

function distance(x, y) {
	var root = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	return root;
}

function eatNearbyFood(player) {
	for (var i in FOOD_LIST) {
		var food = FOOD_LIST[i];
		if (distance(player.posX - food.posX, player.posY - food.posY) <= player.radius - food.radius) {
			player.addMass(5);
			delete FOOD_LIST[i];
			propogatePacket('deleteFood', food.id);
		}
	}
}

function prepareToEatOthers(player) {
	for (var i in PLAYER_LIST) {
		var enemy = PLAYER_LIST[i];
		if (enemy.id !== player.id && enemy.alive && enemyIsEatable(player, enemy)) {
			enemy.die();
			player.addMass(enemy.mass);
			console.log('Player ' + enemy.id + ' is eaten');
		}
	}
}

function propogatePacket(message, packet) {
	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit(message, packet);
	}
}

setInterval(emitPackets, 1000/30);
setInterval(generateFood, 1000);

///////////////// DEBUGGING //////////////

function getMapSize(map) {
	var count = 0;
	for (var key in map) {
		count ++;
	}
	return count;
}

function printPlayer(player) {
	console.log(player.name + '|' + player.posX + '|' + player.posY + '|' + player.mass);
}