// Chapter06KittenSelector.json.js (c) Charles Petzold, 2024

let Chapter06KittenSelector = 
{
    name: "Chapter06KittenSelector",
    transform: {x: 0, y: 0, scale: 1, rotate: 0},
    testable: true,
    components:
    [
        { name: "switchMale", type: "Switch", x: 125, y: 150 },
        { name: "switchNeut1", type: "Switch", x: 275, y: 150},
        { name: "switchWhite", type: "Switch", x:450, y: 100},
        { name: "switchTan", type: "Switch", x:450, y:200},
        { name: "switchFemale", type: "Switch", x: 125, y: 300, closed: true },
        { name: "switchNeut2", type: "Switch", x: 275, y: 300},
        { name: "switchNotWhite", type: "Switch", x: 425, y: 300, closed: true},
        { name: "switchBlack", type: "Switch", x: 325, y: 400},

        { name: "labelMale", type: "Label", text: "公🐱", y: 20, relative: {xy: { name:"switchMale", io: "center"}}},
        { name: "labelNeut1", type: "Label", text: "绝育的", y: 20, relative: {xy: { name:"switchNeut1", io: "center"}}},
        { name: "labelWhite", type: "Label", text: "白的", y: 20, relative: {xy: { name:"switchWhite", io: "center"}}},
        { name: "labelTan", type: "Label", text: "褐色的", y: 20, relative: {xy: { name:"switchTan", io: "center"}}},
        { name: "labelFemale", type: "Label", text: "母🐱", y: 20, relative: {xy: { name:"switchFemale", io: "center"}}},
        { name: "labelNeut2", type: "Label", text: "绝育的", y: 20, relative: {xy: { name:"switchNeut2", io: "center"}}},
        { name: "labelNotWhite", type: "Label", text: "不是白的", y: 20, relative: {xy: { name:"switchNotWhite", io: "center"}}},
        { name: "labelBlack", type: "Label", text: "黑的", y: 20, relative: {xy: { name:"switchBlack", io: "center"}}},

        { name: "light", type: "Lightbulb", x: 710, y: 175 },
        { name: "battery", type: "Battery", x: 350, y: 500 },

        { name: "node1", type: "Node", x:75, y: 300},
        { name: "node2", type: "Node", x:400, y: 150},
        { name: "node3", type: "Node", x:575, y: 150},
        { name: "node4", type: "Node", x:625, y: 300},

        { name: "jointAUL", type: "Joint", relative: {x: { name:"node2"}, y: { name:"switchWhite"}}},
        { name: "jointALL", type: "Joint", relative: {x: { name:"node2"}, y: { name:"switchTan"}}},
        { name: "jointAUR", type: "Joint", relative: {x: { name:"node3"}, y: { name:"switchWhite", io: "out"}}},
        { name: "jointALR", type: "Joint", relative: {x: { name:"node3"}, y: { name:"switchTan", io: "out"}}},

        { name: "jointBUL", type: "Joint", relative: {x: { name:"node1"}, y: { name:"switchMale"}}},
        { name: "jointBLL", type: "Joint", relative: {x: { name:"node1"}, y: { name:"switchBlack"}}},
        { name: "jointBUR", type: "Joint", relative: {x: { name:"node4"}, y: { name:"switchMale", io: "out"}}},
        { name: "jointBLR", type: "Joint", relative: {x: { name:"node4"}, y: { name:"switchBlack", io: "out"}}},

        { name: "jointCUL", type: "Joint", x: 25, relative: { y: { name:"node1"}}},
        { name: "jointCLL", type: "Joint", x: 25, relative: { y: { name:"battery"}}},
        { name: "jointCUR", type: "Joint", relative: { y: { name:"node4"}, x: { name:"light", io: "left" }}},
        { name: "jointCLR", type: "Joint", relative: { y: { name:"battery"}, x: { name:"light", io: "right"}}}
    ],
    wires:
    [
        { name: "wireRow1a", points: [{ name:"node1"}, { name:"jointBUL"}, { name:"switchMale"}]},
        { name: "wireRow1b", points: [{ name:"switchMale", io: "out"}, { name:"switchNeut1" }]},
        { name: "wireRow1c", points: [{ name:"switchNeut1", io: "out"}, { name: "node2"}]},
        { name: "wireRow1d", points: [{ name:"node2"}, { name:"jointAUL"}, { name:"switchWhite"}]},
        { name: "wireRow1e", points: [{ name:"node2"}, { name:"jointALL"}, { name: "switchTan"}]},
        { name: "wireRow1f", points: [{ name:"switchWhite", io: "out"}, { name:"jointAUR"}, { name: "node3"}]},
        { name: "wireRow1g", points: [{ name:"switchTan", io: "out"}, { name:"jointALR"}, { name: "node3"}]},
        { name: "wireRow1h", points: [{ name:"node3"}, { name:"jointBUR"}, { name:"node4"}]},

        { name: "wireRow2a", points: [{ name:"node1"}, { name:"switchFemale"}]},
        { name: "wireRow2b", points: [{ name:"switchFemale", io: "out"}, { name: "switchNeut2"}]},
        { name: "wireRow2c", points: [{ name:"switchNeut2", io: "out"}, { name:"switchNotWhite"}]},
        { name: "wireRow2d", points: [{ name:"switchNotWhite", io:"out"}, { name:"node4"}]},

        { name: "wireRow3a", points: [{ name:"node1"}, { name:"jointBLL"}, { name:"switchBlack"}]},
        { name: "wireRow3b", points: [{ name:"switchBlack", io: "out"}, { name:"jointBLR"}, { name:"node4"}]},

        { name: "wireNegNode1", points: [{ name:"battery", io: "neg"}, { name:"jointCLL"}, { name:"jointCUL"}, { name: "node1"}]},
        { name: "wireNode4Light", points: [{ name:"node4"}, { name:"jointCUR"}, { name:"light", io:"left"}]},
        { name: "wireLightPos", points: [{ name:"light", io: "right"}, { name:"jointCLR"}, { name:"battery", io: "pos"}]}
    ],
    dependencies:
    [
        { name: "switchNeut1", accordance: [{ name:"switchNeut2"}]},
        { name: "switchNeut2", accordance: [{ name:"switchNeut1"}]},

        { name: "switchMale", contrary: [ { name:"switchFemale" }]},
        { name: "switchFemale", contrary: [ { name:"switchMale" }]},

        { name: "switchWhite", contrary: [{ name:"switchNotWhite"}]},
        { name: "switchNotWhite", contrary: [{ name:"switchWhite"}]},

        { name: "switchWhite", value: true, contrary: [{ name:"switchTan"}, { name:"switchBlack"}, { name:"switchNotWhite"}]},
        { name: "switchNotWhite", value: false, accordance: [{ name:"switchTan"}, { name:"switchBlack"}]},
        { name: "switchTan", value: true, accordance: [{ name:"switchNotWhite"}], contrary: [{ name:"switchWhite"}, { name:"switchBlack"}]},
        { name: "switchBlack", value:true, accordance: [{ name:"switchNotWhite"}], contrary: [{ name:"switchWhite"}, { name:"switchTan"}]}
    ]
}