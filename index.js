const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// studyGroup
// ZTJFiK2QZjC2oQMy

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oz2ylzg.mongodb.net/?retryWrites=true&w=majority`;

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

        const userCollection = client.db('groupStudyDB').collection('users');
        const assignmentCollection = client.db('groupStudyDB').collection('assignments');
        const submittedAssignmentsCollection = client.db('groupStudyDB').collection('submittedAssignments')

        //Created Assignments
        //read all data
        app.get('/assignments', async (req, res) => {
            const cursor = assignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })



        //Assignment data created or posted
        app.post('/assignments', async (req, res) => {
            const newAssignment = req.body;
            console.log(newAssignment);
            const result = await assignmentCollection.insertOne(newAssignment);
            res.send(result);
        })
        // Reading Data of a particular item by its ID
        app.get('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })

        //putting or updating data
        app.put('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const option = { upsert: true };
            const updatedAssignment = req.body;
            const assignment = {
                $set: {
                    title: updatedAssignment.title,
                    marks: updatedAssignment.marks,
                    level: updatedAssignment.level,
                    category: updatedAssignment.category,
                    date: updatedAssignment.date,
                    imageURL: updatedAssignment.imageURL,
                    description: updatedAssignment.description,
                }
            }
            const result = await assignmentCollection.updateOne(filter, assignment, option);
            res.send(result);
        })

        //Delete Assignment Data
        app.delete('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result);
        })
        //submitted assignments related api
        app.post('/submittedAssignments', async (req, res) => {
            const submittedAssignment = req.body;
            const result = await submittedAssignmentsCollection.insertOne(submittedAssignment);
            res.send(result);
        })
        
        // getting submitted data as per query
        app.get('/submittedAssignments', async (req, res) => {
            console.log(req.query.status);
            let query={};
            if (req.query?.status){
                query = { status: req.query?.status }
            }
            const result = await submittedAssignmentsCollection.find(query).toArray();
            res.send(result);
        })
        // getting submitted data by id
        app.get('/submittedAssignments/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await submittedAssignmentsCollection.findOne(query);
            res.send(result);
        })

        //getting all submitted data
        app.get('/submittedAssignments', async (req, res) => {
            const cursor = submittedAssignmentsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //Updating submitted assignment data for give mark
        app.put('/submittedAssignments/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const option = {upsert:true};
            const updatedSubmittedAssignment = req.body;
            const submittedAssignment = {
                $set:{
                    givenMarks: updatedSubmittedAssignment.givenMarks,
                    feedback: updatedSubmittedAssignment.feedback,
                    examinerEmail: updatedSubmittedAssignment.examinerEmail,
                    status: updatedSubmittedAssignment.status,
                }
            }
            const result = await submittedAssignmentsCollection.updateOne(filter,submittedAssignment,option);
            res.send(result);
        })



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
    res.send('Group Study Server is Running')
})

app.listen(port, () => {
    console.log(`Group Study Server Running on port:${port}`);
})
