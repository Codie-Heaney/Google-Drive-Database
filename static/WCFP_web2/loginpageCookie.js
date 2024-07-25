let loginCookie = getCookie("loggedin");
if(loginCookie == -1){
    alert("Login Details Incorrect");
}

function onSubmit(){
    let username = document.getElementById("uname");
    setCookie("username", username.value);
    setCookie("loggedin", 0);
}
