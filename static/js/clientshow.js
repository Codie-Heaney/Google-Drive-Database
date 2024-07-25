const clientTable = document.getElementById("clientTableID");

function httpGet(url)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}

let searchResults = httpGet('/searchedentry');
let tableHeader = table.createTHead();
let tableHeaderRow = tableHeader.insertRow(0);

if(searchResults.length == 1){
    table.innerHTML = "No Results Found";
}else{
    for(let i = 0; i < searchResults[0].length; i++){
        let tableCell = tableHeaderRow.insertCell(i);
        tableCell.innerHTML = searchResults[0][i];
    }
    
    
    for(let i = 1; i < searchResults.length; i++){
        let tableRow = table.insertRow(i);
        for(let j = 0; j < searchResults[i].length; j++){
            let tableCell = tableRow.insertCell(j);
            tableCell.innerHTML = searchResults[i][j];
            if(searchResults[i][j] == "TRUE"){
                tableRow.id = "aggressive";
            }
        }
    }
}