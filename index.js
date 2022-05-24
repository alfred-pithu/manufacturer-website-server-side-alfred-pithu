const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');


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






















    }
    finally {
        await client.close();
    }
}

run().catch(console.dir);









app.get('/', (req, res) => {
    res.send('Server is Running Broooooooooooooooooo');
})

app.listen(port, () => {
    console.log('listening to port', port);
})
