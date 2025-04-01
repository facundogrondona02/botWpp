const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ruta del archivo Excel (ajusta el nombre y la ruta según corresponda)
const excelFile = path.join(__dirname, 'formInscripcion.xlsx');

// Lee el archivo Excel
const workbook = XLSX.readFile(excelFile);

// Selecciona la primera hoja (o la que necesites)
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convierte la hoja a un array de objetos
const jsonData = XLSX.utils.sheet_to_json(worksheet);

// Filtra y transforma los datos para obtener solo los campos deseados.
// Ajusta los nombres de las columnas según cómo aparecen en tu Excel.
const usuarios = jsonData.map(record => {
  // Concatenar nombre y apellido
  const nombreCompleto = record['Nombre:'] + (record['Apellido:'] ? ` ${record['Apellido:']}` : '');

  return {
    nombre: nombreCompleto,
    telefono: record['Teléfono celular de contacto:'] // Ajusta el nombre de la columna exactamente como aparece en Excel
  };
});

// Ruta y nombre del archivo CSV de salida
const outputPath = path.join(__dirname, 'usuarios.csv');

// Convertir el array de objetos a formato CSV
const csvData = [
  'Nombre,Teléfono', // Encabezados
  ...usuarios.map(u => `"${u.nombre}","${u.telefono}"`) // Datos con comillas para evitar problemas con comas
].join('\n');

// Escribir el archivo CSV
fs.writeFileSync(outputPath, csvData, 'utf8');

console.log("✅ Datos exportados a 'usuarios.csv' exitosamente.");
