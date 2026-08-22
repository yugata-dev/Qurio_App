const express = require("express")
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Backend LIVEN Berjalan!');
});

app.listen(PORT, () => {
  console.log(`Server Backend aktif di http://localhost:${PORT}`);
});

