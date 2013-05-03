var engine = (function () {
    var gameField = new GameField(),
        //this array contains all objects on the field
        gameObjects = [],
        intervalId = 0,
        snake = null,
        //Enumerations to be used in the game. 
        //The snake is controled by changeDirection method and a direction as a parameter.  
        Directions = Object.freeze({
            UP: "up",
            DOWN: "down",
            LEFT: "left",
            RIGHT: "right"
        }),
        //This enumeration holds single object size. The snake is made of several objects.
        ObjectSize = Object.freeze({
            WIDTH: 20,
            HEIGHT: 20
        });
        
    // JS OOP Helper start
    Function.prototype.inherit = function (parent) {
        this.prototype = new parent();
        this.prototype.constructor = parent;
    }
    // JS OOP Helper end

    // This functions return random position on the field, normalized to the grid. Grid size is equal to object size.
    function getRandomePositionX(start, end) {
        return Math.floor((Math.random() * (end - start + 1) + start) / ObjectSize.WIDTH) * ObjectSize.WIDTH;
    }

    function getRandomePositionY(start, end) {
        return Math.floor((Math.random() * (end - start + 1) + start) / ObjectSize.HEIGHT) * ObjectSize.HEIGHT;
    }

    //Game Field definition
    // This class represents canvas element on which the game objects are drawn
    function GameField() {
        // This enumeration gives us the dimensions of the game field
        this.size = Object.freeze({
            WIDTH: 960,
            HEIGHT: 500
        });
        this.canvas = document.querySelector("#gameField");
        this.canvas.width = this.size.WIDTH;
        this.canvas.height = this.size.HEIGHT;
        this.ctx = this.canvas.getContext("2d");
    }

    //This method is called on each update. It wipes the canvas and calls all game objects' draw methods.
    GameField.prototype.draw = function () {
        var i = 0;

        this.ctx.clearRect(0, 0, this.size.WIDTH, this.size.HEIGHT);
        for (i = 0; i < gameObjects.length; i++) {
            gameObjects[i].draw();
        }
    }

    // GameObject definition
    // This is the base class of the game. All objects in the game are Game Objects. 
    // It provides the constructor for game objects, as well as some useful methods to manipulate them
    function GameObject(positionX, positionY, canBeEaten) {
        this.size = ObjectSize;
        this.position = {
            X: positionX,
            Y: positionY
        }
        this.isDestroyed = false;
        this.canBeEaten = canBeEaten;
    }

    // This is the default method, which is called by collisionDetect to update the state of an object on collision
    GameObject.prototype.onColision = function () {
        if (this.canBeEaten) {
            this.isDestroyed = true;
        }
    }

    // This method must be implemented in each descendant of GameObject
    GameObject.prototype.update = function () {
        throw new Error("Not Implemented");
    }

    // This is the default draw method for each descendant, however each class is free to define own draw method
    GameObject.prototype.draw = function () {
        gameField.ctx.fillStyle = this.color;
        gameField.ctx.moveTo(this.position.X, this.position.Y);
        gameField.ctx.fillRect(this.position.X, this.position.Y, ObjectSize.WIDTH, ObjectSize.HEIGHT);
    }

    //Food definition
    //This class represents Food objects in the game. It inherites GameObject
    function Food(x, y) {
        GameObject.call(this, x, y, true);
        this.color = "red";
    }

    Food.inherit(GameObject);

    //Specific update method for all instances of Food class. If destroyed, food dissapears and appears on different spot
    Food.prototype.update = function () {
        if (this.isDestroyed) {
            this.position.X = getRandomePositionX(0, gameField.size.WIDTH - this.size.WIDTH);
            this.position.Y = getRandomePositionY(0, gameField.size.HEIGHT - this.size.HEIGHT);
            this.isDestroyed = false;
        }
    }

    //Specific draw method, used to draw food with different shape than other objects.
    //We have to adjust the coordinates to fit the grid, because rectangle objects are specified by left top corner 
    //and circle object is specified by it's centre
    Food.prototype.draw = function () {
        var radius = ObjectSize.WIDTH / 2;
        gameField.ctx.beginPath();
        gameField.ctx.fillStyle = this.color;
        gameField.ctx.moveTo(this.position.X + radius, this.position.Y+ radius);
        gameField.ctx.arc(this.position.X + radius, this.position.Y + radius, radius, 0, 2 * Math.PI)
        //gameField.ctx.fillRect(this.position.X, this.position.Y, ObjectSize.WIDTH, ObjectSize.HEIGHT);
        gameField.ctx.fill();
    }

    //Stones definition
    //This class represents stones which the snake must avoid
    function Stone(x, y) {
        GameObject.call(this, x, y, false);
        this.color = "grey";
    }

    Stone.inherit(GameObject);

    //Stones don't need update, but each object must have update method
    Stone.prototype.update = function () {
        
    }

    //Snake definition
    //This class represents snake's body parts.
    function SnakeBody(x, y) {
        GameObject.call(this, x, y, false);
        this.color = "lightgreen";
    }

    SnakeBody.inherit(GameObject);

    //This class represents the snake itself
    function Snake(x, y, length, direction) {
        GameObject.call(this, x, y, false);
        // Here wi can specify number of lives the snake has
        this.lives = 5;
        // Snake has the ability to graw, so this field is not constant
        this.length = length;
        this.color = "green";
        //Here we are logging positions which were visited by snake's head in order to know the way of the rest bodyparts
        this.positionStack = [];
        //This array holds snake's body parts - everithig but the head
        this.bodyArray = [];
        //This field must be updated only using enumeration Directions. It keeps the direction in which the snake is mooving.
        this.direction = direction;
        //This field holds number of eaten food in order to know when to grow. It is reset each time the snake grows.
        this.foodEaten = 0;
        //This field is holding the total number of eaten food aka the score.
        this.totalFood = 0;
    }

    Snake.inherit(GameObject);

    //This method is called on update instead of GameObject default method
    Snake.prototype.update = function () {
        var i = 0,
            position = {
                X: 0,
                Y: 0
            };
        //Creates new position from the current snake's head position to store in the position stack
        position.X = this.position.X;
        position.Y = this.position.Y;
        //adds position to the stack
        this.positionStack.unshift(position);
        //removes unneeded position from the stack's end
        this.positionStack.pop();

        //calculates new position depending on the current direction
        switch (this.direction) {
            case "up":
                this.position.Y = this.position.Y - this.size.HEIGHT;
                break;
            case "down":
                this.position.Y += this.size.HEIGHT;
                break;
            case "left":
                this.position.X = this.position.X - this.size.WIDTH;
                break;
            case "right":
                this.position.X += this.size.WIDTH;
                break;
            default:
                throw new Error("Use Directions enumeration!");
        }

        //updates all body parts' positions
        for (i = 0; i < this.length; i++) {
            this.bodyArray[i].position = this.positionStack[i];
        }

        //checks if the snake has eaten enough food and if so makes it grow
        if (this.foodEaten >= 3) {
            this.foodEaten = 0;
            this.grow();
        }
    }

    //This method can be used with any user interface to change the snake's direction 
    //(may be it could be made public so the snake could be controlled from outside the engine)
    Snake.prototype.changeDirection = function (direction) {
        this.direction = direction;
    }

    //This method describes how the snake manages colissions 
    Snake.prototype.onColision = function (colisionObject) {
        // if the collision object is food it increases its foodEaten and totalFood fields
        if (colisionObject.canBeEaten) {
            this.foodEaten++;
            this.totalFood++;
        // if the collision object is not food, it checks number of lives and if it is equal to 0 - dies, if not - decreases number of lives
        } else if (this.lives === 0) {
            endGame();
        } else {
            this.lives--;
            this.reset();
        }
    }

    // This method makes the snake grow
    // It is creating new body element on the top of the last element (it is done to avoid difficult calculations)
    // on the next update they will have different positions and the snake will be longer
    Snake.prototype.grow = function () {
        var position = {
                X: 0,
                Y: 0
            },
            snakeBody = null;

        position.X = this.bodyArray[this.length - 1].position.X;
        position.Y = this.bodyArray[this.length - 1].position.Y;
        snakeBody = new SnakeBody(position.X, position.Y);
        this.bodyArray.push(snakeBody);
        this.positionStack.push(position);
        this.length++;
    }

    //This method is called when the snake dies, but have more lives. 
    //It wipes the snake and positions it in the left part of the field and sets direction to right
    Snake.prototype.reset = function () {
        var i = 0;

        this.direction = Directions.RIGHT;
        this.position.X = (this.length + 2) * ObjectSize.WIDTH;
        this.position.Y = getRandomePositionY(0, gameField.size.HEIGHT - ObjectSize.HEIGHT);

        for (i = 0; i < this.length; i++) {
            this.bodyArray[i].position.X = this.position.X - ((i + 1) * ObjectSize.WIDTH);
            this.bodyArray[i].position.Y = this.position.Y;
            this.positionStack[i].X = this.bodyArray[i].position.X;
            this.positionStack[i].Y = this.bodyArray[i].position.Y;
        }
    }

    //This method draws the snake, including all it's body parts and some statistics
    Snake.prototype.draw = function () {
        var i = 0;
        //draws the head
        gameField.ctx.fillStyle = this.color;
        gameField.ctx.moveTo(this.position.X, this.position.Y);
        gameField.ctx.fillRect(this.position.X, this.position.Y, ObjectSize.WIDTH, ObjectSize.HEIGHT);
        //draws all body parts
        for (i = 0; i < this.length; i++) {
            gameField.ctx.fillStyle = this.bodyArray[i].color;
            gameField.ctx.moveTo(this.bodyArray[i].position.X, this.bodyArray[i].position.Y);
            gameField.ctx.fillRect(this.bodyArray[i].position.X, this.bodyArray[i].position.Y, ObjectSize.WIDTH, ObjectSize.HEIGHT);
        }
        //outputs number of lives and score
        document.querySelector("#lives").innerHTML = this.lives;
        document.querySelector("#points").innerHTML = this.totalFood;
    }

    //This method returs true if the snake collides with itself
    Snake.prototype.hasBittenHerSelf = function () {
        var result = false,
            i = 0;
        for (i = 0; i < this.length; i++) {
            if (this.position.X === this.bodyArray[i].position.X && this.position.Y === this.bodyArray[i].position.Y) {
                result = true;
            }
        }
        return result;
    }

    //This method returns true if the snake leaves the gamefield
    Snake.prototype.isOutOfGameField = function () {
        var result = false;
        if (this.position.X < 0 || this.position.X > gameField.size.WIDTH || this.position.Y < 0 || this.position.Y> gameField.size.HEIGHT) {
            result = true;
        }
        return result;
    }

    //This is the only public method and it is used to initialise game objects and to start the game.
    function StartGame() {
        var snakeLength = parseInt(document.getElementById("snakeLength").value),
            numberOfStones = parseInt(document.getElementById("stonesNumber").value),
            numberOfFood = parseInt(document.getElementById("foodNumber").value),
            stone = null,
            food = null,
            snakeBody = null,
            i = 0;

        //This code prevents duplicating of objects on multiple calls of SartGame. 
        //Every call generates new game objecs and starts the game from the begining
        gameObjects = [];
        clearInterval(intervalId);

        //validates user input
        if (snakeLength > ((gameField.size.WIDTH - 100) / ObjectSize.WIDTH) || snakeLength <= 1) {
            snakeLength = 3;
        }
        if (numberOfStones < 0) {
            numberOfStones = 10;
        }
        if (numberOfFood <= 0) {
            numberOfFood = 5;
        }

        // create new snake
        snake = new Snake((snakeLength + 1) * ObjectSize.WIDTH, getRandomePositionY(0, gameField.size.HEIGHT - ObjectSize.HEIGHT), snakeLength - 1, Directions.RIGHT);

        for (i = 1; i < snakeLength; i++) {
            snakeBody = new SnakeBody(snake.position.X - (i * ObjectSize.WIDTH), snake.position.Y);
            snake.bodyArray.push(snakeBody);
            snake.positionStack.push(snakeBody.position);
        }
        gameObjects.push(snake);

        //create stones
        for (i = 0; i < numberOfStones; i++) {
            stone = new Stone(getRandomePositionX(0, gameField.size.WIDTH - ObjectSize.WIDTH), getRandomePositionY(0, gameField.size.HEIGHT - ObjectSize.HEIGHT));
            gameObjects.push(stone);
        }

        //create food
        for (i = 0; i < numberOfFood; i++) {
            food = new Food(getRandomePositionX(0, gameField.size.WIDTH - ObjectSize.WIDTH), getRandomePositionY(0, gameField.size.HEIGHT - ObjectSize.HEIGHT));
            gameObjects.push(food);
        }

        // attach event to the body element, listen to "keydown" event and call the getKey event handler
        document.getElementsByTagName("body")[0].addEventListener("keydown", getKey, false);
        //draws the gamefield
        gameField.draw();
        //calls update method each 100 miliseconds (this parameter controls the game speed)
        //with this code it is possible to implement increasing game speed
        intervalId = setInterval(update, 100);
    }

    //TODO: create hiscore table in the local storage and keep 5 top players
    function endGame() {
        clearInterval(intervalId);
        //after game events
    }

    // This method is called each 100 miliseconds to update the states of all game objects
    function update() {
        var i = 0;

        // calls collisionDetect to handle collisions, than calls update methods of all game objects to update their states
        collisionDetect();
        // calls update methods of all game objects
        for (i = 0; i < gameObjects.length; i++) {
            gameObjects[i].update();
        }
        // redraws gamefield
        gameField.draw();
    }

    // This method handles collisions
    function collisionDetect() {
        var i = 0;

        //checks if snake has left the game field and if so, calls snakes onColision method to handle it
        if (snake.isOutOfGameField()) {
            snake.onColision(snake);
        }

        //checks if snake has bitten itself and if so, calls it's onColision method to handle it
        if (snake.hasBittenHerSelf()) {
            snake.onColision(snake);
        }
        
        //checks for collisions with other objects and if so calls their onColision methods to handle them
        for (i = 1; i < gameObjects.length; i++) {
            if (collide(snake, gameObjects[i])) {
                snake.onColision(gameObjects[i]);
                gameObjects[i].onColision();
            }
        }
    }

    //This method is making actual calculation to find out if there is a collision.
    function collide(snakeObj, obj) {
        result = false;

        // If top left corner and bottom right corner of two objects are equal, there is a collision
        if (snakeObj.position.X === obj.position.X && snakeObj.position.Y === obj.position.Y &&
            snakeObj.position.X + ObjectSize.WIDTH === obj.position.X + ObjectSize.WIDTH &&
            snakeObj.position.Y + ObjectSize.HEIGHT === obj.position.Y + ObjectSize.HEIGHT) {
            result = true;
        }
        return result;
    }

    //This method handles onKeyDown event
    function getKey(evt) {
        switch (evt.keyCode) {
            //Left arrow key, calls changeDirrection method of the snake
            case 37:
                evt.preventDefault();
                if (snake.changeDirection) {
                    snake.changeDirection(Directions.LEFT);
                }
                break;
            //Up arrow key, calls changeDirrection method of the snake
            case 38:
                evt.preventDefault();
                if (snake.changeDirection) {
                    snake.changeDirection(Directions.UP);
                }
                break;
            //Right arrow key, calls changeDirrection method of the snake
            case 39:
                evt.preventDefault();
                if (snake.changeDirection) {
                    snake.changeDirection(Directions.RIGHT);
                }
                break;
            //Down arrow key, calls changeDirrection method of the snake
            case 40:
                evt.preventDefault();
                if (snake.changeDirection) {
                    snake.changeDirection(Directions.DOWN);
                }
                break;
            //Letter "q" pressed, brings up confirm dialod, ends the game if OK pressed
            case 81:
                if (confirm("Do yo realy want to quit?")) {
                    endGame();
                }
                break;
            //Letter "p" pressed, brings up alert dialod, showing that game is on pause. Resumes the game if OK pressed
            case 80:
                alert("Paused. Press OK to continue.");
                break;
            default:
        }
    }

    //Exposes public methods
    return {
        StartGame: StartGame
    }

}());