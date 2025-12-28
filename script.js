// Simple static shop script (localStorage cart)
const PRODUCTS_URL = 'products.json';
const CART_KEY = 'sw_cart';

let products = [];
let cart = {};

const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

async function init(){
  await loadProducts();
  loadCart();
  renderProducts(products);
  renderCart();
  setupListeners();
}

async function loadProducts(){
  try{
    const res = await fetch(PRODUCTS_URL);
    products = await res.json();
  }catch(e){
    console.error('Failed to load products.json', e);
    products = [];
  }
}

function setupListeners(){
  qs('#cart-toggle').addEventListener('click', toggleCart);
  qs('#close-cart').addEventListener('click', toggleCart);
  qs('#clear-cart').addEventListener('click', () => { cart = {}; saveCart(); renderCart(); });
  qs('#checkout-btn').addEventListener('click', checkoutDemo);
  qs('#search').addEventListener('input', (e)=> {
    const q = e.target.value.trim().toLowerCase();
    const filtered = products.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    renderProducts(filtered);
  });
  qs('#modal-close').addEventListener('click', closeModal);
  document.addEventListener('click', (e) => {
    if (e.target.matches('.add-to-cart')) {
      const id = e.target.dataset.id;
      addToCart(Number(id));
    } else if (e.target.matches('.product-card') || e.target.closest('.product-card')) {
      // open details only when clicking card (but not the button)
      const card = e.target.closest('.product-card');
      if (card && !e.target.classList.contains('add-to-cart')) {
        showProductDetail(Number(card.dataset.id));
      }
    } else if (e.target.matches('.qty-plus') || e.target.matches('.qty-minus') || e.target.matches('.remove-item')) {
      const id = Number(e.target.closest('.cart-item').dataset.id);
      if (e.target.matches('.qty-plus')) updateQty(id, 1);
      if (e.target.matches('.qty-minus')) updateQty(id, -1);
      if (e.target.matches('.remove-item')) { delete cart[id]; saveCart(); renderCart(); }
    }
  });
}

function renderProducts(list){
  const wrap = qs('#products');
  wrap.innerHTML = '';
  if (!list.length) {
    wrap.innerHTML = '<p>No products found.</p>';
    return;
  }
  list.forEach(p => {
    const el = document.createElement('article');
    el.className = 'card product-card';
    el.dataset.id = p.id;
    el.innerHTML = `
      <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
      <div class="card-body">
        <h3>${escapeHtml(p.title)}</h3>
        <p class="muted">${escapeHtml(p.desc)}</p>
        <div class="price">$${p.price.toFixed(2)}</div>
        <div class="card-actions">
          <button class="btn add-to-cart" data-id="${p.id}">Add to cart</button>
          <button class="btn" data-action="view">View</button>
        </div>
      </div>`;
    wrap.appendChild(el);
  });
}

function showProductDetail(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const modal = qs('#modal');
  qs('#modal-body').innerHTML = `
    <div style="display:flex;gap:1rem;flex-wrap:wrap">
      <img src="${p.image}" alt="${escapeHtml(p.title)}" style="max-width:320px;width:100%;border-radius:8px" />
      <div style="flex:1">
        <h2>${escapeHtml(p.title)}</h2>
        <p>${escapeHtml(p.desc)}</p>
        <p style="font-weight:700;margin-top:1rem">$${p.price.toFixed(2)}</p>
        <div style="margin-top:1rem">
          <button class="btn primary add-to-cart" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  const modal = qs('#modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

function toggleCart(){
  const panel = qs('#cart');
  const open = panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', String(!open));
}

function loadCart(){
  try{
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  }catch(e){ cart = {}; }
  updateCartCount();
}

function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount(){
  const count = Object.values(cart).reduce((s,item)=>s+item.qty,0);
  qs('#cart-count').textContent = count;
}

function addToCart(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  if(!cart[id]) cart[id] = {id:p.id,title:p.title,price:p.price,qty:0,image:p.image};
  cart[id].qty += 1;
  saveCart();
  renderCart();
  // small visual feedback
  qs('#cart-toggle').animate([{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:200});
}

function updateQty(id, delta){
  if(!cart[id]) return;
  cart[id].qty += delta;
  if(cart[id].qty <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function renderCart(){
  const wrap = qs('#cart-items');
  wrap.innerHTML = '';
  const items = Object.values(cart);
  if(!items.length){
    wrap.innerHTML = '<p>Your cart is empty.</p>';
    qs('#cart-total').textContent = '0.00';
    return;
  }
  let total = 0;
  items.forEach(it => {
    total += it.price * it.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.id = it.id;
    div.innerHTML = `
      <img src="₹{it.image}" alt="₹{escapeHtml(it.title)}" />
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>₹{escapeHtml(it.title)}</strong>
          <span>₹₹{(it.price * it.qty).toFixed(2)}</span>
        </div>
        <div style="margin-top:.4rem;display:flex;gap:.4rem;align-items:center">
          <button class="btn qty-minus">−</button>
          <span>${it.qty}</span>
          <button class="btn qty-plus">+</button>
          <button class="btn remove-item" style="margin-left:auto">Remove</button>
        </div>
      </div>
    `;
    wrap.appendChild(div);
  });
  qs('#cart-total').textContent = total.toFixed(2);
}

function checkoutDemo(){
  if (!Object.keys(cart).length) {
    alert('Your cart is empty.');
    return;
  }
  // Simple demo checkout — show form then thank you
  const ok = confirm('This is a demo checkout. Click OK to simulate a successful order.');
  if(ok){
    cart = {};
    saveCart();
    renderCart();
    toggleCart();
    alert('Thank you — your demo order has been placed!');
  }
}

function escapeHtml(text){
  return (''+text).replace(/[&<>\"'\/]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","/":"&#x2F;"})[s]);
}

init();
