const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose=require('mongoose');
const app = express();
const PORT = 1000;

mongoose.connect('mongodb+srv://louam-lemjid:8hAgfKf2ZDauLxoj@cluster0.mjqmopn.mongodb.net/smartHome', { useNewUrlParser: true, useUnifiedTopology: true });

// Models
const devicesshema= new mongoose.Schema({
    name:String,
    state:Boolean
});
const Device=mongoose.model('Device',devicesshema);

// Middleware
app.set('view engine','ejs');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const db=mongoose.connection;
db.on('error',console.error.bind(console,'connection error:'));
db.once('open', async function(){
    console.log('connected to the database');
    try {
        // Routes
        app.post('/admin', async(req, res) => {
            const state=req.body.switch;
            console.log(state);
            const chageState=await Device.updateOne({name:'led'},{$set:{state:state=="on"?true:false}});
            res.redirect('/admin');
        })
        app.get('/admin', async(req, res) => {
            const devices = await Device.find({});
            console.log(devices);
            res.render('admin');
        })
        app.get('/', async(req, res) => {
            const devices = await Device.find({});
            console.log(devices);
            res.json({ ledState: devices[0].state });
        });
        app.get('/louam/ac10000', async(req, res) => {
            res.json({ ledState: true });
        });
    } catch (error) {
        console.error(error);
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});