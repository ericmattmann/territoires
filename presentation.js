/* Presentation controls reuse the original Leaflet layers and geometry. */
'use strict';
const frame = document.getElementById('territory-map');
const selector = document.getElementById('agency');
const reset = document.getElementById('reset');
const status = document.getElementById('selection');
function connectMap() {
  const win = frame.contentWindow;
  if (!win.L) throw new Error('Le fond cartographique ne peut pas être chargé.');
  const values = Object.values(win);
  const map = values.find(value => value instanceof win.L.Map);
  const territories = values.find(value => value instanceof win.L.GeoJSON);
  if (!map || !territories) throw new Error('La carte ne peut pas être initialisée.');
  const layers = territories.getLayers();
  const overview = territories.getBounds();
  let selected = null;
  const style = {color:'#007e68',weight:1.2,fillColor:'#2a8a79',fillOpacity:0.17};
  territories.setStyle(style);
  const codes = [...new Set(layers.map(layer => String(layer.feature.properties.Agence)))].sort((a,b)=>a.localeCompare(b,'fr'));
  selector.replaceChildren(new Option('Toutes les agences', ''), ...codes.map(code => new Option('Agence '+code,code)));
  function choose(code, zoom) {
    selected = code || null;
    selector.value = code || '';
    layers.forEach(layer => {
      const active = String(layer.feature.properties.Agence) === selected;
      layer.setStyle(active ? {color:'#173044',weight:2.5,fillColor:'#007e68',fillOpacity:0.4} : style);
      if (active) layer.bringToFront();
    });
    const matches = layers.filter(layer => String(layer.feature.properties.Agence) === selected);
    if (zoom && matches.length) map.fitBounds(win.L.featureGroup(matches).getBounds(),{padding:[35,35],maxZoom:10,animate:false});
    status.textContent = selected ? 'Agence '+selected+' · territoire sélectionné sur la carte.' : 'Vous pouvez aussi cliquer directement sur un territoire.';
  }
  layers.forEach(layer => {
    const code = String(layer.feature.properties.Agence);
    layer.bindTooltip('Agence '+code,{sticky:true});
    layer.on('click',()=>choose(code,false));
    layer.on('mouseover',()=>{if(code!==selected)layer.setStyle({weight:2.2,fillOpacity:0.3});});
    layer.on('mouseout',()=>{if(code!==selected)layer.setStyle(style);});
  });
  selector.addEventListener('change',()=>{
    if(selector.value) choose(selector.value,true);
    else {choose('',false);map.closePopup();map.fitBounds(overview,{padding:[25,25],animate:false});}
  });
  reset.addEventListener('click',()=>{choose('',false);map.closePopup();map.fitBounds(overview,{padding:[25,25],animate:false});});
  const css=win.document.createElement('style');
  css.textContent='.leaflet-container{font-family:"Trebuchet MS",sans-serif;background:#e8eee9}.leaflet-tile-pane{filter:grayscale(.85);opacity:.7}.leaflet-bar{border:0!important;box-shadow:0 2px 12px #17304422!important}.leaflet-bar a{color:#173044!important}.leaflet-control-attribution{font-size:9px!important}.leaflet-popup-content{color:#173044;font-size:13px}.leaflet-tooltip{border:0;padding:8px 12px;border-radius:4px;color:#173044}.leaflet-control-layers{display:none}';
  win.document.head.appendChild(css);
  map.fitBounds(overview,{padding:[25,25],animate:false});
  new ResizeObserver(()=>{
    map.invalidateSize();
    if (!selected) map.fitBounds(overview,{padding:[25,25],animate:false});
  }).observe(frame);
  selector.disabled=false;reset.disabled=false;
}
frame.addEventListener('load',()=>{
  try {connectMap();} catch(error) {
    status.textContent=error.message+' Vous pouvez ouvrir la carte seule avec le lien ci-dessous.';
    document.getElementById('map-help').textContent='Chargement indisponible : utilisez le lien « Ouvrir la carte seule ».';
    console.error(error);
  }
});
