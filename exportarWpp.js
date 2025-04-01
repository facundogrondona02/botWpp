const puppeteer = require('puppeteer');
const XLSX = require('xlsx');
const fs = require('fs');

// Leer archivo Excel y extraer números
const workbook = XLSX.readFile('contactos.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

// Extraer números de teléfono (deben estar guardados en el celular con WhatsApp)
const contactos = jsonData.map(contacto => contacto["Teléfono"] || contacto["Número"] || '').filter(num => num);

// Función para crear el grupo en WhatsApp Web
async function crearGrupoWhatsApp() {
    const browser = await puppeteer.launch({ headless: false }); // Abre Chrome visible
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/'); // Abre WhatsApp Web
    console.log("Escanea el código QR para iniciar sesión...");

    // Esperar a que cargue la sesión
    await page.waitForSelector('._3uIPm', { timeout: 60000 }); 
    console.log("Sesión iniciada en WhatsApp Web.");

    // Hacer clic en "Nuevo Chat"
    await page.click('span[data-testid="chat"]');

    // Esperar y hacer clic en "Nuevo grupo"
    await page.waitForSelector('span[data-testid="menu"]', { timeout: 5000 });
    await page.click('span[data-testid="menu"]');

    await page.waitForSelector('div[title="Nuevo grupo"]', { timeout: 5000 });
    await page.click('div[title="Nuevo grupo"]');

    // Agregar contactos al grupo
    for (let contacto of contactos) {
        console.log(`Agregando: ${contacto}`);
        await page.type('._3uIPm input', contacto);
        await page.waitForTimeout(1000); // Esperar a que aparezca el contacto
        await page.keyboard.press('Enter'); // Seleccionarlo
    }

    // Hacer clic en el botón "Siguiente"
    await page.click('div[role="button"][tabindex="0"]');

    // Asignar un nombre al grupo
    await page.waitForSelector('div[contenteditable="true"]', { timeout: 5000 });
    await page.type('div[contenteditable="true"]', 'Grupo Automático');

    // Confirmar la creación del grupo
    await page.click('div[role="button"][tabindex="0"]');

    console.log("Grupo creado con éxito 🎉");
    await browser.close();
}

// Ejecutar el script
crearGrupoWhatsApp();
