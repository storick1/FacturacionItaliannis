const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const chalk = require('chalk');

// Activar el plugin stealth
//puppeteer.use(StealthPlugin());
puppeteerExtra.use(StealthPlugin());

function logInfo(message) {
  console.log(chalk.blue(`[${new Date().toISOString()}] [INFO] ${message}`));
}

function logWarn(message) {
  console.warn(chalk.yellow(`[${new Date().toISOString()}] [WARN] ${message}`));
}

function logError(message) {
  console.error(chalk.red(`[${new Date().toISOString()}] [ERROR] ${message}`));
}

async function procesarFacturaItaliannis(datos) {
  // Validar datos de entrada requeridos
  const camposRequeridos = ['rfc', 'ticket', 'total'];
  for (const campo of camposRequeridos) {
    if (!datos[campo]) {
      throw new Error(`El campo ${campo} es obligatorio`);
    }
  }

  let browser = null;
  let page = null;

  try {
    browser = await puppeteerExtra.launch({
      headless: false,
      defaultViewport: false,
      slowMo: datos.velocidad || 50,
      userDataDir: "/tmp",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 60000
    });

    page = await browser.newPage();

    // Configurar timeouts de navegación más largos
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(30000);

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      window.chrome = { runtime: {} };

      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-ES', 'es'],
      });

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3],
      });

      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    });

    try {
      await page.goto('https://alsea.interfactura.com/wwwroot?opc=Italiannis', {
        waitUntil: ['load', 'networkidle2'],
        timeout: 60000
      });
    } catch (navError) {
      logWarn("Tiempo de espera en navegación inicial excedido, intentando continuar...");
    }

    //Espera a que el formulario cargue con timeout ampliado
    try {
      await page.waitForSelector('form.billing_form.ng-untouched.ng-pristine.ng-valid', {
        timeout: 30000
      });
    } catch (selectorError) {
      logWarn("No se encontró el formulario, intentando continuar...");
    }

    const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

    // Función para teclear con tiempo variable y manejo de errores
    const tecleo = async (selector, text) => {
        try {
    // Esperar a que el selector sea visible
            await page.waitForSelector(selector, { visible: true, timeout: 10000 });

            const input = await page.$(selector);
            if (!input) throw new Error(`No se encontró el selector ${selector}`);

            await input.focus(); // Asegura el enfoque
            await page.evaluate(el => el.value = '', input); // Limpia el valor anterior

            for (const char of text) {
                await input.type(char, { delay: Math.floor(Math.random() * 150) + 30 });
                if (Math.random() > 0.8) {
                    await delay(Math.floor(Math.random() * 300) + 100);
                }
            }

        await delay(Math.floor(Math.random() * 500) + 200);
        } catch (inputError) {
            logError(`Error al teclear en ${selector}: ${inputError.message}`);
            throw new Error(`No se pudo ingresar texto en el campo ${selector}: ${inputError.message}`);
        }
    };


    // Completar formulario con los datos recibidos
    await tecleo('#rfc', datos.rfc);
    await tecleo('#ticket', datos.ticket);
    await tecleo('#total', datos.tienda);

    // Busqueda y clickeo del boton enviar
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();

      try {
        await page.waitForNavigation({
          timeout: 60000,
          waitUntil: ['load', 'networkidle2']
        });
      } catch (navError) {
        logWarn("Tiempo de espera en navegación excedido, intentando continuar...");
      }

      // Esperar un poco más en caso de que la página esté cargando lentamente
      await delay(5000);
    }

    // Capturar información relevante de la página de resultado
    const resultado = {
      exito: true,
      mensaje: 'Factura procesada correctamente'
    };

    return resultado;

  } catch (error) {
    logError("Error durante el proceso:", error);

    // Intentar tomar una captura de pantalla del error si es posible
    try {
      if (page) {
        // Obtener fecha y hora actual
        const now = new Date();
        const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const hora = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

        const screenshotsDir = `./screenshotsErrores/${fecha}`;
        const screenshotPath = `${screenshotsDir}/error-${hora}.png`;

        await page.screenshot({ path: screenshotPath });
        logInfo(`Captura de pantalla del error guardada como: ${screenshotPath}`);
      }
    } catch (screenshotError) {
      logError("No se pudo capturar pantalla:", screenshotError.message);
    }

    return {
      exito: false,
      error: error.message,
      detalle: error.stack
    };
  } finally {
    // Asegurarnos que cerramos correctamente el navegador incluso si hay errores
    try {
      if (browser) {
        await browser.close();
      }
    } catch (closeError) {
      logError("Error al cerrar el navegador:", closeError.message);
    }
  }
}

// Exportamos la función para que pueda ser importada desde otros archivos
module.exports = procesarFacturaItaliannis;