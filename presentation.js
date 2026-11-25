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
  const theme = getComputedStyle(document.documentElement);
  const blue = theme.getPropertyValue('--socotec-blue').trim();
  const darkBlue = theme.getPropertyValue('--socotec-dark-blue').trim();
  const style = { color: darkBlue, weight: 1.2, fillColor: blue, fillOpacity: 0.16 };
  const selectedStyle = { color: darkBlue, weight: 3, fillColor: blue, fillOpacity: 0.42 };
  territories.setStyle(style);
  const codes = [...new Set(layers.map(layer => String(layer.feature.properties.Agence)))].sort((a,b)=>a.localeCompare(b,'fr'));
  selector.replaceChildren(new Option('Toutes les agences', ''), ...codes.map(code => new Option('Agence '+code,code)));
  function choose(code, zoom) {
    selected = code || null;
    selector.value = code || '';
    layers.forEach(layer => {
      const active = String(layer.feature.properties.Agence) === selected;
      layer.setStyle(active ? selectedStyle : style);
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
  css.textContent = `
    .leaflet-container {
      font-family: Arial, Avenir, Helvetica, sans-serif;
      background: #e5edf4;
    }
    .leaflet-tile-pane { filter: grayscale(.85); opacity: .7; }
    .leaflet-bar { border: 0 !important; box-shadow: 0 2px 12px #22304e22 !important; }
    .leaflet-bar a { color: ${darkBlue} !important; }
    .leaflet-control-attribution { font-size: 9px !important; }
    .leaflet-popup-content, .leaflet-tooltip { color: #22304e; font-size: 13px; }
    .leaflet-tooltip { border: 1px solid #d7e6f0; padding: 8px 12px; border-radius: 4px; }
    .leaflet-control-layers { display: none; }
  `;
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
