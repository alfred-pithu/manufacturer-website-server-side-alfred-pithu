const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');



//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bgws.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//verify jwt function 
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(403).send({ message: 'Unauthorized to access' })
    }
    const userToken = authorization.split(' ')[1]

    jwt.verify(userToken, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbiden to access' })
        }

        req.decoded = decoded;
        next()
    })

}

async function run() {
    try {
        await client.connect();

        //collections
        const productCollection = client.db('assignment-12').collection('products');
        const feedbackCollection = client.db('assignment-12').collection('feedbacks');
        const userCollection = client.db('assignment-12').collection('users');
        const orderCollection = client.db('assignment-12').collection('orders');

        //to get all the products
        app.get('/products', async (req, res) => {
            const result = await productCollection.find({}).toArray();
            res.send(result)
        })

        //to get one particular product
        app.get('/oneitem/:id', async (req, res) => {
            const itemId = req.params.id;
            const query = { _id: ObjectId(itemId) }
            const result = await productCollection.findOne(query);
            res.send(result)
        })

        //to add order in the db
        app.post('/order', async (req, res) => {
            const order = req.body;
            console.log(order);
            const result = await orderCollection.insertOne(order);
            res.send(result);

        })



        //to get all the feedbacks
        app.get('/feedbacks', async (req, res) => {


            const result = await feedbackCollection.find({}).toArray();
            res.send(result);
        })

        //to add new feedback
        app.post('/feedbacks', async (req, res) => {

        })


        //create JWT and add users to the userCollection 
        app.put('/token', async (req, res) => {
            const email = req.query.email;
            const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            const filter = { email: email }
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    email: email
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc, options)
            res.send({ token })
        })


















    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);









app.get('/', (req, res) => {
    res.send('Server is Running Broooooooooooooooooo');
})

app.listen(port, () => {
    console.log('listening to port', port);
})
