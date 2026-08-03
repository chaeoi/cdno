// ==UserScript==
// @author         Anonymous
// @name           IITC plugin: Zoom override
// @category       Tweaks
// @version        0.1.5
// @description    Override IITC portal and link loading behavior by zoom level.
// @id             zoomoverride
// @namespace      https://github.com/chaeoi/cdno
// @updateURL      https://cdno.canghai.org/js/zoomoverride.user.js
// @downloadURL    https://cdno.canghai.org/js/zoomoverride.user.js
// @match          https://intel.ingress.com/*
// @match          https://intel-x.ingress.com/*
// @icon           https://cdno.canghai.org/images/zoomoverride.svg
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'local';
plugin_info.dateTimeVersion = '20170312.40451';
plugin_info.pluginId = 'zoomoverride';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.forceZoomLevel = function() {};

window.plugin.forceZoomLevel.mode = 'Default';
window.plugin.forceZoomLevel.functionsOverwritten = false;
window.plugin.forceZoomLevel.zoomOptions = {
  'Default' : 'Default', 
  'AllLinks' : 'All Links', 
  'AllPortals' : 'All Portals'
};



window.plugin.forceZoomLevel.showDialog = function() {
  var div = document.createElement('div');
  
  div.appendChild(document.createTextNode('Select a forced zoom level: '));
  div.appendChild(document.createElement('br'));

  for(var option in window.plugin.forceZoomLevel.zoomOptions) {
    var label = div.appendChild(document.createElement('label'));
    var input = label.appendChild(document.createElement('input'));
    input.type = 'radio';
    input.name = 'plugin-zoomoverride';
    input.value = option;
    if(option === window.plugin.forceZoomLevel.mode) {
      input.checked = true;
    }

    input.addEventListener('click', function(opt) { return function() {
      window.plugin.forceZoomLevel.setMode(opt);
    } }(option), false);

    label.appendChild(document.createTextNode(' ' + window.plugin.forceZoomLevel.zoomOptions[option]));

    div.appendChild(document.createElement('br'));
  }

  dialog({
    id: 'plugin-zoomoverride',
    html: div,
    title: 'Force Zoom Level',
  });
};

window.plugin.forceZoomLevel.setMode = function (mode) {
  window.plugin.forceZoomLevel.mode = mode;
  localStorage['plugin-zoomoverride-mode'] = mode;
  switch(mode) {
    case 'Default':
      window.getDataZoomForMapZoom = window.getDataZoomForMapZoomDefault;
      break;
    case 'AllLinks':
      window.getDataZoomForMapZoom = window.getDataZoomForMapZoomAllLinks;
      break;
    case 'AllPortals':
      window.getDataZoomForMapZoom = window.getDataZoomForMapZoomAllPortals;
      break;
  }
  window.mapDataRequest.start();
}

window.plugin.forceZoomLevel.setup  = function() {
  $('#toolbox').append(' <a onclick="window.plugin.forceZoomLevel.showDialog()">Force Zoom Opt</a>');

  window.getDataZoomForMapZoomDefault = window.getDataZoomForMapZoom;
  window.getDataZoomForMapZoomAllLinks = function() { return 13; };
  window.getDataZoomForMapZoomAllPortals = function() { return 17 };
  
  try {
    var mode = localStorage['plugin-zoomoverride-mode'];
    if(typeof(mode) === 'undefined') {
      mode = 'Default';
    }
    window.plugin.forceZoomLevel.setMode(mode);
  } catch(e) {
    console.warn(e);
    window.plugin.forceZoomLevel.mode = 'Default';
  }
};

var setup =  window.plugin.forceZoomLevel.setup;

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
