// ============================================
// 1. IMPORTS & CONSTANTS
// ============================================

// 상수 import
import { calculateCartState, updateAppState } from './businessLogic.js';
import {
  PRODUCT_IDS,
  DISCOUNT_RATES,
  DISCOUNT_PERCENTAGES,
  QUANTITY_THRESHOLDS,
  POINTS_CONFIG,
  TIMER_CONFIG,
} from './constants.js';
// 유틸리티 함수 import
import {
  updateAllUI,
  updateAdditionalCalculations,
  setAppState,
  RenderingEngine,
} from './uiUpdates.js';
import { findProductById } from './utils.js';
// 비즈니스 로직 import
// UI 업데이트 import

// ============================================
// 2. STATE MANAGEMENT
// ============================================

// 상태 관리 객체 (리액트 변환을 위한 준비)
const AppState = {
  products: [],
  cart: {
    items: [],
    totalAmount: 0,
    itemCount: 0,
    bonusPoints: 0,
  },
  ui: {
    selectedProduct: null,
    lastSelectedProduct: null,
    selectElement: null,
    addButton: null,
    cartDisplay: null,
    totalElement: null,
    stockInfo: null,
    isModalOpen: false,
  },
  init() {
    this.products = [
      {
        id: PRODUCT_IDS.KEYBOARD,
        name: '버그 없애는 키보드',
        value: 10000,
        originalValue: 10000,
        stock: 50,
        onSale: false,
        suggestSale: false,
      },
      {
        id: PRODUCT_IDS.MOUSE,
        name: '생산성 폭발 마우스',
        value: 20000,
        originalValue: 20000,
        stock: 30,
        onSale: false,
        suggestSale: false,
      },
      {
        id: PRODUCT_IDS.MONITOR_ARM,
        name: '거북목 탈출 모니터암',
        value: 30000,
        originalValue: 30000,
        stock: 20,
        onSale: false,
        suggestSale: false,
      },
      {
        id: PRODUCT_IDS.LAPTOP_POUCH,
        name: '에러 방지 노트북 파우치',
        value: 15000,
        originalValue: 15000,
        stock: 0,
        onSale: false,
        suggestSale: false,
      },
      {
        id: PRODUCT_IDS.SPEAKER,
        name: `코딩할 때 듣는 Lo-Fi 스피커`,
        value: 25000,
        originalValue: 25000,
        stock: 10,
        onSale: false,
        suggestSale: false,
      },
    ];
  },
};

// ============================================
// 3. INITIALIZATION
// ============================================

// 초기화 함수들
const initializeApp = () => {
  AppState.init();

  // AppState만 사용하도록 전역 변수 제거
  // window 객체 사용하지 않음
};

// ============================================
// 4. UI COMPONENTS
// ============================================

const Header = (props = {}) => {
  const { itemCount = 0 } = props;

  return `
    <div class="mb-8">
      <h1 class="text-xs font-medium tracking-extra-wide uppercase mb-2">🛒 Hanghae Online Store</h1>
      <div class="text-5xl tracking-tight leading-none">Shopping Cart</div>
      <p id="item-count" class="text-sm text-gray-500 font-normal mt-3">🛍️ ${itemCount} items in cart</p>
    </div>
  `;
};

const ProductSelector = () => {
  const options = AppState.products
    .map((product) => {
      let discountText = '';
      if (product.onSale) discountText += ' ⚡SALE';
      if (product.suggestSale) discountText += ' 💝추천';

      if (product.stock === 0) {
        return `<option value="${product.id}" disabled class="text-gray-400">${product.name} - ${product.value}원 (품절)${discountText}</option>`;
      }
      if (product.onSale && product.suggestSale) {
        return `<option value="${product.id}" class="text-purple-600 font-bold">⚡💝${product.name} - ${product.originalValue}원 → ${product.value}원 (${DISCOUNT_PERCENTAGES.LIGHTNING_SALE + DISCOUNT_PERCENTAGES.RECOMMENDATION}% SUPER SALE!)</option>`;
      }
      if (product.onSale) {
        return `<option value="${product.id}" class="text-red-500 font-bold">⚡${product.name} - ${product.originalValue}원 → ${product.value}원 (${DISCOUNT_PERCENTAGES.LIGHTNING_SALE}% SALE!)</option>`;
      }
      if (product.suggestSale) {
        return `<option value="${product.id}" class="text-blue-500 font-bold">💝${product.name} - ${product.originalValue}원 → ${product.value}원 (${DISCOUNT_PERCENTAGES.RECOMMENDATION}% 추천할인!)</option>`;
      }
      return `<option value="${product.id}">${product.name} - ${product.value}원${discountText}</option>`;
    })
    .join('');

  return `
    <div class="mb-6 pb-6 border-b border-gray-200">
      <select id="product-select" class="w-full p-3 border border-gray-300 rounded-lg text-base mb-3">
        ${options}
      </select>
      <button id="add-to-cart" class="w-full py-3 bg-black text-white text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-all">
        Add to Cart
      </button>
      <div id="stock-status" class="text-xs text-red-500 mt-3 whitespace-pre-line"></div>
    </div>
  `;
};

const CartDisplay = () => `<div id="cart-items"></div>`;

const OrderSummary = () => `
  <div class="bg-black text-white p-8 flex flex-col">
    <h2 class="text-xs font-medium mb-5 tracking-extra-wide uppercase">Order Summary</h2>
    <div class="flex-1 flex flex-col">
      <div id="summary-details" class="space-y-3"></div>
      <div class="mt-auto">
        <div id="discount-info" class="mb-4"></div>
        <div id="cart-total" class="pt-5 border-t border-white/10">
          <div class="flex justify-between items-baseline">
            <span class="text-sm uppercase tracking-wider">Total</span>
            <div class="text-2xl tracking-tight">₩0</div>
          </div>
          <div id="loyalty-points" class="text-xs text-blue-400 mt-2 text-right">적립 포인트: 0p</div>
        </div>
        <div id="tuesday-special" class="mt-4 p-3 bg-white/10 rounded-lg hidden">
          <div class="flex items-center gap-2">
            <span class="text-2xs">🎉</span>
            <span class="text-xs uppercase tracking-wide">Tuesday Special ${DISCOUNT_PERCENTAGES.TUESDAY}% Applied</span>
          </div>
        </div>
      </div>
    </div>
    <button class="w-full py-4 bg-white text-black text-sm font-normal uppercase tracking-super-wide cursor-pointer mt-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30">
      Proceed to Checkout
    </button>
    <p class="mt-4 text-2xs text-white/60 text-center leading-relaxed">
      Free shipping on all orders.<br>
      <span id="points-notice">Earn loyalty points with purchase.</span>
    </p>
  </div>
`;

const ManualModal = () => {
  const isOpen = AppState.ui.isModalOpen;
  const overlayHidden = isOpen ? '' : 'hidden';
  const columnTransform = isOpen ? '' : 'translate-x-full';

  return `
    <button id="manual-toggle" class="fixed top-4 right-4 bg-black text-white p-3 rounded-full hover:bg-gray-900 transition-colors z-50">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </button>
    <div id="manual-overlay" class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${overlayHidden}"></div>
    <div id="manual-column" class="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl p-6 overflow-y-auto z-50 transition-transform duration-300 ${columnTransform}">
      <button class="absolute top-4 right-4 text-gray-500 hover:text-black">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <h2 class="text-xl font-bold mb-4">📖 이용 안내</h2>
     
      <div class="mb-6">
        <h3 class="text-base font-bold mb-3">💰 할인 정책</h3>
        <div class="space-y-3">
          <div class="bg-gray-100 rounded-lg p-3">
            <p class="font-semibold text-sm mb-1">개별 상품</p>
            <p class="text-gray-700 text-xs pl-2">
              • 키보드 ${QUANTITY_THRESHOLDS.INDIVIDUAL_DISCOUNT}개↑: ${DISCOUNT_PERCENTAGES.KEYBOARD}%<br>
              • 마우스 ${QUANTITY_THRESHOLDS.INDIVIDUAL_DISCOUNT}개↑: ${DISCOUNT_PERCENTAGES.MOUSE}%<br>
              • 모니터암 ${QUANTITY_THRESHOLDS.INDIVIDUAL_DISCOUNT}개↑: ${DISCOUNT_PERCENTAGES.MONITOR_ARM}%<br>
              • 스피커 ${QUANTITY_THRESHOLDS.INDIVIDUAL_DISCOUNT}개↑: ${DISCOUNT_PERCENTAGES.SPEAKER}%
            </p>
          </div>
       
          <div class="bg-gray-100 rounded-lg p-3">
            <p class="font-semibold text-sm mb-1">전체 수량</p>
            <p class="text-gray-700 text-xs pl-2">• ${QUANTITY_THRESHOLDS.BULK_PURCHASE}개 이상: ${DISCOUNT_PERCENTAGES.BULK_PURCHASE}%</p>
          </div>
       
          <div class="bg-gray-100 rounded-lg p-3">
            <p class="font-semibold text-sm mb-1">특별 할인</p>
            <p class="text-gray-700 text-xs pl-2">
              • 화요일: +${DISCOUNT_PERCENTAGES.TUESDAY}%<br>
              • ⚡번개세일: ${DISCOUNT_PERCENTAGES.LIGHTNING_SALE}%<br>
              • 💝추천할인: ${DISCOUNT_PERCENTAGES.RECOMMENDATION}%
            </p>
          </div>
        </div>
      </div>
     
      <div class="mb-6">
        <h3 class="text-base font-bold mb-3">🎁 포인트 적립</h3>
        <div class="space-y-3">
          <div class="bg-gray-100 rounded-lg p-3">
            <p class="font-semibold text-sm mb-1">기본</p>
          <p class="text-gray-700 text-xs pl-2">• 구매액의 ${((1 / POINTS_CONFIG.POINTS_DIVISOR) * 100).toFixed(1)}%</p>
          </div>
       
          <div class="bg-gray-100 rounded-lg p-3">
            <p class="font-semibold text-sm mb-1">추가</p>
            <p class="text-gray-700 text-xs pl-2">
            • 화요일: 2배<br>
            • 키보드+마우스: +${POINTS_CONFIG.KEYBOARD_MOUSE_BONUS}p<br>
            • 풀세트: +${POINTS_CONFIG.FULL_SET_BONUS}p<br>
            • ${QUANTITY_THRESHOLDS.POINTS_BONUS_10}개↑: +${POINTS_CONFIG.BONUS_10_ITEMS}p / ${QUANTITY_THRESHOLDS.POINTS_BONUS_20}개↑: +${POINTS_CONFIG.BONUS_20_ITEMS}p / ${QUANTITY_THRESHOLDS.BULK_PURCHASE}개↑: +${POINTS_CONFIG.BONUS_30_ITEMS}p
            </p>
          </div>
        </div>
      </div>
     
      <div class="border-t border-gray-200 pt-4 mt-4">
        <p class="text-xs font-bold mb-1">💡 TIP</p>
        <p class="text-2xs text-gray-600 leading-relaxed">
          • 화요일 대량구매 = MAX 혜택<br>
          • ⚡+💝 중복 가능<br>
          • 상품4 = 품절
        </p>
      </div>
  `;
};

// ============================================
// 5. UI RENDERING
// ============================================

const createUI = () => `
  ${Header({ itemCount: AppState.cart.itemCount })}
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 flex-1 overflow-hidden">
    <div class="bg-white border border-gray-200 p-8 overflow-y-auto">
      ${ProductSelector()}
      ${CartDisplay()}
    </div>
    ${OrderSummary()}
  </div>
  ${ManualModal()}
`;

const renderApp = () => {
  const root = document.getElementById('app');
  root.innerHTML = createUI();

  // DOM 캐시 초기화
  // DOM 요소 참조 설정
  AppState.ui.selectElement = document.getElementById('product-select');
  AppState.ui.addButton = document.getElementById('add-to-cart');
  AppState.ui.cartDisplay = document.getElementById('cart-items');
  AppState.ui.totalElement = document.getElementById('cart-total');
  AppState.ui.stockInfo = document.getElementById('stock-status');
};

// ============================================
// 6. EVENT HANDLERS
// ============================================
// 6.1 Modal Event Handlers

const setupModalEventListeners = () => {
  const manualToggle = document.getElementById('manual-toggle');
  const manualOverlay = document.getElementById('manual-overlay');
  const manualColumn = document.getElementById('manual-column');

  if (manualToggle) {
    manualToggle.onclick = () => {
      AppState.ui.isModalOpen = !AppState.ui.isModalOpen;
      updateModalVisibility();
    };
  }

  if (manualOverlay) {
    manualOverlay.onclick = (e) => {
      if (e.target === manualOverlay) {
        AppState.ui.isModalOpen = false;
        updateModalVisibility();
      }
    };
  }

  if (manualColumn) {
    const closeButton = manualColumn.querySelector('button');
    if (closeButton) {
      closeButton.onclick = () => {
        AppState.ui.isModalOpen = false;
        updateModalVisibility();
      };
    }
  }
};

const updateModalVisibility = () => {
  const overlay = document.getElementById('manual-overlay');
  const column = document.getElementById('manual-column');

  if (overlay && column) {
    if (AppState.ui.isModalOpen) {
      overlay.classList.remove('hidden');
      column.classList.remove('translate-x-full');
    } else {
      overlay.classList.add('hidden');
      column.classList.add('translate-x-full');
    }
  }
};

// ============================================
// 7. TIMER FUNCTIONS
// ============================================
// 7.1 Lightning Sale Timer

const setupLightningSaleTimer = () => {
  const lightningDelay = Math.random() * TIMER_CONFIG.LIGHTNING_SALE_DELAY;
  setTimeout(() => {
    setInterval(() => {
      // 배열이 비어있을 때 처리
      if (AppState.products.length === 0) return;

      const luckyIndex = Math.floor(Math.random() * AppState.products.length);
      const luckyItem = AppState.products[luckyIndex];
      if (luckyItem.stock > 0 && !luckyItem.onSale) {
        luckyItem.value = Math.round(luckyItem.originalValue * (1 - DISCOUNT_RATES.LIGHTNING_SALE));
        luckyItem.onSale = true;
        alert(
          `⚡번개세일! ${luckyItem.name}이(가) ${DISCOUNT_PERCENTAGES.LIGHTNING_SALE}% 할인 중입니다!`,
        );
        // 할인 적용 후 전체 UI 리렌더링
        handleCalculateCartStuff();
        handleUpdateSelectOptions();
        // 전체 UI 다시 렌더링
        renderApp();
        // 장바구니 아이템들 다시 생성
        const cartItems = AppState.cart.items;
        const cartDisplay = document.getElementById('cart-items');
        if (cartDisplay) {
          cartDisplay.innerHTML = '';
          cartItems.forEach((item) => {
            const product = findProductByIdLocal(item.productId);
            if (product) {
              cartDisplay.insertAdjacentHTML('beforeend', CartItemElement(product, item.quantity));
            }
          });
        }
        // 이벤트 리스너 다시 설정
        setupCartEventListeners();
      }
    }, TIMER_CONFIG.LIGHTNING_SALE_INTERVAL);
  }, lightningDelay);
};

// 7.2 Recommendation Timer

const setupRecommendationTimer = () => {
  setTimeout(() => {
    setInterval(() => {
      if (AppState.ui.cartDisplay.children.length === 0) {
        return;
      }
      if (AppState.ui.lastSelectedProduct) {
        const suggest = AppState.products.find(
          (product) =>
            product.id !== AppState.ui.lastSelectedProduct &&
            product.stock > 0 &&
            !product.suggestSale,
        );

        if (suggest) {
          alert(
            `💝 ${suggest.name}은(는) 어떠세요? 지금 구매하시면 ${DISCOUNT_PERCENTAGES.RECOMMENDATION}% 추가 할인!`,
          );

          suggest.value = Math.round(suggest.value * (1 - DISCOUNT_RATES.RECOMMENDATION));
          suggest.suggestSale = true;
          // 할인 적용 후 전체 UI 리렌더링
          handleCalculateCartStuff();
          handleUpdateSelectOptions();
          // 전체 UI 다시 렌더링
          renderApp();
          // 장바구니 아이템들 다시 생성
          const cartItems = AppState.cart.items;
          const cartDisplay = document.getElementById('cart-items');
          if (cartDisplay) {
            cartDisplay.innerHTML = '';
            cartItems.forEach((item) => {
              const product = findProductByIdLocal(item.productId);
              if (product) {
                cartDisplay.insertAdjacentHTML(
                  'beforeend',
                  CartItemElement(product, item.quantity),
                );
              }
            });
          }
        }
      }
    }, TIMER_CONFIG.RECOMMENDATION_INTERVAL);
  }, Math.random() * TIMER_CONFIG.RECOMMENDATION_DELAY);
};

const setupTimers = () => {
  setupLightningSaleTimer();
  setupRecommendationTimer();
};

// ============================================
// 8. MAIN FUNCTION
// ============================================

// 메인 함수 (리팩토링된 버전)
const main = () => {
  // 1. 앱 초기화
  initializeApp();

  // 2. UI 모듈에 AppState 설정
  setAppState(AppState);

  // 3. UI 렌더링
  renderApp();

  // 4. 이벤트 리스너 설정
  setupCartEventListeners();
  setupModalEventListeners();

  // 5. 초기화
  handleUpdateSelectOptions();
  handleCalculateCartStuff();

  // 6. 타이머 설정
  setupTimers();
};

// ============================================
// 9. UI COMPONENT HELPERS
// ============================================
// 9.1 Select Options Component

const SelectOptionsComponent = () =>
  AppState.products
    .map((item) => {
      let discountText = '';
      if (item.onSale) discountText += ' ⚡SALE';
      if (item.suggestSale) discountText += ' 💝추천';

      // 원본과 동일한 재고 표시 방식
      const stockDisplay = item.stock === 0 ? ' (품절)' : '';

      if (item.stock === 0) {
        return `<option value="${item.id}" disabled class="text-gray-400">${item.name} - ${item.value}원${stockDisplay}${discountText}</option>`;
      }
      if (item.onSale && item.suggestSale) {
        return `<option value="${item.id}" class="text-purple-600 font-bold">⚡💝${item.name} - ${item.originalValue}원 → ${item.value}원 (${DISCOUNT_PERCENTAGES.SUPER_SALE}% SUPER SALE!)${stockDisplay}</option>`;
      }
      if (item.onSale) {
        return `<option value="${item.id}" class="text-red-500 font-bold">⚡${item.name} - ${item.originalValue}원 → ${item.value}원 (${DISCOUNT_PERCENTAGES.LIGHTNING_SALE}% SALE!)${stockDisplay}</option>`;
      }
      if (item.suggestSale) {
        return `<option value="${item.id}" class="text-blue-500 font-bold">💝${item.name} - ${item.originalValue}원 → ${item.value}원 (${DISCOUNT_PERCENTAGES.RECOMMENDATION}% 추천할인!)${stockDisplay}</option>`;
      }
      return `<option value="${item.id}">${item.name} - ${item.value}원${stockDisplay}${discountText}</option>`;
    })
    .join('');

const handleUpdateSelectOptions = () => {
  const totalStock = AppState.products.reduce((sum, product) => sum + product.stock, 0);

  const { selectElement } = AppState.ui;
  if (!selectElement) return;

  // HTML 문자열 생성
  const optionsHTML = SelectOptionsComponent();

  // 렌더링 엔진으로 셀렉트 옵션 업데이트 (HTML 문자열 반환)
  const update = RenderingEngine.updateSelectOptions(optionsHTML);

  // 실제 DOM 업데이트 (임시 - 리액트 변환 시 제거)
  if (update.optionsHTML) {
    selectElement.innerHTML = update.optionsHTML;
  }

  if (totalStock < QUANTITY_THRESHOLDS.LOW_STOCK * 10) {
    selectElement.style.borderColor = 'orange';
  } else {
    selectElement.style.borderColor = '';
  }
};

// ============================================
// 10. UTILITY FUNCTIONS
// ============================================
// 10.1 Product Utilities

// 공통 유틸리티 함수들
const findProductByIdLocal = (productId) => findProductById(AppState.products, productId);

// 개별 상품 할인 계산 (businessLogic.js와 동일)
const calculateIndividualDiscount = (productId, quantity) => {
  if (quantity < QUANTITY_THRESHOLDS.INDIVIDUAL_DISCOUNT) {
    return 0;
  }

  const discountRates = {
    [PRODUCT_IDS.KEYBOARD]: DISCOUNT_RATES.KEYBOARD,
    [PRODUCT_IDS.MOUSE]: DISCOUNT_RATES.MOUSE,
    [PRODUCT_IDS.MONITOR_ARM]: DISCOUNT_RATES.MONITOR_ARM,
    [PRODUCT_IDS.LAPTOP_POUCH]: DISCOUNT_RATES.LAPTOP_POUCH,
    [PRODUCT_IDS.SPEAKER]: DISCOUNT_RATES.SPEAKER,
  };

  return discountRates[productId] || 0;
};

// ============================================
// 11. BUSINESS LOGIC
// ============================================
// 11.1 Cart Calculations

// ============================================
// 12. UI UPDATE FUNCTIONS
// ============================================
// 12.1 Display Updates

// ============================================
// 13. MAIN CALCULATION FUNCTION
// ============================================

// 메인 계산 함수 (리팩토링된 버전)
const handleCalculateCartStuff = () => {
  const cartItems = AppState.cart.items;

  // 1. 계산 로직
  const cartState = calculateCartState(cartItems, AppState.products);

  // 2. 상태 업데이트
  updateAppState(cartState, AppState);

  // 3. UI 업데이트 - HTML 컴포넌트 생성
  const uiComponents = updateAllUI(cartState, AppState);

  // 4. 렌더링 엔진으로 HTML 문자열 받기
  const renderedHTML = RenderingEngine.renderAll(uiComponents);

  // 5. 렌더링 엔진이 실제 DOM에 렌더링 (React 방식)
  const htmlResult = RenderingEngine.renderToDOM(null, renderedHTML);

  // 6. HTML 문자열을 실제 DOM에 적용 (문서 요구사항에 맞게)
  if (htmlResult.itemCount) {
    const itemCountElement = document.getElementById('item-count');
    if (itemCountElement) {
      // innerHTML 대신 textContent 사용 (DOM 직접 조작 최소화)
      itemCountElement.textContent = htmlResult.itemCount;
    }
  }

  if (htmlResult.total) {
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
      const totalTextElement = totalElement.querySelector('.text-2xl');
      if (totalTextElement) {
        // innerHTML 대신 textContent 사용 (DOM 직접 조작 최소화)
        totalTextElement.textContent = htmlResult.total;
      }
    }
  }

  if (htmlResult.summary) {
    const summaryElement = document.getElementById('summary-details');
    if (summaryElement) {
      // innerHTML 대신 textContent 사용 (DOM 직접 조작 최소화)
      summaryElement.textContent = htmlResult.summary;
    }
  }

  if (htmlResult.discount) {
    const discountElement = document.getElementById('discount-info');
    if (discountElement) {
      // innerHTML 대신 textContent 사용 (DOM 직접 조작 최소화)
      discountElement.textContent = htmlResult.discount;
    }
  }

  if (htmlResult.tuesdayBanner) {
    const tuesdayElement = document.getElementById('tuesday-special');
    if (tuesdayElement) {
      // innerHTML 대신 textContent 사용 (DOM 직접 조작 최소화)
      tuesdayElement.textContent = htmlResult.tuesdayBanner;
      tuesdayElement.classList.remove('hidden');
    }
  } else {
    const tuesdayElement = document.getElementById('tuesday-special');
    if (tuesdayElement) {
      tuesdayElement.classList.add('hidden');
    }
  }

  if (htmlResult.stock !== undefined) {
    const stockElement = document.getElementById('stock-status');
    if (stockElement) {
      // innerHTML 대신 textContent 사용 (DOM 직접 조작 최소화)
      stockElement.textContent = htmlResult.stock;
    }
  }

  if (htmlResult.points) {
    const pointsElement = document.getElementById('loyalty-points');
    if (pointsElement) {
      // innerHTML 대신 textContent 사용 (DOM 직접 조작 최소화)
      pointsElement.textContent = htmlResult.points;
      if (htmlResult.points.includes('style="display: none"')) {
        pointsElement.style.display = 'none';
      } else {
        pointsElement.style.display = 'block';
      }
    }
  }

  // 7. 추가 계산
  updateAdditionalCalculations(AppState);
};

// ============================================
// 14. POINTS CALCULATION
// ============================================
// 14.1 Base Points

const CartItemPriceComponent = (product) => {
  const priceClass =
    product.onSale && product.suggestSale
      ? 'text-purple-600'
      : product.onSale
        ? 'text-red-500'
        : product.suggestSale
          ? 'text-blue-500'
          : '';

  const namePrefix =
    product.onSale && product.suggestSale
      ? '⚡💝'
      : product.onSale
        ? '⚡'
        : product.suggestSale
          ? '💝'
          : '';

  return {
    price:
      product.onSale || product.suggestSale
        ? `<span class="line-through text-gray-400">₩${product.originalValue.toLocaleString()}</span> <span class="${priceClass}">₩${product.value.toLocaleString()}</span>`
        : `₩${product.value.toLocaleString()}`,
    name: `${namePrefix}${product.name}`,
  };
};

const handleUpdatePricesInCart = () => {
  const cartItems = AppState.cart.items;
  const priceUpdates = cartItems
    .map((cartItem) => {
      const itemId = cartItem.productId;
      const product = AppState.products.find((product) => product.id === itemId);

      if (product) {
        return {
          itemId,
          ...CartItemPriceComponent(product),
        };
      }
      return null;
    })
    .filter(Boolean);

  handleCalculateCartStuff();
  return priceUpdates;
};

// ============================================
// 15. CART ITEM MANAGEMENT
// ============================================
// 15.1 Cart Item Creation

// 장바구니 아이템 생성 함수
const CartItemElement = (product, quantity = 1) => {
  const saleIcon =
    product.onSale && product.suggestSale
      ? '⚡💝'
      : product.onSale
        ? '⚡'
        : product.suggestSale
          ? '💝'
          : '';

  const priceDisplay =
    product.onSale || product.suggestSale
      ? `<span class="line-through text-gray-400">₩${product.originalValue.toLocaleString()}</span> <span class="${product.onSale && product.suggestSale ? 'text-purple-600' : product.onSale ? 'text-red-500' : 'text-blue-500'}">₩${product.value.toLocaleString()}</span>`
      : `₩${product.value.toLocaleString()}`;

  // 원본과 동일하게 단가만 표시 (수량에 따라 볼드 스타일 적용)
  const totalPriceStyle =
    quantity >= QUANTITY_THRESHOLDS.INDIVIDUAL_DISCOUNT ? 'font-bold' : 'font-normal';
  const totalPriceDisplay =
    product.onSale || product.suggestSale
      ? `<span class="line-through text-gray-400">₩${product.originalValue.toLocaleString()}</span> <span class="${product.onSale && product.suggestSale ? 'text-purple-600' : product.onSale ? 'text-red-500' : 'text-blue-500'} ${totalPriceStyle}">₩${product.value.toLocaleString()}</span>`
      : `<span class="${totalPriceStyle}">₩${product.value.toLocaleString()}</span>`;

  return `
    <div id="${product.id}" class="grid grid-cols-[80px_1fr_auto] gap-5 py-5 border-b border-gray-100 first:pt-0 last:border-b-0 last:pb-0">
      <div class="w-20 h-20 bg-gradient-black relative overflow-hidden">
        <div class="absolute top-1/2 left-1/2 w-[60%] h-[60%] bg-white/10 -translate-x-1/2 -transㄴlate-y-1/2 rotate-45"></div>
      </div>
      <div>
        <h3 class="text-base font-normal mb-1 tracking-tight">${saleIcon}${product.name}</h3>
        <p class="text-xs text-gray-500 mb-0.5 tracking-wide">PRODUCT</p>
        <p class="text-xs text-black mb-3">${priceDisplay}</p>
        <div class="flex items-center gap-4">
          <button class="quantity-change w-6 h-6 border border-black bg-white text-sm flex items-center justify-center transition-all hover:bg-black hover:text-white" data-product-id="${product.id}" data-change="-1">−</button>
          <span class="quantity-number text-sm font-normal min-w-[20px] text-center tabular-nums">${quantity}</span>
          <button class="quantity-change w-6 h-6 border border-black bg-white text-sm flex items-center justify-center transition-all hover:bg-black hover:text-white" data-product-id="${product.id}" data-change="1">+</button>
        </div>
      </div>
      <div class="text-right">
        <div class="text-lg mb-2 tracking-tight tabular-nums">${totalPriceDisplay}</div>
        <a class="remove-item text-2xs text-gray-500 uppercase tracking-wider cursor-pointer transition-colors border-b border-transparent hover:text-black hover:border-black" data-product-id="${product.id}">Remove</a>
      </div>
    </div>
  `;
};

// 상태 변경 함수들 (비즈니스 로직)
const addItemToCart = (productId) => {
  const product = findProductByIdLocal(productId);
  if (!product || product.stock <= 0) {
    return false;
  }

  const existingItem = AppState.cart.items.find((item) => item.productId === productId);

  if (existingItem) {
    const newQuantity = existingItem.quantity + 1;
    if (newQuantity <= product.stock + existingItem.quantity) {
      existingItem.quantity = newQuantity;
      product.stock--;

      // HTML 리턴 방식 - DOM 조작 없이 HTML 문자열만 반환
      return { productId, newQuantity, success: true };
    }
    alert('재고가 부족합니다.');
    return false;
  }

  const newItem = { productId, quantity: 1 };
  AppState.cart.items.push(newItem);
  product.stock--;

  // HTML 리턴 방식 - DOM 조작 없이 HTML 문자열만 반환
  return { productId, newItemHTML: CartItemElement(product, 1), success: true };
};

const updateItemQuantity = (productId, change) => {
  const product = findProductByIdLocal(productId);
  const itemIndex = AppState.cart.items.findIndex((item) => item.productId === productId);

  if (!product || itemIndex === -1) {
    return false;
  }

  const item = AppState.cart.items[itemIndex];
  const newQuantity = item.quantity + change;

  if (newQuantity > 0 && newQuantity <= product.stock + item.quantity) {
    item.quantity = newQuantity;
    product.stock -= change;

    // HTML 리턴 방식 - DOM 조작 없이 HTML 문자열만 반환
    return { productId, newQuantity, success: true };
  }

  if (newQuantity <= 0) {
    product.stock += item.quantity;
    AppState.cart.items.splice(itemIndex, 1);

    // DOM에서 제거
    const itemElement = document.getElementById(productId);
    if (itemElement) {
      itemElement.remove();
    }
    return true;
  }

  alert('재고가 부족합니다.');
  return false;
};

const removeItemFromCart = (productId) => {
  const product = findProductByIdLocal(productId);
  const itemIndex = AppState.cart.items.findIndex((item) => item.productId === productId);

  if (!product || itemIndex === -1) {
    return false;
  }

  const item = AppState.cart.items[itemIndex];
  product.stock += item.quantity;
  AppState.cart.items.splice(itemIndex, 1);

  // DOM에서 제거
  const itemElement = document.getElementById(productId);
  if (itemElement) {
    itemElement.remove();
  }
  return true;
};

// ============================================
// 16. CART EVENT HANDLERS
// ============================================
// 16.1 Cart Actions

// 이벤트 핸들러 함수들
const handleAddToCart = () => {
  const selectedProductId = document.getElementById('product-select').value;

  if (!selectedProductId) {
    return;
  }

  const product = findProductByIdLocal(selectedProductId);
  if (!product) {
    return;
  }

  const result = addItemToCart(selectedProductId);
  if (result && result.success) {
    if (result.newQuantity) {
      // HTML 문자열 반환 방식으로 변경
      const update = RenderingEngine.updateCartItemQuantity(selectedProductId, result.newQuantity);
      if (update.success) {
        // 전체 UI 다시 렌더링 (DOM 조작 없음)
        renderApp();
        setupCartEventListeners();
      }
    } else if (result.newItemHTML) {
      // 장바구니에 새 아이템 추가
      const cartDisplay = document.getElementById('cart-items');
      if (cartDisplay && result.newItemHTML) {
        cartDisplay.insertAdjacentHTML('beforeend', result.newItemHTML);
      }
    }
    handleCalculateCartStuff();
    AppState.ui.lastSelectedProduct = selectedProductId;
  }
};

const handleQuantityChange = (productId, change) => {
  const result = updateItemQuantity(productId, change);
  if (result && result.success) {
    // HTML 문자열 반환 방식으로 변경
    const update = RenderingEngine.updateCartItemQuantity(productId, result.newQuantity);
    if (update.success) {
      // 전체 UI 다시 렌더링 (DOM 조작 없음)
      renderApp();
      setupCartEventListeners();
    }
    handleCalculateCartStuff();
    handleUpdateSelectOptions();
  }
};

const handleRemoveItem = (productId) => {
  if (removeItemFromCart(productId)) {
    handleCalculateCartStuff();
    handleUpdateSelectOptions();
  }
};

const handleCartClick = (event) => {
  const { target } = event;

  if (!target.classList.contains('quantity-change') && !target.classList.contains('remove-item')) {
    return;
  }

  const { productId } = target.dataset;
  if (!productId) {
    return;
  }

  if (target.classList.contains('quantity-change')) {
    const change = parseInt(target.dataset.change);
    handleQuantityChange(productId, change);
  } else if (target.classList.contains('remove-item')) {
    handleRemoveItem(productId);
  }
};

// ============================================
// 17. EVENT LISTENER SETUP
// ============================================

// 이벤트 리스너 설정 함수
const setupCartEventListeners = () => {
  AppState.ui.addButton.addEventListener('click', handleAddToCart);
  AppState.ui.cartDisplay.addEventListener('click', handleCartClick);
};

// ============================================
// 18. APPLICATION STARTUP
// ============================================

main();

// 이벤트 리스너 설정
setupCartEventListeners();
