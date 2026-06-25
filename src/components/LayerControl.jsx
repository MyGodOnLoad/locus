function LayerControl(props) {
  var layers = props.layers || [];
  var onToggle = props.onToggle;

  return (
    <div className="layer-control">
      {layers.map(function (layer) {
        return (
          <label key={layer.id} className="layer-toggle">
            <input type="checkbox" checked={layer.visible} onChange={function () {
              if (onToggle) onToggle(layer.id, !layer.visible);
            }} />
            <span className="layer-toggle-label">{layer.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export default LayerControl;
