//To do: change all var to let/const
//To do: add delete attribute to lines. Means a separate array for deleted lines


let DOC_PAGE = 0;
let MOVE_STYLE = "rgba(255, 0, 0, 0.1)";
let SELECTED_FILL = "rgba(0, 0, 255, 0.1)";
let SELECTED_COLOR = "rgba(0, 0, 255, 1)";
let NORMAL_COLOR = "black";
let SELECTED_DASH = [15, 15];
let EDIT_FILL = "rgba(0, 255, 0, 0.1)";
let SELECTED_LINE_WIDTH = 1;
let DRAW_LINE_WIDTH = 1;
let DRAW_COLOR = "green";
let DRAW_CURSOR_STYLE = "crosshair";
let MOVE_CURSOR_STYLE = "move";
let DEFAULT_CURSOR_STYLE = "default";
let EDIT_CURSOR_STYLE = "grab";
let GRABBED_CURSOR_STYLE = "grabbing";
let RADIUS = 5;
let ORIENT_DOWN_TOP = "Orient_bottom_top";
let ORIENT_TOP_DOWN = "Orient_top_bottom";

//Called myPoint to not confuse this with existing point classes
class myPoint {
    constructor(x=0, y=0) {
        this.x=x;
        this.y=y;
    }
    distanceSq(pt) {
      return (this.x-pt.x)*(this.x-pt.x) + (this.y-pt.y)*(this.y-pt.y);
    }
    set(x, y) {
      this.x = x;
      this.y = y;
    }
    equal(pt) {
      if (this.x == pt.x && this.y == pt.y)
        return true;
      return false;
    }
    sumCoord(pt) {
      this.x += pt.x;
      this.y += pt.y;
    }
    assign(pt) {
      this.x = pt.x;
      this.y = pt.y;
    }
    addXY(x, y) {
      this.x += x;
      this.y += y;
    }
}


class textLine {
  constructor(poly, json, ptsArray){
    //2D shape
    this.polygon = poly;
    //Json in terms of image coordinates
    this.json = json;
    //Pts array with each point in terms of canvas coordinates
    this.ptsArray = ptsArray;
    
    this.edited = false;
    this.drawn = false;
    this.moved = false;
    this.deleted = false;
    this.copied = false;
    this.text = "";
    this.annotateTimeStart = new Date();
    this.annotateTime = 0;
    this.transcribeTime = 0;
    this.transcribeTimeStart = new Date();
    //Needed for tagging
    this.jsonKey = 0;
    // This holds all the values of tags
    this.tagDict = {};
    for (var i=0; i<TAG_ITEMS.length;++i) {
        var key = TAG_ITEMS[i];
        this.tagDict[key] = 0;
    }
  }

  createCopy(copyAttributes=false) {
    let p = new Array();
    for (let i=0;i<this.ptsArray.length;++i)
      p.push(new myPoint(this.ptsArray[i].x, this.ptsArray[i].y))
    let poly = this.get2DShapeFromPoints(this.ptsArray);
    let new_json = "123";
    let newLine = new textLine(poly, new_json, p);
    if (copyAttributes) {
      newLine.edited = this.edited;
      newLine.drawn = this.drawn;
      newLine.moved = this.moved;
      newLine.copied = this.copied;
      // Record all time
      // Time for annotation/marking
      newLine.annotateTimeStart = this.annotateTimeStart;
      newLine.annotateTime = this.annotateTime;
      // Time for typing/transcriptions
      newLine.transcribeTime = this.transcribeTime;
      newLine.transcribeTimeStart = this.transcribeTimeStart;
      //Should have exactly the same tags
      newLine.tagDict = {};
      //copy tag dictionary
      for (var key in this.tagDict) {        
        newLine.tagDict[key] = this.tagDict[key];
        }//end for
      
       
    }
    else {
      newLine.copied = true;
    }
    return newLine;
  } 

  copyTags(inputTags){
      for (var key in inputTags) {        
        this.tagDict[key] = inputTags[key];
      }
  }
  isTagged() {
      var tagged = false;
      for (var key in this.tagDict) {        
        if (this.tagDict[key]) {
            tagged = true;
            break; 
        } 
      }
    return tagged;
   }

   getTagValue(key) {
     if (key in this.tagDict)
       return this.tagDict[key];
     return 0;

   }
    
  isPointInPath(ctx, x, y) {
    return ctx.isPointInPath(this.polygon, x, y);
  }

  isPointInStroke(ctx, x, y) {
    return ctx.isPointInStroke(this.polygon, x, y);
  }
  

  stroke(ctx) {
     ctx.stroke(this.polygon); 
  }

  fill(ctx) {
    ctx.fill(this.polygon);
  }

  pixelToCanvasCoord(p, canvasLength, imageLength, offset) 
  {

    var coord = offset + canvasLength * p / imageLength;
    return coord;
  }

  coordToPixel(coord, canvasLength, imageLength, offset) {

    var p = (coord - offset) * imageLength / canvasLength;
    return p;
  }

  shift(dx, dy){
    //problem with memory leaks
//    let temp = new Path2D(this.polygon);
//    let p2 = new Path2D();
//    p2.addPath(temp, {e: dx, f: dy}); 
//    this.polygon = new Path2D(p2);
    for (let i=0;i<this.ptsArray.length;++i) {
      this.ptsArray[i].addXY(dx, dy);
    }
    this.polygon = this.get2DShapeFromPoints(this.ptsArray);
    this.moved = true;
  }

  changePosition(pos) {
    if (this.ptsArray.length <= 0)
      return;
     let dx = pos.x - this.ptsArray[0].x;
     let dy = pos.y - this.ptsArray[0].y;
     this.shift(dx, dy);
  }



  LineCoordToCanvas(pixel_xy, canvasHW,
                    imageHW, offset) {
    var index = 0;
    
    var pts = new Array(pixel_xy.length/2);

    for (var i = 0;i < pixel_xy.length; i=i+2){
      var x0 = pixel_xy[i];   
      var y0 = pixel_xy[i+1];
      pts[index] = new myPoint();
      pts[index].x = this.pixelToCanvasCoord(x0, canvasHW.x, imageHW.x, offset.x);
      pts[index].y = this.pixelToCanvasCoord(y0, canvasHW.y, imageHW.y, offset.y);
      
      index = index + 1;
    }
    return pts;

  }

  get2DShapeFromPoints(pts) {
    var poly = new Path2D();
    //ctx.beginPath();
    var x0 = pts[0].x;
    var y0 = pts[0].y;
    
    poly.moveTo(x0, y0);
    for (var i = 1;i < pts.length; i=i+1) {
      var x1 = pts[i].x;
      var y1 = pts[i].y;   
      poly.lineTo(x1, y1);
      
    }
    poly.closePath();
    return poly;
  }

  changeToEdited(closePath = true) {
    const pts = this.ptsArray;
    var poly = new Path2D();
    //ctx.beginPath();
    var x0 = pts[0].x;
    var y0 = pts[0].y;
    
    poly.moveTo(x0, y0);
    poly.ellipse(x0, y0, RADIUS, RADIUS, 0, 0, 2*Math.PI);
    for (var i = 1;i < pts.length; i=i+1){
      var x1 = pts[i].x;
      var y1 = pts[i].y;   
      poly.lineTo(x1, y1);
      poly.ellipse(x1, y1, RADIUS, RADIUS, 0, 0, 2*Math.PI);
      
    }
    if (closePath)
      poly.closePath();
    this.polygon = new Path2D(poly);   
  }

  changeToNormal() {
    const pts = this.ptsArray;
    var poly = new Path2D();
    //ctx.beginPath();
    var x0 = pts[0].x;
    var y0 = pts[0].y;
    poly.moveTo(x0, y0);
    for (var i = 1;i < pts.length; i=i+1){
      var x1 = pts[i].x;
      var y1 = pts[i].y;   
      poly.lineTo(x1, y1);      
    }
    poly.closePath();
    this.polygon = new Path2D(poly);    
    this.annotateTime = this.annotateTime + Math.round((new Date() - this.annotateTimeStart)/1000);
  }
    
  //lineJson only has coordinates  
  initializeLine(lineJson, displayedHW,
                 imageHW, offset, annotateTime, transcribeTime){
    this.json = "123";//lineJson;
    this.ptsArray = this.LineCoordToCanvas(lineJson, displayedHW,
                                               imageHW, offset);

    this.polygon = this.get2DShapeFromPoints(this.ptsArray);
    this.annotateTime = annotateTime;
    this.transcribeTime = transcribeTime;
     
  }

  getCoordArray(displayedHW, imageHW, offset) {
    let xy_array = new Array(this.ptsArray.length * 2);
    for (let i=0;i<this.ptsArray.length;++i)
    {
      xy_array[i*2] =   this.coordToPixel(this.ptsArray[i].x, displayedHW.x, imageHW.x, offset.x);
      xy_array[i*2+1] = this.coordToPixel(this.ptsArray[i].y, displayedHW.y, imageHW.y, offset.y);
    } 
    return xy_array;
  }

  getJson(displayedHW, imageHW, offset) {
    let lineJson = {
                'annotateTime': this.annotateTime,
                'transcribeTime': this.transcribeTime,
                'edited': boolToString(this.edited),
                'drawn': boolToString(this.drawn),
                'moved': boolToString(this.moved),
                'deleted': boolToString(this.deleted),
                'copied' : boolToString(this.copied),
                'coord': this.getCoordArray(displayedHW, imageHW, offset),
                'text': this.text};
    if (this.tagDict != null) {
      lineJson['tags'] = {};
      for (var key in this.tagDict)
        lineJson['tags'][key] = this.tagDict[key];
    }
 
    return lineJson;
  }


  deletePt(pt) {
    for (let i=0;i < this.ptsArray.length; ++i) {
      if (this.ptsArray[i].equal(pt)) {
        this.ptsArray.splice(i, 1);
        break;
      }
    }
    this.polygon = this.get2DShapeFromPoints(this.ptsArray);
  }

  getTwoClosestPointsIndex(pt){
    let len = this.ptsArray.length;
    let minIndex = 0;
    let distSq = this.ptsArray[0].distanceSq(pt);
    for(var i=1; i<len; ++i){
      let dist = this.ptsArray[i].distanceSq(pt);
      if (dist < distSq){
        distSq = dist;
        minIndex = i;
      }   
    }
    // the indices next to minIndex
    let ind1 = (minIndex + 1) % len;
    let ind2 = (minIndex - 1 + len) % len;
    let dist1 = this.ptsArray[ind1].distanceSq(pt);
    let dist2 = this.ptsArray[ind2].distanceSq(pt);
    // the second closest point index
    // 3 return values are added for convenience
    if (dist1 < dist2)
      return [minIndex, ind1, minIndex]

    return [ind2, minIndex, minIndex];
  }
  getClosestPointIndex(pt){
    let len = this.ptsArray.length;
    let minIndex = 0;
    let distMin = this.ptsArray[0].distanceSq(pt);
    for(var i=1; i<len; ++i){
      let dist = this.ptsArray[i].distanceSq(pt);
      if (dist < distMin){
        distMin = dist;
        minIndex = i;
      }   
    }    
    return minIndex;
 }
  getClosestPoint(pt){
    let minIndex = this.getClosestPointIndex(pt);
    return new myPoint(this.ptsArray[minIndex].x, this.ptsArray[minIndex].y);
 }    

  // This is old code
  addPtOld(pt) {

    let [ind1, ind2, minInd] =  this.getTwoClosestPointsIndex(pt);
    this.ptsArray.splice(ind2, 0, new myPoint(pt.x, pt.y));
  }

  // New version that looks for the line with closest distance to the point
  // (instead of two closest points)
  // Adds a point specific to that point
  addPt(pt) {
    let len = this.ptsArray.length;
    let minInd =  this.getClosestPointIndex(pt);
    let ind1 = (minInd - 1 + len) % len;
    let ind2 = (minInd + 1) % len;
    
    // Points in array occur in the order ind1, minInd, ind2

    let distance1 = this.getLineDistance(pt, minInd, ind1);
    let distance2 = this.getLineDistance(pt, minInd, ind2);

    if (distance1 < distance2) {
      // between ind1 and minInd
      this.ptsArray.splice(minInd, 0, new myPoint(pt.x, pt.y));
    }
    else {
      this.ptsArray.splice(ind2, 0, new myPoint(pt.x, pt.y));
    }

  }

  // Equation of line is Ax+By+C=0
  // distance of pt from line is given by: (A*pt.x + B*pt.y + C)/Math.sqrt(A*A+B*B)
  // https://www.cuemath.com/geometry/distance-of-a-point-from-a-line/
  getLineDistance(pt, ind1, ind2) {
    let A = 0;
    let B = 0;
    let C = 0;

    let x1 = this.ptsArray[ind1].x;
    let y1 = this.ptsArray[ind1].y;

    let x2 = this.ptsArray[ind2].x;
    let y2 = this.ptsArray[ind2].y;

    if (x2 == x1) {
      A = 1;
      B = 0;
      C = -x1;
    }
    else {
      let S = (y2 - y1)/(x2 - x1);
      A = S;
      B = -1;
      C = -S*x1 + y1;
    }

    if (A == 0 && B == 0)
      return 0;
    let distance = (A*pt.x + B*pt.y + C)/Math.sqrt(A*A+B*B);
    return Math.abs(distance);
  }



  deleteClosestPt(pt) {
    //don't delete a control point if ptsArray has 2 or less points
    if (this.ptsArray.length <= 3)
      return false;
    let [ind1, ind2, minInd] =  this.getTwoClosestPointsIndex(pt);
    this.ptsArray.splice(minInd, 1);
    this.edited = true;
    return true;
  }

  modifyClosestPt(pt) {
    let minInd =  this.getClosestPointIndex(pt);
    this.ptsArray[minInd].assign(pt);
    this.edited = true;

  }
    
  //for pencil event  
  modifyLastPt (x, y) {
    let lastInd =  this.ptsArray.length - 1;
    this.ptsArray[lastInd].set(x,y);
  }

  //this is for pencil event  
  addNewPoint(x, y) {
    if (this.ptsArray == null){
      this.ptsArray = new Array;
      //for the first added point, add two 
      //one for user click the other to be moved around
      this.ptsArray.push(new myPoint(x, y));

      }
          
      this.ptsArray.push(new myPoint(x, y));
      
  }
  endPath(x, y) {
    this.drawn = true;
    if (this.ptsArray.length <= 3)
      return false;
    return true;
  } 

  setDeleted(flag=true) {
    this.deleted = flag;
  }

  // Will get left upper and bottom right corner
  getCornerPts() {
    let len = this.ptsArray.length;
    let minY = 1000000;
    let maxY = 0;
    let maxX = 0;
    let minX = 1000000;
    
    for(var i=0; i<len; ++i){
      if (this.ptsArray[i].y < minY) {
        minY = this.ptsArray[i].y;
      }
      if (this.ptsArray[i].y > maxY) {
        maxY = this.ptsArray[i].y;
      }
      if (this.ptsArray[i].x < minX) {
        minX = this.ptsArray[i].x;
      }
      if (this.ptsArray[i].x > maxX) {
        maxX = this.ptsArray[i].x;
      }
    }
    return [minX, minY, maxX, maxY];
   }

   isVerticalOrientation() {
    //Check if this is vertical orientation
    if (this.getTagValue(ORIENT_TOP_DOWN) == 1 || this.getTagValue(ORIENT_DOWN_TOP) == 1) {
      return true;
    return false;
   }
 }

 isVerticalTopDown() {
   if (this.getTagValue(ORIENT_TOP_DOWN))
     return true;
   return false;
 }

   //get the slope of the line that passes through the polygon
   //Can then be used to rotate a text line accordint to that slope
   //Modified from https://www.w3schools.com/ai/ai_regressions.asp
   getLineAngle_y() {

    let [minX, minY, maxX, maxY] = this.getCornerPts(); 
    var xArray = [];
    var yArray = [];
    var count = this.ptsArray.length;
    if (count <= 3) {
      //changed return 0 to return [0, 0] to fix bug
      return [0, 0];
    }



  // Calculate Sums
    var xSum=0, ySum=0 , xxSum=0, xySum=0;
    for (var i = 0; i < this.ptsArray.length; i++) {
      xSum += this.ptsArray[i].x;
      ySum += this.ptsArray[i].y;
      xxSum += this.ptsArray[i].x * this.ptsArray[i].x;
      xySum += this.ptsArray[i].x * this.ptsArray[i].y;
    }

    if (Math.abs(count * xxSum - xSum * xSum) <= 1e-9)
      return [90, minY];
    // Calculate slope 
    var slope = (count * xySum - xSum * ySum) / (count * xxSum - xSum * xSum);
    var intercept = (ySum / count) - (slope * xSum) / count;
    var angleRadians = Math.atan(slope);


        //Check if this is vertical orientation
    if (this.isVerticalOrientation()) {
      if (this.isVerticalTopDown()) 
        return [(angleRadians*180/Math.PI) - 90, minY];
      else
        return [90, minY];
    }


    return [(angleRadians*180/Math.PI), slope*maxX+intercept];
  }
}

class manuscriptPage{
  constructor(imageWidth, canvasId="imgCanvas", imageId="manuscript"){
    this.canvas = document.getElementById(canvasId);
    this.manuscriptImage = document.getElementById(imageId);
    this.imageDim = 0; //fill this in displayManuscript()
    this.displayedImageDim = 0; //fill this in displayManuscript()
    this.displayManuscript(imageWidth);
    this.json = "";
    // for each displayed line
    this.lineArray = 0;    
    // for each deleted line
    this.deletedLineArray = null;
    this.mouseDrag = false;
    this.selectedIndex = -1;
    this.editing = false;
    this.mouseDownPt = new myPoint(-1, -1);
    this.pencil = false;
    this.drawLine = null;
    this.save = false;
    this.modified = false;
    this.mousePosition = new myPoint(-1, -1);
    this.copiedLine = null; //index of copied line
    this.submit = false;
    this.checked = false;
    
  }

  displayManuscript(imageWidth) {
    //image height to display
    let height = this.manuscriptImage.naturalHeight * imageWidth / this.manuscriptImage.naturalWidth;
    //make the canvas ht and width same as image dim
    this.canvas.width = imageWidth;
    this.canvas.height = height;
    
    //draw the image
    let ctx = this.canvas.getContext("2d");
    ctx.drawImage(this.manuscriptImage, 0, 0, imageWidth, height);
    this.imageDim = new myPoint(this.manuscriptImage.naturalWidth, this.manuscriptImage.naturalHeight);
    this.displayedImageDim = new myPoint(imageWidth, height);

  }

  refreshManuscript() {
    var ctx = this.canvas.getContext("2d");
//    this.canvas.style.borderColor = "GhostWhite";
    ctx.drawImage(this.manuscriptImage, 0, 0, this.displayedImageDim.x, this.displayedImageDim.y);
  }

  refreshLines() {
    let ctx = this.canvas.getContext("2d");
    for (let i=0;i<this.lineArray.length;++i) {
      this.lineArray[i].stroke(ctx);
    }    
  }

  // Called when zoom + is clicked and coordinates need to be changed
  reinitializeLines(linesJson) {
    
    this.json = linesJson;
    const offset = new myPoint(0, 0);
    
    //Redraw all the lines
    var ctx = this.canvas.getContext("2d");
    this.lineArray = new Array(Object.keys(linesJson).length);
        
    var index = 0;
    for (var key in linesJson){
      let annotateTime = 0;
      let transcribeTime = 0;
      if (!key.startsWith("line"))
        continue;
      if ("deleted" in linesJson[key] && linesJson[key].deleted == "1")
        continue;
      if ("annotateTime" in linesJson[key])
        annotateTime = linesJson[key].annotateTime;
      if ("transcribeTime" in linesJson[key])
        transcribeTime = linesJson[key].transcribeTime;
      let jsonCoord = "";
      this.lineArray[index] = new textLine();
      if ("coord" in linesJson[key])
        jsonCoord = linesJson[key].coord
      else
        jsonCoord = linesJson[key]

      this.lineArray[index].initializeLine(jsonCoord, 
                                              this.displayedImageDim,
                                              this.imageDim,
                                              offset, annotateTime, transcribeTime);        
      this.lineArray[index].stroke(ctx);
      if ("text" in linesJson[key])
          this.lineArray[index].text = linesJson[key].text    

      //ver.1.6 Adding this key as a field needed when adding tags.
      this.lineArray[index].jsonKey = key;
      if ("tags" in linesJson[key] && linesJson[key]["tags"].constructor == Object) {
        for (var tag_key in linesJson[key].tags) {      
            this.lineArray[index].tagDict[tag_key] = linesJson[key]['tags'][tag_key];
        }
      }
      index++;
    }
    //check if we filled all of lineArray or not
    while (index != this.lineArray.length)
      this.lineArray.splice(this.lineArray.length-1)


  }

  initializeLines(linesJson){
    
    const offset = new myPoint(0, 0);
    this.json = linesJson;
    var ctx = this.canvas.getContext("2d");
    this.lineArray = new Array(Object.keys(linesJson).length);
        
    var index = 0;
    for (var key in linesJson){
      let annotateTime = 0;
      let transcribeTime = 0;
      if (!key.startsWith("line"))
        continue;
      if ("deleted" in linesJson[key] && linesJson[key].deleted == "1")
        continue;
      if ("annotateTime" in linesJson[key])
        annotateTime = linesJson[key].annotateTime;
      if ("transcribeTime" in linesJson[key])
        transcribeTime = linesJson[key].transcribeTime;
      // If coordinates are not found do not create line object...this would be true when files written by SFR
      // for checking edit distance
      if (!linesJson[key].coord)
        continue
      let jsonCoord = "";
      this.lineArray[index] = new textLine();
      if ("coord" in linesJson[key])
        jsonCoord = linesJson[key].coord
      //else  //this was used in early versions
      //  jsonCoord = linesJson[key]
      //Needed for tagging in ver 1.6
      this.lineArray[index].jsonKey = key;
      this.lineArray[index].initializeLine(jsonCoord, 
                                              this.displayedImageDim,
                                              this.imageDim,
                                              offset, annotateTime, transcribeTime);        
      this.lineArray[index].stroke(ctx);
      if ("text" in linesJson[key])
          this.lineArray[index].text = linesJson[key].text;
      // check if tags present and it is a dictionary
      if ("tags" in linesJson[key] && linesJson[key]["tags"].constructor == Object) {
        for (var tag_key in linesJson[key].tags) {      
            this.lineArray[index].tagDict[tag_key] = linesJson[key]['tags'][tag_key];
        }
      }
      
        
      index++;
    }
    //check if we filled all of lineArray or not
    while (index != this.lineArray.length)
      this.lineArray.splice(this.lineArray.length-1)
    
  } 

  //check if boundary of the polygon is clicked
  isBoundaryClicked(ctx, x, y) {
    if (this.selectedIndex < 0)
      return false;
    if (this.lineArray[this.selectedIndex].isPointInStroke(ctx, x, y))
      return true;
    return false;
  }

  getSelectedLineIndex(ctx, x, y) {
    for (let i = 0;i < this.lineArray.length; ++i){
      const isPointInPoly = this.lineArray[i].isPointInPath(ctx, x, y);
      if (isPointInPoly) {
        return i;
      }
    }
    //none selected
    return -1;
  }

  // called on mouse move
  changeColors(ctx, x, y){
    ctx.save();
    //we may have more than one selected
    for (let i = 0;i < this.lineArray.length; ++i){
      const isPointInPoly = this.lineArray[i].isPointInPath(ctx, x, y);
      if (isPointInPoly) {
          ctx.fillStyle = MOVE_STYLE;
          this.lineArray[i].fill(ctx);
          this.lineArray[i].stroke(ctx);   
      }    
    } //end for
    ctx.restore();
  }

  //From: https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
  getMouseCanvasPos(evt) {
    var rect = this.canvas.getBoundingClientRect(); // abs. size of element
    if (this.displayedImageDim.x != rect.width)
    {
      let scaleX = this.displayedImageDim.x / rect.width;    // relationship bitmap vs. element for x
      let scaleY = this.displayedImageDim.y / rect.height;  // relationship bitmap vs. element for y

    return {
      x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
      }
    }
    return {x: event.offsetX, y: event.offsetY};
  }

  onMouseMove(event){

    let mousePos = this.getMouseCanvasPos(event);  

    
    this.mousePosition.set(mousePos.x, mousePos.y);
    document.getElementById("log0").innerHTML = mousePos.x + ' ' + mousePos.y;
    document.getElementById("log1").innerHTML = event.offsetX + ' ' + event.offsetY;
    


    if (this.pencil) {
        this.pencilMouseMove(event);
        return;
    }
       
    const c = this.canvas;
    const ctx = c.getContext("2d");
    
    if (!this.mouseDrag && this.selectedIndex < 0) {
      this.refreshManuscript();
      this.refreshLines();  
      this.changeColors(ctx, mousePos.x, mousePos.y);
      return;
    }
    // if mouse is dragged and no selection
    if (this.selectedIndex < 0)
      return;
    if (this.mouseDrag && !this.editing) {
      this.refreshManuscript();
//      document.getElementById("log").innerHTML = 'in mouse move with drag on';
//      document.getElementById("log1").innerHTML = event.movementX + ' ' + event.movementY;
      this.lineArray[this.selectedIndex].shift(event.movementX, event.movementY);
      this.showSelected(SELECTED_FILL);
      this.setModified();
      return;
    }
    if (this.mouseDrag && this.editing) {
      document.body.style.cursor = GRABBED_CURSOR_STYLE;
      // means we are editing and mouse is dragged
      let currentPoint = new myPoint( mousePos.x, mousePos.y);
      
//      document.getElementById("log3").innerHTML = event.offsetX + ' ' + event.offsetY;
      this.lineArray[this.selectedIndex].modifyClosestPt(currentPoint);

      this.mouseDownPt = currentPoint;
      this.refreshManuscript();
      this.showEditing();
      this.setModified();
    }


  }

  onMouseUp(event) {
    this.mouseDrag = false;  
    if (this.editing) 
      document.body.style.cursor = EDIT_CURSOR_STYLE;
  }

  onMouseDown(event) {
    this.mouseDrag = true;
    let mousePos = this.getMouseCanvasPos(event);  
    this.mouseDownPt.set(mousePos.x, mousePos.y);
  }

  resetSelectIndices() {
    const ctx = this.canvas.getContext("2d");
    //if (this.selectedIndex >= 0){
    //  this.lineArray[this.selectedIndex].fill(ctx);
    //  this.lineArray[this.selectedIndex].stroke(ctx);
    //}
    this.refreshManuscript();
    this.refreshLines();
    this.selectedIndex = -1;
    this.editing = false;

  }

  showSelected(fill) {
    if (this.selectedIndex < 0 || this.lineArray.length==0)
      return;
    const ctx = this.canvas.getContext("2d");
    ctx.save();
    ctx.lineWidth = SELECTED_LINE_WIDTH;
    ctx.strokeStyle = "white";
    this.lineArray[this.selectedIndex].stroke(ctx);
    ctx.fillStyle = fill;
    ctx.strokeStyle = SELECTED_COLOR;
    ctx.setLineDash(SELECTED_DASH);
    this.lineArray[this.selectedIndex].fill(ctx);
    this.lineArray[this.selectedIndex].stroke(ctx);
    ctx.restore();
  }

  onMouseClick(event) {
    if (this.pencil) {
        this.pencilMouseClick(event);
        return;
    }
      
    const ctx = this.canvas.getContext("2d");
    this.mouseDrag = false;
    //check if already in edit mode
        
    if (this.editing)
      return;
    let mousePos = this.getMouseCanvasPos(event);  
    let currentSelection = this.getSelectedLineIndex(ctx, mousePos.x, mousePos.y);
    if (currentSelection == -1 || 
        (this.selectedIndex >= 0 && currentSelection != this.selectedIndex)) {
        // this can mean end of move mode
      this.setNormalMode();
      return;
    }
    if (currentSelection == this.selectedIndex) {
      return;  
    }

   if (this.selectedIndex < 0 && currentSelection >= 0) {
     this.selectedIndex = currentSelection;
     this.setMoveMode(); 
     this.showSelected(SELECTED_FILL); 
     this.lineArray[currentSelection].annotateTimeStart = new Date();
     return;
    }
  }

  showEditing() {
    if (this.editing && this.selectedIndex >=0) {
//      document.getElementById("log").innerHTML = "showEditing";

      this.lineArray[this.selectedIndex].changeToEdited();
      this.showSelected(EDIT_FILL);
    }
  }


  //single and double clicks
  onMouseDoubleClick(event) {
    if (this.pencil) {
        this.pencilDoubleClick(event);
        return;
    }
    let mousePos = this.getMouseCanvasPos(event);  
    this.mouseDrag = false;
    const ctx = this.canvas.getContext("2d");
    let currentSelection = this.getSelectedLineIndex(ctx, mousePos.x, mousePos.y);
//    document.getElementById("log").innerHTML = "double click" + " currentSelection " + currentSelection;

    if (this.editing) {// && currentSelection != this.selectedIndex) {

      this.setNormalMode();      
      return;
    }


    if (currentSelection < 0) {
      this.setNormalMode();      
      return;
    }
    
    
    this.setEditMode();
    this.editing = true;
    this.selectedIndex = currentSelection;
    this.showEditing();
    this.lineArray[currentSelection].annotateTimeStart = new Date();
    return;
      
    }
    
  onPencilClick() {
      
    //Cannot draw in edit mode
    if (this.editing)
      return;  
    this.pencil = true;
    document.body.style.cursor = DRAW_CURSOR_STYLE;
    
  }

  //TODO: PROBLEM HERE...Need to copy object
  pencilDoubleClick(event) {
    if (this.drawLine == null)
      return;
    let mousePos = this.getMouseCanvasPos(event);  
    //is this a complete polygon with >= 3 pts?
    if (this.drawLine.endPath(mousePos.x, mousePos.y)) {   
      this.drawLine.changeToNormal();
      this.lineArray.push(this.drawLine);
      this.drawLine = null;
      this.setNormalMode();
      this.setModified();
      
    }
    else {
      this.drawLine = null;
      this.setNormalMode();
    }
  
  }
  pencilMouseClick(event) {
    if (this.drawLine == null)
      this.drawLine = new textLine(null, null, null);
    let mousePos = this.getMouseCanvasPos(event);  
    this.drawLine.addNewPoint(mousePos.x, mousePos.y);  
    this.drawLine.changeToEdited(false);
    this.showAddingLine();
//    document.getElementById("log").innerHTML = "Mouseclick: line len " + this.drawLine.ptsArray.length;

  }
  pencilMouseMove(event) {
    //check if the drawning has started by click 
    if (this.drawLine == null)
      return;
    let mousePos = this.getMouseCanvasPos(event);  
    this.drawLine.modifyLastPt(mousePos.x, mousePos.y);
    this.drawLine.changeToEdited(false);
    this.showAddingLine();
//    document.getElementById("log").innerHTML = "mouse move: line len " + this.drawLine.ptsArray.length;

  }
      

  showAddingLine() {
    if (this.drawLine == null)
      return;
    this.refreshManuscript();
    let ctx = this.canvas.getContext("2d");
    ctx.save();
    ctx.lineWidth = DRAW_LINE_WIDTH;
    ctx.strokeStyle = "white";
    this.drawLine.stroke(ctx);
    ctx.strokeStyle = DRAW_COLOR;
    ctx.setLineDash(SELECTED_DASH);
    this.drawLine.stroke(ctx);
    ctx.restore();   
//    document.getElementById("log").innerHTML = "ShowAddingLine: line len " + this.drawLine.ptsArray.length;

  }     
  allowDraw(val) {
    document.getElementById("drawButton").disabled = !val;
  }

  //allow individual line delete and disable all line delete
  allowDelete() {
    document.getElementById("deleteButton").disabled = false;
    //document.getElementById("deleteAllButton").disabled = true;      
  }
  //disable individual line delete and enable all line delete
  disableDelete() {
    document.getElementById("deleteButton").disabled = true;
    //document.getElementById("deleteAllButton").disabled = false;

  }

  addToDeletedList(ind) {
    if (this.deletedLineArray == null)
      this.deletedLineArray = new Array();
    this.deletedLineArray.push(this.lineArray[ind]);
    this.lineArray[ind].setDeleted();
  }

  deleteClicked() {
    if (this.selectedIndex >= 0) {
      this.addToDeletedList(this.selectedIndex);
      this.lineArray.splice(this.selectedIndex, 1);
      this.selectedIndex = -1;
      this.setNormalMode();
      this.setModified();
        
    }
  }
  onDeletePressed() {
    this.deleteClicked();
  }
  setNormalMode(){
    if (this.selectedIndex >= 0) {
      this.lineArray[this.selectedIndex].changeToNormal();
    }
    this.disableDelete();
    document.body.style.cursor = DEFAULT_CURSOR_STYLE;
    this.resetSelectIndices();
    this.pencil = false;
    this.allowDraw(true);
    document.getElementById("saveButton").disabled = false;
  }

  setMoveMode() {
    this.refreshManuscript();
    document.body.style.cursor = MOVE_CURSOR_STYLE;
    this.allowDelete();
    this.allowDraw(false);
    document.getElementById("saveButton").disabled = true;
  }

  setEditMode() {
    this.refreshManuscript();
    document.body.style.cursor = EDIT_CURSOR_STYLE;
    this.allowDelete();
    this.allowDraw(false);
    document.getElementById("saveButton").disabled = true;

  }

  saveClicked() {
    this.save = true;
  }

  getJsonString() {
    
    let seconds = Math.round((new Date() - TIME_START)/1000);
    let status = "notdone"
    if (this.submit) {
        status = "submitted";
    }
    else if (this.checked) {
        status = "checked";
    }
      
    const offset = new myPoint(0, 0);
    let jsonObj = {'imageFileName': IMAGE_FILENAME, 
                   'modified': boolToString(this.modified), 
                   'status': status,
                   'writer': writer.value,
                   'comment': comment.value};
    jsonObj['time'] = TOTAL_TIME + seconds;
    
    let canvasDim = new myPoint(this.canvas.width, this.canvas.height)

    for (let i=0; i<this.lineArray.length; ++i) {

      let lineJson = this.lineArray[i].getJson(this.displayedImageDim,
                                         this.imageDim,
                                         offset);
      //line numbering in json to start from one
      let keyStr = 'line_' + (i+1).toString();
      jsonObj[keyStr] = lineJson;
      
    }
    let lineNumber = this.lineArray.length + 1;
    if (this.deletedLineArray!=null) {
      for (let i=0;  i<this.deletedLineArray.length; ++i) {
        let lineJson = this.deletedLineArray[i].getJson(this.displayedImageDim,
                                                        this.imageDim,
                                                         offset);
        let keyStr = 'line_' + (lineNumber).toString();
        lineNumber++;
        jsonObj[keyStr] = lineJson;
      }
    }

    //document.getElementById("log1").innerHTML = (jsonObj);
    //document.getElementById("log3").innerHTML = JSON.stringify(jsonObj);
    return JSON.stringify(jsonObj);
  }

  setModified() {
    document.getElementById("undoButton").disabled = false;
    document.getElementById("saveButton").disabled = false;
    this.modified = true;
  }

  //this should be handled by the caller
  undoClicked() {
    //this undoes all changes

  }
  onMinusPressed() {
  if (!this.editing)
    return;
  //delete a control point closest to the cursor
  this.lineArray[this.selectedIndex].deleteClosestPt(this.mousePosition);
  this.refreshManuscript();
  this.showEditing();
  this.setModified();
 }

 onAddControlPointPressed() {
  if (!this.editing)
    return;   

  if (this.selectedIndex >= 0) {
    //let currentPoint = new myPoint( mousePos.x, mousePos.y);
    this.lineArray[this.selectedIndex].addPt(this.mousePosition)  
    this.refreshManuscript();
    this.showEditing();
    this.setModified();
  }

 }


 deleteAllClicked() {
   // cannot delete all when in select or edit mode or pencil mode
   if (this.selectedIndex >= 0 || this.pencil)
     return;
   if (confirm('WARNING! You chose the delete all option. All lines will be deleted. \n Press OK to delete all lines OR press cancel to keep all lines')) {
       this.lineArray = new Array();
       this.setModified();
       this.refreshManuscript();
   }

 }
 copyClicked() {
   if (this.selectedIndex >= 0)
     this.copiedLine = this.lineArray[this.selectedIndex].createCopy();
 }

 pasteClicked() {
   if (this.copiedLine == null)
     return;
   let newLine = this.copiedLine.createCopy();
   newLine.changePosition(this.mousePosition);
   this.lineArray.push(newLine);
   this.setModified();
   this.refreshManuscript();
   this.refreshLines();
 }

 // Needed when transcribing
 changeSelectedIndexForView(index) {
   if (index != this.selectedIndex) {
    const ctx = this.canvas.getContext("2d");
    ctx.save();
    //this.refreshLines();
    this.refreshManuscript();
    this.selectedIndex = index;
    this.showSelected(MOVE_STYLE);
    ctx.restore();
   }
   
 }
 // Needed when transcribing
 getSelectedIndex() {
   return this.selectedIndex;
 }
}


      





function initializeCanvas(imageWidth, atEnd=false){
  
  DOC_PAGE = new manuscriptPage(imageWidth); 
}

function initAnnotations(linesJson){

  DOC_PAGE.initializeLines(linesJson);
  
  var c = document.getElementById("imgCanvas");
  c.addEventListener("mousemove",onMouseMove);
  c.addEventListener("mousedown",onMouseDown);
  c.addEventListener("mouseup",onMouseUp);
  c.addEventListener("click", onMouseClick);
  c.addEventListener("keydown", onKeyDown);
}

function onMouseDrag(event) {
  DOC_PAGE.onMouseDrag(event);
}

function onMouseMove(event) {
  //document.getElementById("log3").innerHTML += " mouse move" ;
  DOC_PAGE.onMouseMove(event);
}

function onMouseUp(event) {
  //document.getElementById("log3").innerHTML += " ..mouse up.. " ;
  DOC_PAGE.onMouseUp(event);
}

function onMouseDown(event) {
  //document.getElementById("log3").innerHTML += " ?mouse down? " ;
  DOC_PAGE.onMouseDown(event);
}

function onMouseClick(event) {
  if (event.target.id == "pencil")
  {
    pencilClicked(event);
    return;
  }

  //document.getElementById("log3").innerHTML += " *mouse click* " + event.detail + '*';
  if (event.detail == 2) {
    DOC_PAGE.onMouseDoubleClick(event);
    console.log(event.detail);
  }
  else if (event.detail == 1)
    DOC_PAGE.onMouseClick(event);
//  else if (event.shiftKey) {
//    DOC_PAGE.onMouseShiftDown(event);
  }

function pencilClicked() {
    DOC_PAGE.onPencilClick();
}

function deleteClicked() {
    DOC_PAGE.deleteClicked();
}

function onKeyDown(event) {
  //This shoudl delete selected line
  if (event.key == "Delete" || event.key == "Backspace")
    DOC_PAGE.onDeletePressed();  
  //This should start draw mode
  else if (event.key == '+')
    DOC_PAGE.onPencilClick();
  //this is to delete a control point
  else if (event.key == '-')
    DOC_PAGE.onMinusPressed();
  else if (event.key == 'p')
    DOC_PAGE.onAddControlPointPressed();


  //else if (event.key == 'd')
  //  DOC_PAGE.deleteAllClicked();
  //copy 
  if ((event.key == 'c') && event.ctrlKey)
    DOC_PAGE.copyClicked();
  else if ((event.key == 'v') && event.ctrlKey)
    DOC_PAGE.pasteClicked();    
  document.getElementById("imgCanvas").tabIndex = 1;
}

function saveClicked() {
  DOC_PAGE.saveClicked();
}


function nextClicked() {
  postTo('', '{"data":1}');
    
}

function undoClicked() {
  //undo all changes
//  DOC_PAGE.undoClicked();
  let warningMessage = 'WARNING! You chose the undo option. All changes to the document will be lost. Are you sure?\n Press cancel if you want to keep the changes in the document\n'
  if (confirm(warningMessage))  
      document.location.reload();
}


function deleteAllClicked() {
  DOC_PAGE.deleteAllClicked();
}

//Ajax post to server...not used
function postTo(url, query) {
    var request = (XMLHttpRequest?new XMLHttpRequest():new ActiveXObject());
    request.open('POST', url, true);
    request.send(query);
}

//how to encode bool in json
function boolToString(boolValue) {
  if (boolValue) return '1';
  return '0';
}

function get_json_to_post(lineJson) {
  let jsonToPost = {"images_obj": IMAGES, "admin": ADMIN, 
                     "page_json": lineJson};
  return JSON.stringify(jsonToPost);
}

  //these two lines will add a new control point
      //this.lineArray[this.selectedIndex].deletePt(this.mouseDownPt);
      //this.lineArray[this.selectedIndex].addPt(currentPoint);
      //next two lines will move the current point
      //this.lineArray[this.selectedIndex].deleteClosestPt(currentPoint);
      //this.lineArray[this.selectedIndex].addPt(currentPoint);
/*
    for (var i = pixel_xy.length-1; i>0; i=i-4){
      var x1 = pixel_xy[i-2];
      var y1 = pixel_xy[i];
      pts[index/2] = new myPoint();
      pts[index/2].x = this.pixelToCanvasCoord(x1, canvasHW.x, imageHW.x, offset.x);
      pts[index/2].y = this.pixelToCanvasCoord(y1, canvasHW.y, imageHW.y, offset.y);
      index = index + 2;
    }
*/

//if (atEnd) {
//    document.getElementById("rightArrow").disabled = true;
//  }




