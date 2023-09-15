const { configDotenv } = require('dotenv')
const express = require("express");
const ErrorHandler = require("./utils/ErrorHandler");
const jwt = require('jsonwebtoken')
const  cloudinary = require('cloudinary')
const order = require('./routes/order')
const product = require('./routes/product')
const shop = require('./routes/shop')
const user = require('./routes/user')
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const Dbconnection = require('./database/Dbconfig/mongodb')
app= express()



// config dev mode
if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({
      path: "privacy/.env",
    });
  }
  app.use(express.json());
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
  //cloudninary config
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })


// calling database connection
Dbconnection()
//app.use(new ErrorHandler);
app.use("/api/v2/order", order)
app.use("/api/v2/product", product)
app.use("/api/v2/shop", shop)
app.use("/api/v2/user", user)
app.listen(process.env.PORT,()=>{
    console.log( `app is running on http://localhost:${process.env.PORT}`)
})

