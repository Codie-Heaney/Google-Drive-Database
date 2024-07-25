const table = document.getElementById("referralTable");
const reportNum = document.getElementById("reportNum");

function httpGet(url)
{
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}

let clientResults = httpGet('/clientdatabase');
let length = httpGet('/clienttablelength');
reportNum.innerHTML = length[0];

for(let i = 1; i < clientResults.length; i++){
    let tableRow = table.insertRow(i);
    for(let j = 0; j < clientResults[i].length; j++){
        let tableCell = tableRow.insertCell(j);
        tableCell.innerHTML = clientResults[i][j];
    }
    let finalCell = tableRow.insertCell(clientResults[i].length);
    finalCell.innerHTML='<div class="actionicons"><button class="actionbtn"><img src="/static/WCFP_web2/images/edit.png" /></button><button class="actionbtn"><img src="/static/WCFP_web2/images/delete.png" /></button></div>';
}