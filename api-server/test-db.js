const ADODB = require('node-adodb');


const conn = ADODB.open(
  'Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\Users\\Brave\\Documents\\Visual Studio Code\\FerryGoodV2\\FerryGoodV2\\database\\FerryGood.accdb;Persist Security Info=False;Jet OLEDB:Database Password=;'
);

conn.query('SELECT * FROM Users')
  .then(data => {
    console.log('✅ Connection works!');
    console.log(data);
  })
  .catch(err => {
    console.log('❌ Full error:');
    console.log(err);
  });