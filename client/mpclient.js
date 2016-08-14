/**
 * Main game logic code
 */

var nameText = document.getElementById("name");
var colorText = document.getElementById("color");
var submitButton = document.getElementById("signIn");
var signDiv = document.getElementById("signDiv");
var gameDiv = document.getElementById("gameDiv");

var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var context = canvas.getContext("2d");

// Define global variables
var HEIGHT = window.innerHeight;
var WIDTH = window.innerWidth;
var worldWidth = null;
var worldHeight = null;
var robotCount = 0;
var GRAVITY = 0;
var pause = false;
var online = false;
var ID = null;

// Get all images
var imgBg = new Image();
imgBg.src = "client/img/agario_bg.jpg";

// Create player object
function Player(data) {
    this.id = data.id;
    this.posX = data.posX;
    this.posY = data.posY;
    this.absSpeed = data.speed;
    this.name = data.name;
    this.color = data.color;
    this.mass = data.mass;
    this.radius = getRadiusByMass(this.mass);

    this.update = function(data) {
        this.posX = data.posX;
        this.posY = data.posY;
        this.mass = data.mass;
        this.radius = getRadiusByMass(this.mass);
    }

    this.updateSpeed = function() {
        var actualX = WIDTH / 2;
        var actualY = HEIGHT / 2;

        // Adjust speed by mouse location
        var dist = distance(mouseX - actualX, mouseY - actualY);
        var ratioX = (mouseX - actualX) / dist;
        var ratioY = (mouseY - actualY) / dist;

        // Avoid shaking if object is not moving
        if (dist < player.absSpeed)
            dist = 0;

        if (dist === 0) {
            this.speedX = 0;
            this.speedY = 0;
        } else {
            this.speedX = this.absSpeed * ratioX;
            this.speedY = this.absSpeed * ratioY;
        }

        return {
            speedX : this.speedX,
            speedY : this.speedY
        };
    }
}

function Enemy(data) {
    this.posX = data.posX;
    this.posY = data.posY;
    this.speed = data.speed;
    this.mass = data.mass;
    this.name = data.name;
    this.color = data.color;

    this.update = function(data) {
        this.posX = data.posX;
        this.posY = data.posY;
        this.speed = data.speed;
        this.mass = data.mass;
        this.name = data.name;
        this.color = data.color;
    }
}

function Food(data) {
    this.id = data.id;
    this.posX = data.posX;
    this.posY = data.posY;
    this.color = getRandomColor();
    this.radius = 10;
}

function drawEntity(entity, player) {

    var actualX = entity.posX - player.posX;
    var actualY = entity.posY - player.posY;
    actualX += WIDTH / 2;
    actualY += HEIGHT / 2;

    context.beginPath();
    context.arc(actualX, actualY, entity.radius, 0, 2 * Math.PI, false);
    context.fillStyle = entity.color;
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = '#003300';
    context.stroke();

    context.font = '15px Arial';
    if (typeof entity.name != 'undefined') {
        var nameX = actualX - context.measureText(entity.name).width / 2;
        var nameY = actualY;
        context.fillStyle = 'black';
        context.fillText(entity.name, nameX, nameY);
    }
}

function distance(x, y) {
    var root = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    return root;
}

function getRadiusByMass(mass) {
    return Math.round(Math.sqrt(mass * 10 / Math.PI));
}

function drawBackground() {
    var x = WIDTH - player.posX;
    var y = HEIGHT - player.posY;
    context.drawImage(imgBg, WIDTH, HEIGHT, imgBg.width, imgBg.height, x, y,
            imgBg.width, imgBg.height);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// /////////////////////// Main logic goes here ////////////////////////

var player;
var onlinePlayerList = {};
var foodList = {};
var socket = io();

submitButton.onclick = function() {
    socket.emit('signIn', {
        name : nameText.value,
        color : colorText.value
    });
}

socket.on('init', function(data) {
    player = new Player(data.player);
    ID = player.id;
    worldWidth = data.worldWidth;
    worldHeight = data.worldHeight;
    console.log("Player initialized " + ID);
    online = true;

    document.onmousemove = function(mouse) {
        if (online) {
            mouseX = Math.round(mouse.clientX);
            mouseY = Math.round(mouse.clientY);
            socket.emit('updateSpeed', player.updateSpeed());
        }
    }

    signDiv.style.display = 'none';
    gameDiv.style.display = 'inline-block';

});

socket.on('update', function(data) {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    // console.log('Online player: ' + getMapSize(onlinePlayerList));
    drawBackground();
    for (var i = 0; i < data.length; i++) {
        var id = data[i].id;
        onlinePlayerList[id] = data[i];
        // console.log(id + '|' + ID);
        if (id === ID) {
            player.update(data[i]);
        }
    }

    // Draw food first so it's the bottom
    for ( var i in foodList) {
        drawEntity(foodList[i], player);
    }

    // printPlayer(player);
    for ( var i in onlinePlayerList) {
        drawEntity(onlinePlayerList[i], player);
    }

});

socket.on('delete', function(data) {
    console.log('Deleted player: ' + data + ' compare ' + ID)
    if (data == ID) {
        //online = false
        console.log('Sorry you are eaten ... Please try again')
        canvas.remove()
    } else {
        console.log('Are you still here ' + data)
    }
    delete onlinePlayerList[data];
});

socket.on('addFood', function(data) {
    console.log('food is here');
    var food = new Food(data);
    foodList[food.id] = food;
});

socket.on('deleteFood', function(data) {
    console.log('food is deleted');
    delete foodList[data];
});

//Track the mouse location
var mouseX = 0;
var mouseY = 0;

//document.onclick = function(mouse) {
//	player.mass = player.mass * 2;
//}

//setInterval(mUpdateUI, 20);
//setInterval(createRobot, 5000);

///////////////// DEBUGGING //////////////

function getMapSize(map) {
    var count = 0;
    for ( var key in map) {
        count++;
    }
    return count;
}

function printPlayer(player) {
    console.log(player.name + '|' + player.posX + '|' + player.posY + '|'
            + player.mass);
}