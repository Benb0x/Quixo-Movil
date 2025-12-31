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
            this.secuencia = []; // Secuencia será aleatoria ahora
            this.velocidad = 1000; // MÁS TIEMPO ENTRE PASOS
            this.botonesBloqueados = true;
            this.sonidosBoton = [];
            this.inactividadTimeout = null;

            // NUEVOS CAMPOS PARA CONTROL ESTRICTO DE LA SECUENCIA
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
            // IMPORTANTE: solo un listener y deshabilitar tan pronto se clickea
            this.display.botonEmpezar.addEventListener('click', () => {
                this.display.botonEmpezar.disabled = true; // deshabilitar INMEDIATAMENTE
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
                const colorAleatorio = Math.floor(Math.random() * 4); // Genera un número entre 0 y 3
                secuencia.push(colorAleatorio);
            }
            return secuencia;
        }

        reiniciarJuego() {
            this.limpiarEstado();
            this.secuencia = this.generarSecuenciaAleatoria(20); // Genera una secuencia aleatoria de 20 colores
            this.rondaActual = 0;
            this.posicionUsuario = 0;
            this.botonesBloqueados = true;
            this.display.estadoJuego.textContent = ''; // Limpiar mensajes previos
            this.display.estadoJuego.style.color = '#4682B4'; 
            // botón ya se deshabilita en iniciar()
            this.actualizarEstado("¡Vamos a empezar!", 0);
            this.mostrarSecuencia();
        }

        limpiarEstado() {
            clearTimeout(this.inactividadTimeout); // Limpia cualquier temporizador anterior

            // LIMPIAR CUALQUIER SECUENCIA QUE ESTÉ CORRIENDO
            if (this.intervaloSecuencia) {
                clearInterval(this.intervaloSecuencia);
                this.intervaloSecuencia = null;
            }
            this.mostrandoSecuencia = false;

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
            clearTimeout(this.inactividadTimeout); // Reinicia el temporizador de inactividad

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

                        // BLOQUEAR SIEMPRE ANTES DE LA SIGUIENTE SECUENCIA
                        this.botonesBloqueados = true;

                        setTimeout(() => {
                            // NO EMPEZAR OTRA SI YA HAY UNA EN CURSO
                            if (!this.mostrandoSecuencia) {
                                this.mostrarSecuencia();
                            }
                        }, this.velocidad);
                    } else {
                        this.ganarJuego();
                    }
                }
            } else {
                this.perderJuego();
            }

            // Reinicia el temporizador después de cada clic correcto del usuario
            this.inactividadTimeout = setTimeout(() => {
                this.perderJuego();
            }, 5000);
        }

        mostrarSecuencia() {
            // SI YA HAY UNA SECUENCIA MOSTRÁNDOSE, SALIR
            if (this.mostrandoSecuencia) {
                return;
            }

            this.mostrandoSecuencia = true;
            this.botonesBloqueados = true;
            clearTimeout(this.inactividadTimeout); // Limpia cualquier temporizador antes de iniciar la secuencia

            let indiceSecuencia = 0;

            // POR SI QUEDÓ ALGÚN INTERVALO VIEJO
            if (this.intervaloSecuencia) {
                clearInterval(this.intervaloSecuencia);
                this.intervaloSecuencia = null;
            }

            // APAGAR TODO ANTES DE EMPEZAR
            this.botones.forEach(boton => {
                boton.setAttribute('fill', boton.getAttribute('data-color-inactivo'));
            });

            this.intervaloSecuencia = setInterval(() => {
                // Apagar el botón anterior
                if (indiceSecuencia > 0) {
                    this.alternarEstiloBoton(this.botones[this.secuencia[indiceSecuencia - 1]], false);
                }

                if (indiceSecuencia <= this.rondaActual) {
                    const indiceColor = this.secuencia[indiceSecuencia];

                    // Encender el actual
                    this.alternarEstiloBoton(this.botones[indiceColor], true);
                    this.reproducirSonido(indiceColor);

                    indiceSecuencia++;
                } else {
                    clearInterval(this.intervaloSecuencia);
                    this.intervaloSecuencia = null;

                    // APAGAR EL ÚLTIMO BOTÓN DE LA RONDA
                    const ultimoIndice = this.secuencia[this.rondaActual];
                    this.alternarEstiloBoton(this.botones[ultimoIndice], false);

                    this.botonesBloqueados = false;
                    this.posicionUsuario = 0;
                    this.mostrandoSecuencia = false;

                    // Iniciar el temporizador solo después de que termine de mostrar la secuencia
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
            clearTimeout(this.inactividadTimeout); // Limpia el temporizador de inactividad
            this.limpiarEstado();
            this.display.estadoJuego.textContent = 'Perdiste. Intenta de nuevo.';
            this.display.estadoJuego.style.color = 'red';
            this.display.ronda.style.display = 'none';
            this.reproducirSonido(4);
            this.display.botonEmpezar.disabled = false; // Reactivar el botón después de perder
        }

        ganarJuego() {
            this.limpiarEstado();
        
            if (window.innerWidth <= 375) {
                this.display.estadoJuego.innerHTML = '¡F E L I C I D A D E S<br>G A N A S T E!';
            } else {
                // aquí puedes poner otro mensaje si quieres
            }
        
            this.display.ronda.style.display = 'none';
            this.reproducirSonido(5);
            this.display.botonEmpezar.disabled = false; // Reactivar el botón después de ganar
        }
    }

    new Quixo();
});