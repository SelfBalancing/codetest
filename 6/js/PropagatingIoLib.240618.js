// PropagatingIoLib (c) Charles Petzold, 2024

// Switches and Lights

class Switch extends MultiPropagator
{
    constructor(layout, canvas, ctx, id, params, value = false)
    {
        super(layout, canvas, ctx, id, params);

        this.width = 60;
        this.output = value;
        this.closed = value;

        canvas.addEventListener("click", this.onClick.bind(this));
    }

    setProperty(prop, value)
    {
        if (prop == "closed")
        {
            this.closed = value;
            this.render();
            return;
        }

        super.setProperty(prop, value)
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        switch(io)
        {
            case "out": pt = { x:this.width, y:0}; break;
            case "middle":
            case "center": pt = {x:this.width / 2, y:0}; break;
        }

        return this.xformLocal(pt);
    }

    satisfiesCondition(trigger)
    {
        if (trigger == "closed")    // only value
            return this.output;
    }

    render()
    {
        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        // First erase the lever
        this.drawLever(!this.closed, "#FFFFFF");
        this.drawLever(this.closed, "#FFFFFF");

        // Then draw the lever
        this.drawLever(this.closed, this.output ? "#FF0000" : "#000000");

        // Draw the two connectors
        this.ctx.fillStyle = this.output ? "#FF0000" : "#000000";

        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, radians(360));
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(0 + this.width, 0, 5, 0, radians(360));
        this.ctx.fill();

        this.ctx.restore();
    }

    drawLever(closed, color)
    {
        this.ctx.save();
        this.ctx.rotate(radians(!closed? -20 : 0));            
        this.ctx.strokeStyle = color;
    
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0 + this.width + 7, 0 -7);
        this.ctx.lineWidth = color == "#FFFFFF" ? 6 : 4;
        this.ctx.lineCap = "round";
        this.ctx.stroke();

        this.ctx.restore();
    }

    onClick(event)
    {
        if (this.hittest(event.offsetX, event.offsetY, {x:0, y:-40}, {x:this.width, y:10 }))
        {
            this.closed = !this.closed;

            this.setOutput();
            
            if (this.notifyFunc != undefined)
            {
                this.notifyFunc(this.id);                
            }
        }
    }

    setOutput()
    {
        if (this.doNotPropagate == undefined || !this.doNotPropagate)
        {
            this.output = this.closed;
            this.propagate();
        }

        this.render();
    }

    notifyChange(func)
    {
        this.notifyFunc = func;
    }
}

// The Lightbulb needs to propagate to the other terminal 
class Lightbulb extends SinglePropagator
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        switch(io)
        {
            case "left": pt = { x:-10, y:0}; break;
            case "right": pt = { x:10, y:0}; break;
        }

        return this.xformLocal(pt);
    }

    setInput(num, value)
    {
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
        const radius = 50;      

        this.ctx.save();

        this.applyGlobalTransform();
        this.applyLocalTransform();
        this.ctx.translate(0, -1.5 * radius); // center of bulb

        // Wipe the filament and rays clean
        this.ctx.save();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "#FFFFFF"
        this.filament();
        this.rays(radius);
        this.ctx.restore();

        // Draw bulb
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#000000";
        this.bulb(radius);

        // Draw filament
        if (this.output)
        {
            this.ctx.strokeStyle = "#FF0000";
        }
        this.filament();
    
        // Draw rays
        if (this.output)
        {
            this.rays(radius);
        }
    
        this.ctx.restore();
    }

    bulb(radius)
    {
        this.ctx.beginPath();
        this.ctx.moveTo(0, 1.5 * radius);      // center bottom base
        this.ctx.lineTo(-radius / 2, 1.5 * radius);    // left bottom base
        this.ctx.lineTo(-radius / 2, radius);
        // bottom left corner
        this.ctx.bezierCurveTo(-radius / 2, 0.6 * radius,
                        -radius, 0.55 * radius,
                        -radius, 0);
        // top left quarter
        this.ctx.bezierCurveTo(-radius, -0.55 * radius, 
                          -0.55 * radius, -radius,
                          0, -radius);
        // top right quarter                      
        this.ctx.bezierCurveTo(0.55 * radius, -radius,
                          radius, -0.55 * radius,
                          radius, 0);
        // bottom right quarter                      
        this.ctx.bezierCurveTo(radius, 0.55 * radius,
                          radius / 2, 0.6 * radius,
                          radius / 2, radius); 
        this.ctx.lineTo(radius / 2, 1.5 * radius);     // right bottom base
        this.ctx.lineTo(0, 1.5 * radius);      // center bottom base                 
        this.ctx.stroke();
    }

    filament()
    {
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 75); // 100);
        this.ctx.lineTo(-10, 35);
        this.ctx.lineTo(-30, 0);
        this.ctx.lineTo(-25, 0);
        this.ctx.lineTo(-20, -10);
        this.ctx.lineTo(-15, 10);
        this.ctx.lineTo(-10, -10);
        this.ctx.lineTo(-5, 10);
        this.ctx.lineTo(0, -10);
        this.ctx.lineTo(5, 10);
        this.ctx.lineTo(10, -10);
        this.ctx.lineTo(15, 10);
        this.ctx.lineTo(20, -10);
        this.ctx.lineTo(25, 0);
        this.ctx.lineTo(30, 0);
        this.ctx.lineTo(10, 35);
        this.ctx.lineTo(10, 75);
        this.ctx.stroke();
    }

    rays(radius)
    {
        this.ctx.beginPath();
        this.ctx.rotate(radians(135));

        for (var i = 0; i < 13; i++)
        {
            var length = 1.7 - 0.2 * (i & 1);

            this.ctx.moveTo(1.2 * radius, 0);
            this.ctx.lineTo(length * radius, 0);
            this.ctx.rotate(radians(22.5));
        }

        this.ctx.stroke();
    }
}

class Battery extends Component
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        switch(io)
        {
            case "neg": pt = { x:0, y:0}; break;
            case "pos": pt = { x:80, y:0}; break;
        }

        return this.xformLocal(pt);
    }
    render()
    {
        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        
        this.ctx.ellipse(0, 0, 5, 20, 0, 0, radians(360));
    
        this.ctx.moveTo(0, -20);
        this.ctx.lineTo(70, -20);
    
        this.ctx.moveTo(0, 20);
        this.ctx.lineTo(70, 20);
    
        this.ctx.ellipse(70, 0, 5, 20, 0, radians(90), radians(270), true);
    
        this.ctx.moveTo(75, -5);
        this.ctx.lineTo(77, -5);
        this.ctx.arcTo(80, -5, 80, -2, 3);
        this.ctx.lineTo(80, 2);
        this.ctx.arcTo(80, 5, 77, 5, 3);
        this.ctx.lineTo(75, 5);
    
        this.ctx.stroke();

        this.ctx.restore();
    }
}

// The DigitButton outputs a 1 or 0 based on mouse clicks or touch taps.
// Derives from MultiPropagator rather than SinglePropagator in case a V attached as in Chapter 10
class DigitButton extends MultiPropagator 
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);

        this.width = 60;
        this.height = 60;

        canvas.addEventListener("click", this.onClick.bind(this));
    }

    setProperty(prop, value)
    {
        if (prop == "initial")
        {
            this.output = value;
            this.render();
            this.propagate();
            return;
        }

        super.setProperty(prop, value)
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        switch(io)
        {
            case "top": pt = { x: 0, y: -this.height / 2}; break;
            case "right": pt = { x:this.width / 2, y:0}; break;
            case "bottom": pt = { x:0, y:this.height / 2}; break;
            case "left": pt = { x:-this.width / 2, y:0}; break;
        }

        return this.xformLocal(pt);
    }

    render()
    {
        let label0 = this.propertyMap.has("label0") ? this.propertyMap.get("label0") : "0";
        let label1 = this.propertyMap.has("label1") ? this.propertyMap.get("label1") : "1";

        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        // Background: Pink or Gray
        this.ctx.fillStyle = this.output ? "#FFC0C0" : "#E0E0E0";
        this.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Frame: Red or Gray
        this.ctx.strokeStyle = this.output ? "#FF0000" : "#404040";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(-this.width / 2 + 2, -this.height / 2 + 2, 
                        this.width - 4, this.height - 4);

        // Text: Black
        var fontSize = Math.round(0.75 * this.height);

        this.ctx.font = fontSize + "px " + this.fontFamily;
        this.ctx.fillStyle = "#000000";
        this.centerText(this.output ? label1 : label0, 0, 0);

        this.ctx.restore();  
    }

    onClick(event)
    {
        let ul = { x: -this.width / 2, y: -this.height / 2};
        let lr = { x:  this.width / 2, y:  this.height / 2};

        if (this.hittest(event.offsetX, event.offsetY, ul, lr))
        {
            this.output = !this.output;
            this.render();
            this.propagate();

            this.notifyAll();
        }
    }
}

// Only used in Chapter 10 examples
class SimpleLight extends SinglePropagator
{
    constructor(layout, canvas, ctx, id, params)          
    {
        super(layout, canvas, ctx, id, params);

        this.radius = 30;
        this.rayInner = 1.2;
        this.rayOuter = 1.7;
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        switch(io)
        {
            case "inp": pt = { x: -this.radius, y: 0}; break;        // used in Chapter 10 decoder    
            case "out": pt = { x: this.radius, y: 0}; break;         // used in Chapter 10 decoder
        }

        return this.xformLocal(pt);
    }

    setInput(num, value)
    {
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
        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        this.ctx.clearRect(-this.radius, -this.radius, 2 * this.radius, 2 * this.radius);

        // Draw filament
        this.ctx.strokeStyle = this.output ? "#FF0000" : "#000000";
        this.filament();

        // Draw circle
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath()
        this.ctx.arc(0, 0, this.radius, radians(0), radians(360));
        this.ctx.stroke();    
        
        // Draw rays
        this.ctx.strokeStyle = this.output ? "#FF0000" : "#FFFFFF";
        this.ctx.lineWidth = this.output ? 1 : 3;

        this.ctx.beginPath();

        for (let i = 0; i < 16; i++)
        {
            if (i != 0 && i != 8)
            {
                let length = this.rayOuter - 0.2 * (i & 1);
                this.ctx.moveTo(this.rayInner * this.radius, 0);
                this.ctx.lineTo(length * this.radius, 0);
            }
            this.ctx.rotate(radians(22.5));
        }

        this.ctx.stroke();

        this.ctx.restore();            
    }

    filament()
    {
        this.ctx.beginPath();

        let radius = this.radius;

        this.ctx.moveTo(-radius, 0);
        this.ctx.lineTo(-radius + 6, 0);
        this.ctx.lineTo(-radius + 8, -10);

        for (let i = 0; i < 5; i++)
        {
            this.ctx.lineTo(-radius + 12 + 8 * i, 10);  // down
            this.ctx.lineTo(-radius + 16 + 8 * i, -10); // up
        }

        this.ctx.lineTo(radius - 8, 10);    // down
        this.ctx.lineTo(radius - 6, 0);     // half up
        this.ctx.lineTo(radius, 0);

        this.ctx.stroke();
    }
}

class BitLight extends SinglePropagator
{
    constructor(layout, canvas, ctx, id, params)          
    {
        super(layout, canvas, ctx, id, params);

        this.width = 60;    // this is altered by HexLight and WordLight
        this.height = 60;
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        switch(io)
        {
            case "inp": pt = { x: -this.width / 2, y: 0}; break; 
            case "left": pt = { x: -this.width /2, y: 0}; break;
            case "top": pt = {x: 0, y: -this.height / 2}; break;
            case "bottom": pt = {x: 0, y: this.height / 2}; break;
        }

        return this.xformLocal(pt);
    }
    setInput(num, value)
    {
        if (value != this.output)
        {
            this.output = value;

            if (!this.doNotPropagate)
            {
                this.propagate();
            }
            this.render();
        }

        this.notifyAll();
    }


    render()
    {
        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        this.ctx.clearRect(-this.width / 2 - 2, 
                           -this.height / 2 - 2, 
                           this.width + 4, this.height + 4);

        var fontSize = Math.round(0.75 * this.height);

        this.ctx.font = fontSize + "px " + this.fontFamily;
        this.ctx.fillStyle = this.getColor();
        this.centerText(this.getText(), 0, 0);

        this.ctx.strokeStyle = this.getColor();
        this.ctx.lineWidth = 3;
        this.ctx.beginPath()

        // Rounded rectangle (so works for HexLight and WordLight)
        let w = this.width;
        let r = this.height / 2;

        this.ctx.moveTo(-w / 2 + r, -r);
        this.ctx.lineTo(w / 2 - r, -r);
        this.ctx.arcTo(w / 2, -r, w / 2, 0, r);     // ur
        this.ctx.arcTo(w / 2, r, w / 2 - r, r, r);  // lr
        this.ctx.lineTo(-w / 2 + r, r);
        this.ctx.arcTo(-w / 2, r, -w / 2, 0, r);            // ll
        this.ctx.arcTo(-w / 2, -r, -w / 2 + r, -r, r);    // ul
        this.ctx.closePath();
        this.ctx.stroke();                

        this.ctx.restore();            
    }

    getColor()
    {
        return this.output ? "#FF0000" : "#000000";
    }

    getText()
    {
        return this.output ? "1" : "0";
    }
}

class HexLight extends BitLight
{
    constructor(layout, canvas, ctx, id, params)          
    {
        super(layout, canvas, ctx, id, params);

        this.output = NaN;
        this.width = 120;
        this.numChars = 2;
    }
    getColor()
    {
        return "#000000";
    }
    getText()
    {
        if (this.output == undefined ||
            this.output == null ||
            isNaN(this.output))
            {
                return "";
            }

        return this.output.toString(16).toUpperCase().padStart(this.numChars, "0") + "h";
    }
}

class WordLight extends HexLight
{
    constructor(layout, canvas, ctx, id, params)          
    {
        super(layout, canvas, ctx, id, params);
        this.width = 180;
        this.numChars = 4;
    }
}

class MomentaryButton extends SinglePropagator
{
    constructor(layout, canvas, ctx, id, params, value = false)
    {
        super(layout, canvas, ctx, id, params);

        this.width = 60;
        this.height = 60;

        this.output = value;

        // Pointer stuff
        this.pointerId = -1;
        canvas.addEventListener("pointerdown", this.pointerDown.bind(this));
        canvas.addEventListener("pointerup", this.pointerUp.bind(this));
        canvas.addEventListener("lostpointercapture", this.lostPointerCapture.bind(this));
    }

    getCoordinates(io)
    {
        let pt = { x: 0, y: 0 };

        switch(io)
        {
            case "right": pt = { x:this.width / 2, y:0}; break;
            case "bottom": pt = { x:0, y:this.height / 2}; break;
            case "left": pt = {x:-this.width / 2, y:0}; break;
            case "top": pt = {x: 1, y: -this.height / 2 }; break;
        }

        return this.xformLocal(pt);
    }


    pointerDown(event)
    {
        let ul = { x: -this.width / 2, y: -this.height / 2};
        let lr = { x:  this.width / 2, y:  this.height / 2};

        if (this.hittest(event.offsetX, event.offsetY, ul, lr))
        {
            this.output = true;
            this.render();
            this.propagate();

            this.canvas.setPointerCapture(event.pointerId);
            this.pointerId = event.pointerId;
        }
    }

    pointerUp(event)
    {
        if (event.pointerId == this.pointerId)
        {
            this.output = false;
            this.render();
            this.propagate();

            this.canvas.releasePointerCapture(this.pointerId);
            this.pointerId = -1;
        }
    }

    lostPointerCapture(event)
    {
        if (event.pointerId == this.pointerId)
        {
            this.output = false;
            this.render();
            this.propagate();

            this.pointerId = -1;
        }
    }

    render()
    {
        this.ctx.save();
        this.applyGlobalTransform();
        this.applyLocalTransform();

        // Background: Pink or Gray
        this.ctx.fillStyle = this.output ? "#FFC0C0" : "#E0E0E0";
        this.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Frame: Red or Gray
        this.ctx.strokeStyle = this.output ? "#FF0000" : "#404040";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(-this.width / 2 + 2, -this.height / 2 + 2, 
                       this.width - 4, this.height - 4);
/*
        // Text: Black
        var fontSize = Math.round(0.75 * this.height);

        this.ctx.font = fontSize + "px " + this.fontFamily;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "#000000";
*/
        this.ctx.restore();            
    }
}

const opcodeMnemonics = 
[
    "NOP", "LXI B,data16", "STAC B", "INX B", "INR B", "DCR B", "MVI B,data", "RLC",            // 00 - 07
    "undefined", "DAD B", "LDAX B", "DCX B", "INR C", "DCR C", "MVI C,data", "RRC",             // 08 - 0F
    "undefined", "LXI D,data16", "STAX D", "INX D", "INR D", "DCR D", "MVI D,data", "RAL",      // 10 - 17
    "undefined", "DAD D", "LDAX D", "DCX D", "INR E", "DCR E", "MVI E,data", "RAR",             // 18 - 1F
    "RIM (8085)", "LXI H,data16", "SHLD addr", "INX H", "INR H", "DCR H", "MVI H,data", "DAA",  // 20 - 27
    "undefined", "DAD H", "LHLD addr", "DCX H", "INR L", "DCR L", "MVI L,data", "CMA",          // 28 - 2F
    "SIM (8085)", "LXI SP,data16", "STA addr", "INX SP", "INR M", "DCR M", "MVI M,data", "STC", // 30 - 37
    "undefined", "DAD SP", "LDA addr", "DCX SP", "INR A", "DCR A", "MVI A,data", "CMC",         // 38 - 3F
    "MOV B,B", "MOV B,C", "MOV B,D", "MOV B,E", "MOV B,H", "MOV B,L", "MOV B,M", "MOV B,A",     // 40 - 47
    "MOV C,B", "MOV C,C", "MOV C,D", "MOV C,E", "MOV C,H", "MOV C,L", "MOV C,M", "MOV C,A",     // 48 - 4F
    "MOV D,B", "MOV D,C", "MOV D,D", "MOV D,E", "MOV D,H", "MOV D,L", "MOV D,M", "MOV D,A",     // 50 - 57
    "MOV E,B", "MOV E,C", "MOV E,D", "MOV E,E", "MOV E,H", "MOV E,L", "MOV E,M", "MOV E,A",     // 58 - 5F
    "MOV H,B", "MOV H,C", "MOV H,D", "MOV H,E", "MOV H,H", "MOV H,L", "MOV H,M", "MOV H,A",     // 60 - 67
    "MOV L,B", "MOV L,C", "MOV L,D", "MOV L,E", "MOV L,H", "MOV L,L", "MOV L,M", "MOV L,A",     // 68 - 6F
    "MOV M,B", "MOV M,C", "MOV M,D", "MOV M,E", "MOV M,H", "MOV M,L", "HLT",     "MOV M,A",     // 70 - 7F
    "MOV A,B", "MOV A,C", "MOV A,D", "MOV A,E", "MOV A,H", "MOV A,L", "MOV A,M", "MOV A,A",     // 77 - 7F
    "ADD B", "ADD C", "ADD D", "ADD E", "ADD H", "ADD L", "ADD M", "ADD A",                     // 80 - 87
    "ADC B", "ADC C", "ADC D", "ADC E", "ADC H", "ADC L", "ADC M", "ADC A",                     // 88 - 8F
    "SUB B", "SUB C", "SUB D", "SUB E", "SUB H", "SUB L", "SUB M", "SUB A",                     // 90 - 97
    "SBB B", "SBB C", "SBB D", "SBB E", "SBB H", "SBB L", "SBB M", "SBB A",                     // 98 - 9F
    "ANA B", "ANA C", "ANA D", "ANA E", "ANA H", "ANA L", "ANA M", "ANA A",                     // A0 - A7
    "XRA B", "XRA C", "XRA D", "XRA E", "XRA H", "XRA L", "XRA M", "XRA A",                     // A8 - AF
    "ORA B", "ORA C", "ORA D", "ORA E", "ORA H", "ORA L", "ORA M", "ORA A",                     // B0 - B7
    "CMP B", "CMP C", "CMP D", "CMP E", "CMP H", "CMP L", "CMP M", "CMP A",                     // B8 - BF
    "RNZ", "POP B", "JNZ addr", "JMP addr", "CNZ addr", "PUSH B", "ADI data", "RST 0",          // C0 - C7
    "RZ", "RET", "JZ addr", "undefined", "CZ addr", "CALL addr", "ACI data", "RST 1",           // C8 - CF
    "RNC", "POP D", "JNC addr", "OUT data", "CNC addr", "PUSH D", "SUI data", "RST 2",          // D0 - D7
    "RC", "undefined", "JC addr", "IN data", "CC addr", "undefined", "SBI data", "RST 3",       // D8 - DF
    "RPO", "POP H", "JPO addr", "XTHL", "CPO addr", "PUSH H", "ANI data", "RST4",               // E0 - E7
    "RPE", "PCHL", "JPE addr", "XCHG", "CPE addr", "undefined", "XRI data", "RST 5",            // E8 - EF
    "RP", "POP PSW", "JP addr", "DI", "CP addr", "PUSH PSW", "ORI data", "RST 6",               // F0 - F7
    "RM", "SPHL", "JM addr", "EI", "CM addr", "undefined", "CPI data", "RST 7"                  // F8 - FF
];

const implemented1 = // implemented by Chapter 23 Instruction Decoder
[
    1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,                     // 0x
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,                     // 1x
    0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0,                     // 2x
    0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0,                     // 3x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // 4x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // 5x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // 6x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // 7x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // 8x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // 9x
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // Ax
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,                     // Bx
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,                     // Cx
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,                     // Dx
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,                     // Ex
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,                     // Fx
]

class DynamicDecimal extends Label
{
    constructor(layout, canvas, ctx, id, params)
    {
        super(layout, canvas, ctx, id, params);
        this.value = 0;
        this.hexOnly = false;
        this.twosComp = false;
        this.showBits = 0;

        this.isBytes = false;
        this.byteValues = [];  
        this.lookup = undefined;
        this.lookupOnly = false;    
    }

    setProperty(key, value)
    {
        super.setProperty(key, value);

        // The display number is a composite of bits
        if (key == "digits")
        {
            for (var prop in value)
            {
                if (value.hasOwnProperty(prop))
                {
                    let bit = prop;

                    // Access the global compMap in the saved layout object
                    let gate = this.layout.compMap.get(value[prop]);
                    gate.setNotifyChange(this.onChange.bind(this), bit);

                    // Initialize
                    this.onChange(bit, gate.output);
                }
            }                
        }

        // The displayed number is a composite of bytes
        else if (key == "bytes")
        {
            this.isBytes = true;

            for (var prop in value)
            {
                if (value.hasOwnProperty(prop))
                {
                    this.byteValues.push(0);

                    let byte = prop;
                    let gate = this.layout.compMap.get(value[prop]);
                    gate.setNotifyChange(this.onChange.bind(this), byte);
                }
            }
        }
        else if (key == "hexOnly")
        {
            this.hexOnly = value;
        }
        else if (key == "twosComp")
        {
            this.twosComp = value;
        }
        else if (key == "lookup")
        {
            this.lookup = new Map();

            if (value.constructor === String && value.startsWith("opcodes"))
            {
                let type = parseInt(value.substring(7));
                let implemented = [];

                switch (type)
                {
                    case 1: implemented = implemented1; break;
                }

                opcodeMnemonics.forEach((element, index) => 
                    this.lookup.set(index.toString(), element + 
                        (element == "undefined" || implemented1[index] == 1 ? "" : " (not implemented)")));
            }
            else
            {
                for (var prop in value)
                {
                    this.lookup.set(prop, value[prop]);
                }
            }
        }
        else if (key == "lookupOnly")
        {
            this.lookupOnly = true;
        }
        else if (key == "showBits")
        {
            this.showBits = value;
        }
    }

    // param is the bit (or byte) location, value is true or false (or byte value)
    onChange(param, value)
    {
        if (!this.isBytes)
        {
            // Shift to isolate the bit to set
            let bit = 1 << param;

            // First turn off bit
            this.value &= ~bit;

            // Then possibly turn on bit
            if (value)
            {
                this.value |= bit;
            }

            // Show individual bits
            if (this.showBits != 0)
            {
                this.text = "";

                for (let i = 0; i < this.showBits; i++)
                {
                    this.text = (((this.value & (1 << i)) != 0) ? " 1" : " 0") + this.text;
                }
            }
            else
            {
                // Render this using base class Label
                if (this.value < 256)
                {
                    this.text = ("0" + this.value.toString(16)).substr(-2).toUpperCase() + "h";
                }
                else
                {
                    this.text = this.value.toString(16).toUpperCase() + "h"; 
                }
            }

            // Copied from below and modified slightly
            if (this.lookup != undefined)
            {
                let strValue = this.value.toString(10)

                if (this.lookup.has(strValue))
                {
                    if (this.lookupOnly)
                    {
                        this.text = this.lookup.get(strValue);
                    }
                    else
                    {
                        this.text += " = " + this.lookup.get(strValue);
                    }
                }
                else 
                {
                    this.text = "";
                }
            }
            else if (!this.hexOnly)
            {
                this.text += " = ";

                if (!this.twosComp || this.value < 128)
                {
                    this.text += this.value;
                }
                else
                {
                    this.text += this.value - 256;
                }
            }
        }
        else
        {
            this.byteValues[param] = value;
            this.text = "";
            let totalValue = 0;
            let isNegative = (this.byteValues.length > 1) && ((this.byteValues[this.byteValues.length - 1] & 0x80) != 0);

            for (let i = this.byteValues.length - 1; i >= 0; i--)
            {
                let byteValue = this.byteValues[i];
                totalValue = 256 * totalValue + byteValue;

                this.text += ("0" + byteValue.toString(16)).substr(-2).toUpperCase();

                if (i > 0)
                    this.text += " ";
            }

            if (this.byteValues.length == 1)
            {
                this.text += "h";
            }

            if (this.lookup != undefined)
            {
                let strValue = totalValue.toString(10)

                if (this.lookup.has(strValue))
                {
                    if (this.lookupOnly)
                    {
                        this.text = this.lookup.get(strValue);
                    }
                    else
                    {
                        this.text += " = " + this.lookup.get(strValue);
                    }
                }
                else 
                {
                    this.text = "";
                }
            }

            else if (!this.hexOnly)
            {
                if (isNegative)
                {
                    totalValue -= Math.pow(2, 8 * this.byteValues.length);
                }

                this.text += " = " + totalValue;
            }
        }
        
        this.render.bind(this)();
    }
}
