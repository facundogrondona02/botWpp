// const fs = require('fs');
// const csv = require('csv-parser');
// const { Builder, By, Key, until } = require('selenium-webdriver');

// async function leerContactosCSV(archivo) {
//     return new Promise((resolve, reject) => {
//         const contactos = [];
//         fs.createReadStream(archivo)
//             .pipe(csv())
//             .on('data', (fila) => contactos.push(fila))
//             .on('end', () => resolve(contactos))
//             .on('error', (error) => reject(error));
//     });
// }

// async function crearGrupoWhatsApp(contactos) {
//     let driver = await new Builder().forBrowser('chrome').build();

//     try {
//         // 1️⃣ Abrir WhatsApp Web
//         await driver.get('https://web.whatsapp.com');
//         console.log('Escanea el código QR en WhatsApp Web y presiona Enter aquí...');
//         await new Promise(resolve => process.stdin.once('data', resolve));

//         // Verificar el título de la página
//         let title = await driver.getTitle();
//         console.log("Título de la página:", title);

//         // Esperar hasta que el título de la página sea "WhatsApp"
//         await driver.wait(until.titleIs('WhatsApp'), 60000); // 60 segundos

//         // 2️⃣ Hacer clic en los tres puntos (menú) usando el nuevo selector
//         let tresPuntos;
//         try {
//             tresPuntos = await driver.wait(until.elementLocated(By.css("button[aria-label='Menú']")), 30000); // 30 segundos
//             console.log("Menú de tres puntos encontrado.");
//             await tresPuntos.click();
//         } catch (error) {
//             console.log("No se encontró el menú de tres puntos", error);
//             return; // Salir si no se encuentra el menú
//         }

//         // 3️⃣ Iniciar la creación de un grupo
//         let nuevoGrupo;
//         try {
//             nuevoGrupo = await driver.wait(until.elementLocated(By.xpath("//div[text()='Nuevo grupo']")), 5000); // 5 segundos
//             await nuevoGrupo.click();
//         } catch (error) {
//             console.log("No se encontró el botón de nuevo grupo", error);
//             return; // Salir si no se encuentra el elemento
//         }

//         // 4️⃣ Agregar contactos
//         for (let contacto of contactos) {
//             let inputBusqueda = await driver.findElement(By.xpath("//div[@title='Escribe un nombre o número de teléfono']"));
//             await inputBusqueda.sendKeys(contacto.telefono, Key.RETURN);
//             await driver.sleep(1000);

//             try {
//                 let primerResultado = await driver.wait(until.elementLocated(By.xpath("//span[contains(@class, 'emoji-text')]")), 3000); // Esperar hasta 3 segundos
//                 await primerResultado.click();
//             } catch (error) {
//                 console.log(`❌ No se encontró el número: ${contacto.telefono}`);
//             }
//         }

//         // 5️⃣ Confirmar el grupo
//         let botonSiguiente;
//         try {
//             botonSiguiente = await driver.findElement(By.xpath("//span[contains(text(),'Siguiente')]"));
//             await botonSiguiente.click();
//             await driver.sleep(1000);
//         } catch (error) {
//             console.log("No se encontró el botón 'Siguiente'", error);
//             return; // Salir si no se encuentra el elemento
//         }

//         // 6️⃣ Asignar nombre al grupo y crear
//         let inputNombreGrupo = await driver.findElement(By.css("div[title='Asunto del grupo']"));
//         await inputNombreGrupo.sendKeys('Mi Grupo Automático', Key.RETURN);
//         await driver.sleep(2000);

//         let botonCrear;
//         try {
//             botonCrear = await driver.findElement(By.xpath("//span[contains(text(),'Crear')]"));
//             await botonCrear.click();
//         } catch (error) {
//             console.log("No se encontró el botón 'Crear'", error);
//             return; // Salir si no se encuentra el elemento
//         }

//         console.log('✅ Grupo de WhatsApp creado con éxito.');

//     } catch (error) {
//         console.error('Error al crear el grupo:', error);
//     } finally {
//         // Cerrar el navegador después de 5 segundos
//         await driver.sleep(5000);
//         await driver.quit();
//     }
// }

// (async () => {
//     let contactos = await leerContactosCSV('usuarios.csv');
//     await crearGrupoWhatsApp(contactos);
// })();

const fs = require('fs');
const csv = require('csv-parser');
const { Builder, By, Key, until } = require('selenium-webdriver');

const TIEMPO_ESPERA = 20000;  // Aumentamos el tiempo de espera
const NOMBRE_GRUPO = "Mi Nuevo Grupo";

async function leerContactosCSV(archivo) {
    return new Promise((resolve, reject) => {
        const contactos = [];
        fs.createReadStream(archivo)
            .pipe(csv())
            .on('data', (fila) => {
                let telefonoLimpio = fila.Teléfono.replace(/\D/g, '');
                contactos.push({ nombre: fila.Nombre, telefono: `549${telefonoLimpio}` });
            })
            .on('end', () => resolve(contactos))
            .on('error', (error) => reject(error));
    });
}

async function enviarMensajes(driver, contactos) {
    for (let contacto of contactos) {
        let url = `https://web.whatsapp.com/send/?phone=${contacto.telefono}&text&type=phone_number&app_absent=0`;
        console.log(`🔍 Abriendo chat con ${contacto.nombre} (${contacto.telefono})...`);

        await driver.get(url);
        await driver.sleep(TIEMPO_ESPERA);  // Espera adicional por si tarda en cargar

        try {
            let inputChat = await driver.wait(until.elementLocated(By.css('div[aria-label="Escribe un mensaje"]')), TIEMPO_ESPERA);
            let mensaje = `Hola ${contacto.nombre}, este mensaje te lo envia un bot que estoy creando para automatizar difusiones de mensajes a gran escala.`;
            await inputChat.sendKeys(mensaje, Key.RETURN);
            console.log(`✅ Mensaje enviado a ${contacto.nombre}`);
        } catch (error) {
            console.log(`❌ No se pudo enviar mensaje a ${contacto.nombre}:`, error);
        }

        await driver.sleep(3000); // Esperar antes de pasar al siguiente
    }
}

async function agregarAlGrupo(driver, contactos) {
    console.log("🔄 Iniciando el proceso de agregar contactos al grupo...");

    // Ir a los tres puntos (menú)
    let tresPuntos = await driver.wait(until.elementLocated(By.css("button[aria-label='Menú']")), TIEMPO_ESPERA);
    await tresPuntos.click();
    await driver.sleep(2000); // Esperar la apertura del menú

    // Seleccionar "Nuevo chat"
    let nuevoChat = await driver.wait(until.elementLocated(By.xpath("//div[@title='Nuevo grupo']")), TIEMPO_ESPERA);
    await nuevoChat.click();
    await driver.sleep(2000); // Esperar que se abra el campo de búsqueda

    // Buscar y agregar a los contactos al grupo
    for (let contacto of contactos) {
        console.log(`🔍 Buscando contacto ${contacto.nombre}...`);

        // Buscar al contacto por teléfono
        let inputBusqueda = await driver.wait(until.elementLocated(By.xpath("//div[@title='Escribe un nombre o número de teléfono']")), TIEMPO_ESPERA);
        await inputBusqueda.clear(); // Limpiar el campo de búsqueda
        await inputBusqueda.sendKeys(contacto.telefono, Key.RETURN);
        await driver.sleep(2000); // Esperar que aparezca el contacto

        try {
            // Seleccionar el primer resultado
            let primerResultado = await driver.wait(until.elementLocated(By.xpath("//span[contains(@class, 'emoji-text')]")), 5000);
            await primerResultado.click();
            console.log(`✅ Contacto ${contacto.nombre} encontrado y seleccionado.`);
        } catch (error) {
            console.log(`❌ No se encontró el contacto: ${contacto.nombre}`);
            continue; // Continuar con el siguiente contacto si no se encuentra
        }
    }

    // Crear el grupo
    let botonSiguiente = await driver.wait(until.elementLocated(By.xpath("//span[contains(text(),'Siguiente')]")), TIEMPO_ESPERA);
    await botonSiguiente.click();
    await driver.sleep(1000);

    // Confirmar el nombre del grupo
    let inputNombreGrupo = await driver.wait(until.elementLocated(By.css("div[title='Asunto del grupo']")), TIEMPO_ESPERA);
    await inputNombreGrupo.clear();  // Limpiar el campo de nombre
    await inputNombreGrupo.sendKeys(NOMBRE_GRUPO, Key.RETURN);
    await driver.sleep(1000);

    let botonCrear = await driver.wait(until.elementLocated(By.xpath("//span[contains(text(),'Crear')]")), TIEMPO_ESPERA);
    await botonCrear.click();
    console.log(`✅ Grupo ${NOMBRE_GRUPO} creado con los contactos.`);
}

(async () => {
    let contactos = await leerContactosCSV('usuarios.csv');
    console.log("📋 Lista de contactos cargada:", contactos);

    let driver = await new Builder().forBrowser('chrome').build();
    try {
        console.log("🔄 Iniciando WhatsApp Web... Escanea el código QR.");
        await driver.get("https://web.whatsapp.com");
        await driver.sleep(15000);  // Tiempo para escanear QR

        // Paso 1: Enviar los mensajes
        await enviarMensajes(driver, contactos);

        // Paso 2: Agregar los contactos al grupo
        await agregarAlGrupo(driver, contactos);

    } catch (error) {
        console.error("🚨 Error en el proceso:", error);
    } finally {
        await driver.quit();
        console.log("✅ Todo el proceso ha finalizado.");
    }
})();

//         // 1️⃣ Abrir WhatsApp Web
//         await driver.get('https://web.whatsapp.com');
//         console.log('Escanea el código QR en WhatsApp Web y presiona Enter aquí...');
//         await new Promise(resolve => process.stdin.once('data', resolve));

//         // Verificar el título de la página
//         let title = await driver.getTitle();
//         console.log("Título de la página:", title);

//         // Esperar hasta que el título de la página sea "WhatsApp"
//         await driver.wait(until.titleIs('WhatsApp'), 60000); // 60 segundos

//         // 2️⃣ Hacer clic en los tres puntos (menú) usando el nuevo selector
//         let tresPuntos;
//         try {
//             tresPuntos = await driver.wait(until.elementLocated(By.css("button[aria-label='Menú']")), 30000); // 30 segundos
//             console.log("Menú de tres puntos encontrado.");
//             await tresPuntos.click();
//         } catch (error) {
//             console.log("No se encontró el menú de tres puntos", error);
//             return; // Salir si no se encuentra el menú
//         }

//         // 3️⃣ Iniciar la creación de un grupo
//         let nuevoGrupo;
//         try {
//             nuevoGrupo = await driver.wait(until.elementLocated(By.xpath("//div[text()='Nuevo grupo']")), 5000); // 5 segundos
//             await nuevoGrupo.click();
//         } catch (error) {
//             console.log("No se encontró el botón de nuevo grupo", error);
//             return; // Salir si no se encuentra el elemento
//         }

//         // 4️⃣ Agregar contactos
//         for (let contacto of contactos) {
//             let inputBusqueda = await driver.findElement(By.xpath("//div[@title='Escribe un nombre o número de teléfono']"));
//             await inputBusqueda.sendKeys(contacto.telefono, Key.RETURN);
//             await driver.sleep(1000);

//             try {
//                 let primerResultado = await driver.wait(until.elementLocated(By.xpath("//span[contains(@class, 'emoji-text')]")), 3000); // Esperar hasta 3 segundos
//                 await primerResultado.click();
//             } catch (error) {
//                 console.log(`❌ No se encontró el número: ${contacto.telefono}`);
//             }
//         }

//         // 5️⃣ Confirmar el grupo
//         let botonSiguiente;
//         try {
//             botonSiguiente = await driver.findElement(By.xpath("//span[contains(text(),'Siguiente')]"));
//             await botonSiguiente.click();
//             await driver.sleep(1000);
//         } catch (error) {
//             console.log("No se encontró el botón 'Siguiente'", error);
//             return; // Salir si no se encuentra el elemento
//         }

//         // 6️⃣ Asignar nombre al grupo y crear
//         let inputNombreGrupo = await driver.findElement(By.css("div[title='Asunto del grupo']"));
//         await inputNombreGrupo.sendKeys('Mi Grupo Automático', Key.RETURN);
//         await driver.sleep(2000);

//         let botonCrear;
//         try {
//             botonCrear = await driver.findElement(By.xpath("//span[contains(text(),'Crear')]"));
//             await botonCrear.click();
//         } catch (error) {
//             console.log("No se encontró el botón 'Crear'", error);
//             return; // Salir si no se encuentra el elemento
//         }

//         console.log('✅ Grupo de WhatsApp creado con éxito.');
