// Mobile nav toggle and basic accessibility handling
document.addEventListener('DOMContentLoaded', function(){
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');
  if(!toggle || !menu) return;

  toggle.addEventListener('click', function(){
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close when a menu link is clicked
  menu.addEventListener('click', function(e){
    if(e.target.tagName.toLowerCase() === 'a'){
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }
  });

  // Close on Escape
  document.addEventListener('keyup', function(e){
    if(e.key === 'Escape'){
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }
  });
});
