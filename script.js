
import { appState, ui } from './modules/state.js';
import { updateAddressSummary } from './modules/mapHelpers.js';
import { computeCartSummary } from './modules/cartHelpers.js';
import { ugandaRegionalOffers, ugandaRegionalCustomers, ugandaRegionalRiders, ugandaRegionalMerchants, ugandaRegionalTransactions } from './modules/ugandaDemoData.js';

// --- Shared app state ---

let map = appState.map;
let marker = appState.marker;
let cart = appState.cart;
let suggestedScrollInterval = appState.suggestedScrollInterval;
let favorites = appState.favorites;
let isCheckoutAccordionOpen = appState.isCheckoutAccordionOpen;
let allergyNotes = appState.allergyNotes;
let recipientDetails = appState.recipientDetails;
let userPhoneNumber = appState.userPhoneNumber;
let selectedPaymentMethod = appState.selectedPaymentMethod;
let tipPercentage = appState.tipPercentage;
let dailySalesChartInstance = appState.dailySalesChartInstance;
let topItemsChartInstance = appState.topItemsChartInstance;
let orderStatusChartInstance;
let menuAvailabilityChartInstance;

function hideMap(){ const m=ui.get('map'); if(m) m.style.display='none'; }
function showMap(){ const m=ui.get('map'); if(m) m.style.display='block'; }
function updateAddAddressBtn(){
  const btn = document.getElementById('addAddressBtn');
  if(!btn) return;
  const newHome = document.getElementById('newHomeScreen');
  const cat = document.getElementById('categoryScreen');
  if((newHome && newHome.classList.contains('active')) ||
     (cat && cat.classList.contains('active'))){
    btn.style.display='none';
  } else {
    btn.style.display='block';
  }
}

// --- App startup and navigation ---
function openRoleScreenFromHash() {
  const hash = (window.location.hash || '').replace('#', '').trim().toLowerCase();
  const roleScreens = {
    user: () => {
      const splash = document.getElementById('splash');
      const home = document.getElementById('home');
      if (splash) splash.style.display = 'none';
      if (home) home.style.display = 'block';
    },
    rider: openRider,
    admin: openAdmin,
    merchant: openShopPortal
  };

  if (!roleScreens[hash]) return false;

  const splash = document.getElementById('splash');
  const home = document.getElementById('home');

    if (splash) {
        splash.style.display = 'flex';
        splash.style.opacity = '1';
    }
  if (home) home.style.display = 'none';

    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }
        roleScreens[hash]();
    }, 1800);
  return true;
}

/* Splash */
document.addEventListener('DOMContentLoaded',()=>{
  if (openRoleScreenFromHash()) return;

  setTimeout(()=>{
    document.getElementById('splash').style.opacity=0;
    setTimeout(()=>{
      document.getElementById('splash').style.display='none';
      document.getElementById('home').style.display='block';
    },500);
  },3000);
});

/* Open Map */
document.getElementById('openMapBtn').addEventListener('click',()=>{
  document.getElementById('home').style.display='none';
  document.getElementById('mapScreen').style.display='block';
  setTimeout(()=> document.getElementById('bottomCard').classList.add('show'),200);

  if(!map){
    map=L.map('map').setView([24.4539,54.3773],13);
    const deliveryPinIcon = L.divIcon({
        html: '📍',
        className: 'delivery-pin-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    // Open, no-key map layers for a professional delivery app.
        const streetTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; OpenStreetMap contributors &copy; Esri',
            maxZoom: 19
    });
    const cycleTiles = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CyclOSM',
      subdomains: 'abc',
      maxZoom: 20
    });
    const satelliteTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    });
    const baseLayers = {
      'Street Map': streetTiles,
      'Cycle Map': cycleTiles,
      'Satellite': satelliteTiles
    };
    L.control.layers(baseLayers, null, { position: 'bottomright' }).addTo(map);
    streetTiles.addTo(map);
    marker=L.marker([24.4539,54.3773],{draggable:true, icon: deliveryPinIcon}).addTo(map);
    marker.on('dragend', ()=>{
      reverseGeocode(marker.getLatLng());
      showSearchCard();
    });
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng);
      showSearchCard();
    });
  }
  setTimeout(()=>map.invalidateSize(),300);
});

/* Reverse geocoding */
function reverseGeocode(latlng){
  // Reverse geocoding with English language preference and structured address
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=en&language=en`)
    .then(res=>res.json())
    .then(data=>{
      if(data && data.display_name){
        // Extract clean English address without Arabic characters
        let address = data.display_name;
        // Ensure we're using the English version
        if(data.address){
          // Build address from components for better English formatting
          const addr_parts = [];
          if(data.address.road) addr_parts.push(data.address.road);
          if(data.address.village) addr_parts.push(data.address.village);
          if(data.address.city) addr_parts.push(data.address.city);
          if(data.address.state) addr_parts.push(data.address.state);
          if(data.address.country) addr_parts.push(data.address.country);
          if(addr_parts.length > 0) address = addr_parts.join(', ');
        }
        document.getElementById('selectedAddress').textContent = address;
        updateSelectedAddressCard();
      }
    });
}

function updateSelectedAddressCard(){
  const addrText = document.getElementById('selectedAddress')?.textContent || '';
  document.getElementById('selectedAddressText').textContent = addrText && addrText !== 'Select a location on the map'
    ? addrText
    : 'Set delivery address';

  updateAddressSummary();
}

// Consolidated back navigation logic
function navigateBack() {
    const homeScreen = document.getElementById('home');
    const mapScreen = document.getElementById('mapScreen');
    const newHomeScreen = document.getElementById('newHomeScreen');
    const categoryScreen = document.getElementById('categoryScreen');
    const restaurantScreen = document.getElementById('restaurantScreen');
    const contentSearchScreen = document.getElementById('contentSearchScreen');
    const searchCard = document.getElementById('searchCard');

    // From Content Search, go back to New Home Screen
    if (contentSearchScreen && contentSearchScreen.classList.contains('active')) {
        contentSearchScreen.classList.remove('active');
        return;
    }

    // From Restaurant screen, go back to Category screen
    if (restaurantScreen.classList.contains('active')) {
        restaurantScreen.classList.remove('active');
        return;
    }

    // From Category screen, go back to New Home screen
    if (categoryScreen.classList.contains('active')) {
        categoryScreen.classList.remove('active');
        updateAddAddressBtn();
        return;
    }

    // From New Home screen, go back to Map screen
    if (newHomeScreen.classList.contains('active')) {
        // Wait for the screen transition to fully complete before redrawing the map.
        // This is more reliable than a fixed setTimeout.
        newHomeScreen.addEventListener('transitionend', function onTransitionEnd(e) {
            // Ensure we only act when the main 'bottom' transition is complete
            if (e.target === newHomeScreen && e.propertyName === 'bottom' && map) {
                map.invalidateSize();
            }
        }, { once: true }); // The listener will automatically remove itself after firing once.

        newHomeScreen.classList.remove('active');
        mapScreen.style.display = 'block';
        showMap();
        homeScreen.style.display = 'none';
        document.getElementById('bottomCard').classList.add('show');
        searchCard.classList.remove('show');
        searchCard.classList.remove('expanded');
        updateAddAddressBtn();
        document.getElementById('backBtn').style.opacity = '1';
        document.getElementById('currentLocationBtn').style.opacity = '1';
        document.querySelector('.leaflet-control-zoom').style.opacity = '1';
        return;
    }

    // From Map screen, go back to Home screen
    if (mapScreen.style.display === 'block') {
        mapScreen.style.display = 'none';
        homeScreen.style.display = 'block';
        document.getElementById('bottomCard').classList.remove('show');
        searchCard.classList.remove('show');
        searchCard.classList.remove('expanded');
        return;
    }
}

/* Search Error on Home */
document.querySelector('#home nav .nav-item:nth-child(2)').addEventListener('click', () => {
  showSearchErrorState();
});

function showSearchErrorState() {
  document.getElementById('home').style.display = 'none';
  document.getElementById('mapScreen').style.display = 'block';
  hideMap();
  document.getElementById('bottomCard').classList.remove('show');

  // Hide floating buttons on map screen since we are in error state
  document.getElementById('backBtn').style.display = 'none';
  document.getElementById('currentLocationBtn').style.display = 'none';

  const searchCard = document.getElementById('searchCard');
  document.getElementById('searchNormalContent').style.display = 'none';
  document.getElementById('searchErrorContent').classList.add('active');

  searchCard.classList.add('show');
  searchCard.classList.add('expanded');
  
  // Back button in error state
  document.getElementById('errorBackBtn').onclick = function() {
    searchCard.classList.remove('show');
    searchCard.classList.remove('expanded');
    document.getElementById('mapScreen').style.display = 'none';
    document.getElementById('home').style.display = 'block';
    
    // Restore buttons for normal map usage
    document.getElementById('backBtn').style.display = 'flex';
    document.getElementById('currentLocationBtn').style.display = 'flex';

    setTimeout(() => {
        document.getElementById('searchNormalContent').style.display = 'flex';
        document.getElementById('searchErrorContent').classList.remove('active');
    }, 400);
  };
}

/* Show search card */
function showSearchCard(){
  document.getElementById('searchNormalContent').style.display = 'flex';
  document.getElementById('searchErrorContent').classList.remove('active');
  const searchCard = document.getElementById('searchCard');
  const bottomCard = document.getElementById('bottomCard');
  searchCard.classList.add('show');
  bottomCard.classList.remove('show');
  updateAddAddressBtn();
}

function closeSearchUI() {
    const searchCard = document.getElementById('searchCard');
    const bottomCard = document.getElementById('bottomCard');

    if (!searchCard.classList.contains('show')) return;

    const handleTransitionEnd = (e) => {
        // Ensure we only act when the main 'bottom' transition is complete
        if (e.target === searchCard && e.propertyName === 'bottom') {
            if (map) map.invalidateSize();
            bottomCard.classList.add('show');
            updateAddAddressBtn();
            searchCard.removeEventListener('transitionend', handleTransitionEnd);
        }
    };
    searchCard.addEventListener('transitionend', handleTransitionEnd);

    showMap(); // Show map immediately behind the closing card
    searchCard.classList.remove('expanded');
    searchCard.classList.remove('show');

    document.getElementById('backBtn').style.opacity = '1';
    document.getElementById('currentLocationBtn').style.opacity = '1';
    document.querySelector('.leaflet-control-zoom').style.opacity = '1';
}

/* Expand search card when input focused */
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('focus',()=>{
  const searchCard = document.getElementById('searchCard');
  searchCard.classList.add('expanded');
  document.getElementById('backBtn').style.opacity='0';
  document.getElementById('currentLocationBtn').style.opacity='0';
  document.querySelector('.leaflet-control-zoom').style.opacity='0';
});

/* Collapse search card */
document.getElementById('closeSearch').addEventListener('click', closeSearchUI);

/* Current Location */
document.getElementById('currentLocationBtn').addEventListener('click',()=>{
  const locationBtn = document.getElementById('currentLocationBtn');
  locationBtn.classList.add('locating');

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat=pos.coords.latitude, lng=pos.coords.longitude;
      marker.setLatLng([lat,lng]);
      reverseGeocode({lat,lng});
      map.setView([lat,lng],15);
      locationBtn.classList.remove('locating');
    },()=>{
      locationBtn.classList.remove('locating');
      alert("Unable to access your location.");
    });
  } else {
    locationBtn.classList.remove('locating');
    alert("Geolocation not supported.");
  }
});

/* Back button */
document.getElementById('backBtn').addEventListener('click', navigateBack);

/* Show address on newHomeScreen when returning from map */
document.getElementById('addAddressBtn').addEventListener('click',()=>{
  const newScreen = document.getElementById('newHomeScreen');
  newScreen.classList.add('active');
  updateSelectedAddressCard();
  hideMap();
  updateAddAddressBtn();
});

/* Click on header to go to map if no address selected */
/* This is now handled by the click on selectedAddressCard itself. */

/* Back navigation from newHomeScreen */
document.getElementById('newHomeBackBtn').addEventListener('click', navigateBack);

/* Autocomplete */
const suggList = document.getElementById('autocompleteSuggestions');
searchInput.addEventListener('input',()=>{
  const value = searchInput.value.trim();
  if(!value){ suggList.innerHTML=''; return; }

  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&accept-language=en&language=en`)
    .then(res=>res.json())
    .then(data=>{
      suggList.innerHTML='';
      data.forEach(place=>{
        const li=document.createElement('li');
        li.textContent=place.display_name;
        li.addEventListener('click',()=>{
          searchInput.value=place.display_name;
          suggList.innerHTML='';
          const lat=parseFloat(place.lat), lng=parseFloat(place.lon);
          marker.setLatLng([lat,lng]);
          map.setView([lat,lng],15);
          document.getElementById('selectedAddress').textContent = place.display_name;
          document.getElementById('selectedAddressText').textContent = place.display_name;
          updateSelectedAddressCard();
          closeSearchUI();
        });
        suggList.appendChild(li);
      });
    });
});

// Draggable grid items inside newHomeScreen
const draggables = document.querySelectorAll('#newHomeScreen .grid-item');
const newHomeScreen = document.getElementById('newHomeScreen');

newHomeScreen.addEventListener('dragover', (event) => {
  event.preventDefault();
});

newHomeScreen.addEventListener('drop', (event) => {
  event.preventDefault();
  const tileId = event.dataTransfer.getData('text/plain');
  const tile = document.getElementById(tileId);
  if (tile) {
    tile.classList.remove('dragging');
    tile.style.transform = '';
  }
});

draggables.forEach((tile, index)=>{
  tile.setAttribute('draggable','true');
  tile.setAttribute('id', `grid-item-${index}`);
  const initial = {x:0,y:0};

  tile.addEventListener('dragstart', (event)=>{
    tile.classList.add('dragging');
    initial.x = tile.offsetLeft;
    initial.y = tile.offsetTop;
    event.dataTransfer.setData('text/plain', tile.id);
    event.dataTransfer.effectAllowed = 'move';
  });

  tile.addEventListener('dragend', ()=>{
    tile.classList.remove('dragging');
    tile.style.transform = `translate(0, 0)`;
  });
});

function openContentSearch() {
    const screen = document.getElementById('contentSearchScreen');
    screen.classList.add('active');
    
    // Populate if empty
    const grid = document.getElementById('searchCategoriesGrid');
    if(grid.innerHTML.trim() === '') {
        grid.innerHTML = document.querySelector('#newHomeScreen .top-grid').innerHTML;
        document.getElementById('searchShopsScroll').innerHTML = document.querySelector('#newHomeScreen .shop-scroll').innerHTML;
        
        // Add listeners to cloned items
        grid.querySelectorAll('.grid-item').forEach(item => {
            item.addEventListener('click', () => showDetailScreen(item.querySelector('.grid-label').textContent));
        });
        document.getElementById('searchShopsScroll').querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', () => showDetailScreen(`Shop: ${item.textContent}`));
        });
        
        populateSearchAllItems();
    }
}

function populateSearchAllItems() {
    const container = document.getElementById('searchAllItemsContainer');
    if(!container || container.innerHTML.trim() !== '') return;

    const categories = [
        {
            title: "Trending Dishes 🔥",
            items: [
                { name: "Double Cheese Burger", price: 25.00, emoji: "🍔", res: "Burger King" },
                { name: "Pepperoni Pizza", price: 45.00, emoji: "🍕", res: "Pizza Hut" },
                { name: "Spicy Chicken Wings", price: 30.00, emoji: "🍗", res: "KFC" }
            ]
        },
        {
            title: "Healthy Options 🥗",
            items: [
                { name: "Caesar Salad", price: 22.00, emoji: "🥗", res: "Healthy Bites" },
                { name: "Grilled Chicken", price: 35.00, emoji: "🍖", res: "Grill House" },
                { name: "Fresh Fruit Bowl", price: 15.00, emoji: "🍇", res: "Fresh & Co" }
            ]
        },
        {
            title: "Sweet Cravings 🍩",
            items: [
                { name: "Choco Glazed Donut", price: 8.00, emoji: "🍩", res: "Dunkin" },
                { name: "Strawberry Cheesecake", price: 18.00, emoji: "🍰", res: "Bakery One" },
                { name: "Vanilla Ice Cream", price: 10.00, emoji: "🍦", res: "Cold Stone" }
            ]
        }
    ];

    categories.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'search-category-section';
        section.innerHTML = `<div class="search-cat-title">${cat.title}</div>`;
        const scroll = document.createElement('div');
        scroll.className = 'search-item-scroll';
        cat.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'search-item-card';
            card.innerHTML = `<div class="search-item-img">${item.emoji}</div><div class="search-item-details"><div class="search-item-name">${item.name}</div><div class="search-item-res">${item.res}</div><div class="search-item-row"><div class="search-item-price">${item.price.toFixed(2)}</div><div class="search-add-btn">+</div></div></div>`;
            card.querySelector('.search-add-btn').addEventListener('click', (e) => { e.stopPropagation(); cart.push({ title: item.name, basePrice: item.price, quantity: 1, addons: [], image: item.emoji }); showToast(`${item.name} added!`); updateCartView(); });
            scroll.appendChild(card);
        });
        section.appendChild(scroll);
        container.appendChild(section);
    });
    initAutoScroll();
}

// Back button for Content Search Screen
const csBackBtn = document.getElementById('csBackBtn');
if(csBackBtn) {
    csBackBtn.addEventListener('click', () => {
        document.getElementById('contentSearchScreen').classList.remove('active');
    });
}

// --- Catalog and discovery screens ---
/* Category Screen Logic */
const categoryScreen = document.getElementById('categoryScreen');
const catTitle = document.getElementById('catTitle');
const catBackBtn = document.getElementById('catBackBtn');

/* Category Configuration */
const categoryConfig = {
  "Food": {
    filters: [
      {icon: "🏷️", name: "Promotions"}, {icon: "🍟", name: "Fast Food"}, {icon: "🍗", name: "Chicken"},
      {icon: "🍔", name: "Burgers"}, {icon: "🥩", name: "Halal"}, {icon: "🍕", name: "Pizza"},
      {icon: "🥘", name: "Local"}, {icon: "🍰", name: "Desserts"}
    ],
    brands: [
      {icon: "🍔", name: "McDonald's"}, {icon: "🍗", name: "KFC"}, {icon: "🍕", name: "Pizza Hut"},
      {icon: "☕", name: "Starbucks"}, {icon: "🥪", name: "Subway"}
    ],
    items: [
      {name: "Tasty Restaurant", image: "🍽️", rating: "4.8", time: "20-30 Mins", delivery: "Free"},
      {name: "Burger King", image: "🍔", rating: "4.5", time: "25-35 Mins", delivery: "500"},
      {name: "Pizza Hut", image: "🍕", rating: "4.7", time: "30-40 Mins", delivery: "Free"},
      {name: "KFC", image: "🍗", rating: "4.6", time: "20-30 Mins", delivery: "Free"}
    ],
    menu: [
      {
        name: "Promotions",
        items: [
          { title: "Family Feast", desc: "2 Large Pizzas, Garlic Bread & Coke", price: "85.00", oldPrice: "120.00", image: "🍕" },
          { title: "Mega Burger Box", desc: "2 Burgers, Fries & Nuggets", price: "45.00", oldPrice: "60.00", image: "🍔" }
        ]
      },
      {
        name: "Best Sellers",
        items: [
          { title: "Crispy Chicken", desc: "3pcs Fried Chicken with Coleslaw", price: "25.00", image: "🍗" },
          { title: "Cheese Burger", desc: "Beef patty, Cheddar, Lettuce", price: "18.00", image: "🍔" },
          { title: "Pepperoni Pizza", desc: "Mozzarella & Beef Pepperoni", price: "40.00", image: "🍕" }
        ]
      },
      {
        name: "Drinks",
        items: [
          { title: "Cola", desc: "Regular Ice Cold", price: "5.00", image: "🥤" },
          { title: "Orange Juice", desc: "Freshly squeezed", price: "12.00", image: "🍊" }
        ]
      }
    ]
  },
  "Groceries": {
    filters: [
      {icon: "🥬", name: "Vegetables"}, {icon: "🍎", name: "Fruits"}, {icon: "🥛", name: "Dairy"},
      {icon: "🥩", name: "Meat"}, {icon: "🥖", name: "Bakery"}, {icon: "🥫", name: "Pantry"}
    ],
    brands: [
      {icon: "🛒", name: "Carrefour"}, {icon: "🛍️", name: "Lulu"}, {icon: "🏪", name: "Spinneys"},
      {icon: "🍏", name: "Viva"}, {icon: "🧺", name: "Choithrams"}
    ],
    items: [
      {name: "Carrefour City", image: "🛒", rating: "4.8", time: "30-60 Mins", delivery: "1500"},
      {name: "Lulu Hypermarket", image: "🛍️", rating: "4.7", time: "45-90 Mins", delivery: "2000"},
      {name: "Spinneys", image: "🏪", rating: "4.9", time: "30-60 Mins", delivery: "Free"},
      {name: "Local Grocery", image: "🧺", rating: "4.5", time: "15-30 Mins", delivery: "Free"}
    ],
    menu: [
      {
        name: "Fresh Produce",
        items: [
          { title: "Bananas (1kg)", desc: "Fresh Ecuador Bananas", price: "6.00", image: "🍌" },
          { title: "Red Apples (1kg)", desc: "Sweet Royal Gala Apples", price: "8.50", image: "🍎" },
          { title: "Tomatoes (1kg)", desc: "Local Fresh Tomatoes", price: "4.00", image: "🍅" }
        ]
      },
      {
        name: "Dairy & Eggs",
        items: [
          { title: "Fresh Milk (1L)", desc: "Full Cream Milk", price: "6.50", image: "🥛" },
          { title: "Eggs (30pcs)", desc: "Large White Eggs", price: "22.00", image: "🥚" },
          { title: "Cheddar Cheese", desc: "Block 200g", price: "15.00", image: "🧀" }
        ]
      },
      {
        name: "Bakery",
        items: [
          { title: "Sliced Bread", desc: "White Toast Bread", price: "5.00", image: "🍞" },
          { title: "Croissants (4pcs)", desc: "Butter Croissants", price: "12.00", image: "🥐" }
        ]
      }
    ]
  },
  "Shops": {
    filters: [
      {icon: "👗", name: "Clothes"}, {icon: "👠", name: "Shoes"}, {icon: "📱", name: "Electronics"},
      {icon: "💄", name: "Beauty"}, {icon: "🎁", name: "Gifts"}, {icon: "⚽", name: "Sports"}
    ],
    brands: [
      {icon: "🏬", name: "H&M"}, {icon: "👟", name: "Nike"}, {icon: "💄", name: "Sephora"},
      {icon: "📱", name: "Sharaf DG"}, {icon: "🧸", name: "Toys R Us"}
    ],
    items: [
      {name: "Zara", image: "👗", rating: "4.8", time: "60-90 Mins", delivery: "5000"},
      {name: "Sharaf DG", image: "📱", rating: "4.7", time: "60-120 Mins", delivery: "Free"},
      {name: "Sephora", image: "💄", rating: "4.9", time: "45-60 Mins", delivery: "2500"},
      {name: "Virgin Megastore", image: "💿", rating: "4.8", time: "60-90 Mins", delivery: "3000"}
    ],
    menu: [
      {
        name: "Clothing",
        items: [
          { title: "Cotton T-Shirt", desc: "100% Cotton Basic Tee", price: "45.00", image: "👕" },
          { title: "Denim Jeans", desc: "Slim Fit Blue Jeans", price: "120.00", image: "👖" },
          { title: "Running Shoes", desc: "Sports Sneakers", price: "250.00", image: "👟" }
        ]
      },
      {
        name: "Electronics",
        items: [
          { title: "Wireless Earbuds", desc: "Bluetooth 5.0 with Case", price: "150.00", image: "🎧" },
          { title: "USB-C Cable", desc: "Fast Charging 1m", price: "35.00", image: "🔌" }
        ]
      }
    ]
  },
  "Pharmacies": {
    filters: [
      {icon: "💊", name: "Medicine"}, {icon: "🧴", name: "Skincare"}, {icon: "🩹", name: "First Aid"},
      {icon: "💪", name: "Vitamins"}, {icon: "👶", name: "Baby Care"}, {icon: "🧼", name: "Hygiene"}
    ],
    brands: [
      {icon: "⚕️", name: "Life Pharmacy"}, {icon: "🏥", name: "Aster"}, {icon: "💊", name: "Boots"},
      {icon: "🩺", name: "Supercare"}, {icon: "🌿", name: "Bin Sina"}
    ],
    items: [
      {name: "Life Pharmacy", image: "⚕️", rating: "4.9", time: "30-45 Mins", delivery: "Free"},
      {name: "Aster Pharmacy", image: "🏥", rating: "4.8", time: "30-45 Mins", delivery: "Free"},
      {name: "Boots", image: "💊", rating: "4.7", time: "45-60 Mins", delivery: "1000"},
      {name: "Supercare", image: "🩺", rating: "4.6", time: "20-40 Mins", delivery: "500"}
    ],
    menu: [
      {
        name: "Medicines",
        items: [
          { title: "Panadol Extra", desc: "Pain Relief 24 Tablets", price: "12.00", image: "💊" },
          { title: "Vitamin C", desc: "Effervescent 20 Tabs", price: "25.00", image: "🍊" },
          { title: "Cough Syrup", desc: "Herbal Relief 100ml", price: "18.00", image: "🥄" }
        ]
      },
      {
        name: "Personal Care",
        items: [
          { title: "Face Mask", desc: "Surgical Masks 50pcs", price: "15.00", image: "😷" },
          { title: "Hand Sanitizer", desc: "Gel 500ml", price: "20.00", image: "🧴" }
        ]
      }
    ]
  },
  "Packages": {
    filters: [
      {icon: "📦", name: "Send"}, {icon: "📬", name: "Receive"}, {icon: "🏙️", name: "Local"},
      {icon: "✈️", name: "International"}, {icon: "🚚", name: "Moving"}
    ],
    brands: [
      {icon: "🟨", name: "DHL"}, {icon: "🟧", name: "FedEx"}, {icon: "🟥", name: "Aramex"},
      {icon: "🟦", name: "UPS"}, {icon: "🛵", name: "Careem Box"}
    ],
    items: [
      {name: "DHL Express", image: "🟨", rating: "4.9", time: "Pickup: 15m", delivery: "Var"},
      {name: "Local Courier", image: "🛵", rating: "4.5", time: "Pickup: 10m", delivery: "5000"},
      {name: "Aramex", image: "🟥", rating: "4.7", time: "Pickup: 20m", delivery: "Var"},
      {name: "Fetchr", image: "📦", rating: "4.4", time: "Pickup: 30m", delivery: "3000"}
    ],
    menu: [
      {
        name: "Delivery Services",
        items: [
          { title: "Standard Delivery", desc: "Within City (Same Day)", price: "15.00", image: "🛵" },
          { title: "Express Delivery", desc: "Within City (2 Hours)", price: "30.00", image: "🚀" },
          { title: "Document Service", desc: "Secure document handling", price: "20.00", image: "📄" }
        ]
      }
    ]
  },
  "Drinks": {
    filters: [
      {icon: "💧", name: "Water"}, {icon: "🥤", name: "Juices"}, {icon: "☕", name: "Coffee"},
      {icon: "🍵", name: "Tea"}, {icon: "🥛", name: "Milkshakes"}, {icon: "🧉", name: "Smoothies"}
    ],
    brands: [
      {icon: "🧜‍♀️", name: "Starbucks"}, {icon: "☕", name: "Costa"}, {icon: "🍩", name: "Tim Hortons"},
      {icon: "🥤", name: "Juice Time"}, {icon: "💧", name: "Mai Dubai"}
    ],
    items: [
      {name: "Starbucks", image: "☕", rating: "4.8", time: "20-30 Mins", delivery: "Free"},
      {name: "Mai Dubai Water", image: "💧", rating: "4.9", time: "60-120 Mins", delivery: "Free"},
      {name: "Juice World", image: "🥤", rating: "4.6", time: "25-35 Mins", delivery: "1500"},
      {name: "Tea Corner", image: "🍵", rating: "4.5", time: "15-25 Mins", delivery: "500"}
    ],
    menu: [
      {
        name: "Coffee & Tea",
        items: [
          { title: "Iced Latte", desc: "Espresso with milk & ice", price: "18.00", image: "🥤" },
          { title: "Hot Cappuccino", desc: "Frothy milk coffee", price: "16.00", image: "☕" },
          { title: "Green Tea", desc: "Hot brewed tea", price: "10.00", image: "🍵" }
        ]
      },
      {
        name: "Cold Drinks",
        items: [
          { title: "Fresh Orange Juice", desc: "No sugar added", price: "20.00", image: "🍊" },
          { title: "Mineral Water", desc: "6 x 1.5L Case", price: "12.00", image: "💧" },
          { title: "Mango Smoothie", desc: "Thick & Sweet", price: "22.00", image: "🥭" }
        ]
      }
    ]
  }
};

function renderCategoryContent(category) {
  const config = categoryConfig[category] || categoryConfig["Food"]; 
  // Store current category for use in opening restaurants
  window.currentCategoryConfig = config;

  // Render Filters
  const filterScroll = document.querySelector('.filter-scroll');
  if(filterScroll) {
    filterScroll.innerHTML = '';
    config.filters.forEach(f => {
      const item = document.createElement('div');
      item.className = 'filter-item';
      item.innerHTML = `<div class="filter-box">${f.icon}</div><div class="filter-name">${f.name}</div>`;
      item.addEventListener('click', () => showDetailScreen(f.name)); 
      filterScroll.appendChild(item);
    });
  }

  // Render Brands
  const brandsScroll = document.getElementById('brandsScroll');
  if(brandsScroll) {
    brandsScroll.innerHTML = '';
    config.brands.forEach(b => {
      const container = document.createElement('div');
      container.className = 'brand-container';
      container.innerHTML = `
          <div class="brand-item">
            <div class="brand-image"><span>${b.icon}</span></div>
          </div>
          <div class="brand-name">${b.name}</div>
          <div class="brand-delivery-info"><span class="bike-icon">🚴‍♂️</span><span>Free delivery</span></div>
      `;
      container.addEventListener('click', () => openRestaurant(b.name, config.menu));
      brandsScroll.appendChild(container);
    });
  }

  // Render Restaurants / Items
  const generateCardHTML = (item) => `
      <div class="res-image">
        ${item.image}
        <button class="heart-btn">♡</button>
      </div>
      <div class="res-name">${item.name}</div>
      <div class="pref-info">
        <span class="pref-stat"><span>👍</span>(${item.rating})</span>
        <span class="pref-stat"><span style="display:inline-block; transform:scaleX(-1);">🚴‍♂️</span>${item.delivery}</span>
        <span class="pref-stat">${item.time}</span>
      </div>
  `;

  const restaurantList = document.getElementById('restaurantList');
  if(restaurantList) {
    restaurantList.innerHTML = '';
    for(let i=0; i<10; i++) {
        const item = config.items[i % config.items.length];
        const card = document.createElement('div');
        card.className = 'res-card animate-entry';
        card.style.animationDelay = `${i * 0.05}s`;
        card.innerHTML = generateCardHTML({...item, name: item.name + " " + (i+1)});
        
        card.querySelector('.heart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(card.querySelector('.res-name').textContent, e.target);
        });
        card.addEventListener('click', (e) => {
             if(e.target.classList.contains('heart-btn')) return;
             openRestaurant(card.querySelector('.res-name').textContent);
        });
        restaurantList.appendChild(card);
    }
  }

  // Render "For You" Section
  const prefScroll = document.getElementById('prefScroll');
  if(prefScroll) {
    prefScroll.innerHTML = '';
    for(let i=0; i<5; i++) {
        const item = config.items[i % config.items.length];
        const card = document.createElement('div');
        card.className = 'pref-card';
        card.innerHTML = generateCardHTML({...item, name: item.name + (i>0 ? " " + (i+1) : "")}); 
        
        card.addEventListener('click', (e) => {
             if(e.target.classList.contains('heart-btn')) return;
             openRestaurant(card.querySelector('.res-name').textContent, config.menu);
        });
        prefScroll.appendChild(card);
    }
    // Re-init pagination dots
    const prefPagination = document.getElementById('prefPagination');
    if(prefPagination) {
        prefPagination.innerHTML = '';
        for(let i=0; i<5; i++) {
            const dot = document.createElement('div');
            dot.className = 'pref-dot';
            if(i===0) dot.classList.add('active');
            prefPagination.appendChild(dot);
        }
    }
    // Re-bind intersection observer if necessary, but simplicity suggests CSS scroll snap works mostly.
    // We'll re-add a simple observer logic here
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const index = Array.from(prefScroll.children).indexOf(entry.target);
          Array.from(prefScroll.children).forEach(c => c.classList.remove('in-focus'));
          entry.target.classList.add('in-focus');
          const dots = document.getElementById('prefPagination').querySelectorAll('.pref-dot');
          dots.forEach(d => d.classList.remove('active'));
          if(dots[index]) dots[index].classList.add('active');
        }
      });
    }, { root: prefScroll, threshold: 0.6 });
    Array.from(prefScroll.children).forEach(card => observer.observe(card));
  }
  
  // Re-init auto scroll if applicable
  initAutoScroll();
}

function showDetailScreen(title) {
  // Update content
  catTitle.textContent = title;
  
  // Render dynamic content
  renderCategoryContent(title);

  // Update address in category screen
  const addrText = document.getElementById('selectedAddressText').textContent;
  document.getElementById('catAddressText').textContent = addrText;

  // Hide map and add button
  hideMap();
  updateAddAddressBtn();

  // Add 'active' class to show the screen
  categoryScreen.classList.add('active');
}

document.querySelectorAll('.grid-item').forEach(item => {
  item.addEventListener('click', (e) => {
    const label = item.querySelector('.grid-label').textContent;
    showDetailScreen(label);
  });
});

document.querySelectorAll('.shop-item').forEach(item => {
  item.addEventListener('click', (e) => {
    const emoji = item.textContent;
    showDetailScreen(`Shop: ${emoji}`);
  });
});

// Category Filter Bubbles
document.querySelectorAll('.filter-item').forEach(item => {
  item.addEventListener('click', () => {
    const name = item.querySelector('.filter-name').textContent;
    showDetailScreen(name);
  });
});

// Text Filters
document.querySelectorAll('.text-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showDetailScreen(btn.textContent.trim());
  });
});

// Popular Brands
document.querySelectorAll('.brand-container').forEach(container => {
  container.addEventListener('click', () => {
    const name = container.querySelector('.brand-name').textContent;
    openRestaurant(name);
  });
});

/* Visual feedback for centered shop item */
const shopScrollContainer = document.getElementById('shopScroll');
if (shopScrollContainer) {
    const shopItems = shopScrollContainer.querySelectorAll('.shop-item');
    let scrollTimeout;

    const findCenteredItem = () => {
        const containerRect = shopScrollContainer.getBoundingClientRect();
        if (containerRect.width === 0) return; // Do nothing if not visible

        const containerCenter = containerRect.left + containerRect.width / 2;

        let closestItem = null;
        let minDistance = Infinity;

        shopItems.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(containerCenter - itemCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestItem = item;
            }
        });

        if (closestItem) {
            shopItems.forEach(item => item.classList.remove('is-active'));
            closestItem.classList.add('is-active');
        }
    };

    shopScrollContainer.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(findCenteredItem, 100);
    });

    // Use MutationObserver to detect when the screen becomes visible and set initial active item
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                setTimeout(findCenteredItem, 50); // Delay to ensure layout is ready
            }
        });
    });
    observer.observe(document.getElementById('newHomeScreen'), { attributes: true });
}

catBackBtn.addEventListener('click', navigateBack);

/* Restaurant Screen Logic */
const restaurantScreen = document.getElementById('restaurantScreen');
const resBackBtn = document.getElementById('resBackBtn');
const resCloseBtn = document.getElementById('resCloseBtn');
const resShareBtn = document.getElementById('resShareBtn');

function openRestaurant(name, menuData) {
  document.getElementById('resScreenName').textContent = name;
  
  // Default to Food menu if no menuData provided
  const menu = menuData || categoryConfig["Food"].menu;
  
  // Render Menu Nav and Content
  const navContainer = document.getElementById('resMenuNav');
  const contentContainer = document.getElementById('resMenuContent');
  
  navContainer.innerHTML = '';
  contentContainer.innerHTML = '';
  
  menu.forEach((category, index) => {
      // Nav Item
      const navItem = document.createElement('div');
      navItem.className = `res-menu-item ${index === 0 ? 'active' : ''}`;
      navItem.textContent = category.name;
      navContainer.appendChild(navItem);
      
      // Content Category Title
      const catTitle = document.createElement('div');
      catTitle.className = 'res-category-title';
      catTitle.textContent = category.name;
      contentContainer.appendChild(catTitle);
      
      // Content Items
      category.items.forEach(item => {
          const itemCard = document.createElement('div');
          itemCard.className = 'res-item-card';
          itemCard.innerHTML = `
            <div class="res-item-info">
                <div class="res-item-title">${item.title}</div>
                <div class="res-item-desc">${item.desc}</div>
                <div class="res-item-price-row">
                    ${item.oldPrice ? `<span class="res-item-old-price">${item.oldPrice}</span>` : ''}
                    <span class="res-item-current-price">${item.price}</span>
                </div>
            </div>
            <div class="res-item-img-box">
                ${item.image}
                <div class="res-item-add-btn"><span class="initial-plus">+</span><div class="quantity-selector"><span class="quantity-btn minus">-</span><span class="quantity-value">1</span><span class="quantity-btn plus">+</span></div></div>
            </div>
          `;
          contentContainer.appendChild(itemCard);
      });
  });

  restaurantScreen.classList.add('active');
  // Reset scroll and parallax on open
  restaurantScreen.scrollTop = 0;
  const bg = restaurantScreen.querySelector('.res-cover-bg');
  if (bg) bg.style.transform = 'translateY(0px)';
  updateCartView();
}

// Parallax effect for restaurant header & Back to Top Logic
const resCoverBg = restaurantScreen.querySelector('.res-cover-bg');
const resBackToTopBtn = document.getElementById('resBackToTopBtn');
const resMenuNavSticky = document.getElementById('resMenuNav');

if (restaurantScreen && resCoverBg) {
    restaurantScreen.addEventListener('scroll', () => {
        const scrollTop = restaurantScreen.scrollTop;
        resCoverBg.style.transform = `translateY(${scrollTop * 0.5}px)`;
        
        if (resBackToTopBtn && resMenuNavSticky) {
            // Check if navbar is stuck (at top). getBoundingClientRect().top will be <= 0 (or close to 0 due to borders)
            const navRect = resMenuNavSticky.getBoundingClientRect();
            // Using 1px buffer
            if (navRect.top <= 1) resBackToTopBtn.classList.add('visible');
            else resBackToTopBtn.classList.remove('visible');
        }
    }, { passive: true }); // Use passive listener for scroll performance
}

if (resBackToTopBtn) { resBackToTopBtn.addEventListener('click', () => restaurantScreen.scrollTo({ top: 0, behavior: 'smooth' })); }

if (resBackBtn) {
  resBackBtn.addEventListener('click', () => {
    restaurantScreen.classList.remove('active');
  });
}

if (resCloseBtn) {
  resCloseBtn.addEventListener('click', () => {
    restaurantScreen.classList.remove('active');
  });
}

if (resShareBtn) {
  resShareBtn.addEventListener('click', () => {
    alert('Share functionality coming soon!');
  });
}

/* Populate Preferences */
// Pref logic moved to renderCategoryContent
const prefScroll = document.getElementById('prefScroll'); // Just reference

  // See All Button Logic
  const prefSeeAllBtn = document.getElementById('prefSeeAllBtn');
  if(prefSeeAllBtn){
    prefSeeAllBtn.addEventListener('click', () => {
      prefScroll.classList.toggle('expanded');
      prefPagination.classList.toggle('hidden');
      if(prefScroll.classList.contains('expanded')){
        prefSeeAllBtn.textContent = 'Show Less';
      } else {
        prefSeeAllBtn.textContent = 'See All';
        prefScroll.scrollTo({left: 0});
      }
    });
  }

  // See All Button Logic for Brands
  const brandsSeeAllBtn = document.getElementById('brandsSeeAllBtn');
  const brandsScrollForSeeAll = document.getElementById('brandsScroll');
  const brandsPaginationForSeeAll = document.getElementById('brandsPagination');
  if(brandsSeeAllBtn && brandsScrollForSeeAll && brandsPaginationForSeeAll){
    brandsSeeAllBtn.addEventListener('click', () => {
      brandsScrollForSeeAll.classList.toggle('expanded');
      brandsPaginationForSeeAll.classList.toggle('hidden');
      if(brandsScrollForSeeAll.classList.contains('expanded')){
        brandsSeeAllBtn.textContent = 'Show Less';
      } else {
        brandsSeeAllBtn.textContent = 'See All';
        brandsScrollForSeeAll.scrollTo({left: 0});
      }
    });
  }
  // Add click listener for pref items
  prefScroll.addEventListener('click', (e) => {
    const card = e.target.closest('.pref-card');
    if(card){
      const name = card.querySelector('.res-name').textContent;
      openRestaurant(name, window.currentCategoryConfig?.menu);
    }
  });

/* Initialize Popular Brands Carousel */
const brandsScroll = document.querySelector('.brands-scroll');
const brandsPagination = document.getElementById('brandsPagination');
if(brandsScroll && brandsPagination) {
  const brands = brandsScroll.querySelectorAll('.brand-container');
  
  // Create dots
  brands.forEach((brand, index) => {
    const dot = document.createElement('div');
    dot.className = 'brands-dot';
    if(index === 0) { dot.classList.add('active'); brand.classList.add('in-focus'); }
    brandsPagination.appendChild(dot);
  });

  // Center Tracking for Brands
  const updateActiveBrand = () => {
    const containerRect = brandsScroll.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestBrand = null;
    let minDistance = Infinity;
    let closestIndex = 0;

    brands.forEach((brand, index) => {
      const rect = brand.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(center - containerCenter);
      if(dist < minDistance) {
        minDistance = dist;
        closestBrand = brand;
        closestIndex = index;
      }
    });

    brands.forEach(b => b.classList.remove('in-focus'));
    if(closestBrand) closestBrand.classList.add('in-focus');
    
    const dots = brandsPagination.querySelectorAll('.brands-dot');
    dots.forEach(d => d.classList.remove('active'));
    if(dots[closestIndex]) dots[closestIndex].classList.add('active');
  };

  brandsScroll.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateActiveBrand);
  });
  
  // Init
  setTimeout(updateActiveBrand, 100);
}

/* Populate Vertical Restaurant List */
// Restaurant List population logic moved to renderCategoryContent
const restaurantList = document.getElementById('restaurantList');
if(restaurantList){
  restaurantList.classList.add('restaurant-list');
  restaurantList.addEventListener('click', function(e) {
    const heartBtn = e.target.closest('.heart-btn');
    if (heartBtn) {
      e.preventDefault(); e.stopPropagation();
      const card = heartBtn.closest('.res-card');
      const resName = card.querySelector('.res-name').textContent;
      toggleFavorite(resName, heartBtn);
    }
    else {
      const card = e.target.closest('.res-card');
      if(card){
        const name = card.querySelector('.res-name').textContent;
        openRestaurant(name, window.currentCategoryConfig?.menu);
      }
    }
  });
}

/* Sticky Search Bar Logic */
const catContent = document.querySelector('.cat-content');
const catHeader = document.querySelector('.cat-header');
const searchWrapper = document.querySelector('.cat-search-wrapper');
const headerSearchInput = document.getElementById('headerSearchInput');
const mainCatSearchInput = document.getElementById('mainCatSearchInput');

if(catContent && catHeader && searchWrapper){
  catContent.addEventListener('scroll', () => {
    const wrapperTop = searchWrapper.getBoundingClientRect().top;
    const headerBottom = catHeader.getBoundingClientRect().bottom;
    // If search wrapper scrolls up behind header, stick the header search
    if (wrapperTop < headerBottom - 20) { 
      catHeader.classList.add('stuck');
    } else {
      catHeader.classList.remove('stuck');
    }
  });
}
// Sync inputs
if(headerSearchInput && mainCatSearchInput){
  const filterRestaurants = (query) => {
    const cards = document.querySelectorAll('#restaurantList .res-card');
    cards.forEach(card => {
        const name = card.querySelector('.res-name').textContent.toLowerCase();
        if(name.includes(query.toLowerCase())) card.style.display = 'flex';
        else card.style.display = 'none';
    });
  };
  headerSearchInput.addEventListener('input', (e) => { mainCatSearchInput.value = e.target.value; filterRestaurants(e.target.value); });
  mainCatSearchInput.addEventListener('input', (e) => { headerSearchInput.value = e.target.value; filterRestaurants(e.target.value); });
}

/* Restaurant Menu Nav Logic */
const resMenuNav = document.getElementById('resMenuNav');
if (resMenuNav) {
    resMenuNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('res-menu-item')) {
            resMenuNav.querySelectorAll('.res-menu-item').forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');

            // Auto-scroll the navigation bar to center the clicked item.
            // This ensures the active item is always visible.
            e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            
            const targetName = e.target.textContent.trim();
            const titles = document.querySelectorAll('.res-category-title');
            for (const title of titles) {
                if (title.textContent.trim() === targetName) {
                    title.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    break;
                }
            }
        }
    });
}

/* Restaurant Menu Item Add/Quantity Logic & Dish Detail */
const resMenuContent = document.getElementById('resMenuContent');
const dishDetailScreen = document.getElementById('dishDetailScreen');
const dishCloseBtn = document.getElementById('dishCloseBtn');

const viewCartBtn = document.getElementById('viewCartBtn');
function updateCartView() {
    if (!viewCartBtn) return;

    const restaurantScreen = document.getElementById('restaurantScreen');
    if (cart.length === 0 || !restaurantScreen.classList.contains('active')) {
        viewCartBtn.classList.remove('active');
        // Using display none via class logic, ensuring it hides
        viewCartBtn.style.display = 'none'; 
    }

    const cartSummary = computeCartSummary(cart);
    const totalItems = cartSummary.itemCount;
    const totalPrice = cartSummary.total;

    if (totalItems > 0 && restaurantScreen.classList.contains('active')) {
        document.getElementById('cartItemCount').textContent = totalItems;
        viewCartBtn.style.display = 'flex';
        setTimeout(() => viewCartBtn.classList.add('active'), 10);
    } else {
        viewCartBtn.classList.remove('active');
        viewCartBtn.style.display = 'none';
    }

    if (totalPrice > 0 && document.getElementById('cartTotalAmount')) {
        document.getElementById('cartTotalAmount').textContent = totalPrice.toFixed(2);
    }
}

function updateDishDetailTotal() {
    if (!dishDetailScreen || !dishDetailScreen.classList.contains('active')) return;

    const priceEl = document.getElementById('dishDetailPrice');
    const quantityEl = dishDetailScreen.querySelector('.quantity-value-large');
    const addToCartBtn = dishDetailScreen.querySelector('.add-to-cart-large-btn');

    const basePrice = parseFloat(priceEl.textContent);
    const quantity = parseInt(quantityEl.textContent, 10);

    let addonsPrice = 0;
    const selectedAddons = dishDetailScreen.querySelectorAll('.addon-checkbox:checked');
    selectedAddons.forEach(checkbox => {
        const priceText = checkbox.closest('.addon-item').querySelector('.addon-price').dataset.price;
        addonsPrice += parseFloat(priceText);
    });

    if (!isNaN(basePrice) && !isNaN(quantity)) {
        const total = (basePrice + addonsPrice) * quantity;
        addToCartBtn.textContent = `Add to cart`;
    }
}

function openDishDetail(itemCard) {
    if (!dishDetailScreen) return;

    // Extract data from the clicked card
    const title = itemCard.querySelector('.res-item-title').textContent;
    const desc = itemCard.querySelector('.res-item-desc').textContent;
    const price = itemCard.querySelector('.res-item-current-price').textContent;
    // Clone the node to safely get the emoji without the button
    const imgBoxClone = itemCard.querySelector('.res-item-img-box').cloneNode(true);
    imgBoxClone.querySelector('.res-item-add-btn').remove();
    const image = imgBoxClone.innerHTML.trim();

    // Populate the detail screen
    document.getElementById('dishDetailTitle').textContent = title;
    document.getElementById('dishDetailDesc').textContent = desc;
    document.getElementById('dishDetailPrice').textContent = price;
    document.getElementById('dishDetailImage').innerHTML = image;

    // Reset quantity
    dishDetailScreen.querySelector('.quantity-value-large').textContent = '1';

    // Uncheck all addons
    dishDetailScreen.querySelectorAll('.addon-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Show the screen
    dishDetailScreen.classList.add('active');

    // Reset image transform for parallax
    const dishImage = document.getElementById('dishDetailImage');
    if(dishImage) {
        dishImage.style.transform = '';
        dishImage.style.transition = ''; 
    }

    // Update total after screen is active and populated
    updateDishDetailTotal();
}

function closeDishDetail() {
    if (dishDetailScreen) {
        dishDetailScreen.classList.remove('active');
    }
}

if (dishCloseBtn) {
    dishCloseBtn.addEventListener('click', closeDishDetail);
}

// Dish Detail Parallax
const dishContent = document.querySelector('.dish-content');
const dishImage = document.getElementById('dishDetailImage');
if (dishContent && dishImage) {
    dishContent.addEventListener('scroll', () => {
        const sc = dishContent.scrollTop;
        if (dishDetailScreen.classList.contains('active')) {
             if (sc > 5) dishImage.style.transition = 'none'; // Disable transition during scroll to avoid jank
             dishImage.style.transform = `translateY(${sc * 0.4}px) scale(1)`;
        }
    }, { passive: true });
}

const addonsContainer = document.getElementById('dishDetailAddons');
if (addonsContainer) {
    addonsContainer.addEventListener('change', updateDishDetailTotal);
}


// Add event listener to the footer for quantity changes
const dishFooter = dishDetailScreen.querySelector('.dish-footer');
if (dishFooter) {
    dishFooter.addEventListener('click', (e) => {
        const quantityEl = dishFooter.querySelector('.quantity-value-large');
        if (!quantityEl) return;
        let quantity = parseInt(quantityEl.textContent, 10);

        if (e.target.classList.contains('plus')) {
            quantityEl.textContent = quantity + 1;
            updateDishDetailTotal();
        } else if (e.target.classList.contains('minus')) {
            if (quantity > 1) {
                quantityEl.textContent = quantity - 1;
                updateDishDetailTotal();
            }
        } else if (e.target.classList.contains('add-to-cart-large-btn')) {
            const title = document.getElementById('dishDetailTitle').textContent;
            const basePrice = parseFloat(document.getElementById('dishDetailPrice').textContent);
            const currentQuantity = parseInt(quantityEl.textContent, 10);
            const image = document.getElementById('dishDetailImage').innerHTML;
            
            const selectedAddons = [];
            dishDetailScreen.querySelectorAll('.addon-checkbox:checked').forEach(checkbox => {
                const item = checkbox.closest('.addon-item');
                selectedAddons.push({
                    name: item.querySelector('.addon-name').textContent,
                    price: parseFloat(item.querySelector('.addon-price').dataset.price)
                });
            });

            cart.push({
                title,
                basePrice,
                quantity: currentQuantity,
                addons: selectedAddons,
                image
            });
            updateCartView();
            closeDishDetail();
        }
    });
}

if (resMenuContent) {
    resMenuContent.addEventListener('click', (e) => {
        const itemCard = e.target.closest('.res-item-card');

        // If a card was clicked (including its add button), open the detail screen
        if (itemCard) {
            openDishDetail(itemCard);
        }
    });
}

/* Toast Function */
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// --- Cart and checkout flow ---
/* Cart Screen Logic */
const cartScreen = document.getElementById('cartScreen');
const cartBackBtn = document.getElementById('cartBackBtn');

function openCart() {
    const cartContent = document.getElementById('cartContent');
    const cartTotalAmount = document.getElementById('cartTotalAmount');
    
    clearInterval(suggestedScrollInterval);
    cartContent.innerHTML = '';
    let grandTotal = 0;

    if (cart.length === 0) {
        cartContent.innerHTML = '<div style="text-align:center; margin-top:50px; color:#999; font-size: 1.1em;">Your cart is empty</div>';
    } else {
        cart.forEach((item, index) => {
            let itemTotal = item.basePrice;
            let detailsHtml = '';
            
            if (item.addons && item.addons.length > 0) {
                item.addons.forEach(addon => {
                    itemTotal += addon.price;
                    detailsHtml += `<div>+ ${addon.name} (${addon.price.toFixed(2)})</div>`;
                });
            }
            
            itemTotal *= item.quantity;
            grandTotal += itemTotal;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-img-box">${item.image || '🍽️'}</div>
                <div class="cart-item-info" style="flex:1;">
                    <div class="cart-item-header">${item.title}</div>
                    <div class="cart-item-details">${detailsHtml}</div>
                    <div class="cart-controls">
                        <div class="cart-control-btn minus" data-index="${index}">-</div>
                        <div class="cart-quantity-text">${item.quantity}</div>
                        <div class="cart-control-btn plus" data-index="${index}">+</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; justify-content:space-between; gap:10px;">
                    <div class="cart-item-price">${itemTotal.toFixed(2)}</div>
                    <div class="cart-control-btn delete" data-index="${index}">🗑️</div>
                </div>
            `;
            cartContent.appendChild(div);
        });

        const addMoreBtn = document.createElement('div');
        addMoreBtn.className = 'add-more-items-btn';
        addMoreBtn.textContent = 'Add More Items';
        addMoreBtn.addEventListener('click', () => {
            cartScreen.classList.remove('active');
            clearInterval(suggestedScrollInterval);
        });
        cartContent.appendChild(addMoreBtn);

        // Suggested Items Section
        const suggestedSection = document.createElement('div');
        suggestedSection.className = 'suggested-section';
        suggestedSection.innerHTML = '<div class="suggested-title">You may also like</div>';
        
        const suggestedScroll = document.createElement('div');
        suggestedScroll.className = 'suggested-scroll';
        
        const suggestedItems = [
            { title: 'French Fries', price: 15.00, emoji: '🍟' },
            { title: 'Coca Cola', price: 5.00, emoji: '🥤' },
            { title: 'Choco Ice Cream', price: 12.00, emoji: '🍦' },
            { title: 'Fresh Salad', price: 20.00, emoji: '🥗' },
            { title: 'Onion Rings', price: 18.00, emoji: '🧅' }
        ];

        suggestedItems.forEach(sItem => {
            const itemEl = document.createElement('div');
            itemEl.className = 'suggested-item';
            itemEl.innerHTML = `
                <div class="suggested-img-box">
                    ${sItem.emoji}
                    <div class="suggested-add-btn">+</div>
                </div>
                <div class="suggested-name">${sItem.title}</div>
                <div class="suggested-price">${sItem.price.toFixed(2)}</div>
            `;
            
            itemEl.querySelector('.suggested-add-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                cart.push({ title: sItem.title, basePrice: sItem.price, quantity: 1, addons: [], image: sItem.emoji });
                showToast(`${sItem.title} added!`);
                openCart();
            });
            suggestedScroll.appendChild(itemEl);
        });
        
        suggestedSection.appendChild(suggestedScroll);
        cartContent.appendChild(suggestedSection);

        suggestedScrollInterval = setInterval(() => {
            if (suggestedScroll.scrollLeft + suggestedScroll.clientWidth >= suggestedScroll.scrollWidth - 10) {
                suggestedScroll.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                suggestedScroll.scrollBy({ left: 160, behavior: 'smooth' });
            }
        }, 2500);
    }

    cartTotalAmount.textContent = grandTotal.toFixed(2);
    cartScreen.classList.add('active');
}

/* Cart Actions (Delegation) */
document.getElementById('cartContent').addEventListener('click', (e) => {
    const btn = e.target.closest('.cart-control-btn');
    if (!btn) return;
    
    const index = parseInt(btn.dataset.index, 10);
    
    if (btn.classList.contains('plus')) {
        cart[index].quantity++;
    } else if (btn.classList.contains('minus')) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        }
    } else if (btn.classList.contains('delete')) {
        cart.splice(index, 1);
    }
    
    updateCartView();
    openCart();
});

/* Checkout Action */
document.querySelector('.checkout-btn').addEventListener('click', () => {
    if (cart.length > 0) {
        const checkoutScreen = document.getElementById('checkoutActionScreen');
        const checkoutContent = checkoutScreen.querySelector('.checkout-content');
        
        // Calculate totals
        let grandTotal = 0;
        let totalItems = 0;
        cart.forEach(item => {
            let itemTotal = item.basePrice;
            if (item.addons) item.addons.forEach(a => itemTotal += a.price);
            grandTotal += itemTotal * item.quantity;
            totalItems += item.quantity;
        });
        const resName = document.getElementById('resScreenName').textContent || 'Restaurant';

        checkoutContent.innerHTML = '';

        // 1. "Your Order" Subtitle
        const yourOrderTitle = document.createElement('h3');
        yourOrderTitle.textContent = 'Your Order';
        yourOrderTitle.style.cssText = 'margin: 5px 0 15px 0; font-size: 1.1em; font-weight: 800; color: #333;';
        checkoutContent.appendChild(yourOrderTitle);

        // 2. Accordion for Items
        const accordionHeader = document.createElement('div');
        accordionHeader.className = 'cart-accordion-header';
        if (isCheckoutAccordionOpen) accordionHeader.classList.add('active');
        accordionHeader.innerHTML = `
            <div class="header-text">
                <div class="header-title">${totalItems} Items from</div>
                <div class="header-subtitle">${resName}</div>
            </div>
            <div class="cart-accordion-icon">v</div>
        `;

        const accordionBody = document.createElement('div');
        accordionBody.className = 'cart-accordion-body';
        if (isCheckoutAccordionOpen) accordionBody.classList.add('open');

        // Populate Accordion Body with simple list
        cart.forEach((item) => {
            const div = document.createElement('div');
            div.style.cssText = 'padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 0.9em;';
            div.innerHTML = `<span>${item.quantity}x ${item.title}</span> <span>${(item.basePrice * item.quantity).toFixed(2)}</span>`;
            accordionBody.appendChild(div);
        });

        accordionHeader.addEventListener('click', () => {
            isCheckoutAccordionOpen = !isCheckoutAccordionOpen;
            accordionHeader.classList.toggle('active');
            if (isCheckoutAccordionOpen) {
                accordionBody.classList.add('open');
                accordionBody.style.maxHeight = accordionBody.scrollHeight + "px";
            } else {
                accordionBody.classList.remove('open');
                accordionBody.style.maxHeight = null;
            }
        });

        checkoutContent.appendChild(accordionHeader);
        checkoutContent.appendChild(accordionBody);
        if (isCheckoutAccordionOpen) { setTimeout(() => { accordionBody.style.maxHeight = accordionBody.scrollHeight + "px"; }, 0); }

        // Allergy Section
        const allergySection = document.createElement('div');
        allergySection.style.cssText = 'margin-top: 25px; cursor: pointer; padding: 0 5px;';
        allergySection.id = 'checkoutAllergySection';
        allergySection.innerHTML = `
            <div class="address-details">
                <span class="address-icon">⚠️</span>
                <div style="flex: 1;">
                    <span style="font-weight: bold;">Any Allergies?</span>
                    <div id="allergyNotesDisplay" style="font-size: 0.8em; color: #666; margin-top: 4px; white-space: pre-wrap; word-break: break-word; display: none;"></div>
                </div>
            </div>
        `;
        allergySection.addEventListener('click', () => {
            document.getElementById('allergyInput').value = allergyNotes;
            document.getElementById('allergyScreen').classList.add('active');
        });
        checkoutContent.appendChild(allergySection);
        updateAllergyDisplay();

        // Cutlery Section
        const cutlerySection = document.createElement('div');
        cutlerySection.className = 'cutlery-section';
        cutlerySection.innerHTML = `
            <div class="cutlery-header">
                <div class="cutlery-title">
                    <span>🍴</span>
                    <b>Need Cutlery?</b>
                </div>
                <label class="cutlery-switch">
                    <input type="checkbox" id="cutlerySwitch">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="cutlery-description" id="cutleryDescription">
                Help us minimize waste. Only ask for cutley when you need it.
            </div>
        `;
        checkoutContent.appendChild(cutlerySection);

        const cutlerySwitch = cutlerySection.querySelector('#cutlerySwitch');
        const cutleryDescription = cutlerySection.querySelector('#cutleryDescription');
        cutlerySwitch.addEventListener('change', () => {
            if (cutlerySwitch.checked) {
                cutleryDescription.textContent = 'Cutlery will be requested from the restaurant for this order.';
            } else {
                cutleryDescription.textContent = 'Help us minimize waste. Only ask for cutley when you need it.';
            }
        });

        // 3. Delivery Address Section
        const addressSection = document.createElement('div');
        addressSection.className = 'checkout-section';
        addressSection.style.marginTop = '20px';
        const currentAddress = document.getElementById('selectedAddressText').textContent || 'No address selected';
        addressSection.innerHTML = `
            <div class="checkout-section-header">
                <h4>Delivery Address</h4>
                <button class="change-btn">Change</button>
            </div>
            <div class="address-details">
                <span class="address-icon">🏠</span>
                <span class="address-text" style="line-height: 1.4;">${currentAddress}</span>
            </div>
            <div id="checkoutMiniMap" class="checkout-mini-map"></div>
            <div class="recipient-details-section" id="checkoutRecipientSection"></div>
            <div class="user-phone-section" id="checkoutUserPhoneSection"></div>
        `;
        addressSection.querySelector('.change-btn').addEventListener('click', () => {
            document.getElementById('checkoutActionScreen').classList.remove('active');
        });
        checkoutContent.appendChild(addressSection);

        const recipientSection = document.getElementById('checkoutRecipientSection');
        recipientSection.addEventListener('click', () => {
            const recipientScreen = document.getElementById('recipientScreen');
            document.getElementById('recipientName').value = recipientDetails.name;
            const phoneParts = recipientDetails.phone.split(' ');
            if (phoneParts.length > 1) {
                document.getElementById('phonePrefix').value = phoneParts[0];
                document.getElementById('phoneNumber').value = phoneParts.slice(1).join(' ');
            } else {
                document.getElementById('phoneNumber').value = recipientDetails.phone;
            }
            recipientScreen.classList.add('active');
        });
        updateRecipientDisplay();

        const userPhoneSection = document.getElementById('checkoutUserPhoneSection');
        userPhoneSection.addEventListener('click', () => {
            const userPhoneScreen = document.getElementById('userPhoneScreen');
            const phoneParts = userPhoneNumber.split(' ');
            if (phoneParts.length > 1) {
                document.getElementById('userPhonePrefix').value = phoneParts[0];
                document.getElementById('userPhoneNumberInput').value = phoneParts.slice(1).join(' ');
            } else {
                document.getElementById('userPhoneNumberInput').value = userPhoneNumber;
                document.getElementById('userPhonePrefix').value = '+971'; // Default prefix
            }
            userPhoneScreen.classList.add('active');
        });
        updateUserPhoneDisplay();

        setTimeout(() => {
            const center = marker ? marker.getLatLng() : [24.4539,54.3773];
            const miniMap = L.map('checkoutMiniMap', { zoomControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false, attributionControl:false }).setView(center, 16);
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: ''
            }).addTo(miniMap);
            const pinIcon = L.divIcon({ html: '📍', className: 'delivery-pin-icon', iconSize: [30, 30], iconAnchor: [15, 30] });
            L.marker(center, {icon: pinIcon}).addTo(miniMap);
        }, 300);

        // Delivery Options Section
        const deliveryOptSection = document.createElement('div');
        deliveryOptSection.className = 'checkout-section';
        deliveryOptSection.style.marginTop = '20px';

        const deliveryOptHeader = document.createElement('div');
        deliveryOptHeader.className = 'checkout-section-header';
        deliveryOptHeader.style.marginBottom = '0';
        deliveryOptHeader.style.cursor = 'pointer';
        deliveryOptHeader.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.5em;">⏰</span>
                <h4>Delivery Options</h4>
            </div>
            <div class="cart-accordion-icon">v</div>
        `;

        const deliveryOptBody = document.createElement('div');
        deliveryOptBody.className = 'cart-accordion-body';
        deliveryOptBody.innerHTML = `
            <div style="padding-top: 15px; border-top: 1px solid #eee; margin-top: 10px;">
                <label style="display:flex; align-items:center; gap:10px; margin-bottom:15px; cursor:pointer;">
                    <input type="radio" name="deliveryType" value="standard" checked style="accent-color: #019E81; width: 18px; height: 18px;">
                    <div>
                        <div style="font-weight:bold; color:#333; font-size: 1em;">Standard Delivery</div>
                        <div style="font-size:0.85em; color:#666;">20 - 30 mins</div>
                    </div>
                </label>
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                    <input type="radio" name="deliveryType" value="schedule" style="accent-color: #019E81; width: 18px; height: 18px;">
                    <div>
                        <div style="font-weight:bold; color:#333; font-size: 1em;">Schedule Order</div>
                        <div style="font-size:0.85em; color:#666;">Choose a specific time</div>
                    </div>
                </label>
                <div id="scheduleTimeContainer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease; padding-left: 30px;">
                    <input type="datetime-local" id="scheduleTimeInput" style="margin-top: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; width: 100%; font-family: inherit;">
                </div>
            </div>
        `;
        
        let isDeliveryOptOpen = false;
        deliveryOptHeader.addEventListener('click', () => {
            isDeliveryOptOpen = !isDeliveryOptOpen;
            const icon = deliveryOptHeader.querySelector('.cart-accordion-icon');
            if (isDeliveryOptOpen) {
                deliveryOptBody.classList.add('open');
                deliveryOptBody.style.maxHeight = deliveryOptBody.scrollHeight + "px";
                icon.style.transform = 'rotate(180deg)';
            } else {
                deliveryOptBody.classList.remove('open');
                deliveryOptBody.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            }
        });

        const radioBtns = deliveryOptBody.querySelectorAll('input[name="deliveryType"]');
        const timeContainer = deliveryOptBody.querySelector('#scheduleTimeContainer');
        radioBtns.forEach(btn => {
            btn.addEventListener('change', (e) => {
                if (e.target.value === 'schedule') {
                    timeContainer.style.maxHeight = '100px';
                    if(isDeliveryOptOpen) deliveryOptBody.style.maxHeight = (deliveryOptBody.scrollHeight + 100) + "px";
                } else {
                    timeContainer.style.maxHeight = '0';
                }
            });
        });

        deliveryOptSection.appendChild(deliveryOptHeader);
        deliveryOptSection.appendChild(deliveryOptBody);
        checkoutContent.appendChild(deliveryOptSection);

        // 4. Payment Method
        const paymentSection = document.createElement('div');
        paymentSection.className = 'checkout-section';
        paymentSection.id = 'paymentSection';
        paymentSection.innerHTML = `
            <div class="checkout-section-header">
                <h4>Payment Method</h4>
                <button class="change-btn">Select</button>
            </div>
            <div class="address-details">
                <span class="address-icon">${selectedPaymentMethod.icon}</span>
                <span>${selectedPaymentMethod.text}</span>
            </div>
        `;
        paymentSection.querySelector('.change-btn').addEventListener('click', () => {
            const currentPayment = selectedPaymentMethod.value;
            const radioToCheck = document.querySelector(`#paymentSheet input[value="${currentPayment}"]`);
            if (radioToCheck) {
                radioToCheck.checked = true;
            }
            document.getElementById('paymentOverlay').classList.add('show');
            document.getElementById('paymentSheet').classList.add('show');
        });
        
        if (selectedPaymentMethod.value === 'mtn' || selectedPaymentMethod.value === 'airtel') {
             const infoDiv = document.createElement('div');
             infoDiv.id = 'paymentDepositInfo';
             infoDiv.style.cssText = 'margin-top: 15px; font-size: 0.9em; color: #555; background-color: #f9f9f9; padding: 10px; border-radius: 8px; border: 1px solid #eee;';
             const number = '+971562889428';
             infoDiv.innerHTML = `<strong>Deposit Number:</strong> ${number}<br><small>After deposit, send screenshot proof to the WhatsApp number you placed the order with.</small>`;
             paymentSection.appendChild(infoDiv);
        }

        checkoutContent.appendChild(paymentSection);

        // Courier Tip Section
        const tipSection = document.createElement('div');
        tipSection.className = 'checkout-section';
        tipSection.style.marginTop = '20px';
        tipPercentage = 0;
        const summarySection = document.createElement('div');
        summarySection.className = 'checkout-section';
        summarySection.style.marginTop = '20px';

        const updateSummary = () => {
            const currency = 'UGX';
            const productTotal = grandTotal;
            const deliveryFee = 0.00; 
            const promotion = 0.00;
            const subTotal = productTotal - promotion;
            const tipAmount = subTotal * (tipPercentage / 100);
            const totalToPay = subTotal + deliveryFee + tipAmount;

            let summaryHtml = `<div class="checkout-section-header" style="margin-bottom:15px;"><h4>Delivery Summary</h4></div>`;

            // Product list header
            summaryHtml += `
                <div class="summary-row" style="font-weight: bold; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                <span style="flex: 4; text-align: left;">Products</span>
                    <span style="flex: 1; text-align: center;">Qty</span>
                <span style="flex: 2; text-align: center;">Unit Price</span>
                <span style="flex: 2; text-align: center;">Price</span>
                </div>
            `;

            // List each product
            cart.forEach(item => {
                let itemPrice = item.basePrice;
                if (item.addons) item.addons.forEach(a => itemPrice += a.price);
                const lineTotal = itemPrice * item.quantity;

                summaryHtml += `
                    <div class="summary-row">
                    <span style="flex: 4; text-align: left; white-space: normal; word-break: break-word;">${item.title}</span>
                        <span style="flex: 1; text-align: center;">${item.quantity}</span>
                    <span style="flex: 2; text-align: center;">${itemPrice.toFixed(2)}</span>
                    <span style="flex: 2; text-align: center;">${lineTotal.toFixed(2)}</span>
                    </div>
                `;
            });

            // Rest of the summary
            summaryHtml += `
                <div class="summary-row" style="border-top: 1px solid #eee; padding-top: 8px;"><span>Promotions</span><span>-${currency} ${promotion.toFixed(2)}</span></div>
                <div class="summary-row" style="font-weight: 800; color: #333;"><span>Subtotal</span><span>${currency} ${subTotal.toFixed(2)}</span></div>
                <div class="summary-row"><span>Delivery Fees</span><span>${currency} ${deliveryFee.toFixed(2)}</span></div>
                <div class="summary-row"><span>Courier Tip (${tipPercentage}%)</span><span>${currency} ${tipAmount.toFixed(2)}</span></div>
                <div class="summary-row total"><span>Total to Pay</span><span>${currency} ${totalToPay.toFixed(2)}</span></div>
            `;
            
            summarySection.innerHTML = summaryHtml;
        };
        
        const tipHeader = document.createElement('div');
        tipHeader.className = 'checkout-section-header';
        tipHeader.style.marginBottom = '5px';
        tipHeader.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.5em;">🤲</span>
                <h4>Courier tip</h4>
            </div>
        `;
        
        const tipSubtitle = document.createElement('div');
        tipSubtitle.style.cssText = 'font-size: 0.85em; color: #666; margin-bottom: 15px;';
        tipSubtitle.textContent = 'The Courier will get the full amount';

        const tipOptionsContainer = document.createElement('div');
        tipOptionsContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
        
        [0, 5, 10, 15].forEach(amount => {
            const el = document.createElement('div');
            el.className = 'tip-option';
            if (amount === 0) el.classList.add('selected');
            el.textContent = amount + '%';
            el.addEventListener('click', () => {
                tipOptionsContainer.querySelectorAll('.tip-option').forEach(opt => opt.classList.remove('selected'));
                el.classList.add('selected');
                tipPercentage = amount;
                updateSummary();
            });
            tipOptionsContainer.appendChild(el);
        });

        const saveTipContainer = document.createElement('label');
        saveTipContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 0.9em; cursor: pointer; user-select: none;';
        saveTipContainer.innerHTML = `<input type="checkbox" style="accent-color: #019E81; width: 18px; height: 18px;"><span>Save tip for next order</span>`;

        tipSection.append(tipHeader, tipSubtitle, tipOptionsContainer, saveTipContainer);
        checkoutContent.appendChild(tipSection);

        updateSummary();
        checkoutContent.appendChild(summarySection);

        checkoutScreen.classList.add('active');
    }
});

if (viewCartBtn) {
    viewCartBtn.addEventListener('click', openCart);
}

if (cartBackBtn) {
    cartBackBtn.addEventListener('click', () => {
        cartScreen.classList.remove('active');
        clearInterval(suggestedScrollInterval);
    });
}

const placeOrderBtn = document.getElementById('placeOrderBtn');
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            if (!userPhoneNumber && !recipientDetails.phone) {
                showToast("Please provide a contact number and select payment mode");
                const userPhoneSection = document.getElementById('checkoutUserPhoneSection');
                if (userPhoneSection) userPhoneSection.click();
                return;
            }

            // WhatsApp Integration
            const resName = document.getElementById('resScreenName').textContent || 'Restaurant';
            const currency = 'UGX';
            let message = `*New Order from Kirya App* 🛒\n\n`;
            message += `*Restaurant:* ${resName}\n\n`;
            message += `*Items:*\n`;

            let subTotal = 0;
            cart.forEach(item => {
                let itemPrice = item.basePrice;
                let addonsText = '';
                if (item.addons && item.addons.length > 0) {
                    item.addons.forEach(addon => {
                        itemPrice += addon.price;
                        addonsText += ` + ${addon.name}`;
                    });
                }
                const lineTotal = itemPrice * item.quantity;
                subTotal += lineTotal;
                message += `${item.quantity}x ${item.title}${addonsText} - ${lineTotal.toFixed(2)}\n`;
            });

            const deliveryFee = 0.00;
            const tipAmount = subTotal * (tipPercentage / 100);
            const totalToPay = subTotal + deliveryFee + tipAmount;

            message += `\n*Subtotal:* ${currency} ${subTotal.toFixed(2)}\n`;
            message += `*Delivery Fee:* ${currency} ${deliveryFee.toFixed(2)}\n`;
            message += `*Courier Tip (${tipPercentage}%):* ${currency} ${tipAmount.toFixed(2)}\n`;
            message += `*Total to Pay:* ${currency} ${totalToPay.toFixed(2)}\n\n`;

            message += `*Payment Method:* ${selectedPaymentMethod.text}\n`;
            const deliveryAddress = document.getElementById('selectedAddressText').textContent || 'Not set';
            message += `*Delivery Address:* ${deliveryAddress}\n`;

            const customerName = recipientDetails.name || 'Valued Customer';
            const contactPhone = recipientDetails.phone || userPhoneNumber || 'Not provided';
            message += `*Customer:* ${customerName}\n`;
            message += `*Contact:* ${contactPhone}\n`;

            if (allergyNotes) {
                message += `*Allergies/Notes:* ${allergyNotes}\n`;
            }

            const cutlery = document.getElementById('cutlerySwitch') && document.getElementById('cutlerySwitch').checked ? 'Yes' : 'No';
            message += `*Cutlery:* ${cutlery}\n`;

            const order = createCustomerMarketplaceOrder({
                restaurant: resName,
                items: cart.map(item => `${item.quantity}x ${item.title}`),
                subtotal: subTotal,
                deliveryFee,
                tipAmount,
                total: totalToPay,
                customerName,
                customerPhone: contactPhone,
                deliveryAddress,
                paymentMethod: selectedPaymentMethod.text,
                notes: allergyNotes
            });
            if (!order) return;

            const whatsappNumber = '971562889428'; // Business WhatsApp Number
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            showToast(`Order ${order.id} placed. Track merchant and rider updates in Orders.`);
            cart = [];
            updateCartView();
            document.getElementById('checkoutActionScreen').classList.remove('active');
            setTimeout(() => {
                cartScreen.classList.remove('active');
                clearInterval(suggestedScrollInterval);
            }, 300);
        }
    });
}

const allergyScreen = document.getElementById('allergyScreen');
const allergyBackBtn = document.getElementById('allergyBackBtn');
const saveAllergyBtn = document.getElementById('saveAllergyBtn');
const allergyInput = document.getElementById('allergyInput');

function updateAllergyDisplay() {
    const displayEl = document.getElementById('allergyNotesDisplay');
    const allergySection = document.getElementById('checkoutAllergySection');
    if (displayEl && allergySection) {
        const mainTextSpan = allergySection.querySelector('span:not(.address-icon)');
        if (allergyNotes) {
            displayEl.textContent = allergyNotes;
            displayEl.style.display = 'block';
            if(mainTextSpan) mainTextSpan.textContent = 'Allergies / Notes';
        } else {
            displayEl.style.display = 'none';
            if(mainTextSpan) mainTextSpan.textContent = 'Any Allergies?';
        }
    }
}

function updateRecipientDisplay() {
    const section = document.getElementById('checkoutRecipientSection');
    if (!section) return;

    if (recipientDetails.name) {
        section.innerHTML = `
            <span class="address-icon">🎁</span>
            <div>
                <h4>Sending to: ${recipientDetails.name}</h4>
                <p>Courier will contact ${recipientDetails.phone}. Tap to edit.</p>
            </div>
        `;
    } else {
        section.innerHTML = `
            <span class="address-icon">🎁</span>
            <div>
                <h4>Sending to someone else?</h4>
                <p>Add their details to help the courier</p>
            </div>
        `;
    }
}

function updateUserPhoneDisplay() {
    const section = document.getElementById('checkoutUserPhoneSection');
    if (!section) return;

    if (userPhoneNumber) {
        section.innerHTML = `
            <span class="address-icon">📱</span>
            <div>
                <h4>Your Phone Number</h4>
                <p>${userPhoneNumber}. Tap to edit.</p>
            </div>
        `;
    } else {
        section.innerHTML = `
            <span class="address-icon">📱</span>
            <div>
                <h4>Add Your Phone Number</h4>
                <p>We will send you massage to validate it</p>
            </div>
        `;
    }
}

const recipientScreen = document.getElementById('recipientScreen');
const recipientCloseBtn = document.getElementById('recipientCloseBtn');
const saveRecipientBtn = document.getElementById('saveRecipientBtn');

if (recipientCloseBtn) {
    recipientCloseBtn.addEventListener('click', () => {
        recipientScreen.classList.remove('active');
    });
}

if (saveRecipientBtn) {
    saveRecipientBtn.addEventListener('click', () => {
        const name = document.getElementById('recipientName').value.trim();
        const prefix = document.getElementById('phonePrefix').value.trim();
        const number = document.getElementById('phoneNumber').value.trim();

        if (name && number) {
            recipientDetails.name = name;
            recipientDetails.phone = `${prefix} ${number}`;
            showToast("Recipient details saved!");
            updateRecipientDisplay();
            recipientScreen.classList.remove('active');
        } else {
            showToast("Please fill in all fields.");
        }
    });
}

const userPhoneScreen = document.getElementById('userPhoneScreen');
const userPhoneCloseBtn = document.getElementById('userPhoneCloseBtn');
const saveUserPhoneBtn = document.getElementById('saveUserPhoneBtn');

if (userPhoneCloseBtn) {
    userPhoneCloseBtn.addEventListener('click', () => {
        userPhoneScreen.classList.remove('active');
    });
}

if (saveUserPhoneBtn) {
    saveUserPhoneBtn.addEventListener('click', () => {
        const prefix = document.getElementById('userPhonePrefix').value.trim();
        const number = document.getElementById('userPhoneNumberInput').value.trim();

        if (number) {
            userPhoneNumber = `${prefix} ${number}`;
            showToast("Phone number saved!");
            updateUserPhoneDisplay();
            userPhoneScreen.classList.remove('active');
        } else {
            showToast("Please enter a phone number.");
        }
    });
}

if (allergyBackBtn) {
    allergyBackBtn.addEventListener('click', () => {
        allergyScreen.classList.remove('active');
    });
}

if (saveAllergyBtn) {
    saveAllergyBtn.addEventListener('click', () => {
        allergyNotes = allergyInput.value;
        if(allergyNotes) {
            showToast("Allergy information saved!");
        }
        allergyScreen.classList.remove('active');
        updateAllergyDisplay();
    });
}

const checkoutBackBtn = document.getElementById('checkoutBackBtn');
if (checkoutBackBtn) {
    checkoutBackBtn.addEventListener('click', () => {
        document.getElementById('checkoutActionScreen').classList.remove('active');
    });
}

const paymentOverlay = document.getElementById('paymentOverlay');
const paymentSheet = document.getElementById('paymentSheet');

function closePaymentSheet() {
    if(paymentOverlay) paymentOverlay.classList.remove('show');
    if(paymentSheet) paymentSheet.classList.remove('show');
}

if (paymentOverlay) {
    paymentOverlay.addEventListener('click', closePaymentSheet);
}

if (paymentSheet) {
    paymentSheet.addEventListener('change', (e) => {
        if (e.target.name === 'paymentMethod') {
            const radio = e.target;
            selectedPaymentMethod = {
                value: radio.value,
                icon: radio.dataset.icon,
                text: radio.dataset.text
            };
            
            const paymentSection = document.getElementById('paymentSection');
            if (paymentSection) {
                paymentSection.querySelector('.address-icon').innerHTML = selectedPaymentMethod.icon;
                const textSpan = paymentSection.querySelector('.address-details span:last-of-type');
                if (textSpan) textSpan.textContent = selectedPaymentMethod.text;

                // Handle Deposit Info display update
                let infoDiv = document.getElementById('paymentDepositInfo');
                if (!infoDiv) {
                    infoDiv = document.createElement('div');
                    infoDiv.id = 'paymentDepositInfo';
                    infoDiv.style.cssText = 'margin-top: 15px; font-size: 0.9em; color: #555; background-color: #f9f9f9; padding: 10px; border-radius: 8px; border: 1px solid #eee;';
                    paymentSection.appendChild(infoDiv);
                }

                if (selectedPaymentMethod.value === 'mtn') {
                    infoDiv.innerHTML = `<strong>Deposit Number:</strong> +971562889428<br><small>After deposit, send screenshot proof to the WhatsApp number you placed the order with.</small>`;
                    infoDiv.style.display = 'block';
                } else if (selectedPaymentMethod.value === 'airtel') {
                    infoDiv.innerHTML = `<strong>Deposit Number:</strong> +971562889428<br><small>After deposit, send screenshot proof to the WhatsApp number you placed the order with.</small>`;
                    infoDiv.style.display = 'block';
                } else {
                    infoDiv.style.display = 'none';
                }
            }
            
            setTimeout(closePaymentSheet, 200);
        }
    });
}

/* Favorites Logic */
const favoritesScreen = document.getElementById('favoritesScreen');
const favBackBtn = document.getElementById('favBackBtn');
const profileFavoritesBtn = document.getElementById('profileFavoritesBtn');

function toggleFavorite(resName, btnElement) {
    if (favorites.has(resName)) {
        favorites.delete(resName);
        btnElement.textContent = '♡';
        btnElement.classList.remove('liked');
        showToast('Removed from favorites');
    } else {
        favorites.add(resName);
        btnElement.textContent = '♥';
        btnElement.classList.add('liked');
        showToast('Added to favorites');
    }
    // If on favorites screen, refresh list
    if (favoritesScreen.classList.contains('active')) {
        renderFavorites();
    }
}

function renderFavorites() {
    const container = document.getElementById('favoritesContent');
    container.innerHTML = '';
    if (favorites.size === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">No favorites added yet. <br>Tap the ♡ on restaurants to save them!</div>';
        return;
    }
    // In a real app, you would fetch full objects. Here we find matches from the existing list logic or recreate basic cards.
    // For visual consistency, we will clone valid cards from the main list if possible, or recreate dummy cards for the demo.
    // Since cards are dummy generated:
    favorites.forEach((resName) => {
        const card = document.createElement('div');
        card.className = 'res-card animate-entry';
        card.innerHTML = `
          <div class="res-image">
            🍽️
            <button class="heart-btn liked">♥</button>
          </div>
          <div class="res-name">${resName}</div>
          <div class="pref-info">
            <span class="pref-stat"><span>👍</span>(New)</span>
            <span class="pref-stat"><span style="display:inline-block; transform:scaleX(-1);">🚴‍♂️</span>Free</span>
            <span class="pref-stat">20-30 Mins</span>
          </div>
        `;
        card.querySelector('.heart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(resName, e.target);
        });
        card.addEventListener('click', () => openRestaurant(resName, window.currentCategoryConfig?.menu));
        container.appendChild(card);
    });
}

if(profileFavoritesBtn) {
    profileFavoritesBtn.addEventListener('click', () => {
        renderFavorites();
        favoritesScreen.classList.add('active');
        // Close profile overlay/menu if open, to show favorites cleanly? 
        // Profile is a slide-in, favorites is a generic-screen (slide-in). It stacks on top nicely.
    });
}
if(favBackBtn) {
    favBackBtn.addEventListener('click', () => {
        favoritesScreen.classList.remove('active');
    });
}

/* Profile Screen Logic */
const profileScreen = document.getElementById('profileScreen');
const profileBackBtn = document.getElementById('profileBackBtn');

function closeProfile() {
    document.getElementById('sideMenuOverlay').classList.remove('active');
    document.getElementById('profileScreen').classList.remove('active');
}

function openProfile() {
    const nameDisplay = document.getElementById('profileNameDisplay');
    const phoneDisplay = document.getElementById('profilePhoneDisplay');
    
    nameDisplay.textContent = recipientDetails.name || 'Guest User';
    phoneDisplay.textContent = userPhoneNumber || recipientDetails.phone || 'No phone set';
    
    document.getElementById('sideMenuOverlay').classList.add('active');
    profileScreen.classList.add('active');
}

function openRider() {
    document.getElementById('riderScreen').classList.add('active');
    initializeRiderWorkspace();
}

function readCustomerWorkflowCollections() {
    try {
        const parseCollection = key => {
            const raw = localStorage.getItem(key);
            if (raw === null) return [];
            const records = JSON.parse(raw);
            if (!Array.isArray(records)) throw new Error(`Saved ${key} data is not a list.`);
            return records;
        };
        const active = parseCollection('kiryaMerchantActiveOrders');
        const past = parseCollection('kiryaMerchantPastOrders');
        const knownPastIds = new Set(past.map(order => String(order.id)));
        const regionalDemoHistory = ugandaRegionalOffers.map(offer => {
            const customer = ugandaRegionalCustomers.find(record => record.id === offer.customerId);
            return {
                id: `${offer.orderNumber}-HIST`,
                customer: offer.customerName,
                customerId: offer.customerId,
                phone: customer?.phone || '',
                merchant: offer.vendorName,
                items: offer.title,
                total: offer.sampleOrderTotal || 'Sample order total',
                date: 'Sample delivery history',
                status: 'Delivered',
                fulfillment: 'delivery',
                deliveryAddress: offer.dropoffAddress,
                demoSample: true,
                createdAt: customer?.lastOrderAt || new Date().toISOString()
            };
        }).filter(order => !knownPastIds.has(String(order.id)));
        return {
            active,
            past: [...past, ...regionalDemoHistory],
            deliveries: parseCollection('kiryaMerchantDeliveries')
        };
    } catch (error) {
        console.error('Unable to load customer order tracking.', error);
        showToast('Order tracking could not be loaded. Please refresh and try again.');
        return null;
    }
}

function renderCustomerOrders() {
    const list = document.getElementById('customerOrdersList');
    if (!list) return;
    const collections = readCustomerWorkflowCollections();
    if (!collections) return;

    let phone = userPhoneNumber || recipientDetails.phone || '';
    if (!phone) {
        try {
            phone = localStorage.getItem('kiryaCustomerPhone') || '';
        } catch (error) {
            console.error('Unable to read the saved customer contact.', error);
            showToast('Saved customer details could not be loaded.');
            return;
        }
    }
    const phoneKey = merchantPhoneKey(phone);
    const orders = [...collections.active, ...collections.past]
        .filter(order => phoneKey && merchantPhoneKey(order.phone || '') === phoneKey)
        .map(order => {
            const delivery = collections.deliveries.find(item => item.order === order.id);
            return {
                ...order,
                deliveryId: delivery?.id || null,
                deliveryStatus: delivery?.status || '',
                rider: delivery?.driver || '',
                partnerId: delivery?.partnerId || null
            };
        })
        .sort((first, second) => Date.parse(second.createdAt || '') - Date.parse(first.createdAt || ''));
    customerTrackingOrders = orders;
    const activeCount = orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length;
    const orderBadge = document.getElementById('customerActiveOrderCount');
    if (orderBadge) {
        orderBadge.textContent = String(activeCount);
        orderBadge.hidden = activeCount === 0;
    }

    if (!orders.length) {
        clearCustomerTrackingMaps();
        list.innerHTML = `<div class="rider-empty-state">${phoneKey
            ? 'No orders for this phone number yet. Orders placed in this browser will appear here.'
            : 'Add your phone number during checkout to see order updates here.'}</div>`;
        return;
    }
    const orderSteps = ['new', 'preparing', 'ready', 'delivered'];
    clearCustomerTrackingMaps();
    list.innerHTML = orders.map(order => {
        const completedThrough = order.deliveryStatus === 'delivered' || order.status === 'Delivered'
            ? 3
            : order.status === 'ready' ? 2
                : order.status === 'preparing' ? 1 : 0;
        const deliveryLabel = {
            offered: 'Rider offered',
            accepted: 'Rider accepted',
            assigned: 'Rider accepted',
            'picked-up': 'Picked up',
            'in-transit': 'On the way',
            delivered: 'Delivered',
            declined: 'Rider declined; merchant can reassign',
            failed: 'Delivery issue; merchant will follow up',
            cancelled: 'Delivery cancelled'
        }[order.deliveryStatus] || '';
        const progress = orderSteps.map((step, index) =>
            `<span class="${index <= completedThrough ? 'complete' : ''}">${step === 'new' ? 'Received' : step[0].toUpperCase() + step.slice(1)}</span>`
        ).join('');
        const status = deliveryLabel || ({
            new: 'Order received',
            preparing: 'Being prepared',
            ready: 'Ready for rider',
            Delivered: 'Delivered',
            Cancelled: 'Cancelled'
        }[order.status] || order.status);
        const showLiveMap = order.deliveryId && ['accepted', 'assigned', 'picked-up', 'in-transit'].includes(order.deliveryStatus);
        const pickupAddress = order.pickupAddress || merchantPickupAddress;
        return `<article class="customer-order-card">
          <div class="customer-order-heading"><span>${escapeMerchantText(order.id)} · ${escapeMerchantText(order.merchant || 'Kirya merchant')}${order.demoSample ? ' · SAMPLE' : ''}</span><span class="customer-order-status">${escapeMerchantText(status)}</span></div>
          <p>${escapeMerchantText(order.items || '')}<br>${escapeMerchantText(order.total || '')}</p>
          ${pickupAddress ? `<p><strong>Pickup:</strong> ${escapeMerchantText(pickupAddress)}</p>` : ''}
          ${order.deliveryAddress ? `<p>Delivering to ${escapeMerchantText(order.deliveryAddress)}</p>` : ''}
          ${deliveryLabel ? `<p>${escapeMerchantText(deliveryLabel)}${order.rider ? ` · ${escapeMerchantText(order.rider)}` : ''}</p>` : ''}
          ${showLiveMap ? `<div class="customer-order-map" data-customer-order-map="${escapeMerchantText(order.id)}" role="region" aria-label="Live map for order ${escapeMerchantText(order.id)}"></div><p class="customer-order-map-status" data-customer-order-map-status="${escapeMerchantText(order.id)}">Waiting for the assigned rider's GPS location.</p>` : ''}
          ${order.cancellationReason ? `<p>Reason: ${escapeMerchantText(order.cancellationReason)}</p>` : ''}
          <div class="customer-order-progress">${progress}</div>
        </article>`;
    }).join('');
    initializeCustomerTrackingMaps();
    refreshLiveRiderMaps();
}

function openCustomerOrders() {
    const select = document.getElementById('customerDemoProfileSelect');
    if (select && !select.dataset.bound) {
        const sampleCustomers = merchantCustomers.filter(customer => customer.demoSample);
        select.innerHTML = `<option value="">Choose a sample profile to view demo orders</option>${sampleCustomers.map(customer => `<option value="${escapeMerchantText(customer.id)}">${escapeMerchantText(customer.name)} · ${escapeMerchantText(customer.address)}</option>`).join('')}`;
        select.addEventListener('change', () => {
            const customer = sampleCustomers.find(record => String(record.id) === select.value);
            if (!customer) return;
            userPhoneNumber = customer.phone;
            recipientDetails.phone = customer.phone;
            try {
                localStorage.setItem('kiryaCustomerPhone', customer.phone);
            } catch (error) {
                console.error('Unable to save selected demo customer.', error);
            }
            renderCustomerOrders();
        });
        select.dataset.bound = 'true';
    }
    renderCustomerOrders();
    document.getElementById('customerOrdersScreen').classList.add('active');
}

document.getElementById('customerOrdersBack')?.addEventListener('click', () => {
    document.getElementById('customerOrdersScreen').classList.remove('active');
});

function openAdmin() {
    document.getElementById('adminScreen').classList.add('active');
    renderAdminDemoMetrics();
    renderAdminMarketplaceRequests();
    renderAdminMarketplaceAudit();
    renderAdminRiderReview();
    renderAdminMarketplacePayouts();
    renderAdminRegionalMerchants();
    if (document.querySelector('.admin-section.active')?.dataset.section === 'approvals') {
        initAdminMarketplaceMap();
        setTimeout(() => adminMarketplaceMap?.invalidateSize(), 100);
    }
}

const marketplaceOfferSeed = [
    {
        id: 901,
        title: 'Family chicken biryani',
        description: 'Two sealed meal packs, ready for pickup now.',
        category: 'Food',
        icon: '🍛',
        vendorName: 'Al Reef Restaurant',
        pickupAddress: 'Kisementi, Kampala',
        pickupCoordinates: { latitude: 0.3371, longitude: 32.5864 },
        vendorCoordinates: { latitude: 0.3380, longitude: 32.5860 },
        dropoffAddress: 'Kololo, Kampala',
        dropoffArea: 'Kololo, Kampala',
        dropoffCoordinates: { latitude: 0.3219, longitude: 32.5940 },
        pickupToDropoffKm: 3.2,
        commissionAmount: 8000,
        status: 'available'
    },
    {
        id: 902,
        title: 'Fresh grocery basket',
        description: 'Fruit, bread, and household essentials packed by the vendor.',
        category: 'Groceries',
        icon: '🛍️',
        vendorName: 'Ntinda Fresh Market',
        pickupAddress: 'Ntinda Shopping Centre, Kampala',
        pickupCoordinates: { latitude: 0.3578, longitude: 32.6131 },
        vendorCoordinates: { latitude: 0.3585, longitude: 32.6123 },
        dropoffAddress: 'Naguru, Kampala',
        dropoffArea: 'Naguru, Kampala',
        dropoffCoordinates: { latitude: 0.3458, longitude: 32.6075 },
        pickupToDropoffKm: 2.6,
        commissionAmount: 7000,
        status: 'available'
    },
    {
        id: 903,
        title: 'Pharmacy parcel',
        description: 'A small, sealed pharmacy order. Handle with care.',
        category: 'Pharmacy',
        icon: '💊',
        vendorName: 'Wandegeya Pharmacy',
        pickupAddress: 'Wandegeya, Kampala',
        pickupCoordinates: { latitude: 0.3378, longitude: 32.5682 },
        vendorCoordinates: { latitude: 0.3385, longitude: 32.5690 },
        dropoffAddress: 'Rubaga, Kampala',
        dropoffArea: 'Rubaga, Kampala',
        dropoffCoordinates: { latitude: 0.3017, longitude: 32.5566 },
        pickupToDropoffKm: 5.1,
        commissionAmount: 9000,
        status: 'available'
    },
    ...ugandaRegionalOffers
];

function mergeDemoRecords(records, samples) {
    const existingIds = new Set(records.map(record => String(record.id)));
    const additions = samples.filter(record => !existingIds.has(String(record.id)));
    return [...records, ...additions.map(record => ({ ...record }))];
}

function isValidMarketplaceOffer(offer) {
    const validCoordinate = coordinate => coordinate &&
        Number.isFinite(coordinate.latitude) && Math.abs(coordinate.latitude) <= 90 &&
        Number.isFinite(coordinate.longitude) && Math.abs(coordinate.longitude) <= 180;
    return offer && Number.isInteger(offer.id) && typeof offer.title === 'string' &&
        typeof offer.description === 'string' && typeof offer.vendorName === 'string' &&
        typeof offer.pickupAddress === 'string' && typeof offer.dropoffArea === 'string' &&
        validCoordinate(offer.pickupCoordinates) && validCoordinate(offer.vendorCoordinates) && validCoordinate(offer.dropoffCoordinates) &&
        Number.isFinite(offer.pickupToDropoffKm) && Number.isFinite(offer.commissionAmount) &&
        ['available', 'requested', 'approved', 'rejected', 'delivered'].includes(offer.status);
}

function loadMarketplaceOffers() {
    try {
        const saved = localStorage.getItem('kiryaMarketplaceOffers');
        if (saved === null) {
            localStorage.setItem('kiryaMarketplaceOffers', JSON.stringify(marketplaceOfferSeed));
            return marketplaceOfferSeed.map(offer => ({ ...offer }));
        }
        const savedOffers = JSON.parse(saved).map(offer => ({
            ...offer,
            vendorCoordinates: offer.vendorCoordinates || offer.pickupCoordinates
        }));
        const offers = mergeDemoRecords(savedOffers, ugandaRegionalOffers);
        if (!Array.isArray(offers) || !offers.every(isValidMarketplaceOffer)) {
            throw new Error('Saved marketplace offers have an invalid format.');
        }
        if (offers.length !== savedOffers.length) localStorage.setItem('kiryaMarketplaceOffers', JSON.stringify(offers));
        return offers;
    } catch (error) {
        console.error('Unable to load marketplace offers.', error);
        return marketplaceOfferSeed.map(offer => ({ ...offer }));
    }
}

let marketplaceOffers = loadMarketplaceOffers();
let adminMarketplaceMap = null;
let adminMarketplaceMapControlsInitialized = false;
const adminMarketplaceMarkers = new Map();
const adminMarketplaceRouteCache = new Map();
const adminMarketplaceRouteRequests = new Set();
const adminMapDemoRiders = [
    { id: 'sample-car', name: 'Noah K. (sample)', vehicle: 'Car', availability: 'available', verificationStatus: 'verified demo', area: 'Naguru, Kampala', latitude: 0.3631, longitude: 32.6010 },
    { id: 'sample-walk', name: 'Patrick O. (sample)', vehicle: 'Walking', availability: 'available', verificationStatus: 'verified demo', area: 'Kampala Central', latitude: 0.3251, longitude: 32.5704 }
];

function saveMarketplaceOffers(offers) {
    try {
        localStorage.setItem('kiryaMarketplaceOffers', JSON.stringify(offers));
        marketplaceOffers = offers;
        return true;
    } catch (error) {
        console.error('Unable to save marketplace offers.', error);
        showToast('Marketplace changes could not be saved in this browser.');
        return false;
    }
}

const adminDashboardData = [
    { merchant: 'Spice Corner', order: '#8821', amount: 1250000, status: 'Cleared', type: 'revenue', role: 'merchant' },
    { merchant: 'Blue Bowl', order: '#8817', amount: 980000, status: 'Pending', type: 'orders', role: 'merchant' },
    { merchant: 'Pizza Kingdom', order: '#8799', amount: 1740000, status: 'Cleared', type: 'revenue', role: 'merchant' },
    { merchant: 'Fresh Mart', order: '#8783', amount: 640000, status: 'Flagged', type: 'compliance', role: 'merchant' },
    { merchant: 'Moses Rider', order: '#8771', amount: 420000, status: 'Verified', type: 'users', role: 'rider' },
    { merchant: 'Grace Admin', order: '#8759', amount: 310000, status: 'Active', type: 'users', role: 'user' },
    { merchant: 'Boda Hub', order: '#8745', amount: 2100000, status: 'Pending', type: 'orders', role: 'merchant' },
    { merchant: 'Kampala Eats', order: '#8732', amount: 1180000, status: 'Cleared', type: 'revenue', role: 'merchant' },
    ...ugandaRegionalTransactions
];

const adminUserData = [
    { name: 'J. Smith', role: 'Verified rider', group: 'riders', initials: 'JS', tone: 'green', action: 'View' },
    { name: 'A. Muwonge', role: 'Merchant', group: 'merchants', initials: 'AM', tone: 'blue', action: 'View' },
    { name: 'H. Kato', role: 'Customer', group: 'users', initials: 'HK', tone: 'amber', action: 'View' },
    { name: 'L. Gikonyo', role: 'Suspended', group: 'compliance', initials: 'LG', tone: 'red', action: 'Review' },
    ...ugandaRegionalRiders.map(rider => ({
        name: rider.name,
        role: `Sample rider · ${rider.area}`,
        group: 'riders',
        initials: rider.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
        tone: 'green',
        action: 'View'
    })),
    ...ugandaRegionalCustomers.map(customer => ({
        name: customer.name,
        role: `Sample customer · ${customer.address}`,
        group: 'users',
        initials: customer.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
        tone: 'amber',
        action: 'View'
    }))
];

function renderAdminDemoMetrics() {
    const sampleOrderValue = adminDashboardData
        .filter(record => ['orders', 'revenue'].includes(record.type))
        .reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const activeRiders = merchantPartners.filter(partner => partner.status === 'active');
    const availableRiders = activeRiders.filter(partner => partner.availability === 'available' && partner.verificationStatus === 'verified');
    const demoJobs = marketplaceOffers.length + demoActiveOrders.length + dummyPastOrders.length;
    const pendingReviews = marketplaceOffers.filter(offer => offer.status === 'requested').length +
        merchantPartners.filter(partner => partner.verificationStatus === 'pending').length;
    document.querySelector('[data-metric="revenue"]').textContent = formatMerchantCurrency(sampleOrderValue);
    document.getElementById('adminRiderSampleNote').textContent = `${availableRiders.length} available · sample GPS clearly labeled`;
    document.querySelector('[data-metric="riders"]').textContent = String(activeRiders.length);
    document.getElementById('adminOrderSampleNote').textContent = `${demoJobs} sample records · not live platform volume`;
    document.querySelector('[data-metric="orders"]').textContent = String(demoJobs);
    document.getElementById('adminAlertSampleNote').textContent = `${pendingReviews} pending rider reviews`;
    document.querySelector('[data-metric="alerts"]').textContent = String(pendingReviews);
}

const adminNavConfig = [
    { section: 'overview', icon: '◉', label: 'Overview', count: () => adminDashboardData.length + adminUserData.length },
    { section: 'users', icon: '👥', label: 'Users', count: () => adminUserData.length },
    { section: 'riders', icon: '🏍', label: 'Riders', count: () => 86 },
    { section: 'approvals', icon: '✓', label: 'Pickup approvals', count: () => marketplaceOffers.filter(offer => offer.status === 'requested').length },
    { section: 'merchants', icon: '🏪', label: 'Merchants', count: () => 28 },
    { section: 'payouts', icon: '💰', label: 'Payouts', count: () => 18 },
    { section: 'settings', icon: '⚙', label: 'Settings', count: () => 3 }
];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getStatusClass(status) {
    if (status === 'Cleared' || status === 'Verified' || status === 'Active') return 'success';
    if (status === 'Pending') return 'pending';
    return 'danger';
}

function renderAdminTable() {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    const search = (document.getElementById('adminSearchInput')?.value || '').trim().toLowerCase();
    const selectedFilter = document.querySelector('.admin-chip.active')?.dataset.filter || 'all';
    const sortValue = document.getElementById('adminSortSelect')?.value || 'newest';

    let rows = [...adminDashboardData].filter((row) => {
        const haystack = `${row.merchant} ${row.order} ${row.area || ''} ${row.status} ${row.type}`.toLowerCase();
        const matchesSearch = !search || haystack.includes(search);
        const matchesFilter = selectedFilter === 'all' || row.type === selectedFilter || row.role === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    rows.sort((a, b) => {
        if (sortValue === 'amount') return b.amount - a.amount;
        if (sortValue === 'merchant') return a.merchant.localeCompare(b.merchant);
        if (sortValue === 'status') return a.status.localeCompare(b.status);
        return b.amount - a.amount;
    });

    if (!rows.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-row">No transactions match this filter.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = rows.map((row) => `
        <tr>
            <td>${escapeHtml(row.merchant)}${row.area ? `<small class="admin-table-area">${escapeHtml(row.area)}</small>` : ''}</td>
            <td>${escapeHtml(row.order)}</td>
            <td>${row.amount >= 1000000 ? `UGX ${escapeHtml((row.amount / 1000000).toFixed(2))}M` : `UGX ${escapeHtml(Number(row.amount).toLocaleString('en-UG'))}`}</td>
            <td><span class="status-badge ${getStatusClass(row.status)}">${escapeHtml(row.status)}</span></td>
        </tr>
    `).join('');
}

let adminRegionalMerchantControlsBound = false;

function renderAdminRegionalMerchants() {
        const list = document.getElementById('adminRegionalMerchantList');
        const areaSelect = document.getElementById('adminRegionalMerchantArea');
        const count = document.getElementById('adminRegionalMerchantCount');
        if (!list || !areaSelect || !count) return;
        const selectedArea = areaSelect.value || 'all';
        const areas = [...new Set(ugandaRegionalMerchants.map(merchant => merchant.area))].sort((first, second) => first.localeCompare(second));
        areaSelect.innerHTML = `<option value="all">All Uganda regions</option>${areas.map(area => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join('')}`;
        areaSelect.value = areas.includes(selectedArea) ? selectedArea : 'all';
        const search = (document.getElementById('adminRegionalMerchantSearch')?.value || '').trim().toLowerCase();
        const selected = areaSelect.value;
        const merchants = ugandaRegionalMerchants.filter(merchant =>
                (selected === 'all' || merchant.area === selected) &&
                `${merchant.name} ${merchant.category} ${merchant.area} ${merchant.address}`.toLowerCase().includes(search)
        );
        count.textContent = String(merchants.length);
        list.innerHTML = merchants.length ? merchants.map(merchant => `
            <article class="admin-regional-merchant-card">
                <div><strong>${escapeHtml(merchant.name)}</strong><span>${escapeHtml(merchant.category)} · ${escapeHtml(merchant.area)}</span><small>${escapeHtml(merchant.address)} · ${merchant.ordersToday} sample orders today · ★ ${merchant.rating}</small></div>
                <span class="merchant-status-pill delivered">${escapeHtml(merchant.status)} · sample</span>
            </article>`).join('') : '<p class="admin-marketplace-empty">No sample merchants match this search.</p>';
        if (!adminRegionalMerchantControlsBound) {
                adminRegionalMerchantControlsBound = true;
                document.getElementById('adminRegionalMerchantSearch')?.addEventListener('input', renderAdminRegionalMerchants);
                areaSelect.addEventListener('change', renderAdminRegionalMerchants);
        }
}

function renderAdminUsers() {
    const list = document.getElementById('adminUserList');
    if (!list) return;

    const search = (document.getElementById('adminSearchInput')?.value || '').trim().toLowerCase();
    const selectedFilter = document.querySelector('.admin-chip.active')?.dataset.filter || 'all';

    let users = [...adminUserData].filter((user) => {
        const haystack = `${user.name} ${user.role} ${user.group}`.toLowerCase();
        const matchesSearch = !search || haystack.includes(search);
        const matchesFilter = selectedFilter === 'all' || user.group === selectedFilter || user.role.toLowerCase().includes(selectedFilter);
        return matchesSearch && matchesFilter;
    });

    if (!users.length) {
        list.innerHTML = '<div class="empty-state">No matching users found.</div>';
        return;
    }

    list.innerHTML = users.map((user) => `
        <div class="user-row">
            <div class="user-meta">
                <span class="user-avatar ${user.tone}">${escapeHtml(user.initials)}</span>
                <div>
                    <strong>${escapeHtml(user.name)}</strong>
                    <small>${escapeHtml(user.role)}</small>
                </div>
            </div>
            <button class="mini-btn ${user.action === 'Review' ? 'danger' : ''}" type="button">${escapeHtml(user.action)}</button>
        </div>
    `).join('');
}

function bindAdminDashboard() {
    const adminSearchInput = document.getElementById('adminSearchInput');
    const adminSortSelect = document.getElementById('adminSortSelect');
    const adminChips = document.querySelectorAll('.admin-chip');

    if (!adminSearchInput || !adminSortSelect || !adminChips.length) return;

    const refreshAdminDashboard = () => {
        renderAdminTable();
        renderAdminUsers();
    };

    adminSearchInput.addEventListener('input', refreshAdminDashboard);
    adminSortSelect.addEventListener('change', refreshAdminDashboard);

    adminChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            adminChips.forEach((item) => item.classList.toggle('active', item === chip));
            refreshAdminDashboard();
        });
    });

    refreshAdminDashboard();
}

function openShopPortal() {
    navigateMerchantView('dashboard');
    setTimeout(initMerchantCharts, 300); // Delay to ensure canvas is visible
}

function renderAdminNav() {
    const nav = document.getElementById('adminSidebarNav');
    if (!nav) return;

    const activeSection = document.querySelector('.admin-nav-item.active')?.dataset.section || 'overview';
    nav.innerHTML = adminNavConfig.map(({ section, label, icon, count }) => `
        <button class="admin-nav-item ${section === activeSection ? 'active' : ''}" data-section="${section}" type="button">
            <span class="admin-nav-label"><span class="admin-nav-icon">${icon}</span>${label}</span>
            <span class="admin-nav-badge">${count()}</span>
        </button>
    `).join('');

    bindAdminSectionNavigation();
}

function bindAdminSectionNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    const sections = document.querySelectorAll('.admin-section');

    if (!navItems.length || !sections.length) return;

    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            const sectionName = item.dataset.section;
            navItems.forEach((nav) => nav.classList.toggle('active', nav === item));
            sections.forEach((section) => {
                section.classList.toggle('active', section.dataset.section === sectionName);
            });
            const adminShell = document.querySelector('.admin-shell');
            if (adminShell && window.innerWidth <= 820) {
                adminShell.classList.remove('sidebar-open');
                const backdrop = document.getElementById('adminSidebarBackdrop');
                if (backdrop) backdrop.classList.remove('active');
                document.getElementById('adminMobileNavToggle')?.setAttribute('aria-expanded', 'false');
            }
            if (sectionName === 'overview') {
                renderAdminTable();
                renderAdminUsers();
            }
            if (sectionName === 'riders') renderAdminRiderReview();
            if (sectionName === 'approvals') renderAdminMarketplaceAudit();
            if (sectionName === 'merchants') renderAdminRegionalMerchants();
            if (sectionName === 'payouts') renderAdminMarketplacePayouts();
            if (sectionName === 'approvals') {
                initAdminMarketplaceMap();
                renderAdminMarketplaceMap();
                setTimeout(() => adminMarketplaceMap?.invalidateSize(), 100);
            }
        });
    });
}

function setupAdminMobileSidebar() {
    const toggleButton = document.getElementById('adminMobileNavToggle');
    const backdrop = document.getElementById('adminSidebarBackdrop');
    const adminShell = document.querySelector('.admin-shell');

    if (!toggleButton || !backdrop || !adminShell) return;

    toggleButton.addEventListener('click', () => {
        const isOpen = adminShell.classList.toggle('sidebar-open');
        backdrop.classList.toggle('active', isOpen);
        toggleButton.setAttribute('aria-expanded', String(isOpen));
    });

    backdrop.addEventListener('click', () => {
        adminShell.classList.remove('sidebar-open');
        backdrop.classList.remove('active');
        toggleButton.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        adminShell.classList.remove('sidebar-open');
        backdrop.classList.remove('active');
        toggleButton.setAttribute('aria-expanded', 'false');
    });
}

function setupGlobalNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const span = item.querySelector('span');
        if (!span) return;
        const text = span.textContent.trim();
        const roleApp = item.dataset.roleApp;

        if (['Cart', 'Orders', 'Rider', 'Admin', 'Shop', 'Profile'].includes(text)) {
            item.addEventListener('click', () => {
                if (text === 'Cart') openCart();
                else if (text === 'Orders') openCustomerOrders();
                else if (text === 'Rider') openRider();
                else if (text === 'Admin') openAdmin();
                else if (text === 'Shop') openShopPortal();
                else if (text === 'Profile') openProfile();
            });
            if (roleApp === 'orders') item.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCustomerOrders();
                }
            });
        }

        if (roleApp === 'rider') {
            item.title = 'Open rider screen';
        } else if (roleApp === 'admin') {
            item.title = 'Open admin screen';
        } else if (roleApp === 'merchant') {
            item.title = 'Open merchant screen';
        }
    });
}
renderAdminNav();
setupAdminMobileSidebar();
setupGlobalNavigation();
bindAdminDashboard();
document.getElementById('adminMarketplaceRequests')?.addEventListener('click', event => {
    const button = event.target.closest('[data-marketplace-review]');
    if (button) reviewMarketplaceRequest(button.dataset.marketplaceId, button.dataset.marketplaceReview);
});
document.getElementById('adminRiderReviewList')?.addEventListener('click', event => {
    const button = event.target.closest('[data-admin-rider-action]');
    if (button) reviewAdminRider(button.dataset.partnerId, button.dataset.adminRiderAction);
});
document.getElementById('adminMarketplacePayouts')?.addEventListener('click', event => {
    const button = event.target.closest('[data-marketplace-payout]');
    if (button) recordMarketplacePayout(button.dataset.marketplacePayout);
});

const sideMenuOverlay = document.getElementById('sideMenuOverlay');
if(sideMenuOverlay) sideMenuOverlay.addEventListener('click', closeProfile);

if(profileBackBtn) {
    profileBackBtn.addEventListener('click', () => {
        closeProfile();
    });
}

const profileEditPhoneBtn = document.getElementById('profileEditPhoneBtn');
if(profileEditPhoneBtn) {
    profileEditPhoneBtn.addEventListener('click', () => {
        const userPhoneScreen = document.getElementById('userPhoneScreen');
        if(userPhoneScreen) {
             // Reuse the existing phone screen logic to populate fields
             document.getElementById('checkoutUserPhoneSection').click();
        }
    });
}

// --- Rider operations ---
/* Rider Dashboard Logic */
let isRiderOnline = false;
let riderMap;
let riderLocationWatchId = null;
let riderLocationMarker = null;
let riderMarkerAnimationFrame = null;
let riderPickupMarker = null;
let riderPickupRouteLayer = null;
let riderPickupRouteController = null;
let riderPickupLastRouteOrigin = null;
let riderPickupLastRouteDestination = null;
let riderPickupLastRouteAt = 0;
let riderPickupRouteRequestId = 0;
let riderOrderTimer;
let riderPollTimer;
let riderCurrentStep = 0; // 0: Idle, 1: Pickup, 2: Dropoff
let riderSelectedPartnerId = null;
let riderPendingOfferId = null;
let riderWorkspaceInitialized = false;
let riderRenderedDeliveryKey = null;
const marketplaceDeliveryMarkers = new Map();
const marketplaceDestinationMarkers = new Map();
const marketplaceRouteLines = new Map();
let merchantRiderTrackingMap = null;
let merchantRiderTrackingMarkers = new Map();
let merchantPickupMap = null;
let merchantPickupMarker = null;
let merchantTrackingStoreMarker = null;
let customerTrackingMaps = new Map();
let liveRiderMapRefreshTimer = null;
const riderLocationStorageKey = 'kiryaRiderLiveLocations';
const riderLocationMaxAgeMs = 120000;
let riderLocationIsDemo = false;
let riderDemoRegion = (() => {
    try {
        const saved = localStorage.getItem('kiryaRiderDemoRegion');
        return ['live', 'kampala', 'wakiso', 'entebbe', 'jinja', 'mbarara', 'gulu', 'mbale', 'fort portal', 'masaka', 'lira'].includes(saved) ? saved : 'live';
    } catch (error) {
        return 'live';
    }
})();
let customerTrackingOrders = [];

const riderPartnerFallback = [
    { id: 1, name: 'James M.', phone: '+256 700 111222', email: 'james@example.com', vehicle: 'Motorcycle', area: 'Ntinda, Kampala', status: 'active', availability: 'off-duty', verificationStatus: 'verified', sampleCoordinates: { latitude: 0.3578, longitude: 32.6131 } },
    { id: 2, name: 'Grace N.', phone: '+256 780 333444', email: 'grace@example.com', vehicle: 'Motorcycle', area: 'Bugolobi, Kampala', status: 'active', availability: 'off-duty', verificationStatus: 'verified', sampleCoordinates: { latitude: 0.3080, longitude: 32.6240 } },
    ...ugandaRegionalRiders
];
const ugandaDemoAreaCenters = {
    kampala: { latitude: 0.3476, longitude: 32.5825 },
    wakiso: { latitude: 0.3476, longitude: 32.5825 },
    entebbe: { latitude: 0.0515, longitude: 32.4634 },
    jinja: { latitude: 0.4247, longitude: 33.2042 },
    mbarara: { latitude: -0.6077, longitude: 30.6540 },
    gulu: { latitude: 2.7742, longitude: 32.2995 },
    mbale: { latitude: 1.0780, longitude: 34.1805 },
    'fort portal': { latitude: 0.6705, longitude: 30.2745 },
    masaka: { latitude: -0.3333, longitude: 31.7336 },
    lira: { latitude: 2.2494, longitude: 32.8994 }
};

function getRiderDemoPosition(partner) {
    if (riderDemoRegion !== 'live' && ugandaDemoAreaCenters[riderDemoRegion]) return ugandaDemoAreaCenters[riderDemoRegion];
    if (partner?.sampleCoordinates) return partner.sampleCoordinates;
    const area = String(partner?.area || '').toLowerCase();
    const match = Object.entries(ugandaDemoAreaCenters).find(([name]) => area.includes(name));
    return match?.[1] || ugandaDemoAreaCenters.kampala;
}
const riderActiveStatuses = ['accepted', 'assigned', 'picked-up', 'in-transit'];

function readRiderCollection(key, fallback = []) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback.map(record => ({ ...record }));
        const records = JSON.parse(raw);
        if (!Array.isArray(records)) throw new Error(`Saved ${key} data is not a list.`);
        if (key === 'kiryaMerchantPartners') {
            return records.map(partner => ({
                ...partner,
                verificationStatus: ['verified', 'pending', 'rejected'].includes(partner.verificationStatus) ? partner.verificationStatus : 'verified',
                adminAudit: Array.isArray(partner.adminAudit) ? partner.adminAudit : []
            }));
        }
        return records;
    } catch (error) {
        console.error(`Unable to read rider workflow data for ${key}.`, error);
        showToast('Rider data could not be loaded. Refresh and try again.');
        return null;
    }
}

function readLiveRiderLocations() {
    try {
        const raw = localStorage.getItem(riderLocationStorageKey);
        if (raw === null) return [];
        const locations = JSON.parse(raw);
        if (!Array.isArray(locations) || locations.some(location =>
            !location || !Number.isInteger(Number(location.partnerId)) ||
            !Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 ||
            !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180 ||
            !Number.isFinite(Date.parse(location.updatedAt))
        )) throw new Error('Saved rider locations are invalid.');
        return locations;
    } catch (error) {
        console.error('Unable to read live rider locations.', error);
        showToast('Live rider locations could not be loaded.');
        return null;
    }
}

function writeLiveRiderLocations(locations) {
    try {
        localStorage.setItem(riderLocationStorageKey, JSON.stringify(locations));
        return true;
    } catch (error) {
        console.error('Unable to share the live rider location.', error);
        showToast('Your live location could not be shared on this device.');
        return false;
    }
}

function liveRiderMarkerIcon() {
    return L.divIcon({
        className: 'live-rider-marker',
        html: '<img src="assets/Delivery%20Guy%20on%20Bicycle%2C%20Cycle%2C%20and%20Bike.svg" alt="">',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
    });
}

function createTrackingMap(element) {
    const streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; OpenStreetMap contributors &copy; Esri',
        maxZoom: 19
    });
    return L.map(element, { zoomControl: true, layers: [streetLayer] }).setView([0.3476, 32.5825], 12);
}

function merchantStoreMarkerIcon() {
    return L.divIcon({
        className: 'merchant-store-marker',
        html: '<span aria-hidden="true">🏪</span>',
        iconSize: [42, 42],
        iconAnchor: [21, 21]
    });
}

function updateStoreMarker(mapInstance, marker) {
    if (!mapInstance) return marker;
    if (!merchantPickupCoordinates) {
        marker?.remove();
        return null;
    }
    const position = [merchantPickupCoordinates.latitude, merchantPickupCoordinates.longitude];
    const popup = `${escapeMerchantText(merchantPickupAddress || 'Merchant pickup location')}`;
    if (marker) {
        marker.setLatLng(position);
        marker.setPopupContent(popup);
        if (mapInstance === merchantRiderTrackingMap && merchantRiderTrackingMarkers.size === 0) {
            mapInstance.setView(position, 14);
        }
        return marker;
    }
    const storeMarker = L.marker(position, {
        icon: merchantStoreMarkerIcon(),
        draggable: mapInstance === merchantPickupMap
    }).addTo(mapInstance).bindPopup(popup);
    if (mapInstance === merchantRiderTrackingMap && merchantRiderTrackingMarkers.size === 0) {
        mapInstance.setView(position, 14);
    }
    if (mapInstance === merchantPickupMap) {
        storeMarker.on('dragend', event => selectMerchantPickupLocation(event.target.getLatLng()));
    }
    return storeMarker;
}

function updateMerchantPickupMarkers() {
    merchantPickupMarker = updateStoreMarker(merchantPickupMap, merchantPickupMarker);
    merchantTrackingStoreMarker = updateStoreMarker(merchantRiderTrackingMap, merchantTrackingStoreMarker);
}

async function selectMerchantPickupLocation(latlng) {
    merchantPickupCoordinates = { latitude: latlng.lat, longitude: latlng.lng };
    updateMerchantPickupMarkers();
    const input = document.getElementById('merchantPickupAddress');
    const status = document.getElementById('merchantPickupAddressStatus');
    if (status) status.textContent = 'Map location selected. Looking up the street address…';
    const selectedCoordinates = merchantPickupCoordinates;
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=en&language=en`);
        if (!response.ok) throw new Error(`Address lookup failed with status ${response.status}.`);
        const result = await response.json();
        if (merchantPickupCoordinates !== selectedCoordinates) return;
        const address = result.address
            ? [result.address.road, result.address.house_number, result.address.suburb || result.address.village, result.address.city || result.address.town || result.address.state, result.address.country].filter(Boolean).join(', ')
            : result.display_name;
        if (address) input.value = address.slice(0, 180);
        if (status) status.textContent = address
            ? 'Address found. Save pickup location to confirm this map pin.'
            : `Map pin selected at ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}. Enter an address and save.`;
    } catch (error) {
        console.error('Unable to look up the selected merchant pickup address.', error);
        if (status) status.textContent = `Map pin selected at ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}. Enter an address and save.`;
    }
}

function initMerchantPickupMap() {
    const element = document.getElementById('merchantPickupMap');
    if (!element || merchantPickupMap) return;
    merchantPickupMap = createTrackingMap(element);
    if (merchantPickupCoordinates) {
        merchantPickupMap.setView([merchantPickupCoordinates.latitude, merchantPickupCoordinates.longitude], 15);
    }
    merchantPickupMap.on('click', event => selectMerchantPickupLocation(event.latlng));
    updateMerchantPickupMarkers();
    merchantPickupMarker?.on('dragend', event => selectMerchantPickupLocation(event.target.getLatLng()));
}

function ensureLiveRiderMapRefresh() {
    if (liveRiderMapRefreshTimer === null) {
        liveRiderMapRefreshTimer = setInterval(refreshLiveRiderMaps, 30000);
    }
}

function getFreshRiderLocation(locations, partnerId) {
    const location = locations.find(record => String(record.partnerId) === String(partnerId));
    return location && Date.now() - Date.parse(location.updatedAt) <= riderLocationMaxAgeMs
        ? location
        : null;
}

function updateRiderPickupDestination() {
    if (!riderMap) return;
    const delivery = getRiderActiveDelivery(readRiderDeliveries() || [], riderCurrentPartner());
    const coordinates = delivery?.marketplace ? delivery.pickupCoordinates : merchantPickupCoordinates;
    const address = delivery?.marketplace ? delivery.pickupAddress : merchantPickupAddress;
    if (!coordinates) {
        riderPickupMarker?.remove();
        riderPickupMarker = null;
        return;
    }
    const position = [coordinates.latitude, coordinates.longitude];
    const popup = `${escapeMerchantText(delivery?.marketplace ? delivery.merchantName : merchantProfile.name)} · ${escapeMerchantText(address || 'Pickup location')}`;
    if (riderPickupMarker) {
        riderPickupMarker.setLatLng(position);
        riderPickupMarker.setPopupContent(popup);
        return;
    }
    riderPickupMarker = L.marker(position, { icon: merchantStoreMarkerIcon() })
        .addTo(riderMap)
        .bindPopup(popup);
}

function distanceBetweenCoordinates(first, second) {
    const toRadians = value => value * Math.PI / 180;
    const latitudeDelta = toRadians(second.lat - first.lat);
    const longitudeDelta = toRadians(second.lng - first.lng);
    const value = Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(toRadians(first.lat)) * Math.cos(toRadians(second.lat)) *
        Math.sin(longitudeDelta / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getRiderMarketplacePosition() {
    const liveMarkerLocation = riderLocationMarker?.getLatLng();
    if (liveMarkerLocation) return { position: liveMarkerLocation, source: riderLocationIsDemo ? 'demo area' : 'live GPS' };
    const partner = riderCurrentPartner();
    const storedLocation = partner && getFreshRiderLocation(readLiveRiderLocations() || [], partner.id);
    if (storedLocation) return { position: { lat: storedLocation.latitude, lng: storedLocation.longitude }, source: storedLocation.demoSample ? 'demo area' : 'live GPS' };
    const sample = getRiderDemoPosition(partner);
    return { position: { lat: sample.latitude, lng: sample.longitude }, source: 'sample area' };
}

function getOfferDistanceFromRider(offer) {
    const { position, source } = getRiderMarketplacePosition();
    const pickup = { lat: offer.pickupCoordinates.latitude, lng: offer.pickupCoordinates.longitude };
    return {
        distanceKm: distanceBetweenCoordinates(position, pickup) / 1000,
        source
    };
}

function marketplaceOfferIcon(offer) {
    const commission = Math.round(offer.commissionAmount / 1000);
    return L.divIcon({
        className: 'marketplace-delivery-marker',
        html: `<span aria-hidden="true">${escapeMerchantText(offer.icon || '📦')}</span><b>UGX ${commission}k</b>`,
        iconSize: [86, 58],
        iconAnchor: [43, 48]
    });
}

function marketplaceOfferPopup(offer) {
    const riderDistance = getOfferDistanceFromRider(offer);
    const isRequestable = isRiderOnline && riderCurrentPartner()?.status === 'active';
    return `<article class="marketplace-offer-popup">
      <span class="marketplace-offer-category">${escapeMerchantText(offer.category || 'Delivery')}</span>
    <h3>${escapeMerchantText(offer.orderNumber || `MAP-${offer.id}`)} · ${escapeMerchantText(offer.title)}</h3>
    <p>${escapeMerchantText(offer.customerName || 'Sample customer')} · ${escapeMerchantText(offer.dropoffArea)}</p>
      <p>${escapeMerchantText(offer.description)}</p>
      <strong class="marketplace-commission">Rider commission · ${formatMerchantCurrency(offer.commissionAmount)}</strong>
      <dl><div><dt>Pickup</dt><dd>${escapeMerchantText(offer.pickupAddress)}</dd></div>
        <div><dt>Drop-off area</dt><dd>${escapeMerchantText(offer.dropoffArea)}</dd></div>
        <div><dt>Pickup to drop-off</dt><dd>~${Number(offer.pickupToDropoffKm).toFixed(1)} km route estimate</dd></div>
        <div><dt>Pickup from you</dt><dd>${riderDistance.distanceKm.toFixed(1)} km · ${escapeMerchantText(riderDistance.source)} straight-line estimate</dd></div></dl>
      <button type="button" data-marketplace-request="${offer.id}" ${isRequestable ? '' : 'disabled'}>${isRequestable ? 'Request this pickup' : 'Go online to request'}</button>
      <small>Admin approval is required before the vendor receives a confirmed rider assignment.</small>
    </article>`;
}

function adminMapIcon(className, markup, iconSize = [40, 42], iconAnchor = [20, 36]) {
    return L.divIcon({ className: `admin-map-transparent-icon ${className}`, html: markup, iconSize, iconAnchor });
}

function adminRiderMapIcon(vehicle, isStale = false) {
    const value = String(vehicle || '').toLowerCase();
    const symbol = /car|van|auto/.test(value) ? '🚗' : /walk|foot/.test(value) ? '🚶' : /bicycle|cycle/.test(value) ? '🚲' : '🏍️';
    return adminMapIcon(`admin-map-rider-icon${isStale ? ' stale' : ''}`, `<span aria-hidden="true">${symbol}</span>`);
}

function upsertAdminMarketplaceMarker(key, position, icon, popupContent) {
    let marker = adminMarketplaceMarkers.get(key);
    if (!marker) {
        marker = L.marker(position, { icon, keyboard: true }).addTo(adminMarketplaceMap);
        marker.bindPopup(popupContent, { maxWidth: 300 });
        marker.bindTooltip(popupContent, { direction: 'top', sticky: true, opacity: 0.98, className: 'admin-map-hover-tooltip' });
        adminMarketplaceMarkers.set(key, marker);
    } else {
        marker.setLatLng(position);
        marker.setIcon(icon);
        marker.setPopupContent(popupContent);
        marker.setTooltipContent(popupContent);
    }
    return marker;
}

function readAdminMarketplaceMapFilters() {
    return {
        status: document.getElementById('adminMapStatusFilter')?.value || 'all',
        category: document.getElementById('adminMapCategoryFilter')?.value || 'all',
        vehicle: document.getElementById('adminMapVehicleFilter')?.value || 'all',
        area: (document.getElementById('adminMapAreaFilter')?.value || '').trim().toLowerCase(),
        showRiders: document.getElementById('adminMapShowRiders')?.checked !== false,
        showVendors: document.getElementById('adminMapShowVendors')?.checked !== false,
        showItems: document.getElementById('adminMapShowItems')?.checked !== false,
        showDropoffs: document.getElementById('adminMapShowDropoffs')?.checked !== false
    };
}

function fitAdminMarketplaceMapToVisibleMarkers() {
    if (!adminMarketplaceMap) return;
    const points = [...adminMarketplaceMarkers.values()]
        .filter(marker => typeof marker.getLatLng === 'function')
        .map(marker => marker.getLatLng());
    if (!points.length) {
        showToast('No visible map markers match these filters.');
        return;
    }
    adminMarketplaceMap.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15, animate: true });
}

function formatLocationAge(updatedAt) {
    const ageSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(updatedAt)) / 1000));
    if (ageSeconds < 60) return `${ageSeconds}s ago`;
    if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m ago`;
    return `${Math.floor(ageSeconds / 3600)}h ago`;
}

function requestAdminMarketplaceRoute(offer, routeCoordinates) {
    const key = String(offer.id);
    if (adminMarketplaceRouteCache.has(key) || adminMarketplaceRouteRequests.has(key) ||
        adminMarketplaceRouteCache.size + adminMarketplaceRouteRequests.size >= 3) return;
    adminMarketplaceRouteRequests.add(key);
    const [pickup, dropoff] = routeCoordinates;
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}?overview=full&geometries=geojson&steps=false`;
    fetch(routeUrl).then(response => {
        if (!response.ok) throw new Error(`Route request failed with status ${response.status}.`);
        return response.json();
    }).then(result => {
        const route = result.code === 'Ok' ? result.routes?.[0] : null;
        if (!route?.geometry?.coordinates?.length) throw new Error('No road route was returned.');
        adminMarketplaceRouteCache.set(key, {
            coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
            distanceKm: route.distance / 1000,
            durationMinutes: Math.max(1, Math.round(route.duration / 60))
        });
        renderAdminMarketplaceMap();
    }).catch(error => {
        console.warn(`Admin map route estimate unavailable for job ${key}.`, error);
        adminMarketplaceRouteCache.set(key, { unavailable: true });
        renderAdminMarketplaceMap();
    }).finally(() => adminMarketplaceRouteRequests.delete(key));
}

function bindAdminMarketplaceMapControls() {
    if (adminMarketplaceMapControlsInitialized) return;
    adminMarketplaceMapControlsInitialized = true;
    ['adminMapStatusFilter', 'adminMapCategoryFilter', 'adminMapVehicleFilter'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderAdminMarketplaceMap);
    });
    document.getElementById('adminMapAreaFilter')?.addEventListener('input', renderAdminMarketplaceMap);
    ['adminMapShowRiders', 'adminMapShowVendors', 'adminMapShowItems', 'adminMapShowDropoffs'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderAdminMarketplaceMap);
    });
    document.getElementById('adminMapFitVisible')?.addEventListener('click', fitAdminMarketplaceMapToVisibleMarkers);
}

function initAdminMarketplaceMap() {
    const element = document.getElementById('adminMarketplaceMap');
    if (!element || adminMarketplaceMap) return;
    adminMarketplaceMap = createTrackingMap(element);
    adminMarketplaceMap.setView([1.15, 32.35], 6);
    ensureLiveRiderMapRefresh();
    bindAdminMarketplaceMapControls();
    renderAdminMarketplaceMap();
}

function renderAdminMarketplaceMap() {
    if (!adminMarketplaceMap) return;
    const filters = readAdminMarketplaceMapFilters();
    const visibleKeys = new Set();
    const riderLocations = readLiveRiderLocations() || [];
    const status = document.getElementById('adminMapDataStatus');
    const samplePositions = [
        { latitude: 0.3476, longitude: 32.5825 },
        { latitude: 0.3536, longitude: 32.5915 },
        { latitude: 0.3415, longitude: 32.5740 }
    ];
    const vehicleMatches = (vehicle, selected) => selected === 'all' ||
        (selected === 'car' ? /car|van|auto/i.test(vehicle) :
            selected === 'walking' ? /walk|foot/i.test(vehicle) : /bike|motorcycle|bicycle|cycle/i.test(vehicle));
    const riderSearchMatches = rider => !filters.area || `${rider.name} ${rider.area}`.toLowerCase().includes(filters.area);
    const partners = (merchantPartners || []).filter(partner => partner.status === 'active');
    const riderRows = filters.showRiders ? partners.map((partner, index) => {
        const savedLocation = riderLocations.find(record => String(record.partnerId) === String(partner.id));
        const freshLocation = partner.availability === 'available' ? getFreshRiderLocation(riderLocations, partner.id) : null;
        const staleLocation = savedLocation && Date.now() - Date.parse(savedLocation.updatedAt) > riderLocationMaxAgeMs
            ? savedLocation
            : null;
        const location = freshLocation || staleLocation;
        const sample = partner.sampleCoordinates || samplePositions[index % samplePositions.length];
        return {
            id: `partner-${partner.id}`,
            name: partner.name,
            vehicle: partner.vehicle,
            availability: partner.availability || 'available',
            verificationStatus: partner.verificationStatus || 'pending',
            latitude: location?.latitude ?? sample.latitude,
            longitude: location?.longitude ?? sample.longitude,
            area: partner.area || '',
            live: Boolean(freshLocation && !freshLocation.demoSample),
            demo: Boolean(freshLocation?.demoSample),
            stale: Boolean(staleLocation),
            updatedAt: location?.updatedAt
        };
    }).filter(rider => vehicleMatches(rider.vehicle, filters.vehicle) && riderSearchMatches(rider)) : [];
    if (filters.showRiders) {
        riderRows.push(...adminMapDemoRiders.filter(rider =>
            vehicleMatches(rider.vehicle, filters.vehicle) && riderSearchMatches(rider)
        ));
    }
    riderRows.forEach(rider => {
        const key = `rider:${rider.id}`;
        visibleKeys.add(key);
        const locationLabel = rider.live
            ? `Live GPS · ${formatLocationAge(rider.updatedAt)}`
            : rider.demo ? `Demo location · ${formatLocationAge(rider.updatedAt)}`
                : rider.stale ? `STALE GPS · last update ${formatLocationAge(rider.updatedAt)}` : 'Sample position · not live';
        upsertAdminMarketplaceMarker(key, [rider.latitude, rider.longitude], adminRiderMapIcon(rider.vehicle, rider.stale),
            `<strong>${escapeMerchantText(rider.name)}</strong><br>${escapeMerchantText(rider.vehicle)} rider · ${escapeMerchantText(rider.availability)}<br>Verification: ${escapeMerchantText(rider.verificationStatus || 'verified demo')}<br>${escapeMerchantText(rider.area || 'Kampala')}<br>${escapeMerchantText(locationLabel)}`);
    });

    const visibleOffers = marketplaceOffers.filter(offer =>
        ['available', 'requested', 'approved'].includes(offer.status) &&
        (filters.status === 'all' || filters.status === offer.status) &&
        (filters.category === 'all' || filters.category.toLowerCase() === String(offer.category || '').toLowerCase()) &&
        (!filters.area || `${offer.vendorName} ${offer.pickupAddress} ${offer.dropoffArea}`.toLowerCase().includes(filters.area))
    );
    visibleOffers.forEach(offer => {
        const id = String(offer.id);
        const pickup = [offer.pickupCoordinates.latitude, offer.pickupCoordinates.longitude];
        const vendor = [offer.vendorCoordinates.latitude, offer.vendorCoordinates.longitude];
        const dropoff = [offer.dropoffCoordinates.latitude, offer.dropoffCoordinates.longitude];
        const vendorKey = `vendor:${id}`;
        const itemKey = `item:${id}`;
        const dropoffKey = `dropoff:${id}`;
        if (filters.showVendors) {
            visibleKeys.add(vendorKey);
            upsertAdminMarketplaceMarker(vendorKey, vendor,
                adminMapIcon('admin-map-vendor-icon', '<span aria-hidden="true">🏪</span>'),
                `<strong>${escapeMerchantText(offer.vendorName)}</strong><br>${escapeMerchantText(offer.pickupAddress)}<br>Vendor pickup point`);
        }
        if (filters.showItems) {
            visibleKeys.add(itemKey);
            const routeEstimate = adminMarketplaceRouteCache.get(id);
            const estimateText = routeEstimate && !routeEstimate.unavailable
                ? `Road route: ${routeEstimate.distanceKm.toFixed(1)} km · about ${routeEstimate.durationMinutes} min`
                : `Sample estimate: ~${Number(offer.pickupToDropoffKm).toFixed(1)} km`;
            upsertAdminMarketplaceMarker(itemKey, pickup,
                adminMapIcon('admin-map-item-icon', `<span aria-hidden="true">${escapeMerchantText(offer.icon || '📦')}</span><b>${formatMerchantCurrency(offer.commissionAmount)}</b>`, [118, 54], [59, 46]),
                `<strong>${escapeMerchantText(offer.orderNumber || `MAP-${offer.id}`)} · ${escapeMerchantText(offer.title)}</strong><br>${escapeMerchantText(offer.description)}<br>${escapeMerchantText(offer.customerName || 'Sample customer')}<br>${escapeMerchantText(offer.vendorName)}<br>Commission: ${formatMerchantCurrency(offer.commissionAmount)}<br>${escapeMerchantText(estimateText)}<br>Status: ${escapeMerchantText(offer.status)}`);
            const routeKey = `route:${id}`;
            visibleKeys.add(routeKey);
            const existingRoute = adminMarketplaceMarkers.get(routeKey);
            const lineCoordinates = routeEstimate?.coordinates || [pickup, dropoff];
            if (existingRoute) {
                existingRoute.setLatLngs(lineCoordinates);
                existingRoute.setStyle({ dashArray: routeEstimate?.coordinates ? null : '5 7' });
            }
            else adminMarketplaceMarkers.set(routeKey, L.polyline(lineCoordinates, { color: '#147b68', weight: 3, opacity: 0.72, dashArray: routeEstimate?.coordinates ? null : '5 7', interactive: false }).addTo(adminMarketplaceMap));
            requestAdminMarketplaceRoute(offer, [pickup, dropoff]);
        }
        if (filters.showDropoffs) {
            visibleKeys.add(dropoffKey);
            upsertAdminMarketplaceMarker(dropoffKey, dropoff,
                adminMapIcon('admin-map-dropoff-icon', '<span aria-hidden="true">📍</span>'),
                `<strong>Customer drop-off</strong><br>${escapeMerchantText(offer.dropoffArea)}<br>Approximate destination; exact address hidden`);
        }
    });

    const dataStatus = `${riderRows.filter(rider => rider.live).length} live GPS · ${riderRows.filter(rider => rider.stale).length} stale GPS · ${riderRows.filter(rider => !rider.live && !rider.stale).length} sample rider positions · ${visibleOffers.length} matching jobs`;
    const routedCount = visibleOffers.filter(offer => {
        const estimate = adminMarketplaceRouteCache.get(String(offer.id));
        return estimate && !estimate.unavailable;
    }).length;
    if (status) status.textContent = `${dataStatus}. ${routedCount} road routes calculated; remaining routes use labeled sample estimates.`;

    for (const [key, marker] of adminMarketplaceMarkers) {
        if (!visibleKeys.has(key)) {
            marker.remove();
            adminMarketplaceMarkers.delete(key);
        }
    }
}

function renderMarketplaceMapOffers() {
    const count = document.getElementById('riderMarketplaceCount');
    const partner = riderCurrentPartner();
    const riderPosition = getRiderMarketplacePosition().position;
    const offers = marketplaceOffers.filter(offer => {
        if (offer.status !== 'available') return false;
        const pickup = { lat: offer.pickupCoordinates.latitude, lng: offer.pickupCoordinates.longitude };
        return distanceBetweenCoordinates(riderPosition, pickup) / 1000 <= 35;
    });
    if (count) count.textContent = `${offers.length} nearby · ${partner?.area || 'Uganda'}`;
    if (!riderMap) return;
    const offerIds = new Set(offers.map(offer => String(offer.id)));
    for (const [id, marker] of marketplaceDeliveryMarkers) {
        if (!offerIds.has(id)) {
            marker.remove();
            marketplaceDeliveryMarkers.delete(id);
            marketplaceDestinationMarkers.get(id)?.remove();
            marketplaceDestinationMarkers.delete(id);
            marketplaceRouteLines.get(id)?.remove();
            marketplaceRouteLines.delete(id);
        }
    }
    offers.forEach(offer => {
        const id = String(offer.id);
        let marker = marketplaceDeliveryMarkers.get(id);
        const position = [offer.pickupCoordinates.latitude, offer.pickupCoordinates.longitude];
        const tooltip = `<strong>${escapeMerchantText(offer.title)}</strong><br>${escapeMerchantText(offer.description)}<br><b>${formatMerchantCurrency(offer.commissionAmount)}</b>`;
        if (!marker) {
            marker = L.marker(position, { icon: marketplaceOfferIcon(offer), keyboard: true }).addTo(riderMap);
            marker.bindTooltip(tooltip, { direction: 'top', sticky: true, opacity: 0.98 });
            marker.bindPopup(marketplaceOfferPopup(offer), { maxWidth: 320, minWidth: 260 });
            marker.on('popupopen', event => {
                const button = event.popup.getElement()?.querySelector('[data-marketplace-request]');
                button?.addEventListener('click', () => requestMarketplaceDelivery(button.dataset.marketplaceRequest), { once: true });
            });
            marketplaceDeliveryMarkers.set(id, marker);
        } else {
            marker.setLatLng(position);
            marker.setIcon(marketplaceOfferIcon(offer));
            marker.setTooltipContent(tooltip);
            marker.setPopupContent(marketplaceOfferPopup(offer));
        }
        const destination = [offer.dropoffCoordinates.latitude, offer.dropoffCoordinates.longitude];
        let destinationMarker = marketplaceDestinationMarkers.get(id);
        if (!destinationMarker) {
            destinationMarker = L.marker(destination, {
                icon: L.divIcon({
                    className: 'marketplace-dropoff-marker',
                    html: '<span>DROP</span>',
                    iconSize: [54, 22],
                    iconAnchor: [27, 11]
                })
            }).addTo(riderMap).bindTooltip(`Approximate drop-off · ${escapeMerchantText(offer.dropoffArea)}`, { direction: 'top' });
            marketplaceDestinationMarkers.set(id, destinationMarker);
        } else {
            destinationMarker.setLatLng(destination);
            destinationMarker.setTooltipContent(`Approximate drop-off · ${escapeMerchantText(offer.dropoffArea)}`);
        }
        const routeCoordinates = [position, destination];
        let routeLine = marketplaceRouteLines.get(id);
        if (!routeLine) {
            routeLine = L.polyline(routeCoordinates, { color: '#087a67', weight: 2, opacity: 0.58, dashArray: '5 7', interactive: false }).addTo(riderMap);
            marketplaceRouteLines.set(id, routeLine);
        } else {
            routeLine.setLatLngs(routeCoordinates);
        }
    });
}

function requestMarketplaceDelivery(offerId) {
    const partner = riderCurrentPartner();
    if (!partner || partner.status !== 'active' || partner.verificationStatus !== 'verified' || !isRiderOnline || partner.availability !== 'available') {
        showToast('Go online with an active, verified rider account before requesting a pickup.');
        return;
    }
    const deliveries = readRiderDeliveries();
    if (!deliveries) return;
    if (getRiderActiveDelivery(deliveries, partner)) {
        showToast('Complete your current delivery before requesting another pickup.');
        return;
    }
    const offer = marketplaceOffers.find(record => String(record.id) === String(offerId));
    if (!offer || offer.status !== 'available') {
        showToast('This pickup is no longer available.');
        renderMarketplaceMapOffers();
        return;
    }
    const requestedAt = new Date().toISOString();
    const nextOffers = marketplaceOffers.map(record => String(record.id) === String(offer.id)
        ? {
            ...record,
            status: 'requested',
            requestedPartnerId: partner.id,
            requestedPartnerName: partner.name,
            requestedPartnerPhone: partner.phone,
            requestedAt,
            statusHistory: [...(record.statusHistory || []), { status: 'requested', at: requestedAt, actor: partner.name }]
        }
        : record
    );
    if (!saveMarketplaceOffers(nextOffers)) return;
    renderMarketplaceMapOffers();
    renderAdminMarketplaceMap();
    renderAdminMarketplaceRequests();
    renderAdminMarketplaceAudit();
    renderAdminDemoMetrics();
    renderAdminNav();
    showToast(`Request sent for ${offer.title}. Waiting for admin approval.`);
}

function renderAdminMarketplaceRequests() {
    const list = document.getElementById('adminMarketplaceRequests');
    const count = document.getElementById('adminMarketplaceRequestCount');
    if (!list || !count) return;
    const requests = marketplaceOffers.filter(offer => offer.status === 'requested');
    count.textContent = `${requests.length} pending`;
    list.innerHTML = requests.length ? requests.map(offer => `
      <article class="admin-marketplace-request">
        <div><span class="marketplace-offer-category">${escapeMerchantText(offer.category || 'Delivery')}</span><h4>${escapeMerchantText(offer.title)}</h4>
          <p>${escapeMerchantText(offer.description)}</p><p><strong>${escapeMerchantText(offer.requestedPartnerName || 'Rider')}</strong> · ${escapeMerchantText(offer.requestedPartnerPhone || '')}</p>
          <p>${escapeMerchantText(offer.vendorName)} · ${escapeMerchantText(offer.pickupAddress)} → ${escapeMerchantText(offer.dropoffArea)}</p>
          <strong>${formatMerchantCurrency(offer.commissionAmount)} · ~${Number(offer.pickupToDropoffKm).toFixed(1)} km</strong></div>
        <div class="admin-marketplace-actions"><button type="button" data-marketplace-review="approve" data-marketplace-id="${offer.id}">Approve &amp; notify vendor</button><button type="button" class="reject" data-marketplace-review="reject" data-marketplace-id="${offer.id}">Reject</button></div>
      </article>`).join('') : '<div class="admin-marketplace-empty">No rider pickup requests are waiting for approval.</div>';
}

function renderAdminMarketplaceAudit() {
    const list = document.getElementById('adminMarketplaceAudit');
    if (!list) return;
    const offerEvents = marketplaceOffers.flatMap(offer => (offer.statusHistory || []).map(event => ({
        ...event,
        itemTitle: offer.title,
        source: 'Marketplace request'
    })));
    const deliveryEvents = merchantDeliveries.filter(delivery => delivery.marketplace).flatMap(delivery => [
        ...(delivery.statusHistory || []).map(event => ({
            ...event,
            itemTitle: delivery.itemTitle || delivery.order,
            source: 'Delivery assignment'
        })),
        ...(delivery.payoutHistory || []).map(event => ({
            ...event,
            itemTitle: delivery.itemTitle || delivery.order,
            source: 'Commission payout'
        }))
    ]);
    const events = [...offerEvents, ...deliveryEvents]
        .filter(event => Number.isFinite(Date.parse(event.at)))
        .sort((first, second) => Date.parse(second.at) - Date.parse(first.at))
        .slice(0, 30);
    list.innerHTML = events.length ? events.map(event => `
      <article class="admin-marketplace-audit-entry">
        <div><strong>${escapeMerchantText(event.itemTitle)}</strong><span>${escapeMerchantText(event.status)} · ${escapeMerchantText(event.source)}</span></div>
        <small>${escapeMerchantText(event.actor || 'System')} · ${escapeMerchantText(new Date(event.at).toLocaleString())}</small>
        ${event.reason ? `<p>Reason: ${escapeMerchantText(event.reason)}</p>` : ''}
        ${event.riderAttestation ? `<p>${escapeMerchantText(event.riderAttestation)}; rider attestation, not independent proof.</p>` : ''}
      </article>`).join('') : '<div class="admin-marketplace-empty">Marketplace request and delivery events will appear here.</div>';
}

function renderAdminRiderReview() {
    const list = document.getElementById('adminRiderReviewList');
    if (!list) return;
    list.innerHTML = merchantPartners.length ? merchantPartners.map(partner => {
        const activeAssignments = merchantDeliveries.filter(delivery =>
            riderOwnsDelivery(delivery, partner) && riderActiveStatuses.includes(delivery.status)
        ).length;
        const latestAudit = partner.adminAudit?.at(-1);
        const actions = partner.verificationStatus === 'pending'
            ? `<button type="button" data-admin-rider-action="verify" data-partner-id="${partner.id}">Verify partner</button><button class="reject" type="button" data-admin-rider-action="reject" data-partner-id="${partner.id}">Reject</button>`
            : partner.verificationStatus === 'rejected'
                ? `<button type="button" data-admin-rider-action="reopen" data-partner-id="${partner.id}">Reopen review</button>`
                : partner.status === 'active'
                    ? `<button class="reject" type="button" data-admin-rider-action="suspend" data-partner-id="${partner.id}" ${activeAssignments ? 'disabled' : ''}>Suspend</button>`
                    : `<button type="button" data-admin-rider-action="activate" data-partner-id="${partner.id}">Reactivate</button>`;
        return `<article class="admin-rider-review-card">
          <div><strong>${escapeMerchantText(partner.name)}</strong><span>${escapeMerchantText(partner.vehicle)} · ${escapeMerchantText(partner.area)}</span>
            <small>${escapeMerchantText(partner.verificationStatus)} verification · ${escapeMerchantText(partner.status)} account · ${escapeMerchantText(partner.availability || 'off-duty')} · ${activeAssignments} active deliveries</small>
            ${latestAudit ? `<small>Last admin action: ${escapeMerchantText(latestAudit.action)} · ${escapeMerchantText(new Date(latestAudit.at).toLocaleString())}${latestAudit.reason ? ` · ${escapeMerchantText(latestAudit.reason)}` : ''}</small>` : ''}</div>
          <div class="admin-marketplace-actions">${actions}</div>
        </article>`;
    }).join('') : '<div class="admin-marketplace-empty">No rider partners are registered.</div>';
}

function renderAdminMarketplacePayouts() {
    const list = document.getElementById('adminMarketplacePayouts');
    if (!list) return;
    const deliveries = merchantDeliveries.filter(delivery => delivery.marketplace)
        .sort((first, second) => Date.parse(second.updatedAt || '') - Date.parse(first.updatedAt || ''));
    list.innerHTML = deliveries.length ? deliveries.map(delivery => `
      <article class="admin-marketplace-payout-row">
        <div><strong>${escapeMerchantText(delivery.itemTitle || delivery.order)}</strong><span>${escapeMerchantText(delivery.driver)} · ${escapeMerchantText(delivery.status)}</span>
          <small>${escapeMerchantText(delivery.commissionStatus || 'locked')} commission · ${escapeMerchantText(delivery.payoutStatus || 'not-eligible')}${delivery.payoutRecordedAt ? ` · manually recorded ${escapeMerchantText(new Date(delivery.payoutRecordedAt).toLocaleString())}` : ''}</small></div>
        <strong>${formatMerchantCurrency(delivery.commissionAmount || 0)}</strong>
        ${delivery.payoutStatus === 'pending' ? `<button type="button" data-marketplace-payout="${delivery.id}">Record manual payout</button>` : ''}
      </article>`).join('') : '<div class="admin-marketplace-empty">Marketplace commissions will appear after a rider is approved.</div>';
}

function recordMarketplacePayout(deliveryId) {
    const delivery = merchantDeliveries.find(record => String(record.id) === String(deliveryId));
    if (!delivery?.marketplace || delivery.status !== 'delivered' || delivery.payoutStatus !== 'pending') {
        showToast('Only completed marketplace commissions can be recorded as paid.');
        return;
    }
    if (!confirm('This only records a manual payout that was completed outside the app. No money will be transferred. Continue?')) return;
    const now = new Date().toISOString();
    const nextDeliveries = merchantDeliveries.map(record => String(record.id) === String(delivery.id)
        ? {
            ...record,
            payoutStatus: 'manually-recorded',
            payoutRecordedAt: now,
            payoutRecordedBy: 'Platform admin',
            payoutHistory: [...(record.payoutHistory || []), { status: 'manually-recorded', at: now, actor: 'Platform admin' }]
        }
        : record
    );
    if (!saveMerchantCollection('kiryaMerchantDeliveries', nextDeliveries)) return;
    merchantDeliveries = nextDeliveries;
    renderAdminMarketplacePayouts();
    renderAdminMarketplaceAudit();
    renderMerchantMarketplaceNotifications();
    showToast('Manual payout record saved. This prototype did not transfer funds.');
}

function reviewAdminRider(partnerId, action) {
    const partner = merchantPartners.find(record => String(record.id) === String(partnerId));
    if (!partner) return;
    const hasActiveAssignments = merchantDeliveries.some(delivery =>
        riderOwnsDelivery(delivery, partner) && riderActiveStatuses.includes(delivery.status)
    );
    if (hasActiveAssignments && ['reject', 'suspend', 'reopen'].includes(action)) {
        showToast('An active delivery must be resolved before rejecting or suspending this rider.');
        return;
    }
    if (action === 'activate' && partner.verificationStatus !== 'verified') {
        showToast('Verify this partner before reactivating the account.');
        return;
    }
    const reason = ['reject', 'suspend', 'reopen'].includes(action)
        ? prompt(`Reason for ${action}ing ${partner.name}:`)?.trim()
        : '';
    if (['reject', 'suspend', 'reopen'].includes(action) && !reason) {
        showToast('A reason is required for this rider review action.');
        return;
    }
    const now = new Date().toISOString();
    const statusChanges = {
        verify: { verificationStatus: 'verified', status: 'active', availability: 'off-duty' },
        reject: { verificationStatus: 'rejected', status: 'inactive', availability: 'off-duty' },
        reopen: { verificationStatus: 'pending', status: 'inactive', availability: 'off-duty' },
        suspend: { status: 'inactive', availability: 'off-duty' },
        activate: { status: 'active', availability: 'off-duty' }
    }[action];
    if (!statusChanges) return;
    const updatedPartners = merchantPartners.map(record => String(record.id) === String(partner.id)
        ? {
            ...record,
            ...statusChanges,
            updatedAt: now,
            adminAudit: [...(record.adminAudit || []), { action, at: now, actor: 'Platform admin', ...(reason ? { reason } : {}) }]
        }
        : record
    );
    if (!saveMerchantCollection('kiryaMerchantPartners', updatedPartners)) return;
    merchantPartners = updatedPartners;
    if (riderSelectedPartnerId !== null && String(riderSelectedPartnerId) === String(partner.id) && statusChanges.status === 'inactive') {
        stopRiderLocationTracking(partner.id);
    }
    renderAdminRiderReview();
    renderMerchantPartners();
    populateMerchantAssignmentOptions();
    renderRiderPartnerOptions();
    refreshRiderWorkflow();
    renderAdminMarketplaceMap();
    renderAdminDemoMetrics();
    showToast(`${partner.name}: ${action} recorded in the admin audit.`);
}

function reviewMarketplaceRequest(offerId, decision) {
    const offer = marketplaceOffers.find(record => String(record.id) === String(offerId));
    if (!offer || offer.status !== 'requested') {
        showToast('This request has already changed. Refresh the approval queue.');
        renderAdminMarketplaceRequests();
        return;
    }
    const now = new Date().toISOString();
    const partner = merchantPartners.find(record => String(record.id) === String(offer.requestedPartnerId));
    const rejectionReason = decision === 'reject'
        ? prompt(`Why are you rejecting the pickup request from ${offer.requestedPartnerName || 'this rider'}?`)?.trim()
        : '';
    if (decision === 'reject' && !rejectionReason) {
        showToast('A reason is required to reject a pickup request.');
        return;
    }
    if (decision === 'approve' && (!partner || partner.status !== 'active' || partner.verificationStatus !== 'verified' || partner.availability !== 'available')) {
        showToast('The requesting rider is no longer active, available, and verified.');
        return;
    }
    if (decision === 'approve' && merchantDeliveries.some(delivery =>
        riderOwnsDelivery(delivery, partner) && riderActiveStatuses.includes(delivery.status)
    )) {
        showToast('This rider already has an active delivery. Reject this request so another rider can request it.');
        return;
    }
    const nextOffer = {
        ...offer,
        status: decision === 'approve' ? 'approved' : 'available',
        reviewedAt: now,
        reviewedBy: 'Platform admin',
        ...(decision === 'reject' ? { lastRejectedAt: now, lastRejectedBy: 'Platform admin', lastRejectedReason: rejectionReason } : {}),
        statusHistory: [...(offer.statusHistory || []), {
            status: decision === 'approve' ? 'approved' : 'rejected',
            at: now,
            actor: 'Platform admin',
            ...(rejectionReason ? { reason: rejectionReason } : {})
        }]
    };
    const nextOffers = marketplaceOffers.map(record => record.id === offer.id ? nextOffer : record);
    if (decision === 'approve') {
        const deliveryId = offer.id;
        if (merchantDeliveries.some(delivery => String(delivery.id) === String(deliveryId))) {
            showToast('A delivery record already exists for this marketplace item.');
            return;
        }
        const nextDeliveries = [...merchantDeliveries, {
            id: deliveryId,
            order: offer.orderNumber || `MAP-${offer.id}`,
            customer: offer.customerName || 'Marketplace customer',
            customerId: offer.customerId || null,
            address: offer.dropoffArea,
            driver: partner.name,
            phone: partner.phone,
            status: 'accepted',
            partnerId: partner.id,
            marketplace: true,
            marketplaceOfferId: offer.id,
            itemTitle: offer.title,
            itemDescription: offer.description,
            itemCategory: offer.category,
            commissionAmount: offer.commissionAmount,
            commissionStatus: 'locked',
            payoutStatus: 'not-eligible',
            vendorNoticeStatus: 'recorded-in-merchant-console',
            vendorNotifiedAt: now,
            merchantName: offer.vendorName,
            pickupAddress: offer.pickupAddress,
            pickupCoordinates: offer.pickupCoordinates,
            dropoffCoordinates: offer.dropoffCoordinates,
            pickupToDropoffKm: offer.pickupToDropoffKm,
            requestedAt: offer.requestedAt,
            assignedAt: now,
            updatedAt: now,
            statusHistory: [
                { status: 'requested', at: offer.requestedAt || now, actor: offer.requestedPartnerName || partner.name },
                { status: 'accepted', at: now, actor: 'Platform admin' },
                { status: 'vendor-notice-recorded', at: now, actor: 'Platform admin', deliveryMethod: 'merchant-console-record' }
            ]
        }];
        if (!saveMerchantCollections({ kiryaMarketplaceOffers: nextOffers, kiryaMerchantDeliveries: nextDeliveries })) return;
        marketplaceOffers = nextOffers;
        merchantDeliveries = nextDeliveries;
        refreshMerchantAfterRiderWrite({ deliveries: nextDeliveries });
        renderMerchantMarketplaceNotifications();
        showToast(`${partner.name} is approved. ${offer.vendorName} has been notified to expect pickup.`);
    } else if (saveMarketplaceOffers(nextOffers)) {
        renderMarketplaceMapOffers();
        renderAdminMarketplaceMap();
        showToast(`Request rejected. ${offer.title} is available for another rider.`);
    }
    renderAdminMarketplaceRequests();
    renderAdminMarketplaceAudit();
    renderAdminNav();
    renderAdminDemoMetrics();
}

function updateRiderPickupRoute(location) {
    const routeStatus = document.getElementById('riderPickupRouteStatus');
    const directions = document.getElementById('riderPickupDirections');
    if (!routeStatus || !directions) return;
    if (riderCurrentStep !== 1) {
        riderPickupRouteController?.abort();
        riderPickupRouteController = null;
        riderPickupRouteRequestId += 1;
        riderPickupRouteLayer?.remove();
        riderPickupRouteLayer = null;
        riderPickupLastRouteOrigin = null;
        riderPickupLastRouteAt = 0;
        directions.hidden = true;
        routeStatus.textContent = riderCurrentStep > 1
            ? 'Pickup confirmed. Follow the customer delivery address.'
            : 'Accept a delivery to see the route to pickup.';
        return;
    }
    if (!location) {
        riderPickupRouteController?.abort();
        riderPickupRouteController = null;
        riderPickupRouteRequestId += 1;
        riderPickupRouteLayer?.remove();
        riderPickupRouteLayer = null;
        riderPickupLastRouteOrigin = null;
        routeStatus.textContent = 'Waiting for your live GPS location to calculate the pickup route.';
        directions.hidden = true;
        return;
    }
    const activeDelivery = getRiderActiveDelivery(readRiderDeliveries() || [], riderCurrentPartner());
    const destination = activeDelivery?.marketplace ? activeDelivery.pickupCoordinates : merchantPickupCoordinates;
    const pickupAddress = activeDelivery?.marketplace ? activeDelivery.pickupAddress : merchantPickupAddress;
    if (!destination) {
        riderPickupRouteController?.abort();
        riderPickupRouteController = null;
        riderPickupRouteRequestId += 1;
        riderPickupLastRouteOrigin = null;
        routeStatus.textContent = pickupAddress
            ? `${pickupAddress} · business map pin not set`
            : 'Merchant pickup map location has not been set.';
        directions.hidden = true;
        riderPickupRouteLayer?.remove();
        riderPickupRouteLayer = null;
        return;
    }

    updateRiderPickupDestination();
    const destinationKey = `${destination.latitude},${destination.longitude}`;
    const destinationChanged = riderPickupLastRouteDestination !== destinationKey;
    if (destinationChanged) {
        riderPickupRouteController?.abort();
        riderPickupRouteController = null;
        riderPickupLastRouteOrigin = null;
        riderPickupLastRouteAt = 0;
        riderPickupLastRouteDestination = destinationKey;
    }
    directions.href = `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    directions.hidden = false;

    const now = Date.now();
    const movedMeters = riderPickupLastRouteOrigin
        ? distanceBetweenCoordinates(riderPickupLastRouteOrigin, location)
        : Infinity;
    if (riderPickupLastRouteOrigin && movedMeters < 75 && now - riderPickupLastRouteAt < 15000) return;

    riderPickupRouteController?.abort();
    const controller = new AbortController();
    riderPickupRouteController = controller;
    riderPickupLastRouteOrigin = { lat: location.lat, lng: location.lng };
    riderPickupLastRouteAt = now;
    const requestId = ++riderPickupRouteRequestId;
    routeStatus.textContent = 'Calculating route to pickup…';
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${location.lng},${location.lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=false`;
    fetch(routeUrl, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error(`Route request failed with status ${response.status}.`);
        return response.json();
    }).then(result => {
        if (requestId !== riderPickupRouteRequestId) return;
        const route = result.code === 'Ok' ? result.routes?.[0] : null;
        if (!route?.geometry?.coordinates?.length) throw new Error('No pickup route was returned.');
        const routeCoordinates = route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
        if (riderPickupRouteLayer) riderPickupRouteLayer.setLatLngs(routeCoordinates);
        else {
            riderPickupRouteLayer = L.polyline(routeCoordinates, { color: '#1676d2', weight: 5, opacity: 0.82 }).addTo(riderMap);
            riderMap.fitBounds(riderPickupRouteLayer.getBounds(), { padding: [40, 40], maxZoom: 15, animate: true });
        }
        const distanceKm = route.distance / 1000;
        const minutes = Math.max(1, Math.round(route.duration / 60));
        const durationText = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
        routeStatus.textContent = `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km · about ${durationText} to pickup`;
    }).catch(error => {
        if (error.name === 'AbortError' || requestId !== riderPickupRouteRequestId) return;
        console.error('Unable to calculate the rider pickup route.', error);
        routeStatus.textContent = 'Route estimate unavailable. Open directions for navigation.';
    }).finally(() => {
        if (requestId === riderPickupRouteRequestId) riderPickupRouteController = null;
    });
}

function updateRiderMapLocation(location) {
    riderLocationIsDemo = Boolean(location?.demoSample);
    const locationText = document.getElementById('riderStepLocation');
    if (locationText) locationText.textContent = location
        ? `${location.demoSample ? 'DEMO LOCATION' : 'GPS'} · ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        : isRiderOnline ? 'Waiting for your live GPS location…' : 'Go online to share your live GPS location.';
    if (!location) {
        if (riderMarkerAnimationFrame !== null) {
            cancelAnimationFrame(riderMarkerAnimationFrame);
            riderMarkerAnimationFrame = null;
        }
        riderLocationMarker?.remove();
        riderLocationMarker = null;
        if (riderMap && !isRiderOnline) {
            const samplePosition = getRiderDemoPosition(riderCurrentPartner());
            riderMap.setView([samplePosition.latitude, samplePosition.longitude], 12);
        }
        updateRiderPickupRoute(null);
        return;
    }
    if (!riderMap) return;
    const position = [location.latitude, location.longitude];
    if (!riderLocationMarker) {
        riderLocationMarker = L.marker(position, { icon: liveRiderMarkerIcon() })
            .addTo(riderMap)
            .bindPopup(`${escapeMerchantText(location.name)} · ${location.demoSample ? 'demo map position' : 'your live location'}`);
        riderMap.setView(position, 16);
    } else {
        if (riderMarkerAnimationFrame !== null) cancelAnimationFrame(riderMarkerAnimationFrame);
        const start = riderLocationMarker.getLatLng();
        const startedAt = performance.now();
        const duration = 900;
        const animateMarker = now => {
            const progress = Math.min((now - startedAt) / duration, 1);
            const easedProgress = 1 - (1 - progress) ** 2;
            riderLocationMarker?.setLatLng([
                start.lat + (location.latitude - start.lat) * easedProgress,
                start.lng + (location.longitude - start.lng) * easedProgress
            ]);
            if (progress < 1) riderMarkerAnimationFrame = requestAnimationFrame(animateMarker);
            else riderMarkerAnimationFrame = null;
        };
        riderMarkerAnimationFrame = requestAnimationFrame(animateMarker);
        riderMap.panTo(position, { animate: true, duration: 0.9 });
    }
    updateRiderPickupRoute(riderLocationMarker.getLatLng());
}

function updateMerchantRiderTrackingMap(locations) {
    if (!merchantRiderTrackingMap) return;
    const orderId = document.getElementById('merchantDeliveryOrder')?.value;
    const selectedOrder = demoActiveOrders.find(order => order.id === orderId);
    const deliveryAddress = document.getElementById('merchantDeliveryAddress')?.value.trim() ||
        (selectedOrder ? merchantOrderDeliveryAddress(selectedOrder) : '');
    const editingDeliveryId = Number(document.getElementById('merchantDeliveryId')?.value) || null;
    const current = new Set();
    merchantPartners.filter(partner => partner.status === 'active' && partner.availability === 'available')
        .forEach(partner => {
        const location = partner?.status === 'active' && partner.availability === 'available'
            ? getFreshRiderLocation(locations, partner.id)
            : null;
        if (!location) return;
        const markerKey = String(partner.id);
        current.add(markerKey);
        const eligible = Boolean(selectedOrder && merchantOrderCanDispatch(selectedOrder) &&
            !merchantDeliveries.some(delivery => delivery.order === selectedOrder.id &&
                delivery.id !== editingDeliveryId && merchantActiveDeliveryStatuses.includes(delivery.status)) &&
            merchantPartnerIsEligible(partner, deliveryAddress, editingDeliveryId));
        const popup = `${escapeMerchantText(partner.name)} · online${selectedOrder
            ? `<br>${eligible ? `Select for ${escapeMerchantText(selectedOrder.id)}` : 'Not eligible for this order'}`
            : '<br>Choose a ready order to enable assignment'}`;
        const position = [location.latitude, location.longitude];
        const marker = merchantRiderTrackingMarkers.get(markerKey);
        if (marker) {
            marker.setLatLng(position);
            marker.setPopupContent(popup);
        } else {
            const riderMarker = L.marker(position, { icon: liveRiderMarkerIcon() })
                .addTo(merchantRiderTrackingMap)
                .bindPopup(popup);
            riderMarker.on('click', () => selectMerchantRiderFromMap(partner.id));
            merchantRiderTrackingMarkers.set(markerKey, riderMarker);
            if (merchantRiderTrackingMarkers.size === 1) merchantRiderTrackingMap.setView(position, 14);
        }
    });
    merchantRiderTrackingMarkers.forEach((marker, key) => {
        if (!current.has(key)) {
            marker.remove();
            merchantRiderTrackingMarkers.delete(key);
        }
    });
    const status = document.getElementById('merchantRiderLiveMapStatus');
    if (status) status.textContent = current.size
        ? `${current.size} online rider${current.size === 1 ? '' : 's'} sharing a recent GPS location. Choose an order above, select an eligible rider marker, then send the offer.`
        : 'Waiting for online riders to share a recent GPS location.';
}

function selectMerchantRiderFromMap(partnerId) {
    const partner = merchantPartners.find(record => record.id === partnerId);
    const orderId = document.getElementById('merchantDeliveryOrder').value;
    const order = demoActiveOrders.find(record => record.id === orderId);
    const editingDeliveryId = Number(document.getElementById('merchantDeliveryId').value) || null;
    if (!order) {
        document.getElementById('merchantDeliveryOrder').focus();
        showToast('Choose a ready delivery order before selecting a rider on the map.');
        return;
    }
    if (!merchantOrderCanDispatch(order) || merchantDeliveries.some(delivery =>
        delivery.order === order.id && delivery.id !== editingDeliveryId &&
        merchantActiveDeliveryStatuses.includes(delivery.status)
    )) {
        showToast('This order is not available for rider assignment. Choose another ready order.');
        return;
    }
    const address = document.getElementById('merchantDeliveryAddress').value.trim();
    if (!partner || !merchantPartnerIsEligible(partner, address, editingDeliveryId)) {
        showToast('This rider is not eligible for the selected order.');
        return;
    }
    populateMerchantAssignmentPartners();
    const partnerSelect = document.getElementById('merchantDeliveryPartner');
    if (![...partnerSelect.options].some(option => option.value === String(partner.id))) {
        showToast('This rider is no longer available. Choose another rider.');
        return;
    }
    partnerSelect.value = String(partner.id);
    partnerSelect.dispatchEvent(new Event('change', { bubbles: true }));
    showToast(`${partner.name} selected for ${order.id}. Review and send the rider offer in the dispatch form.`);
    document.getElementById('merchantDeliveryForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initializeCustomerTrackingMaps() {
    const list = document.getElementById('customerOrdersList');
    list?.querySelectorAll('[data-customer-order-map]').forEach(element => {
        const orderId = element.dataset.customerOrderMap;
        const order = customerTrackingOrders.find(record => record.id === orderId);
        if (!order || !order.deliveryId) return;
        const mapInstance = createTrackingMap(element);
        customerTrackingMaps.set(orderId, { map: mapInstance, marker: null, partnerId: order.partnerId });
        setTimeout(() => mapInstance.invalidateSize(), 0);
    });
}

function clearCustomerTrackingMaps() {
    customerTrackingMaps.forEach(record => record.map.remove());
    customerTrackingMaps.clear();
}

function updateCustomerTrackingMaps(locations) {
    customerTrackingMaps.forEach((record, orderId) => {
        const partner = merchantPartners.find(item => String(item.id) === String(record.partnerId));
        const location = partner?.status === 'active' && partner.availability === 'available'
            ? getFreshRiderLocation(locations, record.partnerId)
            : null;
        if (!location) {
            record.marker?.remove();
            record.marker = null;
            const status = [...document.querySelectorAll('[data-customer-order-map-status]')]
                .find(element => element.dataset.customerOrderMapStatus === orderId);
            if (status) status.textContent = 'Waiting for the assigned rider to share a recent GPS location.';
            return;
        }
        const position = [location.latitude, location.longitude];
        if (record.marker) {
            record.marker.setLatLng(position);
        } else {
            const order = customerTrackingOrders.find(item => item.id === orderId);
            const pickupAddress = order?.pickupAddress || merchantPickupAddress;
            record.marker = L.marker(position, { icon: liveRiderMarkerIcon() })
                .addTo(record.map)
                .bindPopup(`${escapeMerchantText(location.name)} · assigned rider${pickupAddress ? `<br>Pickup: ${escapeMerchantText(pickupAddress)}` : ''}`);
            record.map.setView(position, 15);
        }
        const status = [...document.querySelectorAll('[data-customer-order-map-status]')]
            .find(element => element.dataset.customerOrderMapStatus === orderId);
        if (status) status.textContent = location
            ? `Live location updated ${new Date(location.updatedAt).toLocaleTimeString()}.`
            : 'Waiting for the assigned rider to share a recent GPS location.';
    });
}

function refreshLiveRiderMaps() {
    const locations = readLiveRiderLocations();
    if (!locations) return;
    const partner = riderCurrentPartner();
    updateRiderMapLocation(partner?.status === 'active' && partner.availability === 'available'
        ? getFreshRiderLocation(locations, partner.id)
        : null);
    updateMerchantRiderTrackingMap(locations);
    updateCustomerTrackingMaps(locations);
    renderAdminMarketplaceMap();
}

function stopRiderLocationTracking(partnerId) {
    if (riderLocationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(riderLocationWatchId);
        riderLocationWatchId = null;
    }
    const locations = readLiveRiderLocations();
    if (!locations) return;
    if (writeLiveRiderLocations(locations.filter(location => String(location.partnerId) !== String(partnerId)))) {
        updateRiderMapLocation(null);
        refreshLiveRiderMaps();
    }
}

function startRiderLocationTracking(partner) {
    if (riderLocationWatchId !== null || !partner) return;
    const status = document.getElementById('riderLocationStatus');
    if (riderDemoRegion !== 'live') {
        const position = getRiderDemoPosition(partner);
        const location = {
            partnerId: partner.id,
            name: partner.name,
            latitude: position.latitude,
            longitude: position.longitude,
            updatedAt: new Date().toISOString(),
            demoSample: true
        };
        const locations = readLiveRiderLocations();
        if (!locations) return;
        if (!writeLiveRiderLocations([
            ...locations.filter(record => String(record.partnerId) !== String(partner.id)),
            location
        ])) return;
        if (status) status.textContent = `Demo position enabled · ${partner.area || 'Uganda'} · device GPS is not shared.`;
        ensureLiveRiderMapRefresh();
        refreshLiveRiderMaps();
        return;
    }
    if (!navigator.geolocation || !window.isSecureContext) {
        if (status) status.textContent = 'Live GPS requires location permission and a secure (HTTPS) connection.';
        showToast('Live rider tracking requires GPS permission and HTTPS.');
        return;
    }
    if (status) status.textContent = 'Waiting for GPS permission and location…';
    try {
        riderLocationWatchId = navigator.geolocation.watchPosition(position => {
            const currentPartner = riderCurrentPartner();
            if (!currentPartner || String(currentPartner.id) !== String(partner.id) ||
                currentPartner.availability !== 'available') {
                stopRiderLocationTracking(partner.id);
                return;
            }
            const location = {
                partnerId: partner.id,
                name: partner.name,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                updatedAt: new Date(position.timestamp || Date.now()).toISOString()
            };
            const locations = readLiveRiderLocations();
            if (!locations) return;
            const nextLocations = [
                ...locations.filter(record => String(record.partnerId) !== String(partner.id)),
                location
            ];
            if (!writeLiveRiderLocations(nextLocations)) return;
            if (status) status.textContent = `Sharing live location · updated ${new Date(location.updatedAt).toLocaleTimeString()}.`;
            refreshLiveRiderMaps();
        }, error => {
            console.error('Rider GPS tracking failed.', error);
            if (status) status.textContent = 'Live GPS unavailable. Check location permission and try again.';
            showToast('Rider GPS is unavailable. Location sharing has stopped.');
            riderLocationWatchId = null;
            setRiderAvailability(false, true);
        }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
        ensureLiveRiderMapRefresh();
    } catch (error) {
        console.error('Unable to start rider GPS tracking.', error);
        if (status) status.textContent = 'Live GPS could not start. Check browser location settings.';
        showToast('Rider GPS could not start. Location sharing has stopped.');
        setRiderAvailability(false, true);
    }
}

function readRiderDeliveries() {
    return readRiderCollection('kiryaMerchantDeliveries', merchantDeliveries);
}

function readRiderActiveOrders() {
    return readRiderCollection('kiryaMerchantActiveOrders', demoActiveOrders);
}

function readRiderPastOrders() {
    return readRiderCollection('kiryaMerchantPastOrders', dummyPastOrders);
}

function riderCurrentPartner(partners = readRiderCollection('kiryaMerchantPartners', riderPartnerFallback)) {
    if (!partners) return null;
    return partners.find(partner => String(partner.id) === String(riderSelectedPartnerId)) ||
        partners.find(partner => partner.status === 'active') || null;
}

function riderOwnsDelivery(delivery, partner) {
    return Boolean(partner && (
        String(delivery.partnerId) === String(partner.id) ||
        merchantPhoneKey(delivery.phone || '') === merchantPhoneKey(partner.phone || '')
    ));
}

function setRiderAvailability(isAvailable, forceOffline = false) {
    const partners = readRiderCollection('kiryaMerchantPartners', riderPartnerFallback);
    const partner = riderCurrentPartner(partners);
    if (!partners || !partner || partner.status !== 'active' || partner.verificationStatus !== 'verified') {
        showToast('Only an active, verified rider partner can go online.');
        return false;
    }
    if (isAvailable && riderDemoRegion === 'live' && (!navigator.geolocation || !window.isSecureContext)) {
        showToast('Going online requires GPS support, location permission, and an HTTPS connection.');
        return false;
    }
    const deliveries = readRiderDeliveries();
    if (!deliveries) return false;
    const hasActiveDelivery = deliveries.some(delivery =>
        riderOwnsDelivery(delivery, partner) && riderActiveStatuses.includes(delivery.status)
    );
    if (!isAvailable && hasActiveDelivery && !forceOffline) {
        showToast('Complete the active delivery before going offline.');
        return false;
    }
    const updatedPartners = partners.map(record => String(record.id) === String(partner.id)
        ? { ...record, availability: isAvailable ? 'available' : 'off-duty', updatedAt: new Date().toISOString() }
        : record
    );
    if (!saveMerchantCollection('kiryaMerchantPartners', updatedPartners)) return false;
    refreshMerchantAfterRiderWrite({ partners: updatedPartners });
    riderSelectedPartnerId = partner.id;
    isRiderOnline = isAvailable;
    if (!isAvailable) stopRiderLocationTracking(partner.id);
    renderRiderAvailability();
    refreshRiderWorkflow();
    return true;
}

function renderRiderAvailability() {
    const button = document.getElementById('riderStatusToggle');
    const partner = riderCurrentPartner();
    if (!button || !partner) return;
    const isActive = partner.status === 'active' && partner.verificationStatus === 'verified' && partner.availability === 'available';
    isRiderOnline = isActive;
    const locationStatus = document.getElementById('riderLocationStatus');
    if (isActive) startRiderLocationTracking(partner);
    else if (locationStatus) locationStatus.textContent = 'Location sharing starts when you go online.';
    button.classList.toggle('online', isActive);
    button.classList.toggle('offline', !isActive);
    button.setAttribute('aria-pressed', String(isActive));
    button.querySelector('.status-text').textContent = isActive ? 'ONLINE' : 'GO ONLINE';
    button.querySelector('.status-dot').style.background = isActive ? '#019E81' : '#ff4757';
    const name = document.getElementById('riderHeaderName');
    if (name) name.textContent = partner.name;
    const vehicle = document.getElementById('riderVehicleSummary');
    if (vehicle) vehicle.textContent = partner.vehicle || 'Not recorded';
    const area = document.getElementById('riderAreaSummary');
    if (area) area.textContent = partner.area || 'Not recorded';
    const idleMessage = document.getElementById('riderIdleMsg');
    if (idleMessage && document.getElementById('riderDeliveryState').style.display !== 'none') return;
    if (idleMessage) idleMessage.textContent = isActive
        ? 'You are online. Browse nearby map offers and request a pickup.'
        : partner.status !== 'active' ? 'This partner account is inactive. Contact the merchant.'
            : partner.verificationStatus !== 'verified' ? 'Admin verification is required before you can go online.'
                : 'Go online to request nearby pickups. Available jobs remain visible on the map.';
}

function refreshMerchantAfterRiderWrite({ partners, deliveries, activeOrders, pastOrders } = {}) {
    if (partners) merchantPartners = partners;
    if (deliveries) merchantDeliveries = deliveries;
    if (activeOrders) demoActiveOrders = activeOrders;
    if (pastOrders) dummyPastOrders = pastOrders;
    if (partners || deliveries) {
        renderMerchantPartners();
        populateMerchantAssignmentOptions();
    }
    if (deliveries || activeOrders || pastOrders) {
        renderMerchantActiveOrders();
        if (merchantAssignedRidersScreen?.classList.contains('active')) renderMerchantDeliveries();
        renderMerchantMarketplaceNotifications();
        renderAdminMarketplacePayouts();
        renderAdminMarketplaceAudit();
        renderAdminDemoMetrics();
        updateMerchantOrderMetrics();
        renderCustomerOrders();
    }
    refreshLiveRiderMaps();
}

function renderRiderPartnerOptions() {
    const partners = readRiderCollection('kiryaMerchantPartners', riderPartnerFallback);
    const select = document.getElementById('riderPartnerSelect');
    if (!partners || !select) return;
    const eligiblePartners = partners.filter(partner => partner && Number.isInteger(partner.id) && typeof partner.name === 'string');
    if (!eligiblePartners.length) {
        select.innerHTML = '<option value="">No partner accounts found</option>';
        select.disabled = true;
        return;
    }
    select.disabled = false;
    select.innerHTML = eligiblePartners.map(partner =>
        `<option value="${escapeMerchantText(partner.id)}">${escapeMerchantText(partner.name)}${partner.status !== 'active' ? ' (inactive)' : partner.verificationStatus !== 'verified' ? ' (verification pending)' : ''}</option>`
    ).join('');
    if (riderSelectedPartnerId === null) {
        try {
            riderSelectedPartnerId = localStorage.getItem('kiryaRiderPartnerId');
        } catch (error) {
            console.error('Unable to load the selected rider account.', error);
            showToast('Saved rider account selection could not be loaded.');
        }
    }
    const selected = eligiblePartners.find(partner => String(partner.id) === String(riderSelectedPartnerId)) ||
        eligiblePartners.find(partner => partner.status === 'active') || eligiblePartners[0];
    riderSelectedPartnerId = selected.id;
    select.value = String(selected.id);
    try {
        localStorage.setItem('kiryaRiderPartnerId', String(selected.id));
    } catch (error) {
        console.error('Unable to save the selected rider account.', error);
        showToast('Rider account selection could not be saved.');
    }
    renderRiderAvailability();
}

function setRiderTab(tab) {
    const riderScreen = document.getElementById('riderScreen');
    riderScreen.classList.toggle('rider-tab-secondary', tab !== 'home');
    document.querySelectorAll('#riderScreen [data-rider-tab]').forEach(button => {
        const active = button.dataset.riderTab === tab;
        button.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });
    document.getElementById('riderOrdersView').hidden = tab !== 'orders';
    document.getElementById('riderEarningsView').hidden = tab !== 'earnings';
    document.getElementById('riderAccountView').hidden = tab !== 'account';
    if (tab === 'orders' || tab === 'earnings') refreshRiderWorkflow();
}

function initializeRiderWorkspace() {
    if (!riderWorkspaceInitialized) {
        riderWorkspaceInitialized = true;
        renderRiderPartnerOptions();
        const demoRegionSelect = document.getElementById('riderDemoRegionSelect');
        if (demoRegionSelect) {
            demoRegionSelect.value = riderDemoRegion;
            demoRegionSelect.addEventListener('change', event => {
                if (isRiderOnline) {
                    event.target.value = riderDemoRegion;
                    showToast('Go offline before changing between device GPS and demo map regions.');
                    return;
                }
                riderDemoRegion = event.target.value;
                try {
                    localStorage.setItem('kiryaRiderDemoRegion', riderDemoRegion);
                } catch (error) {
                    console.error('Unable to save the selected demo region.', error);
                }
                const position = getRiderDemoPosition(riderCurrentPartner());
                riderMap?.setView([position.latitude, position.longitude], 12);
                renderMarketplaceMapOffers();
                showToast(riderDemoRegion === 'live' ? 'Device GPS mode selected.' : `Demo map region set to ${riderDemoRegion}.`);
            });
        }
        document.querySelector('.rider-bottom-nav')?.addEventListener('click', event => {
            const button = event.target.closest('[data-rider-tab]');
            if (button) setRiderTab(button.dataset.riderTab);
        });
        document.getElementById('riderOrdersList')?.addEventListener('click', event => {
            const acceptButton = event.target.closest('[data-rider-accept]');
            if (acceptButton) {
                const deliveries = readRiderDeliveries();
                const offer = deliveries?.find(record => String(record.id) === acceptButton.dataset.riderAccept);
                if (offer) showRiderOffer(offer);
            }
            if (event.target.closest('[data-rider-go-home]')) setRiderTab('home');
        });
        document.getElementById('riderPartnerSelect')?.addEventListener('change', event => {
            const current = riderCurrentPartner();
            const deliveries = readRiderDeliveries();
            if (current && deliveries?.some(delivery =>
                riderOwnsDelivery(delivery, current) && riderActiveStatuses.includes(delivery.status)
            )) {
                event.target.value = String(current.id);
                showToast('Finish this rider’s active delivery before switching accounts.');
                return;
            }
            if (isRiderOnline && !setRiderAvailability(false)) return;
            riderSelectedPartnerId = Number(event.target.value);
            renderRiderPartnerOptions();
            refreshRiderWorkflow();
        });
        document.getElementById('riderSupportButton')?.addEventListener('click', () =>
            showToast('Contact your merchant dispatcher for rider account or delivery support.')
        );
        window.addEventListener('storage', event => {
            if (['kiryaMerchantPartners', 'kiryaMerchantDeliveries', 'kiryaMerchantActiveOrders', 'kiryaMerchantPastOrders'].includes(event.key)) {
                renderRiderPartnerOptions();
                refreshRiderWorkflow();
            }
        });
        riderPollTimer = setInterval(refreshRiderWorkflow, 3000);
    }
    initRiderMap();
    setTimeout(() => riderMap?.invalidateSize(), 100);
    setRiderTab('home');
    refreshRiderWorkflow();
}

function getRiderActiveDelivery(deliveries, partner) {
    return deliveries.find(delivery =>
        riderOwnsDelivery(delivery, partner) && riderActiveStatuses.includes(delivery.status)
    ) || null;
}

function renderRiderOrders(deliveries, partner, activeDelivery) {
    const list = document.getElementById('riderOrdersList');
    const count = document.getElementById('riderOrderCount');
    const badge = document.getElementById('riderOrdersBadge');
    if (!list || !count || !badge) return;
    const riderOrders = deliveries
        .filter(delivery => riderOwnsDelivery(delivery, partner))
        .sort((first, second) => Date.parse(second.updatedAt || second.assignedAt || '') - Date.parse(first.updatedAt || first.assignedAt || ''));
    const outstandingOffers = riderOrders.filter(delivery =>
        delivery.status === 'offered' && (!delivery.offerExpiresAt || Date.parse(delivery.offerExpiresAt) > Date.now())
    ).length;
    count.textContent = String(riderOrders.length);
    badge.textContent = String(outstandingOffers);
    badge.hidden = outstandingOffers === 0;
    list.innerHTML = riderOrders.length ? riderOrders.map(delivery => {
        const linkedOrder = readRiderActiveOrders()?.find(order => order.id === delivery.order) ||
            readRiderPastOrders()?.find(order => order.id === delivery.order);
        const isOffer = delivery.status === 'offered' && (!delivery.offerExpiresAt || Date.parse(delivery.offerExpiresAt) > Date.now());
        const isCurrent = activeDelivery && activeDelivery.id === delivery.id;
        const statusLabel = delivery.status === 'in-transit' ? 'On the way' :
            delivery.status === 'picked-up' ? 'Picked up' :
                delivery.status === 'delivered' ? 'Delivered' :
                    delivery.status === 'offered' && !isOffer ? 'Offer expired' :
                        delivery.status[0].toUpperCase() + delivery.status.slice(1);
        return `<article class="rider-order-card">
          <div class="rider-order-card-top"><span>${escapeMerchantText(delivery.order)}</span><span class="rider-order-status">${escapeMerchantText(statusLabel)}</span></div>
          <p>${escapeMerchantText(linkedOrder?.merchant || 'Merchant')}${linkedOrder?.items ? `<br>${escapeMerchantText(linkedOrder.items)}` : ''}<br>Deliver to ${escapeMerchantText(delivery.customer)} · ${escapeMerchantText(delivery.address)}</p>
          ${delivery.statusHistory?.at(-1)?.reason ? `<p>Reason: ${escapeMerchantText(delivery.statusHistory.at(-1).reason)}</p>` : ''}
          ${isOffer && !activeDelivery ? isRiderOnline
            ? `<button type="button" data-rider-accept="${escapeMerchantText(delivery.id)}">Review delivery offer</button>`
            : '<p class="rider-order-status">Go online to review this offer.</p>' : ''}
          ${isCurrent ? '<button type="button" data-rider-go-home>Continue current delivery</button>' : ''}
        </article>`;
    }).join('') : '<div class="rider-empty-state">No delivery offers yet. Stay online and ask the merchant to assign a ready delivery order.</div>';
}

function renderRiderEarnings(deliveries, partner) {
    const completed = deliveries.filter(delivery =>
        riderOwnsDelivery(delivery, partner) && delivery.status === 'delivered' &&
        new Date(delivery.updatedAt || delivery.assignedAt).toDateString() === new Date().toDateString()
    );
    const completedCount = deliveries.filter(delivery =>
        riderOwnsDelivery(delivery, partner) && delivery.status === 'delivered'
    ).length;
    const commissionEarned = completed.reduce((total, delivery) => total + Number(delivery.commissionAmount || 0), 0);
    document.getElementById('riderTripsToday').textContent = String(completed.length);
    document.getElementById('riderCompletedSummary').textContent = `${completedCount} completed deliveries · marketplace commissions only`;
    document.getElementById('riderEarningsToday').textContent = formatMerchantCurrency(commissionEarned);
    document.getElementById('riderEarningsSummary').textContent = `${formatMerchantCurrency(commissionEarned)} earned today`;
    const earningsList = document.getElementById('riderEarningsList');
    earningsList.innerHTML = completed.length ? completed.map(delivery =>
        `<article class="rider-earning-card"><div class="rider-earning-card-top"><span>${escapeMerchantText(delivery.itemTitle || delivery.order)}</span><span>Delivered</span></div><p>Completed ${escapeMerchantText(new Date(delivery.updatedAt || delivery.assignedAt).toLocaleString())}.</p>${delivery.commissionAmount ? `<strong>${formatMerchantCurrency(delivery.commissionAmount)} commission</strong>` : '<p>Commission not recorded for this delivery.</p>'}</article>`
    ).join('') : '<div class="rider-empty-state">No completed deliveries today. Completed trip history will appear here.</div>';
}

function renderRiderCurrentDelivery(delivery, partner) {
    const deliveryState = document.getElementById('riderDeliveryState');
    const dashboardState = document.getElementById('riderDashboardState');
    const idleMessage = document.getElementById('riderIdleMsg');
    if (!delivery) {
        deliveryState.style.display = 'none';
        dashboardState.style.display = 'block';
        riderCurrentStep = 0;
        riderRenderedDeliveryKey = null;
        updateRiderPickupRoute(riderLocationMarker?.getLatLng() || null);
        return;
    }
    const order = readRiderActiveOrders()?.find(record => record.id === delivery.order);
    const deliveryKey = `${delivery.id}:${delivery.status}`;
    deliveryState.style.display = 'block';
    dashboardState.style.display = 'none';
    riderCurrentStep = delivery.status === 'accepted' || delivery.status === 'assigned' ? 1 : 2;
    document.getElementById('riderCurrentOrderNumber').textContent = delivery.order;
    const marketplaceDetails = document.getElementById('riderMarketplaceDeliveryDetails');
    marketplaceDetails.hidden = !delivery.marketplace;
    marketplaceDetails.textContent = delivery.marketplace
        ? `${delivery.itemTitle} · ${formatMerchantCurrency(delivery.commissionAmount)} commission · approved by admin`
        : '';
    document.getElementById('riderStepRiderName').textContent = partner.name;
    document.getElementById('riderStepRider').classList.toggle('active', isRiderOnline);
    document.getElementById('riderStepRider').style.opacity = isRiderOnline ? '1' : '0.55';
    document.getElementById('riderPickupName').textContent = delivery.marketplace
        ? delivery.merchantName || 'Marketplace vendor'
        : merchantProfile.name || order?.merchant || 'Merchant';
    document.getElementById('riderPickupAddress').textContent = delivery.marketplace
        ? delivery.pickupAddress || 'Pickup address not recorded'
        : merchantPickupAddress || delivery.pickupAddress || order?.pickupAddress || 'Pickup address not recorded';
    const businessCall = document.getElementById('riderPickupContact');
    const businessPhone = String(delivery.marketplace ? '' : merchantProfile.phone || '').replace(/[^\d+]/g, '');
    businessCall.href = businessPhone ? `tel:${businessPhone}` : '#';
    businessCall.hidden = !businessPhone;
    document.getElementById('riderCustomerName').textContent = delivery.marketplace ? 'Delivery drop-off' : delivery.customer || 'Customer';
    document.getElementById('riderDropoffAddress').textContent = delivery.marketplace
        ? `${delivery.address} · approximately ${Number(delivery.pickupToDropoffKm).toFixed(1)} km from pickup`
        : delivery.address;
    const callLink = document.getElementById('riderCustomerCall');
    const phone = String(delivery.customerPhone || '').replace(/[^\d+]/g, '');
    callLink.href = phone ? `tel:${phone}` : '#';
    callLink.hidden = !phone;
    const atPickup = riderCurrentStep === 1;
    updateRiderPickupRoute(riderLocationMarker?.getLatLng() || null);
    document.getElementById('riderStepPickup').classList.toggle('active', atPickup);
    document.getElementById('riderStepPickup').style.opacity = atPickup ? '1' : '0.55';
    document.getElementById('riderStepDropoff').classList.toggle('active', !atPickup);
    if (riderRenderedDeliveryKey !== deliveryKey) {
        resetSwipeButton(atPickup ? 'CONFIRM PICKUP' : 'CONFIRM DELIVERY');
        riderRenderedDeliveryKey = deliveryKey;
    }
    if (idleMessage) idleMessage.textContent = `${partner.name} · ${delivery.status === 'in-transit' ? 'In transit' : delivery.status === 'picked-up' ? 'Picked up' : 'Accepted'}`;
}

function refreshRiderWorkflow() {
    if (!riderWorkspaceInitialized && !document.getElementById('riderScreen').classList.contains('active')) return;
    const partners = readRiderCollection('kiryaMerchantPartners', riderPartnerFallback);
    const deliveries = readRiderDeliveries();
    const partner = riderCurrentPartner(partners);
    if (!partners || !deliveries || !partner) return;
    const activeDelivery = getRiderActiveDelivery(deliveries, partner);
    renderRiderAvailability();
    renderRiderCurrentDelivery(activeDelivery, partner);
    renderRiderOrders(deliveries, partner, activeDelivery);
    renderRiderEarnings(deliveries, partner);
    renderMarketplaceMapOffers();
    const pendingOffer = deliveries.find(delivery => String(delivery.id) === String(riderPendingOfferId));
    const pendingOfferIsValid = pendingOffer?.status === 'offered' &&
        riderOwnsDelivery(pendingOffer, partner) &&
        (!pendingOffer.offerExpiresAt || Date.parse(pendingOffer.offerExpiresAt) > Date.now());
    if (!isRiderOnline || activeDelivery || (riderPendingOfferId && !pendingOfferIsValid)) {
        clearInterval(riderOrderTimer);
        document.getElementById('riderOrderModal').classList.remove('active');
        riderPendingOfferId = null;
    }
    if (isRiderOnline && !activeDelivery) triggerRiderOrder();
}

function showRiderOffer(delivery) {
    riderPendingOfferId = delivery.id;
    const order = readRiderActiveOrders()?.find(record => record.id === delivery.order);
    document.getElementById('riderOfferOrderNumber').textContent = delivery.order;
    document.getElementById('riderOfferMerchant').textContent = merchantProfile.name || order?.merchant || 'Merchant';
    document.getElementById('riderOfferPickup').textContent = merchantPickupAddress || delivery.pickupAddress || order?.pickupAddress || 'Pickup address not recorded';
    document.getElementById('riderOfferCustomer').textContent = delivery.customer || 'Customer';
    document.getElementById('riderOfferAddress').textContent = delivery.address;
    document.getElementById('riderOfferItems').textContent = order?.items || '';
    document.getElementById('riderOrderModal').classList.add('active');
    const timerFill = document.getElementById('riderTimerFill');
    const deadline = Date.parse(delivery.offerExpiresAt || '') || Date.now() + 5 * 60 * 1000;
    clearInterval(riderOrderTimer);
    const updateTimer = () => {
        const remaining = Math.max(0, deadline - Date.now());
        timerFill.style.width = `${Math.min(100, remaining / (5 * 60 * 1000) * 100)}%`;
        if (remaining === 0) {
            clearInterval(riderOrderTimer);
            riderPendingOfferId = null;
            document.getElementById('riderOrderModal').classList.remove('active');
            showToast('This delivery offer expired. The merchant can reassign it.');
            refreshRiderWorkflow();
        }
    };
    updateTimer();
    riderOrderTimer = setInterval(updateTimer, 1000);
}

function updateRiderDelivery(deliveryId, nextStatus, reason = '') {
    const partner = riderCurrentPartner();
    const deliveries = readRiderDeliveries();
    if (!partner || !deliveries) return false;
    const delivery = deliveries.find(record => String(record.id) === String(deliveryId));
    if (!delivery || !riderOwnsDelivery(delivery, partner)) {
        showToast('This delivery is no longer assigned to the selected rider.');
        return false;
    }
    const transitions = {
        accepted: ['picked-up'],
        assigned: ['picked-up'],
        'picked-up': ['in-transit'],
        'in-transit': ['delivered']
    };
    if (!transitions[delivery.status]?.includes(nextStatus)) {
        showToast('This delivery has changed. Refresh the rider workspace and try again.');
        return false;
    }
    const now = new Date().toISOString();
    const confirmationStep = nextStatus === 'picked-up' ? 'pickup' : nextStatus === 'delivered' ? 'dropoff' : null;
    const statusEvent = {
        status: nextStatus,
        at: now,
        actor: partner.name,
        ...(confirmationStep ? { riderAttestation: `${confirmationStep} confirmed by rider` } : {})
    };
    const updatedDelivery = {
        ...delivery,
        status: nextStatus,
        updatedAt: now,
        ...(delivery.marketplace && confirmationStep === 'dropoff' ? { commissionStatus: 'earned', payoutStatus: 'pending' } : {}),
        ...(confirmationStep ? {
            riderAttestations: [...(delivery.riderAttestations || []), {
                step: confirmationStep,
                method: 'rider-confirmation',
                actor: partner.name,
                recordedAt: now
            }]
        } : {}),
        statusHistory: [...(delivery.statusHistory || []), statusEvent]
    };
    const nextDeliveries = deliveries.map(record => record.id === delivery.id ? updatedDelivery : record);
    const collections = { kiryaMerchantDeliveries: nextDeliveries };
    if (delivery.marketplace && nextStatus === 'delivered') {
        collections.kiryaMarketplaceOffers = marketplaceOffers.map(offer => String(offer.id) === String(delivery.marketplaceOfferId)
            ? {
                ...offer,
                status: 'delivered',
                completedAt: now,
                statusHistory: [...(offer.statusHistory || []), { status: 'delivered', at: now, actor: partner.name }]
            }
            : offer
        );
    }
    if (nextStatus === 'delivered') {
        const orders = readRiderActiveOrders();
        const pastOrders = readRiderPastOrders();
        if (!orders || !pastOrders) return false;
        const order = orders.find(record => record.id === delivery.order);
        if (order) {
            const updatedOrder = {
                ...order,
                status: 'Delivered',
                statusColor: '#019E81',
                date: `Today, ${order.received || new Date(now).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })}`,
                deliveredAt: now,
                statusHistory: [...(order.statusHistory || []), {
                    status: 'Delivered',
                    at: now,
                    actor: partner.name
                }]
            };
            collections.kiryaMerchantActiveOrders = orders.filter(record => record.id !== order.id);
            collections.kiryaMerchantPastOrders = [updatedOrder, ...pastOrders];
        }
    }
    if (!saveMerchantCollections(collections)) return false;
    if (collections.kiryaMarketplaceOffers) {
        marketplaceOffers = collections.kiryaMarketplaceOffers;
        renderMarketplaceMapOffers();
    }
    refreshMerchantAfterRiderWrite({
        deliveries: nextDeliveries,
        ...(collections.kiryaMerchantActiveOrders ? { activeOrders: collections.kiryaMerchantActiveOrders } : {}),
        ...(collections.kiryaMerchantPastOrders ? { pastOrders: collections.kiryaMerchantPastOrders } : {})
    });
    document.getElementById('riderOrderModal').classList.remove('active');
    riderPendingOfferId = null;
    refreshRiderWorkflow();
    showToast(nextStatus === 'delivered' ? 'Delivery completed and customer order updated.' :
        nextStatus === 'picked-up' ? 'Pickup confirmed. Continue to the customer.' : 'Delivery marked in transit.');
    return true;
}

function acceptRiderDelivery(deliveryId) {
    if (!deliveryId || !isRiderOnline) {
        showToast('Go online before accepting a delivery offer.');
        return;
    }
    const deliveries = readRiderDeliveries();
    const partner = riderCurrentPartner();
    const delivery = deliveries?.find(record => String(record.id) === String(deliveryId));
    if (!delivery || !partner || delivery.status !== 'offered' || !riderOwnsDelivery(delivery, partner)) {
        showToast('This offer is no longer available for this rider.');
        refreshRiderWorkflow();
        return;
    }
    if (delivery.offerExpiresAt && Date.parse(delivery.offerExpiresAt) <= Date.now()) {
        showToast('This delivery offer expired. The merchant can reassign it.');
        refreshRiderWorkflow();
        return;
    }
    if (deliveries.some(record => riderOwnsDelivery(record, partner) && riderActiveStatuses.includes(record.status))) {
        showToast('Complete your current delivery before accepting another offer.');
        return;
    }
    const now = new Date().toISOString();
    const updated = {
        ...delivery,
        status: 'accepted',
        updatedAt: now,
        acceptedAt: now,
        statusHistory: [...(delivery.statusHistory || []), { status: 'accepted', at: now, actor: partner.name }]
    };
    const nextDeliveries = deliveries.map(record => record.id === delivery.id ? updated : record);
    if (!saveMerchantCollection('kiryaMerchantDeliveries', nextDeliveries)) return;
    refreshMerchantAfterRiderWrite({ deliveries: nextDeliveries });
    clearInterval(riderOrderTimer);
    document.getElementById('riderOrderModal').classList.remove('active');
    riderPendingOfferId = null;
    setRiderTab('home');
    refreshRiderWorkflow();
    showToast(`Delivery ${delivery.order} accepted.`);
}

function declineRiderDelivery() {
    if (!riderPendingOfferId) return;
    const reason = prompt('Why are you declining this delivery offer?')?.trim();
    if (!reason) {
        showToast('A reason is required to decline the offer.');
        return;
    }
    const deliveries = readRiderDeliveries();
    const partner = riderCurrentPartner();
    const delivery = deliveries?.find(record => String(record.id) === String(riderPendingOfferId));
    if (!deliveries || !partner || !delivery || delivery.status !== 'offered' || !riderOwnsDelivery(delivery, partner)) {
        showToast('This delivery offer is no longer available.');
        refreshRiderWorkflow();
        return;
    }
    if (delivery.offerExpiresAt && Date.parse(delivery.offerExpiresAt) <= Date.now()) {
        showToast('This delivery offer expired. The merchant can reassign it.');
        refreshRiderWorkflow();
        return;
    }
    const now = new Date().toISOString();
    const updated = {
        ...delivery,
        status: 'declined',
        updatedAt: now,
        declineReason: reason,
        statusHistory: [...(delivery.statusHistory || []), { status: 'declined', at: now, actor: partner.name, reason }]
    };
    const nextDeliveries = deliveries.map(record => record.id === delivery.id ? updated : record);
    if (!saveMerchantCollection('kiryaMerchantDeliveries', nextDeliveries)) return;
    refreshMerchantAfterRiderWrite({ deliveries: nextDeliveries });
    clearInterval(riderOrderTimer);
    document.getElementById('riderOrderModal').classList.remove('active');
    riderPendingOfferId = null;
    refreshRiderWorkflow();
    showToast('Offer declined. The merchant can assign another rider.');
}

function initRiderMap() {
    if(riderMap) return;
    
    // Use open, no-key map layers for a professional rider view.
        const streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; OpenStreetMap contributors &copy; Esri',
            maxZoom: 19
    });
    const cycleLayer = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CyclOSM',
      subdomains: 'abc',
      maxZoom: 20
    });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri', maxZoom: 19 });

    const riderDemoPosition = getRiderDemoPosition(riderCurrentPartner());
    riderMap = L.map('riderMap', { zoomControl: false, layers: [streetLayer] }).setView([riderDemoPosition.latitude, riderDemoPosition.longitude], 12);

    const baseMaps = {
        "Street View": streetLayer,
        "Cycle Map": cycleLayer,
        "Satellite": satelliteLayer
    };
    L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(riderMap);
    refreshLiveRiderMaps();
    renderMarketplaceMapOffers();
}

function initMerchantRiderTrackingMap() {
    const element = document.getElementById('merchantRiderLiveMap');
    if (!element || merchantRiderTrackingMap) return;
    merchantRiderTrackingMap = createTrackingMap(element);
    if (merchantPickupCoordinates) {
        merchantRiderTrackingMap.setView([merchantPickupCoordinates.latitude, merchantPickupCoordinates.longitude], 14);
    }
    updateMerchantPickupMarkers();
}

function toggleRiderStatus() {
    setRiderAvailability(!isRiderOnline);
}

function triggerRiderOrder() {
    if (!isRiderOnline || riderPendingOfferId !== null) return;
    const partner = riderCurrentPartner();
    const deliveries = readRiderDeliveries();
    if (!partner || !deliveries || getRiderActiveDelivery(deliveries, partner)) return;
    const offer = deliveries.find(delivery =>
        delivery.status === 'offered' && riderOwnsDelivery(delivery, partner) &&
        (!delivery.offerExpiresAt || Date.parse(delivery.offerExpiresAt) > Date.now())
    );
    if (offer) showRiderOffer(offer);
}

document.getElementById('riderDeclineBtn').addEventListener('click', () => {
    declineRiderDelivery();
});

document.getElementById('riderAcceptBtn').addEventListener('click', () => {
    acceptRiderDelivery(riderPendingOfferId);
});

function resetSwipeButton(text) {
    const container = document.getElementById('riderSwipeBtn');
    const knob = document.getElementById('riderSwipeKnob');
    const textEl = document.getElementById('riderSwipeText');
    
    container.classList.remove('completed');
    knob.style.transform = 'translateX(0)';
    textEl.textContent = text;
    textEl.style.opacity = '1';
    
    // Basic drag logic (simplified for click/drag simulation)
    let isDragging = false;
    let startX = 0;
    
    const onStart = (e) => {
        isDragging = true;
        startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    };
    
    const onMove = (e) => {
        if(!isDragging) return;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        let delta = clientX - startX;
        const maxDrag = container.clientWidth - knob.clientWidth - 8;
        if(delta < 0) delta = 0;
        if(delta > maxDrag) delta = maxDrag;
        knob.style.transform = `translateX(${delta}px)`;
        textEl.style.opacity = 1 - (delta / maxDrag);
        
        if(delta >= maxDrag - 5) {
            isDragging = false;
            completeSwipe();
        }
    };
    
    const onEnd = () => {
        if(!isDragging) return;
        isDragging = false;
        knob.style.transform = 'translateX(0)';
        textEl.style.opacity = '1';
    };
    
    knob.onmousedown = onStart;
    knob.ontouchstart = onStart;
    window.onmousemove = onMove;
    window.ontouchmove = onMove;
    window.onmouseup = onEnd;
    window.ontouchend = onEnd;
}

function completeSwipe() {
    const container = document.getElementById('riderSwipeBtn');
    const knob = document.getElementById('riderSwipeKnob');
    container.classList.add('completed');
    knob.style.transform = `translateX(${container.clientWidth - knob.clientWidth - 8}px)`;
    const partner = riderCurrentPartner();
    const deliveries = readRiderDeliveries();
    const delivery = deliveries && partner ? getRiderActiveDelivery(deliveries, partner) : null;
    if (!delivery) {
        showToast('Your active delivery could not be found. Refresh and try again.');
        refreshRiderWorkflow();
        return;
    }
    const nextStatus = delivery.status === 'accepted' || delivery.status === 'assigned'
        ? 'picked-up'
        : delivery.status === 'picked-up' ? 'in-transit' : 'delivered';
    window.setTimeout(() => updateRiderDelivery(delivery.id, nextStatus), 300);
}

document.getElementById('riderStatusToggle').addEventListener('click', toggleRiderStatus);

function initMerchantCharts() {
    if (dailySalesChartInstance) dailySalesChartInstance.destroy();
    if (topItemsChartInstance) topItemsChartInstance.destroy();
    if (orderStatusChartInstance) orderStatusChartInstance.destroy();
    if (menuAvailabilityChartInstance) menuAvailabilityChartInstance.destroy();
    dailySalesChartInstance = null;
    topItemsChartInstance = null;
    orderStatusChartInstance = null;
    menuAvailabilityChartInstance = null;

    const salesCtx = document.getElementById('dailySalesChart')?.getContext('2d');
    const itemsCtx = document.getElementById('topItemsChart')?.getContext('2d');
    const orderStatusCtx = document.getElementById('orderStatusChart')?.getContext('2d');
    const menuAvailabilityCtx = document.getElementById('menuAvailabilityChart')?.getContext('2d');

    if (!salesCtx || !itemsCtx || !orderStatusCtx || !menuAvailabilityCtx) return;
    const analytics = getMerchantAnalyticsSnapshot();

    dailySalesChartInstance = new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: analytics.valueLabels,
            datasets: [{
                label: 'Order value (UGX)',
                data: analytics.values,
                backgroundColor: ['#e2a529', '#15966f', '#d9534f'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value, index, values) {
                            return 'UGX ' + value / 1000 + 'k';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const pieLegendOptions = {
        position: 'left',
        labels: { boxWidth: 8, boxHeight: 8, padding: 10, usePointStyle: true }
    };

    topItemsChartInstance = new Chart(itemsCtx, {
        type: 'doughnut',
        data: {
            labels: analytics.categoryLabels,
            datasets: [{
                label: 'Menu items',
                data: analytics.categoryValues,
                backgroundColor: ['#FFBF42', '#ff4757', '#2ed573', '#1e90ff'],
                hoverOffset: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: pieLegendOptions }         }
    });

    orderStatusChartInstance = new Chart(orderStatusCtx, {
        type: 'pie',
        data: {
            labels: analytics.statusLabels,
            datasets: [{
                data: analytics.statusValues,
                backgroundColor: ['#e2a529', '#315e9f', '#15966f', '#1b8f78', '#d9534f'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: pieLegendOptions } }
    });

    const availableMenuItems = merchantMenuItems.filter(item => item.active).length;
    menuAvailabilityChartInstance = new Chart(menuAvailabilityCtx, {
        type: 'pie',
        data: {
            labels: ['Available', 'Unavailable'],
            datasets: [{
                data: [availableMenuItems, merchantMenuItems.length - availableMenuItems],
                backgroundColor: ['#15966f', '#cbd5d1'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: pieLegendOptions } }
    });
}

// --- Merchant tools ---
/* Merchant Menu Logic */
const merchantMenuScreen = document.getElementById('merchantMenuScreen');
const merchantAddMenuBtn = document.getElementById('merchantAddMenuBtn');
const merchantEditItemScreen = document.getElementById('merchantEditItemScreen');

let merchantMenuItems = [
    { id: 1, name: "Double Cheese Burger", price: 25000, category: "Burgers", img: "🍔", image: "assets/merchant-burger.jpg", description: "Two grilled beef patties with melted cheese and house sauce.", ingredients: "Beef, cheddar, brioche bun, lettuce, tomato, house sauce", active: true },
    { id: 2, name: "Spicy Chicken Wings", price: 30000, category: "Chicken", img: "🍗", image: "assets/merchant-wings.jpg", description: "Crispy wings tossed in a gently spiced glaze.", ingredients: "Chicken wings, chili, garlic, honey, sesame", active: true },
    { id: 3, name: "Fresh Orange Juice", price: 8000, category: "Drinks", img: "🥤", image: "assets/merchant-drink.jpg", description: "Freshly squeezed orange juice, served chilled.", ingredients: "Fresh oranges", active: true },
    { id: 4, name: "French Fries", price: 15000, category: "Sides", img: "🍟", image: "assets/merchant-fries.jpg", description: "Golden fries with a light seasoning.", ingredients: "Potatoes, vegetable oil, sea salt", active: false },
    { id: 5, name: "Chicken Pizza", price: 35000, category: "Pizza", img: "🍕", image: "assets/merchant-pizza.jpg", description: "Stone-baked pizza topped with chicken and fresh herbs.", ingredients: "Chicken, mozzarella, tomato, red onion, herbs", active: true }
];

merchantMenuItems = loadMerchantCollection('kiryaMerchantMenu', merchantMenuItems, item =>
    item && Number.isInteger(item.id) && typeof item.name === 'string' &&
    Number.isFinite(item.price) && item.price > 0 && typeof item.active === 'boolean'
);

function escapeMerchantText(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function formatMerchantCurrency(value) {
    return `UGX ${Number(value).toLocaleString('en-UG')}`;
}

function loadMerchantCollection(key, fallback, isValidRecord) {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return fallback.map(record => ({ ...record }));
        const records = JSON.parse(saved);
        if (!Array.isArray(records) || !records.every(isValidRecord)) {
            throw new Error(`Saved ${key} data has an invalid format.`);
        }
        return records;
    } catch (error) {
        console.error(`Unable to load merchant data for ${key}.`, error);
        showToast('Could not load saved merchant data; using sample records.');
        return fallback.map(record => ({ ...record }));
    }
}

function saveMerchantCollection(key, records) {
    try {
        localStorage.setItem(key, JSON.stringify(records));
        return true;
    } catch (error) {
        console.error(`Unable to save merchant data for ${key}.`, error);
        showToast('Changes could not be saved in this browser.');
        return false;
    }
}

function saveMerchantCollections(collections) {
    const previousValues = new Map();
    const savedKeys = [];
    try {
        for (const key of Object.keys(collections)) previousValues.set(key, localStorage.getItem(key));
        for (const [key, records] of Object.entries(collections)) {
            localStorage.setItem(key, JSON.stringify(records));
            savedKeys.push(key);
        }
        return true;
    } catch (error) {
        console.error('Unable to save related merchant records.', error);
        for (const key of savedKeys.reverse()) {
            try {
                const previousValue = previousValues.get(key);
                if (previousValue === null) localStorage.removeItem(key);
                else localStorage.setItem(key, previousValue);
            } catch (rollbackError) {
                console.error(`Unable to restore merchant data for ${key}.`, rollbackError);
            }
        }
        showToast('Changes could not be saved in this browser.');
        return false;
    }
}

const merchantRecordPageSize = 10;
const merchantRecordPages = { customers: 1, partners: 1, deliveries: 1 };
const notifiedOverdueDeliveries = new Set();

function paginateMerchantRecords(type, records) {
    const pageCount = Math.max(1, Math.ceil(records.length / merchantRecordPageSize));
    merchantRecordPages[type] = Math.min(merchantRecordPages[type], pageCount);
    const page = merchantRecordPages[type];
    const start = (page - 1) * merchantRecordPageSize;
    const section = type === 'partners' ? 'Partner' : type === 'customers' ? 'Customer' : 'Delivery';
    document.getElementById(`merchant${section}PageInfo`).textContent =
        records.length ? `Showing ${start + 1}-${Math.min(start + merchantRecordPageSize, records.length)} of ${records.length}` : 'No records';
    document.getElementById(`merchant${section}Prev`).disabled = page <= 1;
    document.getElementById(`merchant${section}Next`).disabled = page >= pageCount;
    return records.slice(start, start + merchantRecordPageSize);
}

function exportMerchantRecords(filename, records, columns) {
    const csv = [
        columns.map(([, label]) => label),
        ...records.map(record => columns.map(([key]) => {
            const value = record[key] ?? '';
            return typeof value === 'object' ? JSON.stringify(value) : value;
        }))
    ].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function merchantPhoneKey(phone) {
    return String(phone || '').replace(/\D/g, '');
}

function createCustomerMarketplaceOrder({ restaurant, items, subtotal, deliveryFee, tipAmount, total, customerName, customerPhone, deliveryAddress, paymentMethod, notes }) {
    const normalizedAddress = String(deliveryAddress || '').trim();
    if (!normalizedAddress || ['Not set', 'Set delivery address'].includes(normalizedAddress)) {
        showToast('Set a delivery address before placing your order.');
        return false;
    }
    const name = String(customerName || '').trim();
    const phone = String(customerPhone || '').trim();
    if (merchantPhoneKey(phone).length < 8) {
        showToast('Enter a valid customer phone number before placing the order.');
        return false;
    }
    const createdAt = new Date().toISOString();
    const customer = merchantCustomers.find(record => merchantPhoneKey(record.phone) === merchantPhoneKey(phone));
    const customerId = customer?.id || Math.max(0, ...merchantCustomers.map(record => record.id)) + 1;
    const order = {
        id: `#C${Date.now().toString(36).toUpperCase()}`,
        customer: name || 'Customer',
        phone,
        customerId,
        merchant: String(restaurant || 'Kirya merchant').trim(),
        createdAt,
        received: new Date().toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' }),
        fulfillment: 'delivery',
        deliveryAddress: normalizedAddress,
        pickupAddress: merchantPickupAddress,
        items: items.join(', '),
        subtotal: formatMerchantCurrency(subtotal),
        deliveryFee: formatMerchantCurrency(deliveryFee),
        tip: formatMerchantCurrency(tipAmount),
        total: formatMerchantCurrency(total),
        paymentMethod,
        customerNotes: notes || '',
        status: 'new',
        statusHistory: [{ status: 'new', at: createdAt, actor: 'Customer (prototype)' }]
    };
    const nextCustomers = customer
        ? merchantCustomers.map(record => record.id === customer.id
            ? {
                ...record,
                name: name || record.name,
                address: normalizedAddress,
                orders: record.orders + 1,
                lastOrderAt: createdAt,
                updatedAt: createdAt
            }
            : record)
        : [{
            id: customerId,
            name: name || 'Customer',
            phone,
            email: '',
            address: normalizedAddress,
            orders: 1,
            lastOrderAt: createdAt,
            createdAt,
            updatedAt: createdAt
        }, ...merchantCustomers];
    const nextActiveOrders = [order, ...demoActiveOrders];
    if (!saveMerchantCollections({
        kiryaMerchantActiveOrders: nextActiveOrders,
        kiryaMerchantCustomers: nextCustomers
    })) return false;
    demoActiveOrders = nextActiveOrders;
    merchantCustomers = nextCustomers;
    try {
        localStorage.setItem('kiryaCustomerPhone', phone);
    } catch (error) {
        console.error('Unable to save the customer order lookup contact.', error);
        showToast('Order was recorded, but the customer contact could not be saved on this device.');
    }
    renderCustomerOrders();
    renderMerchantActiveOrders();
    renderMerchantCustomers();
    renderMerchantAssignmentOptions();
    updateMerchantOrderMetrics();
    return order;
}

function updateMerchantMenuCount() {
    const count = document.getElementById('merchantAvailableMenuCount');
    const availableCount = merchantMenuItems.filter(item => item.active).length;
    if (count) count.textContent = `${availableCount} / ${merchantMenuItems.length}`;
    if (menuAvailabilityChartInstance) {
        menuAvailabilityChartInstance.data.datasets[0].data = [availableCount, merchantMenuItems.length - availableCount];
        menuAvailabilityChartInstance.update();
    }
    if (dailySalesChartInstance || topItemsChartInstance || orderStatusChartInstance) updateMerchantAnalytics();
}

updateMerchantMenuCount();

function renderMerchantMenuItems() {
    const list = document.getElementById('merchantMenuList');
    if(!list) return;
    updateMerchantMenuCount();
    list.innerHTML = '';
    const search = document.getElementById('merchantMenuSearch').value.trim().toLowerCase();
    const filteredItems = merchantMenuItems.filter(item =>
        `${item.name} ${item.category || ''} ${item.description || ''}`.toLowerCase().includes(search)
    );

    if (filteredItems.length === 0) {
        list.innerHTML = '<div class="merchant-record-empty">No menu items match your search.</div>';
        return;
    }

    filteredItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-mgmt-item';
        const productImage = item.image
            ? `<img src="${escapeMerchantText(item.image)}" alt="" loading="lazy">`
            : escapeMerchantText(item.img || '');
        div.innerHTML = `
            <button class="menu-mgmt-edit" type="button" aria-label="Edit ${escapeMerchantText(item.name)}">
            <div class="menu-mgmt-info">
                <div class="menu-mgmt-img">${productImage}</div>
                <div class="menu-mgmt-text">
                    <div class="menu-mgmt-name">${escapeMerchantText(item.name)}</div>
                    <div class="menu-mgmt-price">${formatMerchantCurrency(item.price)}</div>
                    <div class="menu-mgmt-category">${escapeMerchantText(item.category || 'Other')}</div>
                    <div class="menu-mgmt-description">${escapeMerchantText(item.description)}</div>
                </div>
            </div>
            </button>
            <button class="menu-mgmt-toggle ${item.active ? 'active' : ''}" type="button" aria-label="${item.active ? 'Disable' : 'Enable'} ${escapeMerchantText(item.name)}" aria-pressed="${item.active}"></button>
        `;
        
        div.querySelector('.menu-mgmt-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            const toggle = e.currentTarget;
            const dataItem = merchantMenuItems.find(i => i.id === item.id);
            if (dataItem) dataItem.active = !dataItem.active;
            saveMerchantCollection('kiryaMerchantMenu', merchantMenuItems);
            renderMerchantMenuItems();
            updateMerchantMenuCount();
            showToast(`${item.name} status updated`);
        });
        
        div.querySelector('.menu-mgmt-edit').addEventListener('click', () => {
            openEditItemScreen(item.id);
        });

        list.appendChild(div);
    });
}

function openEditItemScreen(itemId) {
    const titleEl = document.getElementById('editItemTitle');
    const nameInput = document.getElementById('editItemName');
    const priceInput = document.getElementById('editItemPrice');
    const imgInput = document.getElementById('editItemImg');
    const imageInput = document.getElementById('editItemImage');
    const descriptionInput = document.getElementById('editItemDescription');
    const ingredientsInput = document.getElementById('editItemIngredients');
    const categoryInput = document.getElementById('editItemCategory');
    const idInput = document.getElementById('editItemId');
    const deleteBtn = document.getElementById('deleteItemBtn');

    if (itemId === null) { // Add mode
        titleEl.textContent = 'Add New Item';
        nameInput.value = '';
        priceInput.value = '';
        imgInput.value = '';
        imageInput.value = '';
        descriptionInput.value = '';
        ingredientsInput.value = '';
        categoryInput.value = 'Other';
        idInput.value = '';
        deleteBtn.style.display = 'none';
    } else { // Edit mode
        const item = merchantMenuItems.find(i => i.id === itemId);
        if (!item) return;
        titleEl.textContent = 'Edit Item';
        nameInput.value = item.name;
        priceInput.value = item.price;
        imgInput.value = item.img;
        imageInput.value = item.image || '';
        descriptionInput.value = item.description || '';
        ingredientsInput.value = item.ingredients || '';
        categoryInput.value = item.category || 'Other';
        idInput.value = item.id;
        deleteBtn.style.display = 'block';
    }
    updateMerchantImagePreview(imageInput.value);
    merchantEditItemScreen.classList.add('active');
    nameInput.focus();
}

function updateMerchantImagePreview(imageUrl) {
    const preview = document.getElementById('merchantImagePreview');
    const status = document.getElementById('merchantImagePreviewStatus');
    if (!preview || !status) return;
    preview.querySelector('img')?.remove();
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) {
        status.textContent = 'Image preview appears here';
        preview.classList.remove('has-image', 'image-error');
        return;
    }
    try {
        if (!['http:', 'https:'].includes(new URL(trimmedUrl, window.location.href).protocol)) {
            status.textContent = 'Use an HTTP(S) image URL or relative path.';
            preview.classList.remove('has-image');
            preview.classList.add('image-error');
            return;
        }
    } catch {
        status.textContent = 'Enter a valid image URL or relative path.';
        preview.classList.remove('has-image');
        preview.classList.add('image-error');
        return;
    }
    const image = document.createElement('img');
    image.alt = 'Menu item preview';
    image.onload = () => {
        status.textContent = '';
        preview.classList.add('has-image');
        preview.classList.remove('image-error');
    };
    image.onerror = () => {
        image.remove();
        status.textContent = 'Image could not be loaded. Check the URL.';
        preview.classList.remove('has-image');
        preview.classList.add('image-error');
    };
    image.src = trimmedUrl;
    preview.appendChild(image);
}

function openMerchantMenu() {
    setMerchantNavView('menu');
    merchantMenuScreen.classList.add('active');
    renderMerchantMenuItems();
}

function openMerchantNewItem() {
    [merchantKioskScreen, merchantMenuScreen, merchantEditItemScreen, merchantOrdersScreen, merchantActiveOrdersScreen]
        .forEach(screen => screen?.classList.remove('active'));
    setMerchantNavView('menu');
    merchantMenuScreen?.classList.add('active');
    openEditItemScreen(null);
    setMerchantNavOpen(false);
}

if(merchantAddMenuBtn) merchantAddMenuBtn.addEventListener('click', openMerchantNewItem);
document.getElementById('merchantMenuSearch').addEventListener('input', renderMerchantMenuItems);
document.getElementById('editItemImage').addEventListener('input', event => updateMerchantImagePreview(event.target.value));

document.getElementById('saveItemBtn').addEventListener('click', () => {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('editItemName').value;
    const price = parseFloat(document.getElementById('editItemPrice').value);
    const img = document.getElementById('editItemImg').value;
    const image = document.getElementById('editItemImage').value.trim();
    const description = document.getElementById('editItemDescription').value.trim();
    const ingredients = document.getElementById('editItemIngredients').value.trim();
    const category = document.getElementById('editItemCategory').value;
    const imageInput = document.getElementById('editItemImage');

    if (!name.trim() || !Number.isFinite(price) || price <= 0 || price % 500 !== 0) { showToast('Enter an item name and a price in 500 UGX increments.'); return; }
    let isValidImageUrl = true;
    if (imageInput.value.trim()) {
        try {
            isValidImageUrl = ['http:', 'https:'].includes(new URL(imageInput.value.trim(), window.location.href).protocol);
        } catch {
            isValidImageUrl = false;
        }
    }
    if (!isValidImageUrl) {
        imageInput.focus();
        showToast('Enter an HTTP(S) image URL or a valid relative path.');
        return;
    }

    if (id) { // Update existing
        const item = merchantMenuItems.find(i => i.id === Number(id));
        if (item) { Object.assign(item, { name: name.trim(), price, img, image, description, ingredients, category }); }
    } else { // Add new
        const newId = Math.max(0, ...merchantMenuItems.map(i => i.id)) + 1;
        merchantMenuItems.push({ id: newId, name: name.trim(), price, category, img, image, description, ingredients, active: true });
    }
    saveMerchantCollection('kiryaMerchantMenu', merchantMenuItems);
    renderMerchantMenuItems();
    updateMerchantAnalytics();
    updateMerchantImagePreview('');
    merchantEditItemScreen.classList.remove('active');
    showToast('Menu updated successfully!');
});

document.getElementById('deleteItemBtn').addEventListener('click', () => {
    const id = document.getElementById('editItemId').value;
    if (id && confirm('Are you sure you want to delete this item?')) {
        merchantMenuItems = merchantMenuItems.filter(i => i.id != id);
        saveMerchantCollection('kiryaMerchantMenu', merchantMenuItems);
        renderMerchantMenuItems();
        merchantEditItemScreen.classList.remove('active');
        showToast('Item deleted.');
    }
});

/* Merchant Past Orders Logic */
const merchantOrdersScreen = document.getElementById('merchantOrdersScreen');
const merchantActiveOrdersScreen = document.getElementById('merchantActiveOrdersScreen');
const merchantCustomersScreen = document.getElementById('merchantCustomersScreen');
const merchantDeliveryScreen = document.getElementById('merchantDeliveryScreen');
const merchantAssignedRidersScreen = document.getElementById('merchantAssignedRidersScreen');
const merchantOrdersList = document.getElementById('merchantOrdersList');
const merchantPortalScreen = document.getElementById('shopPortalScreen');
const merchantProfileScreen = document.getElementById('merchantProfileScreen');
const merchantHeaderNavToggles = document.querySelectorAll('[data-merchant-nav-toggle]');
const merchantSidebarBackdrop = document.getElementById('merchantSidebarBackdrop');
const merchantSidebar = document.getElementById('merchantSidebar');
const merchantSidebarClose = document.getElementById('merchantSidebarClose');
const merchantSidebarNav = document.querySelector('.merchant-side-nav');
const merchantStoreToggleBtn = document.getElementById('merchantStoreToggleBtn');
const merchantStoreStatusIndicator = document.getElementById('merchantStoreStatusIndicator');
const merchantKioskScreen = document.getElementById('merchantKioskScreen');
const merchantKioskCartJump = document.getElementById('merchantKioskCartJump');
function loadMerchantStoreStatus() {
    try {
        return localStorage.getItem('kiryaMerchantStoreOpen') !== 'false';
    } catch (error) {
        console.error('Unable to load merchant store status.', error);
        showToast('Could not load the saved store status.');
        return true;
    }
}

let merchantStoreIsOpen = loadMerchantStoreStatus();

function loadMerchantPickupAddress() {
    try {
        const saved = localStorage.getItem('kiryaMerchantPickupAddress');
        if (saved === null) return '';
        const address = JSON.parse(saved);
        if (typeof address !== 'string') throw new Error('Saved pickup address is not text.');
        return address;
    } catch (error) {
        console.error('Unable to load the merchant pickup address.', error);
        showToast('Saved rider pickup location could not be loaded.');
        return '';
    }
}

function loadMerchantProfile() {
    const fallback = { name: 'Al Reef Restaurant', category: 'Restaurant', phone: '' };
    try {
        const saved = localStorage.getItem('kiryaMerchantProfile');
        if (saved === null) return fallback;
        const profile = JSON.parse(saved);
        if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
            throw new Error('Saved merchant profile is invalid.');
        }
        return {
            name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : fallback.name,
            category: ['Restaurant', 'Grocery', 'Pharmacy', 'Retail', 'Other'].includes(profile.category) ? profile.category : fallback.category,
            phone: typeof profile.phone === 'string' ? profile.phone : '',
            address: typeof profile.address === 'string' ? profile.address : ''
        };
    } catch (error) {
        console.error('Unable to load the merchant profile.', error);
        showToast('Saved business profile could not be loaded.');
        return fallback;
    }
}

function loadMerchantPickupCoordinates() {
    try {
        const saved = localStorage.getItem('kiryaMerchantPickupCoordinates');
        if (saved === null) return null;
        const coordinates = JSON.parse(saved);
        if (coordinates === null) return null;
        if (!coordinates || !Number.isFinite(coordinates.latitude) || Math.abs(coordinates.latitude) > 90 ||
            !Number.isFinite(coordinates.longitude) || Math.abs(coordinates.longitude) > 180) {
            throw new Error('Saved pickup coordinates are invalid.');
        }
        return coordinates;
    } catch (error) {
        console.error('Unable to load the merchant pickup coordinates.', error);
        showToast('Saved pickup map location could not be loaded.');
        return null;
    }
}

let merchantProfile = loadMerchantProfile();
let merchantPickupAddress = loadMerchantPickupAddress() || merchantProfile.address;
let merchantPickupCoordinates = loadMerchantPickupCoordinates();
document.getElementById('merchantBusinessName').value = merchantProfile.name;
document.getElementById('merchantBusinessCategory').value = merchantProfile.category;
document.getElementById('merchantBusinessPhone').value = merchantProfile.phone;
document.getElementById('merchantPickupAddress').value = merchantPickupAddress;
document.getElementById('merchantPickupAddressStatus').textContent = merchantPickupAddress
    ? merchantPickupCoordinates ? 'Pickup address and map pin are saved for new rider offers.' : 'Pickup location is saved and will be included in new delivery orders.'
    : 'Add the store address before sending rider offers.';

document.getElementById('merchantPickupAddress').addEventListener('input', () => {
    if (!merchantPickupCoordinates) return;
    merchantPickupCoordinates = null;
    updateMerchantPickupMarkers();
    updateRiderPickupDestination();
    updateRiderPickupRoute(riderLocationMarker?.getLatLng() || null);
});

function setMerchantNavView(view) {
    document.querySelectorAll('#merchantSidebar [data-merchant-view]').forEach(button => {
        const isActive = button.dataset.merchantView === view;
        button.classList.toggle('active', isActive);
        if (isActive) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });
}

function setMerchantNavOpen(isOpen) {
    document.body.classList.toggle('merchant-nav-open', isOpen);
    merchantSidebar?.setAttribute('aria-hidden', String(!isOpen));
    if (merchantSidebar) merchantSidebar.inert = !isOpen;
    merchantHeaderNavToggles.forEach(toggle => {
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close merchant navigation' : 'Open merchant navigation');
    });
}

function toggleMerchantHeaderNavigation() {
    const isOpening = !document.body.classList.contains('merchant-nav-open');
    setMerchantNavOpen(isOpening);
    if (isOpening) merchantSidebarClose?.focus();
}

function closeMerchantNavAndReturnFocus() {
    setMerchantNavOpen(false);
    document.querySelector('.generic-screen.active [data-merchant-nav-toggle]')?.focus();
}

function navigateMerchantView(view) {
    setMerchantNavView(view);
    const merchantScreens = [
        merchantPortalScreen, merchantProfileScreen, merchantActiveOrdersScreen, merchantOrdersScreen,
        merchantMenuScreen, merchantEditItemScreen, merchantKioskScreen,
        merchantDeliveryScreen, merchantAssignedRidersScreen, merchantCustomersScreen
    ];
    merchantScreens.forEach(screen => screen?.classList.remove('active'));

    if (view === 'dashboard') {
        merchantPortalScreen?.classList.add('active');
        document.getElementById('merchantPortalContent')?.scrollTo({ top: 0 });
    } else if (view === 'profile') {
        merchantProfileScreen?.classList.add('active');
        initMerchantPickupMap();
        setTimeout(() => merchantPickupMap?.invalidateSize(), 100);
    } else if (view === 'kiosk') {
        openMerchantKiosk();
    } else if (view === 'orders') {
        openMerchantOrders();
    } else if (view === 'active-orders') {
        openMerchantActiveOrders();
    } else if (view === 'menu') {
        openMerchantMenu();
    } else if (view === 'delivery') {
        renderMerchantPartners();
        merchantDeliveryScreen?.classList.add('active');
    } else if (view === 'assigned-riders') {
        populateMerchantAssignmentOptions();
        renderMerchantDeliveries();
        merchantAssignedRidersScreen?.classList.add('active');
        initMerchantRiderTrackingMap();
        setTimeout(() => merchantRiderTrackingMap?.invalidateSize(), 100);
        refreshLiveRiderMaps();
    } else if (view === 'customers') {
        renderMerchantCustomers();
        merchantCustomersScreen?.classList.add('active');
    }
    setMerchantNavOpen(false);
    document.querySelector('.generic-screen.active [data-merchant-nav-toggle]')?.focus();
}

merchantHeaderNavToggles.forEach(toggle => toggle.addEventListener('click', toggleMerchantHeaderNavigation));
merchantSidebarBackdrop?.addEventListener('click', closeMerchantNavAndReturnFocus);
merchantSidebarClose?.addEventListener('click', closeMerchantNavAndReturnFocus);
merchantSidebarNav?.addEventListener('click', event => {
    const button = event.target.closest('[data-merchant-view]');
    if (button) navigateMerchantView(button.dataset.merchantView);
});
merchantKioskCartJump?.addEventListener('click', () => {
    document.getElementById('merchantKioskCartPanel')?.scrollIntoView({ block: 'start' });
});
function updateMerchantStoreStatus() {
    const action = merchantStoreIsOpen ? 'Close store' : 'Open store';
    const status = merchantStoreIsOpen ? 'Open' : 'Closed';
    const label = merchantStoreToggleBtn?.querySelector('.merchant-side-label');
    if (label) label.textContent = action;
    merchantStoreToggleBtn?.setAttribute('aria-label', action);
    if (merchantStoreToggleBtn) merchantStoreToggleBtn.title = action;
    merchantStoreToggleBtn?.classList.toggle('is-closed', !merchantStoreIsOpen);
    const storeStatusText = document.getElementById('merchantStoreStatusText');
    if (storeStatusText) storeStatusText.textContent = status;
    merchantStoreStatusIndicator?.classList.toggle('is-closed', !merchantStoreIsOpen);
    const closedNotice = document.getElementById('merchantKioskClosedNotice');
    if (closedNotice) closedNotice.hidden = merchantStoreIsOpen;
    const placeOrderButton = document.getElementById('merchantKioskPlaceOrder');
    if (placeOrderButton) placeOrderButton.disabled = !merchantStoreIsOpen || merchantKioskCart.size === 0;
}

merchantStoreToggleBtn?.addEventListener('click', () => {
    merchantStoreIsOpen = !merchantStoreIsOpen;
    try {
        localStorage.setItem('kiryaMerchantStoreOpen', String(merchantStoreIsOpen));
    } catch (error) {
        console.error('Unable to save merchant store status.', error);
        showToast('Store status could not be saved in this browser.');
    }
    updateMerchantStoreStatus();
    const status = merchantStoreIsOpen ? 'open' : 'closed';
    showToast(`Store is now ${status}.`);
});

document.addEventListener('keydown', event => {
    if (!document.body.classList.contains('merchant-nav-open')) return;
    if (event.key === 'Escape') {
        closeMerchantNavAndReturnFocus();
        return;
    }
    if (event.key === 'Tab') {
        const focusableItems = merchantSidebar?.querySelectorAll('button:not([disabled])');
        if (!focusableItems?.length) return;
        const first = focusableItems[0];
        const last = focusableItems[focusableItems.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
});

const merchantOrderSamples = [
    { id: '#8909', customer: 'Joel M. (sample)', customerId: 12, phone: '+256 700 030112', items: '1x Spicy Chicken Wings, 1x Fresh Orange Juice', total: 'UGX 38,000', received: '11:02 AM', status: 'new', demoSample: true, area: 'Ntinda, Kampala' },
    { id: '#8908', customer: 'Esther A. (sample)', customerId: 13, phone: '+256 700 030113', items: '1x Chicken Pizza, 1x French Fries', total: 'UGX 50,000', received: '11:08 AM', status: 'preparing', demoSample: true, area: 'Kisaasi, Kampala' },
    { id: '#8907', customer: 'Brian T. (sample)', customerId: 14, phone: '+256 700 030114', items: '2x Double Cheese Burger', total: 'UGX 50,000', received: '11:14 AM', status: 'ready', demoSample: true, area: 'Ntinda, Kampala' },
    { id: '#8906', customer: 'Lydia K. (sample)', customerId: 15, phone: '+256 700 030115', items: '1x Spicy Chicken Wings, 2x Fresh Orange Juice', total: 'UGX 46,000', received: '11:19 AM', status: 'new', demoSample: true, area: 'Bukoto, Kampala' }
];

let demoActiveOrders = loadMerchantCollection('kiryaMerchantActiveOrders', [
    { id: '#8912', customer: 'Sarah N.', items: '2x Chicken Biryani, 1x Mango Juice', total: 'UGX 42,000', received: '10:42 AM', status: 'new' },
    { id: '#8911', customer: 'Daniel K.', items: '1x Family Pizza, 2x Soda', total: 'UGX 68,000', received: '10:35 AM', status: 'preparing' },
    { id: '#8910', customer: 'Amina S.', items: '1x Grilled Chicken, 1x Fries', total: 'UGX 51,000', received: '10:28 AM', status: 'ready' }
], order =>
    order && typeof order.id === 'string' && typeof order.customer === 'string' &&
    typeof order.items === 'string' && typeof order.total === 'string' &&
    /\d/.test(order.total) && typeof order.received === 'string' &&
    ['new', 'preparing', 'ready'].includes(order.status)
);
const savedMerchantOrders = demoActiveOrders;
demoActiveOrders = mergeDemoRecords(demoActiveOrders, merchantOrderSamples);
if (demoActiveOrders.length !== savedMerchantOrders.length) saveMerchantCollection('kiryaMerchantActiveOrders', demoActiveOrders);

let merchantCustomers = [
    { id: 1, name: 'Sarah N.', phone: '+256 772 123456', email: 'sarah@example.com', address: 'Kololo, Kampala', orders: 12, lastOrderAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 2, name: 'Daniel K.', phone: '+256 701 234567', email: 'daniel@example.com', address: 'Ntinda, Kampala', orders: 8, lastOrderAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 3, name: 'Amina S.', phone: '+256 783 345678', email: 'amina@example.com', address: 'Bugolobi, Kampala', orders: 5, lastOrderAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 12, name: 'Joel M. (sample)', phone: '+256 700 030112', email: 'joel.demo@example.test', address: 'Ntinda, Kampala', orders: 1, lastOrderAt: new Date().toISOString(), demoSample: true },
    { id: 13, name: 'Esther A. (sample)', phone: '+256 700 030113', email: 'esther.demo@example.test', address: 'Kisaasi, Kampala', orders: 2, lastOrderAt: new Date().toISOString(), demoSample: true },
    { id: 14, name: 'Brian T. (sample)', phone: '+256 700 030114', email: 'brian.demo@example.test', address: 'Ntinda, Kampala', orders: 3, lastOrderAt: new Date().toISOString(), demoSample: true },
    { id: 15, name: 'Lydia K. (sample)', phone: '+256 700 030115', email: 'lydia.demo@example.test', address: 'Bukoto, Kampala', orders: 1, lastOrderAt: new Date().toISOString(), demoSample: true },
    ...ugandaRegionalCustomers
];

const savedMerchantCustomers = loadMerchantCollection('kiryaMerchantCustomers', merchantCustomers, customer =>
    customer && Number.isInteger(customer.id) && typeof customer.name === 'string' &&
    typeof customer.phone === 'string' && typeof customer.email === 'string' &&
    typeof customer.address === 'string' && Number.isInteger(customer.orders) && customer.orders >= 0
);
merchantCustomers = mergeDemoRecords(savedMerchantCustomers, merchantCustomers);
if (merchantCustomers.length !== savedMerchantCustomers.length) saveMerchantCollection('kiryaMerchantCustomers', merchantCustomers);

let merchantNeedsOrderMigration = false;
demoActiveOrders = demoActiveOrders.map(order => {
    const customer = merchantCustomers.find(record =>
        record.id === order.customerId ||
        (order.phone && merchantPhoneKey(record.phone) === merchantPhoneKey(order.phone)) ||
        record.name.toLowerCase() === order.customer.toLowerCase()
    );
    const fulfillment = order.fulfillment || (order.table ? 'dine-in' : 'delivery');
    const deliveryAddress = order.deliveryAddress || (fulfillment === 'delivery' ? customer?.address || '' : '');
    const statusHistory = Array.isArray(order.statusHistory)
        ? order.statusHistory.filter(item => item && typeof item.status === 'string' && Number.isFinite(Date.parse(item.at)))
        : [];
    if (order.fulfillment !== fulfillment || order.deliveryAddress !== deliveryAddress ||
        statusHistory.length !== (order.statusHistory?.length || 0) || !statusHistory.length) {
        merchantNeedsOrderMigration = true;
    }
    return {
        ...order,
        fulfillment,
        deliveryAddress,
        statusHistory: statusHistory.length
            ? statusHistory
            : [{
                status: order.status,
                at: Number.isFinite(Date.parse(order.createdAt)) ? order.createdAt : new Date().toISOString(),
                actor: 'Legacy record'
            }]
    };
});
if (merchantNeedsOrderMigration) saveMerchantCollection('kiryaMerchantActiveOrders', demoActiveOrders);

let merchantPartners = [
    { id: 1, name: 'James M.', phone: '+256 700 111222', email: 'james@example.com', vehicle: 'Motorcycle', area: 'Ntinda, Kampala', status: 'active', verificationStatus: 'verified' },
    { id: 2, name: 'Grace N.', phone: '+256 780 333444', email: 'grace@example.com', vehicle: 'Motorcycle', area: 'Bugolobi, Kampala', status: 'active', verificationStatus: 'verified' },
    ...ugandaRegionalRiders
];

const savedMerchantPartners = loadMerchantCollection('kiryaMerchantPartners', merchantPartners, partner =>
    partner && Number.isInteger(partner.id) && typeof partner.name === 'string' &&
    typeof partner.phone === 'string' && typeof partner.email === 'string' &&
    typeof partner.vehicle === 'string' && typeof partner.area === 'string' &&
    ['active', 'inactive'].includes(partner.status)
);
merchantPartners = mergeDemoRecords(savedMerchantPartners, merchantPartners).map(partner => ({
    ...partner,
    availability: ['available', 'off-duty'].includes(partner.availability) ? partner.availability : 'available',
    verificationStatus: ['verified', 'pending', 'rejected'].includes(partner.verificationStatus) ? partner.verificationStatus : 'verified',
    adminAudit: Array.isArray(partner.adminAudit) ? partner.adminAudit : []
}));
if (merchantPartners.length !== savedMerchantPartners.length) saveMerchantCollection('kiryaMerchantPartners', merchantPartners);

let merchantDeliveries = [
    { id: 1, order: '#8911', customer: 'Daniel K.', address: 'Ntinda, Kampala', driver: 'James M.', phone: '+256 700 111222', status: 'in-transit' },
    { id: 2, order: '#8910', customer: 'Amina S.', address: 'Bugolobi, Kampala', driver: 'Grace N.', phone: '+256 780 333444', status: 'assigned' }
];

const merchantDeliveryStatusLabels = {
    offered: 'Offered',
    accepted: 'Accepted',
    assigned: 'Assigned',
    'picked-up': 'Picked up',
    'in-transit': 'In transit',
    delivered: 'Delivered',
    declined: 'Declined',
    failed: 'Failed',
    cancelled: 'Cancelled'
};

let merchantNeedsDeliveryMigration = false;
merchantDeliveries = loadMerchantCollection('kiryaMerchantDeliveries', merchantDeliveries, delivery =>
    delivery && Number.isInteger(delivery.id) && typeof delivery.order === 'string' &&
    typeof delivery.customer === 'string' && typeof delivery.address === 'string' &&
    typeof delivery.driver === 'string' && typeof delivery.phone === 'string' &&
    ['offered', 'accepted', 'assigned', 'picked-up', 'in-transit', 'delivered', 'declined', 'failed', 'cancelled'].includes(delivery.status)
).map(delivery => {
    const now = new Date().toISOString();
    const partner = merchantPartners.find(record => merchantPhoneKey(record.phone) === merchantPhoneKey(delivery.phone));
    const order = demoActiveOrders.find(record => record.id === delivery.order);
    const customer = order && merchantCustomers.find(record =>
        record.id === order.customerId ||
        (order.phone && merchantPhoneKey(record.phone) === merchantPhoneKey(order.phone)) ||
        record.name.toLowerCase() === order.customer.toLowerCase()
    );
    const assignedAt = delivery.assignedAt || delivery.createdAt || now;
    const statusHistory = Array.isArray(delivery.statusHistory)
        ? delivery.statusHistory.filter(item =>
            item && merchantDeliveryStatusLabels[item.status] && Number.isFinite(Date.parse(item.at))
        )
        : [];
    const status = delivery.status === 'assigned' ? 'accepted' : delivery.status;
    const normalizedHistory = statusHistory.map(item => ({
        ...item,
        status: item.status === 'assigned' ? 'accepted' : item.status,
        actor: item.actor || 'Legacy record'
    }));
    if (!delivery.assignedAt || !delivery.partnerId || status !== delivery.status ||
        !statusHistory.length ||
        normalizedHistory.length !== (delivery.statusHistory?.length || 0) ||
        normalizedHistory.some((item, index) =>
            item.actor !== statusHistory[index]?.actor || item.status !== statusHistory[index]?.status
        ) ||
        (customer && (!delivery.customerId || !delivery.customerPhone))) {
        merchantNeedsDeliveryMigration = true;
    }
    return {
        ...delivery,
        status,
        partnerId: delivery.partnerId || partner?.id || null,
        customerId: delivery.customerId || customer?.id || null,
        customerPhone: delivery.customerPhone || order?.phone || customer?.phone || '',
        address: delivery.address || order?.deliveryAddress || customer?.address || '',
        assignedAt,
        updatedAt: delivery.updatedAt || assignedAt,
        statusHistory: normalizedHistory.length
            ? normalizedHistory
            : [{ status, at: assignedAt, actor: 'Legacy record' }]
    };
});
if (merchantNeedsDeliveryMigration) saveMerchantCollection('kiryaMerchantDeliveries', merchantDeliveries);

const merchantOverdueAfterMs = 30 * 60 * 1000;
const merchantOfferResponseAfterMs = 5 * 60 * 1000;
const merchantRiderWorkloadLimit = 3;
const merchantActiveDeliveryStatuses = ['offered', 'accepted', 'assigned', 'picked-up', 'in-transit'];
const merchantDeliveryTransitions = {
    offered: ['accepted', 'declined', 'cancelled'],
    accepted: ['picked-up', 'failed', 'cancelled'],
    assigned: ['picked-up', 'failed', 'cancelled'],
    'picked-up': ['in-transit', 'failed'],
    'in-transit': ['delivered', 'failed'],
    delivered: [],
    declined: [],
    failed: [],
    cancelled: []
};

document.getElementById('merchantPickupAddressSave').addEventListener('click', () => {
    const input = document.getElementById('merchantPickupAddress');
    const name = document.getElementById('merchantBusinessName').value.trim();
    const category = document.getElementById('merchantBusinessCategory').value;
    const phone = document.getElementById('merchantBusinessPhone').value.trim();
    const address = input.value.trim();
    if (!name || !category) {
        const field = !name ? document.getElementById('merchantBusinessName') : document.getElementById('merchantBusinessCategory');
        field.focus();
        showToast('Enter the business name and type.');
        return;
    }
    if (phone && phone.replace(/\D/g, '').length < 8) {
        document.getElementById('merchantBusinessPhone').focus();
        showToast('Enter a valid business phone number or leave it blank.');
        return;
    }
    if (!address) {
        input.focus();
        showToast('Enter the business pickup address.');
        return;
    }
    const now = new Date().toISOString();
    const profile = { name, category, phone, address };
    const nextOrders = demoActiveOrders.map(order => ({
        ...order,
        pickupAddress: order.fulfillment === 'delivery' ? address : order.pickupAddress
    }));
    if (!saveMerchantCollections({
        kiryaMerchantProfile: profile,
        kiryaMerchantPickupAddress: address,
        kiryaMerchantPickupCoordinates: merchantPickupCoordinates,
        kiryaMerchantActiveOrders: nextOrders
    })) return;
    merchantProfile = profile;
    merchantPickupAddress = address;
    demoActiveOrders = nextOrders;
    updateMerchantPickupMarkers();
    updateRiderPickupDestination();
    updateRiderPickupRoute(riderLocationMarker?.getLatLng() || null);
    document.getElementById('merchantPickupAddressStatus').textContent =
        `Business profile saved at ${new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.${merchantPickupCoordinates ? ' The map pin is included in rider directions.' : ' Select the map to add a rider pickup pin.'}`;
    populateMerchantAssignmentOptions();
    renderMerchantActiveOrders();
    updateMerchantOrderMetrics();
    showToast('Business profile saved.');
});

function merchantPartnerWorkload(partner, excludedDeliveryId = null) {
    return merchantDeliveries.filter(delivery =>
        delivery.id !== excludedDeliveryId &&
        merchantActiveDeliveryStatuses.includes(delivery.status) &&
        (delivery.partnerId === partner.id || merchantPhoneKey(delivery.phone) === merchantPhoneKey(partner.phone))
    ).length;
}

function merchantPartnerCoversAddress(partner, address) {
    const addressTokens = String(address).toLowerCase().split(/[,\s]+/).filter(token => token.length > 2);
    const areaTokens = partner.area.toLowerCase().split(/[,\s]+/).filter(token => token.length > 2);
    return addressTokens.some(token => areaTokens.includes(token));
}

function merchantPartnerIsEligible(partner, address, excludedDeliveryId = null) {
    return partner.status === 'active' && partner.verificationStatus === 'verified' &&
        partner.availability === 'available' &&
        merchantPartnerWorkload(partner, excludedDeliveryId) < merchantRiderWorkloadLimit &&
        merchantPartnerCoversAddress(partner, address);
}

function merchantAssignmentPartner(delivery) {
    return merchantPartners.find(partner => partner.id === delivery.partnerId) ||
        merchantPartners.find(partner => merchantPhoneKey(partner.phone) === merchantPhoneKey(delivery.phone));
}

function merchantPartnerCompletedCount(partner) {
    return merchantDeliveries.filter(delivery =>
        delivery.status === 'delivered' &&
        (delivery.partnerId === partner.id || merchantPhoneKey(delivery.phone) === merchantPhoneKey(partner.phone))
    ).length;
}

function merchantPartnerCancelledCount(partner) {
    return merchantDeliveries.filter(delivery =>
        delivery.status === 'cancelled' &&
        (delivery.partnerId === partner.id || merchantPhoneKey(delivery.phone) === merchantPhoneKey(partner.phone))
    ).length;
}

function merchantPartnerCancellationRate(partner) {
    const completed = merchantPartnerCompletedCount(partner);
    const cancelled = merchantPartnerCancelledCount(partner);
    return completed + cancelled ? Math.round(cancelled / (completed + cancelled) * 100) : 0;
}

function merchantDeliveryIsOverdue(delivery) {
    const assignedAt = Date.parse(delivery.assignedAt);
    const offeredDeadline = Date.parse(delivery.offerExpiresAt);
    const timestamp = delivery.status === 'offered'
        ? (Number.isFinite(offeredDeadline) ? offeredDeadline : assignedAt + merchantOfferResponseAfterMs)
        : Date.parse(delivery.statusHistory?.at(-1)?.at || delivery.updatedAt || delivery.assignedAt);
    return merchantActiveDeliveryStatuses.includes(delivery.status) && Number.isFinite(timestamp) &&
        (delivery.status === 'offered' ? Date.now() >= timestamp : Date.now() - timestamp >= merchantOverdueAfterMs);
}

function checkMerchantOverdueDeliveries() {
    if (document.visibilityState !== 'visible') return;
    for (const delivery of merchantDeliveries.filter(merchantDeliveryIsOverdue)) {
        if (notifiedOverdueDeliveries.has(delivery.id)) continue;
        notifiedOverdueDeliveries.add(delivery.id);
        showToast(delivery.status === 'offered'
            ? `Rider response for ${delivery.order} is overdue. Reassign or contact the rider.`
            : `Assignment ${delivery.order} has been active for over 30 minutes.`);
    }
}

function refreshMerchantDeliveryReminders() {
    checkMerchantOverdueDeliveries();
    if (merchantAssignedRidersScreen?.classList.contains('active')) renderMerchantDeliveries();
}

setInterval(refreshMerchantDeliveryReminders, 60_000);
document.addEventListener('visibilitychange', refreshMerchantDeliveryReminders);

function recordMerchantDeliveryStatus(delivery, status, actor = 'Merchant staff') {
    if (status === delivery.status || !merchantDeliveryTransitions[delivery.status]?.includes(status)) return false;
    const reason = ['declined', 'failed', 'cancelled'].includes(status)
        ? prompt(`Enter a reason for marking ${delivery.order} ${merchantDeliveryStatusLabels[status].toLowerCase()}:`)?.trim()
        : '';
    if (['declined', 'failed', 'cancelled'].includes(status) && !reason) {
        renderMerchantDeliveries();
        showToast('A reason is required for this delivery outcome.');
        return false;
    }
    const updatedAt = new Date().toISOString();
    const nextDeliveries = merchantDeliveries.map(record => record.id === delivery.id
        ? {
            ...record,
            status,
            updatedAt,
            statusHistory: [...record.statusHistory, {
                status,
                at: updatedAt,
                actor,
                ...(reason ? { reason } : {})
            }]
        }
        : record
    );
    const order = status === 'delivered'
        ? demoActiveOrders.find(record => record.id === delivery.order)
        : null;
    const nextActiveOrders = order
        ? demoActiveOrders.filter(record => record.id !== order.id)
        : demoActiveOrders;
    const nextPastOrders = order
        ? [{
            ...order,
            status: 'Delivered',
            statusHistory: [
                ...(order.statusHistory || []),
                { status: 'Delivered', at: updatedAt, actor: 'Rider (simulated)' }
            ],
            date: `Today, ${order.received}`,
            statusColor: '#019E81',
            deliveredAt: updatedAt
        }, ...dummyPastOrders]
        : dummyPastOrders;
    const collections = { kiryaMerchantDeliveries: nextDeliveries };
    if (order) {
        collections.kiryaMerchantActiveOrders = nextActiveOrders;
        collections.kiryaMerchantPastOrders = nextPastOrders;
    }
    if (!saveMerchantCollections(collections)) {
        renderMerchantDeliveries();
        return false;
    }
    merchantDeliveries = nextDeliveries;
    notifiedOverdueDeliveries.delete(delivery.id);
    if (order) {
        demoActiveOrders = nextActiveOrders;
        dummyPastOrders = nextPastOrders;
    }
    renderMerchantActiveOrders();
    renderMerchantDeliveries();
    renderMerchantPartners();
    renderMerchantAssignmentOptions();
    updateMerchantOrderMetrics();
    renderCustomerOrders();
    showToast(`${delivery.order}: ${merchantDeliveryStatusLabels[status].toLowerCase()}.`);
    return true;
}

function renderMerchantCustomers() {
    const rows = document.getElementById('merchantCustomerRows');
    const search = document.getElementById('merchantCustomerSearch').value.trim().toLowerCase();
    const sort = document.getElementById('merchantCustomerSort').value;
    const filter = document.getElementById('merchantCustomerFilter').value;
    const filtered = merchantCustomers.filter(customer =>
        `${customer.name} ${customer.phone} ${customer.email} ${customer.address}`.toLowerCase().includes(search)
    ).map(customer => {
        const phone = merchantPhoneKey(customer.phone);
        const orders = [...demoActiveOrders, ...dummyPastOrders].filter(order =>
            order.customerId === customer.id ||
            (order.phone && merchantPhoneKey(order.phone) === phone) ||
            (order.customer && order.customer.toLowerCase() === customer.name.toLowerCase())
        );
        const latest = orders.reduce((date, order) => {
            const timestamp = Date.parse(order.createdAt || order.date || '');
            return Number.isFinite(timestamp) && timestamp > date ? timestamp : date;
        }, Date.parse(customer.lastOrderAt || '') || 0);
        return {
            ...customer,
            matchedOrders: orders,
            lastOrderTimestamp: latest,
            lastOrderLabel: orders[0]?.date || orders[0]?.received || ''
        };
    }).filter(customer => filter === 'frequent'
        ? Math.max(customer.orders, customer.matchedOrders.length) >= 5
        : filter === 'recent'
            ? customer.lastOrderTimestamp && Date.now() - customer.lastOrderTimestamp <= 30 * 24 * 60 * 60 * 1000
            : true
    ).sort((a, b) => sort === 'orders'
        ? Math.max(b.orders, b.matchedOrders.length) - Math.max(a.orders, a.matchedOrders.length)
        : sort === 'recent'
            ? b.lastOrderTimestamp - a.lastOrderTimestamp
            : a.name.localeCompare(b.name));
    document.getElementById('merchantCustomerTableCount').textContent = merchantCustomers.length;
    document.getElementById('merchantCustomerCount').textContent = merchantCustomers.length;
    document.getElementById('merchantCustomerMetric').textContent = merchantCustomers.length;
    const page = paginateMerchantRecords('customers', filtered);
    rows.innerHTML = page.length
        ? page.map(customer => {
            const orderCount = Math.max(customer.orders, customer.matchedOrders.length);
            const lastOrder = customer.lastOrderTimestamp
                ? new Date(customer.lastOrderTimestamp).toLocaleDateString()
                : customer.lastOrderLabel || 'No order recorded';
            const orderHistory = customer.matchedOrders.length
                ? `<details class="merchant-customer-history"><summary>View ${customer.matchedOrders.length} record${customer.matchedOrders.length === 1 ? '' : 's'}</summary><ul>${customer.matchedOrders.map(order => `<li><strong>${escapeMerchantText(order.id)}</strong> - ${escapeMerchantText(order.items)} <span>${escapeMerchantText(order.date || order.received || '')}</span></li>`).join('')}</ul></details>`
                : '<span class="merchant-muted">No matching order records</span>';
            return `
            <tr>
              <td>${escapeMerchantText(customer.name)}</td><td>${escapeMerchantText(customer.phone)}</td>
              <td>${escapeMerchantText(customer.email || '—')}</td><td>${escapeMerchantText(customer.address)}</td>
              <td>${orderCount}</td><td>${escapeMerchantText(lastOrder)}</td><td>${orderHistory}</td>
              <td><div class="merchant-record-actions"><button class="merchant-record-action" type="button" data-customer-action="edit" data-customer-id="${customer.id}">Edit</button><button class="merchant-record-action danger" type="button" data-customer-action="delete" data-customer-id="${customer.id}">Remove</button></div></td>
            </tr>
        `}).join('')
        : '<tr><td class="merchant-record-empty" colspan="8">No customers match your search.</td></tr>';
}

function renderMerchantPartners() {
    const rows = document.getElementById('merchantPartnerRows');
    const search = document.getElementById('merchantPartnerSearch').value.trim().toLowerCase();
    const statusFilter = document.getElementById('merchantPartnerFilter').value;
    const sort = document.getElementById('merchantPartnerSort').value;
    const filtered = merchantPartners.filter(partner =>
        (statusFilter === 'all' ||
            statusFilter === 'active' && partner.status === 'active' ||
            statusFilter === 'inactive' && partner.status === 'inactive' ||
            statusFilter === 'available' && partner.status === 'active' && !merchantPartnerWorkload(partner) && partner.availability === 'available' ||
            statusFilter === 'on-delivery' && merchantPartnerWorkload(partner) > 0 ||
            statusFilter === 'off-duty' && partner.status === 'active' && !merchantPartnerWorkload(partner) && partner.availability === 'off-duty') &&
        `${partner.name} ${partner.phone} ${partner.email} ${partner.vehicle} ${partner.area}`.toLowerCase().includes(search)
    ).sort((a, b) => sort === 'workload'
        ? merchantPartnerWorkload(b) - merchantPartnerWorkload(a)
        : sort === 'completed'
            ? merchantPartnerCompletedCount(b) - merchantPartnerCompletedCount(a)
            : a.name.localeCompare(b.name));
    document.getElementById('merchantPartnerTableCount').textContent = merchantPartners.length;
    const page = paginateMerchantRecords('partners', filtered);
    rows.innerHTML = page.length
        ? page.map(partner => {
            const workload = merchantPartnerWorkload(partner);
            const hasPendingOffer = merchantDeliveries.some(delivery =>
                delivery.partnerId === partner.id && delivery.status === 'offered'
            );
            const availability = partner.verificationStatus !== 'verified'
                ? 'Verification pending'
                : partner.status !== 'active' ? 'Inactive'
                : hasPendingOffer ? 'Offer pending'
                    : workload ? 'On delivery' : partner.availability === 'off-duty' ? 'Off duty' : 'Available';
            return `
            <tr>
              <td>${escapeMerchantText(partner.name)}</td><td>${escapeMerchantText(partner.phone)}</td>
              <td>${escapeMerchantText(partner.email || '—')}</td><td>${escapeMerchantText(partner.vehicle)}</td>
              <td>${escapeMerchantText(partner.area)}</td>
              <td><span class="merchant-status-pill ${partner.verificationStatus === 'verified' ? 'delivered' : 'offered'}">${escapeMerchantText(partner.verificationStatus || 'pending')}</span> <span class="merchant-muted">${partner.status === 'active' ? 'Active' : 'Inactive'} · ${escapeMerchantText(availability)}</span><button class="merchant-record-action" type="button" data-partner-action="availability" data-partner-id="${partner.id}" ${partner.status !== 'active' || partner.verificationStatus !== 'verified' || workload ? 'disabled' : ''}>${partner.availability === 'off-duty' ? 'Set available' : 'Set off duty'}</button></td>
              <td>${workload} / ${merchantRiderWorkloadLimit} active; ${merchantPartnerCompletedCount(partner)} completed; ${merchantPartnerCancelledCount(partner)} cancelled (${merchantPartnerCancellationRate(partner)}%)</td>
              <td><div class="merchant-record-actions"><button class="merchant-record-action" type="button" data-partner-action="edit" data-partner-id="${partner.id}">Edit</button><button class="merchant-record-action danger" type="button" data-partner-action="delete" data-partner-id="${partner.id}">Remove</button></div></td>
            </tr>
        `}).join('')
        : '<tr><td class="merchant-record-empty" colspan="8">No rides partners match your filters.</td></tr>';
    updateMerchantOrderMetrics();
}

function renderMerchantDeliveries() {
    const rows = document.getElementById('merchantDeliveryRows');
    const search = document.getElementById('merchantDeliverySearch').value.trim().toLowerCase();
    const statusFilter = document.getElementById('merchantDeliveryFilter').value;
    const sort = document.getElementById('merchantDeliverySort').value;
    const filtered = merchantDeliveries.filter(delivery => {
        const partner = merchantAssignmentPartner(delivery);
        return (statusFilter === 'all' || delivery.status === statusFilter) &&
            `${delivery.order} ${delivery.customer} ${delivery.address} ${partner?.name || delivery.driver} ${partner?.phone || delivery.phone}`.toLowerCase().includes(search);
    }).sort((a, b) => sort === 'oldest'
        ? new Date(a.assignedAt) - new Date(b.assignedAt)
        : sort === 'status'
            ? a.status.localeCompare(b.status)
            : sort === 'order'
                ? a.order.localeCompare(b.order, undefined, { numeric: true })
                : new Date(b.assignedAt) - new Date(a.assignedAt));
    const activeCount = merchantDeliveries.filter(delivery => merchantActiveDeliveryStatuses.includes(delivery.status)).length;
    document.getElementById('merchantDeliveryTableCount').textContent = merchantDeliveries.length;
    document.getElementById('merchantAssignedRidersCount').textContent = activeCount;
    const page = paginateMerchantRecords('deliveries', filtered);
    rows.innerHTML = page.length
        ? page.map(delivery => {
            const overdue = merchantDeliveryIsOverdue(delivery);
            const nextStatuses = merchantDeliveryTransitions[delivery.status] || [];
            const assignedDate = new Date(delivery.assignedAt);
            const partner = merchantAssignmentPartner(delivery);
            const isAwaitingResponse = delivery.status === 'offered';
            const statusActions = isAwaitingResponse
                ? `<button class="merchant-record-action" type="button" data-delivery-status="${delivery.id}" data-next-status="accepted" data-actor="Rider (simulated)">Accept offer (demo)</button><button class="merchant-record-action danger" type="button" data-delivery-status="${delivery.id}" data-next-status="declined" data-actor="Rider (simulated)">Decline offer (demo)</button>${overdue ? `<button class="merchant-record-action danger" type="button" data-delivery-status="${delivery.id}" data-next-status="declined" data-actor="Merchant staff">No response - reassign</button>` : ''}`
                : nextStatuses.length
                    ? `<select aria-label="Update ${escapeMerchantText(delivery.order)} status" data-delivery-status="${delivery.id}"><option value="">Update status</option>${nextStatuses.map(status => `<option value="${status}">${merchantDeliveryStatusLabels[status]}</option>`).join('')}</select>`
                    : '';
            const timeline = delivery.statusHistory.map(item =>
                `<li><strong>${escapeMerchantText(merchantDeliveryStatusLabels[item.status] || item.status)}</strong> - ${escapeMerchantText(new Date(item.at).toLocaleString())}<span>${escapeMerchantText(item.actor || 'Merchant staff')}</span>${item.reason ? `<p>${escapeMerchantText(item.reason)}</p>` : ''}</li>`
            ).join('');
            return `
            <tr>
              <td>${escapeMerchantText(delivery.order)}</td><td>${escapeMerchantText(delivery.customer)}</td>
              <td>${escapeMerchantText(delivery.address)}</td><td>${escapeMerchantText(partner?.name || delivery.driver)}</td>
              <td>${escapeMerchantText(partner?.phone || delivery.phone)}</td>
              <td><span class="merchant-status-pill ${delivery.status}">${merchantDeliveryStatusLabels[delivery.status]}</span>${isAwaitingResponse && delivery.offerExpiresAt ? `<span class="merchant-muted">Reply by ${escapeMerchantText(new Date(delivery.offerExpiresAt).toLocaleTimeString())}</span>` : ''}${overdue ? `<span class="merchant-overdue-pill">${isAwaitingResponse ? 'Response overdue' : 'Overdue'}</span>` : ''}<details class="merchant-customer-history"><summary>Audit timeline</summary><ul>${timeline}</ul></details></td>
              <td>${Number.isFinite(assignedDate.getTime()) ? escapeMerchantText(assignedDate.toLocaleString()) : '—'}</td>
              <td><div class="merchant-record-actions">${statusActions}${delivery.status === 'offered' ? `<button class="merchant-record-action" type="button" data-delivery-action="edit" data-delivery-id="${delivery.id}">Edit offer</button><button class="merchant-record-action danger" type="button" data-delivery-status="${delivery.id}" data-next-status="cancelled" data-actor="Merchant staff">Cancel offer</button>` : ''}</div></td>
            </tr>
        `}).join('')
        : '<tr><td class="merchant-record-empty" colspan="8">No rider assignments match your filters.</td></tr>';
    checkMerchantOverdueDeliveries();
    updateMerchantOrderMetrics();
    renderMerchantMarketplaceNotifications();
    refreshLiveRiderMaps();
}

function renderMerchantMarketplaceNotifications() {
    const list = document.getElementById('merchantMarketplaceNotifications');
    if (!list) return;
    const marketplaceDeliveries = merchantDeliveries
        .filter(delivery => delivery.marketplace && delivery.status !== 'cancelled' && delivery.status !== 'failed')
        .sort((first, second) => Date.parse(second.assignedAt || '') - Date.parse(first.assignedAt || ''));
    list.innerHTML = marketplaceDeliveries.length ? marketplaceDeliveries.map(delivery => `
      <article class="merchant-marketplace-notice-card">
        <div><strong>${escapeMerchantText(delivery.itemTitle || 'Marketplace delivery')}</strong><span class="merchant-status-pill ${escapeMerchantText(delivery.status)}">${escapeMerchantText(merchantDeliveryStatusLabels[delivery.status] || delivery.status)}</span></div>
                <p><strong>${escapeMerchantText(delivery.driver)}</strong> ${delivery.status === 'delivered' ? 'completed this delivery.' : 'is assigned to collect this item.'} Admin approved ${escapeMerchantText(delivery.assignedAt ? new Date(delivery.assignedAt).toLocaleString() : 'just now')}.</p>
                <p>Vendor notice: recorded in this browser console only; no push message was sent.</p>
        <p>${escapeMerchantText(delivery.itemDescription || '')}</p>
        <dl><div><dt>Pickup</dt><dd>${escapeMerchantText(delivery.pickupAddress || '—')}</dd></div>
          <div><dt>Drop-off area</dt><dd>${escapeMerchantText(delivery.address || '—')}</dd></div>
          <div><dt>Route estimate</dt><dd>~${Number(delivery.pickupToDropoffKm || 0).toFixed(1)} km</dd></div>
                    <div><dt>Rider commission</dt><dd>${formatMerchantCurrency(delivery.commissionAmount || 0)} · ${escapeMerchantText(delivery.commissionStatus || 'locked')}</dd></div>
                    <div><dt>Payout record</dt><dd>${escapeMerchantText(delivery.payoutStatus || 'not eligible')}</dd></div></dl>
                ${(delivery.riderAttestations || []).map(attestation => `<p>Rider ${escapeMerchantText(attestation.step)} confirmation: ${escapeMerchantText(new Date(attestation.recordedAt).toLocaleString())} · rider attestation, not independent proof.</p>`).join('')}
      </article>`).join('') : '<p class="merchant-marketplace-empty">Approved marketplace pickups will appear here.</p>';
}

function resetMerchantCustomerForm() {
    document.getElementById('merchantCustomerForm').reset();
    document.getElementById('merchantCustomerId').value = '';
    document.getElementById('merchantCustomerFormHeading').textContent = 'Register customer';
    document.getElementById('merchantCustomerForm').querySelector('[type="submit"]').textContent = 'Save customer';
    document.getElementById('merchantCustomerCancelEdit').hidden = true;
}

function resetMerchantDeliveryForm() {
    document.getElementById('merchantDeliveryForm').reset();
    document.getElementById('merchantDeliveryId').value = '';
    document.getElementById('merchantDeliveryFormHeading').textContent = 'Dispatch ready delivery';
    document.getElementById('merchantDeliveryForm').querySelector('[type="submit"]').textContent = 'Send rider offer';
    document.getElementById('merchantDeliveryCancelEdit').hidden = true;
    document.getElementById('merchantRiderWorkloadWarning').hidden = true;
    populateMerchantAssignmentOptions();
}

function merchantOrderCustomer(order) {
    return merchantCustomers.find(record =>
        record.id === order.customerId ||
        (order.phone && merchantPhoneKey(record.phone) === merchantPhoneKey(order.phone)) ||
        record.name.toLowerCase() === order.customer.toLowerCase()
    );
}

function merchantOrderDeliveryAddress(order) {
    return order.deliveryAddress || merchantOrderCustomer(order)?.address || '';
}

function merchantOrderCustomerPhone(order) {
    return order.phone || merchantOrderCustomer(order)?.phone || '';
}

function merchantOrderCanDispatch(order) {
    return order.fulfillment === 'delivery' &&
        order.status === 'ready' &&
        Boolean(merchantOrderDeliveryAddress(order)) &&
        Boolean(order.pickupAddress || merchantPickupAddress) &&
        merchantPhoneKey(merchantOrderCustomerPhone(order)).length >= 8;
}

function populateMerchantAssignmentOptions() {
    const orderSelect = document.getElementById('merchantDeliveryOrder');
    const partnerSelect = document.getElementById('merchantDeliveryPartner');
    if (!orderSelect || !partnerSelect) return;
    const selectedOrder = orderSelect.value;
    const selectedPartner = partnerSelect.value;
    const editingDelivery = merchantDeliveries.find(record =>
        record.id === Number(document.getElementById('merchantDeliveryId').value)
    );
    const availableOrders = demoActiveOrders.filter(order =>
        merchantOrderCanDispatch(order) &&
        !merchantDeliveries.some(delivery =>
            merchantActiveDeliveryStatuses.includes(delivery.status) &&
            delivery.order === order.id && delivery.id !== editingDelivery?.id
        )
    );
    const currentOrder = editingDelivery && !availableOrders.some(order => order.id === editingDelivery.order)
        ? demoActiveOrders.find(order => order.id === editingDelivery.order) || {
            id: editingDelivery.order,
            customer: editingDelivery.customer
        }
        : null;
    orderSelect.innerHTML = '<option value="">Choose an active order</option>' +
        (currentOrder
            ? `<option value="${escapeMerchantText(currentOrder.id)}">${escapeMerchantText(currentOrder.id)} - ${escapeMerchantText(currentOrder.customer)} (current assignment)</option>`
            : '') +
        availableOrders.map(order =>
            `<option value="${escapeMerchantText(order.id)}">${escapeMerchantText(order.id)} - ${escapeMerchantText(order.customer)}</option>`
        ).join('');
    if ([...orderSelect.options].some(option => option.value === selectedOrder)) orderSelect.value = selectedOrder;
    if ([...partnerSelect.options].some(option => option.value === selectedPartner)) partnerSelect.value = selectedPartner;
    updateMerchantAssignmentOrder();
}

function updateMerchantAssignmentOrder() {
    const order = demoActiveOrders.find(record =>
        record.id === document.getElementById('merchantDeliveryOrder').value
    );
    const editingDelivery = merchantDeliveries.find(record =>
        record.id === Number(document.getElementById('merchantDeliveryId').value)
    );
    document.getElementById('merchantDeliveryCustomer').value = order?.customer || editingDelivery?.customer || '';
    document.getElementById('merchantDeliveryCustomerPhone').value =
        (order && merchantOrderCustomerPhone(order)) || editingDelivery?.customerPhone || '';
    document.getElementById('merchantDeliveryAddress').value =
        (order && merchantOrderDeliveryAddress(order)) || editingDelivery?.address || '';
    const eligibility = document.getElementById('merchantDispatchEligibility');
    const complete = order && merchantOrderCanDispatch(order);
    eligibility.textContent = !order
        ? 'Choose a ready delivery order. Customer contact details and address will be copied from that order.'
        : complete
            ? `Ready to dispatch ${order.id}. Customer details come from the order; rider pickup details come from the store location.`
            : `${order.id} needs a customer phone, delivery address, and saved store pickup location before dispatch.`;
    eligibility.classList.toggle('is-warning', Boolean(order) && !complete);
    populateMerchantAssignmentPartners();
    const locations = readLiveRiderLocations();
    if (locations) updateMerchantRiderTrackingMap(locations);
}

function populateMerchantAssignmentPartners() {
    const orderSelect = document.getElementById('merchantDeliveryOrder');
    const partnerSelect = document.getElementById('merchantDeliveryPartner');
    if (!orderSelect || !partnerSelect) return;
    const selectedPartner = partnerSelect.value;
    const editingDelivery = merchantDeliveries.find(record =>
        record.id === Number(document.getElementById('merchantDeliveryId').value)
    );
    const address = document.getElementById('merchantDeliveryAddress').value.trim();
    const currentPartnerId = editingDelivery?.partnerId;
    partnerSelect.innerHTML = '<option value="">Choose an eligible rider</option>' +
        merchantPartners.filter(partner =>
            merchantPartnerIsEligible(partner, address, editingDelivery?.id) || partner.id === currentPartnerId
        ).map(partner => {
            const workload = merchantPartnerWorkload(partner, editingDelivery?.id);
            return `<option value="${partner.id}">${escapeMerchantText(partner.name)} - ${escapeMerchantText(partner.phone)} (${partner.area}; ${workload}/${merchantRiderWorkloadLimit} active)</option>`;
        }).join('');
    if ([...partnerSelect.options].some(option => option.value === selectedPartner)) partnerSelect.value = selectedPartner;
    const selectedRider = merchantPartners.find(partner => partner.id === Number(partnerSelect.value));
    document.getElementById('merchantDeliveryPhone').value = selectedRider?.phone || '';
    updateMerchantRiderWorkloadWarning();
}

function updateMerchantRiderWorkloadWarning() {
    const partner = merchantPartners.find(record =>
        record.id === Number(document.getElementById('merchantDeliveryPartner').value)
    );
    const warning = document.getElementById('merchantRiderWorkloadWarning');
    if (!partner) {
        const address = document.getElementById('merchantDeliveryAddress').value.trim();
        warning.textContent = address
            ? 'No active, available rider currently covers this address and has capacity.'
            : 'Select an eligible delivery order before choosing a rider.';
        warning.classList.add('is-warning');
        warning.hidden = false;
        return;
    }
    const editingDeliveryId = Number(document.getElementById('merchantDeliveryId').value) || null;
    const workload = merchantPartnerWorkload(partner, editingDeliveryId);
    const address = document.getElementById('merchantDeliveryAddress').value.trim();
    const eligible = merchantPartnerIsEligible(partner, address, editingDeliveryId);
    warning.textContent = !merchantPartnerCoversAddress(partner, address)
        ? `${partner.name} does not cover this delivery address.`
        : workload >= merchantRiderWorkloadLimit
            ? `${partner.name} has reached the active assignment limit.`
            : !eligible
                ? `${partner.name} is not available for a new assignment.`
                : `${partner.name} is eligible for this delivery (${workload}/${merchantRiderWorkloadLimit} active).`;
    warning.classList.toggle('is-warning', !eligible);
    warning.hidden = false;
}

document.getElementById('merchantCustomerForm').addEventListener('submit', event => {
    event.preventDefault();
    const phone = document.getElementById('merchantCustomerPhone').value.trim();
    if (phone.replace(/\D/g, '').length < 8) {
        document.getElementById('merchantCustomerPhone').focus();
        showToast('Enter a valid customer phone number.');
        return;
    }
    const customerId = Number(document.getElementById('merchantCustomerId').value);
    const duplicate = merchantCustomers.find(record =>
        merchantPhoneKey(record.phone) === merchantPhoneKey(phone) && record.id !== customerId
    );
    if (duplicate && customerId) {
        showToast(`That phone number belongs to ${duplicate.name}. Edit that customer record instead.`);
        return;
    }
    if (duplicate && !confirm(`${duplicate.name} already has this phone number. Update that customer record instead?`)) return;
    const matchingCustomerId = duplicate?.id || customerId;
    const existingCustomer = merchantCustomers.find(record => record.id === matchingCustomerId);
    const updatedAt = new Date().toISOString();
    const customer = {
        id: matchingCustomerId || Math.max(0, ...merchantCustomers.map(record => record.id)) + 1,
        name: document.getElementById('merchantCustomerName').value.trim(),
        phone,
        email: document.getElementById('merchantCustomerEmail').value.trim(),
        address: document.getElementById('merchantCustomerAddress').value.trim(),
        orders: existingCustomer?.orders || 0,
        lastOrderAt: existingCustomer?.lastOrderAt || null,
        createdAt: existingCustomer?.createdAt || updatedAt,
        updatedAt
    };
    const nextCustomers = existingCustomer
        ? merchantCustomers.map(record => record.id === customer.id ? customer : record)
        : [customer, ...merchantCustomers];
    if (!saveMerchantCollection('kiryaMerchantCustomers', nextCustomers)) return;
    merchantCustomers = nextCustomers;
    resetMerchantCustomerForm();
    renderMerchantCustomers();
    renderMerchantAssignmentOptions();
    showToast(duplicate ? 'Existing customer record updated.' : 'Customer saved.');
});

document.getElementById('merchantCustomerRows').addEventListener('click', event => {
    const button = event.target.closest('[data-customer-action]');
    if (!button) return;
    const customer = merchantCustomers.find(record => record.id === Number(button.dataset.customerId));
    if (!customer) return;
    if (button.dataset.customerAction === 'edit') {
        document.getElementById('merchantCustomerId').value = customer.id;
        document.getElementById('merchantCustomerName').value = customer.name;
        document.getElementById('merchantCustomerPhone').value = customer.phone;
        document.getElementById('merchantCustomerEmail').value = customer.email;
        document.getElementById('merchantCustomerAddress').value = customer.address;
        document.getElementById('merchantCustomerFormHeading').textContent = 'Edit customer';
        document.getElementById('merchantCustomerForm').querySelector('[type="submit"]').textContent = 'Update customer';
        document.getElementById('merchantCustomerCancelEdit').hidden = false;
        document.getElementById('merchantCustomerName').focus();
    } else {
        const hasActiveAssignment = merchantDeliveries.some(delivery =>
            merchantActiveDeliveryStatuses.includes(delivery.status) &&
            (delivery.customerId === customer.id || delivery.customer.toLowerCase() === customer.name.toLowerCase())
        );
        if (hasActiveAssignment) {
            showToast('This customer has an active rider assignment. Complete or reassign it before removal.');
            return;
        }
        if (!confirm(`Remove ${customer.name} from the customer directory?`)) return;
        const nextCustomers = merchantCustomers.filter(record => record.id !== customer.id);
        if (!saveMerchantCollection('kiryaMerchantCustomers', nextCustomers)) return;
        merchantCustomers = nextCustomers;
        renderMerchantCustomers();
        renderMerchantAssignmentOptions();
        showToast('Customer removed.');
    }
});

document.getElementById('merchantCustomerCancelEdit').addEventListener('click', resetMerchantCustomerForm);

document.getElementById('merchantDeliveryForm').addEventListener('submit', event => {
    event.preventDefault();
    const partner = merchantPartners.find(record =>
        record.id === Number(document.getElementById('merchantDeliveryPartner').value)
    );
    const deliveryId = document.getElementById('merchantDeliveryId').value;
    const existingDelivery = merchantDeliveries.find(record => record.id === Number(deliveryId));
    const orderNumber = document.getElementById('merchantDeliveryOrder').value.trim();
    const order = demoActiveOrders.find(record => record.id === orderNumber);
    if (!order || !merchantOrderCanDispatch(order)) {
        document.getElementById('merchantDeliveryOrder').focus();
        showToast('Choose an eligible ready delivery order with customer contact details and a delivery address.');
        return;
    }
    if (merchantDeliveries.some(record =>
        record.order.toLowerCase() === orderNumber.toLowerCase() &&
        record.id !== existingDelivery?.id &&
        merchantActiveDeliveryStatuses.includes(record.status)
    )) {
        document.getElementById('merchantDeliveryOrder').focus();
        showToast('This order already has an active rider offer or assignment.');
        return;
    }
    const customer = merchantOrderCustomer(order);
    const address = merchantOrderDeliveryAddress(order);
    const customerPhone = merchantOrderCustomerPhone(order);
    if (!partner || !merchantPartnerIsEligible(partner, address, existingDelivery?.id)) {
        document.getElementById('merchantDeliveryPartner').focus();
        showToast('Select an active, available rider within the service area and below the workload limit.');
        return;
    }
    const now = new Date().toISOString();
    const status = 'offered';
    const history = existingDelivery?.statusHistory || [];
    const statusHistory = [
        ...history,
        { status, at: now, actor: 'Merchant staff', ...(existingDelivery ? { reason: 'Rider offer updated' } : {}) }
    ];
    const delivery = {
        id: deliveryId ? Number(deliveryId) : Math.max(0, ...merchantDeliveries.map(record => record.id)) + 1,
        order: orderNumber,
        customer: order.customer,
        customerId: customer?.id || order.customerId || null,
        customerPhone,
        address,
        pickupAddress: order.pickupAddress || merchantPickupAddress,
        partnerId: partner.id,
        driver: partner.name,
        phone: partner.phone,
        status,
        createdAt: existingDelivery?.createdAt || now,
        assignedAt: now,
        offerExpiresAt: new Date(Date.now() + merchantOfferResponseAfterMs).toISOString(),
        updatedAt: now,
        statusHistory
    };
    const nextDeliveries = existingDelivery
        ? merchantDeliveries.map(record => record.id === delivery.id ? delivery : record)
        : [delivery, ...merchantDeliveries];
    if (!saveMerchantCollection('kiryaMerchantDeliveries', nextDeliveries)) return;
    merchantDeliveries = nextDeliveries;
    notifiedOverdueDeliveries.delete(delivery.id);
    resetMerchantDeliveryForm();
    renderMerchantDeliveries();
    renderMerchantPartners();
    renderMerchantActiveOrders();
    updateMerchantOrderMetrics();
    showToast(existingDelivery ? 'Rider offer updated.' : 'Delivery offer sent to rider (demo).');
});

document.getElementById('merchantDeliveryRows').addEventListener('click', event => {
    const statusButton = event.target.closest('[data-next-status]');
    if (statusButton) {
        const delivery = merchantDeliveries.find(record => record.id === Number(statusButton.dataset.deliveryStatus));
        if (delivery) recordMerchantDeliveryStatus(delivery, statusButton.dataset.nextStatus, statusButton.dataset.actor);
        return;
    }
    const button = event.target.closest('[data-delivery-action]');
    if (!button) return;
    const delivery = merchantDeliveries.find(record => record.id === Number(button.dataset.deliveryId));
    if (!delivery) return;
    if (button.dataset.deliveryAction === 'edit' && delivery.status === 'offered') {
        document.getElementById('merchantDeliveryId').value = delivery.id;
        populateMerchantAssignmentOptions();
        document.getElementById('merchantDeliveryOrder').value = delivery.order;
        updateMerchantAssignmentOrder();
        document.getElementById('merchantDeliveryAddress').value = delivery.address;
        document.getElementById('merchantDeliveryCustomerPhone').value = delivery.customerPhone || '';
        document.getElementById('merchantDeliveryPartner').value = String(delivery.partnerId || '');
        document.getElementById('merchantDeliveryPhone').value = delivery.phone;
        populateMerchantAssignmentPartners();
        document.getElementById('merchantDeliveryFormHeading').textContent = 'Update rider offer';
        document.getElementById('merchantDeliveryForm').querySelector('[type="submit"]').textContent = 'Update offer';
        document.getElementById('merchantDeliveryCancelEdit').hidden = false;
        updateMerchantRiderWorkloadWarning();
        document.getElementById('merchantDeliveryOrder').focus();
    }
});

document.getElementById('merchantDeliveryRows').addEventListener('change', event => {
    const select = event.target.closest('select[data-delivery-status]');
    if (!select || !select.value) return;
    const delivery = merchantDeliveries.find(record => record.id === Number(select.dataset.deliveryStatus));
    if (delivery) recordMerchantDeliveryStatus(delivery, select.value);
});

document.getElementById('merchantDeliveryCancelEdit').addEventListener('click', resetMerchantDeliveryForm);
document.getElementById('merchantDeliveryOrder').addEventListener('change', updateMerchantAssignmentOrder);
document.getElementById('merchantDeliveryPartner').addEventListener('change', event => {
    const partner = merchantPartners.find(record => record.id === Number(event.target.value));
    document.getElementById('merchantDeliveryPhone').value = partner?.phone || '';
    updateMerchantRiderWorkloadWarning();
});

function resetMerchantPartnerForm() {
    document.getElementById('merchantPartnerForm').reset();
    document.getElementById('merchantPartnerId').value = '';
    document.getElementById('merchantPartnerFormHeading').textContent = 'Register rides partner';
    document.getElementById('merchantPartnerForm').querySelector('[type="submit"]').textContent = 'Save partner';
    document.getElementById('merchantPartnerCancelEdit').hidden = true;
}

document.getElementById('merchantPartnerForm').addEventListener('submit', event => {
    event.preventDefault();
    const phone = document.getElementById('merchantPartnerPhone').value.trim();
    if (phone.replace(/\D/g, '').length < 8) {
        document.getElementById('merchantPartnerPhone').focus();
        showToast('Enter a valid rides partner phone number.');
        return;
    }
    const partnerId = document.getElementById('merchantPartnerId').value;
    const existingPartner = merchantPartners.find(record => record.id === Number(partnerId));
    const hasActiveAssignments = existingPartner && merchantPartnerWorkload(existingPartner) > 0;
    if (hasActiveAssignments && merchantPhoneKey(existingPartner.phone) !== merchantPhoneKey(phone)) {
        document.getElementById('merchantPartnerPhone').focus();
        showToast('Complete this rider’s active assignments before changing their phone number.');
        return;
    }
    if (hasActiveAssignments && document.getElementById('merchantPartnerStatus').value !== 'active') {
        showToast('Complete this rider’s active assignments before deactivating them.');
        return;
    }
    if (hasActiveAssignments && document.getElementById('merchantPartnerAvailability').value === 'off-duty') {
        showToast('A rider with active assignments cannot be marked off duty.');
        return;
    }
    const partner = {
        id: partnerId ? Number(partnerId) : Math.max(0, ...merchantPartners.map(record => record.id)) + 1,
        name: document.getElementById('merchantPartnerName').value.trim(),
        phone,
        email: document.getElementById('merchantPartnerEmail').value.trim(),
        vehicle: document.getElementById('merchantPartnerVehicle').value.trim(),
        area: document.getElementById('merchantPartnerArea').value.trim(),
        status: document.getElementById('merchantPartnerStatus').value,
        availability: existingPartner ? document.getElementById('merchantPartnerAvailability').value : 'off-duty',
        verificationStatus: existingPartner?.verificationStatus || 'pending',
        adminAudit: existingPartner?.adminAudit || [],
        createdAt: existingPartner?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const nextPartners = existingPartner
        ? merchantPartners.map(record => record.id === partner.id ? partner : record)
        : [partner, ...merchantPartners];
    if (!saveMerchantCollection('kiryaMerchantPartners', nextPartners)) return;
    merchantPartners = nextPartners;
    resetMerchantPartnerForm();
    renderMerchantPartners();
    renderMerchantAssignmentOptions();
    showToast('Rides partner saved.');
});

document.getElementById('merchantPartnerRows').addEventListener('click', event => {
    const button = event.target.closest('[data-partner-action]');
    if (!button) return;
    const partner = merchantPartners.find(record => record.id === Number(button.dataset.partnerId));
    if (!partner) return;
    if (button.dataset.partnerAction === 'edit') {
        document.getElementById('merchantPartnerId').value = partner.id;
        document.getElementById('merchantPartnerName').value = partner.name;
        document.getElementById('merchantPartnerPhone').value = partner.phone;
        document.getElementById('merchantPartnerEmail').value = partner.email;
        document.getElementById('merchantPartnerVehicle').value = partner.vehicle;
        document.getElementById('merchantPartnerArea').value = partner.area;
        document.getElementById('merchantPartnerStatus').value = partner.status;
        document.getElementById('merchantPartnerAvailability').value = partner.availability;
        document.getElementById('merchantPartnerFormHeading').textContent = 'Edit rides partner';
        document.getElementById('merchantPartnerForm').querySelector('[type="submit"]').textContent = 'Update partner';
        document.getElementById('merchantPartnerCancelEdit').hidden = false;
        document.getElementById('merchantPartnerName').focus();
    } else if (button.dataset.partnerAction === 'availability') {
        if (merchantPartnerWorkload(partner)) {
            showToast('A rider with active assignments cannot be taken off duty.');
            return;
        }
        const nextPartners = merchantPartners.map(record => record.id === partner.id
            ? { ...record, availability: record.availability === 'off-duty' ? 'available' : 'off-duty', updatedAt: new Date().toISOString() }
            : record
        );
        if (!saveMerchantCollection('kiryaMerchantPartners', nextPartners)) return;
        merchantPartners = nextPartners;
        renderMerchantPartners();
        renderMerchantAssignmentOptions();
        showToast(`${partner.name} is now ${partner.availability === 'off-duty' ? 'available' : 'off duty'}.`);
    } else if (merchantPartnerWorkload(partner)) {
        showToast('A rides partner with active assignments cannot be removed.');
    } else if (confirm(`Remove ${partner.name} from rides partners?`)) {
        const nextPartners = merchantPartners.filter(record => record.id !== partner.id);
        if (!saveMerchantCollection('kiryaMerchantPartners', nextPartners)) return;
        merchantPartners = nextPartners;
        renderMerchantPartners();
        renderMerchantAssignmentOptions();
        showToast('Rides partner removed.');
    }
});

document.getElementById('merchantPartnerCancelEdit').addEventListener('click', resetMerchantPartnerForm);

const merchantRegisterRenderers = {
    customers: renderMerchantCustomers,
    partners: renderMerchantPartners,
    deliveries: renderMerchantDeliveries
};

for (const [type, render] of Object.entries(merchantRegisterRenderers)) {
    const section = type === 'partners' ? 'Partner' : type === 'customers' ? 'Customer' : 'Delivery';
    document.getElementById(`merchant${section}Prev`).addEventListener('click', () => {
        merchantRecordPages[type] = Math.max(1, merchantRecordPages[type] - 1);
        render();
    });
    document.getElementById(`merchant${section}Next`).addEventListener('click', () => {
        merchantRecordPages[type] += 1;
        render();
    });
    const searchId = type === 'customers' ? 'merchantCustomerSearch'
        : type === 'partners' ? 'merchantPartnerSearch' : 'merchantDeliverySearch';
    const filterId = type === 'partners' ? 'merchantPartnerFilter'
        : type === 'deliveries' ? 'merchantDeliveryFilter'
            : 'merchantCustomerFilter';
    [searchId, filterId, `merchant${section}Sort`].filter(Boolean).forEach(id => {
        document.getElementById(id).addEventListener(id === searchId ? 'input' : 'change', () => {
            merchantRecordPages[type] = 1;
            render();
        });
    });
}

document.getElementById('merchantCustomerExport').addEventListener('click', () => exportMerchantRecords(
    'customers.csv',
    merchantCustomers.map(customer => {
        const matchingOrders = [...demoActiveOrders, ...dummyPastOrders].filter(order =>
        order.customerId === customer.id ||
        (order.phone && merchantPhoneKey(order.phone) === merchantPhoneKey(customer.phone)) ||
        (order.customer && order.customer.toLowerCase() === customer.name.toLowerCase())
        );
        const latestOrder = matchingOrders.reduce((latest, order) => {
        const timestamp = Date.parse(order.createdAt || order.date || '');
        return Number.isFinite(timestamp) && timestamp > latest ? timestamp : latest;
        }, Date.parse(customer.lastOrderAt || '') || 0);
        return {
        ...customer,
        orders: Math.max(customer.orders, matchingOrders.length),
        lastOrder: latestOrder ? new Date(latestOrder).toLocaleDateString() : ''
        };
    }),
    [['id', 'ID'], ['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'], ['orders', 'Orders'], ['lastOrder', 'Last order'], ['createdAt', 'Created at'], ['updatedAt', 'Updated at']]
));
document.getElementById('merchantPartnerExport').addEventListener('click', () => exportMerchantRecords(
    'rides-partners.csv',
    merchantPartners.map(partner => ({
        ...partner,
        availability: merchantDeliveries.some(delivery =>
            delivery.partnerId === partner.id && delivery.status === 'offered'
        ) ? 'Offer pending' : merchantPartnerWorkload(partner) ? 'On delivery' : partner.availability,
        activeAssignments: merchantPartnerWorkload(partner),
        completedDeliveries: merchantPartnerCompletedCount(partner),
        cancelledDeliveries: merchantPartnerCancelledCount(partner),
        cancellationRate: `${merchantPartnerCancellationRate(partner)}%`
    })),
    [['id', 'ID'], ['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['vehicle', 'Vehicle'], ['area', 'Service area'], ['status', 'Account status'], ['availability', 'Availability'], ['activeAssignments', 'Active assignments'], ['completedDeliveries', 'Completed deliveries'], ['cancelledDeliveries', 'Cancelled deliveries'], ['cancellationRate', 'Cancellation rate'], ['createdAt', 'Created at'], ['updatedAt', 'Updated at']]
));
document.getElementById('merchantDeliveryExport').addEventListener('click', () => exportMerchantRecords(
    'rider-assignments.csv',
    merchantDeliveries,
    [['id', 'ID'], ['order', 'Order'], ['customer', 'Customer'], ['customerPhone', 'Customer phone'], ['address', 'Address'], ['driver', 'Rider'], ['phone', 'Rider phone'], ['status', 'Status'], ['createdAt', 'Created at'], ['assignedAt', 'Offer sent at'], ['offerExpiresAt', 'Offer response deadline'], ['updatedAt', 'Last updated'], ['statusHistory', 'Audit history']]
));

const merchantKioskCart = new Map();
updateMerchantStoreStatus();
let merchantKioskCategory = 'All';
let merchantKioskSearchTerm = '';
let merchantKioskOrderSequence = Math.max(
    8999,
    ...demoActiveOrders.map(order => Number(order.id.replace(/\D/g, '')))
) + 1;

function openMerchantKiosk() {
    setMerchantNavView('kiosk');
    renderMerchantKioskCatalog();
    merchantKioskScreen?.classList.add('active');
}

function renderMerchantKioskCatalog() {
    const closedNotice = document.getElementById('merchantKioskClosedNotice');
    if (closedNotice) closedNotice.hidden = merchantStoreIsOpen;
    updateMerchantKioskFulfillment();
    renderMerchantKioskSavedCustomers();
    renderMerchantKioskCategories();
    renderMerchantKioskProducts();
    renderMerchantKioskCart();
}

function updateMerchantKioskFulfillment() {
    const isDelivery = document.getElementById('merchantKioskFulfillment').value === 'delivery';
    const addressField = document.getElementById('merchantKioskDeliveryAddressField');
    const addressInput = document.getElementById('merchantKioskDeliveryAddress');
    const tableField = document.getElementById('merchantKioskTableField');
    const tableInput = document.getElementById('merchantKioskTableNumber');
    addressField.hidden = !isDelivery;
    addressInput.required = isDelivery;
    tableField.hidden = isDelivery;
    tableInput.required = !isDelivery;
}

function renderMerchantKioskSavedCustomers() {
    const select = document.getElementById('merchantKioskSavedCustomer');
    if (!select) return;
    const selected = select.value;
    select.innerHTML = '<option value="">New customer</option>' +
        merchantCustomers.map(customer => `<option value="${customer.id}">${escapeMerchantText(customer.name)} - ${escapeMerchantText(customer.phone)}</option>`).join('');
    if (merchantCustomers.some(customer => String(customer.id) === selected)) select.value = selected;
}

document.getElementById('merchantKioskSavedCustomer')?.addEventListener('change', event => {
    const customer = merchantCustomers.find(record => record.id === Number(event.target.value));
    document.getElementById('merchantKioskCustomerName').value = customer?.name || '';
    document.getElementById('merchantKioskCustomerPhone').value = customer?.phone || '';
    document.getElementById('merchantKioskDeliveryAddress').value = customer?.address || '';
});

document.getElementById('merchantKioskFulfillment')?.addEventListener('change', updateMerchantKioskFulfillment);

function renderMerchantKioskCategories() {
    const categories = document.getElementById('merchantKioskCategories');
    if (!categories) return;

    const availableCategories = [...new Set(merchantMenuItems.filter(item => item.active).map(item => item.category || 'Other'))];
    if (!availableCategories.includes(merchantKioskCategory) && merchantKioskCategory !== 'All') merchantKioskCategory = 'All';
    const categoryOptions = ['All', ...availableCategories];
    categories.innerHTML = categoryOptions.map(category => `
        <button class="merchant-kiosk-category ${category === merchantKioskCategory ? 'active' : ''}" type="button" data-kiosk-category="${escapeMerchantText(category)}" aria-pressed="${category === merchantKioskCategory}">
            ${escapeMerchantText(category)}
        </button>
    `).join('');
}

function renderMerchantKioskProducts() {
    const products = document.getElementById('merchantKioskProducts');
    if (!products) return;

    const availableItems = merchantMenuItems.filter(item => item.active);
    const shownItems = availableItems.filter(item => {
        const matchesCategory = merchantKioskCategory === 'All' || (item.category || 'Other') === merchantKioskCategory;
        const searchableText = `${item.name} ${item.description || ''} ${item.ingredients || ''}`.toLowerCase();
        return matchesCategory && searchableText.includes(merchantKioskSearchTerm);
    });
    document.getElementById('merchantKioskAvailableCount').textContent = `${availableItems.length} items available`;

    if (shownItems.length === 0) {
        products.innerHTML = '<div class="merchant-kiosk-empty">No menu items match your search.</div>';
        return;
    }

    products.innerHTML = shownItems.map(item => {
        const cartEntry = merchantKioskCart.get(item.id);
        const photo = item.image
            ? `<img src="${escapeMerchantText(item.image)}" alt="${escapeMerchantText(item.name)}" loading="lazy">`
            : `<div class="merchant-kiosk-product-placeholder" aria-hidden="true">${escapeMerchantText(item.img || '🍽')}</div>`;
        return `
            <article class="merchant-kiosk-product-card">
                <div class="merchant-kiosk-product-image">${photo}</div>
                <div class="merchant-kiosk-product-content">
                    <div class="merchant-kiosk-product-title-row"><h3>${escapeMerchantText(item.name)}</h3><strong>${formatMerchantCurrency(item.price)}</strong></div>
                    <div class="merchant-kiosk-product-meta">
                        <span class="merchant-kiosk-product-category">${escapeMerchantText(item.category || 'Other')}</span>
                        <span class="merchant-kiosk-ingredients">${escapeMerchantText(item.ingredients || 'Ask our team for details.')}</span>
                    </div>
                    <button class="merchant-kiosk-add ${cartEntry ? 'is-added' : ''}" type="button" data-kiosk-add="${item.id}" ${merchantStoreIsOpen ? '' : 'disabled'}><span aria-hidden="true">＋</span> ${cartEntry ? `Added (${cartEntry.quantity})` : 'Add to order'}</button>
                </div>
            </article>
        `;
    }).join('');
}

function renderMerchantKioskCart() {
    const cartItems = document.getElementById('merchantKioskCartItems');
    if (!cartItems) return;

    const entries = [...merchantKioskCart.values()];
    const itemCount = entries.reduce((count, entry) => count + entry.quantity, 0);
    const subtotal = entries.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
    const cartPanel = document.getElementById('merchantKioskCartPanel');
    cartPanel.classList.toggle('has-items', itemCount > 0);
    cartPanel.hidden = itemCount === 0;
    document.querySelector('.merchant-kiosk-workspace').classList.toggle('has-kiosk-cart', itemCount > 0);
    document.getElementById('merchantKioskHeaderCount').textContent = itemCount;
    document.getElementById('merchantKioskCartCount').textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
    document.getElementById('merchantKioskSubtotal').textContent = formatMerchantCurrency(subtotal);
    document.getElementById('merchantKioskPlaceOrder').disabled = itemCount === 0 || !merchantStoreIsOpen;
    cartItems.innerHTML = entries.length === 0
        ? '<div class="merchant-kiosk-cart-empty">Your basket is empty.</div>'
        : entries.map(({ item, quantity }) => `
            <div class="merchant-kiosk-cart-item">
                <div class="merchant-kiosk-cart-item-info"><strong>${escapeMerchantText(item.name)}</strong><small>${formatMerchantCurrency(item.price)} each</small></div>
                <div class="merchant-kiosk-quantity">
                    <button type="button" data-kiosk-quantity="decrease" data-kiosk-item="${item.id}" aria-label="Remove one ${escapeMerchantText(item.name)}">−</button>
                    <span>${quantity}</span>
                    <button type="button" data-kiosk-quantity="increase" data-kiosk-item="${item.id}" aria-label="Add one ${escapeMerchantText(item.name)}">+</button>
                </div>
            </div>
        `).join('');
}

document.getElementById('merchantKioskSearch')?.addEventListener('input', event => {
    merchantKioskSearchTerm = event.target.value.trim().toLowerCase();
    renderMerchantKioskProducts();
});

document.getElementById('merchantKioskCategories')?.addEventListener('click', event => {
    const button = event.target.closest('[data-kiosk-category]');
    if (!button) return;
    merchantKioskCategory = button.dataset.kioskCategory;
    renderMerchantKioskCategories();
    renderMerchantKioskProducts();
});

document.getElementById('merchantKioskProducts')?.addEventListener('click', event => {
    const button = event.target.closest('[data-kiosk-add]');
    if (!button || !merchantStoreIsOpen) return;
    const item = merchantMenuItems.find(product => product.id === Number(button.dataset.kioskAdd) && product.active);
    if (!item) return;
    const entry = merchantKioskCart.get(item.id) || { item, quantity: 0 };
    entry.quantity += 1;
    merchantKioskCart.set(item.id, entry);
    renderMerchantKioskCart();
    renderMerchantKioskProducts();
});

document.getElementById('merchantKioskCartItems')?.addEventListener('click', event => {
    const button = event.target.closest('[data-kiosk-quantity]');
    if (!button) return;
    const itemId = Number(button.dataset.kioskItem);
    const entry = merchantKioskCart.get(itemId);
    if (!entry) return;
    entry.quantity += button.dataset.kioskQuantity === 'increase' ? 1 : -1;
    if (entry.quantity <= 0) merchantKioskCart.delete(itemId);
    renderMerchantKioskCart();
    renderMerchantKioskProducts();
});

document.getElementById('merchantKioskPlaceOrder')?.addEventListener('click', () => {
    const customerNameInput = document.getElementById('merchantKioskCustomerName');
    const customerPhoneInput = document.getElementById('merchantKioskCustomerPhone');
    const fulfillment = document.getElementById('merchantKioskFulfillment').value;
    const deliveryAddressInput = document.getElementById('merchantKioskDeliveryAddress');
    const tableNumberInput = document.getElementById('merchantKioskTableNumber');
    const customerName = customerNameInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const deliveryAddress = deliveryAddressInput.value.trim();
    const tableNumber = Number(tableNumberInput.value);
    if (!customerName) { customerNameInput.focus(); showToast('Enter your name to place the order.'); return; }
    if (customerPhone.replace(/\D/g, '').length < 8) { customerPhoneInput.focus(); showToast('Enter a valid phone number.'); return; }
    if (fulfillment === 'delivery' && !deliveryAddress) {
        deliveryAddressInput.focus();
        showToast('Enter a delivery address.');
        return;
    }
    if (fulfillment === 'dine-in' && (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 999)) {
        tableNumberInput.focus();
        showToast('Enter your table number.');
        return;
    }
    if (!merchantStoreIsOpen || merchantKioskCart.size === 0) return;

    const entries = [...merchantKioskCart.values()];
    const total = entries.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
    const existingCustomer = merchantCustomers.find(record => merchantPhoneKey(record.phone) === merchantPhoneKey(customerPhone));
    const customerId = existingCustomer?.id || Math.max(0, ...merchantCustomers.map(record => record.id)) + 1;
    const createdAt = new Date().toISOString();
    const order = {
        id: `#${merchantKioskOrderSequence++}`,
        customer: customerName,
        phone: customerPhone,
        customerId,
        merchant: 'Al Reef Restaurant',
        createdAt,
        statusHistory: [{ status: 'new', at: createdAt, actor: 'Customer (prototype)' }],
        fulfillment,
        deliveryAddress: fulfillment === 'delivery' ? deliveryAddress : '',
        pickupAddress: fulfillment === 'delivery' ? merchantPickupAddress : '',
        table: fulfillment === 'dine-in' ? tableNumber : null,
        items: entries.map(({ item, quantity }) => `${quantity}x ${item.name}`).join(', '),
        total: formatMerchantCurrency(total),
        received: new Date().toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' }),
        status: 'new'
    };
    const nextCustomers = existingCustomer
        ? merchantCustomers.map(record => record.id === existingCustomer.id
            ? {
                ...record,
                address: fulfillment === 'delivery' ? deliveryAddress : record.address,
                orders: record.orders + 1,
                lastOrderAt: order.createdAt,
                updatedAt: order.createdAt
            }
            : record)
        : [{
            id: Math.max(0, ...merchantCustomers.map(record => record.id)) + 1,
            name: customerName,
            phone: customerPhone,
            email: '',
            address: fulfillment === 'delivery' ? deliveryAddress : '',
            orders: 1,
            lastOrderAt: order.createdAt,
            createdAt: order.createdAt,
            updatedAt: order.createdAt
        }, ...merchantCustomers];
    const nextActiveOrders = [order, ...demoActiveOrders];
    if (!saveMerchantCollections({
        kiryaMerchantActiveOrders: nextActiveOrders,
        kiryaMerchantCustomers: nextCustomers
    })) return;
    demoActiveOrders = nextActiveOrders;
    merchantCustomers = nextCustomers;
    renderCustomerOrders();
    merchantKioskCart.clear();
    customerNameInput.value = '';
    customerPhoneInput.value = '';
    deliveryAddressInput.value = '';
    tableNumberInput.value = '';
    document.getElementById('merchantKioskSavedCustomer').value = '';
    document.getElementById('merchantKioskFulfillment').value = 'dine-in';
    updateMerchantKioskFulfillment();
    renderMerchantKioskSavedCustomers();
    renderMerchantActiveOrders();
    renderMerchantCustomers();
    renderMerchantAssignmentOptions();
    updateMerchantOrderMetrics();
    renderMerchantKioskCart();
    renderMerchantKioskProducts();
    showToast(`Order ${order.id} sent to Al Reef Restaurant.`);
});

document.getElementById('merchantKioskSearch')?.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        event.target.value = '';
        merchantKioskSearchTerm = '';
        renderMerchantKioskProducts();
    }
});

function renderMerchantActiveOrders() {
    const list = document.getElementById('merchantActiveOrderList');
    if (!list) return;

    const activeStatuses = new Set(['new', 'preparing', 'ready']);
    const activeOrders = demoActiveOrders.filter(order => activeStatuses.has(order.status));
    document.getElementById('merchantActiveOrdersBadge').textContent = activeOrders.length;
    document.getElementById('merchantActiveOrdersNavCount').textContent = activeOrders.length;
    list.innerHTML = '';
    const search = document.getElementById('merchantActiveOrderSearch').value.trim().toLowerCase();
    const statusFilter = document.getElementById('merchantActiveOrderFilter').value;
    const filteredOrders = activeOrders.filter(order =>
        (statusFilter === 'all' || order.status === statusFilter) &&
        `${order.id} ${order.customer} ${order.items}`.toLowerCase().includes(search)
    );

    if (filteredOrders.length === 0) {
        const hasFilters = Boolean(search) || statusFilter !== 'all';
        list.innerHTML = `<div class="merchant-active-orders-empty">${hasFilters ? 'No active orders match your filters.' : 'No active orders right now.'}</div>`;
        return;
    }

    filteredOrders.forEach(order => {
        const statusLabel = { new: 'New order', preparing: 'Preparing', ready: 'Ready for pickup' }[order.status];
        const activeDelivery = merchantDeliveries.find(delivery =>
            delivery.order === order.id && merchantActiveDeliveryStatuses.includes(delivery.status)
        );
        const actions = order.status === 'new'
            ? '<button class="danger" type="button" data-active-order-action="decline">Decline</button><button class="primary" type="button" data-active-order-action="accept">Accept order</button>'
            : order.status === 'preparing'
                ? '<button class="primary" type="button" data-active-order-action="ready">Mark ready</button>'
                : order.fulfillment === 'delivery'
                    ? activeDelivery
                        ? `<span class="merchant-muted">Rider ${escapeMerchantText(merchantDeliveryStatusLabels[activeDelivery.status].toLowerCase())}</span>`
                        : '<button class="primary" type="button" data-active-order-action="dispatch">Dispatch rider</button>'
                    : '<button class="primary" type="button" data-active-order-action="complete">Complete</button>';
        const card = document.createElement('article');
        card.className = 'merchant-active-order';
        card.dataset.orderId = order.id;
        card.innerHTML = `
            <div class="merchant-active-order-main">
                <div class="merchant-active-order-heading"><strong>${escapeMerchantText(order.id)}</strong><span>${escapeMerchantText(order.customer)}</span>${order.merchant ? `<span>${escapeMerchantText(order.merchant)}</span>` : ''}${order.table ? `<span>Table ${escapeMerchantText(order.table)}</span>` : ''}<span>${order.fulfillment === 'delivery' ? 'Delivery' : 'Dine-in'}</span><span>Received ${escapeMerchantText(order.received)}</span></div>
                <div class="merchant-active-order-details">${escapeMerchantText(order.items)}</div>
                ${order.fulfillment === 'delivery' ? `<div class="merchant-active-order-details">${escapeMerchantText(order.deliveryAddress || 'Delivery address required')}</div>` : ''}
            </div>
            <span class="merchant-order-status ${order.status}">${statusLabel}</span>
            <div class="merchant-active-order-total">${escapeMerchantText(order.total)}</div>
            <div class="merchant-active-order-actions">${actions}</div>
        `;
        list.appendChild(card);
    });
}

document.getElementById('merchantActiveOrderSearch').addEventListener('input', renderMerchantActiveOrders);
document.getElementById('merchantActiveOrderFilter').addEventListener('change', renderMerchantActiveOrders);

document.getElementById('merchantActiveOrderList')?.addEventListener('click', event => {
    const button = event.target.closest('[data-active-order-action]');
    const card = button?.closest('[data-order-id]');
    if (!button || !card) return;

    const order = demoActiveOrders.find(item => item.id === card.dataset.orderId);
    if (!order) return;

    const action = button.dataset.activeOrderAction;
    if (action === 'dispatch') {
        navigateMerchantView('assigned-riders');
        const orderSelect = document.getElementById('merchantDeliveryOrder');
        orderSelect.value = order.id;
        updateMerchantAssignmentOrder();
        document.getElementById('merchantDeliveryPartner').focus();
        return;
    }
    const nextStatus = { accept: 'preparing', ready: 'ready', complete: 'completed', decline: 'declined' }[action];
    if (!nextStatus) return;

    const reason = action === 'decline'
        ? prompt(`Enter a reason for declining order ${order.id}:`)?.trim()
        : '';
    if (action === 'decline' && !reason) {
        showToast('A reason is required to decline an order.');
        return;
    }
    const updatedOrder = {
        ...order,
        status: nextStatus,
        statusHistory: [
            ...(order.statusHistory || []),
            {
                status: nextStatus,
                at: new Date().toISOString(),
                actor: 'Merchant staff',
                ...(reason ? { reason } : {})
            }
        ]
    };
    if (action === 'complete' || action === 'decline') {
        const nextActiveOrders = demoActiveOrders.filter(item => item.id !== order.id);
        const nextPastOrders = [{
            ...updatedOrder,
            date: `Today, ${order.received}`,
            items: order.table ? `Table ${order.table} - ${order.items}` : order.items,
            total: order.total,
            status: action === 'complete' ? 'Delivered' : 'Cancelled',
            statusColor: action === 'complete' ? '#019E81' : '#ff4757',
            ...(reason ? { cancellationReason: reason } : {})
        }, ...dummyPastOrders];
        if (!saveMerchantCollections({
            kiryaMerchantActiveOrders: nextActiveOrders,
            kiryaMerchantPastOrders: nextPastOrders
        })) return;
        demoActiveOrders = nextActiveOrders;
        dummyPastOrders = nextPastOrders;
    } else {
        const nextActiveOrders = demoActiveOrders.map(item => item.id === order.id ? updatedOrder : item);
        if (!saveMerchantCollection('kiryaMerchantActiveOrders', nextActiveOrders)) return;
        demoActiveOrders = nextActiveOrders;
    }
    renderCustomerOrders();
    renderMerchantActiveOrders();
    populateMerchantAssignmentOptions();
    updateMerchantOrderMetrics();
    showToast(`Order ${order.id} ${action === 'decline' ? 'declined' : action === 'complete' ? 'completed' : nextStatus === 'ready' ? 'marked ready' : 'accepted'}.`);
});

let dummyPastOrders = loadMerchantCollection('kiryaMerchantPastOrders', [
    { id: '#8820', date: 'Today, 10:30 AM', items: '2x Cheese Burger, 1x Cola', total: 'UGX 55,000', status: 'Delivered', statusColor: '#019E81' },
    { id: '#8819', date: 'Yesterday, 8:15 PM', items: '1x Family Pizza Feast', total: 'UGX 85,000', status: 'Delivered', statusColor: '#019E81' },
    { id: '#8818', date: 'Yesterday, 7:00 PM', items: '3x Spicy Wings (6pcs)', total: 'UGX 90,000', status: 'Cancelled', statusColor: '#ff4757' },
    { id: '#8817', date: '22 Oct, 1:00 PM', items: '1x Zinger Wrap', total: 'UGX 22,000', status: 'Delivered', statusColor: '#019E81' },
    { id: '#8816', date: '21 Oct, 9:45 PM', items: '2x Milkshakes', total: 'UGX 36,000', status: 'Delivered', statusColor: '#019E81' }
], order =>
    order && typeof order.id === 'string' && typeof order.date === 'string' &&
    typeof order.items === 'string' && typeof order.total === 'string' &&
    /\d/.test(order.total) &&
    ['Delivered', 'Cancelled'].includes(order.status)
);

function getMerchantAnalyticsSnapshot() {
    const activeOrders = demoActiveOrders.filter(order => ['new', 'preparing', 'ready'].includes(order.status));
    const orderStatus = {
        New: demoActiveOrders.filter(order => order.status === 'new').length,
        Preparing: demoActiveOrders.filter(order => order.status === 'preparing').length,
        Ready: demoActiveOrders.filter(order => order.status === 'ready').length,
        Delivered: dummyPastOrders.filter(order => order.status === 'Delivered').length,
        Cancelled: dummyPastOrders.filter(order => order.status === 'Cancelled').length
    };
    const amountForStatus = status => [...activeOrders, ...dummyPastOrders]
        .filter(order => status === 'In progress'
            ? ['new', 'preparing', 'ready'].includes(order.status)
            : order.status.toLowerCase() === status.toLowerCase())
        .reduce((sum, order) => sum + Number(order.total.replace(/[^\d.]/g, '')), 0);
    const categories = merchantMenuItems.reduce((counts, item) => {
        const category = item.category || 'Other';
        counts[category] = (counts[category] || 0) + 1;
        return counts;
    }, {});

    return {
        statusLabels: Object.keys(orderStatus),
        statusValues: Object.values(orderStatus),
        valueLabels: ['In progress', 'Delivered', 'Cancelled'],
        values: ['In progress', 'Delivered', 'Cancelled'].map(amountForStatus),
        categoryLabels: Object.keys(categories),
        categoryValues: Object.values(categories)
    };
}

function updateMerchantAnalytics() {
    const analytics = getMerchantAnalyticsSnapshot();
    if (dailySalesChartInstance) {
        dailySalesChartInstance.data.labels = analytics.valueLabels;
        dailySalesChartInstance.data.datasets[0].data = analytics.values;
        dailySalesChartInstance.update();
    }
    if (topItemsChartInstance) {
        topItemsChartInstance.data.labels = analytics.categoryLabels;
        topItemsChartInstance.data.datasets[0].data = analytics.categoryValues;
        topItemsChartInstance.update();
    }
    if (orderStatusChartInstance) {
        orderStatusChartInstance.data.labels = analytics.statusLabels;
        orderStatusChartInstance.data.datasets[0].data = analytics.statusValues;
        orderStatusChartInstance.update();
    }
}

function updateMerchantOrderMetrics() {
    const orderCount = demoActiveOrders.length + dummyPastOrders.length;
    const salesTotal = [...demoActiveOrders, ...dummyPastOrders].reduce((sum, order) =>
        sum + Number(order.total.replace(/[^\d.]/g, '')), 0
    );
    const activeRiderAssignments = merchantDeliveries.filter(delivery =>
        merchantActiveDeliveryStatuses.includes(delivery.status)
    ).length;
    const availableRiders = merchantPartners.filter(partner =>
        partner.status === 'active' &&
        partner.availability === 'available' &&
        merchantPartnerWorkload(partner) === 0
    ).length;
    document.getElementById('merchantSalesTotal').textContent = formatMerchantCurrency(salesTotal);
    document.getElementById('merchantOrdersTotal').textContent = orderCount;
    document.getElementById('merchantCustomerMetric').textContent = merchantCustomers.length;
    document.getElementById('merchantCustomerCount').textContent = merchantCustomers.length;
    document.getElementById('merchantAssignedRidersCount').textContent = activeRiderAssignments;
    document.getElementById('merchantActiveRiderAssignmentsMetric').textContent = activeRiderAssignments;
    document.getElementById('merchantCancelledOrdersMetric').textContent =
        dummyPastOrders.filter(order => order.status === 'Cancelled').length;
    document.getElementById('merchantDeliveredAssignmentsMetric').textContent =
        merchantDeliveries.filter(delivery => delivery.status === 'delivered').length;
    document.getElementById('merchantAvailableRidersMetric').textContent = availableRiders;
    const salesGoalProgress = Math.min(100, salesTotal / 2_000_000 * 100);
    const ordersGoalProgress = Math.min(100, orderCount);
    document.getElementById('merchantSalesGoal').value = salesGoalProgress;
    document.getElementById('merchantSalesGoalValue').innerHTML = `${formatMerchantCurrency(salesTotal)} <small>of UGX 2,000,000</small>`;
    document.getElementById('merchantSalesGoalPercent').textContent = `${salesGoalProgress.toFixed(1)}% of the order value goal`;
    document.getElementById('merchantOrdersGoal').value = ordersGoalProgress;
    document.getElementById('merchantOrdersGoalValue').innerHTML = `${orderCount} <small>of 100 orders</small>`;
    document.getElementById('merchantOrdersGoalPercent').textContent = `${ordersGoalProgress}% of the orders goal`;
    if (dailySalesChartInstance || topItemsChartInstance || orderStatusChartInstance) updateMerchantAnalytics();
}

function renderMerchantOrders() {
    merchantOrdersList.innerHTML = '';
    const search = document.getElementById('merchantPastOrderSearch').value.trim().toLowerCase();
    const status = document.getElementById('merchantPastOrderFilter').value;
    const filtered = dummyPastOrders.filter(order =>
        (status === 'all' || order.status === status) &&
        `${order.id} ${order.date} ${order.customer || ''} ${order.items}`.toLowerCase().includes(search)
    );
    merchantOrdersList.innerHTML = filtered.length
        ? filtered.map(order => {
            const orderTimeline = (order.statusHistory || []).map(item => {
                const labels = { new: 'New', preparing: 'Preparing', ready: 'Ready', completed: 'Delivered', declined: 'Cancelled' };
                return `<li><strong>${escapeMerchantText(labels[item.status] || item.status)}</strong> - ${escapeMerchantText(new Date(item.at).toLocaleString())}<span>${escapeMerchantText(item.actor || 'Merchant staff')}</span>${item.reason ? `<p>${escapeMerchantText(item.reason)}</p>` : ''}</li>`;
            }).join('');
            return `
            <tr>
              <td>${escapeMerchantText(order.id)}</td><td>${escapeMerchantText(order.date)}</td>
              <td>${escapeMerchantText(order.customer || '—')}</td>
              <td>${escapeMerchantText(order.fulfillment === 'delivery' ? 'Delivery' : order.table ? `Dine-in (table ${order.table})` : '—')}</td>
              <td>${escapeMerchantText(order.items)}</td><td>${escapeMerchantText(order.total)}</td>
              <td><span class="merchant-status-pill ${order.status === 'Delivered' ? 'delivered' : 'cancelled'}">${escapeMerchantText(order.status)}</span>${orderTimeline ? `<details class="merchant-customer-history"><summary>Order timeline</summary><ul>${orderTimeline}</ul></details>` : ''}${order.cancellationReason ? `<p>${escapeMerchantText(order.cancellationReason)}</p>` : ''}</td>
            </tr>
        `}).join('')
        : '<tr><td class="merchant-record-empty" colspan="7">No orders match your filters.</td></tr>';
}

document.getElementById('merchantPastOrderSearch').addEventListener('input', renderMerchantOrders);
document.getElementById('merchantPastOrderFilter').addEventListener('change', renderMerchantOrders);

function openMerchantOrders() {
    setMerchantNavView('orders');
    renderMerchantOrders();
    merchantOrdersScreen.classList.add('active');
}

function openMerchantActiveOrders() {
    [merchantKioskScreen, merchantMenuScreen, merchantEditItemScreen, merchantOrdersScreen]
        .forEach(screen => screen?.classList.remove('active'));
    setMerchantNavView('active-orders');
    merchantActiveOrdersScreen?.classList.add('active');
    renderMerchantActiveOrders();
}

renderMerchantActiveOrders();
updateMerchantOrderMetrics();

window.addEventListener('storage', event => {
    if (event.key === 'kiryaMarketplaceOffers') {
        try {
            const offers = event.newValue === null ? marketplaceOfferSeed : JSON.parse(event.newValue);
            if (!Array.isArray(offers) || !offers.every(isValidMarketplaceOffer)) throw new Error('Saved marketplace offers have an invalid format.');
            marketplaceOffers = offers;
            renderMarketplaceMapOffers();
            renderAdminMarketplaceMap();
            renderAdminMarketplaceRequests();
            renderAdminMarketplaceAudit();
            renderAdminNav();
            renderMerchantMarketplaceNotifications();
        } catch (error) {
            console.error('Unable to synchronize marketplace offers.', error);
            showToast('A marketplace update could not be synchronized in this tab.');
        }
        return;
    }
    if (event.key === riderLocationStorageKey) {
        refreshLiveRiderMaps();
        return;
    }
    const collectionKey = event.key;
    if (!collectionKey || !collectionKey.startsWith('kiryaMerchant')) return;
    if (collectionKey === 'kiryaMerchantProfile') {
        try {
            const profile = event.newValue === null ? {} : JSON.parse(event.newValue);
            if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
                throw new Error('Saved merchant profile is invalid.');
            }
            merchantProfile = {
                name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : 'Al Reef Restaurant',
                category: ['Restaurant', 'Grocery', 'Pharmacy', 'Retail', 'Other'].includes(profile.category) ? profile.category : 'Restaurant',
                phone: typeof profile.phone === 'string' ? profile.phone : '',
                address: typeof profile.address === 'string' ? profile.address : merchantPickupAddress
            };
            if (merchantProfile.address) merchantPickupAddress = merchantProfile.address;
            document.getElementById('merchantBusinessName').value = merchantProfile.name;
            document.getElementById('merchantBusinessCategory').value = merchantProfile.category;
            document.getElementById('merchantBusinessPhone').value = merchantProfile.phone;
            document.getElementById('merchantPickupAddress').value = merchantPickupAddress;
            updateMerchantPickupMarkers();
            updateRiderPickupDestination();
            updateRiderPickupRoute(riderLocationMarker?.getLatLng() || null);
        } catch (error) {
            console.error('Unable to synchronize the merchant profile.', error);
            showToast('The updated business profile could not be loaded.');
        }
        return;
    }
    if (collectionKey === 'kiryaMerchantPickupAddress') {
        try {
            const address = event.newValue === null ? '' : JSON.parse(event.newValue);
            if (typeof address !== 'string') throw new Error('Saved pickup address is not text.');
            merchantPickupAddress = address;
            merchantProfile = { ...merchantProfile, address };
            document.getElementById('merchantPickupAddress').value = address;
            document.getElementById('merchantPickupAddressStatus').textContent = address
                ? 'Pickup location is saved and will be included in new delivery orders.'
                : 'Add the store address before sending rider offers.';
            updateMerchantPickupMarkers();
            updateRiderPickupDestination();
            updateRiderPickupRoute(riderLocationMarker?.getLatLng() || null);
        } catch (error) {
            console.error('Unable to synchronize the merchant pickup address.', error);
            showToast('The updated rider pickup location could not be loaded.');
        }
        return;
    }
    if (collectionKey === 'kiryaMerchantPickupCoordinates') {
        try {
            const coordinates = event.newValue === null ? null : JSON.parse(event.newValue);
            if (coordinates !== null && (!coordinates || !Number.isFinite(coordinates.latitude) ||
                Math.abs(coordinates.latitude) > 90 || !Number.isFinite(coordinates.longitude) ||
                Math.abs(coordinates.longitude) > 180)) {
                throw new Error('Saved pickup coordinates are invalid.');
            }
            merchantPickupCoordinates = coordinates;
            updateMerchantPickupMarkers();
            updateRiderPickupDestination();
            updateRiderPickupRoute(riderLocationMarker?.getLatLng() || null);
            const status = document.getElementById('merchantPickupAddressStatus');
            if (status) status.textContent = merchantPickupAddress
                ? coordinates ? 'Pickup address and map pin are saved for new rider offers.' : 'Pickup location is saved and will be included in new delivery orders.'
                : 'Add the store address before sending rider offers.';
        } catch (error) {
            console.error('Unable to synchronize the merchant pickup coordinates.', error);
            showToast('The updated pickup map location could not be loaded.');
        }
        return;
    }
    let records;
    try {
        records = event.newValue === null ? [] : JSON.parse(event.newValue);
        if (!Array.isArray(records)) throw new Error(`Saved ${collectionKey} data is not a list.`);
    } catch (error) {
        console.error(`Unable to synchronize merchant data for ${collectionKey}.`, error);
        showToast('A merchant update could not be synchronized in this tab.');
        return;
    }
    if (collectionKey === 'kiryaMerchantActiveOrders') demoActiveOrders = records;
    else if (collectionKey === 'kiryaMerchantPastOrders') dummyPastOrders = records;
    else if (collectionKey === 'kiryaMerchantCustomers') merchantCustomers = records;
    else if (collectionKey === 'kiryaMerchantDeliveries') merchantDeliveries = records;
    else if (collectionKey === 'kiryaMerchantPartners') {
        merchantPartners = records.map(partner => ({
            ...partner,
            availability: ['available', 'off-duty'].includes(partner.availability) ? partner.availability : 'off-duty',
            verificationStatus: ['verified', 'pending', 'rejected'].includes(partner.verificationStatus) ? partner.verificationStatus : 'verified',
            adminAudit: Array.isArray(partner.adminAudit) ? partner.adminAudit : []
        }));
    } else return;

    renderMerchantActiveOrders();
    renderAdminRiderReview();
    renderAdminMarketplacePayouts();
    renderAdminMarketplaceAudit();
    renderAdminMarketplaceMap();
    if (merchantAssignedRidersScreen?.classList.contains('active')) renderMerchantDeliveries();
    if (merchantDeliveryScreen?.classList.contains('active')) renderMerchantPartners();
    if (merchantCustomersScreen?.classList.contains('active')) renderMerchantCustomers();
    renderMerchantAssignmentOptions();
    updateMerchantOrderMetrics();
    renderAdminMarketplaceMap();
    if (dailySalesChartInstance || topItemsChartInstance || orderStatusChartInstance) updateMerchantAnalytics();
    renderCustomerOrders();
});

/* Profile Picture Upload Logic */
const profilePic = document.getElementById('profilePic');
const profilePicInput = document.getElementById('profilePicInput');

if(profilePic && profilePicInput) {
    profilePic.addEventListener('click', () => {
        profilePicInput.click();
    });

    profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                profilePic.style.backgroundImage = `url(${event.target.result})`;
                profilePic.textContent = ''; // Remove the default emoji
            }
            reader.readAsDataURL(file);
        }
    });
    updateMerchantAnalytics();
}

/* Saved Addresses Screen Logic */
const savedAddressScreen = document.getElementById('savedAddressScreen');
const savedAddressBackBtn = document.getElementById('savedAddressBackBtn');
const profileSavedAddressesBtn = document.getElementById('profileSavedAddressesBtn');

if(profileSavedAddressesBtn && savedAddressScreen) {
    profileSavedAddressesBtn.addEventListener('click', () => {
        savedAddressScreen.classList.add('active');
    });
}
if(savedAddressBackBtn && savedAddressScreen) {
    savedAddressBackBtn.addEventListener('click', () => {
        savedAddressScreen.classList.remove('active');
    });
}

/* Auto-scroll function for horizontal lists */
function initAutoScroll() {
    const scrollSelectors = [
        '#shopScroll',
        '.filter-scroll',
        '#prefScroll',
        '.text-filter-scroll',
        '.search-item-scroll',
        '.brands-scroll'
    ];

    scrollSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.dataset.autoScrollInitialized) return;
            el.dataset.autoScrollInitialized = 'true';

            let scrollInterval;
            const startScrolling = () => {
                clearInterval(scrollInterval);
                scrollInterval = setInterval(() => {
                    if (el.offsetParent === null) return; // Skip if element is hidden

                    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
                        el.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        el.scrollBy({ left: 160, behavior: 'smooth' });
                    }
                }, 2500);
            };

            el.addEventListener('touchstart', () => clearInterval(scrollInterval), {passive: true});
            el.addEventListener('touchend', startScrolling, {passive: true});
            el.addEventListener('mouseenter', () => clearInterval(scrollInterval));
            el.addEventListener('mouseleave', startScrolling);

            startScrolling();
        });
    });
}
initAutoScroll();

/* Ad Banner Rotator Logic */
function initAdBanner() {
    const adContainer = document.getElementById('ad-container');
    if (!adContainer) return;

    const banners = adContainer.querySelectorAll('.ad-banner');
    if (banners.length <= 1) return;

    let currentIndex = 0;

    setInterval(() => {
        banners[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % banners.length;
        banners[currentIndex].classList.add('active');
    }, 5000); // Change every 5 seconds
}
initAdBanner();
