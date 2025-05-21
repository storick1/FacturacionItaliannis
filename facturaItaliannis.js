const puppeteer = require('puppeteer');
const datos = require('./datos.json');

(async () => {
    const URL = "https://alsea.interfactura.com/wwwroot?opc=Italiannis"; // Asume esta URL como válida

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        slowMo: 50,
        userDataDir: './tmp'
    });

    let page;

    try{
        try {

            page = await browser.newPage();
            await page.goto(URL, { waitUntil: 'networkidle2' });
            console.log('Página cargada correctamente.');
        } catch (error) {
            console.error('Error al cargar la página:', error.message);
        }

        try {
            await page.waitForSelector('.form.billing_form.ng-valid.ng-touched.ng-dirty', { timeout: 5000 });
            console.log('El formulario cargó correctamente.');
        } catch (error) {
            console.error('El formulario no cargó:', error.message);
        }

        const delay = (time) => new Promise(resolve => setTimeout(resolve, time));
        const tecleo = async (selector, text) => {
        await page.click(selector);
        await delay(Math.flor(Math.random()* 300)+100);
        for (const char of text){
            await page.type(selector, char, { delay: Math.flor(Math.random()* 300)+100 });
            if (Math.random() > 0.5){
                await delay(Math.flor(Math.random()* 200)+200);
            }
        }
        await delay(Math.flor(Math.random()* 500)+200); 
        };

        await tecleo('#RFC', datos.rfc);
        await tecleo('#Ticket', datos.ticket);
        await tecleo('#Total', datos.total);

        const submitButton = await page.$('button[type="submit"]');
        if (submitButton){
            await submitButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }

    }catch (error) {
        console.error('Error en la ejecución:', error.message);
    }
    finally {
        if (page) {
            console.log('Cerrando la página...');
            await page.close();
        }
    };
})();

/*
MEJORAS:

 Error de sintaxis: En la función 'tecleo' se usa Math.flor() en lugar de Math.floor() lo que causará errores durante la ejecución.

 ESTRUCTURA: El código está implementado como una función auto-ejecutable anónima:
   (async () => { ... })();
   
 En su lugar, debería estar organizado como una función con nombre que pueda ser  exportada y llamada desde otros archivos:
   
   async function procesarFacturaItaliannis(datosFactura) {
     // Código aquí
     return resultado;
   }
   
   module.exports = { procesarFacturaItaliannis };

 

   
 No hay verificación del resultado (éxito/fracaso) ni devolución de información sobre lo ocurrido.

 El browser se cierra a nivel de página (page.close()) pero no se cierra el navegador completo (browser.close()).

 LOGS: Si bien hay algunos logs básicos, faltan logs detallados para cada operación importante,
 especialmente durante el proceso de llenado de datos y después de enviar el formulario. Un buen sistema de logs incluiría:
   - Timestamp en cada log
   - Información detallada de cada paso (con datos usados)
   - Logs de resultado final (éxito/fracaso)

Sugerencia de implementación:
- Convierte la función anónima auto-ejecutable en una función exportable como se indica arriba.
- Esta función debería recibir un objeto con los datos no un índice del array en datos.json.
- Debería devolver una promesa que se resuelva con el resultado de la operación.
- Esto permitiría usar el código así:
  
  const { procesarFacturaItaliannis } = require('./facturaItaliannis');
  
  procesarFacturaItaliannis({ rfc: 'XXX', ticket: '123', total: '100' })
    .then(resultado => console.log('Éxito:', resultado))
    .catch(error => console.error('Error:', error));
*/