// StructuredLayoutLib (c) Charles Petzold, 2024

class CircuitBuilder
{
    constructor(canvas, circuit)
    {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
     //   this.ctx.textRendering = "optimizeLegibility";
        this.circuit = circuit;

        this.params = { propagationDelay: 100,
                        nodeRadius: 5,
                        wireCurveRadius: 20,
                        dataPathWidth: 18, 
                        triStateMap: new Map(),
                        cpuIncludeJumps: false,             // Only for Chapter 23, 24 CPUs
                        cpuAltMemory: false,                // Only for Chapter 23, 24 CPUs
                      };

        this.compMap = new Map();    // basic lookup for components
        this.wireMap = new Map();    // lookup for wires for "testable" circuits
        
        this.externalMatrices = new Map();
        this.accumulatedMatrix = new DOMMatrix();
        
        // Saved for "testable" circuits;
        this.dependencies = undefined;

        this.closedCircles = [];

        // Prevent click and pointer handlers from selecting text outside canvas        
        canvas.onselectstart = this.onSelectStart.bind(this);
        
        this.BuildCircuit(this.circuit);
    }

    onSelectStart(event)
    {
        return false;
    }

    BuildCircuit(circuit)
    {
        // Save for "testable" and "consistency" circuits
        this.dependencies = circuit.dependencies;

        if (circuit.transform != undefined)
        {
            let circuitMatrix = this.ConstructMatrix(circuit.transform.scale, circuit.transform.rotate, 
                                                    circuit.transform.x, circuit.transform.y);

            this.accumulatedMatrix = new DOMMatrix(circuitMatrix);                                        
        }

        if (circuit.propagationDelay != undefined)
        {
            this.params.propagationDelay = circuit.propagationDelay;
        }

        // Set from circuit properties
        if (circuit.nodeRadius != undefined)
        {
            this.params.nodeRadius = circuit.nodeRadius;
        }

        if (circuit.wireCurveRadius != undefined)
        {
            this.params.wireCurveRadius = circuit.wireCurveRadius;
        }

        if (circuit.cpuIncludeJumps != undefined)
        {
            this.params.cpuIncludeJumps = circuit.cpuIncludeJumps;
        }

        if (circuit.cpuAltMemory != undefined)
        {
            this.params.cpuAltMemory = circuit.cpuAltMemory;
        }

        this.BuildCircuit2(circuit);
    }

    BuildExternal(circuit, fullName, item)
    {
        // Save the current global matrix
        let accumulatedMatrixSave = new DOMMatrix(this.accumulatedMatrix);

        // Get the matrix applied to the External reference
        let externalMatrix = this.ConstructMatrix(item.scale, item.rotate, item.x, item.y);

        // Save that in the dictionary with the fullName
        this.externalMatrices.set(fullName, externalMatrix);

        // Also multiply it into the accumulated matrix
        this.accumulatedMatrix.multiplySelf(externalMatrix);

        this.BuildCircuit2(circuit, fullName); 

        // Restore the previous accumulated matrix
        this.accumulatedMatrix = accumulatedMatrixSave;
    }

    BuildCircuit2(circuit, prefix = null)
    {    
        // Do all the components (gates, buttons, lights) first
        for (let i = 0; i < circuit.components.length; i++)
        {
            let item = circuit.components[i];

            // Avoid "comment" items
            if (item.comment != undefined)
                continue;

            // Construct composite name
            let fullName = this.FormFullName(item.name, prefix);
        
            // External reference causes recursive call
            if (item.type == "External")
            {
                // The fullName becomes the new prefix; 
                //      item is used for constructing the matrix and saving it.
                this.BuildExternal(eval(item.file), fullName, item);
            }
            else
            {
                // Get the item's coordinates
                let pos = this.GetCoordinates(item, prefix, this.compMap);

                // Create the component
                let cl = eval(item.type);
                let component = new cl(this, this.canvas, this.ctx, fullName, Object.assign({}, this.params));
                
                // For "testable" circuits, do not propagate
                if (circuit.testable != undefined && circuit.testable)
                {
                    component.doNotPropagate = true;
                }

                // Set the local and global transforms
                let localMatrix = this.ConstructMatrix(item.scale, item.rotate, pos.x, pos.y);

                component.saveLocalTransform(localMatrix)
                component.saveGlobalTransform(this.accumulatedMatrix);

                // Set properties that are specific to gate (most notable: "text" for Label)
                for (var prop in item)
                {
                    if (item.hasOwnProperty(prop))
                    {
                        if (prop != "name" && prop != "type" && prop != "relative" &&
                            prop != "x" && prop != "y" && prop != "scale" && prop != "rotate")
                            {
                                component.setProperty(prop, item[prop]);
                            }
                    }
                }

                // Save it in the map
                this.compMap.set(fullName, component);
            }
        }

        // Render all the components
        for (let[name, component] of this.compMap)
        {
            component.render();
        }

        // Now do the wires
        if (circuit.wires != null)
        {
            for (let i = 0; i < circuit.wires.length; i++)
            {
                let item = circuit.wires[i];

                if (item.comment != undefined)
                    continue;

                let points = [];
                let components = [];
                let ptLast = {x:0, y:0};

                for (let j = 0; j < item.points.length; j++)
                {
                    let ptref = item.points[j];

                    // check for x and y defined
                    let x = ptref.x != undefined ? ptref.x : 0;
                    let y = ptref.y != undefined ? ptref.y : 0;
                    let pt = {x: x, y: y};

                    if (ptref.name != undefined)
                    {
                        let fullName = this.FormFullName(ptref.name, prefix);
                        let component = this.compMap.get(fullName);
                        let ptComp = component.getCoordinates(ptref.io, true);
                        ptComp = this.ApplyIntermediateTransform(ptref.name, prefix, ptComp);

                        pt.x += ptComp.x;
                        pt.y += ptComp.y;

                        components.push({"name": fullName, "io": ptref.io});      // for wireMap
                    }
                    else if (ptref.dx != undefined || ptref.dy != undefined)
                    {
                        if (ptref.dx != undefined)
                            pt.x = ptLast.x + ptref.dx;

                        if (ptref.dy != undefined)
                            pt.y = ptLast.y + ptref.dy;                        
                    }

                    ptLast = pt;
                    points.push(pt);
                }

                // Create the wire
                let wide = item.wide != undefined ? item.wide : false;
                let chars = item.chars != undefined ? item.chars : 2;
                let beg = item.beg != undefined ? item.beg : "close";
                let end = item.end != undefined ? item.end : "arrow";
                let wide16 = item.wide16 != undefined ? item.wide16 : false;
                let pos = item.pos != undefined ? item.pos : undefined;
                let nudge = item.nudge != undefined ? item.nudge : 0;
                let hidden = item.hidden != undefined ? item.hidden : false;
                let arrow = item.arrow != undefined ? item.arrow : "none";

                let wire = !wide && !wide16 ? new WireArray(this, this.canvas, this.ctx, i, this.params, points, arrow, hidden) : 
                                              new DataPath(this, this.canvas, this.ctx, i, this.params, points, chars, beg, end, wide16, pos, nudge);

                wire.saveGlobalTransform(this.accumulatedMatrix); 

                // For "testable" circuits, do not propagate
                if (circuit.testable != undefined && circuit.testable)
                {
                    wire.doNotPropagate = true;
                }

                wire.render();

                // This is to sidestep problems with the Relay (needed any longer?)
                if (item.propagate != false)
                {
                    // Attach first component to the wire
                    let firstComponent = this.compMap.get(this.FormFullName(item.points[0].name, prefix));

                    // If "hook" property is defined used that as the source of the wire
                    if (item.points[0].hook != undefined)
                    {
                        firstComponent = this.compMap.get(this.FormFullName(item.points[0].hook, prefix));
                    }

                    if (typeof firstComponent.setDestination == 'function') 
                    {
                        firstComponent.setDestination(wire, 0);
                    }
                    else if (typeof firstComponent.addDestination == 'function')
                    {
                        // The second argument was always zero until I needed a bit from a DataPathNode in the ALU, so...
                        if (item.points[0].output == undefined)
                        {
                            firstComponent.addDestination(wire, 0);
                        }
                        else
                        {
                            firstComponent.addDestination(wire, item.points[0].output);
                        }
                    }

                    // Added for boxes: "output" is "q" or "qbar"; for Transistor, "output" could be "E"
                    else if (typeof firstComponent.setDestinationEx == 'function')
                    {
                        firstComponent.setDestinationEx(item.points[0].output, wire, 0);
                    }

                    // Attach wire to last component
                    let lastPtref = item.points[item.points.length - 1];
                    let lastComponent = this.compMap.get(this.FormFullName(lastPtref.name, prefix));

                    // find destination input (0 or 1 for gates; "data" or "clk" for flip-flops)
                    let input = lastPtref.input == undefined ? 0 : lastPtref.input;

                    wire.setDestination(lastComponent, input);
                }
                // Save in map for testing of "testable" circuits
                if (item.name != undefined)
                {
                    this.wireMap.set(this.FormFullName(item.name, prefix), { wire:wire, components: components});
                }
            }
        }

        // For "testable" circuits, set notifyChange handler on Switch and Relay
        if (circuit.testable != undefined && circuit.testable)
        {
            for (let [name, component] of this.compMap)
            {
                let compType = component.constructor.name;

                if (compType == "Switch" || compType == "Relay")
                {
                    component.notifyChange(this.CircuitChange.bind(this));
                }
            }

            this.CircuitChange("");
        }

        // This is used in the second kitten selector in Chapter 8 just to make the color switches consistent
        else if (circuit.consistency != undefined && circuit.consistency)
        {
            for (let [name, component] of this.compMap)
            {
                let compType = component.constructor.name;

                if (compType == "Switch")
                {
                    component.notifyChange(this.CircuitConsistency.bind(this));
                }
            }

            this.CircuitConsistency("");
        }
    }

    CircuitConsistency(name)
    {
        if (this.dependencies != undefined)
        {
            for (let i = 0; i < this.dependencies.length; i++)
            {
                let dependency = this.dependencies[i];

                if (dependency.name == name)
                {
                    // Assume it's a Switch
                    let value = this.compMap.get(name).closed;

                    if (dependency.value != undefined && dependency.value != value)
                    {
                        continue; 
                    }
            
                    if (dependency.accordance != undefined)
                    {
                        for (let j = 0; j < dependency.accordance.length; j++)
                        {
                            let comp = this.compMap.get(dependency.accordance[j].name);
                            comp.closed = value;
                            comp.setOutput();
                        }
                    }
                    if (dependency.contrary != undefined)
                    {
                        for (let j = 0; j < dependency.contrary.length; j++)
                        {
                           let comp = this.compMap.get(dependency.contrary[j].name);
                           comp.closed = !value; 
                           comp.setOutput(); 
                        }
                    }
                }
            }
        }
    }

    // Called when a Switch or Relay changes state
    CircuitChange(name)
    {
        // First check dependencies (only used in the kitten selector)
        this.CircuitConsistency(name);

        // initialize closedCircles to empty array
        this.closedCircles = [];
        
        for (let [name, component] of this.compMap)
        {
            let compType = component.constructor.name;

            // Starting point of circuit
            if (compType == "V" || compType == "Battery")
            {
                this.TestCompleteCircuit(name, "", []);
            }
        }

        this.ColorCircuit(this.closedCircles);
    }

    // First call is V or Battery; subsequent calls are endpoints of wires
    TestCompleteCircuit(name, io, circle)
    {
        let component = this.compMap.get(name);
        let compType = component.constructor.name;

        // An open switch --> stop the search
        if (compType == "Switch" && !component.closed)
        {
            return;
        }
        // End point of circuit --> save the component and the circle and stop the search
        else if ((compType == "Battery" && circle.length != 0) || compType == "Ground")
        {
            circle.push({ name:name, io: ""});
            this.closedCircles.push(circle);
            return;
        }

        if (compType == "Relay")
        {
            // io values here are coilIn and pivot
            circle.push({ name:name, io: io});
        }
        else
        {
            circle.push({ name:name, io: ""});
        }

        for (let [wireName, value] of this.wireMap)
        {
            let first = value.components[0];
            let last = value.components[value.components.length - 1];

            if (first.name == name)
            {   
                let component = this.compMap.get(first.name);

                if (component.constructor.name == "Relay")
                {
                    // Check the io port for completion
                    if (((io == "pivot" || io == "pivotSide") && first.io == "out0" && !component.isTriggered) ||
                        ((io == "pivot" || io == "pivotSide") && first.io == "out1" && component.isTriggered) ||
                        (io == "coilIn" && first.io == "coilOut") ||
                        
                        (io == "out0" && (first.io == "pivot" || first.io == "pivotSide") && !component.isTriggered) ||
                        (io == "out1" && (first.io == "pivot" || first.io == "pivotSide") && component.isTriggered) || 
                        (io == "coilOut" && first.io == "coilIn"))
                    {
                        circle.push({ name:first.name, io:first.io});

                        let clone = [].concat(circle);
                        clone.push({ name:wireName, io: ""});
                        this.TestCompleteCircuit(last.name, last.io, clone);
                    }
                }
                else
                {

                    let clone = [].concat(circle);
                    clone.push({ name:wireName, io: ""});
                    this.TestCompleteCircuit(last.name, last.io, clone);
                }
            }
        }
    }

    ColorCircuit(closedCircles)
    {
        for (let [wireName, value] of this.wireMap)
        {
            let wire = value.wire;
            wire.output = this.IsNameInClosedCollections(wireName, "", closedCircles);
            wire.render();
        }

        for (let[name, component] of this.compMap)
        {
            if (component.constructor.name == "Relay")
            {
                component.setConducting(0, this.IsNameInClosedCollections(name, "coilOut", closedCircles));
                component.setConducting(1, this.IsNameInClosedCollections(name, "out0", closedCircles));
                component.setConducting(2, this.IsNameInClosedCollections(name, "out1", closedCircles));
            }
            else
            {
                component.output = this.IsNameInClosedCollections(name, "", closedCircles);
            }
            component.render();
        }
    }

    CircleArrayIncludesNameAndIo(circle, name, io)
    {
        for (let i = 0; i < circle.length; i++)
        {
            if (name == circle[i].name && io == circle[i].io)
                return true;
        }
        return false;
    }

    IsNameInClosedCollections(name, io, closedCircles)
    {
        let isInArray = false;

        for (let i = 0; i < closedCircles.length; i++)
        {
            let circle = closedCircles[i];

            isInArray |= this.CircleArrayIncludesNameAndIo(circle, name, io);
        }

        return isInArray;
    }

    ConstructMatrix(scale, rotate, x, y)
    {
        x = (x == undefined) ? 0 : x;
        y = (y == undefined) ? 0 : y;
        scale = (scale == undefined) ? 1 : scale;
        rotate = (rotate == undefined) ? 0 : rotate;

        rotate = Math.PI * rotate / 180;        

        // Identity transform        
        let m = new DOMMatrix();

        // Set cells
        m.a = scale * Math.cos(rotate);
        m.b = scale * Math.sin(rotate);
        m.c = scale * -Math.sin(rotate);
        m.d = scale * Math.cos(rotate);
        m.e = x;
        m.f = y;

        return m;
    }

    FormFullName(name, prefix)
    {
        if (prefix != null)
        {
            name = prefix + "." + name;
        }

        return name;
    }

    // Method only called from one place for relative coordinates
    GetCoordinates(item, prefix, map)
    {
        // Reminder: Don't apply these until after all the transforms
        let xItem = item.x == undefined ? 0 : item.x;
        let yItem = item.y == undefined ? 0 : item.y;

        // Find position governed by relative settings
        let pos = { x: 0, y: 0 };

        if (item.relative != undefined)
        {
        let relative = item.relative;

            // Relative coordinates for both x and y
            if (relative.xy != undefined)
            {
                let port = relative.xy;
                let name = this.FormFullName(port.name, prefix);
                let gate = map.get(name);
                let pt = gate.getCoordinates(port.io);
                pos = this.ApplyIntermediateTransform(port.name, prefix, pt);
            }
            else
            {
                // Relative x coordinate
                if (relative.x != undefined)
                {
                    let xport = relative.x;
                    let name = this.FormFullName(xport.name, prefix);
                    let gate = map.get(name);
                    let pt = gate.getCoordinates(xport.io);

                    // Only set pos.x from the transformed x coordinate
                    pos.x = this.ApplyIntermediateTransform(xport.name, prefix, pt).x;
                }

                // Relative y coordinate
                if (relative.y != undefined)
                {
                    let yport = relative.y;
                    let name = this.FormFullName(yport.name, prefix);
                    let gate = map.get(name);
                    let pt = gate.getCoordinates(yport.io);

                    // Only set pos.y from the transformed y coordinate
                    pos.y = this.ApplyIntermediateTransform(yport.name, prefix, pt).y;
                }
            }
        }

        // Add the item coordinates to the relative coordinates
        return {x: pos.x + xItem, y: pos.y + yItem};
    }

    ApplyIntermediateTransform(name, prefix, pt)
    {
        let matx = new DOMMatrix();

        // Accumulate transforms on externals, if any
        let index = name.indexOf(".", 0);

        while (index != -1)
        {
            let externalName = this.FormFullName(name.substr(0, index), prefix);
            let matxExternal = this.externalMatrices.get(externalName);
            matx.multiplySelf(matxExternal);
            index = name.indexOf(".", ++index);
        }

        // Apply the matrix
        let xp = matx.a * pt.x + matx.c * pt.y + matx.e;
        let yp = matx.b * pt.x + matx.d * pt.y + matx.f;

        pt.x = xp;
        pt.y = yp;

        return pt;
    }
}
