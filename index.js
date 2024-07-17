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

        //middleware
        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }
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
        //get single user data
        app.get('/users', async (req, res) => {
            const phone = req.query.phone;
            const password = req.query.password
            console.log(phone,password);
            const query = { phone: phone };
            if (phone === undefined || password === undefined) {
                res.send({message:"Invalid input", status:401})
             }
            const result = await userCollection.findOne(query);
           
            if (result==null) {
                res.send({ message: "Invalid input", status: 401 })
            }
            else {
                const passwordMatch = await bcrypt.compare(password, result.password);

                console.log(passwordMatch);
                 
            if (!passwordMatch) {res.send({message:"Invalid user",status:401})}
            else { res.send({ ...result, status:200}); } 
            }
            
           
        });
        //get user by phone
        app.get('/users/:phone', verifyToken, async (req, res) => {
            const phone = req.params.phone;

            const query = { phone: phone };
            const result = await userCollection.findOne(query);
            res.send(result);
        });

        //logout api

        app.get('/logout', (req, res) => {
            // 1. Check if user is authenticated (optional)
            // ... (authentication logic)

            // 2. Invalidate user session or token
            // req.session.destroy();
            // Example for session-based authentication

            // 3. Send a logout confirmation response
            res.json({ message: 'Successfully logged out!',status:200 });
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