const { default: puppeteerExtra } = require('puppeteer-extra');
const procesarFacturaItaliannis = require('./facturaItaliannis');
const chalk = require('chalk'); 

function logInfo(...args) {
  console.log(chalk.blue(`[${new Date().toISOString()}] [INFO]`), ...args);
}

function logWarn(...args) {
  console.warn(chalk.yellow(`[${new Date().toISOString()}] [WARN]`), ...args);
}

function logError(...args) {
  console.error(chalk.red(`[${new Date().toISOString()}] [ERROR]`), ...args);
}


// Configuración de datos para la factura
const datosDeLaFactura = {
  rfc: 'HH010580P',
  ticket: '012345678',
  total: '209.99'
};


// Función principal que ejecuta el proceso
async function ejecutarProceso() {
  logInfo("Iniciando proceso de facturación");
  logInfo("Datos a procesar:", datosDeLaFactura);
  
  try {
    // Llamamos a la función y esperamos el resultado
    const resultado = await procesarFacturaItaliannis(datosDeLaFactura);
    
    // Procesamos el resultado
    if (resultado.exito) {

      logInfo("Factura procesada correctamente");
      logInfo("Detalles", resultado);
    } else {
      logError("Error al procesar la factura");
      logError("Mensaje de error:", resultado.error);
      logError("Detalles:", resultado);
    }
    
    return resultado;
  } catch (error) {
    logError("Ocurrió un error grave durante el proceso:");
    logError(error);
    process.exit(1); // Salir con error
  }
}

// Si este archivo se ejecuta directamente (no es importado)
if (require.main === module) {
  // Notificamos el inicio del proceso
  console.log('='.repeat(50));
  console.log(' SISTEMA DE FACTURACIÓN DOMINO\'S PIZZA');
  console.log('='.repeat(50));
  console.log(`[${new Date().toISOString()}]`);
  
  // Ejecutamos el proceso principal
  ejecutarProceso()
    .then(resultado => {
      // Terminamos el proceso correctamente
      if (resultado.exito) {
        process.exit(0); // Salir sin error
      } else {
        process.exit(1); // Salir con error
      }
    })
    .catch(error => {
      logError("Error inesperado:", error);
      process.exit(1); // Salir con error
    });
}

// También exportamos la función principal para poder usarla desde otros archivos
module.exports = ejecutarProceso;
