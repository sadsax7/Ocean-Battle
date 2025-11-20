export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.numPlayers = data.numPlayers || 2;
    }

    // ==== PRELOAD ====
    preload() {
        this.load.image('bg_ocean', 'assets/underwater-bg.png');

        this.load.spritesheet('ocean_creatures', 'assets/ocean-creatures.png', {
            frameWidth: 61,
            frameHeight: 92
        });

        // spritesheet grande del buzo (6x12 de 32x32)
        this.load.spritesheet(
            'diver_sheet',
            'assets/PixelArt_Diver_SpriteSheet_v1.png',
            {
                frameWidth: 32,
                frameHeight: 32
            }
        );

        // Basuras (si puedes, mejor renombrarlas sin espacios en el disco)
        this.load.image('trash_bag_big1', 'assets/garbage bag 1.png');
        this.load.image('trash_bag_big2', 'assets/garbage bag 2.png');
        this.load.image('trash_bag_small1', 'assets/garbage bag small 1.png');
        this.load.image('trash_bag_small2', 'assets/garbage bag small 2.png');
        this.load.image('trash_bag_small3', 'assets/garbage bag small 3.png');

        this.load.image('bottle_clean', 'assets/water bottle clean.png');
        this.load.image('bottle_crumpled', 'assets/water bottle crumpled.png');
        this.load.image('bottle_dirty', 'assets/water bottle dirty.png');
    }

    // ==== CREATE ====
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Fondo océano animado
        const tex = this.textures.get('bg_ocean').getSourceImage();
        const bgW = tex.width;
        const bgH = tex.height;
        const scale = Math.max(W / bgW, H / bgH);

        this.bg = this.add.tileSprite(W / 2, H / 2, bgW, bgH, 'bg_ocean');
        this.bg.setScale(scale);
        this.bg.setScrollFactor(0);
        this.bg.setDepth(-10);

        // Tipos de basura
        this.trashTypes = [
            'trash_bag_big1',
            'trash_bag_big2',
            'trash_bag_small1',
            'trash_bag_small2',
            'trash_bag_small3',
            'bottle_clean',
            'bottle_crumpled',
            'bottle_dirty'
        ];

        // Peces (frames 0..17)
        const allFrames = [...Array(18).keys()];
        this.fishFrames = allFrames;

        // Densidad ajustada a tamaño de pantalla
        const area = W * H;
        const baseArea = 1000 * 650;
        const factor = area / baseArea;

        this.maxTrash = Math.max(10, Math.round(18 * factor));
        // Menos peces pero más grandes
        this.maxFish = Math.max(3, Math.round(6 * factor));

        // === Animaciones de los buzos ===
        this.createDiverAnimations();

        // Jugadores
        this.player1 = this.createPlayerSprite(W * 0.25, H * 0.5, 1);
        if (this.numPlayers === 2) {
            this.player2 = this.createPlayerSprite(W * 0.75, H * 0.5, 2);
        } else {
            this.player2 = null;
        }

        this.playerSpeed = 240;
        this.gameOver = false;

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // === HUD HTML (marcador y tiempo) ===
        this.scoreP1 = 0;
        this.scoreP2 = 0;
        this.timeLeft = 60;

        this.scoreDisplayEl = document.getElementById('score-display');
        this.timerDisplayEl = document.getElementById('timer-display');

        this.updateScoreText();
        this.updateTimerText();

        // Timer interno del juego
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameOver) return;
                this.timeLeft--;
                this.updateTimerText();
                if (this.timeLeft <= 0) this.endGame();
            },
            loop: true
        });

        // Grupos
        this.trashGroup = this.physics.add.group();
        this.fishGroup = this.physics.add.group();

        // Colisiones basura
        this.physics.add.overlap(
            this.player1,
            this.trashGroup,
            (_, trash) => {
                if (this.gameOver) return;
                trash.destroy();
                this.scoreP1 += 1;
                this.updateScoreText();
            },
            null,
            this
        );

        if (this.numPlayers === 2 && this.player2) {
            this.physics.add.overlap(
                this.player2,
                this.trashGroup,
                (_, trash) => {
                    if (this.gameOver) return;
                    trash.destroy();
                    this.scoreP2 += 1;
                    this.updateScoreText();
                },
                null,
                this
            );
        }

        // Colisiones fauna (penalización)
        this.physics.add.overlap(
            this.player1,
            this.fishGroup,
            (_, fish) => this.hitFish(1, fish),
            null,
            this
        );

        if (this.numPlayers === 2 && this.player2) {
            this.physics.add.overlap(
                this.player2,
                this.fishGroup,
                (_, fish) => this.hitFish(2, fish),
                null,
                this
            );
        }

        // Spawns
        this.spawnTrashEvent = this.time.addEvent({
            delay: 1000,
            callback: this.spawnTrash,
            callbackScope: this,
            loop: true
        });

        this.spawnFishEvent = this.time.addEvent({
            delay: 2200,
            callback: this.spawnFish,
            callbackScope: this,
            loop: true
        });
    }

    // ==== Animaciones buzos (diver_sheet) ====
    createDiverAnimations() {
        // Player 1: filas 0 y 1
        if (!this.anims.exists('p1_idle')) {
            this.anims.create({
                key: 'p1_idle',
                frames: this.anims.generateFrameNumbers('diver_sheet', {
                    start: 0,
                    end: 11
                }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!this.anims.exists('p1_swim')) {
            this.anims.create({
                key: 'p1_swim',
                frames: this.anims.generateFrameNumbers('diver_sheet', {
                    start: 12,
                    end: 23
                }),
                frameRate: 12,
                repeat: -1
            });
        }

        // Player 2: filas 3 y 4
        if (!this.anims.exists('p2_idle')) {
            this.anims.create({
                key: 'p2_idle',
                frames: this.anims.generateFrameNumbers('diver_sheet', {
                    start: 36,
                    end: 47
                }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!this.anims.exists('p2_swim')) {
            this.anims.create({
                key: 'p2_swim',
                frames: this.anims.generateFrameNumbers('diver_sheet', {
                    start: 48,
                    end: 59
                }),
                frameRate: 12,
                repeat: -1
            });
        }
    }

    createPlayerSprite(x, y, playerNumber) {
        const startFrame = playerNumber === 1 ? 0 : 36;
        const sprite = this.physics.add.sprite(x, y, 'diver_sheet', startFrame);
        sprite.setCollideWorldBounds(true);
        sprite.setScale(2.2);
        sprite.setDepth(1);

        const animKeys =
            playerNumber === 1
                ? { idle: 'p1_idle', swim: 'p1_swim' }
                : { idle: 'p2_idle', swim: 'p2_swim' };

        sprite.setData('animKeys', animKeys);
        sprite.setData('facing', 'right');
        sprite.play(animKeys.idle);

        // Tintes para diferenciar jugadores
        if (playerNumber === 1) {
            // Dorado cálido
            sprite.setTint(0xffcc33);
        } else {
            // Magenta / coral brillante
            sprite.setTint(0xff66ff);
        }

        return sprite;
    }

    // ==== HUD helpers ====
    updateScoreText() {
        if (!this.scoreDisplayEl) return;

        if (this.numPlayers === 2) {
            this.scoreDisplayEl.textContent =
                `P1: ${this.scoreP1}  |  P2: ${this.scoreP2}`;
        } else {
            this.scoreDisplayEl.textContent =
                `Puntos: ${this.scoreP1}`;
        }
    }

    updateTimerText() {
        if (!this.timerDisplayEl) return;
        this.timerDisplayEl.textContent = `Tiempo: ${this.timeLeft}`;
    }

    // ==== Spawns ====
    spawnTrash() {
        if (this.gameOver) return;
        if (this.trashGroup.getChildren().length >= this.maxTrash) return;

        const W = this.scale.width;
        const H = this.scale.height;

        const x = Phaser.Math.Between(40, W - 40);
        const y = Phaser.Math.Between(140, H - 40);

        const type = Phaser.Utils.Array.GetRandom(this.trashTypes);
        const trash = this.trashGroup.create(x, y, type);

        const vx = Phaser.Math.Between(-40, 40);
        const vy = Phaser.Math.Between(-40, 40);
        trash.setVelocity(vx, vy);
        trash.setCollideWorldBounds(true);
        trash.setBounce(0.5);

        // === Escala según el tipo de basura ===
        let scale;
        if (type.includes('small')) {
            // Todas las que tienen "small" en el nombre salen MÁS GRANDES
            scale = Phaser.Math.FloatBetween(2.2, 2.8);
        } else if (type.startsWith('bottle_')) {
            // Botellas tamaño medio
            scale = Phaser.Math.FloatBetween(1.6, 2.1);
        } else {
            // Bolsas grandes normales
            scale = Phaser.Math.FloatBetween(1.8, 2.3);
        }
        trash.setScale(scale);
    }


    spawnFish() {
        if (this.gameOver) return;
        if (this.fishGroup.getChildren().length >= this.maxFish) return;

        const W = this.scale.width;
        const H = this.scale.height;

        const x = Phaser.Math.Between(60, W - 60);
        const y = Phaser.Math.Between(160, H - 60);

        const frame = Phaser.Utils.Array.GetRandom(this.fishFrames);
        const fish = this.fishGroup.create(x, y, 'ocean_creatures', frame);

        const vx = Phaser.Math.Between(-30, 30);
        const vy = Phaser.Math.Between(-20, 20);
        fish.setVelocity(vx, vy);
        fish.setCollideWorldBounds(true);
        fish.setBounce(1);

        // Peces un poco más grandes
        fish.setScale(1.15);
    }

    // ==== Penalización por golpear peces ====
    hitFish(playerNumber, fish) {
        if (this.gameOver) return;

        fish.setTint(0xff0000);
        this.time.delayedCall(150, () => fish.clearTint());

        if (playerNumber === 1) {
            this.scoreP1 = Math.max(0, this.scoreP1 - 2);
        } else if (playerNumber === 2) {
            this.scoreP2 = Math.max(0, this.scoreP2 - 2);
        }
        this.updateScoreText();
    }

    // ==== Fin de la partida ====
    endGame() {
        if (this.gameOver) return;
        this.gameOver = true;

        this.spawnTrashEvent.paused = true;
        this.spawnFishEvent.paused = true;
        this.timerEvent.paused = true;

        this.player1.body.setVelocity(0);
        if (this.player2) this.player2.body.setVelocity(0);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 520, 260, 0x000000, 0.7);

        this.add.text(W / 2, H / 2 - 60, '¡Fin de la partida!', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        let scoreLine;
        if (this.numPlayers === 2) {
            scoreLine = `P1: ${this.scoreP1}   |   P2: ${this.scoreP2}`;
        } else {
            scoreLine = `Puntos: ${this.scoreP1}`;
        }

        this.add.text(W / 2, H / 2 - 20, scoreLine, {
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5);

        let winnerText = '';
        if (this.numPlayers === 2) {
            if (this.scoreP1 > this.scoreP2) {
                winnerText = '🏆 ¡Ganó el Buzo Solar Guardián (P1)!';
            } else if (this.scoreP2 > this.scoreP1) {
                winnerText = '🏆 ¡Ganó el Buzo Coral Guardián (P2)!';
            } else {
                winnerText = '🤝 ¡Empate ecológico! Ambos limpiaron mucho.';
            }
        } else {
            winnerText = '🌊 ¡Buen trabajo cuidando el océano!';
        }

        this.add.text(W / 2, H / 2 + 20, winnerText, {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(
            W / 2,
            H / 2 + 60,
            'Recarga la página para volver al menú',
            {
                fontSize: '18px',
                color: '#dddddd'
            }
        ).setOrigin(0.5);
    }

    // ==== UPDATE ====
    update() {
        // Parallax del fondo
        if (this.bg) {
            this.bg.tilePositionX -= 0.15;
        }

        if (this.gameOver) {
            this.player1.body.setVelocity(0);
            if (this.player2) this.player2.body.setVelocity(0);
            return;
        }

        this.player1.body.setVelocity(0);
        if (this.player2) this.player2.body.setVelocity(0);

        // J1
        if (this.wasd.left.isDown) {
            this.player1.body.setVelocityX(-this.playerSpeed);
        } else if (this.wasd.right.isDown) {
            this.player1.body.setVelocityX(this.playerSpeed);
        }
        if (this.wasd.up.isDown) {
            this.player1.body.setVelocityY(-this.playerSpeed);
        } else if (this.wasd.down.isDown) {
            this.player1.body.setVelocityY(this.playerSpeed);
        }
        this.updatePlayerAnimation(this.player1);

        // J2
        if (this.numPlayers === 2 && this.player2) {
            if (this.cursors.left.isDown) {
                this.player2.body.setVelocityX(-this.playerSpeed);
            } else if (this.cursors.right.isDown) {
                this.player2.body.setVelocityX(this.playerSpeed);
            }
            if (this.cursors.up.isDown) {
                this.player2.body.setVelocityY(-this.playerSpeed);
            } else if (this.cursors.down.isDown) {
                this.player2.body.setVelocityY(this.playerSpeed);
            }
            this.updatePlayerAnimation(this.player2);
        }
    }

    updatePlayerAnimation(sprite) {
        if (!sprite) return;
        const keys = sprite.getData('animKeys');
        if (!keys) return;

        const currentFacing = sprite.getData('facing') || 'right';
        const moving = sprite.body.velocity.lengthSq() > 5;
        const targetKey = moving ? keys.swim : keys.idle;

        if (sprite.anims.currentAnim?.key !== targetKey) {
            sprite.play(targetKey);
        }

        if (Math.abs(sprite.body.velocity.x) > 5) {
            const newFacing = sprite.body.velocity.x < 0 ? 'left' : 'right';
            if (newFacing !== currentFacing) {
                sprite.setData('facing', newFacing);
                sprite.setFlipX(newFacing === 'left');
            }
        }
    }


}
