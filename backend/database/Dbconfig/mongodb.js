const mongoose= require('mongoose');


const Dbconnection = () => {
  try {
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    console.log('database is connected sucessfully')
  } catch (error) {
    console.error(error)
  }
};

module.exports = Dbconnection;
