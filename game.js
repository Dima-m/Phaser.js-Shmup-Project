(function() {
    var CONFIG = {
	GAME_WIDTH: 320,
	GAME_HEIGHT: 480,
	PIXEL_RATIO: 2
};

    var _game = new Phaser.Game(CONFIG.GAME_WIDTH * CONFIG.PIXEL_RATIO, CONFIG.GAME_HEIGHT * CONFIG.PIXEL_RATIO, Phaser.CANVAS, 'game');

    var mainState = {
        preload: function() {
            this.game.load.image('starfield', 'assets/starfield.png');
            this.game.load.image('ship', 'assets/player.png');
            this.game.load.image('bullet', 'assets/bullet.png');
            this.game.load.image('enemyGreen', 'assets/enemy-green.png');
            this.game.load.image('blueEnemyBullet', 'assets/enemy-blue-bullet.png');
            this.game.load.spritesheet('explosion', 'assets/explode.png', 128, 128);
            this.load.bitmapFont('minecraftia', 'assets/minecraftia.png', 'assets/minecraftia.xml');
            this.load.audio('explosion', 'assets/explosion.wav');
            this.load.audio('laser', 'assets/laser.mp3');
        },

        create: function() {
        	this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.minWidth = 320;
			this.scale.minHeight = 480;
			this.scale.maxWidth = 1080;
			this.scale.maxHeight = 1920;
			this.game.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.game.scale.forcePortrait = true;
			this.game.scale.pageAlignHorizontally = true;
			this.game.scale.pageAlignVertically = true;
			this.game.scale.width = CONFIG.GAME_WIDTH * CONFIG.PIXEL_RATIO;
			this.game.scale.height = CONFIG.GAME_HEIGHT * CONFIG.PIXEL_RATIO;
			this.game.scale.refresh();

            this.lastBullet = 0;
            this.lastEnemy = 0;
            this.lastTick = 0;
            this.speed = 100;
            this.enemySpeed = 200;
            this.bulletSpeed = 400;
            this.bulletSpacing = 150;
            this.lives = 3;
            this.score = 0;
            this.bullets;
            this.weaponLevel = 1;
            this.bulletTimer = 0;
            this.drag = 1000;
            this.maxspeed = 400;

            this.game.physics.startSystem(Phaser.Physics.ARCADE);

            this.bg = this.game.add.tileSprite(0, 0, CONFIG.GAME_WIDTH * CONFIG.PIXEL_RATIO, CONFIG.GAME_HEIGHT * CONFIG.PIXEL_RATIO, 'starfield');

            this.explosionSound = this.game.add.audio('explosion');
            this.explosionSound.volume = 0.1;

            this.ship = this.game.add.sprite(300, 800, 'ship');
            this.ship.animations.add('move');
            this.ship.animations.play('move', 120, true);
            this.game.physics.arcade.enable(this.ship, Phaser.Physics.ARCADE);

            this.bullets = this.game.add.group();
            this.bullets.enableBody = true;
            this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
            this.bullets.createMultiple(40, 'bullet');
            this.bullets.setAll('anchor.x', 0.5);
            this.bullets.setAll('anchor.y', 1);
            this.bullets.setAll('outOfBoundsKill', true);
            this.bullets.setAll('checkWorldBounds', true);

            this.cursors = this.game.input.keyboard.createCursorKeys();
            this.fireButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

            this.mainEnemy = this.game.add.group();
            this.mainEnemy.enableBody = true;
            this.mainEnemy.physicsBodyType = Phaser.Physics.ARCADE;
            this.mainEnemy.createMultiple(25, 'enemyGreen');
            this.mainEnemy.setAll('anchor.x', 0.5);
            this.mainEnemy.setAll('anchor.y', 0.5);
            this.mainEnemy.setAll('scale.x', 0.5);
            this.mainEnemy.setAll('scale.y', 0.5);
            this.mainEnemy.setAll('angle', 150);

            this.explosions = this.game.add.group();
            this.explosions.enableBody = true;
            this.explosions.physicsBodyType = Phaser.Physics.ARCADE;
            this.explosions.createMultiple(50, 'explosion');
            this.explosions.setAll('anchor.x', 0.5);
            this.explosions.setAll('anchor.y', 0.5);
            this.explosions.forEach(function(explosion) {
                explosion.animations.add('explosion');
            });

            this.livesText = this.game.add.bitmapText(470, 15, 'minecraftia', 'Lives: ' + this.lives, 25);
            this.scoreText = this.game.add.bitmapText(20, 15, 'minecraftia', 'Score: ' + this.score, 25);
        },

        update: function() {
            this.bg.tilePosition.y += 2.9;
            this.ship.body.velocity.setTo(0, 0);
            this.ship.body.maxVelocity.setTo(this.maxspeed, this.maxspeed);
            this.ship.body.drag.setTo(this.drag, this.drag);

            if (this.ship.body.velocity.y === 0) {
                if (this.ship.body.velocity.x < 0) {
                    this.ship.play('left');
                } else if (this.ship.body.velocity.x > 0) {
                    this.ship.play('right');
                }

                this.ship.body.velocity.x = 0;

            }

            if (this.ship.body.velocity.x === 0) {
                if (this.ship.body.velocity.y < 0) {
                    this.ship.play('up');
                } else if (this.ship.body.velocity.y > 0) {
                    this.ship.play('down');
                }

                this.ship.body.velocity.y = 0;

            }

            if (this.ship.body.velocity.x !== 0 && this.ship.body.velocity.y !== 0) {

                if (this.ship.body.velocity.x < 0 && this.ship.body.velocity.y < 0) {
                    this.ship.play("upLeft");
                } else if (this.ship.body.velocity.x > 0 && this.ship.body.velocity.y > 0) {
                    this.ship.play("downRight");
                } else if (this.ship.body.velocity.x > 0 && this.ship.body.velocity.y < 0) {
                    this.ship.play("upRight");
                } else if (this.ship.body.velocity.x < 0 && this.ship.body.velocity.y > 0) {
                    this.ship.play("downLeft");
                }
                this.ship.body.velocity.set(0, 0);
            }

            if (this.cursors.left.isDown) {
                this.moved = true;
                this.ship.body.velocity.x = -170;
            }
            if (this.cursors.right.isDown) {
                this.moved = true;
                this.ship.body.velocity.x = 170;
            }
            if (this.cursors.up.isDown) {
                this.moved = true;
                this.ship.body.velocity.y = -170;
            }
            if (this.cursors.down.isDown) {
                this.moved = true;
                this.ship.body.velocity.y = 170;
            }

            if (!this.moved)
                this.ship.animations.stop();

            if (this.ship.x > this.game.width - 50) {
                this.ship.x = this.game.width - 50;
                this.ship.body.acceleration.x = 0;
            } else if (this.ship.x < 50) {
                this.ship.x = 50;
                this.ship.body.acceleration.x = 0;
            }

      //       if (this.game.physics.arcade.distanceToPointer(this.ship, this.game.input.activePointer) >20) {
		    //    this.game.physics.arcade.moveToPointer(this.ship, 300);
      //        }
		    // else {
		    //     this.ship.body.velocity.set(0);
		    // }


            if (this.ship.alive && (this.fireButton.isDown || this.game.input.activePointer.isDown)) {
                this.fireBullet();
                this.laserShoot = this.game.add.audio('laser');
                this.laserShoot.play('',0,0.1,false);
            }


            this.squish = this.ship.body.velocity.x / this.maxspeed;
            this.ship.scale.x = 1 - Math.abs(this.squish) / 5;
            this.ship.angle = this.squish * 30;

            var curTime = this.game.time.now;

            if (this.fireButton.isDown || this.game.input.activePointer.isDown) {
                this.fireBullet();
                this.lastBullet = curTime;
            }

            if (curTime - this.lastEnemy > 100) {
                this.generateMainEnemy();
                this.lastEnemy = curTime;
            }

            if (curTime - this.lastTick > 10000) {
                if (this.speed < 500) {
                    this.speed *= 1.1;
                    this.enemySpeed *= 1.1;
                    this.bulletSpeed *= 1;
                    this.bg.autoScroll(0, 20);
                    this.lastTick = curTime;
                }
            }

            this.game.physics.arcade.overlap(this.mainEnemy, this.ship, this.enemyHitPlayer, null, this);
            this.game.physics.arcade.overlap(this.mainEnemy, this.bullets, this.enemyHitBullet, null, this);
        },


        fireBullet: function(curTime) {
            var bullet = this.bullets.getFirstExists(false);
            if (bullet) {
                bullet.reset(this.ship.x + this.ship.width, this.ship.y + this.ship.height / 2);
                bullet.body.velocity.x = this.bulletSpeed;
                var bulletOffset = 20 * Math.sin(this.game.math.degToRad(this.ship.angle));
                bullet.reset(this.ship.x + bulletOffset, this.ship.y);
                bullet.angle = this.ship.angle;
                this.game.physics.arcade.velocityFromAngle(bullet.angle - 90, this.bulletSpeed, bullet.body.velocity);
                bullet.body.velocity.x += this.ship.body.velocity.x;

                this.bulletTimer = this.game.time.now + this.bulletSpacing;

            }
        },

        generateMainEnemy: function() {
            var ENEMY_SPEED = 300;

            var mainEnemy = this.mainEnemy.getFirstExists(false);
            if (mainEnemy) {
                mainEnemy.reset(this.game.rnd.integerInRange(0, this.game.width), -10);
                mainEnemy.body.velocity.x = this.game.rnd.integerInRange(-300, 300);
                mainEnemy.body.velocity.y = ENEMY_SPEED;
                mainEnemy.body.drag.x = 100;

                this.game.time.events.add(2000, this.generateMainEnemy, this);

                mainEnemy.update = function() {
                    mainEnemy.angle = 180 - this.game.math.radToDeg(Math.atan2(mainEnemy.body.velocity.x, mainEnemy.body.velocity.y));

                    if (mainEnemy.y > this.game.height + 200) {
                        mainEnemy.kill();
                        mainEnemy.y = -20;
                    }
                };
            }
            this.mainEnemyLaunchTimer = this.game.time.events.add(this.game.rnd.integerInRange(this.mainEnemySpacing, this.mainEnemySpacing + 600), this.generateMainEnemy);
        },

        enemyHitPlayer: function(ship, mainEnemy) {
            if (this.mainEnemy.getIndex(mainEnemy) > -1)
                this.mainEnemy.remove(mainEnemy);
            this.explosionSound.play();
            mainEnemy.kill();
            var explosion = this.explosions.getFirstExists(false);
            explosion.reset(mainEnemy.body.x + mainEnemy.body.halfWidth, mainEnemy.body.y + mainEnemy.body.halfHeight);
            explosion.body.velocity.y = mainEnemy.body.velocity.y;
            explosion.alpha = 0.7;
            explosion.play('explosion', 0, 0, true);

            this.lives -= 1;
            this.livesText.setText("Lives: " + this.lives);
            if (this.lives < 0)
                this.game.state.start('gameover');
        },

        enemyHitBullet: function(bullet, mainEnemy) {
            if (this.mainEnemy.getIndex(mainEnemy) > -1)
                this.mainEnemy.remove(mainEnemy);
            this.explosionSound.play();
            var explosion = this.explosions.getFirstExists(false);
            explosion.reset(bullet.body.x + bullet.body.halfWidth, bullet.body.y + bullet.body.halfHeight);
            explosion.body.velocity.y = mainEnemy.body.velocity.y;
            explosion.alpha = 0.7;
            explosion.play('explosion', 30, false, true);

            bullet.kill();
            mainEnemy.kill();
            this.score += 10;
            this.scoreText.setText("Score: " + this.score);

        }
    };

    var menuState = {
        preload: function() {
            this.game.load.image('starfield', 'assets/starfield.png');
            this.load.bitmapFont('minecraftia', 'assets/minecraftia.png', 'assets/minecraftia.xml');
            this.load.audio('menuMusic', 'assets/menuMusic.mp3');
        },

        create: function() {

        	this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.minWidth = 320;
			this.scale.minHeight = 480;
			this.scale.maxWidth = 1080;
			this.scale.maxHeight = 1920;
			this.game.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.game.scale.forcePortrait = true;
			this.game.scale.pageAlignHorizontally = true;
			this.game.scale.pageAlignVertically = true;
			this.game.scale.width = CONFIG.GAME_WIDTH * CONFIG.PIXEL_RATIO;
			this.game.scale.height = CONFIG.GAME_HEIGHT * CONFIG.PIXEL_RATIO;
			this.game.scale.refresh();

            this.menuMusic = this.game.add.audio('menuMusic');
            this.menuMusic.play('',0,0.3,true);

            this.background = this.game.add.tileSprite(0, 0, CONFIG.GAME_WIDTH * CONFIG.PIXEL_RATIO, CONFIG.GAME_HEIGHT * CONFIG.PIXEL_RATIO, 'starfield');

            this.background.autoScroll(0, 100);

            this.gameTitle = this.game.add.bitmapText(0, 15, 'minecraftia', '0', 35);
            this.gameTitle.setText('SIMPLE PHASER SHMUP');
            this.gameTitle.x = (this.game.width - this.gameTitle.textWidth * CONFIG.PIXEL_RATIO) / 8;
            this.gameTitle.y = (this.game.height- this.gameTitle.textHeight * CONFIG.PIXEL_RATIO) / 3;

            this.gameStart = this.game.add.bitmapText(0, 15, 'minecraftia', '0', 30);
            this.gameStart.setText('Tap to Start');
            this.gameStart.x = (this.game.width - this.gameStart.textWidth * CONFIG.PIXEL_RATIO) / 3.1;
            this.gameStart.y = (this.game.height- this.gameStart.textHeight * CONFIG.PIXEL_RATIO) / 1.5;

            this.madeBy = this.game.add.bitmapText(360, 900, 'minecraftia', 'Dima Mamchur Project', 15);

            this.game.input.onDown.addOnce(this.startGame, this);
            },

        startGame: function() {
            this.game.state.start('main');
            this.menuMusic.play('',0,0,true);
        }
    };

    var gameOverState = {
        preload: function() {
            this.game.load.image('starfield', 'assets/starfield.png');
            this.load.bitmapFont('minecraftia', 'assets/minecraftia.png', 'assets/minecraftia.xml');
        },

        create: function() {

        	this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.minWidth = 320;
			this.scale.minHeight = 480;
			this.scale.maxWidth = 1080;
			this.scale.maxHeight = 1920;
			this.game.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.game.scale.forcePortrait = true;
			this.game.scale.pageAlignHorizontally = true;
			this.game.scale.pageAlignVertically = true;
			this.game.scale.width = CONFIG.GAME_WIDTH * CONFIG.PIXEL_RATIO;
			this.game.scale.height = CONFIG.GAME_HEIGHT * CONFIG.PIXEL_RATIO;
			this.game.scale.refresh();

            this.background = this.game.add.tileSprite(0, 0, CONFIG.GAME_WIDTH * CONFIG.PIXEL_RATIO, CONFIG.GAME_HEIGHT * CONFIG.PIXEL_RATIO, 'starfield');

            this.background.autoScroll(0, 100);

            this.youLose = this.game.add.bitmapText(0, 15, 'minecraftia', '0', 60);
            this.youLose.setText('YOU\n');
            this.youLose.x = (this.game.width - this.youLose.textWidth * CONFIG.PIXEL_RATIO) / 2.1;
            this.youLose.y = (this.game.height- this.youLose.textHeight * CONFIG.PIXEL_RATIO) / 3;

            this.youLose = this.game.add.bitmapText(0, 15, 'minecraftia', '0', 60);
            this.youLose.setText('LOSE!');
 			this.youLose.x = (this.game.width - this.youLose.textWidth * CONFIG.PIXEL_RATIO) / 2.4;
            this.youLose.y = (this.game.height- this.youLose.textHeight * CONFIG.PIXEL_RATIO) / 2;

            this.gameRestart = this.game.add.bitmapText(0, 15, 'minecraftia', '0', 30);
            this.gameRestart.setText('Tap to Restart');
            this.gameRestart.x = (this.game.width - this.gameRestart.textWidth * CONFIG.PIXEL_RATIO) / 3.3;
            this.gameRestart.y = (this.game.height- this.gameRestart.textHeight * CONFIG.PIXEL_RATIO) / 1.5;

            this.game.input.onDown.addOnce(this.startGame, this);
        },

        startGame: function() {
            this.game.state.start('main');
        }
    };

    _game.state.add('main', mainState);
    _game.state.add('menu', menuState);
    _game.state.add('gameover', gameOverState);
    _game.state.start('menu');
})();