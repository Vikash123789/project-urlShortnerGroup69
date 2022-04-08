const express = require ('express')
const bodyParser = require('body-parser')
const app = express()
const route = require('../src/routes/route')
const mongoose = require('mongoose')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


mongoose.connect("mongodb+srv://priyanka:PriyankaRajput@cluster0.fhqcn.mongodb.net/pro-4-url-shortner?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/' , route)

app.listen(process.env.PORT || 3000, function(){
    console.log("Express app running on PORT" + (process.env.PORT || 3000))
})