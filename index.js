document.addEventListener('DOMContentLoaded', function () {
    const audioPermissionModal = document.getElementById("audioPermissionModal");
    const acceptAudioButton = document.getElementById("acceptAudio");
    const botonEmpezar = document.getElementById("botonEmpezar");
    const estadoJuego = document.getElementById("estadoJuego");
    const ronda = document.getElementById("ronda");
    const botonesJuego = document.querySelectorAll("#grupoInteractivo use");

    const mensajesPositivos = ["¡Bien hecho!", "¡Excelente!", "¡Sigue así!", "¡Muy bien!", "¡Continúa!"];

    let juegoInstancia = null; // Para poder acceder desde el botón de audio

    acceptAudioButton.addEventListener('click', function () {
        const audio = new Audio('https://quixo-sonidos.vercel.app/sounds_1.m4a');
        audio.play().then(() => {
            audioPermissionModal.style.display = 'none';
            
            // Despertar todos los sonidos del juego después del permiso
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
            this.velocidad = 800; // Aumentado un poco para equipos lentos
            this.botonesBloqueados = true;
            this.sonidosBoton = [];
            this.inactividadTimeout = null;

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

        // Método para "despertar" los sonidos después de la interacción del usuario
        despertarSonidos() {
            this.sonidosBoton.forEach(audio => {
                if (!audio) return;
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => {
                    // Puede fallar en algunos casos, pero ya hubo interacción
                });
            });
        }

        // Función auxiliar para esperar (promesa)
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
            this.limpiarEstado();
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

        limpiarEstado() {
            clearTimeout(this.inactividadTimeout);
            this.botonesBloqueados = true;
            this.posicionUsuario = 0;
            this.rondaActual = 0;

            this.botones.forEach(boton => {
                boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));
            });
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
                        setTimeout(() => this.mostrarSecuencia(), this.velocidad);
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

        // *** CAMBIO PRINCIPAL: mostrarSecuencia ahora es async/await ***
        async mostrarSecuencia() {
            this.botonesBloqueados = true;
            clearTimeout(this.inactividadTimeout);

            // Tiempos ajustados para mejor sincronización
            const tiempoEncendido = this.velocidad * 0.6;  // 60% del tiempo con luz prendida
            const tiempoEntrePasos = this.velocidad * 0.4; // 40% de pausa entre colores

            // Recorremos la secuencia paso por paso, esperando cada uno
            for (let i = 0; i <= this.rondaActual; i++) {
                const indiceColor = this.secuencia[i];
                const boton = this.botones[indiceColor];

                // Encender luz
                this.alternarEstiloBoton(boton, true);

                // Reproducir sonido
                this.reproducirSonido(indiceColor);

                // Mantener encendido
                await this.sleep(tiempoEncendido);

                // Apagar luz
                this.alternarEstiloBoton(boton, false);

                // Pausa antes del siguiente (excepto en el último)
                if (i < this.rondaActual) {
                    await this.sleep(tiempoEntrePasos);
                }
            }

            // Cuando termina la secuencia, el usuario puede jugar
            this.botonesBloqueados = false;
            this.posicionUsuario = 0;

            // Iniciar temporizador de inactividad
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
                audio.currentTime = 0; // Reiniciar desde el inicio
                audio.play().catch(error => {
                    console.error('Error al reproducir sonido:', error);
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
            this.limpiarEstado();
        
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