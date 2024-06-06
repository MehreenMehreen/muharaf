// There are three types of lines: Empty unfilled textboxes, Filled textboxes and selected textboxes in focus

let LEFT_PAGE = 0;
let RIGHT_PAGE = 0;
let JSON_OBJ = null;
const lineAddedEvent = new Event("lineAdded");
let MOUSE_X = 0;
let MOUSE_Y = 0;
let MOUSE_IN_RIGHT_CANVAS = false;
let LINE_BY_LINE = true;
let ZOOM_FACTOR = 1.0;

let EMPTY_STROKE_COLOR = "rgba(0, 0, 0, 0.5)";
let EMPTY_FILL_COLOR = "rgba(220, 220, 220, 0.3)";
let TEXTBOX_BACKGROUND = "rgba(255, 255, 255, 0.8)"; //# Transparent
let SELECTED_LINE_STROKE = "rgba(0, 0, 0, 0)";
let SELECTED_LINE_FILL = "rgba(255, 255, 255, 0.9)";

// Fields for when data is filled

let DATA_LINE_STROKE = "rgba(0, 0, 0, 0.2)";
let DATA_LINE_FILL = "rgba(200, 200, 200, 0.9)";

let SELECTED_TEXTBOX_BACKGROUND = "rgba(255, 255, 255, 1)";

//This class handles all the markings
class annotateBlock extends manuscriptPage {
	constructor(imageWidth, canvasId="imgCanvas", imageId="manuscript") {
    super(imageWidth, canvasId, imageId);
    //has index of line being changed
    this.lineChanging = -1;
    this.zoomOn = false;
    this.zoomFactor = ZOOM_FACTOR;
  	
  }
  setNormalMode() {

  	super.setNormalMode();
  	
  	if (this.lineChanging != -1) {


  	//	var data = {'lineIndex': this.lineChanging};
  	//	var lineChangedEvent = new CustomEvent('lineChangedEvent', {detail: data});
  	//	document.dispatchEvent(lineChangedEvent);


  		var scrollPosition = getScrollPosition();
			
			var line = this.getLine(this.lineChanging);
			LEFT_PAGE.changeLine(this.lineChanging, line);
			window.scrollTo(scrollPosition.x, scrollPosition.y);
		}
  	this.lineChanging = -1;
  }

  restoreNormal(index) {

  	this.setNormalMode();
  	this.mouseDrag = false;
  	this.drawLine = null;
  	const ctx = this.canvas.getContext("2d");
    ctx.save();
    //this.refreshLines();
    this.refreshManuscript();
    this.selectedIndex = index;
    this.showSelected(MOVE_STYLE);
    ctx.restore();
    this.lineChanging = -1;
  }

  pencilDoubleClick(event) {
  	let totalLines = this.lineArray.length;
  	super.pencilDoubleClick(event);
  	// Was line added
  	let lastIndex = this.lineArray.length - 1;
  	//Check if line was added
  	if (lastIndex == totalLines) {
  		document.dispatchEvent(lineAddedEvent);
  	}
  }

  pasteClicked() {
		let totalLines = this.lineArray.length;
		super.pasteClicked();
		// Was line added
  	let lastIndex = this.lineArray.length - 1;
  	//Check if line was added
  	if (lastIndex == totalLines) {
  		document.dispatchEvent(lineAddedEvent);
  	}
	}

	getLastLine() {
		return this.lineArray[this.lineArray.length - 1];
	}

	setModified() {
		// to not have to set undo and other buttons
    this.modified = true;
  }
  setMoveMode() {
  	this.lineChanging = this.selectedIndex;
  	super.setMoveMode();
  }

  getLine(index) {
  	if (index < 0 || index >= this.lineArray.length)
  		return null;
  	return this.lineArray[index];
  }
  deleteLine() {
  	let index = this.selectedIndex;
  	super.deleteClicked();
  	return index;
  }
  //from textine class
  coordToPixel(coord, displayedImageWidth) {

		var ratio = this.imageDim.x/displayedImageWidth;
  	var imageDim = this.imageDim;

  	var p = new myPoint();
  	
  	p.x = coord.x * ratio;
  	p.y = coord.y * ratio;

  	return p;
  }

  onMouseMove(event){
  	super.onMouseMove(event);
  	if (this.zoomOn)
	  	this.fillZoomBox();
  }

  zoomPlus() {
  	this.zoomOn = true;
  	this.zoomFactor += 0.1;
  	const modal = document.getElementById('myModal');
  	modal.style.top = '80%';
    modal.style.left = '5%';
    modal.style.width = '90%';
    modal.style.height = '20%'
    modal.style.position = 'fixed';
  	modal.style.display = 'flex';

  	this.fillZoomBox();
  	ZOOM_FACTOR = this.zoomFactor;

  }

  zoomMinus() {
  	this.zoomOn = true;
  	this.zoomFactor -= 0.1;
  	const modal = document.getElementById('myModal');
  	modal.style.top = '80%';
    modal.style.left = '5%';
    modal.style.width = '90%';
    modal.style.height = '20%'
    modal.style.position = 'fixed';
  	modal.style.display = 'flex';

  	this.fillZoomBox();
  	ZOOM_FACTOR = this.zoomFactor;
  }

  zoomClose() {
  	this.zoomOn = false;
  }

  fillZoomBox(mousePosition = null) {
  	if (!this.zoomOn)
  		return;
  	//var logBox = document.getElementById('log5');
  	var factor = this.zoomFactor;
  	const modal = document.getElementById('myModal');
  	const zoomBox = document.getElementById('zoomBox');
  	var modalBox = modal.getBoundingClientRect();
  	var ratioZoomBox = modalBox.width/this.imageDim.x*factor;

  	if (mousePosition == null) {
	  	mousePosition = new myPoint(this.mousePosition.x, this.mousePosition.y);

  	}

  	
  	
  	// Location of mouse cursor in pixels
  	var mouseLocPixels = this.coordToPixel(mousePosition, this.displayedImageDim.x);
  	
  	if (mouseLocPixels.x < 0) mouseLocPixels.x = 0;
  	if (mouseLocPixels.y < 0) mouseLocPixels.y = 0;
  	//convert the pixels to zoom box coordinates
  	var pos = new myPoint(ratioZoomBox*mouseLocPixels.x, ratioZoomBox*mouseLocPixels.y)
  	var maxXPos = modalBox.width*factor - modalBox.width ;
  	
  	
  	//Add offset to center of modal box
  	pos.x = pos.x - modalBox.width/2;
  	pos.y = pos.y - modalBox.height/2;
  	if (pos.x < 0) pos.x = 0;
  	if (pos.y < 0) pos.y = 0;
  	if (factor <= 1) pos.x = 0;
  	if (factor > 1 && pos.x>maxXPos) pos.x = maxXPos;
  	

  	zoomBox.style.backgroundSize = (factor*100) + '%';
  	zoomBox.style.backgroundPosition = -pos.x + 'px ' + (-pos.y) + 'px';
  	zoomBox.style.backgroundRepeat = "no-repeat"; 
  	
  }

  reinitialize(linesJson, widthImg) {
  	super.displayManuscript(widthImg)
  	this.refreshManuscript();	
  	super.reinitializeLines(linesJson);
  	super.refreshLines();
  }

}

//This class handles all the textboxes
class transcribeBlock extends manuscriptPage {
  constructor(imageWidth, canvasId="imgCanvas", imageId="manuscript") {
    super(imageWidth, canvasId, imageId);
  	this.textBoxArray = 0;  
  	// This holds a map of all textboxes that link them to an index
  	// The index is the associated lineArray
  	this.textBoxMap = new Map();
  	
  }

  getInputObject(minX, minY, maxX, maxY, canvasRect, angle=0, start_y=0) {
  	
  	var input = document.createElement('textarea');
		input.rows = 1;
		input.cols = 200;

		
		input.style.width = (maxX-minX) + 'px'; // Adjust the width as needed
		input.style.padding = '5px'; // Adjust the padding as needed
		input.placeholder = 'أدخل نصآ';
 
		input.style.backgroundColor = TEXTBOX_BACKGROUND;
		input.style.border = "transparent";
		input.style.color = "black";
		input.style.fontWeight = "bolder";

		input.style.position = 'absolute';
		input.style.left = canvasRect.left + window.scrollX + minX + 'px';
		input.style.top = canvasRect.top + window.scrollY + start_y - 25 + 'px';
		input.style.height = "50px"; //maxY - minY + 'px';
		input.setAttribute('lang', 'ar');
		input.setAttribute('dir', 'rtl');
		input.style.transform = "rotate("+angle+"deg)";
		input.style.transformOrigin = 100 + "% " + 100 + "%";
		return input;

  }
  initializeLines(linesJson) {
  	super.initializeLines(linesJson);
  	
  	
  	var minX=0, maxX=0, minY=0, maxY=0;
		let canvasRect = this.canvas.getBoundingClientRect();

  	this.textBoxArray = new Array(this.lineArray.length);
  	for (var i=0;i<this.textBoxArray.length;++i) {
  		[minX, minY, maxX, maxY] = this.lineArray[i].getCornerPts();
  		var [angle, start_y] = this.lineArray[i].getLineAngle_y();
  		let input = this.getInputObject(minX, minY, maxX, maxY, canvasRect, angle, start_y);
			// Append the main container div to the document body
			document.body.appendChild(input);
			this.textBoxArray[i] = input;
			input.addEventListener('keyup', keyUpEvent);
			input.addEventListener('focus', onTextAreaFocus);
			input.addEventListener('blur', onTextAreaBlur);
			this.textBoxMap.set(input, i);
			
			
  	}
    this.loadTextBoxes();  
  //	this.selectedIndex = 0;
  	this.refreshLines();

  	
  }

  reinitialize(linesJson, widthImg) {
  	super.displayManuscript(widthImg);
  	this.refreshManuscript(); 	
  	var minX=0, maxX=0, minY=0, maxY=0;
		let canvasRect = this.canvas.getBoundingClientRect();
  	super.reinitializeLines(linesJson);
  	super.refreshLines();

  	//this.textBoxArray = new Array(this.lineArray.length);
  	for (var i=0;i<this.textBoxArray.length;++i) {
  		[minX, minY, maxX, maxY] = this.lineArray[i].getCornerPts();
  		var [angle, start_y] = this.lineArray[i].getLineAngle_y();
  		let input = this.getInputObject(minX, minY, maxX, maxY, canvasRect, angle, start_y);
			// Append the main container div to the document body

			document.body.appendChild(input);
			//save text in old textbox
			var text = this.textBoxArray[i].value;
			//Remove the current textbox
			
			this.textBoxArray[i].value = "";
			this.textBoxArray[i].remove();
			//update the textbox
			this.textBoxArray[i] = input;
			this.textBoxArray[i].value = text;
			
			input.addEventListener('keyup', keyUpEvent);
			input.addEventListener('focus', onTextAreaFocus);
			input.addEventListener('blur', onTextAreaBlur);
			this.textBoxMap.set(input, i);
  	} 	
  }

  loadTextBoxes() {
      for (var i=0;i < this.textBoxArray.length;++i)
          this.textBoxArray[i].value = this.lineArray[i].text;
  }
    
    
  changeSelectedIndex() {
  	let index = this.selectedIndex;
  	if (index == -1)
  		return;
  	if (this.lineArray.length == 0)
  		return;

  	let ctx = this.canvas.getContext("2d");
  	ctx.save();
  	ctx.strokeStyle = SELECTED_LINE_STROKE;
    ctx.fillStyle = SELECTED_LINE_FILL;
    this.lineArray[index].stroke(ctx);
    this.lineArray[index].fill(ctx);

    this.textBoxArray[index].focus();

  	ctx.restore();
  }

  
      
getJsonString(submit=false, checked=false) {
    this.submit = submit;
    this.checked = checked;
    // set the value in textArray
    for (let i=0; i<this.textBoxArray.length; ++i) {
      this.lineArray[i].text = this.textBoxArray[i].value;
    }
    // Get the JSON with coordinates from parent object 
    let linesJsonString = super.getJsonString(submit);
    
        
    return linesJsonString;
  }  
  

  refreshLines() {
  	this.refreshManuscript();
  	let ctx = this.canvas.getContext("2d");

  	ctx.save();
    
    ctx.strokeStyle = EMPTY_STROKE_COLOR;
    ctx.fillStyle = EMPTY_FILL_COLOR;
    
    for (let i=0;i<this.lineArray.length;++i) {
    	this.textBoxArray[i].blur();
    	if (this.textBoxArray[i].value.length == 0) {
	    	this.lineArray[i].stroke(ctx);
  	    this.lineArray[i].fill(ctx);
  	  }
    }   
    ctx.strokeStyle = DATA_LINE_STROKE;
    ctx.fillStyle = DATA_LINE_FILL;
    for (let i=0;i<this.lineArray.length;++i) {
    	if (this.textBoxArray[i].value.length > 0) {
	    	this.lineArray[i].stroke(ctx);
  	    this.lineArray[i].fill(ctx);
  	  }
    }   

    ctx.restore();
    this.changeSelectedIndex();
  }

  inputEndKeyPressed() {
  	if (this.selectedIndex < 0 || this.selectedIndex >= this.lineArray.length)
  		return;
  	//only one line allowed
  	if (LINE_BY_LINE) {
  		let text = this.textBoxArray[this.selectedIndex].value;
  		if (text.length > 0 && text[text.length-1] == '\n')
  			text = text.replace('\n', "");
  			this.textBoxArray[this.selectedIndex].value = text.slice();
  	}
  	this.selectedIndex = (this.selectedIndex + 1) % this.lineArray.length;
  	this.refreshLines();
  	console.log(this.selectedIndex);
  	
  }
  MouseClick(mouseX, mouseY) {
  	
  	let ctx = this.canvas.getContext("2d");
  	let index = this.getSelectedLineIndex(ctx, mouseX, mouseY);
//    if (index == -1 ) 
//    	return;
    
    this.selectedIndex = index;
    this.refreshLines();

  }
  addLine(line) {

  	let canvasRect = this.canvas.getBoundingClientRect();
  	let newLine = line.createCopy(true);
  	
		let [minX, minY, maxX, maxY] = line.getCornerPts();
		let [angle, start_y] = line.getLineAngle_y();
  	let input = this.getInputObject(minX, minY, maxX, maxY, canvasRect, angle, start_y);
		// Append the main container div to the document body
		 document.body.appendChild(input);
		this.textBoxArray.push(input);
		input.addEventListener('keyup', keyUpEvent);
		input.addEventListener('focus', onTextAreaFocus);
		input.addEventListener('blur', onTextAreaBlur);
		this.textBoxMap.set(input, this.lineArray.length);

		this.lineArray.push(newLine);
		this.refreshLines();
  }

  changeLine(index, line) {
  	
  	//If index out of range
  	if (index < 0 || index >= this.lineArray.length || line==null)
  		return;
  	let canvasRect = this.canvas.getBoundingClientRect();
  	let newLine = line.createCopy(true);
  	
  	this.lineArray[index] = newLine;

		let [minX, minY, maxX, maxY] = line.getCornerPts();
		var [angle, start_y] = line.getLineAngle_y();
		this.textBoxArray[index].style.width = (maxX-minX) + 'px';
		this.textBoxArray[index].style.height = "50px";//(maxY-minY) + 'px';
  	this.textBoxArray[index].style.left = canvasRect.left + window.scrollX + minX + 'px';
		this.textBoxArray[index].style.top = canvasRect.top + window.scrollY + start_y - 25 + 'px';
		this.textBoxArray[index].style.transform = "rotate("+angle+"deg)";
		this.textBoxArray[index].style.transformOrigin = 100 + "% " + 100 + "%";
		this.selectedIndex = -1;
		this.refreshLines();  
	}

	deleteLine(index) {
		if (index < 0 || index >= this.lineArray.length)
  		return;
  	this.lineArray.splice(index, 1);
  	document.body.removeChild(this.textBoxArray[index]);
		this.textBoxArray.splice(index, 1);

		this.selectedIndex = -1;
		this.refreshLines();

	}
	onTextAreaFocus(event) {
		let textElement = event.target;
		if (!this.textBoxMap.has(textElement))
			return;

		for (var i=0;i<this.textBoxArray.length;++i) {
			this.textBoxArray[i].style.visibility = "hidden";
		}

		textElement.classList.toggle("form-control");
		textElement.style.color = "black";
		textElement.style.visibility = "visible";
		textElement.style.backgroundColor = SELECTED_TEXTBOX_BACKGROUND;
		let index = this.textBoxMap.get(textElement);
		if (index < this.lineArray.length && index >= 0) {
			this.lineArray[index].transcribeTimeStart = new Date();
		}



	}

	onTextAreaBlur(event) {
		let textElement = event.target;
		if (!this.textBoxMap.has(textElement))
			return;
		textElement.classList.toggle("form-control");
		textElement.style.backgroundColor = TEXTBOX_BACKGROUND;
		for (var i=0;i<this.textBoxArray.length;++i) {
			this.textBoxArray[i].style.visibility = "visible";
		}
		let index = this.textBoxMap.get(textElement);
		if (index < this.lineArray.length && index >= 0) {
			this.lineArray[index].transcribeTime += Math.round((new Date() - 
				                                     this.lineArray[index].transcribeTimeStart)/1000);
		}
	}

	convertNumberToArabic(text) {

		var id = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
 			return text.replace(/[0-9]/g, function(w){
  			return id[+w]
 			});
	}

	convertNumbers() {

		// IF a line is selected change only that line
		if (this.selectedIndex >= 0 && this.selectedIndex < this.textBoxArray.length) {
			  let i = this.selectedIndex;
			  let text = this.textBoxArray[i].value;
				let convertedText = this.convertNumberToArabic(text);
				this.textBoxArray[i].value = convertedText;
		}
		else {
			// otherwise change all lines	
			for (var i=0;i<this.textBoxArray.length;++i) {
				let text = this.textBoxArray[i].value;
				let convertedText = this.convertNumberToArabic(text);
				this.textBoxArray[i].value = convertedText;
		}
	}
	}


} //end of class transcribeBlock

function appendImg(img_src, id) {
	img_node = document.createElement("IMG");
	img_node.id = id;
	img_node.src = img_src;
	img_node.hidden = true;
	document.body.appendChild(img_node);
}

function fill_select_json_files(json_obj) {
	leftSelect = document.getElementById("leftSelect")
	// Left side selection
	for (let i=0;i<json_obj.fileList.length;++i) {
      let opt = document.createElement("option");
      opt.innerHTML = json_obj.fileList[i];
      leftSelect.appendChild(opt);      
  }
  leftSelect.selectedIndex = 0;
}



function initPage(leftImg, rightImg, jsonObj){

	// Make the relevant button visible
  if (!CHECKING) {
    var button = document.getElementById("checkTranscript");
    button.style.display = "none";
  }
  else {
    var button = document.getElementById("submitTranscript");
    button.style.display = "none";
  }

	JSON_OBJ = jsonObj;
	// Set the image labels
	document.getElementById("leftImageName").innerHTML = leftImg;
	document.getElementById("rightImageName").innerHTML = rightImg;
	// Create the image nodes in document
	leftCanvas = document.getElementById("leftCanvas");
	rightCanvas = document.getElementById("rightCanvas");
	appendImg(leftImg, "leftSideImage");
	appendImg(rightImg, "rightSideImage");
	
	//Creat the left and right page
	let widthImg = getImageWidth();
	LEFT_PAGE = new transcribeBlock(widthImg, "leftCanvas", "leftSideImage");
	RIGHT_PAGE = new annotateBlock(widthImg, "rightCanvas", "rightSideImage");

	//Set the select options
	fill_select_json_files(jsonObj);
	// If no json object then create a dummy json
	// handleEmptyJson();
  makeDefaultSelections();
  addEventListeners();
  //LEFT_PAGE.changeSelectedIndex(0);
  
  
}

function addEventListeners() {
	rightCanvas = document.getElementById("rightCanvas");
	rightCanvas.addEventListener("mousemove",onMouseMove);
  rightCanvas.addEventListener("mousedown",onMouseDown);
  rightCanvas.addEventListener("mouseup",onMouseUp);
  leftCanvas.addEventListener("mousemove", onMouseMove)
  document.addEventListener("click", onMouseClick);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("lineAdded", onAddLine);
  //document.addEventListener("lineChangedEvent", onChangeLine);
  window.addEventListener("resize", onWindowResize);

	rightCanvas.addEventListener('mouseenter', function() {
  	MOUSE_IN_RIGHT_CANVAS = true;
	});

	rightCanvas.addEventListener('mouseleave', function() {
  	MOUSE_IN_RIGHT_CANVAS = false;
	});

 
}

// To correct the problem with moving annotation
function getImageWidth() {
	let widthLeft = leftCanvas.getBoundingClientRect().width;
	let widthRight = rightCanvas.getBoundingClientRect().width;
	if (widthLeft != widthRight)
		alert("widths are not equal");
	return Math.min(widthLeft, widthRight);
}


function onWindowResize() {
	//alert("window resized");
	//Get all the updated lines before moving the canvas
	let jsonObject = JSON.parse(LEFT_PAGE.getJsonString());
	let widthImg = getImageWidth();
	RIGHT_PAGE.reinitialize(jsonObject, widthImg);	
	LEFT_PAGE.reinitialize(jsonObject, widthImg);
}

function onMouseMove(event) {

	MOUSE_X = event.clientX;
  MOUSE_Y = event.clientY;

	if (event.target.id == "rightCanvas")
		RIGHT_PAGE.onMouseMove(event);

	else if (event.target.id == "leftCanvas" && RIGHT_PAGE.zoomOn) {
		mousePosition = new myPoint(event.offsetX, event.offsetY);
		RIGHT_PAGE.fillZoomBox(mousePosition);
	}
}

function onMouseDown(event) {
	if (event.target.id == "rightCanvas")
		RIGHT_PAGE.onMouseDown(event);
}

function onMouseUp(event) {
  if (event.target.id == "rightCanvas")
	  RIGHT_PAGE.onMouseUp(event);
}

function onKeyDown(event) {

	rightCanvas = document.getElementById("rightCanvas")
	const canvasBounds = rightCanvas.getBoundingClientRect();
	if (!MOUSE_IN_RIGHT_CANVAS)
		return;
  //This shoudl delete selected line
  if (event.key == "Delete" || event.key == "Backspace")
    onDeleteButton();  
  //This should start draw mode
  else if (event.key == '+')
    onDrawButton();
  //this is to delete a control point
  else if (event.key == '-')
    RIGHT_PAGE.onMinusPressed();
  //this is to add a control point
  else if (event.key == 'p')
    RIGHT_PAGE.onAddControlPointPressed();  
  // copy for paste later
  if ((event.key == 'c') && event.ctrlKey)
    RIGHT_PAGE.copyClicked();
  //for pasting after copy
  else if ((event.key == 'v') && event.ctrlKey)
    RIGHT_PAGE.pasteClicked();  

  document.getElementById("rightCanvas").tabIndex = 1;
}

function pointInBounds(rect, x, y) {
	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}


function onMouseClick(event) {

	leftCanvas = document.getElementById("leftCanvas")
	const canvasBounds = leftCanvas.getBoundingClientRect();
	const mouseX = event.clientX;     //incorrect to subtract- canvasBounds.left;
  const mouseY = event.clientY; //- canvasBounds.top;
  
  
	
  //if right page clicked
	if (event.target.id == "rightCanvas") {
	  if (event.detail == 2) {
  	  RIGHT_PAGE.onMouseDoubleClick(event);
    	
  	}
  	else if (event.detail == 1)
    	RIGHT_PAGE.onMouseClick(event);
  }
	//else if draw button clicked	
	else if (event.target.id == "drawButton") {
		onDrawButton();
	
	}
	else if (pointInBounds(canvasBounds, mouseX, mouseY)) {  	
		//subtract here to get relative position
		LEFT_PAGE.MouseClick(mouseX - canvasBounds.left, mouseY- canvasBounds.top);
		index = LEFT_PAGE.getSelectedIndex();
		RIGHT_PAGE.restoreNormal(index);
  } 
}


// Event for text area
function keyUpEvent(event) {

	if (event.key == 'Enter' && LINE_BY_LINE) {
		LEFT_PAGE.inputEndKeyPressed();
		event.stopPropagation();

		index = LEFT_PAGE.getSelectedIndex();
		RIGHT_PAGE.changeSelectedIndexForView(index);
	}

	if ((event.key == 'Escape') || (event.key == 'Tab'))	{
		LEFT_PAGE.inputEndKeyPressed();
		event.stopPropagation();

		index = LEFT_PAGE.getSelectedIndex();
		RIGHT_PAGE.changeSelectedIndexForView(index);
		
	}
}

// Event for text area
function onTextAreaFocus(event) {
	LEFT_PAGE.onTextAreaFocus(event);
}

function onTextAreaBlur(event) {
	LEFT_PAGE.onTextAreaBlur(event);
}	



function postViewForm(flag) {

	if (LEFT_PAGE.canvas.height == 0 || RIGHT_PAGE.canvas.height==0)
            document.location.reload();


	if (flag < 1 || flag > 6)
        return;
  let submit = false;
  let checked = false;

  //Previous pressed
	if (flag == 1) {
		document.getElementById('transcribeInput').name='previous';
	}
	//next pressed
	else if (flag == 2) {
		document.getElementById('transcribeInput').name='next';
	}
    //save pressed
  else if (flag == 3) {
    document.getElementById('transcribeInput').name='save';
  }
    //end pressed
  else if (flag ==4) {
    document.getElementById('transcribeInput').name='end';
  }
	else if (flag == 5) {
		
    if (!confirm("Are you sure you want to submit this transcription?")) {
    		
        document.getElementById('transcribeInput').name='save';
      }
    	// Submit clicked
    	else {
	    	document.getElementById('transcribeInput').name='submit';
      	submit = true;
      }
      
  }
  else if (flag == 6) {
  	
    if (!confirm("Save this transcription as checked?")) {
    		
    		document.getElementById('transcribeInput').name='save';
        
      }
      else {
    	// checked clicked
    	document.getElementById('transcribeInput').name='checked';
    	checked = true;
  	}
    
    

  }


  let options = {"radius": RADIUS, "lineWidth": DRAW_LINE_WIDTH, 
  								"zoomFactor": ZOOM_FACTOR, 
  							  "colWidth": COL_WIDTH}
  let scrollPosition = getScrollPosition();
  let image_name = document.getElementById("rightImageName").innerHTML
  let jsonToPost = {"images_obj": IMAGES, "admin": ADMIN, 
                     "page_json": LEFT_PAGE.getJsonString(submit, checked),
                     "scroll_position": {"x": scrollPosition.x, "y": scrollPosition.y},
                     "options":options};

  document.getElementById('transcribeInput').value= JSON.stringify(jsonToPost);
  document.getElementById('transcribeForm').submit();
}


function handleEmptyJson() {
	let selectedFile = document.getElementById("leftSelect");
  let ind = selectedFile.selectedIndex;
  filename = selectedFile.options[ind].innerHTML;
	let linesJson = JSON_OBJ[filename];
	let totalLines = 0;
	for (var key in linesJson){
      if (!key.startsWith("line"))
        continue;
      if ("deleted" in linesJson[key] && linesJson[key].deleted == "1")
        continue;
      totalLines += 1;
  }
  // Commenting out this block.
  // Add a default box around the whole page for transcription
  //if (totalLines == 0) {
  //	image = document.getElementById("leftSideImage");
  //	ht = this.image.naturalHeight;
  //	width = this.image.naturalWidth;

  //	linesJson = {"line_1":{"coord": [0, 0, 0, ht-1, width-1, ht-1, width-1, 0]}};
  //	JSON_OBJ[filename] = linesJson;
  //}

}

function makeDefaultSelections() {
    let selectedFile = document.getElementById("leftSelect");
    let ind = selectedFile.selectedIndex;
    filename = selectedFile.options[ind].innerHTML;
    LEFT_PAGE.refreshManuscript();
    LEFT_PAGE.initializeLines(JSON_OBJ[filename]);    
    RIGHT_PAGE.initializeLines(JSON_OBJ[filename]);

    //fill writer and comments
  	if ('writer' in JSON_OBJ[filename])
  		writer.value = JSON_OBJ[filename].writer;
  	if ('comment' in JSON_OBJ[filename])
  		comment.value = JSON_OBJ[filename].comment

}

function onDrawButton() {
	
	RIGHT_PAGE.onPencilClick();
}

function onAddLine() {
	scrollPosition = getScrollPosition();

	line = RIGHT_PAGE.getLastLine();
	LEFT_PAGE.addLine(line);

	window.scrollTo(scrollPosition.x, scrollPosition.y);


}

function onChangeLine(event) {

	
	scrollPosition = getScrollPosition();
	index = event.detail.lineIndex;
	line = RIGHT_PAGE.getLine(index);
	LEFT_PAGE.changeLine(index, line);
	window.scrollTo(scrollPosition.x, scrollPosition.y);
	
	//document.getElementById("log").innerHTML = LEFT_PAGE.getJsonString();
	//document.getElementById("log0").innerHTML = RIGHT_PAGE.getJsonString();
}

function onDeleteButton(event) {
	scrollPosition = getScrollPosition();
	if (!confirm("Are you sure you want to delete the line?")) {
		window.scrollTo(scrollPosition.x, scrollPosition.y);
		return;
	}
	let index = RIGHT_PAGE.deleteLine();
	//delete from left page
	LEFT_PAGE.deleteLine(index);
	window.scrollTo(scrollPosition.x, scrollPosition.y);
} 

function getScrollPosition() {
	var scrollPosition = {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  };
  return scrollPosition;
}



function zoomPlusClicked() {
	//Get all the updated lines before moving the canvas
	let jsonObject = JSON.parse(LEFT_PAGE.getJsonString());
	COL_WIDTH++;
	document.getElementById("leftColumn").className = 'col-md-' + COL_WIDTH;
	document.getElementById("rightColumn").className = 'col-md-' + COL_WIDTH;
	let widthImg = getImageWidth();
	RIGHT_PAGE.reinitialize(jsonObject, widthImg);	
	LEFT_PAGE.reinitialize(jsonObject, widthImg);
	

}
function zoomMinusClicked() {
	//Get all the updated lines before moving the canvas
	let jsonObject = JSON.parse(LEFT_PAGE.getJsonString());
	COL_WIDTH--;
	document.getElementById("leftColumn").className = 'col-md-' + COL_WIDTH;
	document.getElementById("rightColumn").className = 'col-md-' + COL_WIDTH;	
	let widthImg = getImageWidth();
	RIGHT_PAGE.reinitialize(jsonObject, widthImg);	
	LEFT_PAGE.reinitialize(jsonObject, widthImg);
	
}

function closeModal() {
  const modal = document.getElementById('myModal');
  modal.style.display = 'none';
  RIGHT_PAGE.zoomClose();
}


function zoomBoxPlusClicked() {
	RIGHT_PAGE.zoomPlus();
}

function zoomBoxMinusClicked() {
	RIGHT_PAGE.zoomMinus();
}

function changeLineSize(event) {
	DRAW_LINE_WIDTH = Number(document.getElementById("lineSize").value)/5;
	event.stopPropagation();
}

function changeRadius(event) {
	RADIUS = Number(document.getElementById("radius").value);
	event.stopPropagation();

}

function getSetOptions() {
	COL_WIDTH = OPTIONS['colWidth'];
	RADIUS = OPTIONS['radius'];
	DRAW_LINE_WIDTH = OPTIONS['lineWidth'];
	ZOOM_FACTOR = OPTIONS['zoomFactor']
	document.getElementById("lineSize").value = DRAW_LINE_WIDTH*5;
	document.getElementById("radius").value = RADIUS;


}

// Convert numbers to Arabic
function ConvertNumbers() {
	LEFT_PAGE.convertNumbers();
}