
function EnableDisableTextBox(support) {
    var selectedValue = support.options[support.selectedIndex].value;
    var txtOther = document.getElementById("txtOther");
    txtOther.disabled = selectedValue == 16 ? false : true;
    if (!txtOther.disabled) {
        txtOther.focus();
    }

}

function findTotal(){
    var arr = document.getElementsByName('qty');
    var tot=0;
    for(var i=0;i<arr.length;i++){
        if(parseInt(arr[i].value))
            tot += parseInt(arr[i].value);
    }
    document.getElementById('total').value = tot;
}

function numcheck() {
    // Get the value of the input field with id="numb"
    let x = document.getElementById("numb").value;
    // If x is Not a Number or less than one or greater than 10
    let text;
    if (isNaN(x) || x < 1 || x > 10) {
      text = "Input not valid";
    } else {
      text = "Input OK";
    }
    document.getElementById("weeks").innerHTML = text;
  }
