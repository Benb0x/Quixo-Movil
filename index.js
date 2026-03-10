document.addEventListener('DOMContentLoaded', function () {
    const audioPermissionModal = document.getElementById("audioPermissionModal");
    const acceptAudioButton = document.getElementById("acceptAudio");
    const botonEmpezar = document.getElementById("botonEmpezar");
    const estadoJuego = document.getElementById("estadoJuego");
    const ronda = document.getElementById("ronda");
    const botonesJuego = document.querySelectorAll("#grupoInteractivo use");

    const mensajesPositivos = ["¡Bien hecho!", "¡Excelente!", "¡Sigue así!", "¡Muy bien!", "¡Continúa!"];

    acceptAudioButton.addEventListener('click', function () {
        const audio = new Audio('https://quixo-sonidos.vercel.app/sounds_1.m4a');
        audio.play().then(() => {
            audioPermissionModal.style.display = 'none';
        }).catch(error => {
            console.error("Error al habilitar el sonido.");
        });
    });

    class Quixo {
        constructor() {
            this.rondaActual = 0;
            this.posicionUsuario = 0;
            this.secuencia = [];
            this.velocidad = 1000;
            this.botonesBloqueados = true;
            this.sonidosBoton = [];
            this.inactividadTimeout = null;
            this.juegoTerminado = false; // BANDERA PARA EVITAR perderJuego() después de ganar

            this.mostrandoSecuencia = false;
            this.intervaloSecuencia = null;

            this.display = {
                botonEmpezar,
                ronda,
                estadoJuego
            };

            this.cargarSonidos();
            this.iniciar();
        }

        cargarSonidos() {
            const sonidos = [
                'https://quixo-sonidos.vercel.app/sounds_1.m4a',
                'https://quixo-sonidos.vercel.app/sounds_2.m4a',
                'https://quixo-sonidos.vercel.app/sounds_3.m4a',
                'https://quixo-sonidos.vercel.app/sounds_4.m4a',
                'https://quixo-sonidos.vercel.app/sounds_error.m4a',
                'https://quixo-sonidos.vercel.app/win.m4a'
            ];

            sonidos.forEach((sonido, indice) => {
                const audio = new Audio(sonido);
                audio.preload = "auto";
                audio.crossOrigin = 'anonymous';
                this.sonidosBoton[indice] = audio;
            });
        }

        iniciar() {
            this.display.botonEmpezar.addEventListener('click', () => {
                this.display.botonEmpezar.disabled = true;
                this.reiniciarJuego();
            });

            this.botones = Array.from(botonesJuego);
            this.botones.forEach(boton => {
                boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));

                boton.addEventListener('click', (event) => {
                    if (!this.botonesBloqueados && !this.mostrandoSecuencia) {
                        const indice = this.botones.indexOf(event.currentTarget);
                        this.validarColorElegido(indice);
                    }
                });
            });
        }

        generarSecuenciaAleatoria(longitud) {
            const secuencia = [];
            for (let i = 0; i < longitud; i++) {
                const colorAleatorio = Math.floor(Math.random() * 4);
                secuencia.push(colorAleatorio);
            }
            return secuencia;
        }

        reiniciarJuego() {
            this.juegoTerminado = false; // RESETEAR BANDERA AL INICIAR
            this.limpiarEstado();
            this.secuencia = this.generarSecuenciaAleatoria(10);
            this.rondaActual = 0;
            this.posicionUsuario = 0;
            this.botonesBloqueados = true;
            this.mostrandoSecuencia = false;
            this.display.estadoJuego.textContent = '';
            this.display.estadoJuego.style.color = '#4682B4';
            this.actualizarEstado("¡Vamos a empezar!", 0);
            this.mostrarSecuencia();
        }

        limpiarEstado() {
            clearTimeout(this.inactividadTimeout);

            if (this.intervaloSecuencia) {
                clearInterval(this.intervaloSecuencia);
                this.intervaloSecuencia = null;
            }
            this.mostrandoSecuencia = false;

            this.botonesBloqueados = true;
            this.posicionUsuario = 0;
            this.rondaActual = 0;

            if (this.botones) {
                this.botones.forEach(boton => {
                    boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));
                });
            }
        }

        actualizarEstado(mensaje, ronda) {
            const mensajePositivo = mensajesPositivos[Math.floor(Math.random() * mensajesPositivos.length)];
            this.display.estadoJuego.textContent = `${mensajePositivo} Siguiente ronda: ${ronda + 1}`;
            this.display.estadoJuego.style.display = 'block';
        }

        validarColorElegido(indice) {
            clearTimeout(this.inactividadTimeout);

            if (this.secuencia[this.posicionUsuario] === indice) {
                this.alternarEstiloBoton(this.botones[indice], true);
                this.reproducirSonido(indice);

                setTimeout(() => {
                    this.alternarEstiloBoton(this.botones[indice], false);
                }, this.velocidad / 2);

                this.posicionUsuario++;

                if (this.posicionUsuario > this.rondaActual) {
                    this.rondaActual++;
                    if (this.rondaActual < this.secuencia.length) {
                        this.actualizarEstado("¡Muy bien!", this.rondaActual);
                        this.botonesBloqueados = true;

                        setTimeout(() => {
                            if (!this.mostrandoSecuencia) {
                                this.mostrarSecuencia();
                            }
                        }, this.velocidad);
                    } else {
                        this.ganarJuego();
                        return; // SALIR INMEDIATAMENTE, no ejecutar el temporizador de abajo
                    }
                }
            } else {
                this.perderJuego();
                return; // SALIR INMEDIATAMENTE
            }

            // Solo reactivar el temporizador si el juego sigue en curso
            if (!this.juegoTerminado) {
                this.inactividadTimeout = setTimeout(() => {
                    this.perderJuego();
                }, 5000);
            }
        }

        mostrarSecuencia() {
            if (this.mostrandoSecuencia) return;

            this.mostrandoSecuencia = true;
            this.botonesBloqueados = true;
            clearTimeout(this.inactividadTimeout);

            let indiceSecuencia = 0;

            if (this.intervaloSecuencia) {
                clearInterval(this.intervaloSecuencia);
                this.intervaloSecuencia = null;
            }

            this.botones.forEach(boton => {
                boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));
            });

            this.intervaloSecuencia = setInterval(() => {
                if (indiceSecuencia > 0) {
                    const anterior = this.secuencia[indiceSecuencia - 1];
                    this.alternarEstiloBoton(this.botones[anterior], false);
                }

                if (indiceSecuencia <= this.rondaActual) {
                    const indiceColor = this.secuencia[indiceSecuencia];
                    this.alternarEstiloBoton(this.botones[indiceColor], true);
                    this.reproducirSonido(indiceColor);
                    indiceSecuencia++;
                } else {
                    clearInterval(this.intervaloSecuencia);
                    this.intervaloSecuencia = null;

                    const ultimoIndice = this.secuencia[this.rondaActual];
                    this.alternarEstiloBoton(this.botones[ultimoIndice], false);

                    this.botonesBloqueados = false;
                    this.posicionUsuario = 0;
                    this.mostrandoSecuencia = false;

                    this.inactividadTimeout = setTimeout(() => {
                        this.perderJuego();
                    }, 5000);
                }
            }, this.velocidad);
        }

        alternarEstiloBoton(boton, activar) {
            if (activar) {
                boton.setAttribute('fill', boton.getAttribute('data-color-activo'));
            } else {
                boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));
            }
        }

        reproducirSonido(indice) {
            const audio = this.sonidosBoton[indice];
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(error => {
                    console.error('Error al reproducir sonido.');
                });
            }
        }

        perderJuego() {
            clearTimeout(this.inactividadTimeout);
            this.limpiarEstado();
            this.display.estadoJuego.textContent = 'Perdiste. Intenta de nuevo.';
            this.display.estadoJuego.style.color = 'red';
            this.display.ronda.style.display = 'none';
            this.reproducirSonido(4);
            this.display.botonEmpezar.disabled = false;
        }

        ganarJuego() {
            this.juegoTerminado = true; // BLOQUEAR CUALQUIER perderJuego() posterior
            clearTimeout(this.inactividadTimeout);
            this.limpiarEstado();

            const texto = "¡FELICIDADES GANASTE!";
            const colores = ['#FF0000', '#FF7F00', '#FFD700', '#00CC00', '#0000FF', '#8B00FF'];

            this.display.estadoJuego.innerHTML = texto.split('').map((letra, i) => {
                const color = colores[i % colores.length];
                return `<span style="color:${color}; font-weight:bold; display:inline-block; animation: saltarLetra 0.5s ease ${i * 0.05}s infinite alternate;">${letra === ' ' ? '&nbsp;' : letra}</span>`;
            }).join('');

            this.display.ronda.style.display = 'none';
            this.reproducirSonido(5);
            this.display.botonEmpezar.disabled = false;

            let rafagasLanzadas = 0;
            const maxRafagas = 4;
            const lanzarRafaga = () => {
                if (rafagasLanzadas < maxRafagas) {
                    confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
                    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
                    rafagasLanzadas++;
                    setTimeout(lanzarRafaga, 1000);
                }
            };
            lanzarRafaga();
        }
    }

    new Quixo();
});