import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
// env config
dotenv.config();

/**
 * *=============================================================================
 * !                                 variables here
 * *=============================================================================
 */
const PORT = process.env.PORT || 8585;
const app = express();
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@cluster0.9qxeces.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const toyCollection = client.db("assignment11DB").collection("toys");

const indexKey = {toyName: 1}
const indexOptions = {name:"searchByToyName"}

/**
 * *=============================================================================
 * !                              middleware here
 * *=============================================================================
 */
app.use(cors());
app.use(express.json());

/**
 * *=============================================================================
 * !                              home route here
 * *=============================================================================
 */
app.get("/", (req, res) => {
  res.send("server is running");
});

/**
 * *=============================================================================
 * !                              database connection here
 * *=============================================================================
 */
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    /**
     * *=============================================================================
     * !             get limited items and all items form toy collection
     * *=============================================================================
     */
    app.get("/toys", async (req, res) => {
      const { limit, sort ,photoLink} = req.query;
      let photo = {}
      if (photoLink) {
        photo = {photoUrl:1}

      }

      const allToys = await toyCollection
        .find()
        .limit(parseInt(limit))
        .sort({ price: sort }).project(photo)
        .toArray();

      res.send(allToys);
    });

    /**
     * *=============================================================================
     * !             get category limited items and all items form toy collection
     * *=============================================================================
     */
    app.get("/toys/category", async (req, res) => {
      const query = req.query;

      const toys = await toyCollection.find(query).limit(5).toArray();
      res.send(toys);
    });

    /**
     * *=============================================================================
     * !                  get single item form toy collection
     * *=============================================================================
     */
    app.get("/toys/:toyId", async (req, res) => {
      const id = req.params.toyId;
      const query = { _id: new ObjectId(id) };

      const singleToy = await toyCollection.findOne(query);
      res.send(singleToy);
    });

    /**
     * *=============================================================================
     * !         get multiple items form toy collection according to email
     * *=============================================================================
     */
    app.get("/my-toys", async (req, res) => {
      const email = req.query;

      const UserToys = await toyCollection.find(email).toArray();
      console.log(UserToys);
      res.send(UserToys);
    });

    /**
     * *=============================================================================
     * !         get multiple items form toy collection according to search keywords
     * *=============================================================================
     */
    app.get("/my-toys/search", async (req, res) => {
      const {keyword} = req.query;


      const result = await toyCollection.createIndex(indexKey,indexOptions)

      const UserToys = await toyCollection.find({toyName:{$regex:keyword,$options:'i'}}).toArray();
      res.send(UserToys);
    });

    /**
     * *=============================================================================
     * !                 create item and add item to toy collection
     * *=============================================================================
     */
    app.post("/toys", async (req, res) => {
      const data = req.body;
      const insertedData = await toyCollection.insertOne(data);

      res.send(insertedData);
    });

    /**
     * *=============================================================================
     * !                      update item form toy collection
     * *=============================================================================
     */
    app.put("/toys/:toyId", async (req, res) => {
      const data = req.body;

      const id = req.params.toyId;
      const query = { _id: new ObjectId(id) };
      const singleToy = await toyCollection.findOne(query);

      const updatedToy = {
        $set: {
          toyName: data.toyName || singleToy.toyName,
          price: data.price || singleToy.price,
          photoUrl: data.photoUrl || singleToy.photoUrl,
          availableQuantity:
            data.availableQuantity || singleToy.availableQuantity,
          ratings: data.ratings || singleToy.ratings,
          description: data.description || singleToy.description,
          category: data.category || singleToy.category,
        },
      };

      const update = await toyCollection.updateOne(query, updatedToy);

      res.send(update);
    });

    /**
     * *=============================================================================
     * !                  delete single item form toy collection
     * *=============================================================================
     */
    app.delete("/toys/:toyId", async (req, res) => {
      const id = req.params.toyId;
      const query = { _id: new ObjectId(id) };
      const deleted = await toyCollection.deleteOne(query);
      res.send(deleted);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(PORT, (req, res) => {
  console.log(
    `server listening on port ${PORT} click here to visit http://localhost:${PORT}`
  );
});
