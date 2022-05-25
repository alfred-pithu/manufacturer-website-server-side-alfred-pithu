const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
var jwt = require('jsonwebtoken');



//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bgws.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        //collections
        const productCollection = client.db('assignment-12').collection('products');
        const feedbackCollection = client.db('assignment-12').collection('feedbacks');

        //to get all the products
        app.get('/products', async (req, res) => {
            const result = await productCollection.find({}).toArray();
            res.send(result)
        })






        //to get all the feedbacks
        app.get('/feedbacks', async (req, res) => {
            const result = await feedbackCollection.find({}).toArray();
            res.send(result);
        })

        //to add new feedback
        app.post('/feedbacks', async (req, res) => {

        })


        //create JWT 
        app.put('/token', async (req, res) => {
            const email = req.query;
            const payload = { email: email }
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })
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
