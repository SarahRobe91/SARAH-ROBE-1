/* ============================================================
   SARAH ROBE — Main JavaScript
   ============================================================ */

/* ---- Drawer System ---------------------------------------- */
const SRDrawers = (() => {
  const drawers = {
    cart:    { drawer: null, overlay: null },
    search:  { drawer: null, overlay: null },
    account: { drawer: null, overlay: null }
  };

  function open(name) {
    Object.keys(drawers).forEach(k => {
      if (k !== name) close(k);
    });
    const { drawer, overlay } = drawers[name];
    if (!drawer) return;
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (name === 'cart') refreshCartDrawer();
  }

  function close(name) {
    const { drawer, overlay } = drawers[name];
    if (!drawer) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function init() {
    ['cart', 'search', 'account'].forEach(name => {
      drawers[name].drawer  = document.getElementById(`sr-${name}-drawer`);
      drawers[name].overlay = document.getElementById(`sr-${name}-overlay`);
      const closeBtn = document.getElementById(`sr-${name}-close`);
      const overlay  = drawers[name].overlay;
      if (closeBtn) closeBtn.addEventListener('click', () => close(name));
      if (overlay)  overlay.addEventListener('click', () => close(name));
    });

    // Open triggers
    document.querySelectorAll('[data-sr-open="cart"]').forEach(el =>
      el.addEventListener('click', () => open('cart')));
    document.querySelectorAll('[data-sr-open="search"]').forEach(el =>
      el.addEventListener('click', () => open('search')));
    document.querySelectorAll('[data-sr-open="account"]').forEach(el =>
      el.addEventListener('click', () => open('account')));

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') Object.keys(drawers).forEach(k => close(k));
    });
  }

  return { init, open, close };
})();

/* ---- AJAX Cart -------------------------------------------- */
const SRCart = (() => {
  let cartData = null;

  async function fetchCart() {
    const res = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
    cartData = await res.json();
    return cartData;
  }

  async function addItem(variantId, quantity, properties) {
    const body = { id: variantId, quantity: quantity || 1 };
    if (properties) body.properties = properties;
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Erreur ajout panier');
    await fetchCart();
    updateCartCount();
    return cartData;
  }

  // Suppression / mise a jour par item.key via /cart/change.js
  // Plus fiable que l'index de ligne qui peut changer entre renders
  async function changeByKey(key, qty) {
    const el = document.querySelector(`[data-sr-item-key="${key}"]`);
    if (el) el.classList.add('sr-ditem--loading');
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: key, quantity: qty })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('Cart change error:', errData);
      }
      await fetchCart();
      updateCartCount();
      renderCartDrawer();
    } catch (err) {
      console.warn('Cart error:', err);
      if (el) el.classList.remove('sr-ditem--loading');
    }
  }

  // Compatibilite descendante - utilise changeByKey en interne
  async function removeItem(lineIndex) {
    if (!cartData || !cartData.items) return;
    const item = cartData.items[lineIndex - 1];
    if (item) await changeByKey(item.key, 0);
  }
  async function updateItem(lineIndex, qty) {
    if (!cartData || !cartData.items) return;
    const item = cartData.items[lineIndex - 1];
    if (item) await changeByKey(item.key, qty);
  }

  function formatMoney(cents) {
    return (cents / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
  }

  function updateCartCount() {
    if (!cartData) return;
    const count = cartData.item_count || 0;
    document.querySelectorAll('[data-sr-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
    const titleCount = document.getElementById('sr-cart-title-count');
    if (titleCount) titleCount.textContent = count > 0 ? `(${count})` : '';
  }

  function renderCartDrawer() {
    const body   = document.getElementById('sr-cart-body');
    const footer = document.getElementById('sr-cart-footer');
    const total  = document.getElementById('sr-cart-total-value');
    if (!body || !cartData) return;

    if (cartData.item_count === 0) {
      body.innerHTML = `
        <div class="sr-cart-empty-state">
          <div class="sr-cart-empty-state__icon">✦</div>
          <p class="sr-cart-empty-state__title">Votre panier est vide</p>
          <p class="sr-cart-empty-state__desc">Explorez nos collections et laissez-vous inspirer ✦</p>
          <a href="/collections" class="sr-btn sr-btn--primary sr-btn--small" style="margin-top:8px">
            Découvrir les collections
          </a>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = '';
    if (total)  total.textContent = formatMoney(cartData.total_price);

    body.innerHTML = cartData.items.map(item => {
      const hasVariant = item.variant_title && item.variant_title !== 'Default Title';
      // Normalise l'URL image Shopify et redimensionne a 200px
      let imgUrl = '';
      if (item.image) {
        imgUrl = item.image.startsWith('//') ? 'https:' + item.image : item.image;
        imgUrl = imgUrl.replace(/(\.[a-z]+)(\?|$)/i, '_200x$1$2');
      }
      const safeTitle = item.product_title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

      return `
        <div class="sr-ditem" data-sr-item-key="${item.key}">
          <a href="${item.url}" class="sr-ditem__img-link" tabindex="-1" aria-hidden="true">
            <div class="sr-ditem__img-wrap">
              ${imgUrl ? `<img src="${imgUrl}" alt="${safeTitle}" loading="lazy" width="90" height="112">` : ''}
            </div>
          </a>
          <div class="sr-ditem__body">
            <div class="sr-ditem__head">
              <div style="min-width:0;flex:1">
                <a href="${item.url}" class="sr-ditem__name">${safeTitle}</a>
                ${hasVariant ? `<p class="sr-ditem__variant">${item.variant_title}</p>` : ''}
              </div>
              <button class="sr-ditem__remove"
                      data-sr-remove="${item.key}"
                      aria-label="Retirer ${safeTitle} du panier"
                      type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="sr-ditem__foot">
              <div class="sr-ditem__qty" role="group" aria-label="Quantité de ${safeTitle}">
                <button class="sr-ditem__qty-btn"
                        data-sr-qty="${item.key}"
                        data-action="minus"
                        type="button"
                        aria-label="Diminuer la quantité">&#x2212;</button>
                <span class="sr-ditem__qty-val" aria-live="polite">${item.quantity}</span>
                <button class="sr-ditem__qty-btn"
                        data-sr-qty="${item.key}"
                        data-action="plus"
                        type="button"
                        aria-label="Augmenter la quantité">+</button>
              </div>
              <span class="sr-ditem__price">${formatMoney(item.line_price)}</span>
            </div>
          </div>
        </div>`;
    }).join('');

    // Boutons Retirer
    body.querySelectorAll('[data-sr-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        changeByKey(btn.dataset.srRemove, 0);
      });
    });

    // Boutons Quantite +/-
    body.querySelectorAll('[data-sr-qty]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key    = btn.dataset.srQty;
        const action = btn.dataset.action;
        const wrap   = btn.closest('.sr-ditem');
        const qtyEl  = wrap ? wrap.querySelector('.sr-ditem__qty-val') : null;
        let qty = parseInt(qtyEl ? qtyEl.textContent : '1', 10) || 1;
        qty = action === 'minus' ? Math.max(0, qty - 1) : qty + 1;
        changeByKey(key, qty);
      });
    });
  }

  async function refresh() {
    await fetchCart();
    updateCartCount();
  }

  return { addItem, removeItem, updateItem, changeByKey, fetchCart, refresh, renderCartDrawer, updateCartCount, formatMoney };
})();

async function refreshCartDrawer() {
  await SRCart.fetchCart();
  SRCart.updateCartCount();
  SRCart.renderCartDrawer();
}

/* ---- Add to Cart buttons (collection / homepage) ----------- */
function initATCButtons() {
  document.querySelectorAll('[data-sr-atc]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const variantId = btn.dataset.srAtc;
      if (!variantId) return;
      btn.disabled = true;
      btn.textContent = 'Ajout…';
      try {
        await SRCart.addItem(variantId, 1);
        SRDrawers.open('cart');
        btn.textContent = 'Ajouté ✓';
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = btn.dataset.srAtcLabel || 'Ajouter au panier';
        }, 2000);
      } catch(err) {
        btn.disabled = false;
        btn.textContent = btn.dataset.srAtcLabel || 'Ajouter au panier';
      }
    });
  });
}

/* ---- Product Page ----------------------------------------- */
function initProductPage() {
  const form = document.getElementById('sr-product-form');
  if (!form) return;

  const variantInput = document.getElementById('sr-variant-id');
  const priceDisplay = document.getElementById('sr-product-price');
  const variantsData = JSON.parse(document.getElementById('sr-variants-json')?.textContent || '[]');

  // Gallery thumbnails
  document.querySelectorAll('.sr-product-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.sr-product-gallery__thumb').forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      const mainImg = document.getElementById('sr-gallery-main-img');
      const src = thumb.dataset.full || thumb.querySelector('img')?.src;
      if (mainImg && src) mainImg.src = src;
    });
  });

  // Size buttons
  document.querySelectorAll('.sr-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sr-size-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      updateVariant();
    });
  });

  // Color swatches
  document.querySelectorAll('.sr-color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.sr-color-swatch').forEach(s => s.classList.remove('is-selected'));
      sw.classList.add('is-selected');
      const colorLabel = document.getElementById('sr-color-label');
      if (colorLabel) colorLabel.textContent = sw.dataset.colorName || '';
      updateVariant();
    });
  });

  function updateVariant() {
    if (!variantsData.length) return;
    const selectedSize  = document.querySelector('.sr-size-btn.is-selected')?.dataset.size;
    const selectedColor = document.querySelector('.sr-color-swatch.is-selected')?.dataset.colorValue;

    let matched = variantsData.find(v => {
      const opts = [v.option1, v.option2, v.option3].filter(Boolean);
      if (selectedSize  && !opts.includes(selectedSize))  return false;
      if (selectedColor && !opts.includes(selectedColor)) return false;
      return true;
    }) || variantsData[0];

    if (variantInput) variantInput.value = matched.id;
    if (priceDisplay && matched.price) {
      priceDisplay.textContent = (matched.price / 100).toFixed(0) + ' €';
    }
  }

  // Quantity
  const qtyVal   = document.getElementById('sr-qty-val');
  const qtyInput = document.getElementById('sr-qty-input');
  document.getElementById('sr-qty-dec')?.addEventListener('click', () => {
    const cur  = parseInt(qtyVal?.textContent || 1);
    const next = Math.max(1, cur - 1);
    if (qtyVal)   qtyVal.textContent = next;
    if (qtyInput) qtyInput.value = next;
  });
  document.getElementById('sr-qty-inc')?.addEventListener('click', () => {
    const cur  = parseInt(qtyVal?.textContent || 1);
    const next = cur + 1;
    if (qtyVal)   qtyVal.textContent = next;
    if (qtyInput) qtyInput.value = next;
  });

  // Add to cart (AJAX)
  const atcBtn = document.getElementById('sr-atc-btn');
  if (atcBtn) {
    atcBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id  = parseInt(variantInput?.value);
      const qty = parseInt(qtyInput?.value || 1);
      if (!id) return;
      atcBtn.disabled = true;
      atcBtn.textContent = 'Ajout en cours…';
      try {
        await SRCart.addItem(id, qty);
        SRDrawers.open('cart');
        atcBtn.textContent = 'Ajouté au panier ✓';
        setTimeout(() => {
          atcBtn.disabled = false;
          atcBtn.textContent = 'Ajouter au panier';
        }, 2500);
      } catch {
        atcBtn.disabled = false;
        atcBtn.textContent = 'Ajouter au panier';
      }
    });
  }

  // Buy now
  document.getElementById('sr-buy-now-btn')?.addEventListener('click', async () => {
    const id  = parseInt(variantInput?.value);
    const qty = parseInt(qtyInput?.value || 1);
    if (!id) return;
    await SRCart.addItem(id, qty);
    window.location.href = '/checkout';
  });

  // Accordion
  document.querySelectorAll('.sr-accordion__trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item   = trigger.closest('.sr-accordion__item');
      const body   = item.querySelector('.sr-accordion__body');
      const icon   = item.querySelector('.sr-accordion__icon');
      const isOpen = body.classList.contains('is-open');
      document.querySelectorAll('.sr-accordion__body').forEach(b => b.classList.remove('is-open'));
      document.querySelectorAll('.sr-accordion__icon').forEach(ic => ic.textContent = '+');
      if (!isOpen) {
        body.classList.add('is-open');
        icon.textContent = '−';
      }
    });
  });

  updateVariant();
}

/* ---- Collection Filters ----------------------------------- */
function initCollectionFilters() {
  const filterBar = document.getElementById('sr-filter-bar');
  if (!filterBar) return;

  // Toggle dropdown
  filterBar.querySelectorAll('[data-sr-filter-toggle]').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const target   = pill.dataset.srFilterToggle;
      const dropdown = document.getElementById(target);
      if (!dropdown) return;
      const isOpen = dropdown.classList.contains('is-open');
      filterBar.querySelectorAll('.sr-filter-dropdown').forEach(d => d.classList.remove('is-open'));
      filterBar.querySelectorAll('.sr-filter-pill').forEach(p => p.classList.remove('is-active'));
      if (!isOpen) {
        dropdown.classList.add('is-open');
        pill.classList.add('is-active');
      }
    });
  });

  document.addEventListener('click', () => {
    filterBar.querySelectorAll('.sr-filter-dropdown').forEach(d => d.classList.remove('is-open'));
    filterBar.querySelectorAll('.sr-filter-pill').forEach(p => p.classList.remove('is-active'));
  });

  // Sort change
  filterBar.querySelectorAll('[data-sr-sort]').forEach(opt => {
    opt.addEventListener('click', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', opt.dataset.srSort);
      window.location.href = url.toString();
    });
  });

  // Availability toggle
  const availBtn = document.getElementById('sr-filter-avail');
  if (availBtn) {
    availBtn.addEventListener('click', () => {
      const url = new URL(window.location.href);
      if (url.searchParams.get('filter.v.availability') === '1') {
        url.searchParams.delete('filter.v.availability');
      } else {
        url.searchParams.set('filter.v.availability', '1');
      }
      window.location.href = url.toString();
    });
  }

  // Size filter
  filterBar.querySelectorAll('[data-sr-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url  = new URL(window.location.href);
      const size = btn.dataset.srSize;
      const current = url.searchParams.getAll('filter.p.m.custom.taille');
      if (current.includes(size)) {
        url.searchParams.delete('filter.p.m.custom.taille');
        current.filter(s => s !== size).forEach(s =>
          url.searchParams.append('filter.p.m.custom.taille', s));
      } else {
        url.searchParams.append('filter.p.m.custom.taille', size);
      }
      window.location.href = url.toString();
    });
  });
}

/* ---- Mobile nav ------------------------------------------- */
function initMobileNav() {
  const openBtn  = document.getElementById('sr-mobile-nav-open');
  const closeBtn = document.getElementById('sr-mobile-nav-close');
  const nav      = document.getElementById('sr-mobile-nav');
  const overlay  = document.getElementById('sr-mobile-nav-overlay');
  if (!nav) return;
  const open  = () => { nav.classList.add('is-open');    document.body.style.overflow = 'hidden'; };
  const close = () => { nav.classList.remove('is-open'); document.body.style.overflow = '';       };
  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
}

/* ---- Init -------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  SRDrawers.init();
  SRCart.refresh();
  initATCButtons();
  initProductPage();
  initCollectionFilters();
  initMobileNav();
});

/* ============================================================
   SR ANIMATIONS ENGINE
   ============================================================ */
const SRAnimations = (() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.07 });

  function watch(el) {
    if (!el || el.dataset.srW) return;
    el.dataset.srW = '1';
    io.observe(el);
  }

  function reveal(el, cls) {
    if (!el || el.dataset.srW) return;
    el.classList.add(cls);
    watch(el);
  }

  function stagger(container) {
    if (!container || container.dataset.srW) return;
    container.classList.add('sr-stagger');
    [...container.children].forEach((child, i) => {
      child.style.setProperty('--sr-i', i);
      child.addEventListener('transitionend', e => {
        if (e.propertyName === 'opacity') child.style.transitionDelay = '0s';
      }, { once: true });
    });
    watch(container);
  }

  function initHeaders() {
    const sel = [
      '.sr-section-script', '.sr-section-h2', '.sr-section-desc',
      '.sr-summer-mood__script', '.sr-summer-mood__h2', '.sr-summer-mood__desc',
      '.sr-promo__script', '.sr-promo__h2',
      '.sr-contact__script', '.sr-contact__h2', '.sr-contact__intro',
      '.sr-newsletter__script', '.sr-newsletter__h2', '.sr-newsletter__desc',
      '.sr-collection-hero__desc', '.sr-collection-hero__rating',
      '.sr-editorial__script', '.sr-editorial__h2', '.sr-editorial__desc',
      '.sr-why-love h2', '.sr-product-reviews h2',
    ].join(',');
    document.querySelectorAll(sel).forEach(el => reveal(el, 'sr-reveal-up'));
  }

  function initGrids() {
    document.querySelectorAll('.sr-products-grid').forEach(g => stagger(g));
    stagger(document.querySelector('.sr-categories__grid'));
    stagger(document.querySelector('.sr-reviews .sr-reviews__grid'));
    stagger(document.querySelector('.sr-collection-grid'));
    document.querySelectorAll('.sr-product-reviews .sr-reviews__grid').forEach(g => stagger(g));
    document.querySelectorAll('.sr-recommended .sr-products-grid, .sr-related .sr-products-grid').forEach(g => stagger(g));
  }

  function initSummerMood() {
    reveal(document.querySelector('.sr-summer-mood__text'),   'sr-reveal-left');
    reveal(document.querySelector('.sr-summer-mood__visual'), 'sr-reveal-right');
  }

  function initPromo() {
    reveal(document.querySelector('.sr-promo__text'),   'sr-reveal-left');
    reveal(document.querySelector('.sr-promo__visual'), 'sr-reveal-right');
  }

  function initContact() {
    reveal(document.querySelector('.sr-contact__info'),      'sr-reveal-left');
    reveal(document.querySelector('.sr-contact__form-wrap'), 'sr-reveal-right');
    stagger(document.querySelector('.sr-contact__socials-grid'));
    stagger(document.querySelector('.sr-contact__checks'));
  }

  function initNewsletter() {
    reveal(document.querySelector('.sr-newsletter__inner'), 'sr-reveal-scale');
  }

  function initCollection() {
    reveal(document.querySelector('.sr-filter-bar'),        'sr-reveal-up');
    reveal(document.querySelector('.sr-editorial__visual'), 'sr-reveal-left');
    reveal(document.querySelector('.sr-editorial__text'),   'sr-reveal-right');
  }

  function initProduct() {
    stagger(document.querySelector('.sr-why-love__grid'));
    stagger(document.querySelector('.sr-reassurance'));
  }

  let pEls = [];

  function initParallax() {
    const blob = document.querySelector('.sr-summer-mood__blob');
    if (blob) { blob.classList.add('sr-parallax'); blob.dataset.srSpeed = '0.11'; pEls.push(blob); }
    const editBlob = document.querySelector('.sr-editorial__blob');
    if (editBlob) { editBlob.classList.add('sr-parallax'); editBlob.dataset.srSpeed = '0.09'; pEls.push(editBlob); }
    document.querySelectorAll('[data-sr-parallax]').forEach(el => { if (!pEls.includes(el)) pEls.push(el); });
  }

  let rafId = false;
  function updateParallax() {
    if (window.innerWidth <= 768 || reduced || rafId) return;
    rafId = true;
    requestAnimationFrame(() => {
      rafId = false;
      pEls.forEach(el => {
        const r = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.srSpeed || el.dataset.srParallax || 0.11);
        el.style.transform = `translateY(${(r.top + r.height / 2 - window.innerHeight / 2) * speed}px)`;
      });
    });
  }

  function init() {
    if (reduced) return;
    initHeaders();
    initGrids();
    initSummerMood();
    initPromo();
    initContact();
    initNewsletter();
    initCollection();
    initProduct();
    initParallax();
  }

  return { init, updateParallax };
})();

document.addEventListener('DOMContentLoaded', () => SRAnimations.init());
window.addEventListener('scroll', () => SRAnimations.updateParallax(), { passive: true });
document.addEventListener('shopify:section:load', () => setTimeout(() => SRAnimations.init(), 100));

/* ============================================================
   SR HEADER BEHAVIOR
   ============================================================ */
const SRHeaderBehavior = (() => {
  'use strict';

  const headers  = document.querySelectorAll('.sr-header');
  const isIndex  = document.body.dataset.template === 'index';
  const HIDE_AFTER = 80;
  let lastY    = 0;
  let ticking  = false;

  function isMobileNavOpen() {
    return document.querySelector('.sr-mobile-nav.is-open') !== null;
  }
  function isDrawerOpen() {
    return document.body.style.overflow === 'hidden';
  }

  function setHeaderH() {
    const h = (window.innerWidth > 768
      ? document.querySelector('.sr-header--desktop')
      : document.querySelector('.sr-header--mobile')
    )?.getBoundingClientRect().height || 0;
    if (h) document.documentElement.style.setProperty('--sr-header-h', h + 'px');
  }

  function update() {
    const y        = window.scrollY;
    const atTop    = y < 20;
    const goingDown = y > lastY;

    headers.forEach(header => {
      if (isIndex && atTop) {
        header.classList.add('sr-header--transparent');
        header.classList.remove('sr-header--solid', 'sr-header--hidden');
      } else {
        header.classList.remove('sr-header--transparent');
        header.classList.add('sr-header--solid');
        if (!isMobileNavOpen() && !isDrawerOpen()) {
          if (goingDown && y > HIDE_AFTER) {
            header.classList.add('sr-header--hidden');
          } else {
            header.classList.remove('sr-header--hidden');
          }
        }
      }
    });

    lastY   = y;
    ticking = false;
  }

  function init() {
    setHeaderH();
    update();
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', setHeaderH, { passive: true });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => SRHeaderBehavior.init());
