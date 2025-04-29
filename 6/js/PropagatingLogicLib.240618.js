// PropagatingLogicLib (c) Charles Petzold, 2024
// 
// Defines buttons, gates, wires, and lights that can be wired
//  together, and which render themselves and propagate their states.

const radians = (degree) => degree * Math.PI / 180;

const degrees = (radians) => 180 * radians / Math.PI; 

function addZero(x, n) {
    while (x.toString().length < n) {
      x = "0" + x;
    }
    return x;
  }

function hexPad(x, n)
{
    let str = x.toString(16).toUpperCase();

    while (str.length < n)
    {
        str = "0" + str;
    }

    return str;
}

function time() {
    var d = new Date();
    var h = addZero(d.getHours(), 2);
    var m = addZero(d.getMinutes(), 2);
    var s = addZero(d.getSeconds(), 2);
    var ms = addZero(d.getMilliseconds(), 3);
    return h + ":" + m + ":" + s + ":" + ms;
  }

class Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        this.layout = layout;
        this.canvas = canvas;
        this.ctx = ctx;
        this.id = id;
        this.params = params;

        this.doNotPropagate = false;
        this.propertyMap = new Map();

        this.black = "#000000";
        this.red = "#FF0000";
        this.white = "#FFFFFF";

        this.fontFamily = "Tahoma,sans-serif"

        this.hidden = false;

        // Not used in all derived classes, but many 
        this.output = false;

        // Used in various classes, including TwoInputGate and Box
        this.notifies = [];
    }

    setNotifyChange(func, param)
    {
        this.notifies.push({func: func, param: param});

        // Call to initialize
        func(param, this.output);
    }

    notifyAll()
    {    
        for (let i = 0; i < this.notifies.length; i++)
        {
            let notify = this.notifies[i];
            notify.func(notify.param, this.output);
        }
    }

    setProperty(key, value)
    {
        this.propertyMap.set(key, value);

        // This is only implemented in a couple places
        if (key == "hidden")
            this.hidden = value;
    }

    // These are called shortly after the Component is created
    saveLocalTransform(matrix)
    {
        this.localMatrix = matrix;
    }

    saveGlobalTransform(matrix)
    {
        this.globalMatrix = matrix;

        this.maxScale = Math.max(
            Math.abs(this.globalMatrix.a),
            Math.abs(this.globalMatrix.b),
            Math.abs(this.globalMatrix.c),
            Math.abs(this.globalMatrix.d));
    }

    // These transform a point 
    xformLocal(pt)
    {
        let xp = this.localMatrix.a * pt.x + this.localMatrix.c * pt.y + this.localMatrix.e;
        let yp = this.localMatrix.b * pt.x + this.localMatrix.d * pt.y + this.localMatrix.f;

        return {x: xp, y: yp}; 
    }

    xformGlobal(x, y)
    {
        let xp = this.globalMatrix.a * x + this.globalMatrix.c * y + this.globalMatrix.e;
        let yp = this.globalMatrix.b * x + this.globalMatrix.d * y + this.globalMatrix.f;

        return {x: xp, y: yp};
    }

    // These apply the transform to the canvas context
    applyLocalTransform()
    {
        this.applyTransform(this.localMatrix);
    }

    applyGlobalTransform()
    {
        this.applyTransform(this.globalMatrix);
    }

    applyTransform(m)
    {
        this.ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    getCoordinates(io)
    {
        return this.xformLocal({ x:0, y:0 });
    }

    render()
    {

    }

    hittest(x, y, ul, lr)
    {
        ul = this.xformLocal(ul);
        ul = this.xformGlobal(ul.x, ul.y);

        lr = this.xformLocal(lr);
        lr = this.xformGlobal(lr.x, lr.y);  

        return (x > ul.x && x < lr.x && y > ul.y && y < lr.y);
    }

    // This function is independent of any textAlign and textBaseline settings.
    centerText(text, x, y)
    {
        // Get height information.
        let metrics = this.ctx.measureText(text);

        let ascent = metrics.actualBoundingBoxAscent;
        let descent = metrics.actualBoundingBoxDescent;                                    

        let yText = y - (descent - ascent) / 2;

        // Remove "combining overline" character
        //      for width information because of Mac bug.
        metrics = this.ctx.measureText(text.replaceAll("\u0305", ""));

        let left = metrics.actualBoundingBoxLeft;
        let right = metrics.actualBoundingBoxRight;

        let xText = x - (right - left) / 2;

        // Display the text.
        this.ctx.fillText(text, xText, yText);

        // Return the bounding box.
        return { x: xText - left, y: yText - ascent, 
                 width: right + left, height: ascent + descent }
    }
}

class Ground extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }

    setInput(num, value)
    {
        this.output = value;
        this.render();
    }

    render()
    {
        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        this.ctx.beginPath();
        this.ctx.moveTo(-10, 0);
        this.ctx.lineTo(10, 0);

        this.ctx.moveTo(-7, 4);
        this.ctx.lineTo(7, 4);

        this.ctx.moveTo(-4, 8);
        this.ctx.lineTo(4, 8);

        this.ctx.moveTo(-1, 12);
        this.ctx.lineTo(1, 12);

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#000000";
        this.ctx.stroke();

        this.ctx.restore();
    }
}

class V extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }

    render()
    {
        let pt = this.xformGlobal(0, 0);
        pt = this.xformLocal(pt);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(pt.x - 5, pt.y - 18);
        this.ctx.lineTo(pt.x, pt.y -5);
        this.ctx.lineTo(pt.x + 5, pt.y -18);

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#000000";
        this.ctx.stroke();

        this.ctx.restore();
    }
}

class Joint extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }
}

class Label extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);

        this.clearRect = undefined; 
    }

    setProperty(key, value)
    {
        super.setProperty(key, value);

        // transferring to this.text is basically for the benefit of DynamicDecimal
        if (key == "text")
            this.text = value;
    }

    render()
    {
        // Clear previous rectangle (DynamicDecimal needs it)
        if (this.clearRect != undefined)
        {
            // Expand the rectangle slightly.
            this.ctx.clearRect(this.clearRect.x - 1, this.clearRect.y - 1, 
                this.clearRect.width + 2, this.clearRect.height + 2);
        }

        if (this.text == undefined)
            return;  

        let size = this.propertyMap.get("size");
        let fontSize = 24 * (size == undefined ? 1 : size);
        
        let pt = this.xformGlobal(0, 0);
        pt = this.xformLocal(pt);

        this.ctx.save();
        this.ctx.font = fontSize + "px " + this.fontFamily;
        this.ctx.fillStyle = "#000000";

        // Center the text
        this.clearRect = this.centerText(this.text, pt.x, pt.y);
        this.ctx.restore();
    }
}

class Brace extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }

    render()
    {
        let orientation = this.propertyMap.get("orientation");
        let extent = this.propertyMap.get("extent");
        let radius = 10; 

        let n1 = 25; 
        let n2 = 20; 
        let n3 = 10; 

        let pt = this.xformGlobal(0, 0);
        pt = this.xformLocal(pt);

        this.ctx.save();
        this.ctx.translate(pt.x, pt.y);
        this.ctx.beginPath();

        if (orientation == "up")
        {
            this.ctx.moveTo(-extent, n1);
            this.ctx.lineTo(-extent, n2);
            this.ctx.arcTo(-extent, n3, -n3, n3, radius);
            this.ctx.arcTo(0, n3, 0, 0, radius);
            this.ctx.arcTo(0, n3, n3, n3, radius);
            this.ctx.arcTo(extent, n3, extent, n2, radius);
            this.ctx.lineTo(extent, n1);
        }
        else if (orientation == "right")
        {
            this.ctx.moveTo(-n1, -extent);
            this.ctx.lineTo(-n2, -extent);
            this.ctx.arcTo(-n3, -extent, -n3, -n3, radius);
            this.ctx.arcTo(-n3, 0, 0, 0, radius);
            this.ctx.arcTo(-n3, 0, -n3, n3, radius);
            this.ctx.arcTo(-n3, extent, -n2, extent, radius);
            this.ctx.lineTo(-n1, extent);
        }

        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }
}

// The base class for most other classes
class Propagator extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }
}

// SinglePropagator has a single output destination
class SinglePropagator extends Propagator
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);

        // This is the object and input index that
        //  the logic state is propagated to
        // If destinationObj is a 2-input gate, 
        //  destinationNum is 0 or 1 to indicate the input
        this.destinationObj = null;
        this.destinationNum = 0;
    }
    
    // Whenever the destination is set, 
    //  propagate the current output value to that destination.
    setDestination(destinationObj, destinationNum)
    {
        this.destinationObj = destinationObj;
        this.destinationNum = destinationNum;
        this.propagate(); 
    }

    propagate()
    {
        // Avoid propagating a value when the destination is null
        if (this.destinationObj != null && this.destinationObj.setInput != null)
        {
            this.destinationObj.setInput(this.destinationNum, this.output);
        }
    }
}

// For Incrementer/Decrementer
class VPropagator extends SinglePropagator
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);

        this.output = true;
    }

    // Copied from V
    render()
    {
        let pt = this.xformGlobal(0, 0);
        pt = this.xformLocal(pt);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(pt.x - 5, pt.y - 18);
        this.ctx.lineTo(pt.x, pt.y -5);
        this.ctx.lineTo(pt.x + 5, pt.y -18);

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#000000";
        this.ctx.stroke();

        this.ctx.restore();
    }
}

// Similar to SinglePropagator, but the output is propagated to 
//  multiple destinations. The base class for Node.
class MultiPropagator extends Propagator
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);

        // An array of destinations composed of objects and numbers
        this.destinations = [];
    }

    addDestination(destObj, destNum)
    {
        this.destinations.push( { dest: destObj, num: destNum } );
        this.propagate();
    }
    
    propagate()
    {
        for (let i = 0; i < this.destinations.length; i++)
        {
            this.destinations[i].dest.setInput(this.destinations[i].num, this.output);
        }
    }
}

class WireArray extends SinglePropagator
{
    constructor(layout, canvas, ctx, id, params, points, arrow, hidden)
    {
        super(layout, canvas, ctx, id, params);

        this.points = points;
        this.arrow = arrow; 
        this.hidden = hidden;

        this.lineWidth = 1.0; 
    }

    setInput(num, value)
    {
        if (isNaN(value) && isNaN(this.output))
            return;

        if (value != this.output)
        {
            this.output = value;

            if (!this.doNotPropagate)
            {
                this.propagate();
            }
            this.render();
        }
    }

    render()
    {
        if (this.hidden)
            return; 

        this.ctx.save();
        this.applyGlobalTransform();

        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);

        if (this.points.length == 2)
        {
            this.ctx.lineTo(this.points[1].x, this.points[1].y);
        }
        else
        {
            // curved corners
            for (let i = 1; i < this.points.length - 1; i++)
            {
                this.ctx.arcTo(this.points[i].x, this.points[i].y, 
                          this.points[i + 1].x, this.points[i + 1].y, 
                          this.params.wireCurveRadius);
            }
    
            this.ctx.lineTo(this.points[this.points.length - 1].x, 
                       this.points[this.points.length - 1].y);
        }

        if (this.arrow == "beg" || this.arrow == "both")
        {
            this.addArrow(this.points[0], this.points[1]);
        }
        if (this.arrow == "end" | this.arrow == "both")
        {
            this.addArrow(this.points[this.points.length - 1], this.points[this.points.length - 2]);
        }

        this.ctx.restore();

        this.ctx.save();
        // erase previous line with a thicker width
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.lineWidth = 2 * this.lineWidth;
        this.ctx.stroke();

        // draw new line
        this.ctx.strokeStyle = this.output ? "#FF0000" : "#000000";
        this.ctx.lineWidth = 1 * this.lineWidth;
        this.ctx.stroke();

        this.ctx.restore();
    }

    addArrow(ptLast, ptPrev, arrowLength = 10, arrowAngle = 25, close = false)
    {
        let vector = {x: ptPrev.x - ptLast.x, y: ptPrev.y - ptLast.y};
        let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        vector.x /= length;
        vector.y /= length;

        let pt1 = this.arrowPoint(vector, arrowAngle, arrowLength);
        pt1.x += ptLast.x; 
        pt1.y += ptLast.y;

        let pt2 = this.arrowPoint(vector, -arrowAngle, arrowLength);
        pt2.x += ptLast.x;
        pt2.y += ptLast.y;

        this.ctx.moveTo(pt1.x, pt1.y);
        this.ctx.lineTo(ptLast.x, ptLast.y);
        this.ctx.lineTo(pt2.x, pt2.y);

        if (close)
            this.ctx.closePath();
    }

    arrowPoint(vector, arrowAngle, arrowLength)
    {
        let vArrow = {x: 0, y: 0};
        let angle = radians(arrowAngle);

        vArrow.x = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
        vArrow.y = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);

        vArrow.x = arrowLength * vArrow.x;
        vArrow.y = arrowLength * vArrow.y;

        return vArrow;
    }
}

class InlineText extends SinglePropagator
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
        this.text = " undefined ";
        this.overline = false;
        this.rtl = false;
    }

    setProperty(key, value)
    {
        super.setProperty(key, value);

        if (key == "rtl")
        {
            this.rtl = value;
        }

        if (key == "text")
        {
            if (value.includes("|OL"))
            {
                value = value.replace("|OL", "");
                this.overline = true;
            }

            this.text = " " + value + " ";
        }
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        if (io == "end")
        {
            pt = { x: (this.rtl ? -1 : 1) * this.measureText().width, y: 0};
        }

        return this.xformLocal(pt);
    }

    setInput(num, value)
    {
        this.output = value;
        this.propagate();
        this.render();
    }

    render()
    {
        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        this.setFont();
        let metrics = this.measureText();

        // Clear the rectangle
        this.ctx.clearRect(-metrics.actualBoundingBoxLeft - (this.rtl ? metrics.width : 0), 
                            -metrics.fontBoundingBoxAscent - 2, 
                        metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
                        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent + 2);

        // Display the text                        
        this.ctx.fillStyle = this.output ? "#FF0000" : "#000000";
        this.ctx.fillText(this.text, this.rtl ? -metrics.width : 0, 0);

        // Render a possible overline (for instruction decoding in Chapter 23)
        // NOTE: Not modified for RTL!
        if (this.overline)
        {
            this.ctx.strokeStyle = this.output ? "#FF0000" : "#000000";
            this.ctx.beginPath();
            this.ctx.moveTo(-metrics.actualBoundingBoxLeft, -metrics.fontBoundingBoxAscent);
            this.ctx.lineTo(metrics.actualBoundingBoxRight, -metrics.fontBoundingBoxAscent);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    measureText()
    {
        this.ctx.save();
        this.setFont();
        let metrics = this.ctx.measureText(this.text);
        this.ctx.restore();

        return metrics;
    }

    setFont()
    {
        this.ctx.font = "14px " + this.fontFamily;
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
    }
}

// The Node class is a dot from which multiple wires extend
class Node extends MultiPropagator
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }

    setInput(num, value)
    {
        if (isNaN(value) && isNaN(this.output))
            return;

        if (value != this.output)
        {
            this.output = value;

            if (!this.doNotPropagate)
            {
                this.propagate();
            }
            this.render();
        }
    }

    render()
    {
        if (this.hidden)
            return;

        let pt = this.xformLocal({x:0, y:0});
        pt = this.xformGlobal(pt.x, pt.y);

        this.ctx.save();
        this.ctx.fillStyle = this.output ?"#FF0000" : "#000000";

        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, this.params.nodeRadius, 0, radians(360));
        this.ctx.fill();
    
        this.ctx.restore();
    }
}

class ComplexPropagator extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);

        this.propagateMap = new Map()
    }

    // srcOut is an output port, dstObj a wire, dstInp is zero
    setDestinationEx(srcOut, dstObj, dstInp)
    {
        this.propagateMap.set(srcOut, {obj: dstObj, inp: dstInp});

        // In case a wire is set to an output after inputs have been set
        this.setOutputs();
    }

    setOutputs()
    {
    }

    propagate(srcOut, value)
    {
        if (!this.propagateMap.has(srcOut))
            return;

        let destination = this.propagateMap.get(srcOut);

        destination.obj.setInput(destination.inp, value);
    }
}
