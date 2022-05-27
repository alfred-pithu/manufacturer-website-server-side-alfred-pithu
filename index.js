const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.STRIPE_SECRET);



//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7bgws.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//verify jwt function 
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    // console.log(authorization);

    if (!authorization) {
        return res.status(401).send({ message: 'Unauthorized to access' })
    }
    const userToken = authorization.split(' ')[1]

    console.log(userToken);

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

        //Stripe --------------------------
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const order = req.body;
            console.log(order);
            const price = order.totalPrice;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        })


        //Verify admin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            // console.log('login kora acheee', user);
            if (user.role === 'admin') {
                next()
            }
            else {
                return res.status(403).send({ message: 'Prohibited' })
            }


        }

        //to get all the products
        app.get('/products', async (req, res) => {
            const result = await productCollection.find({}).toArray();
            res.send(result)
        })

        // to add/post new product in db
        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            // console.log(newProduct);
            const result = await productCollection.insertOne(newProduct);
            res.send(result)

        })

        // to delete one product from the db
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productCollection.deleteOne(query)
            res.send(result);
        })




        //to get one particular product
        app.get('/oneitem/:id', async (req, res) => {
            const itemId = req.params.id;
            const query = { _id: ObjectId(itemId) }
            const result = await productCollection.findOne(query);
            res.send(result)
        })

        // to get all the orders
        app.get('/orders', async (req, res) => {
            const result = await orderCollection.find({}).toArray()
            res.send(result);
        })

        //to add order in the db
        app.post('/order', async (req, res) => {
            const order = req.body;
            // console.log(order);
            const result = await orderCollection.insertOne(order);
            res.send(result);

        })

        //to get one's orders
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await orderCollection.find(query).toArray();
            res.send(result)
            // console.log(result);
        })

        //delete one order 
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

        //get one particular order for payment
        app.get('/oneOrder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.findOne(query);
            res.send(result)
        })

        // update one order after payment
        app.put('/oneOrder/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'Pending',
                    paid: true,
                    transactionId: payment.transactionId,
                }
            }

            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.send(result);


        })


        //to get one user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            if (email) {
                const query = { email: email }
                const result = await userCollection.findOne(query);
                res.send(result)
            }
        })

        //to update user's profile
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const updatedInfo = req.body;
            // console.log(updatedInfo);
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: updatedInfo
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);


        })



        //to patch or update one user (to set admin)
        app.patch('/user/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const filter = { email: email }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)

            res.send(result)

        })



        //to get all the users
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await userCollection.find({}).toArray()
            res.send(result);
        })



        //to get all the feedbacks
        app.get('/feedbacks', async (req, res) => {
            const result = await feedbackCollection.find({}).toArray();
            res.send(result);
        })

        //to add new feedback
        app.post('/feedbacks', async (req, res) => {
            const review = req.body;
            // console.log(review);
            const result = await feedbackCollection.insertOne(review);
            res.send(result)
        })


        // to check if admin or not
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            // console.log(user);
            if (user?.role === 'admin') {
                // console.log('Yessss, he is an admin');
                res.send(true)
            }
            else {
                res.send(false)
            }

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
