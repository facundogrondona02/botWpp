const fs = require('fs');
const csv = require('csv-parser');
const { Builder, By, Key, until } = require('selenium-webdriver');

const TIEMPO_ESPERA = 20000;  // Aumentamos el tiempo de espera
const NOMBRE_GRUPO = "Curso de Actualización en Infectología en Primer Nivel de Atención 2025. Htal Tornu";

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

async function agregarNoAgendadosAlGrupo(driver, contactos) {
    console.log("🔄 Iniciando el proceso de agregar contactos NO AGENDADOS al grupo...");

    let tresPuntos = await driver.wait(until.elementLocated(By.css("button[aria-label='Menú']")), TIEMPO_ESPERA);
    await tresPuntos.click();
    await driver.sleep(2000);

    let nuevoChat = await driver.wait(until.elementLocated(By.xpath("//div[text()='Nuevo grupo']")), TIEMPO_ESPERA);
    await nuevoChat.click();
    await driver.sleep(2000);

    for (let i = 0; i < contactos.length; i++) {
        let contacto = contactos[i];
        console.log(`🔍 Buscando contacto no agendado: ${contacto.telefono}...`);

        let inputBusqueda = await driver.wait(until.elementLocated(By.css("input.copyable-text.selectable-text")), TIEMPO_ESPERA);
        await driver.sleep(500);
        await inputBusqueda.clear();
        await driver.sleep(500);
        await inputBusqueda.sendKeys(contacto.telefono);
        await driver.sleep(3000);

        try {
            let contactoElemento = await driver.wait(
                until.elementLocated(By.xpath(`//div[@role='button' and .//span[contains(text(), '${contacto.telefono}')]]`)),
                15000
            );
            console.log("📌 Contacto encontrado, seleccionándolo...");
            await contactoElemento.click();
        } catch (error) {
            console.error(`❌ No se pudo encontrar el contacto ${contacto.telefono}:`, error);
        }

        await driver.sleep(1500);
    }

    let botonSiguiente = await driver.wait(
        until.elementLocated(By.xpath("//div[@role='button' and @aria-label='Siguiente']")),
        TIEMPO_ESPERA
    );
    await botonSiguiente.click();
    await driver.sleep(1000);

    let inputNombreGrupo = await driver.wait(
        until.elementLocated(By.css("p.selectable-text.copyable-text")),
        TIEMPO_ESPERA
    );
    await inputNombreGrupo.clear();
    await inputNombreGrupo.sendKeys(NOMBRE_GRUPO, Key.RETURN);
    await driver.sleep(1000);

    console.log(`✅ Grupo "${NOMBRE_GRUPO}" creado con los contactos.`);
}

(async () => {
    let contactos = await leerContactosCSV('usuarios.csv');
    console.log("📋 Lista de contactos cargada:", contactos);

    let driver = await new Builder().forBrowser('chrome').build();
    try {
        console.log("🔄 Iniciando WhatsApp Web... Escanea el código QR.");
        await driver.get("https://web.whatsapp.com");
        await driver.sleep(15000);

        await agregarNoAgendadosAlGrupo(driver, contactos);
    } catch (error) {
        console.error("🚨 Error en el proceso:", error);
    } finally {
        await driver.quit();
        console.log("✅ Todo el proceso ha finalizado.");
    }
})();







