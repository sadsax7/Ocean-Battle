export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Fondo oscuro tipo panel
        this.add.rectangle(W / 2, H / 2, W, H, 0x020817);

        // ===== TÍTULO "CleanSea" (igual al HUD) =====
        const title = this.add.text(W / 2, H * 0.28, 'CleanSea', {
            fontFamily: '"Press Start 2P", system-ui',
            fontSize: '40px',
            color: '#00f5ff',
            stroke: '#022c3a',
            strokeThickness: 6,
            align: 'center',
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#00f5ff',
                blur: 3,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Subtítulo
        const subtitle = this.add.text(
            W / 2,
            title.y + 46,
            '¡Batalla por limpiar el Océano!',
            {
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '22px',
                color: '#e5f3ff',
                align: 'center',
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: '#00f5ff',
                    blur: 9,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // Descripción
        const desc = this.add.text(
            W / 2,
            subtitle.y + 34,
            'Recoge la basura del océano, protege a los animales marinos\n' +
            'y coopera con tu compañero para dejar el fondo marino limpio.',
            {
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '15px',
                color: '#9fb9d9',
                align: 'center',
                lineSpacing: 4
            }
        ).setOrigin(0.5);

        // Reglas / instrucciones
        const rules =
            '- Recoge basura para ganar puntos (+1)\n' +
            '- Evita golpear a los animales marinos (-2)\n' +
            '- Limpien el océano antes de que se acabe el tiempo';

        const rulesText = this.add.text(
            W / 2,
            desc.y + 64,
            rules,
            {
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '15px',
                color: '#e5f3ff',
                align: 'center',
                lineSpacing: 6,
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: '#00f5ff',
                    blur: 3,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // ===== BOTONES =====
        const btnY1 = rulesText.y + 100;
        const btnY2 = btnY1 + 74;

        // Botón 1 jugador
        this.createMenuButton(
            W / 2,
            btnY1,
            '🎮  1 jugador',
            0x0284c7,   // azul oceánico
            0x38bdf8,   // borde / glow
            () => this.startGame(1)
        );

        // Botón 2 jugadores
        this.createMenuButton(
            W / 2,
            btnY2,
            '🎮🎮  2 jugadores',
            0x059669,   // verde mar
            0x22c55e,   // borde / glow
            () => this.startGame(2)
        );

        // Texto de ayuda abajo
        this.add.text(
            W / 2,
            H - 40,
            'Pulsa 1 o 2 en el teclado para elegir modo',
            {
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '15px',
                color: '#9fb9d9'
            }
        ).setOrigin(0.5);

        // Atajos teclado
        this.input.keyboard.on('keydown-ONE', () => this.startGame(1));
        this.input.keyboard.on('keydown-TWO', () => this.startGame(2));

    }

    createMenuButton(x, y, label, baseColor, glowColor, onClick) {
    const width = 260;
    const height = 56;

    // Contenedor centrado
    const container = this.add.container(x, y);

    // Fondo del botón
    const g = this.add.graphics();
    g.lineStyle(2, glowColor, 1);
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, 22);

    // Brillo superior (como luz del agua)
    g.fillGradientStyle(
        0xffffff, 0xdbeafe,
        baseColor, baseColor,
        0.28
    );
    g.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, height / 2.4, 18);

    // Texto
    const txt = this.add.text(0, 2, label, {
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: '20px',
        color: '#eefdff',
        align: 'center'
    }).setOrigin(0.5);

    container.add([g, txt]);

    // HITBOX COMPLETO
    // Le decimos al container qué tamaño tiene y dejamos que Phaser
    // genere el área interactiva centrada. Nada de rectángulos raros.
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    // Hover
    container.on('pointerover', () => {
        this.tweens.add({
            targets: container,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 120,
            ease: 'Sine.easeOut'
        });
    });

    container.on('pointerout', () => {
        this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 120,
            ease: 'Sine.easeIn'
        });
    });

    // Click
    container.on('pointerdown', () => {
        this.tweens.add({
            targets: container,
            scaleX: 0.97,
            scaleY: 0.97,
            yoyo: true,
            duration: 90,
            ease: 'Quad.easeOut',
            onComplete: onClick
        });
    });

    return container;
}
    startGame(numPlayers) {
        this.scene.start('GameScene', { numPlayers });
    }
}
