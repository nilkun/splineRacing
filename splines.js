import Viewport from "../shared/engine/Viewport.js";
import Vector from "../shared/engine/Vector.js";

class Spline {
    constructor(noOfNodes, position = new Vector(width / 2, height / 2)) {
        this.nodes = new Array(noOfNodes);
        this.position = position;
        this.nodeSize = 10;
        this.nodeHalfSize = this.nodeSize / 2;
        this.showNodes = true;
    }

    setPoints() {
        for(let t = 0.0; t < this.nodes.length - 3; t += 0.001) {
            const index = Math.floor(t);          
            this.nodes[index].points.push(this.getPoint(t));
        }
    }
    updatePoints(index) {
        this.nodes[index].points = [];
        for(let t = index; t < index+1; t += 0.001) {
            this.nodes[index].points.push(this.getPoint(t));
        }
        this.nodes[index].length  = this.getSegmentLength(index);
    }

    calculate(t) {
        const point0 = Math.floor(t);
        const point1 = point0 + 1;
        const point2 = point0 + 2;
        const point3 = point0 + 3;

        t = t - point0;
        
        const tSquared = t * t;
        return { point1, point2, point3, point0, t, tSquared };
    }

    circle() {
        const radians = Math.PI * 2 / (this.nodes.length - 3);
        const originalRadius = height * 1/3;
        const range = height * 75 / 1000;
        this.nodes = new Array(this.nodes.length);

        // Connect ends
        // Quite a mess!!!
        for(let i = 0; i < 3; i++) {
            const radius = originalRadius + Math.floor(Math.random() * range);
            this.nodes[i] = new Vector(this.position.x + radius * Math.cos((i+1) * radians), this.position.y + radius * Math.sin((i+1) * radians));
            this.nodes[this.nodes.length - 3 + i] = this.nodes[i];
            this.nodes[i].points = [];
        }
        for(let i = 3; i < this.nodes.length - 3; i++) {
            const radius = originalRadius + Math.floor(Math.random() * range);
            this.nodes[i] = new Vector(this.position.x + radius * Math.cos((i+1) * radians), this.position.y + radius * Math.sin((i+1) * radians));
            this.nodes[i-3].length  = this.getSegmentLength(i-3);
            this.nodes[i].points = [];
        }

        for(let i = this.nodes.length - 6; i < this.nodes.length - 3; i++) {
            const radius = originalRadius + Math.floor(Math.random() * range);
            this.nodes[i] = new Vector(this.position.x + radius * Math.cos((i+1) * radians), this.position.y + radius * Math.sin((i+1) * radians));
            this.nodes[i].length  = this.getSegmentLength(i);
            this.nodes[i].points = [];
        }

        this.setPoints();
    }
    getSegmentLength(position) {
        let length = 0;
        let stepSize = 0.005;
        let oldPoint = this.getPoint(position);
        let newPoint;

        for(let t = 0; t < 1; t += stepSize) {
            newPoint = this.getPoint(position + t);
            length += Math.sqrt((newPoint.x - oldPoint.x) * (newPoint.x - oldPoint.x)
                + (newPoint.y - oldPoint.y) * (newPoint.y - oldPoint.y));
            oldPoint = newPoint;
        }
        return length;
    }

    getPoint(value) {
        const { t, tSquared, point0, point1, point2, point3 } = this.calculate(value);
        const tCubed= tSquared * t;
    
        const q1 = -tCubed  + 2 * tSquared - t;
        const q2 = 3 * tCubed - 5 * tSquared + 2;
        const q3 = -3 * tCubed + 4 *tSquared + t;
        const q4 = tCubed - tSquared;

        const tx = this.nodes[point0].x * q1 + this.nodes[point1].x * q2 + this.nodes[point2].x * q3 + this.nodes[point3].x * q4;
        const ty = this.nodes[point0].y * q1 + this.nodes[point1].y * q2 + this.nodes[point2].y * q3 + this.nodes[point3].y * q4;

        return new Vector(.5 * tx, .5 * ty);
    }

    getGradient(value) {
        const { t, tSquared, point0, point1, point2, point3 } = this.calculate(value);
    
        const q1 = -3 * tSquared +  4 * t - 1;
        const q2 =  9 * tSquared - 10 * t;
        const q3 = -9 * tSquared +  8 * t + 1;
        const q4 =  3 * tSquared -  2 * t;

        const tx = this.nodes[point0].x * q1 + this.nodes[point1].x * q2 + this.nodes[point2].x * q3 + this.nodes[point3].x * q4;
        const ty = this.nodes[point0].y * q1 + this.nodes[point1].y * q2 + this.nodes[point2].y * q3 + this.nodes[point3].y * q4;
        
        return new Vector(.5 * tx, .5 * ty);
    }

    render(renderer) {

        // render road
        renderer.beginPath();
        renderer.strokeStyle = "grey";
        renderer.lineWidth = 32 / 600 * height; // road width
        renderer.moveTo(this.nodes[1].x, this.nodes[1].y);
            this.nodes.forEach(node => {
                node.points.forEach(point => {
                    renderer.lineTo(point.x, point.y);
                })
            })
        renderer.stroke();
        
        // render nodes
        if(this.showNodes) {
            renderer.beginPath();
            renderer.fillStyle = "red";
            this.nodes.forEach(node => {
                renderer.rect(node.x - spline.nodeHalfSize, node.y - spline.nodeHalfSize, spline.nodeSize, spline.nodeSize);
            });
            renderer.fill();                
        }
    }
}

const mouse = {
    clicked: (position) => {
        if(tagID === -1 ) {
            for(let i = 0; i < spline.nodes.length - 3; i++) {
                if(position.x >= spline.nodes[i].x - spline.nodeHalfSize
                    && position.x <= spline.nodes[i].x + spline.nodeHalfSize 
                    && position.y >= spline.nodes[i].y - spline.nodeHalfSize
                    && position.y <= spline.nodes[i].y + spline.nodeHalfSize) {
                        tagID = i;
                        break;
                    }
            }
        }
        else tagID = -1;
    },
    dragged: (position) => {
        if(tagID > -1) { spline.nodes[tagID].x = position.x; spline.nodes[tagID].y = position.y };
    }
}

class Vehicle {
    constructor(startPos = 0) {
        this.position;
        this.gradient;
        this.radians;
        this.trackPos = startPos;
        this.speed = 2;
        this.sprite;
        this.offset;
    }
    update() {
        this.trackPos += this.speed * 1 / spline.nodes[Math.floor(this.trackPos)].length;
        if (this.trackPos >= spline.nodes.length - 3) this.trackPos -= spline.nodes.length - 3;
        this.position = spline.getPoint(this.trackPos);
        this.gradient = spline.getGradient(this.trackPos);
        this.radians = Math.atan2(-this.gradient.y, this.gradient.x);
    }
    render(renderer) {
        renderer.save();
        renderer.setTransform(zoom, 0, 0, zoom,  this.position.x,  this.position.y, )
        renderer.rotate(-this.radians);
        renderer.drawImage(this.sprite, -24, this.offset);
        renderer.restore();
    } 
}

const startEngines = () => {
    // orange.sprite = new Image();
    // orange.sprite.src = "./f1.png";
    // blue.sprite = new Image();
    // blue.sprite.src = "./f1blue.png";
    orange.sprite = createCar(255, 128, 0);
    blue.sprite = createCar(100, 100, 255);
    orange.speed = 2;
    blue.speed = 3;
    orange.offset = -24;
    blue.offset = 6;

    // orange.sprite.onload = () => {
    //     blue.sprite.onload = () => {  
            window.requestAnimationFrame(loop);
    //     }
    // }
}

const loop = () => {
    // update if tagged
    if(tagID > -1) {
        for(let i = 0; i < 4; i++) {
            let currentID = tagID - i;
            if(currentID < 0) currentID += spline.nodes.length - 3;
            spline.updatePoints(currentID);
        }
    }

    viewport.clear();
    spline.render(renderer);

    // Render car
    orange.update();
    orange.render(renderer);

    blue.update();
    blue.render(renderer);

    window.requestAnimationFrame(loop);
}


class PixelManipulation {
    constructor(canvas) {
        this.context = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;
        this.image = this.context.getImageData(0, 0, this.width, this.height);
    }
    getImage() {
        this.image = this.context.getImageData(0, 0, this.width, this.height);
    }
    setImage() {
        this.context.putImageData(this.image, 0, 0);
    }

    setPixel(x, y, red, green, blue) {
        const pixelIndex = (y * this.width + x) * 4;
        this.image.data[pixelIndex] = red;
        this.image.data[pixelIndex + 1] = green;
        this.image.data[pixelIndex + 2] = blue;
        this.image.data[pixelIndex + 3] = 255;
    }
    setPixels(xOrigin, yOrigin, xWidth, yWidth, red, green, blue) {
        for(let x = xOrigin; x < xOrigin + xWidth; x++) {
            for(let y = yOrigin; y < yOrigin + yWidth; y++) {
                const pixelIndex = (y * this.width + x) * 4;
                this.image.data[pixelIndex] = red;
                this.image.data[pixelIndex + 1] = green;
                this.image.data[pixelIndex + 2] = blue;
                this.image.data[pixelIndex + 3] = 255;                
            }
        }
    }  
    fillColor(red, green, blue, alpha = 255) {
        for (let i = 0; i < this.width * this.height * 4; i+=4) {
            this.image.data[i] = red;
            this.image.data[i + 1] = green;
            this.image.data[i + 2] = blue;
            this.image.data[i + 3] = alpha;
        }      
    }
}


//         /\
          //\\
         //  \\
        //    \\
       //      \\
      //        \\
     //    *     \\
    //     *      \\
   //      *       \\  
  //                \\
 //                  \\
// ** MAGIC  BELOW ** \\

const createCar = (red, green, blue) => { 
    const carvas = document.createElement("canvas");
    const carSprite = new PixelManipulation(carvas);
    carvas.width = 32;
    carvas.height = 16;
    carSprite.setPixels(22, 0, 6, 3, 0, 0, 0);
    carSprite.setPixels(3, 1, 6, 3, 0, 0, 0);
    carSprite.setPixels(3, 12, 6, 3, 0, 0, 0);
    carSprite.setPixels(22, 13, 6, 3, 0, 0, 0);
    carSprite.setPixels(5, 4, 2, 8, 0, 0, 0);
    carSprite.setPixels(24, 3, 2, 10, 0, 0, 0);
    carSprite.setPixels(0, 3, 2, 10, red, green, blue);
    carSprite.setPixels(2, 7, 2, 2, red, green, blue);
    carSprite.setPixels(4, 6, 28, 4, red, green, blue);
    carSprite.setPixels(10, 2, 11, 12, red, green, blue);
    carSprite.setPixels(29, 0, 3, 16, red, green, blue);
    carSprite.setPixels(14, 6, 5, 4, 50, 50, 50);
    carSprite.setPixel(23, 3, 0, 0, 0);
    carSprite.setPixel(22, 4, 0, 0, 0);
    carSprite.setPixel(23, 12, 0, 0, 0);
    carSprite.setPixel(22, 11, 0, 0, 0);
    carSprite.setImage();
    return carvas;
}

// Event listeners
window.addEventListener("mousedown", (event) => mouse.clicked(viewport.getMouse(event)));
window.addEventListener("mouseup", (event) => mouse.clicked(viewport.getMouse(event)));
window.addEventListener("mousemove", (event) => mouse.dragged(viewport.getMouse(event)));
const toggleNode = document.getElementById("nodes");
toggleNode.addEventListener("click", () => spline.showNodes = !spline.showNodes);

// Global constants and variables
const width = 400;
const height = width;
const zoom = .5 * height / 600;
let tagID = -1;

// Initialization
const viewport = new Viewport(width, height);
const renderer = viewport.context;
const spline = new Spline(20);
spline.circle(); // Create splines in a circle
const orange = new Vehicle();
const blue = new Vehicle();

viewport.setBackground("darkgreen");

startEngines();




