// DB Connected
const DBconnect = require('./config/mongodb')
DBconnect.connectDB()

const express = require('express')
const app = express();
const nocache = require('nocache')
const flash = require('express-flash')
const path =  require('path')




app.set('view engine','ejs')

app.use(flash())
app.use(nocache())
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'public/assets')));  
app.use(express.static(path.join(__dirname,'public/admin/assets')))

// user_route
const user_route = require('./router/userRouter')
app.use('/',user_route)

const admin_route = require('./router/adminRouter')
app.use('/admin',admin_route)


const PORT = process.env.PORT || 3001
app.listen(PORT ,()=>{
  console.log(`http://localhost:${PORT}`);
})



