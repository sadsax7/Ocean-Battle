import { MenuScene } from './MenuScene.js';
import { GameScene } from './GameScene.js';

// Calcula el tamaño del juego según la ventana,
// con un máximo para que no se vuelva gigante
function getGameSize() {
    const maxWidth = 1280;
    const maxHeight = 720;

    const width = Math.min(window.innerWidth, maxWidth);
    const height = Math.min(window.innerHeight, maxHeight);

    return { width, height };
}

const { width, height } = getGameSize();

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width,
    height,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);

// Reajustar al cambiar tamaño de la ventana
window.addEventListener('resize', () => {
    const { width, height } = getGameSize();
    game.scale.resize(width, height);
});
