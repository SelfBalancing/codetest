// Chapter06SwitchesInParallel.json.js (c) Charles Petzold, 2024

let Chapter06SwitchesInParallel = 
{
    name: "Chapter06SwitchesInParallel",
    transform: {x: 0, y: 0, scale: 1, rotate: 0},
    testable: true,
    components:
    [
        { name: "switch1", type: "Switch", x: 225, y: 175 },
        { name: "switch2", type: "Switch", x: 225, y: 275 },
        { name: "light", type: "Lightbulb", x: 535, y: 175 },
        { name: "battery", type: "Battery", x: 225, y: 350 },

        { name: "node1", type: "Node", x:150, y: 225},
        { name: "node2", type: "Node", x:350, y: 225},

        { name: "jointNodeUL", type:"Joint", relative: {x: { name:"node1"}, y: { name:"switch1"}}},
        { name: "jointNodeLL", type:"Joint", relative: {x: { name:"node1"}, y: { name:"switch2"}}},
        { name: "jointNodeUR", type:"Joint", relative: {x: { name:"node2"}, y: { name:"switch1"}}},
        { name: "jointNodeLR", type:"Joint", relative: {x: { name:"node2"}, y: { name:"switch2"}}},

        { name: "jointUL", type: "Joint", x: 25, relative: { y: { name:"node1"}}},
        { name: "jointLL", type: "Joint", x: 25, relative: { y: { name:"battery"}}},
        { name: "jointUR", type: "Joint", relative: { y: { name:"node2"}, x: { name:"light", io: "left" }}},
        { name: "jointLR", type: "Joint", relative: { y: { name:"battery"}, x: { name:"light", io: "right"}}}
    ],
    wires:
    [
        { name: "wireNegNode1", points: [{ name:"battery", io: "neg"}, { name:"jointLL"}, { name:"jointUL"}, { name: "node1"}]},
        { name: "wireNode1Sw1", points: [{ name:"node1"}, { name:"jointNodeUL"}, { name: "switch1"}]},
        { name: "wireNode1Sw2", points: [{ name:"node1"}, { name:"jointNodeLL"}, { name: "switch2"}]},
        { name: "wireSw1Node2", points: [{ name:"switch1", io: "out"}, { name:"jointNodeUR"}, { name:"node2"}]},
        { name: "wireSw2Node2", points: [{ name:"switch2", io: "out"}, { name:"jointNodeLR"}, { name:"node2"}]},
        { name: "wireNode2Light", points: [{ name:"node2"}, { name:"jointUR"}, { name:"light", io:"left"}]},
        { name: "wireLightPos", points: [{ name:"light", io: "right"}, { name:"jointLR"}, { name:"battery", io: "pos"}]}
    ]
}