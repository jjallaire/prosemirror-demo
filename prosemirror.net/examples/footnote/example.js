(function (prosemirrorSchemaBasic,prosemirrorModel,prosemirrorTransform,prosemirrorMenu,prosemirrorExampleSetup,prosemirrorKeymap,prosemirrorHistory,prosemirrorState,prosemirrorView) {
'use strict';

// schema{
var footnoteSpec = {
  group: "inline",
  content: "inline*",
  inline: true,
  // This makes the view treat the node as a leaf, even though it
  // technically has content
  atom: true,
  toDOM: function () { return ["footnote", 0]; },
  parseDOM: [{tag: "footnote"}]
};

var footnoteSchema = new prosemirrorModel.Schema({
  nodes: prosemirrorSchemaBasic.schema.spec.nodes.addBefore("image", "footnote", footnoteSpec),
  marks: prosemirrorSchemaBasic.schema.spec.marks
});
// }

// menu{
var menu = prosemirrorExampleSetup.buildMenuItems(footnoteSchema);
menu.insertMenu.content.push(new prosemirrorMenu.MenuItem({
  title: "Insert footnote",
  label: "Footnote",
  select: function select(state) {
    return prosemirrorTransform.insertPoint(state.doc, state.selection.from, footnoteSchema.nodes.footnote) != null
  },
  run: function run(state, dispatch) {
    var ref = state.selection;
    var empty = ref.empty;
    var $from = ref.$from;
    var $to = ref.$to;
    var content = prosemirrorModel.Fragment.empty;
    if (!empty && $from.sameParent($to) && $from.parent.inlineContent)
      { content = $from.parent.content.cut($from.parentOffset, $to.parentOffset); }
    dispatch(state.tr.replaceSelectionWith(footnoteSchema.nodes.footnote.create(null, content)));
  }
}));
// }

// nodeview_start{
var FootnoteView = function FootnoteView(node, view, getPos) {
  // We'll need these later
  this.node = node;
  this.outerView = view;
  this.getPos = getPos;

  // The node's representation in the editor (empty, for now)
  this.dom = document.createElement("footnote");
  // These are used when the footnote is selected
  this.innerView = null;
};
// }
// nodeview_select{
FootnoteView.prototype.selectNode = function selectNode () {
  this.dom.classList.add("ProseMirror-selectednode");
  if (!this.innerView) { this.open(); }
};

FootnoteView.prototype.deselectNode = function deselectNode () {
  this.dom.classList.remove("ProseMirror-selectednode");
  if (this.innerView) { this.close(); }
};
// }
// nodeview_open{
FootnoteView.prototype.open = function open () {
    var this$1 = this;

  // Append a tooltip to the outer node
  var tooltip = this.dom.appendChild(document.createElement("div"));
  tooltip.className = "footnote-tooltip";
  // And put a sub-ProseMirror into that
  this.innerView = new prosemirrorView.EditorView(tooltip, {
    // You can use any node as an editor document
    state: prosemirrorState.EditorState.create({
      doc: this.node,
      plugins: [prosemirrorKeymap.keymap({
        "Mod-z": function () { return prosemirrorHistory.undo(this$1.outerView.state, this$1.outerView.dispatch); },
        "Mod-y": function () { return prosemirrorHistory.redo(this$1.outerView.state, this$1.outerView.dispatch); }
      })]
    }),
    // This is the magic part
    dispatchTransaction: this.dispatchInner.bind(this),
    handleDOMEvents: {
      mousedown: function () {
        // Kludge to prevent issues due to the fact that the whole
        // footnote is node-selected (and thus DOM-selected) when
        // the parent editor is focused.
        if (this$1.outerView.hasFocus()) { this$1.innerView.focus(); }
      }
    }
  });
};

FootnoteView.prototype.close = function close () {
  this.innerView.destroy();
  this.innerView = null;
  this.dom.textContent = "";
};
// }
// nodeview_dispatchInner{
FootnoteView.prototype.dispatchInner = function dispatchInner (tr) {
  var ref = this.innerView.state.applyTransaction(tr);
    var state = ref.state;
    var transactions = ref.transactions;
  this.innerView.updateState(state);

  if (!tr.getMeta("fromOutside")) {
    var outerTr = this.outerView.state.tr, offsetMap = prosemirrorTransform.StepMap.offset(this.getPos() + 1);
    for (var i = 0; i < transactions.length; i++) {
      var steps = transactions[i].steps;
      for (var j = 0; j < steps.length; j++)
        { outerTr.step(steps[j].map(offsetMap)); }
    }
    if (outerTr.docChanged) { this.outerView.dispatch(outerTr); }
  }
};
// }
// nodeview_update{
FootnoteView.prototype.update = function update (node) {
  if (!node.sameMarkup(this.node)) { return false }
  this.node = node;
  if (this.innerView) {
    var state = this.innerView.state;
    var start = node.content.findDiffStart(state.doc.content);
    if (start != null) {
      var ref = node.content.findDiffEnd(state.doc.content);
        var endA = ref.a;
        var endB = ref.b;
      var overlap = start - Math.min(endA, endB);
      if (overlap > 0) { endA += overlap; endB += overlap; }
      this.innerView.dispatch(
        state.tr
          .replace(start, endB, node.slice(start, endA))
          .setMeta("fromOutside", true));
    }
  }
  return true
};
// }
// nodeview_end{
FootnoteView.prototype.destroy = function destroy () {
  if (this.innerView) { this.close(); }
};

FootnoteView.prototype.stopEvent = function stopEvent (event) {
  return this.innerView && this.innerView.dom.contains(event.target)
};

FootnoteView.prototype.ignoreMutation = function ignoreMutation () { return true };
// }

// editor{
window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
  state: prosemirrorState.EditorState.create({
    doc: prosemirrorModel.DOMParser.fromSchema(footnoteSchema).parse(document.querySelector("#content")),
    plugins: prosemirrorExampleSetup.exampleSetup({schema: footnoteSchema, menuContent: menu.fullMenu})
  }),
  nodeViews: {
    footnote: function footnote(node, view, getPos) { return new FootnoteView(node, view, getPos) }
  }
});
// }

}(PM.schema_basic,PM.model,PM.transform,PM.menu,PM.example_setup,PM.keymap,PM.history,PM.state,PM.view));

