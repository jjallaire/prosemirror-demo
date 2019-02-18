(function (prosemirrorState,prosemirrorView,prosemirrorModel,prosemirrorSchemaBasic,prosemirrorExampleSetup) {
'use strict';

// placeholderPlugin{
var placeholderPlugin = new prosemirrorState.Plugin({
  state: {
    init: function init() { return prosemirrorView.DecorationSet.empty },
    apply: function apply(tr, set) {
      // Adjust decoration positions to changes made by the transaction
      set = set.map(tr.mapping, tr.doc);
      // See if the transaction adds or removes any placeholders
      var action = tr.getMeta(this);
      if (action && action.add) {
        var widget = document.createElement("placeholder");
        var deco = prosemirrorView.Decoration.widget(action.add.pos, widget, {id: action.add.id});
        set = set.add(tr.doc, [deco]);
      } else if (action && action.remove) {
        set = set.remove(set.find(null, null,
                                  function (spec) { return spec.id == action.remove.id; }));
      }
      return set
    }
  },
  props: {
    decorations: function decorations(state) { return this.getState(state) }
  }
});
// }

// findPlaceholder{
function findPlaceholder(state, id) {
  var decos = placeholderPlugin.getState(state);
  var found = decos.find(null, null, function (spec) { return spec.id == id; });
  return found.length ? found[0].from : null
}
// }


// event{
document.querySelector("#image-upload").addEventListener("change", function (e) {
  if (view.state.selection.$from.parent.inlineContent && e.target.files.length)
    { startImageUpload(view, e.target.files[0]); }
  view.focus();
});
// }

// startImageUpload{
function startImageUpload(view, file) {
  // A fresh object to act as the ID for this upload
  var id = {};

  // Replace the selection with a placeholder
  var tr = view.state.tr;
  if (!tr.selection.empty) { tr.deleteSelection(); }
  tr.setMeta(placeholderPlugin, {add: {id: id, pos: tr.selection.from}});
  view.dispatch(tr);

  uploadFile(file).then(function (url) {
    var pos = findPlaceholder(view.state, id);
    // If the content around the placeholder has been deleted, drop
    // the image
    if (pos == null) { return }
    // Otherwise, insert it at the placeholder's position, and remove
    // the placeholder
    view.dispatch(view.state.tr
                  .replaceWith(pos, pos, prosemirrorSchemaBasic.schema.nodes.image.create({src: url}))
                  .setMeta(placeholderPlugin, {remove: {id: id}}));
  }, function () {
    // On failure, just clean up the placeholder
    view.dispatch(tr.setMeta(placeholderPlugin, {remove: {id: id}}));
  });
}
// }

// This is just a dummy that loads the file and creates a data URL.
// You could swap it out with a function that does an actual upload
// and returns a regular URL for the uploaded file.
function uploadFile(file) {
  var reader = new FileReader;
  return new Promise(function (accept, fail) {
    reader.onload = function () { return accept(reader.result); };
    reader.onerror = function () { return fail(reader.error); };
    // Some extra delay to make the asynchronicity visible
    setTimeout(function () { return reader.readAsDataURL(file); }, 1500);
  })
}

var view = window.view = new prosemirrorView.EditorView(document.querySelector("#editor"), {
  state: prosemirrorState.EditorState.create({
    doc: prosemirrorModel.DOMParser.fromSchema(prosemirrorSchemaBasic.schema).parse(document.querySelector("#content")),
    plugins: prosemirrorExampleSetup.exampleSetup({schema: prosemirrorSchemaBasic.schema}).concat(placeholderPlugin)
  })
});

}(PM.state,PM.view,PM.model,PM.schema_basic,PM.example_setup));

