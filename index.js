const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express()
const bcrypt = require('bcryptjs')
app.use(express.json())
app.use(
    cors({
        origin: [
            "http://localhost:5173",
           

        ],
        credentials: true,
    })
);

const port = 5000 || `${process.env.PORT}`
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cn1yph8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    } 
}); 

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const userCollection = client.db('bkash').collection('users')
        app.get('/', (req, res)=> {
            res.send("running")
        })
        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token });
        })

        //post user
        app.post('/users', async (req, res) => {
            const newUser = await req.body;
            const exist = await userCollection.findOne({ phone: newUser.phone });
            if (exist) {
                res.send({ message: 'user exist',status:404 })
                console.log("exist");
            } else {
                 const hash = bcrypt.hashSync(newUser.password, 14);
            const response = userCollection.insertOne({ ...newUser, password: hash });
            res.send({ message: 'user created', status: 200 }) 
            }
          
        })
        //get single user
        app.get('/users', async (req, res) => {
            const phone = req.query.phone;
            const password = req.query.password
            
            const query = { phone: phone };
            
            const result = await userCollection.findOne(query);
            
            const passwordMatch = await bcrypt.compare(password, result.password);
            console.log(passwordMatch);
            if (!passwordMatch) {res.send({message:"Invalid user",status:401})}
            else { res.send({ ...result, status:200}); } 
        });

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close(); 
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})