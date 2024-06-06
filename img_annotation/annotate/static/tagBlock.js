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
let TAG_CHECKBOX_ID = "tagCheckBox";
// For tagging
let REGION_FILL_COLOR = "rgba(20, 20, 250, 0.1)";
let TAGGED_STROKE_COLOR = "rgba(0, 0, 255, 0.5)";
let BUTTON_TEXT_NO_TAG = "<i class='fa'>&#xf150</i>"
let BUTTON_TEXT_TAG = "<i class='fa'>&#xf191</i>"
let SELECTED_BUTTON_BK_COLOR = "rgba(0, 0, 128, 0.5)";
let NORMAL_BUTTON_BK_COLOR = "rgba(211, 211, 211, 0.5)";
let TAG_DIV_CONTAINER = "TAG_DIV_CONTAINER-";

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

  getInputObject(minX, minY, maxX, maxY, canvasRect, angle=0, start_y=0, 
  	             vertical=false) {
  	
  	let ht="50px";
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
		input.style.height = ht; 
		input.setAttribute('lang', 'ar');
		input.setAttribute('dir', 'rtl');
		input.style.transform = "rotate("+angle+"deg)";
		input.style.transformOrigin = 100 + "% " + 100 + "%";
		if (vertical){
			//angle = -90 or 90;
			input.style.width = (maxY-minY) + 'px';
			input.style.top = canvasRect.top + window.scrollY + minY + 'px';
			input.style.left = canvasRect.left + window.scrollX + minX + 'px';
			input.style.height = ht; 
			input.style.transformOrigin = "0% 0%";
			input.style.transform = "rotate("+angle+"deg)";
			//bottom to top
			input.style.top = canvasRect.top + window.scrollY + minY + 'px';
			input.style.left = canvasRect.left + window.scrollX + maxX + 'px';
			if (angle < 0) { //top to bottom
				input.style.top = canvasRect.top + window.scrollY + maxY + 'px';
				input.style.left = canvasRect.left + window.scrollX + minX + 'px';
			}
		}

		return input;

  }
  initializeLines(linesJson) {
  	super.initializeLines(linesJson);
  	let vertical = false;
  	
  	var minX=0, maxX=0, minY=0, maxY=0;
		let canvasRect = this.canvas.getBoundingClientRect();

  	this.textBoxArray = new Array(this.lineArray.length);
  	for (var i=0;i<this.textBoxArray.length;++i) {
  		vertical = false;
  		[minX, minY, maxX, maxY] = this.lineArray[i].getCornerPts();
  		var [angle, start_y] = this.lineArray[i].getLineAngle_y();
  		if (this.lineArray[i].isVerticalOrientation()) {
  			vertical = true;
  			if (this.lineArray[i].isVerticalTopDown()){
  				angle = -90;
  			}
  			else {
  				angle = 90
  			}
  		}
  		let input = this.getInputObject(minX, minY, maxX, maxY, canvasRect, angle, 
  																		start_y=start_y, vertical=vertical);
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
  	let vertical = false;

  	//this.textBoxArray = new Array(this.lineArray.length);
  	for (var i=0;i<this.textBoxArray.length;++i) {
  		vertical = false;
  		[minX, minY, maxX, maxY] = this.lineArray[i].getCornerPts();
  		var [angle, start_y] = this.lineArray[i].getLineAngle_y();

  		if (this.lineArray[i].isVerticalOrientation()) {
  			vertical = true;
  			if (this.lineArray[i].isVerticalTopDown()){
  				angle = -90;
  			}
  			else {
  				angle = 90
  			}
  		}

  		let input = this.getInputObject(minX, minY, maxX, maxY, canvasRect, angle, start_y, vertical);
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
    
    // TODO: get a better way of doing this
    // Copy all tags from right page to left page
    // Get the JSON with coordinates from parent object 
      this.lineArray[i].copyTags(RIGHT_PAGE.lineArray[i].tagDict);
    }
    let linesJsonString = super.getJsonString(submit);
    let jsonObject = JSON.parse(linesJsonString);
    jsonObject['transcriber'] = ANNOTATOR;
    jsonObject['taggingBy'] = ADMIN['user'];

    return JSON.stringify(jsonObject);
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
		let vertical = false;
		if (line.isVerticalOrientation()) {
  			vertical = true;
  			if (line.isVerticalTopDown()){
  				angle = -90;
  			}
  			else {
  				angle = 90
  			}
  		}

  	let input = this.getInputObject(minX, minY, maxX, maxY, canvasRect, angle, start_y, vertical);
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
  	
  	let vertical = false;
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

		//check if vertical
		if (this.lineArray[index].isVerticalOrientation()) {
			vertical = true;
			if (this.lineArray[index].isVerticalTopDown()){
				angle = -90;
			}
			else {
				angle = 90
			}
			let input = this.textBoxArray[index];
  		input.style.width = (maxY-minY) + 'px';
			input.style.height = "50px"; 
			input.style.top = canvasRect.top + window.scrollY + minY + 'px';
			input.style.left = canvasRect.left + window.scrollX + maxX + 'px';
			input.style.transformOrigin = "0% 0%";
			input.style.transform = "rotate("+angle+"deg)";
			//bottom to top
			input.style.top = canvasRect.top + window.scrollY + minY + 'px';
			input.style.left = canvasRect.left + window.scrollX + maxX + 'px';
			if (angle < 0) { //top to bottom
				input.style.top = canvasRect.top + window.scrollY + maxY + 'px';
				input.style.left = canvasRect.left + window.scrollX + minX + 'px';
			}


  		}


		this.selectedIndex = -1;
		this.refreshLines();  
	}

	deleteLine(index) {
		if (index < 0 || index >= this.lineArray.length)
  		return;
  	this.lineArray.splice(index, 1);
  	document.body.removeChild(this.textBoxArray[index]);
		this.textBoxArray.splice(index, 1);

		//update the textBoxMap
		for (var i=index;i<this.textBoxArray.length;++i)
			this.textBoxMap.set(this.textBoxArray[i], i);

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


class tagBlock extends annotateBlock {
  constructor(imageWidth, canvasId="imgCanvas", imageId="manuscript") {
    super(imageWidth, canvasId, imageId);
  	this.tagButtonArray = 0;  
  	// This holds a map of all buttons that link them to an index
  	// The index is for the associated lineArray
  	this.tagButtonMap = new Map();
  	this.openButtonIndex = -1;
  }

  // for a particular line, get the top left coordinates of button
  getButtonTopLeft(lineIndex) {
  	var canvasRect = this.canvas.getBoundingClientRect();
  	var minX, minY, maxX, maxY;
  	[minX, minY, maxX, maxY] = this.lineArray[lineIndex].getCornerPts();
    // Find closest polygon point to (minX, maxY)
    let pt =  this.lineArray[lineIndex].getClosestPoint(new myPoint(minX, minY))
    minX = pt.x;
    minY = pt.y;

  	var left = canvasRect.left + minX + window.scrollX; //  + 'px';
  	var top = canvasRect.top + minY + window.scrollY; // + 'px';


  	var pos={'left': left, 'top':top};
  	return pos;

  }

  // If tag dictionary is present in Json, it would be passed here. Otherwise tagDict is none
  addItemToTags(ul, text, tagDict, uniqueId){
    ul.style.cssText = "list-style-type:none;border: 1px solid #ddd;width:200px";    
    var li = document.createElement('li');//li

    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.value = text;
    checkbox.name = text;
    checkbox.id = TAG_CHECKBOX_ID + '-' + uniqueId + '-' + text;;
    //Check if text is in tagDict
    if (tagDict != null && text in tagDict){
    	checkbox.checked = (tagDict[text] == 1);
    }
    checkbox.addEventListener("click", onTagCheckBoxClicked)

    var label = document.createElement('label');
    var textNode = document.createTextNode(text);
    
    label.appendChild(checkbox);
    label.appendChild(textNode);
    label.htmlFor = checkbox.id;
    
    li.appendChild(label);   
    
    ul.appendChild(li); 
}


	// create a unique id and use it to create more ids
  // for button, list, checkbox items
  createTagButton(position, index, tagDict) {
	  
	  var uniqueId =  Date.now() + parseInt(Math.random()*1e6); //Hopefully a unique id
	  var button = document.createElement("button");
        
    
    //button.style.position = 'absolute';
	  //button.style.top = (position.top - 20) + "px";
	  //button.style.left = (position.left - 20) + "px";
    //Assign different attributes to the element. 
      button.type = "button";
      button.class = "btn btn-link btn-sm"; 
      button.setAttribute("data-bs-toggle", "collapse"); 
      button.id = 'button-' + uniqueId;
      //button.style = "padding:0px;border:1px solid #ddd";
      button.style.color = "black";
      button.setAttribute("data-bs-target", "#" + 'tagList-' + uniqueId) ;
	  // create the collapse div
    var collapseDiv = document.createElement('div');
    collapseDiv.style.minHeight = "120px";
    collapseDiv.className = 'collapse collapse-horizontal';
    collapseDiv.id = 'tagList-' + uniqueId;

    // create the card div with the list inside
    var cardDiv = document.createElement('div');
    cardDiv.className = 'card card-body';

    var ul = document.createElement('ul');
    var tagged = false;
    for (var i=0;i<TAG_ITEMS.length;++i) {
    	var item = TAG_ITEMS[i];
        this.addItemToTags(ul, item, tagDict, uniqueId);
        if (tagDict[item] == 1) tagged = true;
    }

    //Change button according to tags
    this.setTaggedButtonStyle(button, tagged);
    cardDiv.appendChild(ul);
    collapseDiv.appendChild(cardDiv);


    // Create the container div
    var containerDiv = document.createElement('div');

    containerDiv.id = TAG_DIV_CONTAINER + uniqueId

    // Append the button and the collapse div to the container div
    containerDiv.appendChild(button);
    containerDiv.appendChild(collapseDiv);

    containerDiv.style.position = 'absolute';
	  containerDiv.style.top = (position.top - 25) + "px";
	  containerDiv.style.left = (position.left - 25) + "px";
    document.body.appendChild(containerDiv);
    
    //button.addEventListener("click", tagButtonClicked);

	  return button;
	}
	closeOpenBoxes(index) {
		if (this.openButtonIndex < 0 || this.openButtonIndex >= this.lineArray.length)
			return false;
		if (index == this.openButtonIndex)
			return false;

		var button = this.tagButtonArray[this.openButtonIndex];

		var tagListId = button.getAttribute('data-bs-target').slice(1);

		var tagList = document.getElementById(tagListId);


		if (tagList.classList.toggle("show"))
			tagList.classList.toggle("show");
		this.openButtonIndex = -1;
	}

	// To discard
	onTagButtonClicked(event) {
		
		var button = event.delegateTarget;
		event.preventDefault();
		var index = this.tagButtonMap.get(button);
		if (index < 0)
			return;
		//some other line already selected
		if (this.getSelectedIndex() >= 0 && index != this.getSelectedIndex())
			return;

		var tagListId = button.getAttribute('data-bs-target').slice(1);

		var tagList = document.getElementById(tagListId);
		this.closeOpenBoxes(index);
		if (tagList.classList.toggle("show"))
			this.openButtonIndex = index;
		else
			this.openButtonIndex = -1;

			

		
		super.changeSelectedIndexForView(index);
	}

  initializeLines(linesJson) {
  	var minX, maxX, minY, maxY;
  	var tagDict = null;
  	super.initializeLines(linesJson);
  	
  	
  	var minX=0, maxX=0, minY=0, maxY=0;
		
  	this.tagButtonArray = new Array(this.lineArray.length);
  	for (var i=0;i<this.tagButtonArray.length;++i) {
  		tagDict = this.lineArray[i].tagDict;
  		var pos = this.getButtonTopLeft(i);
  		var button = this.createTagButton(pos, i, tagDict);   		
  		this.tagButtonArray[i] = button;
		this.tagButtonMap.set(button, i);
			//document.body.appendChild(button);
			
  	}

  }
  setTaggedButtonStyle(button, tagged) {
      if (!tagged) {
        button.innerHTML = BUTTON_TEXT_NO_TAG;
        button.style.color = NORMAL_COLOR;
        //button.style.background = NORMAL_COLOR;
      }
      else {
        button.innerHTML = BUTTON_TEXT_TAG;
        button.style.color = TAGGED_STROKE_COLOR;      
        //button.style.background = NORMAL_COLOR;    
      }
  }

  onTagCheckBoxClicked(event) {
  	let vertical = false;
		// checkbox id has index of line and list item
		var id = event.target.id;
		if (!id.includes(TAG_CHECKBOX_ID))
			return [-1, false];
		var uniqueId = id.substring(id.indexOf('-') + 1, id.lastIndexOf('-'));
		
		// Find the index of button in tagButtonArray
		var button = document.getElementById('button-'+uniqueId);
		if (!button) {
			alert('Could not find the parent element for checkbox');
			return [-1, false];
		} 

		var index = this.tagButtonMap.get(button);
		if (index < 0 || index >= this.lineArray.length) {
			alert('Could not find the index for checkbox');
			return [-1, false];
		}

		var key = event.target.value;
		this.lineArray[index].tagDict[key] = +event.target.checked;
    // Set button styles
    if (event.target.checked) {
        this.setTaggedButtonStyle(button, true);
    }
    else {
        var tagged = this.lineArray[index].isTagged();
        this.setTaggedButtonStyle(button, tagged);
        
    }

    if (this.lineArray[index].isVerticalOrientation())
    	vertical = true;

    return [index, vertical];
            
  }



	

  reinitialize(linesJson, widthImg) {
  	super.reinitialize(linesJson, widthImg);
  	var minX, maxX, minY, maxY;

  	for (var i=0;i<this.tagButtonArray.length;++i) {
  		//var position = this.textBoxArray[i].getBoundingClientRect();
  		var pos = this.getButtonTopLeft(i);
  		var left = pos.left;
  		var top = pos.top;
  		var containerDiv = this.tagButtonArray[i].parentNode;
  		containerDiv.style.position = 'absolute';
	  	containerDiv.style.top = top + "px";
	  	containerDiv.style.left = left + "px";
  	} 	
  }
    // Overloading
	setNormalMode() {
		var minX, maxX, minY, maxY;
		var canvasRect = this.canvas.getBoundingClientRect(); 
		var index = -1;
		if (this.lineChanging != -1) {
			index = this.lineChanging;
		}
  	
  	if (index < 0 || index >= this.lineArray.length) {
  		super.setNormalMode();
  		return;
  	}

  	var position = this.getButtonTopLeft(index);
  	var left = position.left;
  	var top = position.top;
  	
		var containerDiv = this.tagButtonArray[index].parentNode;
		containerDiv.style.position = 'absolute';
  	containerDiv.style.top = top + "px";
  	containerDiv.style.left = left + "px";
	
  	super.setNormalMode();

  	if (SHOW_TAGS) {
  		this.showTags(true);    
  	}
  	else {
  		this.showTags(false); 
  	}

  }

  //opverloading
  onPencilClick() {
      
    //Cannot draw in edit mode
    if (this.editing)
      return;  
    //Hide all buttons
    this.showTags(false);    
    super.onPencilClick();
    
  }

  //overloading
  pencilDoubleClick(event) {
  	let totalLines = this.lineArray.length;
  	super.pencilDoubleClick(event);
  	this.showTags(SHOW_TAGS);
  	// Was line added
  	let lastIndex = this.lineArray.length - 1;
  	//Check if line was added
  	if (lastIndex != totalLines) 
  		return;

  	//Add the tag button
  	var tagDict = this.lineArray[lastIndex].tagDict;
  	var pos = this.getButtonTopLeft(lastIndex);
  	var button = this.createTagButton(pos, lastIndex, tagDict);   		
  	this.tagButtonArray[lastIndex] = button;
		this.tagButtonMap.set(button, lastIndex);
		if (!SHOW_TAGS) {
			this.tagButtonArray[lastIndex].parentElement.classList.add("invisible");
		}

  }

//overloaded
pasteClicked() {
		let totalLines = this.lineArray.length;
		super.pasteClicked();
		// Was line added
  	let lastIndex = this.lineArray.length - 1;
  	//Check if line was added
  	if (lastIndex != totalLines) {
  		return;
  	}

  	//Add the tag button
  	var tagDict = this.lineArray[lastIndex].tagDict;
  	var pos = this.getButtonTopLeft(lastIndex);
  	var button = this.createTagButton(pos, lastIndex, tagDict);   		
  	this.tagButtonArray[lastIndex] = button;
		this.tagButtonMap.set(button, lastIndex);
		if (!SHOW_TAGS) {
			this.tagButtonArray[lastIndex].parentElement.classList.add("invisible");
		}
  	
	}


  deleteLine() {
      	let index = this.selectedIndex;
      	if (index < 0 || index >= this.lineArray.length)
      		return;
    
      	var button = this.tagButtonArray[index];
      	var divContainer = button.parentNode;
      	while (divContainer.firstChild) {
      		divContainer.removeChild(divContainer.lastChild);
      	}
      	divContainer.remove();
    
      	this.tagButtonArray.splice(index, 1);
    
      	//update map
      	for (var i=index;i<this.tagButtonArray.length;++i)
    			this.tagButtonMap.set(this.tagButtonArray[i], i);
    
      	index = super.deleteLine();
      	return index;
  }

  //overloaded
  setMoveMode() {
  	super.setMoveMode();
  	this.showTags(false);
  } 

  //overloaded
  setEditMode() {
  	super.setMoveMode();
  	this.showTags(false);
  }
  

  // called on mouse move
  //overloaded function to show tags added
  changeColors(ctx, x, y){
    ctx.save();
    //we may have more than one selected
    for (let i = 0;i < this.lineArray.length; ++i){
      const isPointInPoly = this.lineArray[i].isPointInPath(ctx, x, y);
      if (isPointInPoly) {
          ctx.fillStyle = MOVE_STYLE;
          this.lineArray[i].fill(ctx);
          this.lineArray[i].stroke(ctx);   
          this.tagButtonArray[i].style.background = SELECTED_BUTTON_BK_COLOR;
      }    
    } //end for
    ctx.restore();
  }

  // Overloading to show tagged areas
  refreshLines() {
    var key, value;
    let ctx = this.canvas.getContext("2d");
    ctx.save();
    for (let i=0;i<this.lineArray.length;++i) {
      // First check if region shoujld be filled
      var tagged = false;
      for (key in REGION_KEYS) {
          var k = REGION_KEYS[key];
          if (this.lineArray[i].tagDict[k]) {
              ctx.fillStyle = TAG_DICTIONARY[k]; //REGION_FILL_COLOR;
              this.lineArray[i].fill(ctx);
              tagged = true;
              //this.tagButtonArray[i].style.color = TAGGED_STROKE_COLOR;
              if (i < this.tagButtonArray.length)
                  this.tagButtonArray[i].style.background = NORMAL_BUTTON_BK_COLOR;
              break
          }
          
      } //change stroke color if tag assigned
      for (let [key, value] of Object.entries(TAG_DICTIONARY)) {
          
          if (this.lineArray[i].tagDict[key]) {
            ctx.strokeStyle = TAGGED_STROKE_COLOR;
            this.lineArray[i].stroke(ctx);
            tagged = true;
            //this.tagButtonArray[i].style.color = TAGGED_STROKE_COLOR;
            if (i < this.tagButtonArray.length)
                this.tagButtonArray[i].style.background = NORMAL_BUTTON_BK_COLOR;

            if (key.startsWith('Region')) {
                  ctx.fillStyle = TAG_DICTIONARY[key];//REGION_FILL_COLOR;
                  this.lineArray[i].fill(ctx);
          }
            break;
          } //end outer if
      }
      if (!tagged) {
          // If no tag selected
          ctx.strokeStyle = "black";
          this.lineArray[i].stroke(ctx);
          //this.tagButtonArray[i].style.color = NORMAL_COLOR;
          if  (i < this.tagButtonArray.length)
                  this.tagButtonArray[i].style.background = NORMAL_BUTTON_BK_COLOR;
      }
    }    //end outer for loop
    ctx.restore();
  } //end refresh lines

  showTags(show){
      for (var i=0;i<this.tagButtonArray.length;++i) {
        if (show) {
        	//making the parent div container invisible/visible to avoid mouse clicks going there
        	this.tagButtonArray[i].parentElement.classList.remove("invisible");
        }
        else {
            this.tagButtonArray[i].parentElement.classList.add("invisible");
        }
    }
  }

} //end of class tagBlock




function onTagCheckBoxClicked(event) {
	let [index, vertical] = RIGHT_PAGE.onTagCheckBoxClicked(event);

	if (vertical) {
		let line = RIGHT_PAGE.getLine(index);
		LEFT_PAGE.changeLine(index, line);
	}


}

function onTagDivBlur(event) {
		button = event.target;
		listId = button.getAttribute("data-bs-target");
		listId = listId.slice(1);
		//Dont know how else to do this. If already visible then hide it
		if (document.getElementById(listId).classList.toggle("show"))
			document.getElementById(listId).classList.toggle("show");
		//document.getElementById(listId).classList.hide();
		//div.getElementsByTagName('button');
		//button.classList.toggle("hide");
	}

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
	RIGHT_PAGE = new tagBlock(widthImg, "rightCanvas", "rightSideImage");

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

	rightCanvas = document.getElementById("rightCanvas");
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

	let leftCanvas = document.getElementById("leftCanvas")
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

function tagButtonClicked(event) {
	RIGHT_PAGE.onTagButtonClicked(event);
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
		document.getElementById('tagInput').name='previous';
	}
	//next pressed
	else if (flag == 2) {
		document.getElementById('tagInput').name='next';
	}
    //save pressed
  else if (flag == 3) {
    document.getElementById('tagInput').name='save';
  }
    //end pressed
  else if (flag ==4) {
    document.getElementById('tagInput').name='end';
  }
	else if (flag == 5) {
		
    if (!confirm("Are you sure you want to submit this transcription?")) {
    		
        document.getElementById('tagInput').name='save';
      }
    	// Submit clicked
    	else {
	    	document.getElementById('tagInput').name='submit';
      	submit = true;
      }
      
  }
  else if (flag == 6) {
  	
    if (!confirm("Save this transcription as checked?")) {
    		
    		document.getElementById('tagInput').name='save';
        
      }  
      else {
    	// checked clicked
    	document.getElementById('tagInput').name='checked';
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
                     "json_file": JSON_FILE,
                     "scroll_position": {"x": scrollPosition.x, "y": scrollPosition.y},
                     "options":options};

  document.getElementById('tagInput').value= JSON.stringify(jsonToPost);
  document.getElementById('tagForm').submit();
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
    LEFT_PAGE.initializeLines(JSON_OBJ[filename]['json']);    
    RIGHT_PAGE.initializeLines(JSON_OBJ[filename]['json']);
    //fill writer and comments
    ANNOTATOR = JSON_OBJ[filename]['annotator'];
    JSON_FILE = filename;
  	if ('writer' in JSON_OBJ[filename]['json'])
  		writer.value = JSON_OBJ[filename]['json'].writer;
  	if ('comment' in JSON_OBJ[filename]['json'])
  		comment.value = JSON_OBJ[filename][['json']].comment

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

	
	let scrollPosition = getScrollPosition();
	let index = event.detail.lineIndex;
	let line = RIGHT_PAGE.getLine(index);
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

function onshowTagsButton() {
    if (SHOW_TAGS) {
        RIGHT_PAGE.showTags(false);
        showTagsButton.innerHTML = "Tags <i class='fa'> &#xf06e; </i>";
        SHOW_TAGS = false;
    }
    else {
        RIGHT_PAGE.showTags(true);
        SHOW_TAGS = true;
        showTagsButton.innerHTML = "Tags <i class='fa'> &#xf070; </i>"
        
    }
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