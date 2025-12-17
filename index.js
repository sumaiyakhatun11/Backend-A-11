const express = require('express');
const cors = require('cors');

require('dotenv').config();
const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://Assignment-11:e3qB88sNDuVaDgTV@cluster0.052zdja.mongodb.net/?appName=Cluster0";

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

        const database = client.db("Assignment-11");

        const usersCollection = database.collection("users");
        const productsCollection = database.collection("products");

        app.post('/users', async (req, res) => {
            const user = req.body;
            // user.role = 'buyer';
            user.createdAt = new Date();
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users/:email', async (req, res) => {
            const { email } = req.params;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send(user);
        });


        app.post('/products', async (req, res) => {
            const product = req.body;
            product.createdAt = new Date();
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        app.get('/manager/products/:email', async (req, res) => {
            const { email } = req.params;
            console.log(email);
            const query = { managerEmail: email };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        app.delete('/manager/product/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        }
        );

        app.get('/manager/product/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        }
        );

        app.put('/manager/updateProduct/:id', async (req, res) => {
            const { id } = req.params;
            const updatedProduct = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: updatedProduct
            };
            const result = await productsCollection.updateOne(filter, updateDoc);
            res.send(result);
        }
        );


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from Backend-11');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// 