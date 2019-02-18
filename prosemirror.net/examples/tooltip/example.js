(function (prosemirrorState,prosemirrorView,prosemirrorModel,prosemirrorSchemaBasic,prosemirrorExampleSetup) {
'use strict';

// plugin{
var selectionSizePlugin = new prosemirrorState.Plugin({
  view: function view(editorView) { return new SelectionSizeTooltip(editorView) }
});
// }

// tooltip{
var SelectionSizeTooltip = function SelectionSizeTooltip(view) {
  this.tooltip = document.createElement("div");
  this.tooltip.className = "tooltip";
  view.dom.parentNode.appendChild(this.tooltip);

  this.update(view, null);
};

SelectionSizeTooltip.prototype.update = function update (view, lastState) {
  var state = view.state;
  // Don't do anything if the document/selection didn't change
  if (lastState && lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)) { return }

  // Hide the tooltip if the selection is empty
  if (state.selection.empty) {
    this.tooltip.style.display = "none";
    return
  }

  // Otherwise, reposition it and update its content
  this.tooltip.style.display = "";
  var ref = state.selection;
    var from = ref.from;
    var to = ref.to;
  // These are in screen coordinates
  var start = view.coordsAtPos(from), end = view.coordsAtPos(to);
  // The box in which the tooltip is positioned, to use as base
  var box = this.tooltip.offsetParent.getBoundingClientRect();
  // Find a center-ish x position from the selection endpoints (when
  // crossing lines, end may be more to the left)
  var left = Math.max((start.left + end.left) / 2, start.left + 3);
  this.tooltip.style.left = (left - box.left) + "px";
  this.tooltip.style.bottom = (box.bottom - start.top) + "px";
  this.tooltip.textContent = to - from;
};

SelectionSizeTooltip.prototype.destroy = function destroy () { this.tooltip.remove(); };
// }

window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
  state: prosemirrorState.EditorState.create({
    doc: prosemirrorModel.DOMParser.fromSchema(prosemirrorSchemaBasic.schema).parse(document.querySelector("#content")),
    plugins: prosemirrorExampleSetup.exampleSetup({schema: prosemirrorSchemaBasic.schema}).concat(selectionSizePlugin)
  })
});

}(PM.state,PM.view,PM.model,PM.schema_basic,PM.example_setup));

