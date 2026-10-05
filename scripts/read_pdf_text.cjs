const fs = require('fs');

for (const f of ['131442.pdf', '131443.pdf', '129811.pdf']) {
  const p = 'C:\\Users\\HP LAB\\Desktop\\' + f;
  if (fs.existsSync(p)) {
    const b = fs.readFileSync(p);
    console.log('\n==================', f, '==================');
    const str = b.toString('binary');
    const matches = str.match(/\((.*?)\)\s*Tj/g) || [];
    const text = matches.map(m => m.slice(1, m.lastIndexOf(')'))).join(' ');
    console.log(text.substring(0, 700));
  }
}
