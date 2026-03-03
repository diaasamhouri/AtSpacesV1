const fs = require('fs');
const pdf = require('pdf-parse');

console.log('pdf export type is:', typeof pdf);

let dataBuffer = fs.readFileSync('c:\\Users\\diaaa\\Downloads\\AtSpaces\\at Spaces Brand Guideline Final.pdf');

const parseFunc = typeof pdf === 'function' ? pdf : (pdf.default || pdf.pdf);

if (typeof parseFunc === 'function') {
  parseFunc(dataBuffer).then(function(data) {
      console.log(data.text);
  }).catch(err => {
      console.error(err);
  });
} else {
  console.log("Could not find pdf parse function in:", Object.keys(pdf));
}
