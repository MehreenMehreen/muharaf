function submitSelectedUser() {
  let selectedUser = document.getElementById("users");
  let ind = selectedUser.selectedIndex;
  USER_IND = ind;
  document.getElementById('users').value=selectedUser.options[ind].text;
  //document.getElementById('users').name="selectedUser";
  USER = selectedUser.options[ind].text;
  postToServer();
  return false;
}

function submitSelectedTask(postReq=true) {
  let selectedTask = document.getElementById("tasks");
  TASK_IND = selectedTask.selectedIndex;
  TASK = TASK_ARRAY[TASK_IND];
  //alert(TASK); 

  if (TASK == "Annotate" || TASK == "Select") {
    
    // document.getElementById("labelToCheck").className="invisible";
    document.getElementById("labelToCheck").classList.add("invisible");
    document.getElementById("userToCheck").classList.add("invisible");
    userToCheck = document.getElementById("userToCheck");

    if (DIR_LISTBOX!=null)
      DIR_LISTBOX.reInitialize(DIR_LIST);
    
  }
  else if (TASK == "Verify" || TASK == "Transcribe" || TASK == 'check') {
    // document.getElementById("labelToCheck").className = "visible";
    document.getElementById("labelToCheck").classList.remove("invisible");
    userToCheck = document.getElementById("userToCheck");
    userToCheck.classList.remove("invisible");
    userToCheck.selectedIndex = TO_CHECK_USER_IND;
    userToCheck.value = userToCheck.options[TO_CHECK_USER_IND].text;   
    
    if (postReq)
      postToServer();
    else {
      if (DIR_LISTBOX!=null)
        DIR_LISTBOX.reInitialize(DIR_TO_VERIFY);
    }
  }
  else if (TASK == "View" || TASK == "transcribeBlock") {
    document.getElementById("labelToCheck").classList.add("invisible");
    document.getElementById("userToCheck").classList.add("invisible");
    //userToCheck = document.getElementById("userToCheck");
    TO_CHECK_USER_IND = USER_IND;
    TO_CHECK_USER = USER;

    if (postReq)
      postToServer();
    else {
      if (DIR_LISTBOX!=null)
        DIR_LISTBOX.reInitialize(DIR_TO_VERIFY);
    }
  }

  return false;
}


function submitToCheckUser() {
  let toCheckUser = document.getElementById("userToCheck");
  let checkUserInd = toCheckUser.selectedIndex;
  TO_CHECK_USER_IND = checkUserInd;
  document.getElementById('userToCheck').value = toCheckUser.options[checkUserInd].text;
//  document.getElementById('userToCheck').name = ;
  TO_CHECK_USER = toCheckUser.options[TO_CHECK_USER_IND].text;
  postToServer();
  return false;  
}

  
class myDirList{
  constructor(dirJson, elementId="dirChoice") {
    this.dirJson = dirJson;
    this.parentArr = new Array();
    this.parentArr.push(dirJson);
    this.listBox = document.getElementById(elementId);
    this.root = dirJson;
    
    this.fileLabel = document.getElementById("filesLabel");
    this.dirLabel = document.getElementById("dirLabel");
    this.fileLabel.innerHTML = "Files in /";
    this.dirLabel.innerHTML = this.fileLabel.innerHTML.replace("Files", "Directories");
    for (let i=0;i<dirJson.sub_directories.length;++i) {
      let opt = document.createElement("option");
      opt.innerHTML = dirJson.sub_directories[i].name;
      this.listBox.appendChild(opt);
  }
  this.populateFileList(dirJson.files);
  this.listBox.addEventListener("click", DirChoiceClicked)

  }
  clearListBox(id) {
    let box = document.getElementById(id);
    while(box.hasChildNodes()) {
      box.removeChild(box.firstChild);
    }
  }

  DirChoiceClicked(){
    //this.listBox.blur();
    let ind = this.listBox.selectedIndex;
    if (ind < 0)
      return;
    //check if .. clicked
    if (ind == this.root.sub_directories.length) {
      this.showParentDir();
      return;
    }
    this.clearListBox("dirChoice");
    let jsonObj = this.root.sub_directories[ind];
    this.fileLabel.innerHTML += jsonObj.name + "/";
    this.dirLabel.innerHTML = this.fileLabel.innerHTML.replace("Files", "Directories");
    for (let i=0;i<jsonObj.sub_directories.length;++i) {
      let opt = document.createElement("option");
      opt.innerHTML = jsonObj.sub_directories[i].name;
      this.listBox.appendChild(opt);
    }

    let opt = document.createElement("option");
    opt.innerHTML = ".."; //to go back
    this.listBox.appendChild(opt);

    this.populateFileList(jsonObj.files);
    this.parentArr.push(this.root);
    this.root = this.root.sub_directories[ind];
  }

  showParentDir() {
    this.clearListBox("dirChoice");
    let parent = this.parentArr.pop();
    for (let i=0;i<parent.sub_directories.length;++i) {
      let opt = document.createElement("option");
      opt.innerHTML = parent.sub_directories[i].name;
      this.listBox.appendChild(opt);
    }
    if (this.parentArr.length > 1) {
      let opt = document.createElement("option");
      opt.innerHTML = ".."; //to go back
      this.listBox.appendChild(opt);
    }

    this.populateFileList(parent.files);
    let txt = this.fileLabel.innerHTML;
    let lastInd = txt.lastIndexOf("/", txt.length-2);
    this.fileLabel.innerHTML = txt.substring(0, lastInd+1);
    this.dirLabel.innerHTML = this.fileLabel.innerHTML.replace("Files", "Directories");
    this.root = parent;

  }

  getDirPath() {
    let txt = this.dirLabel.innerHTML;
    let path = txt.replace("Directories in /", "");
    return path;
  }

  populateFileList(fileList) {
    
    this.clearListBox("imageFiles");
    let fileBox = document.getElementById("imageFiles");
    if (fileList.length == 0) {
      document.getElementById("startButton").disabled = true;
      return;
    }

    document.getElementById("startButton").disabled = false;

    for (let i=0;i<fileList.length;++i) {
      let opt = document.createElement("option");
      opt.innerHTML = fileList[i];
      fileBox.appendChild(opt);
    }
    if (TASK == "Select")
      fileBox.disabled = false;
    else
      fileBox.disabled = true;    
  }

  reInitialize(dirJson, elementId="dirChoice") {
    this.clearListBox("dirChoice");
    //fillListBoxes();
    this.dirJson = dirJson;
    this.parentArr = new Array();
    this.parentArr.push(dirJson);
    this.listBox = document.getElementById(elementId);
    this.root = dirJson;
    this.fileLabel = document.getElementById("filesLabel");
    this.dirLabel = document.getElementById("dirLabel");
    this.fileLabel.innerHTML = "Files in /";
    this.dirLabel.innerHTML = this.fileLabel.innerHTML.replace("Files", "Directories");
    for (let i=0;i<dirJson.sub_directories.length;++i) {
      let opt = document.createElement("option");
      opt.innerHTML = dirJson.sub_directories[i].name;
      this.listBox.appendChild(opt);
  }
  this.populateFileList(dirJson.files);
  this.listBox.addEventListener("click", DirChoiceClicked)
  


  }

  getSelectedFiles() {
    let fileBox = document.getElementById("imageFiles");
    let selectedFiles = new Array();
    for (let i=0;i<fileBox.options.length; ++i){
      if (fileBox.options[i].selected) {
        selectedFiles.push(fileBox.options[i].innerHTML);
      } // end if
    } // end for
    return selectedFiles;
  }


} //end class




function DirChoiceClicked(event) {

  DIR_LISTBOX.DirChoiceClicked();

}

function populateDirChoice(dirJson) {

}
  
function startClicked() {
    
  postToServer(true);
  //return false;
}


function postToServer(startClicked=false) {
  toPostJSON = {"userInd": USER_IND, 
                "taskInd": TASK_IND, 
                "toCheckUserInd": TO_CHECK_USER_IND,
                "start": 0};
  
  let filesList = "";
  if (startClicked) {
    
    if (TASK == "Select") {
      filesList = DIR_LISTBOX.getSelectedFiles();
      if (filesList.length == 0) {
        alert("Select files to annotate");
        return;
      }
      //alert (filesList);
    }

    toPostJSON["start"] = 1;
    toPostJSON["dir"] = DIR_LISTBOX.getDirPath();
    toPostJSON["filesList"] = filesList;
    toPostJSON["uniqueKey"] = UNIQUE_KEY;
    
  }
  inputElement = document.getElementById("userInput");
  inputElement.name = "userForm";
  inputElement.value = JSON.stringify(toPostJSON);

  document.getElementById('userForm').submit();
}

