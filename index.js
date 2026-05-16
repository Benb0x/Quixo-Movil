document.addEventListener('DOMContentLoaded', function () {

    const audioPermissionModal =
        document.getElementById("audioPermissionModal");

    const acceptAudioButton =
        document.getElementById("acceptAudio");

    const botonEmpezar =
        document.getElementById("botonEmpezar");

    const estadoJuego =
        document.getElementById("estadoJuego");

    const ronda =
        document.getElementById("ronda");

    const botonesJuego =
        document.querySelectorAll("#grupoInteractivo use");

    let nivelSeleccionado = 'facil';

    /* =========================
       SELECCIÓN DE NIVEL
    ========================== */

    document.querySelectorAll('.nivel-item')
        .forEach(item => {

            item.addEventListener('click', function (e) {

                e.preventDefault();

                nivelSeleccionado =
                    this.getAttribute('data-nivel');

                const textos = {

                    facil:
                        '1 🟢 Fácil — Normal',

                    medio:
                        '2 🟡 Medio — Rápido',

                    dificil:
                        '3 🔴 Difícil — ¡Super Veloz!'
                };

                document.getElementById('dropdownNivel')
                    .textContent =
                    textos[nivelSeleccionado];
            });
        });

    /* =========================
       PERMISOS AUDIO
    ========================== */

    acceptAudioButton.addEventListener('click', async function () {

        try {

            const audio = new Audio(
    'sounds_1.m4a'
);

            audio.volume = 1.0;

            await audio.play();

        } catch (e) {}

        audioPermissionModal.style.display = 'none';
    });

    /* =========================
       ESPERAR
    ========================== */

    const esperar = ms =>
        new Promise(res => setTimeout(res, ms));

    /* =========================
       CLASE QUIXO
    ========================== */

    class Quixo {

        constructor() {

            this.secuencia = [];

            this.sonidosBoton = [];

            this.esperandoJugador = false;

            this.procesandoClic = false;

            this.inactividadTimeout = null;

            this.resolverClic = null;

            this.tiempoEncendido = 350;

            this.gap = 100;

            this.tiempoEspera = 8000;

            this.cargarSonidos();

            this.iniciar();
        }

        /* =========================
           CARGAR SONIDOS
        ========================== */

        cargarSonidos() {

           const urls = [

    'sounds_1.m4a',
    'sounds_2.m4a',
    'sounds_3.m4a',
    'sounds_4.m4a',
    'sounds_error.m4a',
    'win.m4a'
];
            urls.forEach((url, i) => {

                const audio = new Audio(url);

                audio.preload = "auto";

                audio.volume = 1.0;

                this.sonidosBoton[i] = audio;
            });
        }

        /* =========================
           INICIAR
        ========================== */

        iniciar() {

            this.botones =
                Array.from(botonesJuego);

            this.botones.forEach((boton, i) => {

                boton.setAttribute(
                    'fill',
                    boton.getAttribute('data-color-inactivo')
                );

                boton.addEventListener('click', () => {

                    if (this.esperandoJugador) {

                        this.recibirClic(i);
                    }
                });
            });

            botonEmpezar.addEventListener('click', () => {

                botonEmpezar.disabled = true;

                this.iniciarJuego();
            });
        }

        /* =========================
           CONFIGURACIÓN NIVELES
        ========================== */

        obtenerConfigNivel() {

            if (nivelSeleccionado === 'facil') {

                return {

                    encendido: 400,
                    gap: 180,
                    espera: 8000,
                    rondas: 6
                };
            }

            if (nivelSeleccionado === 'medio') {

                return {

                    encendido: 280,
                    gap: 110,
                    espera: 6000,
                    rondas: 12
                };
            }

            if (nivelSeleccionado === 'dificil') {

                return {

                    encendido: 180,
                    gap: 80,
                    espera: 4000,
                    rondas: 18
                };
            }

            return {

                encendido: 400,
                gap: 150,
                espera: 8000,
                rondas: 8
            };
        }

        /* =========================
           INICIAR JUEGO
        ========================== */

        async iniciarJuego() {

            const config =
                this.obtenerConfigNivel();

            this.tiempoEncendido =
                config.encendido;

            this.gap =
                config.gap;

            this.tiempoEspera =
                config.espera;

            this.secuencia = Array.from(

                { length: config.rondas },

                () => Math.floor(Math.random() * 4)
            );

            this.esperandoJugador = false;

            this.procesandoClic = false;

            this.resolverClic = null;

            this.botones.forEach(b => {

                b.setAttribute(
                    'fill',
                    b.getAttribute('data-color-inactivo')
                );
            });

            ronda.textContent = 'Ronda: 1';

            estadoJuego.textContent = '¡Atención!';

            estadoJuego.style.color = '#4682B4';

            await esperar(600);

            await this.bucleJuego();
        }

        /* =========================
           BUCLE JUEGO
        ========================== */

        async bucleJuego() {

            for (let r = 0; r < this.secuencia.length; r++) {

                ronda.textContent =
                    `Ronda: ${r + 1}`;

                estadoJuego.textContent =
                    '👀 Mira...';

                estadoJuego.style.color =
                    '#4682B4';

                for (let i = 0; i <= r; i++) {

                    await esperar(this.gap);

                    await this.iluminarBoton(
                        this.secuencia[i]
                    );
                }

                await esperar(300);

                estadoJuego.textContent =
                    '¡Tu turno!';

                estadoJuego.style.color =
                    '#28a745';

                const resultado =
                    await this.turnoJugador(r);

                if (!resultado) return;

                await esperar(400);
            }

            this.ganarJuego();
        }

        /* =========================
           TURNO JUGADOR
        ========================== */

        turnoJugador(rondaMax) {

            return new Promise((resolve) => {

                let posicion = 0;

                this.esperandoJugador = true;

                this.procesandoClic = false;

                const limpiar = () => {

                    this.esperandoJugador = false;

                    this.procesandoClic = false;

                    this.resolverClic = null;

                    clearTimeout(
                        this.inactividadTimeout
                    );
                };

                const resetTimer = () => {

                    clearTimeout(
                        this.inactividadTimeout
                    );

                    this.inactividadTimeout =
                        setTimeout(() => {

                            limpiar();

                            this.perderJuego();

                            resolve(false);

                        }, this.tiempoEspera);
                };

                resetTimer();

                this.resolverClic = async (indice) => {

                    clearTimeout(
                        this.inactividadTimeout
                    );

                    if (
                        indice !==
                        this.secuencia[posicion]
                    ) {

                        limpiar();

                        this.perderJuego();

                        resolve(false);

                        return;
                    }

                    await this.iluminarBoton(indice);

                    posicion++;

                    if (posicion > rondaMax) {

                        limpiar();

                        resolve(true);

                    } else {

                        resetTimer();
                    }
                };
            });
        }

        /* =========================
           RECIBIR CLIC
        ========================== */

        recibirClic(indice) {

            if (this.resolverClic) {

                this.resolverClic(indice);
            }
        }

        /* =========================
           ILUMINAR BOTÓN
        ========================== */

        async iluminarBoton(indice) {

            const boton =
                this.botones[indice];

            boton.setAttribute(
                'fill',
                boton.getAttribute('data-color-activo')
            );

            /* AUDIO ESTABLE */

            try {

                const sonido =
                    this.sonidosBoton[indice]
                        .cloneNode();

                sonido.volume = 1.0;

                sonido.play().catch(() => { });

            } catch (e) {}

            await esperar(this.tiempoEncendido);

            boton.setAttribute(
                'fill',
                boton.getAttribute('data-color-inactivo')
            );
        }

        /* =========================
           PERDER
        ========================== */

        perderJuego() {

    clearTimeout(
        this.inactividadTimeout
    );

    this.esperandoJugador = false;

    this.procesandoClic = false;

    this.resolverClic = null;

    this.botones.forEach(b => {

        b.setAttribute(
            'fill',
            b.getAttribute('data-color-inactivo')
        );
    });

    estadoJuego.textContent =
        '❌ Error. Inténtalo de nuevo.';

    estadoJuego.style.color = 'red';

    ronda.textContent = 'Ronda: 1';

    /* SONIDO ERROR */

    try {

        const errorAudio = new Audio(
            'sounds_error.m4a'
        );

        errorAudio.volume = 1.0;

        errorAudio.preload = "auto";

        errorAudio.currentTime = 0;

        errorAudio.play()
            .catch(err => console.log(err));

    } catch (e) {

        console.log(e);
    }

    botonEmpezar.disabled = false;
}
        /* =========================
           GANAR
        ========================== */

        ganarJuego() {

            clearTimeout(
                this.inactividadTimeout
            );

            this.esperandoJugador = false;

            this.procesandoClic = false;

            this.resolverClic = null;

            this.botones.forEach(b => {

                b.setAttribute(
                    'fill',
                    b.getAttribute('data-color-inactivo')
                );
            });

            const texto =
                "¡FELICIDADES GANASTE!";

            const colores = [

                '#FF0000',
                '#FF7F00',
                '#FFD700',
                '#00CC00',
                '#0000FF',
                '#8B00FF'
            ];

            estadoJuego.innerHTML = texto
                .split('')
                .map((letra, i) =>

                    `<span style="
                        color:${colores[i % colores.length]};
                        font-weight:bold
                    ">
                        ${letra === ' '
                            ? '&nbsp;'
                            : letra}
                    </span>`
                )
                .join('');

            ronda.textContent = 'Ronda: 1';

            /* AUDIO GANAR ESTABLE */

            try {

                const winAudio =
                    this.sonidosBoton[5]
                        .cloneNode();

                winAudio.volume = 1.0;

                winAudio.play()
                    .catch(() => { });

            } catch (e) {}

            botonEmpezar.disabled = false;

            /* CONFETI */

            let rafagas = 0;

            const lanzar = () => {

                if (rafagas < 4) {

                    confetti({

                        particleCount: 40,
                        angle: 60,
                        spread: 55,

                        origin: {
                            x: 0,
                            y: 0.6
                        }
                    });

                    confetti({

                        particleCount: 40,
                        angle: 120,
                        spread: 55,

                        origin: {
                            x: 1,
                            y: 0.6
                        }
                    });

                    rafagas++;

                    setTimeout(
                        lanzar,
                        1000
                    );
                }
            };

            lanzar();
        }
    }

    /* =========================
       INICIAR JUEGO
    ========================== */

    new Quixo();

    /* =========================
       RECARGAR SI REGRESA
    ========================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (!document.hidden) {

                location.reload();
            }
        }
    );
});