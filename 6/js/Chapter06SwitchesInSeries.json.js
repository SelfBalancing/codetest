// Chapter06SwitchesInSeries.json.js (c) Charles Petzold, 2024

let Chapter06SwitchesInSeries = 
{
    name: "Chapter10SwitchesInSeries",
    transform: {x: 0, y: 0, scale: 1, rotate: 0},
    testable: true,
    components:
    [
        { name: "switch1", type: "Switch", x: 125, y: 250 },
        { name: "switch2", type: "Switch", x: 325, y: 250 },
        { name: "light", type: "Lightbulb", x: 535, y: 175 },
        { name: "battery", type: "Battery", x: 225, y: 350 },

        { name: "jointUL", type: "Joint", x: 25, relative: { y: { name:"switch1"}}},
        { name: "jointLL", type: "Joint", x: 25, relative: { y: { name:"battery"}}},
        { name: "jointUR", type: "Joint", relative: { y: { name:"switch1"}, x: { name:"light", io: "left" }}},
        { name: "jointLR", type: "Joint", relative: { y: { name:"battery"}, x: { name:"light", io: "right"}}}
    ],
    wires:
    [
        { name: "wireNegSw1", points: [{ name:"battery", io: "neg"}, { name:"jointLL"}, { name:"jointUL"}, { name: "switch1", io: "left"}]},
        { name: "wireSw1Sw2", points: [{ name: "switch1", io: "out"}, { name: "switch2"}]},
        { name: "wireSw2Light", points: [{ name:"switch2", io: "out"}, { name:"jointUR"}, { name:"light", io:"left"}]},
        { name: "wireLightPos", points: [{ name:"light", io: "right"}, { name:"jointLR"}, { name:"battery", io: "pos"}]}
    ]
}