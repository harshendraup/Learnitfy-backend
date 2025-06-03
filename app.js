require('dotenv').config(); 
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectToDb } = require('./src/config/db');
const router = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 4000;

console.log('✅ Loaded PORT:', PORT);  

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.status(200).send('Welcome to the LearnItFy API server!');
});

app.use(router);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  );
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
});
