/**
 * Main game logic code
 */

var ctx = document.getElementById("ctx").getContext("2d");

// Define global variables
var HEIGHT = 600;
var WIDTH = 1200;
var robotCount = 0;
var GRAVITY = 0;
var pause = false;

// Get all images
var imgBg = new Image();
imgBg.src = "img/agario_bg.jpg";

// Create player object
function Player(posX, posY, speedX, speedY, absSpeed, name, color, mass, radius) {
    this.posX = posX;
    this.posY = posY;
    this.speedX = speedX;
    this.speedY = speedY;
    this.absSpeed = absSpeed;
    this.name = name;
    this.color = color;
    this.mass = mass;
    this.radius = radius;

    this.update = function() {
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
        // console.log('mouseX=' + mouseX + '|posX=' + this.posX + '|dist=' +
        // dist);

        // Calculate radius by mass
        this.radius = Math.round(Math.sqrt(this.mass * 10 / Math.PI));

        this.posX = Math.round(this.posX + this.speedX);
        this.posY = Math.round(this.posY + this.speedY);

        // Make sure object doesn't go out of the boundary
        if (this.posX >= imgBg.width - this.radius)
            this.posX = imgBg.width - this.radius;
        if (this.posX <= this.radius)
            this.posX = this.radius;
        if (this.posY >= imgBg.height - this.radius)
            this.posY = imgBg.height - this.radius;
        if (this.posY <= this.radius)
            this.posY = this.radius;
        if ((this.posX >= imgBg.width - this.radius)
                || (this.posX <= this.radius)
                || (this.posY >= imgBg.height - this.radius)
                || (this.posY <= this.radius)) {
            console.log("Boundary reached");
        }
    }

}

// Constructor for computer robot object
function Robot(id, posX, posY, speedX, speedY, absSpeed, color, mass, name) {
    this.id = id;
    this.posX = Math.round(posX);
    this.posY = Math.round(posY);
    this.speedX = Math.round(speedX);
    this.speedY = Math.round(speedY);
    this.absSpeed = absSpeed;
    this.color = color;
    this.mass = mass;
    this.name = name + id;

    this.update = function() {

        // Calculate radius by mass
        this.radius = Math.round(Math.sqrt(this.mass * 10 / Math.PI));

        this.posX = Math.round(this.posX + this.speedX);
        this.posY = Math.round(this.posY + this.speedY);

        // Make sure object doesn't go out of the boundary
        if (this.posX >= imgBg.width - this.radius) {
            this.posX = imgBg.width - this.radius;
            this.speedX = -this.speedX;
        }
        if (this.posX <= this.radius) {
            this.posX = this.radius;
            this.speedX = -this.speedX;
        }
        if (this.posY >= imgBg.height - this.radius) {
            this.posY = imgBg.height - this.radius;
            this.speedY = -this.speedY;
        }
        if (this.posY <= this.radius) {
            this.posY = this.radius;
            this.speedY = -this.speedY;
        }
    }
}

function drawEntity(entity, player) {

    var actualX = entity.posX - player.posX;
    var actualY = entity.posY - player.posY;
    actualX += WIDTH / 2;
    actualY += HEIGHT / 2;

    ctx.beginPath();
    ctx.arc(actualX, actualY, entity.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = entity.color;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();

    ctx.font = '15px Arial';
    var nameX = actualX - ctx.measureText(entity.name).width / 2;
    var nameY = actualY;
    ctx.fillStyle = 'black';
    ctx.fillText(entity.name, nameX, nameY);
}

function distance(x, y) {
    var root = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    return root;
}

function robotIsEatable(player, robot) {
    return distance(player.posX - robot.posX, player.posY - robot.posY) < player.radius
            && player.mass > robot.mass
}

function drawBackground() {
    var x = WIDTH - player.posX;
    var y = HEIGHT - player.posY;
    ctx.drawImage(imgBg, WIDTH, HEIGHT, imgBg.width, imgBg.height, x, y,
            imgBg.width, imgBg.height);
}

/*
 * Main logic
 */
var robotList = {};
var player = new Player(Math.round(Math.random() * WIDTH), Math.round(Math
        .random()
        * HEIGHT), 0, 0, 4, "Hadoop", 'green', 50, 10);
// Create robot objects

function createRobot() {
    robotList[robotCount] = new Robot(robotCount, Math.random() * WIDTH, Math
            .random()
            * HEIGHT, Math.random() * 10, Math.random() * 10, 6, 'grey', 300,
            "Spark");
    robotCount += 1;
    console.log("Robot count: " + robotCount);
}

// Robot("Spark", Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() *
// 10, Math.random() * 10, 6, 'yellow', 500, 10);
// Robot("HBase", Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() *
// 10, Math.random() * 10, 6, 'red', 750, 10);

// Track the mouse location
var mouseX = 0;
var mouseY = 0;
document.onmousemove = function(mouse) {
    mouseX = Math.round(mouse.clientX);
    mouseY = Math.round(mouse.clientY);
}

document.onclick = function(mouse) {
    player.mass = player.mass * 2;
}

function updateUI() {

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    for ( var key in robotList) {
        var bot = robotList[key];
        if (robotIsEatable(player, bot)) {
            player.mass += bot.mass;
            delete robotList[key];
            // console.log("One bot is eaten");
        }
        bot.update();
        drawEntity(bot, player);
    }
    player.update();
    drawEntity(player, player);
}

setInterval(updateUI, 20);
setInterval(createRobot, 5000);