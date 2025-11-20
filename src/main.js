import { MenuScene } from './MenuScene.js';
import { GameScene } from './GameScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#000000',

    // Resolución "virtual" fija del juego (tu diseño está pensado así)
    width: 1280,
    height: 720,

    scale: {
        mode: Phaser.Scale.FIT,          // Ajusta el juego para que QUEPA en el contenedor
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },

    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);

// Cuando cambie el tamaño de la ventana, Phaser recalcula la escala
window.addEventListener('resize', () => {
    game.scale.refresh();
});
