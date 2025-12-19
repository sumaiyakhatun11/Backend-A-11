const express = require('express');
const cors = require('cors');

require('dotenv').config();
const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

const verifyFBToken = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    try {
        const isToken = token.split(' ')[1];
        const decodedUser = await admin.auth().verifyIdToken(isToken);
        req.decodedUser = decodedUser;
        next();
    } catch (error) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
};



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


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
        const ordersCollection = database.collection("orders");

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

        app.get('/users', verifyFBToken, async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        }
        )


        app.post('/users', async (req, res) => {
            const user = req.body;

            const newUser = {
                name: user.name,
                email: user.email,
                photoURL: user.photoURL,
                role: user.role || 'buyer',
                password: user.password,
                status: 'pending',
                createdAt: new Date()
            };

            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        });

        app.get('/users/email/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email });
            res.send(user);
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

        app.get('/products', async (req, res) => {
            try {
                const products = await productsCollection.find().toArray();
                res.send(products);
            } catch (error) {
                res.status(500).send({ message: 'Failed to fetch products' });
            }
        });

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

        // Update user role
        app.put('/users/role/:id', verifyFBToken, async (req, res) => {
            const { id } = req.params;
            const { role } = req.body;
            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { role } }
            );
            res.send(result);
        });

        // Update user status (approve/suspend)
        app.put('/users/status/:id', verifyFBToken, async (req, res) => {
            const { id } = req.params;
            const { status } = req.body;
            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status } }
            );
            res.send(result);
        });

        app.post('/products', verifyFBToken, async (req, res) => {
            const product = req.body;
            product.createdAt = new Date();
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        // create order
        app.post('/orders', verifyFBToken, async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            order.status = 'pending';

            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        // get orders by user
        app.get('/orders/:email', verifyFBToken, async (req, res) => {
            if (req.decodedUser.email !== req.params.email) {
                return res.status(403).send({ message: 'Forbidden' });
            }

            const orders = await ordersCollection
                .find({ userEmail: req.params.email })
                .toArray();

            res.send(orders);
        });

        app.get('/products/:id', async (req, res) => {
            const { id } = req.params;

            try {
                const product = await productsCollection.findOne({
                    _id: new ObjectId(id)
                });

                if (!product) {
                    return res.status(404).send({ message: 'Product not found' });
                }

                res.send(product);
            } catch (error) {
                res.status(500).send({ message: 'Failed to load product' });
            }
        });



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