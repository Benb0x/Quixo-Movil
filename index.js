document.addEventListener('DOMContentLoaded', function () {

    const audioPermissionModal = document.getElementById("audioPermissionModal");
    const acceptAudioButton = document.getElementById("acceptAudio");
    const botonEmpezar = document.getElementById("botonEmpezar");
    const estadoJuego = document.getElementById("estadoJuego");
    const ronda = document.getElementById("ronda");
    const botonesJuego = document.querySelectorAll("#grupoInteractivo use");

    let nivelSeleccionado = 'facil';

    document.querySelectorAll('.nivel-item').forEach(item => {

        item.addEventListener('click', function (e) {

            e.preventDefault();

            nivelSeleccionado = this.getAttribute('data-nivel');

            const textos = {
                facil: '1 🟢 Fácil — Normal',
                medio: '2 🟡 Medio — Rápido',
                dificil: '3 🔴 Difícil — ¡Super Veloz!'
            };

            document.getElementById('dropdownNivel').textContent =
                textos[nivelSeleccionado];
        });
    });

    acceptAudioButton.addEventListener('click', function () {

        const audio = new Audio(
            'https://quixo-sonidos.vercel.app/sounds_1.m4a'
        );

        audio.play()
            .then(() => {
                audioPermissionModal.style.display = 'none';
            })
            .catch(() => { });
    });

    const esperar = ms =>
        new Promise(res => setTimeout(res, ms));

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

        cargarSonidos() {

            const urls = [
                'https://quixo-sonidos.vercel.app/sounds_1.m4a',
                'https://quixo-sonidos.vercel.app/sounds_2.m4a',
                'https://quixo-sonidos.vercel.app/sounds_3.m4a',
                'https://quixo-sonidos.vercel.app/sounds_4.m4a',
                'https://quixo-sonidos.vercel.app/sounds_error.m4a',
                'https://quixo-sonidos.vercel.app/win.m4a'
            ];

            urls.forEach((url, i) => {

                const audio = new Audio(url);

                audio.preload = "auto";

                // ✅ ARREGLO SONIDOS RÁPIDOS
                audio.load();

                this.sonidosBoton[i] = audio;
            });
        }

        iniciar() {

            this.botones = Array.from(botonesJuego);

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

        async iniciarJuego() {

            const config = this.obtenerConfigNivel();

            this.tiempoEncendido = config.encendido;
            this.gap = config.gap;
            this.tiempoEspera = config.espera;

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

        async bucleJuego() {

            for (let r = 0; r < this.secuencia.length; r++) {

                ronda.textContent = `Ronda: ${r + 1}`;

                estadoJuego.textContent = '👀 Mira...';

                estadoJuego.style.color = '#4682B4';

                for (let i = 0; i <= r; i++) {

                    await esperar(this.gap);

                    await this.iluminarBoton(
                        this.secuencia[i]
                    );
                }

                await esperar(300);

                estadoJuego.textContent = '¡Tu turno!';

                estadoJuego.style.color = '#28a745';

                const resultado =
                    await this.turnoJugador(r);

                if (!resultado) return;

                await esperar(400);
            }

            this.ganarJuego();
        }

        turnoJugador(rondaMax) {

            return new Promise((resolve) => {

                let posicion = 0;

                this.esperandoJugador = true;

                this.procesandoClic = false;

                const limpiar = () => {

                    this.esperandoJugador = false;

                    this.procesandoClic = false;

                    this.resolverClic = null;

                    clearTimeout(this.inactividadTimeout);
                };

                const resetTimer = () => {

                    clearTimeout(this.inactividadTimeout);

                    this.inactividadTimeout =
                        setTimeout(() => {

                            limpiar();

                            this.perderJuego();

                            resolve(false);

                        }, this.tiempoEspera);
                };

                resetTimer();

                this.resolverClic = async (indice) => {

                    clearTimeout(this.inactividadTimeout);

                    if (indice !== this.secuencia[posicion]) {

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

        recibirClic(indice) {

            if (this.resolverClic) {

                this.resolverClic(indice);
            }
        }

        // ✅ ARREGLO DEFINITIVO SONIDOS
        async iluminarBoton(indice) {

            const boton = this.botones[indice];

            const sonidoOriginal = this.sonidosBoton[indice];

            boton.setAttribute(
                'fill',
                boton.getAttribute('data-color-activo')
            );

            // ✅ CLONAR AUDIO
            // evita que sonidos rápidos se corten
            if (sonidoOriginal) {

                const sonido = sonidoOriginal.cloneNode();

                sonido.volume = 1;

                sonido.play().catch(() => { });
            }

            await esperar(this.tiempoEncendido);

            boton.setAttribute(
                'fill',
                boton.getAttribute('data-color-inactivo')
            );
        }

        perderJuego() {

            clearTimeout(this.inactividadTimeout);

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

            const errorAudio = this.sonidosBoton[4];

            errorAudio.pause();

            errorAudio.currentTime = 0;

            setTimeout(() => {

                errorAudio.play().catch(() => { });

            }, 80);

            botonEmpezar.disabled = false;
        }

        ganarJuego() {

            clearTimeout(this.inactividadTimeout);

            this.esperandoJugador = false;

            this.procesandoClic = false;

            this.resolverClic = null;

            this.botones.forEach(b => {

                b.setAttribute(
                    'fill',
                    b.getAttribute('data-color-inactivo')
                );

            });

            const texto = "¡FELICIDADES GANASTE!";

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

            this.sonidosBoton[5].play().catch(() => { });

            botonEmpezar.disabled = false;

            let rafagas = 0;

            const lanzar = () => {

                if (rafagas < 4) {

                    confetti({
                        particleCount: 40,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0, y: 0.6 }
                    });

                    confetti({
                        particleCount: 40,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1, y: 0.6 }
                    });

                    rafagas++;

                    setTimeout(lanzar, 1000);
                }
            };

            lanzar();
        }
    }

    new Quixo();

    // ✅ RECARGAR SI SALES Y REGRESAS
    document.addEventListener("visibilitychange", () => {

        if (!document.hidden) {

            location.reload();
        }
    });
});