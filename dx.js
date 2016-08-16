$('body').css({'overflow': 'hidden'})
$('*').css({'margin':0, 'padding':0, 'box-sizing':'border-box'})

function dx(){}
dx.App = function() {
  var app = this;
  var lsto = new ds.LocalStorage();
  app.screens = {};
  app.config = function(config){
    app.conf = config;
    return app;
  }
  app.screen = function(screenName, screenFn){
    var screen = new dx.Screen(screenName);
    app.screens[screenName] = screen;
    screenFn(screen);
    return app;
  }
  app.run = function() {
    app.refresh();
    $(window).resize(app.refresh);
  }
  app.refresh = function() {
    if (lsto.exist('curScreen')) {
      var curScreen = lsto.load('curScreen');
      var curOpt = lsto.load('curOpt');
      app.gotoScreen(curScreen, curOpt);
    } else {
      app.gotoHomeScreen();
    }
  }
  app.gotoScreen = function(screenName, opt) {
    lsto.save('curScreen', screenName);
    lsto.save('curOpt', opt || {});
    $('body').empty();
    app.screens[screenName].initialize(opt);
  }
  app.gotoHomeScreen = function() {
    app.gotoScreen(app.conf.homeScreen);
  }
}

dx.Screen = function(screenName) {
  var scr = this;
  scr.name = screenName;
  scr.rootFrame = {};

  scr.pack = function(rootFrame) { 
    scr.rootFrame = rootFrame;
    console.debug("Screen.pack|rootFrame:", rootFrame);
  }
  scr.initialize = function(opt) {
    console.debug("initialize|scr.name:", scr.name);
    renderFrame(scr.rootFrame, opt);
  }
  function renderFrame(frame, opt, viewport) {
    var viewport = viewport || getCurViewport();
    console.debug("desc|viewport:", viewport);
    for (var i = 0, l = frame.children.length; i < l; i++) {
      var child = frame.children[i];

      if (child.item.isFrame) {
        var new_viewport = calcItemViewport(child, viewport, frame);
        renderFrame(child.item, opt, new_viewport);
      }else if (child.item.isWidget) {
        var new_viewport = calcItemViewport(child, viewport, frame);
        child.item.x = new_viewport.x;
        child.item.y = new_viewport.y;
        child.item.initialize(opt);
      }
    }
  }
  function getCurViewport() {
    return {x: $(window).outerWidth(), y: $(window).outerHeight()};
  }
  function calcItemViewport(child, viewport, frame) {
    var x = viewport.x;
    var y = viewport.y;
    if (frame.isVert) {
      y = Math.round( y * child.ration / frame.totalRation);
    } else {
      x = Math.round( x * child.ration / frame.totalRation);
    }
    return {x, y}
  }
}

dx.Frame = function(parent, totalRation) {
  var frame = this;
  frame.parent = parent;
  frame.totalRation = totalRation;
  frame.curRation = 0;
  frame.isFrame = true;
  frame.children = [];

  frame.addBefore = function(item, ration) {
    if (isRationEnough(ration)){
      frame.children.unshift({item, ration});
      frame.curRation += ration;
    }
  }
  frame.addAfter = function(item, ration) {
    if (isRationEnough(ration)){
      frame.children.push({item, ration});
      frame.curRation += ration;
    }
  }
  function isRationEnough(ration) {
    if (frame.curRation + ration <= totalRation){
      return true;
    } else {
      console.debug("insufficient ration:");
      return false;
    }
  }

}

dx.VertFrame = function(parent, totalRation) {
  dx.Frame.apply(this, arguments);
  this.isVert = true;
  this.addAbove = function(item, ration) {
    this.addBefore(item, ration);
  }
  this.addBelow = function(item, ration) {
    this.addAfter(item, ration);
  }
}

dx.Widget = function(parent) {
  var wid = this;
  wid.parent = parent;
  wid.$wid = $('<div class="widget">');
  wid.isWidget = true;

  wid.initialize = function() {
    wid.superInitialize();
    wid.$wid.text('WIDGET: no initialize method defined.');
  }

  wid.superInitialize = function() {
    console.debug("dx.Widget|wid:", wid);
    wid.$wid.text('WIDGET');
    wid.$wid.css({'background': '#ddd', 'border': '1px solid gray', 'box-sizing': 'border-box'});
    wid.$wid.outerHeight(wid.y);
    $('body').append(wid.$wid);
  }
}

dx.Modal = function(parent) {
  var mod = this;
  mod.isModal = true;
  mod.pack = function(opts) {
    
  }
}

dx.AlertBox = function(parent) {
  var parent = parent;
  var alt = this;
  alt.isAlertBox = true;
  alt.pack = function(opts) {
    
  }
}

// jQuery EXTENSIONS
/////////////////////////////////////////////////////////

// $.allowScrolling: depends on iNoBounce.js
jQuery.fn.allowScrollingX = function() {
  var $el = this;
  $el.css({
    'overflow-x':'auto', 
    'overflow-y':'hidden', 
    '-webkit-overflow-scrolling':'touch'
  });
  return $el;
}
jQuery.fn.allowScrollingY = function() {
  var $el = this;
  $el.css({
    'overflow-x':'hidden', 
    'overflow-y':'auto', 
    '-webkit-overflow-scrolling':'touch'
  });
  return $el;
}
jQuery.fn.allowScrolling = function() {
  var $el = this;
  $el.css({
    'overflow':'auto', 
    '-webkit-overflow-scrolling':'touch'
  });
  return $el;
}
