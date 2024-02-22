// ============================== for timer otp 


let coundIntervel;
function startCountdown(intialvalue) {
  let n = intialvalue;
  countdownIntervel = setInterval(() => {
    if (n === 0) {
      clearInterval(countdownIntervel)
    } else {
      document.querySelector('.time').innerHTML = n;
      n = n - 1;
    }

  }, 1000)

}

function resend() {
  clearInterval(coundIntervel);
  startCountdown(60)
}
startCountdown(60)

document.getElementById('resend').onclick = function(){
  resend()
}


document.getElementById('resend').addEventListener('click', () => {
  try {
    
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');


    const postUrl = '/resend' + (email ? `?email=${encodeURIComponent(email)}` : "")
    fetch(postUrl, {
      method: 'POST'
    }).then((res) => {
      if (res.ok) {
        console.log("resend otp is success");
      } else {
        console.log("resend otp is failed");
      }
    }).catch(error => {
      console.log("Error: ", error);
    })
  } catch (error) {
    console.log(error);
  }
})
// =============================== otp validation ========================= \\

function validateotp() {
  let fields = document.querySelectorAll(".verificationForm");
  let isValid = true;

  fields.forEach(function (field) {
      if (field.value.trim() === "" || field.value.length>1) {
          field.style.border = 'solid 1px red';

          setTimeout(function () {
              field.style.border = '';
          }, 3000);

          isValid = false;
      }
  });

  return isValid;
}

 // ===================================== signup page ============================\\

function validate() {
  let username = document.getElementById('uname');
  let usermobile = document.getElementById('uphone'); 
  let confirmpassword = document.getElementById('confirm_password')
  let password = document.getElementById('password'); 




  if (!/^\w+$/.test(username.value)) {

    username.style.border = 'solid 1px red'
    userError.textContent = 'only allow letters number and underscored'
    setTimeout(function() {
      username.style.border = ''
      userError.textContent = ''
    }, 3000)
    return false;

  }
  else if (usermobile.value.trim().length < 10 || !/^\d+$/.test(usermobile.value)) {
    usermobile.style.border = 'solid 1px red'
    userMobileErr.textContent = 'Mobile number should be number with 10 digits'
    setTimeout(function() {
      usermobile.style.border = '';
      userMobileErr.textContent = '';
    }, 3000)
    return false;

    
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(password.value)) {
    password.style.border = 'solid 1px red';
    passwordError.textContent = 'Password must be atleast 6 charcaters long and contain at least one uppercase letter one lowercase letter,and one number';
    setTimeout(function()  {
      password.style.border = '';
      passwordError.textContent = '';
    }, 3000)
    return false;
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(confirmpassword.value)) {
    confirmpassword.style.border = 'solid 1px red';
    passwordError.textContent = 'Password must be atleast 6 charcaters long and contain at least one uppercase letter one lowercase letter,and one number';
    setTimeout(function()  {
      confirmpassword.style.border = '';
      passwordError.textContent = '';
    }, 3000)
    return false;
  } else {
    true;
  }
}

let usernameExistAlert = document.getElementById('usernameExistAlert')
let existAlert = document.getElementById('existAlert')
setTimeout(function()  {
  if (existAlert) {
    existAlert.style.display = 'none';
  }
}, 3000)

setTimeout(function() {
  if (usernameExistAlert) {
    usernameExistAlert.style.none = 'none';
  }
}, 3000)

// ========================== Add address validate ======================= \\

// function validateaddress(){
//   let Uname = document.getElementById('fullname');
//   let Uaddress = document.getElementById('Addressline'); 
//   let Ucity = document.getElementById('city');
//   let Ustate = document.getElementById('state');
//   let Upincode = document.getElementById('postcode');
//   let Uphone = document.getElementById('phone'); 
// }