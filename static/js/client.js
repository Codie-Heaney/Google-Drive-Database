//store all input divs
const clientDiv = document.getElementById("clientDiv");
const firstNameDiv = document.getElementById("firstNameDiv");
const lastNameDiv = document.getElementById("lastNameDiv");
const addressDiv = document.getElementById("addressDiv");
const postcodeDiv = document.getElementById("postcodeDiv");
const phoneDiv = document.getElementById("phoneDiv");
const emailDiv = document.getElementById("emailDiv");
const genderDiv = document.getElementById("genderDiv");
const aggressiveDiv = document.getElementById("aggressiveDiv");
const submitDiv = document.getElementById("submitDiv");
const termsTitle = document.getElementById("termsTitle");

const elementDivs = [clientDiv, firstNameDiv, lastNameDiv, addressDiv, postcodeDiv, phoneDiv, emailDiv, genderDiv, aggressiveDiv];

//prevents yes and no being clicked for aggressive chech box
function switchAggressive(checkboxName){
    let aggressiveCB = document.getElementById(checkboxName);
    aggressiveCB.checked = false;
}

//show input divs when search term checkboxes are ticked
function showDiv(displayState, divID){
    //displayState - the checkbox element clicked
    //divID - the element in the array where the input is stored

    let checkboxChecked = displayState.checked;
    if(checkboxChecked){
        elementDivs[divID].style.display = "block";
    }else{
        elementDivs[divID].style.display = "none";
    }

    for(let i = 0; i < elementDivs.length; i++){

        //if an input is shown show submit button
        if(elementDivs[i].style.display == "block"){
            submitDiv.style.display = "block";
            termsTitle.style.display = "block";
            return;
        }else{
            //if no inputs shown hide the submit button
            submitDiv.style.display = "none";
            termsTitle.style.display = "none";
        }
    }
}