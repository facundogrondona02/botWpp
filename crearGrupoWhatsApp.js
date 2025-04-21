// const fs = require('fs');
// const csv = require('csv-parser');
// const { Builder, By, Key, until } = require('selenium-webdriver');

// const TIEMPO_ESPERA =40000;  // Tiempo de espera (ajústalo si es necesario)
// const NOMBRE_GRUPO = "Curso de Actualización en Infectología en Primer Nivel de Atención 2025. Htal Tornu";

// // Función para formatear el teléfono al formato que muestra WhatsApp (ajusta si es necesario)
// function formatearTelefonoWhatsApp(phone) {
//     // Ejemplo: phone = "5491167139339"
//     const countryCode = phone.substring(0, 2);  // "54"
//     const nine        = phone.substring(2, 3);    // "9"
//     const area        = phone.substring(3, 5);    // "11"
//     const firstPart   = phone.substring(5, 9);    // "6713"
//     const secondPart  = phone.substring(9);       // "9339"
//     // Ajusta espacios/guiones según se vea en WhatsApp
//     return `+${countryCode} ${nine} ${area} ${firstPart}-${secondPart}`;
// }

// // Función para leer contactos desde un archivo CSV
// async function leerContactosCSV(archivo) {
//     return new Promise((resolve, reject) => {
//         const contactos = [];
//         fs.createReadStream(archivo)
//             .pipe(csv())
//             .on('data', (fila) => {
//                 let telefonoLimpio = fila.Teléfono.replace(/\D/g, '');
//                 contactos.push({ nombre: fila.Nombre, telefono: `549${telefonoLimpio}` });
//             })
//             .on('end', () => resolve(contactos))
//             .on('error', (error) => reject(error));
//     });
// }

// // Función genérica para interactuar con un elemento (con reintentos)
// async function interactuarConElemento(driver, xpath, accion, reintentos = 2) {
//     let intento = 0;
//     while (intento < reintentos) {
//         try {
//             let elemento = await driver.wait(until.elementLocated(By.xpath(xpath)), TIEMPO_ESPERA);
//             await driver.wait(until.elementIsVisible(elemento), TIEMPO_ESPERA);
//             await driver.wait(until.elementIsEnabled(elemento), TIEMPO_ESPERA);
//             if (accion === "click") {
//                 await driver.executeScript("arguments[0].click();", elemento);
//             } else if (accion === "sendKeys") {
//                 await elemento.sendKeys(Key.RETURN);
//             }
//             return; // Salir si todo sale bien
//         } catch (error) {
//             console.error(`❌ Error al interactuar con ${xpath} en intento ${intento + 1}:`, error);
//             intento++;
//             await driver.sleep(3000); // Esperar 2 segundos antes de reintentar
//         }
//     }
//     console.error(`❌ No se pudo interactuar con el elemento: ${xpath} tras ${reintentos} intentos.`);
// }

// // Función para agregar los contactos (agendados o no) a un grupo de WhatsApp
// async function agregarAlGrupo(driver, contactos) {
//     console.log("🔄 Iniciando el proceso de agregar contactos al grupo...");

//     // Abrir el menú y seleccionar "Nuevo grupo"
//     let tresPuntos = await driver.wait(until.elementLocated(By.css("button[aria-label='Menú']")), TIEMPO_ESPERA);
//     await tresPuntos.click();
//     await driver.sleep(3000);

//     let nuevoGrupo = await driver.wait(until.elementLocated(By.xpath("//div[text()='Nuevo grupo']")), TIEMPO_ESPERA);
//     await nuevoGrupo.click();
//     await driver.sleep(3000);

//     // Iterar cada contacto
//     for (let contacto of contactos) {
//         console.log(`🔍 Buscando contacto: ${contacto.nombre} (${contacto.telefono})...`);
//         let inputBusqueda = await driver.wait(until.elementLocated(By.css("input.copyable-text.selectable-text")), TIEMPO_ESPERA);
//         // Aseguramos que el input esté listo para interactuar
//         await driver.executeScript("arguments[0].focus();", inputBusqueda);
//         await driver.sleep(3000);
//         await inputBusqueda.clear();
//         await driver.sleep(3000);
//         await inputBusqueda.sendKeys(contacto.telefono, Key.RETURN);
//         await driver.sleep(3000);

//         let contactoElemento = null;
//         // Primero, se intenta buscar por teléfono (para contactos no agendados)
//         try {
//             let numeroWhatsApp = formatearTelefonoWhatsApp(contacto.telefono);
//             let xpathTelefono = `//span[contains(text(), '${numeroWhatsApp}')]/ancestor::div[@role='button']`;
//             contactoElemento = await driver.wait(until.elementLocated(By.xpath(xpathTelefono)), 10000);
//             await driver.wait(until.elementIsVisible(contactoElemento), 8000);
//             await driver.wait(until.elementIsEnabled(contactoElemento), 8000);
//             console.log("📌 Contacto encontrado por teléfono, seleccionándolo...");
//             await driver.executeScript("arguments[0].click();", contactoElemento);
//         } catch (error) {
//             console.error(`❌ No se encontró el contacto por teléfono ${contacto.telefono}:`, error);
//             // Si falla la búsqueda por teléfono, se intenta buscar por nombre (para contactos agendados)
//             try {
//                 // Puedes ajustar qué parte del nombre usar (por ejemplo, la última palabra)
//                 let palabraClave = contacto.nombre.split(' ').pop();
//                 let xpathNombre = `//div[@role='button'][.//span[contains(text(), '${palabraClave}')]]`;
//                 contactoElemento = await driver.wait(until.elementLocated(By.xpath(xpathNombre)), 8000  );
//                 await driver.wait(until.elementIsVisible(contactoElemento), 8000);
//                 await driver.wait(until.elementIsEnabled(contactoElemento), 8000);
//                 console.log("📌 Contacto encontrado por nombre, seleccionándolo...");
//                 await driver.executeScript("arguments[0].click();", contactoElemento);
//             } catch (error) {
//                 console.error(`❌ No se pudo encontrar el contacto ${contacto.nombre} ni por teléfono ni por nombre:`, error);
//             }
//         }
//         await driver.sleep(3000); // Pequeña pausa antes de buscar el siguiente
//     }

//     // Pulsar el botón "Siguiente"
//     let botonSiguiente = await driver.wait(until.elementLocated(By.xpath("//div[@role='button' and @aria-label='Siguiente']")), 2000);
//     await botonSiguiente.click();
//     await driver.sleep(1000);

//     // Escribir el nombre del grupo
//     let inputNombreGrupo = await driver.wait(
//         until.elementLocated(By.css("p.selectable-text.copyable-text.x15bjb6t.x1n2onr6")),
//         TIEMPO_ESPERA
//     );
//     await inputNombreGrupo.clear();
//     await inputNombreGrupo.sendKeys(NOMBRE_GRUPO, Key.RETURN);
//     await driver.sleep(2000);

//     console.log(`✅ Grupo "${NOMBRE_GRUPO}" creado con los contactos.`);
// }

// // Función principal
// (async () => {
//     let contactos = await leerContactosCSV('usuarios.csv');
//     console.log("📋 Lista de contactos cargada:", contactos);

//     let driver = await new Builder().forBrowser('chrome').build();
//     try {
//         console.log("🔄 Iniciando WhatsApp Web... Escanea el código QR.");
//         await driver.get("https://web.whatsapp.com");
//         await driver.sleep(15000);  // Tiempo para escanear el QR

//         // Agregar contactos al grupo (tanto agendados como no agendados)
//         await agregarAlGrupo(driver, contactos);

//     } catch (error) {
//         console.error("🚨 Error en el proceso:", error);
//     } finally {
//         await driver.quit();
//         console.log("✅ Todo el proceso ha finalizado.");
//     }
// })();
const fs = require('fs');
const csv = require('csv-parser');
const { Builder, By, Key, until } = require('selenium-webdriver');

const TIEMPO_ESPERA = 30000;
const NOMBRE_GRUPO = "Curso de Actualización en Infectología en Primer Nivel de Atención 2025. Htal Tornu";

function formatearTelefonoWhatsApp(phone) {
    const countryCode = phone.substring(0, 2);
    const nine = phone.substring(2, 3);
    const area = phone.substring(3, 5);
    const firstPart = phone.substring(5, 9);
    const secondPart = phone.substring(9);
    return `+${countryCode} ${nine} ${area} ${firstPart}-${secondPart}`;
}
async function leerContactosCSV(archivo) {
    return new Promise((resolve, reject) => {
        const contactos = [];
        fs.createReadStream(archivo)
            .pipe(csv())
            .on('data', (fila) => {
                // Verifica que las claves esperadas existan
                if (fila.Nombre && fila.Teléfono) {
                    let telefonoLimpio = fila.Teléfono.replace(/\D/g, '');
                    contactos.push({ nombre: fila.Nombre.trim(), telefono: `549${telefonoLimpio}` });
                } else {
                    console.error('Fila con datos inválidos:', fila);
                }
            })
            .on('end', () => resolve(contactos))
            .on('error', (error) => reject(error));
    });
}

async function interactuarConElemento(driver, xpath, accion, reintentos = 2) {
    let intento = 0;
    while (intento < reintentos) {
        try {
            let elemento = await driver.wait(until.elementLocated(By.xpath(xpath)), TIEMPO_ESPERA);
            await driver.wait(until.elementIsVisible(elemento), TIEMPO_ESPERA);
            await driver.wait(until.elementIsEnabled(elemento), TIEMPO_ESPERA);
            if (accion === "click") {
                await driver.executeScript("arguments[0].click();", elemento);
            } else if (accion === "sendKeys") {
                await elemento.sendKeys(Key.RETURN);
            }
            return;
        } catch (error) {
            console.error(`❌ Error en intento ${intento + 1} con ${xpath}:`, error);
            intento++;
            await driver.sleep(3000);
        }
    }
    console.error(`❌ No se pudo interactuar con el elemento: ${xpath}`);
}
async function agregarAlGrupo(driver, contactos) {
    console.log("🔄 Iniciando el proceso de agregar contactos al grupo...");
    await interactuarConElemento(driver, "//button[@aria-label='Menú']", "click");
    await driver.sleep(3000);
    await interactuarConElemento(driver, "//div[text()='Nuevo grupo']", "click");
    await driver.sleep(3000);

    for (let contacto of contactos) {
        console.log(`🔍 Buscando contacto: ${contacto.nombre} (${contacto.telefono})...`);
        let inputBusqueda = await driver.wait(until.elementLocated(By.css("input.copyable-text.selectable-text")), TIEMPO_ESPERA);
        await driver.executeScript("arguments[0].focus();", inputBusqueda);
        await driver.sleep(3000);
        await inputBusqueda.clear();
        await driver.sleep(3000);
        await inputBusqueda.sendKeys(contacto.telefono, Key.RETURN);
        await driver.sleep(3000);

        let contactoElemento = null;
        try {
            let numeroWhatsApp = formatearTelefonoWhatsApp(contacto.telefono);
            let xpathTelefono = `//span[contains(text(), '${numeroWhatsApp}')]/ancestor::div[@role='button']`;
            contactoElemento = await driver.wait(until.elementLocated(By.xpath(xpathTelefono)), 10000);
            await driver.executeScript("arguments[0].click();", contactoElemento);
        } catch (error) {
            console.error(`❌ No se encontró por teléfono ${contacto.telefono}, buscando por nombre...`);
            try {
                let palabraClave = contacto.nombre.split(' ').pop();
                let xpathNombre = `//div[@role='button'][.//span[contains(text(), '${palabraClave}')]]`;
                contactoElemento = await driver.wait(until.elementLocated(By.xpath(xpathNombre)), 8000);
                await driver.executeScript("arguments[0].click();", contactoElemento);
            } catch (error) {
                console.error(`❌ No se pudo encontrar ${contacto.nombre} ni por teléfono ni por nombre.`);
            }
        }
        await driver.sleep(3000);
    }

    await interactuarConElemento(driver, "//div[@role='button' and @aria-label='Siguiente']", "click");
    await driver.sleep(1000);

    let inputNombreGrupo = await driver.wait(
        until.elementLocated(By.css("p.selectable-text.copyable-text.x15bjb6t.x1n2onr6")),
        TIEMPO_ESPERA
    );
    await inputNombreGrupo.clear();
    await inputNombreGrupo.sendKeys(NOMBRE_GRUPO);
    await driver.sleep(2000);
    
    console.log("✅ Todos los contactos han sido seleccionados y el nombre del grupo ha sido ingresado.");
    console.log("⏳ Ahora debes hacer clic manualmente en 'Crear grupo'.");
    console.log("🔵 El proceso se ha detenido. WhatsApp Web permanecerá abierto hasta que cierres el navegador manualmente.");
    await driver.wait(new Promise(() => {})); // Mantener el proceso abierto indefinidamente
}

(async () => {
    let contactos = await leerContactosCSV('usuarios.csv');
    console.log("📋 Lista de contactos cargada:", contactos);
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        console.log("🔄 Iniciando WhatsApp Web... Escanea el código QR.");
        await driver.get("https://web.whatsapp.com");
        await driver.sleep(15000);
        await agregarAlGrupo(driver, contactos);
    } catch (error) {
        console.error("🚨 Error en el proceso:", error);
    } finally {
        await driver.quit();
        console.log("✅ Todo el proceso ha finalizado.");
    }
})();