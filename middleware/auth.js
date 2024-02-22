
// userlogin session
const islogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      if (req.path === '/login') {

        res.redirect('/')
        return;
      }
      next()
    } else {
      if (req.path === '/login') {
      return next()
      }
    }
  } catch (error) {
    console.log(error);

  }
}

// user logout session

const islogout = async(req,res,next)=>{
try{
if(req.session.user){
  res.redirect('/')
  return
}
next()

}catch(error){
console.log(error);
}
}
module.exports ={
  islogin,
  islogout
  
}