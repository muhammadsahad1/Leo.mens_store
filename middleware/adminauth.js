const islogin = async (req, res, next) => {
    try {

        if (req.session.admin) {
            next();

        }
        else {
            res.redirect('/admin/')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const islogout = async (req, res, next) => {
    try {
        if (req.session.admin) {

            res.redirect('/admin/adminDashboard')

        } else {

            next();
        }


    }
    catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    islogin,
    islogout
}