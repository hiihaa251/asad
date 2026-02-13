document.addEventListener('DOMContentLoaded', function() {
    
    let productsData = {};
    
    // Load products from JSON
    async function loadProducts() {
        try {
            const response = await fetch('id.json');
            productsData = await response.json(); 
            renderFeaturedProducts(); // Call function to render featured products
            renderGallery(); // Call function to render gallery
            renderMainProducts(); // Call function to render main products on index
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback to old method if JSON fails
            productsData = getProductDetailsFromDOM();
            renderFeaturedProducts(); // Also call on fallback
            renderGallery();
            renderMainProducts();
        }
    }
    
    // Fallback function to get from DOM
    function getProductDetailsFromDOM() {
        const products = {};
        document.querySelectorAll('.product-card').forEach(card => {
            const id = card.getAttribute('data-id');
            if(id) {
                const name = card.querySelector('h3')?.textContent || 'Unknown';
                const price = card.querySelector('.price')?.textContent || 'N/A';
                const badge = card.querySelector('.product-badge')?.textContent || '';
                products[id] = { name, price, category: badge };
            }
        });
        return products;
    }
    
    // Load products on start
    loadProducts();

    // --- NEW: RENDER FEATURED PRODUCTS ---
    function renderFeaturedProducts() {
        const grid = document.getElementById('featured-product-grid');
        if (!grid) return; // Only run if the element exists

        // In your id.json, add "featured": true to the products you want to show here
        const featured = Object.keys(productsData).filter(key => productsData[key].featured === true);

        if (featured.length === 0) {
            grid.innerHTML = '<p style="color:#8a8aa3; text-align:center;">Majiraan badeecooyin qaasa xilligan.</p>';
            return;
        }

        let html = '';
        featured.forEach(id => {
            const p = productsData[id];
            html += `
                <div class="product-card" data-id="${id}">
                    ${p.category ? `<div class="product-badge">${p.category}</div>` : ''}
                    ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : (p.video ? `<video controls playsinline preload="metadata" poster="${p.poster || ''}"><source src="${p.video}" type="video/mp4"></video>` : '')}
                    <h3>${p.name}</h3>
                    <div class="id-display">ID: ${id}</div>
                    ${p.features ? `<ul>${p.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}</ul>` : ''}
                    <div class="price">${p.price}</div>
                    <a href="#" class="btn wa-link">
                        <i class="fab fa-whatsapp"></i> Iibso WhatsApp
                    </a>
                </div>
            `;
        });

        grid.innerHTML = html;

        // Re-bind the click events for the newly added buttons
        grid.querySelectorAll('.btn.wa-link').forEach(button => {
            button.addEventListener('click', handleBuyButtonClick);
        });
    }

    // --- NEW: RENDER MAIN PRODUCTS (INDEX.HTML) ---
    function renderMainProducts() {
        const grid = document.getElementById('main-product-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // Sidaad codsatay, halkan waxaan ku soo bandhigaynaa kaliya 4-ta product ee la doortay
        const mainProductIds = ['253', '254', '305', '306'];

        mainProductIds.forEach(id => {
            if (!productsData[id]) {
                console.warn(`Product with ID ${id} for main page not found in id.json`);
                return;
            }
            const p = productsData[id];
            
            // Determine media HTML (Video or Image)
            let mediaHtml = '';
            if (p.mediaType === 'video' || p.videoUrl) {
                mediaHtml = `<video controls playsinline preload="metadata" controlsList="nodownload" disablePictureInPicture oncontextmenu="return false;" poster="${p.thumbnail || ''}">
                                <source src="${p.videoUrl}" type="video/mp4">
                             </video>`;
            } else {
                mediaHtml = `<img src="${p.thumbnail || p.image || 'images/placeholder.jpg'}" alt="${p.name}" loading="lazy">`;
            }

            // Format description as list if it contains commas, otherwise paragraph
            let descHtml = '';
            if (p.description) {
                const items = p.description.split(',').map(s => s.trim()).filter(s => s);
                if (items.length > 1) {
                    descHtml = `<ul>${items.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('')}</ul>`;
                } else {
                    descHtml = `<p style="padding:0 15px; color:#8a8aa3; font-size:0.9rem;">${p.description}</p>`;
                }
            }

            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-id', id);
            card.innerHTML = `
                <div class="product-badge">${p.category || 'Item'}</div>
                ${p.limitedOffer ? '<div class="limited-offer">Limited Offer!</div>' : ''}
                ${mediaHtml}
                <h3>${p.name}</h3>
                <div class="id-display">ID: ${id}</div>
                ${descHtml}
                <div class="price">${p.price}</div>
                <a href="#" class="btn wa-link">
                    <i class="fab fa-whatsapp"></i> Iibso WhatsApp
                </a>
            `;
            grid.appendChild(card);
        });

        // Re-bind click events for new buttons
        grid.querySelectorAll('.btn.wa-link').forEach(button => {
            button.addEventListener('click', handleBuyButtonClick);
        });
    }

    // --- NEW: RENDER GALLERY DYNAMICALLY ---
    function renderGallery() {
        const galleryContainer = document.getElementById('dynamic-gallery');
        if (!galleryContainer) return;

        galleryContainer.innerHTML = '';

        Object.keys(productsData).forEach(id => {
            const product = productsData[id];
            // Only show items that have media info
            if (!product.mediaType && !product.videoUrl && !product.thumbnail) return;

            // Determine category for filter
            let categoryFilter = 'other';
            if (product.category) {
                const catLower = product.category.toLowerCase();
                if (catLower.includes('pubg') && catLower.includes('uc')) categoryFilter = 'uc';
                else if (catLower.includes('pubg')) categoryFilter = 'pubg';
                else if (catLower.includes('efootball') && catLower.includes('coins')) categoryFilter = 'coins';
                else if (catLower.includes('efootball')) categoryFilter = 'efootball';
                else if (catLower.includes('uc')) categoryFilter = 'uc';
                else if (catLower.includes('coins')) categoryFilter = 'coins';
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'gallery-item';
            itemDiv.setAttribute('data-category', categoryFilter);
            itemDiv.setAttribute('data-id', id);

            let mediaContent = '';
            if (product.mediaType === 'video' || product.videoUrl) {
                mediaContent = `<video controls playsinline preload="metadata" controlsList="nodownload" disablePictureInPicture oncontextmenu="return false;" poster="${product.thumbnail || ''}">
                                    <source src="${product.videoUrl}" type="video/mp4">
                                </video>`;
            } else {
                mediaContent = `<img src="${product.thumbnail || product.image || 'images/placeholder.jpg'}" alt="${product.name}" loading="lazy">`;
            }

            itemDiv.innerHTML = `
                <div class="gallery-badge">${product.category || 'Item'}</div>
                <div class="image-placeholder">
                    ${mediaContent}
                    <span>${product.name}</span>
                </div>
                <div class="gallery-info">
                    <div class="id-display-gallery">ID: ${id}</div>
                    <h3>${product.name}</h3>
                    <p>${product.description || ''}</p>
                    <a href="#" class="btn gallery-buy-btn" data-product="${product.name}" data-id="${id}">
                        <i class="fab fa-whatsapp"></i> Iibso Tani
                    </a>
                </div>
            `;
            galleryContainer.appendChild(itemDiv);
        });
    }
    
    // --- 1. HAMBURGER MENU LOGIC ---
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');

    if(menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.style.opacity = '0.7';
            setTimeout(() => menuToggle.style.opacity = '1', 100);
        });

        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // ----- CART: client-side cart persisted in localStorage -----
    const CART_KEY = 'asad_cart_v1';
    function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){return []} }
    function saveCart(c){ try{ localStorage.setItem(CART_KEY, JSON.stringify(c)); }catch(e){} }
    let cart = loadCart();
    function addToCart(item){ const existing = cart.find(i=>i.id==item.id); if(existing){ existing.qty = (existing.qty||1) + (item.qty||1); } else { cart.push(Object.assign({qty: item.qty||1}, item)); } saveCart(cart); renderCart(); }
    function renderCart(){
        let sidebar = document.querySelector('.cart-sidebar');
        if(!sidebar){ sidebar = document.createElement('div'); sidebar.className='cart-sidebar'; document.body.appendChild(sidebar); }
        const itemsHtml = cart.length? cart.map((it,idx)=>`<div class="cart-item"><img src="${it.image||'images/sawirka.jpg'}"><div style="flex:1"><strong>${it.name}</strong><div>${it.qty} x ${it.price}</div></div><button data-idx="${idx}" class="remove-cart btn">Remove</button></div>`).join('') : '<p>No items</p>';
        const total = cart.reduce((s,i)=>{ const p=parseFloat((i.price||'0').replace(/[^\d\.]/g,''))||0; return s + p * i.qty },0).toFixed(2);
        sidebar.innerHTML = `<h3>Cart</h3>${itemsHtml}<div class="cart-footer"><div><strong>Total:</strong> ${total}</div><div style="margin-top:10px"><button id="checkout-cart" class="btn">Checkout (WhatsApp)</button></div></div>`;
        document.querySelectorAll('.remove-cart').forEach(b=>b.addEventListener('click', (e)=>{ const idx=+e.currentTarget.dataset.idx; cart.splice(idx,1); saveCart(cart); renderCart(); }));
        document.getElementById('checkout-cart')?.addEventListener('click', ()=>{
            if(cart.length===0){ alert('Cart is empty'); return; }
            const phone='252614476099';
            const items = cart.map(i=>`${i.name} (ID:${i.id}) x${i.qty} - ${i.price}`).join('\n');
            const total = cart.reduce((s,i)=>{ const p=parseFloat((i.price||'0').replace(/[^\d\.]/g,''))||0; return s + p * i.qty},0).toFixed(2);
            const message = `Dear ASAD! Waxaan raba inaan iibsado:\n${items}\nTotal: ${total}`;
            // save simple order list to localStorage
            const orderObj = {id:Date.now(), items:cart, total, date:new Date().toISOString(), status:'pending'};
            try{ const orders = JSON.parse(localStorage.getItem('asad_orders_v1')||'[]'); orders.push(orderObj); localStorage.setItem('asad_orders_v1', JSON.stringify(orders)); }catch(e){}
            // try to POST order to server (optional)
            (async ()=>{
                try{
                    const res = await fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(orderObj)});
                    if(res.ok){ console.log('Order sent to server'); }
                }catch(err){ console.warn('Server orders endpoint not reachable'); }
            })();
            // generate a simple invoice window
            try{
                const win = window.open('','_blank');
                if(win){
                    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice</title><style>body{font-family:Arial;background:#fff;color:#111;padding:20px}h1{color:#00adb5}</style></head><body><h1>Invoice</h1><p>Date: ${new Date().toLocaleString()}</p><pre>${items}</pre><h3>Total: ${total}</h3><p>Thanks for your purchase.</p></body></html>`;
                    win.document.write(html);
                    win.document.close();
                }
            }catch(e){}
            // open WhatsApp
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,'_blank');
            cart = []; saveCart(cart); renderCart();
        });
    }
    renderCart();
    document.getElementById('open-cart')?.addEventListener('click', ()=>{ document.querySelector('.cart-sidebar').classList.toggle('open'); });

    // --- 2. VIDEO LAZY-LOAD, AUTOPLAY & AUTO-PAUSE LOGIC ---
    const AUTOPLAY_KEY = 'asad_autoplay_v1';
    const autoplayToggle = document.getElementById('autoplay-toggle');
    const autoplayLabel = document.getElementById('autoplay-label');
    const savedAutoplay = (localStorage.getItem(AUTOPLAY_KEY) === '1');
    if(autoplayToggle) { autoplayToggle.checked = savedAutoplay; }

    function setAutoplayPreference(enabled){
        localStorage.setItem(AUTOPLAY_KEY, enabled ? '1' : '0');
    }
    setAutoplayPreference(savedAutoplay);
    if(autoplayToggle){ autoplayToggle.addEventListener('change', function(){ setAutoplayPreference(this.checked); }); }

    // Helper to set source from data-src
    function loadVideoSources(video){
        if(!video) return;
        if(video.dataset.loaded === '1') return;
        const sources = video.querySelectorAll('source');
        sources.forEach(src => {
            const data = src.getAttribute('data-src');
            if(data && !src.src){ src.src = data; }
        });
        try{ video.load(); video.dataset.loaded = '1'; }catch(e){}
    }

    // Pause other videos when one plays
    function bindAutoPause(videoList){
        videoList.forEach(video => {
            video.addEventListener('play', function() {
                document.querySelectorAll('video').forEach(otherVideo => {
                    if(video !== otherVideo) otherVideo.pause();
                });
            });
        });
    }

    // IntersectionObserver to lazy-load videos when near viewport
    const lazyVideos = Array.from(document.querySelectorAll('video.lazy-video'));
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const v = entry.target;
            if(entry.isIntersecting){
                loadVideoSources(v);
                // autoplay if enabled and video is muted (muted required for autoplay in many browsers)
                const shouldAutoplay = (localStorage.getItem(AUTOPLAY_KEY) === '1');
                if(shouldAutoplay){
                    try{ v.muted = true; v.play().catch(()=>{}); }catch(e){}
                }
                videoObserver.unobserve(v);
            }
        });
    }, { rootMargin: '200px 0px', threshold: 0.25 });

    lazyVideos.forEach(v => {
        // don't preload until observed
        try{ v.pause(); }catch(e){}
        videoObserver.observe(v);
    });

    // play-overlay clicks: load and play the specific video (unmuted)
    document.body.addEventListener('click', function(e){
        const playOverlay = e.target.closest('.play-overlay');
        if(playOverlay){
            const container = playOverlay.closest('.image-placeholder');
            const video = container?.querySelector('video');
            if(video){
                loadVideoSources(video);
                video.muted = false;
                video.play().catch(()=>{});
                // remove overlay once playing
                playOverlay.style.display = 'none';
            }
        }

        // toggle play/pause when clicking the video element itself
        const vidEl = e.target.closest('video');
        if(vidEl && !e.target.closest('.play-overlay')){
            if(vidEl.paused) {
                loadVideoSources(vidEl);
                vidEl.play().catch(()=>{});
            } else {
                vidEl.pause();
            }
        }
    });

    // bind auto-pause behavior to all videos (including those lazy-loaded)
    bindAutoPause(document.querySelectorAll('video'));

    // --- 3. TIKTOK MODAL LOGIC WITH COUNTDOWN ---
    const tiktokModal = document.getElementById('tiktok-modal');
    const closeTiktok = document.querySelector('.close-tiktok');
    const skipBtn = document.getElementById('skip-btn');
    const successModal = document.getElementById('success-modal');
    const countdownElement = document.getElementById('countdown');
    let pendingWhatsAppLink = '';
    let countdownTimer = null;
    let countdownValue = 15;

    // Open TikTok Modal Function
    function openTiktokModal(waLink) {
        pendingWhatsAppLink = waLink;
        countdownValue = 15;
        if(tiktokModal) {
            tiktokModal.style.display = "block";
            if(countdownElement) countdownElement.textContent = countdownValue;
        }
    }

    // Start Countdown
    function startCountdown() {
        if(countdownTimer) clearInterval(countdownTimer);
        
        countdownTimer = setInterval(() => {
            countdownValue--;
            if(countdownElement) countdownElement.textContent = countdownValue;
            
            if(countdownValue <= 0) {
                clearInterval(countdownTimer);
                openWhatsApp();
            }
        }, 1000);
    }

    // Open WhatsApp
    function openWhatsApp() {
        if(tiktokModal) tiktokModal.style.display = "none";
        
        // Show success modal
        if(successModal) {
            successModal.style.display = "block";
            setTimeout(() => {
                successModal.style.display = "none";
            }, 2000);
        }
        
        // Open WhatsApp
        if(pendingWhatsAppLink) {
            window.open(pendingWhatsAppLink, '_blank');
        }
    }

    // Close TikTok Modal
    if(closeTiktok) {
        closeTiktok.addEventListener('click', () => {
            tiktokModal.style.display = "none";
            if(countdownTimer) clearInterval(countdownTimer);
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target == tiktokModal) {
            tiktokModal.style.display = "none";
            if(countdownTimer) clearInterval(countdownTimer);
        }
        if (e.target == successModal) {
            successModal.style.display = "none";
        }
    });

    // TikTok Follow Button Click
    document.querySelector('.tiktok-follow-btn')?.addEventListener('click', function(e) {
        // TikTok opens in new tab (handled by href)
        // Start countdown
        startCountdown();
    });

    // Helper to record order to server
    async function recordOrder(items, total) {
        const orderObj = {id:Date.now(), items, total, date:new Date().toISOString(), status:'pending'};
        try{
            await fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(orderObj)});
        }catch(e){ console.warn('Failed to record order'); }
    }

    // --- 4. WHATSAPP BUTTON LOGIC (Direct Products - INDEX.HTML) ---
    function handleBuyButtonClick(e) {
        e.preventDefault();
        const card = this.closest('.product-card');
        const id = card ? card.getAttribute('data-id') : 'N/A';
        const product = productsData[id];
        const name = product ? product.name : 'Unknown';
        const price = product ? product.price : 'N/A';

        // If product is UC (305) or Coins (306), open payment modal instead of direct WhatsApp
        if (id === '305' || id === '306') {
            selectedMethod = 'evc';
            if(errorMessage) errorMessage.style.display = 'none';
            if(modal) modal.style.display = 'block';
            if(projectIdInput) {
                projectIdInput.style.borderColor = '#363654';
                projectIdInput.value = id;
                // Manually trigger the input event to load preview and packages
                projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            try{ const st = loadState(); st.modalOpen = true; st.selectedMethod = 'evc'; st.projectId = id; saveState(st); }catch(e){}
            return; // Stop here
        }

        // Direct WhatsApp flow via TikTok modal (replacing cart)
        const message = `Dear ASAD! Waxaan raba ${name} (ID: ${id})`;
        const waLink = `https://wa.me/252614476099?text=${encodeURIComponent(message)}`;
        
        // Record order
        recordOrder([{name, id, price, qty:1}], price);
        
        openTiktokModal(waLink);
    }

    document.querySelectorAll('.btn.wa-link').forEach(button => {
        button.addEventListener('click', handleBuyButtonClick);
    });


    // --- 5. GALLERY BUY BUTTONS (GALLERY.HTML) ---
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.gallery-buy-btn');
        if (button) {
            e.preventDefault();
            const id = button.getAttribute('data-id');
            const product = productsData[id];
            const name = product ? product.name : button.getAttribute('data-product');

            // If product is UC (305) or Coins (306), open payment modal with EVC preselected
            if (id === '305' || id === '306') {
                selectedMethod = 'evc';
                if(errorMessage) errorMessage.style.display = 'none';
                if(modal) modal.style.display = 'block';
                if(projectIdInput) {
                    projectIdInput.style.borderColor = '#363654';
                    projectIdInput.value = id;
                    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                try{ const st = loadState(); st.modalOpen = true; st.selectedMethod = 'evc'; st.projectId = id; saveState(st); }catch(e){}
                return;
            }

            // default behavior: open WhatsApp flow via TikTok modal
            const baseLink = "https://wa.me/252614476099";
            const message = `Dear ASAD! Waxaan raba ${name} (ID: ${id})`;
            const waLink = `${baseLink}?text=${encodeURIComponent(message)}`;
            
            // Record order
            recordOrder([{name, id, price: product?.price||'N/A', qty:1}], product?.price||'N/A');
            
            openTiktokModal(waLink);
        }
    });

    // --- 6. MODAL POPUP & VALIDATION LOGIC WITH PRODUCT PREVIEW ---
    const modal = document.getElementById('payment-modal');
    const closeBtns = document.querySelectorAll('.close-modal');
    const paymentForm = document.getElementById('payment-form');
    const errorMessage = document.getElementById('error-message');
    const projectIdInput = document.getElementById('project-id');
    const productPreview = document.getElementById('product-preview');
    const previewContent = document.getElementById('preview-content');
    
    let selectedMethod = "";

    // Local storage helpers to persist payment modal state across refresh
    const STORAGE_KEY = 'asad_payment_state';
    function saveState(state) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state || {})); } catch (e) { }
    }
    function loadState() {
        try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; }
    }
    function clearState() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }
    }
    function restorePaymentState() {
        const st = loadState();
        if (st && st.modalOpen) {
            selectedMethod = st.selectedMethod || '';
            if (modal) {
                modal.style.display = 'block';
                errorMessage.style.display = 'none';
                projectIdInput.style.borderColor = '#363654';
                if (productPreview) productPreview.style.display = 'none';
                if (st.projectId) {
                    projectIdInput.value = st.projectId;
                    // trigger input handler to populate preview and package options
                    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    projectIdInput.focus();
                }
            }
        }
    }

    // Get all valid Product IDs and their details
    function getProductDetails() {
        return productsData;
    }

    // Open Modal / payment method handling
    document.querySelectorAll('.method').forEach(method => {
        method.addEventListener('click', function() {
            const methodName = this.getAttribute('data-method');

            // If method is unavailable, show message in modal
            const unavailable = ['zaad','paypal','bank'];
            if (unavailable.includes(methodName)) {
                if(modal) modal.style.display = 'block';
                if(errorMessage) { errorMessage.innerHTML = 'This service is not available'; errorMessage.style.display = 'block'; }
                const packageGroup = document.getElementById('package-group'); if(packageGroup) packageGroup.style.display = 'none';
                return;
            }

            // normal flow: open modal and prepare for input
            selectedMethod = methodName;
            if(modal) {
                modal.style.display = "block";
                if(errorMessage) errorMessage.style.display = "none";
                if(projectIdInput) projectIdInput.style.borderColor = "#363654";
                if(productPreview) productPreview.style.display = "none";

                // restore any saved projectId if present
                const st = loadState();
                st.modalOpen = true;
                st.selectedMethod = selectedMethod || '';
                saveState(st);

                if (st.projectId) {
                    projectIdInput.value = st.projectId;
                    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    projectIdInput.focus();
                }
            }
        });
    });

    // Close Modal (bind all close buttons)
    if(closeBtns && closeBtns.length) {
        closeBtns.forEach(cb => cb.addEventListener('click', () => {
            if(modal) modal.style.display = "none";
            clearState();
        }));
    }

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = "none";
            clearState();
        }
    });

    // Show Product Preview on ID Input
    if(projectIdInput) {
        projectIdInput.addEventListener('input', function() {
            const inputID = this.value.trim();
            const products = getProductDetails();
            
            errorMessage.style.display = "none";
            this.style.borderColor = "#363654";
            
            if(inputID && products[inputID]) {
                const product = products[inputID];
                if(productPreview && previewContent) {
                    previewContent.innerHTML = `
                        <p style="color:#fff; margin:5px 0;"><strong>Name:</strong> ${product.name}</p>
                        <p style="color:#fff; margin:5px 0;"><strong>Price:</strong> ${product.price}</p>
                        <p style="color:#fff; margin:5px 0;"><strong>Category:</strong> ${product.category}</p>
                    `;
                    productPreview.style.display = "block";
                }
                // If product is UC or Coins, show package selector
                if(product.category && (product.category.toLowerCase() === 'uc' || product.category.toLowerCase() === 'coins')) {
                    const packageGroup = document.getElementById('package-group');
                    const packageSelect = document.getElementById('package-select');
                    const packagePrice = document.getElementById('package-price');
                    if(packageGroup && packageSelect) {
                        // price mappings
                        const priceMap = {
                            "UC": [
                                {qty: '600 UC', price: '$10'},
                                {qty: '1500 UC', price: '$20'},
                                {qty: '3000 UC', price: '$35'},
                                {qty: '6000 UC', price: '$60'}
                            ],
                            "Coins": [
                                {qty: '500 Coins', price: '$8'},
                                {qty: '1000 Coins', price: '$15'},
                                {qty: '2500 Coins', price: '$30'},
                                {qty: '5000 Coins', price: '$50'}
                            ]
                        };

                        // choose correct list: prefer product.packages from id.json when available
                        let list = [];
                        if (product.packages && Array.isArray(product.packages) && product.packages.length) {
                            list = product.packages.map(p => ({ qty: p.qty, price: p.price }));
                        } else {
                            const key = product.category.toLowerCase() === 'uc' ? 'UC' : 'Coins';
                            list = priceMap[key] || [];
                        }

                        // populate options
                        packageSelect.innerHTML = '';
                        list.forEach((opt, idx) => {
                            const option = document.createElement('option');
                            option.value = `${opt.qty}||${opt.price}`;
                            option.textContent = `${opt.qty} — ${opt.price}`;
                            packageSelect.appendChild(option);
                        });

                        // show UI
                        packageGroup.style.display = 'block';
                        packagePrice.style.display = 'block';
                        // set initial price display
                        if(list[0]) packagePrice.textContent = `Qiimaha: ${list[0].price}`;

                                // handle changes
                                packageSelect.onchange = function() {
                                    const [q, p] = this.value.split('||');
                                    packagePrice.textContent = `Qiimaha: ${p}`;
                                    // persist selected package
                                    const stp = loadState();
                                    stp.package = this.value;
                                    saveState(stp);
                                };
                                // restore previously selected package if available
                                const stpkg = loadState();
                                if (stpkg && stpkg.package) {
                                    packageSelect.value = stpkg.package;
                                    const [q0, p0] = stpkg.package.split('||');
                                    packagePrice.textContent = `Qiimaha: ${p0}`;
                                }
                                // persist project id when product recognized
                                const stsave = loadState();
                                stsave.projectId = inputID;
                                stsave.modalOpen = true;
                                stsave.selectedMethod = selectedMethod || '';
                                saveState(stsave);
                    }
                } else {
                    const packageGroup = document.getElementById('package-group');
                    if(packageGroup) packageGroup.style.display = 'none';
                }
            } else {
                if(productPreview) productPreview.style.display = "none";
            }
        });
    }

    // Form Submit & Validation
    if(paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputID = projectIdInput.value.trim();
            const products = getProductDetails();
            const validIDs = Object.keys(products);

            // Check if entered ID exists
            if (!validIDs.includes(inputID)) {
                errorMessage.innerHTML = `<i class="fas fa-times-circle"></i> Ma jiro ID-gan! Fadlan dooro mid ka mid ah: ${validIDs.join(', ')}`;
                errorMessage.style.display = "block";
                projectIdInput.style.borderColor = "#ff4d4d";
                return; 
            }

            // Valid ID
            errorMessage.style.display = "none";
            projectIdInput.style.borderColor = "#00adb5";

            const product = products[inputID];
            const name = product ? product.name : 'Unknown';
            const phone = "252614476099";
            const packageSelect = document.getElementById('package-select');
            let packageText = '';
            if(packageSelect && packageSelect.value) {
                const [qty, price] = packageSelect.value.split('||');
                packageText = ` - Package: ${qty} (${price})`;
            }
            const message = `Dear ASAD! Waxaan u baahanahay account ID ${inputID} (${name})${packageText}`;
            const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            
            // Record order
            recordOrder([{name: name + (packageText||''), id: inputID, price: product?.price||'N/A', qty:1}], product?.price||'N/A');
            
            // Show TikTok Modal first
            openTiktokModal(waLink);

            modal.style.display = "none";
            // clear persisted state after submitting (user completed flow)
            clearState();
            paymentForm.reset();
            if(productPreview) productPreview.style.display = "none";
        });
    }

    // --- 7. BACK TO TOP BUTTON ---
    const backToTopBtn = document.getElementById('back-to-top');
    
    if(backToTopBtn) {
        window.addEventListener('scroll', () => {
            if(window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- 8. FAQ ACCORDION ---
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked FAQ if it wasn't active
            if(!isActive) {
                faqItem.classList.add('active');
            }
        });
    });

    // --- 9. SMOOTH SCROLLING ---
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if(targetId.startsWith('#') && targetId.length > 1) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    const headerHeight = document.querySelector('header').offsetHeight;
                    window.scrollTo({
                        top: targetElement.offsetTop - headerHeight,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // --- SEARCH / FILTER for index product cards ---
    const searchInput = document.getElementById('global-search');
    const filterCategory = document.getElementById('filter-category');
    function filterProducts(){
        const q = (searchInput?.value||'').toLowerCase();
        const cat = (filterCategory?.value||'all');
        document.querySelectorAll('.product-card').forEach(card=>{
            const id = card.getAttribute('data-id')||'';
            const name = card.querySelector('h3')?.textContent?.toLowerCase()||'';
            const badge = card.querySelector('.product-badge')?.textContent||'';
            let show = true;
            if(q){ show = name.includes(q) || id.includes(q); }
            if(cat && cat!=='all'){ show = show && (badge===cat); }
            card.style.display = show? 'block':'none';
        });
    }
    searchInput?.addEventListener('input', debounce(filterProducts, 250));
    filterCategory?.addEventListener('change', filterProducts);

    function debounce(fn, ms){ let t; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), ms); } }

    // --- 10. UPDATE YEAR & SCROLL ANIMATIONS ---
    const yearEl = document.getElementById('current-year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card, .method, .contact-item, .testimonial-card, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // --- 11. HERO SLIDER ANIMATION ---
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    const slideInterval = 3000;

    if(slides.length > 0) {
        setInterval(() => {
            let nextSlide = (currentSlide + 1) % slides.length;

            slides[currentSlide].classList.remove('active');
            slides[currentSlide].classList.add('exit');

            slides[nextSlide].classList.add('active');
            slides[nextSlide].classList.remove('exit');

            let exitingSlide = slides[currentSlide];
            setTimeout(() => {
                exitingSlide.classList.remove('exit');
            }, 800);

            currentSlide = nextSlide;
        }, slideInterval);
    }
    
    // WhatsApp floating button: prefill a quick support message
    const whatsappFloat = document.getElementById('whatsapp-float');
    if(whatsappFloat) {
        whatsappFloat.addEventListener('click', function(e) {
            e.preventDefault();
            const phone = '252614476099';
            const msg = 'Hello ASAD! Waxaan u baahanahay caawimaad ku saabsan badeecadaha, fadlan igu soo jawaab.';
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        });
    }

    // --- Reviews submission handling ---
    const reviewForm = document.getElementById('review-form');
    if(reviewForm){
        reviewForm.addEventListener('submit', function(e){
            e.preventDefault();
            const name = document.getElementById('rev-name').value.trim()||'Anonymous';
            const rating = document.getElementById('rev-rating').value;
            const text = document.getElementById('rev-text').value.trim();
            const productId = (document.getElementById('rev-product')?.value||'').trim() || null;
            const newRev = { id: Date.now(), productId: productId, name, rating: +rating, text, date: new Date().toISOString(), verified: false };
            // save locally
            try{
                const revs = JSON.parse(localStorage.getItem('asad_reviews_v1')||'[]'); revs.push(newRev); localStorage.setItem('asad_reviews_v1', JSON.stringify(revs));
            }catch(e){ console.error(e); }
            // try to POST to server; if fails, keep local copy
            (async ()=>{
                try{
                    const res = await fetch('/api/reviews', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newRev) });
                    if(!res.ok) throw new Error('server error');
                    const saved = await res.json();
                    // update local copy id if server returned different id
                    try{ let revs = JSON.parse(localStorage.getItem('asad_reviews_v1')||'[]'); revs = revs.map(r=> r.id===newRev.id ? saved : r); localStorage.setItem('asad_reviews_v1', JSON.stringify(revs)); }catch(e){}
                }catch(err){ console.warn('Server not available, review kept locally'); }
            })();
            document.getElementById('review-msg').textContent = 'Thanks! Your review was saved (pending verification).';
            document.getElementById('review-msg').style.display = 'block';
            reviewForm.reset();
            renderLocalReviews();
        });
    }

    // render local reviews list (with edit/delete for owner)
    function renderLocalReviews(){
        const container = document.getElementById('local-reviews');
        if(!container) return;
        const revs = JSON.parse(localStorage.getItem('asad_reviews_v1')||'[]');
        if(revs.length===0){
            container.innerHTML = '<h2 style="color:#00adb5;text-align:center;margin:0 0 10px;">Waxay Macaamiisheenu Ka Yiraahdeen</h2>';
            return;
        }
        container.innerHTML = revs.map(r=>`<div class="review-item" data-id="${r.id}" style="padding:10px;border:1px solid #222;margin-bottom:8px;border-radius:6px"><div><strong>${r.name}</strong> <span style="color:#ffd700">${'★'.repeat(r.rating)}</span></div><div style="color:#8a8aa3">${r.text}</div><div style="margin-top:6px"><button class="edit-review" data-id="${r.id}">Edit</button> <button class="delete-review" data-id="${r.id}">Delete</button></div></div>`).join('');
        container.querySelectorAll('.delete-review').forEach(b=>b.addEventListener('click', (e)=>{ const id=+e.currentTarget.dataset.id; let revs=JSON.parse(localStorage.getItem('asad_reviews_v1')||'[]'); revs = revs.filter(x=>x.id!==id); localStorage.setItem('asad_reviews_v1', JSON.stringify(revs)); renderLocalReviews(); }));
        container.querySelectorAll('.edit-review').forEach(b=>b.addEventListener('click', (e)=>{
            const id = +e.currentTarget.dataset.id; const revs = JSON.parse(localStorage.getItem('asad_reviews_v1')||'[]'); const rv = revs.find(x=>x.id===id); if(!rv) return; const newText = prompt('Edit your review text', rv.text); if(newText===null) return; rv.text = newText; const updated = revs.map(x=> x.id===id? rv : x); localStorage.setItem('asad_reviews_v1', JSON.stringify(updated)); renderLocalReviews();
            // optionally sync edit to server if review exists there
            (async ()=>{ try{ await fetch('/api/reviews/'+id, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(rv) }); }catch(e){} })();
        }));
    }
    renderLocalReviews();

    // fetch server reviews and merge/refresh average ratings
    async function loadAndMergeServerReviews(){
        try{
            const res = await fetch('/api/reviews');
            if(!res.ok) throw new Error('no server');
            const serverRevs = await res.json();
            // combine with local unreached ones (by id)
            const local = JSON.parse(localStorage.getItem('asad_reviews_v1')||'[]');
            const merged = serverRevs.concat(local.filter(l=>!serverRevs.find(s=>String(s.id)===String(l.id))));
            // save a merged view to localStorage for quick access
            localStorage.setItem('asad_reviews_v1', JSON.stringify(merged));
            renderLocalReviews();
            updateAllAverageRatings();
        }catch(e){ console.warn('Server not reachable for reviews'); updateAllAverageRatings(); }
    }
    loadAndMergeServerReviews();

    // compute and update average rating per product card
    function updateAllAverageRatings(){
        const revs = JSON.parse(localStorage.getItem('asad_reviews_v1')||'[]');
        // group by productId if available, otherwise global
        const byId = {};
        revs.forEach(r=>{ if(r.productId){ byId[r.productId] = byId[r.productId]||[]; byId[r.productId].push(r.rating); } });
        document.querySelectorAll('.product-card').forEach(card=>{
            const pid = card.getAttribute('data-id');
            let avg = 0, count = 0;
            if(byId[pid] && byId[pid].length){ const arr = byId[pid]; count = arr.length; avg = Math.round((arr.reduce((s,a)=>s+a,0)/arr.length)*10)/10; }
            let starsEl = card.querySelector('.avg-stars');
            if(!starsEl){ starsEl = document.createElement('div'); starsEl.className = 'avg-stars'; starsEl.style.padding = '8px 15px'; starsEl.style.color = '#ffd700'; card.querySelector('h3')?.after(starsEl); }
            starsEl.innerHTML = count ? `${'★'.repeat(Math.round(avg))} <span style="color:#8a8aa3; font-size:0.9rem; margin-left:6px">${avg} (${count})</span>` : `<span style="color:#8a8aa3">No reviews</span>`;
        });
    }

    // Lightbox + Lazy-load for images and videos
    // create lightbox element
    let lightbox = document.getElementById('lightbox');
    if(!lightbox){
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = '<div class="lightbox-content" id="lightbox-content"></div>';
        document.body.appendChild(lightbox);
    }
    lightbox.addEventListener('click', () => { lightbox.classList.remove('open'); lightbox.querySelector('#lightbox-content').innerHTML = ''; });

    // delegate clicks for images and videos to open lightbox
    document.body.addEventListener('click', function(e){
        const target = e.target;
        if(target.tagName === 'IMG' && target.closest('.image-placeholder, .proof-item')){
            const src = target.getAttribute('src') || target.dataset.src;
            const container = document.getElementById('lightbox-content');
            container.innerHTML = `<img src="${src}" alt="Preview">`;
            lightbox.classList.add('open');
        }
        if(target.tagName === 'VIDEO' || target.closest('video')){
            const vid = target.tagName==='VIDEO' ? target : target.closest('video');
            const sourceEl = vid.querySelector('source');
            const src = sourceEl?.src || sourceEl?.getAttribute('data-src');
            const container = document.getElementById('lightbox-content');
            container.innerHTML = `<video controls autoplay src="${src}"></video>`;
            lightbox.classList.add('open');
        }
    });

    // Lazy load images using loading=lazy where supported; also observe images with data-src
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                const el = entry.target;
                const ds = el.dataset.src;
                if(ds) el.src = ds;
                lazyObserver.unobserve(el);
            }
        });
    }, { rootMargin: '100px' });
    document.querySelectorAll('img[data-src]').forEach(img => lazyObserver.observe(img));
});
// Live Online Users Counter
// Variable lagu kaydiyo tirada hadda taagan si looga bilaabo markay isbadalayso
let currentOnline = 85; // Waxay ku bilaabanaysaa inta u dhaxaysa 60-113

function updateOnlineUsers() {
    const counterElement = document.getElementById('online-counter');
    
    if (counterElement) {
        // 1. Samee isbeddel u dhexeeya 1 ilaa 10 (random step)
        let step = Math.floor(Math.random() * 10) + 1;
        
        // 2. Go'aanso haddii ay kor u kacayso (+1) ama ay hoos u dhacayso (-1)
        let direction = Math.random() > 0.5 ? 1 : -1;
        
        // 3. Xisaabi tirada cusub
        let nextNumber = currentOnline + (step * direction);
        
        // 4. Hubi inaysan ka yaraan 60, kana badan 113
        if (nextNumber < 60) {
            nextNumber = 60 + Math.floor(Math.random() * 5); // Hadday 60 ka hoos marto, dib ugu celi 60+
        } else if (nextNumber > 113) {
            nextNumber = 113 - Math.floor(Math.random() * 5); // Hadday 113 dhaafto, dib u soo yaree
        }
        
        // 5. Cusboonaysii tirada hadda taagan iyo interface-ka
        currentOnline = nextNumber;
        counterElement.textContent = currentOnline;
    }
}

// Waxay isbadalaysaa 3-dii ilbiriqsiba (3000ms)
setInterval(updateOnlineUsers, 3000);

/* Language switcher: persists choice and updates UI texts on index & gallery pages */
(function(){
    const translations = {
        so: {
            nav_home: 'Home',
            nav_gallery: 'Qaybta Sawirrada',
            nav_products: 'Iibso',
            nav_contact: 'Contact',
            nav_whatsapp: 'WhatsApp',
            hero_h1: 'Iibso Account-yada PUBG & eFootball',
            hero_p: 'Hel account-yo premium ah, UC, coins, iyo skins-ka aad ugu jecelyahay!',
            buy_now: 'Iibso Hada',
            view_gallery: 'Daawo Sawirrada',
            view_all: 'Daawo Dhamaan',
            products_title: 'Account-yada & Badeecada',
            products_sub: 'Dooro mid ka mid ah products-kan hoose oo isticmaal ID-ga ku qoran',
            payment_title: 'Habka Lacag Bixinta',
            payment_sub: 'Riix mid kamid ah hababka hoose si aad u dhammaystirto',
            methods: { evc: 'EVC-Plus', zaad: 'Zaad Service', paypal: 'PayPal', bank: 'Bank Transfer' },
            contact_title: 'La Xidhiidh',
            testimonials_title: 'Waxay Macaamiisheenu Ka Yiraahdeen',
            faq_title: "Su'aalaha Inta Badan La Isweydiiyo",
            leave_review: 'Faallo ka bixi adeega',
            submit_review: 'Submit Review',
            buy_whatsapp: 'Iibso WhatsApp',
            gallery_hero_h1: 'Qaybta Sawirrada',
            gallery_hero_p: 'Daawo sawirrada fiican ee account-yada PUBG iyo eFootball.',
            faq_q1: 'Sidee loo iibsadaa account?',
            faq_a1: 'Dooro account-ka aad rabto, riix "Iibso WhatsApp", follow TikTok, kadib WhatsApp ayaa furmi doonta oo noo dir message.',
            faq_q2: 'Ma safe baa account-yadu?',
            faq_a2: 'Haa 100%! Dhammaan account-yadeena waa kuwo legal ah oo laga iibiyo si ammaan ah.',
            faq_q3: 'Intee in le\'eg ayuu delivery-gu qaadanayaa?',
            faq_a3: 'Inta badan 5-10 daqiiqo gudahood kadib markii lacagta la bixiyo.',
            faq_q4: 'Maxay yihiin payment methods-ka?',
            faq_a4: 'Waxaan aqbalnaa: EVC-Plus, Zaad Service, PayPal, iyo Bank Transfer.',
            privacy_title: 'Privacy Policy (Qaanuunka Arrimaha Khaaska ah)',
            privacy_h1: '1. Hordhac',
            privacy_p1: "Ku soo dhawoow AZAD STORE. Waxaan ixtiraamnaa xogtaada gaarka ah waxaana naga go'an inaan ilaalino. Boggan wuxuu sharxayaa sida aan u ururino, u isticmaalno, una ilaalino xogtaada markaad booqato website-keena.",
            privacy_h3: '3. Sida aan u Isticmaalno Xogta',
            privacy_p3: 'Xogta aan ururino waxaa loo isticmaalaa:',
            privacy_l3_1: 'Si aan u fahamno baahida macaamiisha iyo horumarinta adeegga.',
            privacy_l3_2: 'Si aan u ogaano badeecadaha loogu jecel yahay.',
            privacy_h4: '4. La Wadaagista Xogta',
            privacy_p4: "Ma iibino, mana la wadaagno xogtaada shaqsiyaadka kale ama shirkadaha kale, marka laga reebo adeegyada aan isku haleyno sida Google (Analytics) oo leh siyaasadohooda gaarka ah.",
            privacy_h5: '5. La Xiriir',
            privacy_p5: 'Haddii aad qabto wax su\'aal ah oo ku saabsan Privacy Policy-gan, fadlan nagala soo xiriir WhatsApp: <a href="https://wa.me/252614476099" style="color: #00adb5;">+252 61 447 6099</a>.'
        },
        en: {
            nav_home: 'Home',
            nav_gallery: 'Gallery',
            nav_products: 'Products',
            nav_contact: 'Contact',
            nav_whatsapp: 'WhatsApp',
            hero_h1: 'Buy PUBG & eFootball Accounts',
            hero_p: 'Get premium accounts, UC, coins and skins with fast delivery!',
            buy_now: 'Buy Now',
            view_gallery: 'View Gallery',
            view_all: 'View All Products',
            products_title: 'Accounts & Products',
            products_sub: 'Choose one of the products below and use the displayed ID',
            payment_title: 'Payment Methods',
            payment_sub: 'Click a method below to complete payment',
            methods: { evc: 'EVC-Plus', zaad: 'Zaad Service', paypal: 'PayPal', bank: 'Bank Transfer' },
            contact_title: 'Contact',
            testimonials_title: 'What Our Customers Say',
            faq_title: 'Frequently Asked Questions',
            leave_review: 'Leave a Review',
            submit_review: 'Submit Review',
            buy_whatsapp: 'Buy via WhatsApp',
            gallery_hero_h1: 'Gallery',
            gallery_hero_p: 'Browse high-quality images and videos of our accounts.',
            faq_q1: 'How do I buy an account?',
            faq_a1: 'Choose the account you want, click "Buy via WhatsApp", follow our TikTok, then WhatsApp will open for you to send us a message.',
            faq_q2: 'Are the accounts safe?',
            faq_a2: 'Yes — 100%. All our accounts are legitimate and delivered securely.',
            faq_q3: 'How long does delivery take?',
            faq_a3: 'Usually within 5-10 minutes after payment is confirmed.',
            faq_q4: 'What payment methods do you accept?',
            faq_a4: 'We accept: EVC-Plus, Zaad Service, PayPal, and Bank Transfer.',
            privacy_title: 'Privacy Policy',
            privacy_h1: '1. Introduction',
            privacy_p1: "Welcome to AZAD STORE. We respect your privacy and are committed to protecting it. This page explains how we collect, use, and protect your information when you visit our website.",
            privacy_h3: '3. How We Use Information',
            privacy_p3: 'The information we collect is used to:',
            privacy_l3_1: 'Understand customer needs and improve our service.',
            privacy_l3_2: 'Identify the most popular products.',
            privacy_h4: '4. Sharing of Information',
            privacy_p4: "We do not sell or share your personal data with other individuals or companies, except for trusted services like Google (Analytics) which have their own privacy policies.",
            privacy_h5: '5. Contact Us',
            privacy_p5: 'If you have any questions about this Privacy Policy, please contact us on WhatsApp: <a href="https://wa.me/252614476099" style="color: #00adb5;">+252 61 447 6099</a>.'
        },
        sw: {
            nav_home: 'Nyumbani',
            nav_gallery: 'Matunzio',
            nav_products: 'Bidhaa',
            nav_contact: 'Mawasiliano',
            nav_whatsapp: 'WhatsApp',
            hero_h1: 'Nunua Accounts za PUBG & eFootball',
            hero_p: 'Pata accounts za premium, UC, sarafu na skins kwa delivery ya haraka!',
            buy_now: 'Nunua Sasa',
            view_gallery: 'Tazama Matunzio',
            view_all: 'Tazama Zote',
            products_title: 'Accounts & Bidhaa',
            products_sub: 'Chagua moja ya bidhaa hapa chini na tumia ID iliyoonyeshwa',
            payment_title: 'Njia za Malipo',
            payment_sub: 'Bonyeza njia hapa chini ili kumaliza malipo',
            methods: { evc: 'EVC-Plus', zaad: 'Zaad Service', paypal: 'PayPal', bank: 'Bank Transfer' },
            contact_title: 'Wasiliana',
            testimonials_title: 'Mabenki ya Wateja Wetu',
            faq_title: 'Maswali Yanayoulizwa Mara kwa Mara',
            leave_review: 'Wacha Maoni',
            submit_review: 'Tuma Maoni',
            buy_whatsapp: 'Nunua kwa WhatsApp',
            gallery_hero_h1: 'Matunzio',
            gallery_hero_p: 'Tazama picha na video za ubora wa juu za accounts zetu.',
            faq_q1: 'Jinsi ya kununua account?',
            faq_a1: 'Chagua account unayotaka, bonyeza "Nunua kwa WhatsApp", fuata TikTok yetu, kisha WhatsApp itafunguka ili kutuma ujumbe.',
            faq_q2: 'Je, accounts ni salama?',
            faq_a2: 'Ndio 100%. Accounts zetu zote ni halali na zinatolewa kwa usalama.',
            faq_q3: 'Uwasilishaji unachukua muda gani?',
            faq_a3: 'Kawaida ndani ya dakika 5-10 baada ya malipo kuthibitishwa.',
            faq_q4: 'Unakubali njia gani za malipo?',
            faq_a4: 'Tunakubali: EVC-Plus, Zaad Service, PayPal, na Bank Transfer.',
            privacy_title: 'Sera ya Faragha',
            privacy_h1: '1. Utangulizi',
            privacy_p1: "Karibu AZAD STORE. Tunaheshimu faragha yako na tumejitolea kuilinda. Ukurasa huu unaelezea jinsi tunavyokusanya, kutumia, na kulinda taarifa zako unapotembelea tovuti yetu.",
            privacy_h3: '3. Jinsi Tunavyotumia Taarifa',
            privacy_p3: 'Taarifa tunazokusanya hutumika kwa:',
            privacy_l3_1: 'Kuelewa mahitaji ya wateja na kuboresha huduma zetu.',
            privacy_l3_2: 'Kutambua bidhaa maarufu zaidi.',
            privacy_h4: '4. Kushiriki Taarifa',
            privacy_p4: "Hatuuzi wala kushiriki data yako ya kibinafsi na watu wengine au makampuni, isipokuwa huduma tunazoamini kama Google (Analytics) ambazo zina sera zao za faragha.",
            privacy_h5: '5. Wasiliana Nasi',
            privacy_p5: 'Ikiwa una maswali yoyote kuhusu Sera hii ya Faragha, tafadhali wasiliana nasi kupitia WhatsApp: <a href="https://wa.me/252614476099" style="color: #00adb5;">+252 61 447 6099</a>.'
        }
    };

    function setText(el, txt){ if(!el) return; if(el.tagName==='INPUT' || el.tagName==='TEXTAREA') el.placeholder = txt; else el.innerHTML = txt; }

    function applyLanguage(lang){
        const t = translations[lang] || translations.so;
        // nav links
        document.querySelectorAll('#nav-menu a').forEach(a => {
            const href = a.getAttribute('href')||'';
            if(href.includes('gallery')) a.textContent = t.nav_gallery;
            else if(href.includes('#products')) a.textContent = t.nav_products;
            else if(href.includes('#contact')) a.textContent = t.nav_contact;
            else if(href.includes('#home')) a.textContent = t.nav_home;
            else if(href.includes('wa.me')) a.textContent = t.nav_whatsapp;
        });

        // hero / gallery hero
        setText(document.querySelector('.hero-content h2'), t.hero_h1);
        setText(document.querySelector('.hero-content p'), t.hero_p);
        const cta = document.querySelectorAll('.cta-buttons .btn');
        if(cta[0]) cta[0].textContent = t.buy_now;
        if(cta[1]) cta[1].textContent = t.view_gallery;
        // gallery hero
        setText(document.querySelector('.gallery-hero h1'), t.gallery_hero_h1);
        setText(document.querySelector('.gallery-hero p'), t.gallery_hero_p);
        document.querySelectorAll('.gallery-hero .btn').forEach(b=> b.textContent = t.buy_now);

        // products section
        setText(document.querySelector('section.products h2'), t.products_title);
        setText(document.querySelector('section.products p'), t.products_sub);

        // payment section
        setText(document.querySelector('section.payment h2'), t.payment_title);
        setText(document.querySelector('section.payment p'), t.payment_sub);
        document.querySelectorAll('.payment-methods .method').forEach(m=>{
            const key = (m.getAttribute('data-method')||'').toLowerCase();
            const txt = t.methods[key] || m.querySelector('h3')?.textContent;
            if(m.querySelector('h3')) m.querySelector('h3').textContent = txt;
        });

        // contact
        setText(document.querySelector('#contact h2'), t.contact_title);

        // testimonials & faq
        setText(document.querySelector('.testimonials h2'), t.testimonials_title);
        setText(document.querySelector('#faq h2'), t.faq_title);

        // reviews form
        setText(document.querySelector('.reviews-form h3'), t.leave_review);
        const submitBtn = document.getElementById('submit-review');
        if(submitBtn) submitBtn.textContent = t.submit_review;

        // payment modal
        const payTitle = document.querySelector('#payment-modal .modal-header h3');
        if(payTitle) payTitle.textContent = t.payment_title;
        const paySub = document.querySelector('#payment-modal .modal-header p');
        if(paySub) paySub.textContent = t.payment_sub;

        // buy buttons
        document.querySelectorAll('.wa-link').forEach(b=>{ b.innerHTML = '<i class="fab fa-whatsapp"></i> '+t.buy_whatsapp; });
        document.querySelectorAll('.gallery-buy-btn').forEach(b=>{ b.innerHTML = '<i class="fab fa-whatsapp"></i> '+t.buy_now; });

        // set html lang
        try{ document.documentElement.lang = lang; }catch(e){}

        // Generic data-i18n attribute handler: set text for any element that has data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = t[key];
            if(value !== undefined) {
                setText(el, value);
            }
        });
    }

    // initialize
    const langSelects = document.querySelectorAll('#lang-select');
    const saved = localStorage.getItem('asad_lang') || (document.documentElement.lang || 'so');
    langSelects.forEach(s=> s.value = saved);
    applyLanguage(saved);

    langSelects.forEach(s=> s.addEventListener('change', function(){
        const v = this.value;
        localStorage.setItem('asad_lang', v);
        applyLanguage(v);
    }));
})();
