document.addEventListener('DOMContentLoaded', function () {
    const audioPermissionModal = document.getElementById("audioPermissionModal");
    const acceptAudioButton = document.getElementById("acceptAudio");
    const botonEmpezar = document.getElementById("botonEmpezar");
    const estadoJuego = document.getElementById("estadoJuego");
    const ronda = document.getElementById("ronda");
    const botonesJuego = document.querySelectorAll("#grupoInteractivo use");

    const mensajesPositivos = ["¡Bien hecho!", "¡Excelente!", "¡Sigue así!", "¡Muy bien!", "¡Continúa!"];

    let juegoInstancia = null;

    acceptAudioButton.addEventListener('click', function () {
        const audio = new Audio('https://quixo-sonidos.vercel.app/sounds_1.m4a');
        audio.play().then(() => {
            audioPermissionModal.style.display = 'none';
            
            if (juegoInstancia) {
                juegoInstancia.despertarSonidos();
            }
        }).catch(error => {
            console.error("Error al habilitar el sonido.");
        });
    });

    class Quixo {
        constructor() {
            this.rondaActual = 0;
            this.posicionUsuario = 0;
            this.secuencia = [];
            this.velocidad = 900; // un poco más lento para que se vea claro
            this.botonesBloqueados = true;
            this.sonidosBoton = [];
            this.inactividadTimeout = null;
            this.mostrandoSecuencia = false;

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
                'https://quixo-sonidos.vercel.app/sounds_1.m4a',  // ojos
                'https://quixo-sonidos.vercel.app/sounds_2.m4a',  // bigote
                'https://quixo-sonidos.vercel.app/sounds_3.m4a',  // cascoS
                'https://quixo-sonidos.vercel.app/sounds_4.m4a',  // cascoI
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

        despertarSonidos() {
            this.sonidosBoton.forEach(audio => {
                if (!audio) return;
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => {});
            });
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        iniciar() {
            this.display.botonEmpezar.addEventListener('click', () => {
                this.reiniciarJuego();
            });

            this.botones = Array.from(botonesJuego);
            this.botones.forEach(boton => {
                boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));

                boton.addEventListener('click', (event) => {
                    if (!this.botonesBloqueados) {
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
            this.limpiarEstadoVisual();
            clearTimeout(this.inactividadTimeout);
            this.mostrandoSecuencia = false;

            this.secuencia = this.generarSecuenciaAleatoria(20);
            this.rondaActual = 0;
            this.posicionUsuario = 0;
            this.botonesBloqueados = true;

            this.display.estadoJuego.textContent = '';
            this.display.estadoJuego.style.color = '#4682B4'; 
            this.display.botonEmpezar.disabled = true;
            this.actualizarEstado("¡Vamos a empezar!", 0);

            this.mostrarSecuencia();
        }

        limpiarEstadoVisual() {
            this.botones.forEach(boton => {
                boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));
            });
        }

        actualizarEstado(mensaje, rondaNum) {
            const mensajePositivo = mensajesPositivos[Math.floor(Math.random() * mensajesPositivos.length)];
            this.display.estadoJuego.textContent = `${mensajePositivo} Siguiente ronda: ${rondaNum + 1}`;
            this.display.estadoJuego.style.display = 'block';
        }

        validarColorElegido(indice) {
            clearTimeout(this.inactividadTimeout);

            if (this.secuencia[this.posicionUsuario] === indice) {
                // feedback visual y sonoro al usuario
                this.alternarEstiloBoton(this.botones[indice], true);
                this.reproducirSonido(indice);

                setTimeout(() => {
                    this.alternarEstiloBoton(this.botones[indice], false);
                }, this.velocidad * 0.8);

                this.posicionUsuario++;

                // avance de ronda
                if (this.posicionUsuario > this.rondaActual) {
                    this.rondaActual++;
                    if (this.rondaActual < this.secuencia.length) {
                        this.actualizarEstado("¡Muy bien!", this.rondaActual);
                        this.botonesBloqueados = true;

                        // importante: solo llamar una vez a mostrarSecuencia
                        setTimeout(() => {
                            this.mostrarSecuencia();
                        }, this.velocidad);
                    } else {
                        this.ganarJuego();
                    }
                }
            } else {
                this.perderJuego();
            }

            this.inactividadTimeout = setTimeout(() => {
                this.perderJuego();
            }, 5000);
        }

        async mostrarSecuencia() {
            if (this.mostrandoSecuencia) {
                return; // evitar duplicados
            }
            this.mostrandoSecuencia = true;
            this.botonesBloqueados = true;
            clearTimeout(this.inactividadTimeout);

            // siempre empezamos con todo apagado
            this.limpiarEstadoVisual();

            const tiempoEncendido = this.velocidad * 0.9;  // 90% encendido
            const tiempoEntrePasos = this.velocidad * 0.3; // 30% pausa

            for (let i = 0; i <= this.rondaActual; i++) {
                const indiceColor = this.secuencia[i];
                const boton = this.botones[indiceColor];

                // encender solo este
                this.alternarEstiloBoton(boton, true);
                this.reproducirSonido(indiceColor);

                await this.sleep(tiempoEncendido);

                // apagarlo
                this.alternarEstiloBoton(boton, false);

                if (i < this.rondaActual) {
                    await this.sleep(tiempoEntrePasos);
                }
            }

            this.botonesBloqueados = false;
            this.posicionUsuario = 0;
            this.mostrandoSecuencia = false;

            this.inactividadTimeout = setTimeout(() => {
                this.perderJuego();
            }, 5000);
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
                    console.error('Error al reproducir sonido:', error);
                });
            }
        }

        perderJuego() {
            clearTimeout(this.inactividadTimeout);
            this.mostrandoSecuencia = false;
            this.botonesBloqueados = true;

            this.limpiarEstadoVisual();
            this.display.estadoJuego.textContent = 'Perdiste. Intenta de nuevo.';
            this.display.estadoJuego.style.color = 'red';
            this.display.ronda.style.display = 'none';
            this.reproducirSonido(4);
            this.display.botonEmpezar.disabled = false;
        }

        ganarJuego() {
            clearTimeout(this.inactividadTimeout);
            this.mostrandoSecuencia = false;
            this.botonesBloqueados = true;

            this.limpiarEstadoVisual();
        
            if (window.innerWidth <= 375) {
                this.display.estadoJuego.innerHTML = '¡F E L I C I D A D E S<br>G A N A S T E!';
            } else {
                this.display.estadoJuego.textContent = '¡FELICIDADES GANASTE!';
            }
        
            this.display.ronda.style.display = 'none';
            this.reproducirSonido(5);
            this.display.botonEmpezar.disabled = false;
        }
    }

    juegoInstancia = new Quixo();
});