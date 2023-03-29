const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config();
const jtw = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middle wares;
app.use(cors());
app.use(express.json());

async function run() {
  try {

    const uri = `mongodb+srv://${process.env.DB_USER}:<password>@cluster0.vyurkve.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



  } finally {

  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Ultra Pure server is running!')
})

app.listen(port, () => {
  console.log(`Ultra Pure server is running on ${port}`)
})