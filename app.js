const telegram = require('node-telegram-bot-api');
const Token = '818228947:AAEkATPkc1w_iY8b8df3_eUVBY_p0GX0u08';
const ImgDir= "./public/img";
const https = require('https');
const fs = require('fs');

// Quagga (barcode scanner)
const Quagga = require('quagga').default; 
// QR Code
var QrCode = require('qrcode-reader');
var qr = new QrCode();

qr.callback = function(error, result) {
  if(error) {
    console.log(error)
    return;
  }
  console.log(result)
}

const bot = new telegram(Token,
    { polling: true }
);

bot.onText(/\/start/, async(start) => 
{
  await bot.sendMessage(start.chat.id, "Benvenuti in Scan It");
  await bot.sendMessage(start.chat.id, "Scan It è un bot che ti permette di creare e decodificare vari tipi di barcode e di qr code");
  await bot.sendMessage(start.chat.id, "Per decodificare un barcode basta scrivere /scanbarcode e inviare una foto");
  await bot.sendMessage(start.chat.id, "Per creare un barcode basta scrivere /creabarcode e inviare una foto");
  await bot.sendMessage(start.chat.id, "Per decodificare un qr code basta scrivere /scanqr e inviare una foto");
  await bot.sendMessage(start.chat.id, "Per creare un barcode basta scrivere /creaqr e inviare una foto");
  await bot.sendMessage(start.chat.id, "Enjoy.");
});

bot.onText(/\/creabarcode/, (creabarcode) => 
{
  bot.sendMessage(creabarcode.chat.id,"Inserire il valore del barcode");
      bot.once('message', (barcodevalue) => 
      {
        var file = fs.createWriteStream("./public/file.jpg");
        bot.sendMessage(barcodevalue.chat.id,"Generazione barcode in corso");
        request = https.get("https://barcode.tec-it.com/barcode.ashx?data=" + barcodevalue.text.toUpperCase().toString() + "&code=Code93&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0' alt='Barcode Generator TEC-IT",
        function(response) 
        {
        response.pipe(file)
        bot.sendPhoto(barcodevalue.chat.id,"./public/file.jpg");
        });
      });
});

bot.onText(/\/scanbarcode/, (scanbarcode) => 
{
  bot.sendMessage(scanbarcode.chat.id,"Invia la foto del barcode per decodificarlo.");
  bot.once('photo', function(msgPh) // Ricezione Foto
  {
    var photoId = msgPh.photo[msgPh.photo.length-1].file_id;

    // Scarica la foto ricevuta
    var path = bot.downloadFile(photoId, ImgDir).then(async function (path) 
    {
      console.log(path);
      await bot.sendMessage(msgPh.chat.id,"Decodifico....");
      Quagga.decodeSingle(
      {
        src: path,
        numOfWorkers: 0,  
        inputStream: {
        size: 800  
        },
        decoder: { // Lista barcode scannerizzabili
            readers: ["code_128_reader","ean_reader","code_39_reader","codabar_reader","upc_reader","upc_e_reader","i2of5_reader","2of5_reader","code_93_reader"],
        },
       }, 
       function(result) 
       {
        if(result.codeResult) 
        {
          bot.sendMessage(scanbarcode.chat.id,result.codeResult.code);
            // console.log("result", result.codeResult.code);
        } 
        else 
        {
          bot.sendMessage(scanbarcode.chat.id,"Prova ad inviare una foto migliore!");
            // console.log("not detected");
         } 
       });
    });
  });
});

bot.onText(/\/creaqr/, (creaqr) => 
{
  bot.sendMessage(creaqr.chat.id,"Inserire il valore del qrcode");
      bot.once('message', (qrcodevalue) => 
      {
        let __file = fs.createWriteStream("./public/file.jpg");
        bot.sendMessage(qrcodevalue.chat.id,"Generazione qrcode in corso");
        request = https.get("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + qrcodevalue.text.toUpperCase().toString(),
        response => {
          response.pipe(__file);
          bot.sendPhoto(qrcodevalue.chat.id,"./public/file.jpg");
        });       
      });
});

bot.onText(/\/scanqr/, (scanqr) => 
{
  bot.sendMessage(scanqr.chat.id,"Invia la foto del qr code per decodificarlo.");
  bot.once('photo', function(msgPh) 
  {
    var photoId = msgPh.photo[msgPh.photo.length-1].file_id;
    // Scarica la foto ricevuta
    var path = bot.downloadFile(photoId, ImgDir).then(async function (path) 
    {
      await bot.sendMessage(msgPh.chat.id,"Decodifico....");
      var Jimp = require("jimp");
      var buffer = fs.readFileSync(path);
      Jimp.read(buffer, function(err, image) 
      {
        if (err) 
        {
          console.error(err);
        }
        var qr = new QrCode();
        qr.callback = function(err, value) 
        {
          if (err) 
          {
            bot.sendMessage(scanqr.chat.id,"Prova ad inviare una foto migliore!");
            console.error(err);
          }
          else
          {
            bot.sendMessage(scanqr.chat.id,"QR decodficato:");
            bot.sendMessage(scanqr.chat.id,value.result);
            console.log(value.result);
            console.log(value);
          }
        };
        qr.decode(image.bitmap);
      });
    });
  });
});