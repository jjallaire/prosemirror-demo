(function (prosemirrorModel,prosemirrorTransform,prosemirrorCommands,prosemirrorKeymap,prosemirrorState,prosemirrorView,prosemirrorHistory) {
'use strict';

// textSchema{
var textSchema = new prosemirrorModel.Schema({
  nodes: {
    text: {},
    doc: {content: "text*"}
  }
});
// }

// noteSchema{
var noteSchema = new prosemirrorModel.Schema({
  nodes: {
    text: {},
    note: {
      content: "text*",
      toDOM: function toDOM() { return ["note", 0] },
      parseDOM: [{tag: "note"}]
    },
    notegroup: {
      content: "note+",
      toDOM: function toDOM() { return ["notegroup", 0] },
      parseDOM: [{tag: "notegroup"}]
    },
    doc: {
      content: "(note | notegroup)+"
    }
  }
});
// }

// makeNoteGroup{
function makeNoteGroup(state, dispatch) {
  // Get a range around the selected blocks
  var range = state.selection.$from.blockRange(state.selection.$to);
  // See if it is possible to wrap that range in a note group
  var wrapping = prosemirrorTransform.findWrapping(range, noteSchema.nodes.notegroup);
  // If not, the command doesn't apply
  if (!wrapping) { return false }
  // Otherwise, dispatch a transaction, using the `wrap` method to
  // create the step that does the actual wrapping.
  if (dispatch) { dispatch(state.tr.wrap(range, wrapping).scrollIntoView()); }
  return true
}
// }

// starSchema_1{
var starSchema = new prosemirrorModel.Schema({
  nodes: {
    text: {
      group: "inline",
    },
    star: {
      inline: true,
      group: "inline",
      toDOM: function toDOM() { return ["star", "🟊"] },
      parseDOM: [{tag: "star"}]
    },
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM: function toDOM() { return ["p", 0] },
      parseDOM: [{tag: "p"}]
    },
    boring_paragraph: {
      group: "block",
      content: "text*",
      marks: "",
      toDOM: function toDOM() { return ["p", {class: "boring"}, 0] },
      parseDOM: [{tag: "p.boring", priority: 60}]
    },
    doc: {
      content: "block+"
    }
  },
// }
// starSchema_2{
  marks: {
    shouting: {
      toDOM: function toDOM() { return ["shouting", 0] },
      parseDOM: [{tag: "shouting"}]
    },
    link: {
      attrs: {href: {}},
      toDOM: function toDOM(node) { return ["a", {href: node.attrs.href}, 0] },
      parseDOM: [{tag: "a", getAttrs: function getAttrs(dom) { return {href: dom.href} }}],
      inclusive: false
    }
  }
});
// }

// starKeymap{
var starKeymap = prosemirrorKeymap.keymap({
  "Ctrl-b": prosemirrorCommands.toggleMark(starSchema.marks.shouting),
  "Ctrl-q": toggleLink,
  "Ctrl-Space": insertStar
});
// }
// toggleLink{
function toggleLink(state, dispatch) {
  var doc = state.doc;
  var selection = state.selection;
  if (selection.empty) { return false }
  var attrs = null;
  if (!doc.rangeHasMark(selection.from, selection.to, starSchema.marks.link)) {
    attrs = {href: prompt("Link to where?", "")};
    if (!attrs.href) { return false }
  }
  return prosemirrorCommands.toggleMark(starSchema.marks.link, attrs)(state, dispatch)
}
// }
// insertStar{
function insertStar(state, dispatch) {
  var type = starSchema.nodes.star;
  var ref = state.selection;
  var $from = ref.$from;
  if (!$from.parent.canReplaceWith($from.index(), $from.index(), type))
    { return false }
  dispatch(state.tr.replaceSelectionWith(type.create()));
  return true
}
// }

var histKeymap = prosemirrorKeymap.keymap({"Mod-z": prosemirrorHistory.undo, "Mod-y": prosemirrorHistory.redo});

function start(place, content, schema, plugins) {
  if ( plugins === void 0 ) plugins = [];

  var doc = prosemirrorModel.DOMParser.fromSchema(schema).parse(content);
  return new prosemirrorView.EditorView(place, {
    state: prosemirrorState.EditorState.create({
      doc: doc,
      plugins: plugins.concat([histKeymap, prosemirrorKeymap.keymap(prosemirrorCommands.baseKeymap), prosemirrorHistory.history()])
    })
  })
}

function id(str) { return document.getElementById(str) }

start({mount: id("text-editor")}, id("text-content"), textSchema);
start(id("note-editor"), id("note-content"), noteSchema, [prosemirrorKeymap.keymap({"Ctrl-Space": makeNoteGroup})]);
start(id("star-editor"), id("star-content"), starSchema, [starKeymap]);

}(PM.model,PM.transform,PM.commands,PM.keymap,PM.state,PM.view,PM.history));

