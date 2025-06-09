const express = require("express");
const app = express();
const path = require("path");
const parentRouter=require('./routes/parent-route');
const babysitterRouter=require('./routes/babysitter-route');
const bodyParser = require('body-parser');
const cors=require('cors');
const mongoose=require('mongoose');
const connectDb=require('./database/connect');
let cookieParser = require('cookie-parser');
const session=require('express-session');
const flash = require('express-flash');
const authMiddleware = require("./middlewares/auth"); 
//process.env
require('dotenv').config()
const port=process.env.PORT || 5500

app.use(express.json());
app.use(cors());

app.use(flash());

// Set EJS as the templating engine
app.set("view engine", "ejs");
// Set the views folder (this points to the 'views' directory)
app.set('views', path.join(__dirname, 'views'));

// Serve static files (like images, CSS, JS) from the "public" directory
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

// Middleware for parsing URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json())

 //config de la session
 app.use(session({
  secret:"secret",
  resave:false,
  saveUninitialized:false,
  cookie:{maxAge:6555555}
 }))
 app.use(cookieParser())

 // connection a base de donnee
 connectDb()

app.use(parentRouter)
app.use(babysitterRouter)

app.use(authMiddleware);

// listen to the port
app.listen(port,()=>{console.log('listening on http://localhost:'+port);
})