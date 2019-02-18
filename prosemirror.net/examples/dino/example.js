(function (prosemirrorModel,prosemirrorSchemaBasic,prosemirrorMenu,prosemirrorExampleSetup,prosemirrorState,prosemirrorView) {
'use strict';

// nodespec{
// The supported types of dinosaurs.
var dinos = ["brontosaurus", "stegosaurus", "triceratops",
               "tyrannosaurus", "pterodactyl"];

var dinoNodeSpec = {
  // Dinosaurs have one attribute, their type, which must be one of
  // the types defined above.
  // Brontosaurs are still the default dino.
  attrs: {type: {default: "brontosaurus"}},
  inline: true,
  group: "inline",
  draggable: true,

  // These nodes are rendered as images with a `dino-type` attribute.
  // There are pictures for all dino types under /img/dino/.
  toDOM: function (node) { return ["img", {"dino-type": node.attrs.type,
                          src: "/img/dino/" + node.attrs.type + ".png",
                          title: node.attrs.type,
                          class: "dinosaur"}]; },
  // When parsing, such an image, if its type matches one of the known
  // types, is converted to a dino node.
  parseDOM: [{
    tag: "img[dino-type]",
    getAttrs: function (dom) {
      var type = dom.getAttribute("dino-type");
      return dinos.indexOf(type) > -1 ? {type: type} : false
    }
  }]
};
// }

// schema{
var dinoSchema = new prosemirrorModel.Schema({
  nodes: prosemirrorSchemaBasic.schema.spec.nodes.addBefore("image", "dino", dinoNodeSpec),
  marks: prosemirrorSchemaBasic.schema.spec.marks
});

var content = document.querySelector("#content");
var startDoc = prosemirrorModel.DOMParser.fromSchema(dinoSchema).parse(content);
// }

// command{
var dinoType = dinoSchema.nodes.dino;

function insertDino(type) {
  return function(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, dinoType))
      { return false }
    if (dispatch)
      { dispatch(state.tr.replaceSelectionWith(dinoType.create({type: type}))); }
    return true
  }
}
// }

// menu{
// Ask example-setup to build its basic menu
var menu = prosemirrorExampleSetup.buildMenuItems(dinoSchema);
// Add a dino-inserting item for each type of dino
dinos.forEach(function (name) { return menu.insertMenu.content.push(new prosemirrorMenu.MenuItem({
  title: "Insert " + name,
  label: name.charAt(0).toUpperCase() + name.slice(1),
  enable: function enable(state) { return insertDino(name)(state) },
  run: insertDino(name)
})); });
// }

// editor{
window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
  state: prosemirrorState.EditorState.create({
    doc: startDoc,
    // Pass exampleSetup our schema and the menu we created
    plugins: prosemirrorExampleSetup.exampleSetup({schema: dinoSchema, menuContent: menu.fullMenu})
  })
});
// }

}(PM.model,PM.schema_basic,PM.menu,PM.example_setup,PM.state,PM.view));

