function showSelectedFiles() {
	var fileDialog = document.getElementById("fileDialog");
	selectedFiles = document.getElementById("selectedFiles");
	selectedFiles.innerHTML = ""; // Clear existing file list
            
    var files = fileDialog.files;
            
    for (var i = 0; i < files.length; i++) {
    	var option = document.createElement("option");
        option.text = files[i].name;
        selectedFiles.add(option);
    }
    if (files.length > 0) {
    	document.getElementById("uploadButton").disabled = false;
    }

}

//switch on file dialog once a user is selected
function submitSelectedUser() {
  fileDialog = document.getElementById("fileDialog");		
  user = getUser();
  
  
  if (user.length == 0) {
  	fileDialog.disabled = true;
  	document.getElementById("uploadButton").disabled = true;
  	return
  }
  userSelected = document.getElementById('userSelected');
  userSelected.value = user;
fileDialog.disabled = false;
//document.getElementById("uploadButton").disabled = true;


}

function getUser() {
	let selectedUser = document.getElementById("users");
	let ind = selectedUser.selectedIndex;  
  	return selectedUser.options[ind].value;
}

//THIS IS NOT CALLED
function onUploadClicked() {
	var user = getUser();
	//post to server
	var uploadForm = document.getElementById("uploadForm");
	toPostJson = {"user": user};

	inputElement = document.getElementById("userInput")
	inputElement.name = "uploadForm";
  	inputElement.value = JSON.stringify(toPostJson);

  	uploadForm.submit();
}

function displayErrors(notDoneList, errorString) {
	if (errorString.length > 0) {
		alert(errorString);
	}
	if (notDoneList.length == 0) {
		return;
	}
	alert('Some files could not be uploaded. See error log below');

	logs = document.getElementById("errorLogs");
	logs.innerHTML = ""; // Clear existing list
            
    
    for (var i = 0; i < notDoneList.length; i++) {
    	var option = document.createElement("option");
        option.text = notDoneList[i].filename + ' ' + notDoneList[i].error;
        logs.add(option);
    }
}

function displayDone(doneList) {

	
	if (doneList.length == 0) {
		return;
	}
	alert('See list below for files successfully uploaded');

	logs = document.getElementById("logs");
	logs.innerHTML = ""; // Clear existing list
            
    
    for (var i = 0; i < doneList.length; i++) {
    	var option = document.createElement("option");
        option.text = doneList[i];
        logs.add(option);
    }	

}