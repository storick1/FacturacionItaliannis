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
