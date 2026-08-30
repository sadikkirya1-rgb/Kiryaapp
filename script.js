
let map, marker;
let cart = [];
let suggestedScrollInterval;
let favorites = new Set();
let isCheckoutAccordionOpen = false; let allergyNotes = ''; let recipientDetails = { name: '', phone: '' }; let userPhoneNumber = ''; let selectedPaymentMethod = { value: 'cod', icon: '💵', text: 'Cash on Delivery' }; let tipPercentage = 0;
let riderMarker, riderRoutePolyline, riderProgressPolyline, routeAnimationFrame;
let dailySalesChartInstance, topItemsChartInstance;

function hideMap(){ const m=document.getElementById('map'); if(m) m.style.display='none'; }
function showMap(){ const m=document.getElementById('map'); if(m) m.style.display='block'; }
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

/* Splash */
document.addEventListener('DOMContentLoaded',()=>{
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
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
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
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json&accept-language=en`)
    .then(res=>res.json())
    .then(data=>{
      if(data && data.display_name){
        document.getElementById('selectedAddress').textContent = data.display_name;
        updateSelectedAddressCard();
      }
    });
}

function updateSelectedAddressCard(){
  const addrText = document.getElementById('selectedAddress').textContent;
  if(addrText && addrText !== 'Select a location on the map'){
    document.getElementById('selectedAddressText').textContent = addrText;
  } else {
    document.getElementById('selectedAddressText').textContent = 'Set delivery address';
  }
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
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat=pos.coords.latitude, lng=pos.coords.longitude;
      marker.setLatLng([lat,lng]);
      reverseGeocode({lat,lng});
      map.setView([lat,lng],15);
    },()=>alert("Unable to access your location."));
  } else { alert("Geolocation not supported."); }
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

  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&accept-language=en`)
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

    let totalItems = 0;
    let totalPrice = 0;
    cart.forEach(item => {
        totalItems += item.quantity;
        let itemPrice = item.basePrice;
        if (item.addons) {
            item.addons.forEach(addon => {
                itemPrice += addon.price;
            });
        }
        totalPrice += itemPrice * item.quantity;
    });

    if (totalItems > 0 && restaurantScreen.classList.contains('active')) {
        document.getElementById('cartItemCount').textContent = totalItems;
        viewCartBtn.style.display = 'flex';
        setTimeout(() => viewCartBtn.classList.add('active'), 10);
    } else {
        viewCartBtn.classList.remove('active');
        viewCartBtn.style.display = 'none';
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
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
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

            const whatsappNumber = '971562889428'; // Business WhatsApp Number
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            showToast("Order placed successfully! 🎉");
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
}

function openAdmin() {
    document.getElementById('adminScreen').classList.add('active');
}

function openShopPortal() {
    document.getElementById('shopPortalScreen').classList.add('active');
    setTimeout(initMerchantCharts, 300); // Delay to ensure canvas is visible
}

function setupGlobalNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const span = item.querySelector('span');
        if (!span) return;
        const text = span.textContent.trim();
        
        if (['Cart', 'Rider', 'Admin', 'Shop', 'Profile'].includes(text)) {
            item.addEventListener('click', () => {
                if (text === 'Cart') openCart();
                else if (text === 'Rider') openRider();
                else if (text === 'Admin') openAdmin();
                else if (text === 'Shop') openShopPortal();
                else if (text === 'Profile') openProfile();
            });
        }
    });
}
setupGlobalNavigation();

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

/* Rider Dashboard Logic */
let isRiderOnline = false;
let riderMap;
let riderOrderTimer;
let riderCurrentStep = 0; // 0: Idle, 1: Pickup, 2: Dropoff

function initRiderMap() {
    if(riderMap) return;
    
    // Define Layers
    const streetLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });

    riderMap = L.map('riderMap', { zoomControl: false, layers: [streetLayer] }).setView([24.4539, 54.3773], 14);

    const baseMaps = {
        "Street View": streetLayer,
        "Satellite": satelliteLayer
    };
    L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(riderMap);
}

function toggleRiderStatus() {
    isRiderOnline = !isRiderOnline;
    const btn = document.getElementById('riderStatusToggle');
    const dot = btn.querySelector('.status-dot');
    const text = btn.querySelector('.status-text');
    const msg = document.getElementById('riderIdleMsg');
    
    if(isRiderOnline) {
        btn.classList.remove('offline');
        btn.classList.add('online');
        dot.style.background = '#fff';
        text.textContent = 'ONLINE';
        text.style.color = '#fff';
        btn.style.background = '#019E81';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        
        msg.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; gap:10px;"><span>🔍</span> Finding orders nearby...</div>';
        msg.style.background = '#e0f2f1';
        msg.style.color = '#019E81';
        msg.style.fontWeight = 'bold';
        
        // Simulate an incoming order
        setTimeout(() => {
            if(isRiderOnline && riderCurrentStep === 0) triggerRiderOrder();
        }, 2500);
    } else {
        btn.classList.remove('online');
        btn.classList.add('offline');
        dot.style.background = '#ff4757';
        text.textContent = 'GO ONLINE';
        text.style.color = '#ff4757';
        btn.style.background = '#fff';
        btn.style.border = '2px solid #ff4757';

        msg.textContent = 'Go Online to start receiving orders.';
        msg.style.background = '#f0f0f0';
        msg.style.color = '#888';
        msg.style.fontWeight = 'normal';
    }
}

function triggerRiderOrder() {
    const modal = document.getElementById('riderOrderModal');
    const timerFill = document.getElementById('riderTimerFill');
    modal.classList.add('active');
    
    // Play notification sound
    const notificationSound = document.getElementById('orderNotificationSound');
    if (notificationSound) {
        // We don't need to wait for the promise to resolve, but we catch errors to prevent console logs
        // on browsers that block autoplay until user interaction.
        notificationSound.play().catch(error => console.log("Audio play failed (user interaction might be required)."));
    }

    // Timer Logic
    timerFill.style.width = '100%';
    setTimeout(() => { timerFill.style.width = '0%'; }, 100);
    
    riderOrderTimer = setTimeout(() => {
        modal.classList.remove('active');
    }, 15000); // 15 seconds to accept
}

document.getElementById('riderDeclineBtn').addEventListener('click', () => {
    clearTimeout(riderOrderTimer);
    document.getElementById('riderOrderModal').classList.remove('active');
});

document.getElementById('riderAcceptBtn').addEventListener('click', () => {
    clearTimeout(riderOrderTimer);
    document.getElementById('riderOrderModal').classList.remove('active');
    startRiderDelivery();
});

function getBearing(start, end) {
    const startLat = start.lat * Math.PI / 180;
    const startLng = start.lng * Math.PI / 180;
    const endLat = end.lat * Math.PI / 180;
    const endLng = end.lng * Math.PI / 180;
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    const brng = Math.atan2(y, x);
    return (brng * 180 / Math.PI + 360) % 360;
}

function interpolatePosition(start, end, factor) {
    const lat = start.lat + (end.lat - start.lat) * factor;
    const lng = start.lng + (end.lng - start.lng) * factor;
    return L.latLng(lat, lng);
}

function startRouteSimulation() {
    if (!riderMap) return;
    clearRouteSimulation(); // Clear any previous routes

    // Sample route from Restaurant to Customer
    const routeCoords = [
        [24.46, 54.38], [24.462, 54.385], [24.465, 54.387], [24.468, 54.386],
        [24.47, 54.39], [24.472, 54.395], [24.47, 54.40], [24.468, 54.405],
        [24.465, 54.408]
    ];

    // Full route path (dashed grey)
    riderRoutePolyline = L.polyline(routeCoords, { color: '#888', weight: 5, opacity: 0.7, dashArray: '10, 10' }).addTo(riderMap);

    // Rider's progress path (solid green)
    riderProgressPolyline = L.polyline([], { color: '#019E81', weight: 6, opacity: 0.9 }).addTo(riderMap);

    // Rider's marker
    const riderIcon = L.divIcon({ 
        html: `<div id="riderBikeIcon" style="
            font-size: 20px; 
            transition: transform 0.2s linear; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            width: 30px; 
            height: 30px; 
            background: #019E81;
            color: white;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
        ">▲</div>`, 
        className: '', 
        iconSize: [30, 30], 
        iconAnchor: [15, 15] 
    });
    riderMarker = L.marker(routeCoords[0], { icon: riderIcon }).addTo(riderMap);

    riderMap.fitBounds(riderRoutePolyline.getBounds(), { padding: [50, 50] });

    // Smooth Animation Logic
    let currentSegment = 0;
    let startTime = null;
    const speed = 0.0001; // Degrees per millisecond (approximate speed control)

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        
        if (currentSegment >= routeCoords.length - 1) return; // End of route

        const startPoint = L.latLng(routeCoords[currentSegment]);
        const endPoint = L.latLng(routeCoords[currentSegment + 1]);
        const dist = riderMap.distance(startPoint, endPoint); // Meters
        const duration = dist * 20; // 20ms per meter (adjust for speed)
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const newPos = interpolatePosition(startPoint, endPoint, progress);
        riderMarker.setLatLng(newPos);

        // Update Rotation
        const bearing = getBearing(startPoint, endPoint);
        const bikeEl = document.getElementById('riderBikeIcon');
        if(bikeEl) {
            // The '▲' icon points up (north) by default, so we can use the bearing directly.
            bikeEl.style.transform = `rotate(${bearing}deg)`; 
        }

        // Update Trail
        const currentPath = routeCoords.slice(0, currentSegment + 1).map(c => L.latLng(c));
        currentPath.push(newPos);
        riderProgressPolyline.setLatLngs(currentPath);

        if (progress < 1) {
            routeAnimationFrame = requestAnimationFrame(animate);
        } else {
            currentSegment++;
            startTime = null;
            routeAnimationFrame = requestAnimationFrame(animate);
        }
    }
    routeAnimationFrame = requestAnimationFrame(animate);
}

function startRiderDelivery() {
    riderCurrentStep = 1; // Pickup phase
    document.getElementById('riderDashboardState').style.display = 'none';
    document.getElementById('riderDeliveryState').style.display = 'block';
    document.getElementById('riderStatusToggle').style.display = 'none'; // Hide toggle during delivery
    
    // Reset Swipe Button
    resetSwipeButton('SWIPE TO PICK UP');
    startRouteSimulation();
}

function clearRouteSimulation() {
    if(routeAnimationFrame) cancelAnimationFrame(routeAnimationFrame);
    if (riderMarker && riderMap) riderMap.removeLayer(riderMarker);
    if (riderRoutePolyline && riderMap) riderMap.removeLayer(riderRoutePolyline);
    if (riderProgressPolyline && riderMap) riderMap.removeLayer(riderProgressPolyline);
    riderMarker = riderRoutePolyline = riderProgressPolyline = null;
}

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
    
    setTimeout(() => {
        if(riderCurrentStep === 1) {
            // Transition to Dropoff
            riderCurrentStep = 2;
            document.getElementById('riderStepPickup').classList.remove('active');
            document.getElementById('riderStepPickup').style.borderLeftColor = '#ddd';
            document.getElementById('riderStepPickup').style.opacity = '0.5';
            document.getElementById('riderStepDropoff').classList.add('active');
            resetSwipeButton('SWIPE TO COMPLETE');
            showToast('Picked up order! Heading to customer.');
        } else if(riderCurrentStep === 2) {
            // Complete Order
            showToast('Order Delivered! + UGX 4,500');
            document.getElementById('riderEarningsToday').textContent = '4,500.00';
            document.getElementById('riderTripsToday').textContent = '1';
            clearRouteSimulation();
            
            // Reset UI
            setTimeout(() => {
                document.getElementById('riderDeliveryState').style.display = 'none';
                document.getElementById('riderDashboardState').style.display = 'block';
                document.getElementById('riderStatusToggle').style.display = 'flex';
                riderCurrentStep = 0;
            }, 1000);
        }
    }, 500);
}

document.getElementById('riderStatusToggle').addEventListener('click', toggleRiderStatus);
document.getElementById('riderBackBtn').addEventListener('click', () => {
    document.getElementById('riderScreen').classList.remove('active');
    clearRouteSimulation();
});

// Initialize map when rider screen opens
document.querySelector('.nav-item:nth-child(5)').addEventListener('click', () => {
    setTimeout(initRiderMap, 300);
});

function initMerchantCharts() {
    // Prevent re-initialization
    if (dailySalesChartInstance) dailySalesChartInstance.destroy();
    if (topItemsChartInstance) topItemsChartInstance.destroy();

    const salesCtx = document.getElementById('dailySalesChart')?.getContext('2d');
    const itemsCtx = document.getElementById('topItemsChart')?.getContext('2d');

    if (!salesCtx || !itemsCtx) return;

    // Daily Sales Chart (Line)
    dailySalesChartInstance = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales',
                data: [120000, 190000, 150000, 210000, 180000, 250000, 230000],
                backgroundColor: 'rgba(1, 158, 129, 0.1)',
                borderColor: '#019E81',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
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

    // Top Selling Items Chart (Doughnut)
    topItemsChartInstance = new Chart(itemsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Burgers', 'Wings', 'Fries', 'Drinks'],
            datasets: [{
                label: 'Top Items',
                data: [300, 150, 100, 200],
                backgroundColor: ['#FFBF42', '#ff4757', '#2ed573', '#1e90ff'],
                hoverOffset: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

/* Merchant Menu Logic */
const merchantManageMenuBtn = document.getElementById('merchantManageMenuBtn');
const merchantMenuScreen = document.getElementById('merchantMenuScreen');
const merchantMenuBackBtn = document.getElementById('merchantMenuBackBtn');
const merchantAddMenuBtn = document.getElementById('merchantAddMenuBtn');
const merchantEditItemScreen = document.getElementById('merchantEditItemScreen');

let merchantMenuItems = [
    { id: 1, name: "Double Cheese Burger", price: 25.00, img: "🍔", active: true },
    { id: 2, name: "Spicy Chicken Wings", price: 30.00, img: "🍗", active: true },
    { id: 3, name: "Coca Cola", price: 5.00, img: "🥤", active: true },
    { id: 4, name: "French Fries", price: 15.00, img: "🍟", active: false }
];

function renderMerchantMenuItems() {
    const list = document.getElementById('merchantMenuList');
    if(!list) return;
    list.innerHTML = '';
    
    merchantMenuItems.forEach(item => {
        const div = document.createElement('div');
        div.style.cursor = 'pointer';
        div.className = 'menu-mgmt-item';
        div.innerHTML = `
            <div class="menu-mgmt-info">
                <div class="menu-mgmt-img">${item.img}</div>
                <div class="menu-mgmt-text">
                    <div class="menu-mgmt-name">${item.name}</div>
                    <div class="menu-mgmt-price">UGX ${item.price.toFixed(2)}</div>
                </div>
            </div>
            <div class="menu-mgmt-toggle ${item.active ? 'active' : ''}"></div>
        `;
        
        // Event listener for the toggle switch
        div.querySelector('.menu-mgmt-toggle').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the main item click event
            const toggle = e.currentTarget;
            toggle.classList.toggle('active');
            const isActive = toggle.classList.contains('active');
            
            // Update the data model
            const dataItem = merchantMenuItems.find(i => i.id === item.id);
            if (dataItem) dataItem.active = isActive;
            
            showToast(`${item.name} status updated`);
        });
        
        // Event listener for the whole item to open the edit screen
        div.addEventListener('click', () => {
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
    const idInput = document.getElementById('editItemId');
    const deleteBtn = document.getElementById('deleteItemBtn');

    if (itemId === null) { // Add mode
        titleEl.textContent = 'Add New Item';
        nameInput.value = '';
        priceInput.value = '';
        imgInput.value = '';
        idInput.value = '';
        deleteBtn.style.display = 'none';
    } else { // Edit mode
        const item = merchantMenuItems.find(i => i.id === itemId);
        if (!item) return;
        titleEl.textContent = 'Edit Item';
        nameInput.value = item.name;
        priceInput.value = item.price;
        imgInput.value = item.img;
        idInput.value = item.id;
        deleteBtn.style.display = 'block';
    }
    merchantEditItemScreen.classList.add('active');
}

if(merchantManageMenuBtn) merchantManageMenuBtn.addEventListener('click', () => {
    merchantMenuScreen.classList.add('active');
    renderMerchantMenuItems();
});
if(merchantMenuBackBtn) merchantMenuBackBtn.addEventListener('click', () => merchantMenuScreen.classList.remove('active'));
if(merchantAddMenuBtn) merchantAddMenuBtn.addEventListener('click', () => openEditItemScreen(null));

// Listeners for the Edit Item Screen
document.getElementById('editItemBackBtn').addEventListener('click', () => merchantEditItemScreen.classList.remove('active'));

document.getElementById('saveItemBtn').addEventListener('click', () => {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('editItemName').value;
    const price = parseFloat(document.getElementById('editItemPrice').value);
    const img = document.getElementById('editItemImg').value;

    if (!name || isNaN(price)) { showToast('Please enter a valid name and price.'); return; }

    if (id) { // Update existing
        const item = merchantMenuItems.find(i => i.id == id);
        if (item) { Object.assign(item, { name, price, img }); }
    } else { // Add new
        const newId = Math.max(0, ...merchantMenuItems.map(i => i.id)) + 1;
        merchantMenuItems.push({ id: newId, name, price, img, active: true });
    }
    renderMerchantMenuItems();
    merchantEditItemScreen.classList.remove('active');
    showToast('Menu updated successfully!');
});

document.getElementById('deleteItemBtn').addEventListener('click', () => {
    const id = document.getElementById('editItemId').value;
    if (id && confirm('Are you sure you want to delete this item?')) {
        merchantMenuItems = merchantMenuItems.filter(i => i.id != id);
        renderMerchantMenuItems();
        merchantEditItemScreen.classList.remove('active');
        showToast('Item deleted.');
    }
});

/* Merchant Past Orders Logic */
const merchantOrdersBtn = document.getElementById('merchantOrdersBtn');
const merchantOrdersScreen = document.getElementById('merchantOrdersScreen');
const merchantOrdersBackBtn = document.getElementById('merchantOrdersBackBtn');
const merchantOrdersList = document.getElementById('merchantOrdersList');

const dummyPastOrders = [
    { id: '#8820', date: 'Today, 10:30 AM', items: '2x Cheese Burger, 1x Cola', total: 'UGX 55.00', status: 'Delivered', statusColor: '#019E81' },
    { id: '#8819', date: 'Yesterday, 8:15 PM', items: '1x Family Pizza Feast', total: 'UGX 85.00', status: 'Delivered', statusColor: '#019E81' },
    { id: '#8818', date: 'Yesterday, 7:00 PM', items: '3x Spicy Wings (6pcs)', total: 'UGX 90.00', status: 'Cancelled', statusColor: '#ff4757' },
    { id: '#8817', date: '22 Oct, 1:00 PM', items: '1x Zinger Wrap', total: 'UGX 22.00', status: 'Delivered', statusColor: '#019E81' },
    { id: '#8816', date: '21 Oct, 9:45 PM', items: '2x Milkshakes', total: 'UGX 36.00', status: 'Delivered', statusColor: '#019E81' }
];

function renderMerchantOrders() {
    merchantOrdersList.innerHTML = '';
    dummyPastOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'dashboard-card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:800; color:#333;">${order.id}</span>
                <span style="font-size:0.85em; color:#666;">${order.date}</span>
            </div>
            <div style="font-size:0.95em; color:#555; line-height:1.4;">${order.items}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                <span style="font-weight:bold; color:#333;">${order.total}</span>
                <span style="background:${order.statusColor}20; color:${order.statusColor}; padding:4px 8px; border-radius:6px; font-size:0.85em; font-weight:700;">${order.status}</span>
            </div>
        `;
        merchantOrdersList.appendChild(card);
    });
}

if(merchantOrdersBtn) {
    merchantOrdersBtn.addEventListener('click', () => {
        renderMerchantOrders();
        merchantOrdersScreen.classList.add('active');
    });
}
if(merchantOrdersBackBtn) {
    merchantOrdersBackBtn.addEventListener('click', () => merchantOrdersScreen.classList.remove('active'));
}

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
