
const ScrollMagic = require('scrollmagic');
require('../node_modules/scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators');

let controller = new ScrollMagic.Controller();


let scene = new ScrollMagic.Scene({
  triggerElement: '#trigger-1',
  triggerHook: 'onLeave',
  offset: 10
}).setClassToggle('#element-1','new-class')
.addIndicators()
.addTo(controller);



let durationScene = new ScrollMagic.Scene({
  triggerElement: '#trigger-2',
    triggerHook: 'onLeave',
  duration: 1000
}).on("enter", () => {
  console.log('Do Something on Enter');
  // Do something
}).on('leave', () => {
  // Do something
  console.log('Do Something on leave');
}).addIndicators()
.addTo(controller);