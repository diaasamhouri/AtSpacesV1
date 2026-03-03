const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {};
pdfExtract.extract('c:\\Users\\diaaa\\Downloads\\AtSpaces\\at Spaces Brand Guideline Final.pdf', options, (err, data) => {
  if (err) return console.log(err);
  const text = data.pages.map(page => page.content.map(c => c.str).join(' ')).join('\n');
  console.log("PDF TEXT:");
  console.log(text);
});
