const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config();
const port = process.env.PORT || 5000;

const jtw = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middle wares;
app.use(cors());
app.use(express.json());


app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vyurkve.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Generate Token When user SignIn
const userTokenGenerator = (user) => {
  return jwt.sign({ user }, process.env.ACCESS_TOKEN, { expiresIn: '30d' })
}


// Verify Access Token
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Not Allow! Unauthorization Access!' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decode) {
    if (error) {
      return res.status(403).send({ message: 'Not Allow! Forbidden Access!' })
    }
    req.decode = decode;
    next()
  })
}


async function run() {
  try {
    const database = client.db('ultra_pure');
    const userCollection = database.collection("users");

    // Verify Admin Middleware
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decode.user.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next()
      }
      else {
        res.status(403).send({ message: 'Forbidden Access!' })
      }
    }

    // Check user isAdmin or Not.
    app.get('/api/user/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === 'admin' });
    })

    // Register New User.
    app.post('/api/register', async (req, res) => {
      const { email, password, name } = req.body;

      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      const hashedPassword = await bcrypt.hashSync(password, 10);
      const user = { email, password: hashedPassword, name };
      const result = await userCollection.insertOne(user);
      res.send({ success: true, message: 'User Register Successfully!', token: userTokenGenerator(user) })
    });

    // Login User
    app.post('/api/login', async (req, res) => {
      const { email, password } = req.body;
      const user = await userCollection.findOne({ email });
      if (user) {
        if (bcrypt.compareSync(password, user.password)) {
          res.send({
            _id: user._id,
            token: userTokenGenerator(user)
          });
          return;
        }
      }
      res.status(401).json({
        status: 'failed',
        message: 'User Credentail Does not match!'
      })
    })

    // User Logout
    app.post('/api/logout', (req, res) => {
      res.json({ message: 'Successfully logged out' });
    });


    // Get User Info
    app.get('/api/user/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await userCollection.findOne(query);
      const userInfo = {
        name: user.name,
        email: user.email
      }
      res.json(userInfo);
    });

    // Get All User Info
    app.get('/api/users', verifyJWT, async (req, res) => {
      const query = {};
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });

    // Delete Specific User Info
    app.delete('/api/user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result)
    });

    // Make User Admin
    app.put('/api/user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: "admin"
        }
      }

      const result = await userCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })

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