const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oz2ylzg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//middlewares
const logger= (req,res,next)=>{
    console.log('log info:',req.method, req.url);
    next();
}

const verifyToken=(req,res,next)=>{
    const token = req?.cookies?.token;
    // console.log('token in the middleware', token);
    if(!token){
        return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
        if(err){
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user=decoded;
        next()
    })
   
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db('groupStudyDB').collection('users');
        const assignmentCollection = client.db('groupStudyDB').collection('assignments');
        const submittedAssignmentsCollection = client.db('groupStudyDB').collection('submittedAssignments')


        //========Auth Related APIs=========
        app.post('/jwt',logger, async (req, res) => {
            const user = req.body;
            console.log('user for token:', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                samSite: 'none'
            })
            res.send({ Success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        //========Assignments related apis========
        //-------read all Assignment data-------

        app.get('/assignments', async (req, res) => {
            const cursor = assignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })    

        //-------Assignment data created or posted--------
        app.post('/assignments', logger, verifyToken, async (req, res) => {
            const newAssignment = req.body;
            console.log(newAssignment);
            const result = await assignmentCollection.insertOne(newAssignment);
            res.send(result);
        })
        //-------- Reading Data of a particular item by its ID-------
        app.get('/assignments/:id', logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })

        //--------putting or updating data-------
        app.put('/assignments/:id', logger, verifyToken, async (req, res) => {
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

        //-------Delete Assignment Data-------
        app.delete('/assignments/:id', logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result);
        })
        // ========Submitted Assignments Related APIs=======
        //-------submitted assignments POST related api--------
        app.post('/submittedAssignments', logger, verifyToken, async (req, res) => {
            const submittedAssignment = req.body;
            const result = await submittedAssignmentsCollection.insertOne(submittedAssignment);
            res.send(result);
        })

        //--------getting submitted data as per query:status--------
        app.get('/submittedAssignments', logger, verifyToken, async (req, res) => {
            console.log(req.query.status);
            console.log("token owner info",req.user)
            let query = {};
            if (req.query?.status) {
                query = { status: req.query?.status }
            }
            const result = await submittedAssignmentsCollection.find(query).toArray();
            res.send(result);
        })       

        //--------getting submitted data by id--------
        app.get('/submittedAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await submittedAssignmentsCollection.findOne(query);
            res.send(result);
        })

        //--------getting all submitted data--------
        app.get('/submittedAssignments', async (req, res) => {
            const cursor = submittedAssignmentsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //--------Updating submitted assignment data for "GIVE MARK"-------
        app.put('/submittedAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const option = { upsert: true };
            const updatedSubmittedAssignment = req.body;
            const submittedAssignment = {
                $set: {
                    givenMarks: updatedSubmittedAssignment.givenMarks,
                    feedback: updatedSubmittedAssignment.feedback,
                    examinerEmail: updatedSubmittedAssignment.examinerEmail,
                    status: updatedSubmittedAssignment.status,
                }
            }
            const result = await submittedAssignmentsCollection.updateOne(filter, submittedAssignment, option);
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
