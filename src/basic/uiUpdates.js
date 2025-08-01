// ============================================
// UI UPDATE FUNCTIONS
// ============================================

import { calculateAllPoints, calculateCartStatePure } from './businessLogic.js';
import { QUANTITY_THRESHOLDS } from './constants.js';
import { DOMElements } from './domElements.js';
import { getTotalStock, getStockStatusMessage, isTuesdayDay } from './utils.js';

// 전역 변수들 (main.basic.js에서 설정됨) - 점진적 정리 중
// 상품 목록과 장바구니 상태는 래퍼 함수로 접근
let productList, totalAmount, itemCount;
// DOM 요소들은 래퍼 함수로 접근
let productSelector, cartDisplay, stockInfo;

// DOM 요소 캐싱
let cachedElements = null;

// DOM 요소 캐싱 초기화
const initializeCachedElements = () => {
  if (cachedElements) return cachedElements;
  cachedElements = DOMElements.getAllElements();
  return cachedElements;
};

// 전역 변수 설정 함수
export const setGlobalVariables = (globals) => {
  const {
    productList: pl,
    productSelector: ps,
    cartDisplay: cd,
    stockInfo: si,
    totalAmount: ta,
    itemCount: ic,
  } = globals;

  productList = pl;
  productSelector = ps;
  cartDisplay = cd;
  stockInfo = si;
  totalAmount = ta;
  itemCount = ic;
};

// 상품 선택 옵션 업데이트
export const updateSelectOptions = () => {
  productSelector.innerHTML = '';
  const totalStock = getTotalStock(productList);

  productList.forEach((product) => {
    const option = document.createElement('option');
    option.value = product.id;

    let discountText = '';
    if (product.onSale) discountText += ' ⚡SALE';
    if (product.suggestSale) discountText += ' 💝추천';

    if (product.quantity === 0) {
      option.textContent = `${product.name} - ${product.value}원 (품절)${discountText}`;
      option.disabled = true;
      option.className = 'text-gray-400';
    } else {
      if (product.onSale && product.suggestSale) {
        option.textContent = `⚡💝${product.name} - ${product.originalValue}원 → ${product.value}원 (25% SUPER SALE!)`;
        option.className = 'text-purple-600 font-bold';
      } else if (product.onSale) {
        option.textContent = `⚡${product.name} - ${product.originalValue}원 → ${product.value}원 (20% SALE!)`;
        option.className = 'text-red-500 font-bold';
      } else if (product.suggestSale) {
        option.textContent = `💝${product.name} - ${product.originalValue}원 → ${product.value}원 (5% 추천할인!)`;
        option.className = 'text-blue-500 font-bold';
      } else {
        option.textContent = `${product.name} - ${product.value}원${discountText}`;
      }
    }

    productSelector.appendChild(option);
  });

  // 재고 경고 표시
  if (totalStock < QUANTITY_THRESHOLDS.TOTAL_STOCK_WARNING) {
    productSelector.style.borderColor = 'orange';
  } else {
    productSelector.style.borderColor = '';
  }
};

// 장바구니 아이템 정보 추출
const extractCartItems = () =>
  Array.from(cartDisplay.children).map((item) => ({
    productId: item.id,
    quantity: parseInt(item.querySelector('.quantity-number').textContent),
  }));

// 수량에 따른 폰트 스타일 업데이트
const updateQuantityStyles = () => {
  Array.from(cartDisplay.children).forEach((item) => {
    const quantityElement = item.querySelector('.quantity-number');
    const quantity = parseInt(quantityElement.textContent);
    const priceElements = item.querySelectorAll('.text-lg, .text-xs');

    priceElements.forEach((elem) => {
      if (elem.classList.contains('text-lg')) {
        elem.style.fontWeight = quantity >= 10 ? 'bold' : 'normal';
      }
    });
  });
};

// 전역 변수 업데이트
const updateGlobalState = (cartState) => {
  const { totalAmount: newTotalAmount, itemCount: newItemCount } = cartState;
  totalAmount = newTotalAmount;
  itemCount = newItemCount;
};

// 장바구니 계산 및 UI 업데이트
export const calculateCart = () => {
  // 1. 장바구니 아이템 정보 추출
  const cartItems = extractCartItems();

  // 2. 수량에 따른 폰트 스타일 업데이트
  updateQuantityStyles();

  // 3. 장바구니 상태 계산
  const cartState = calculateCartStatePure(cartItems, productList);

  // 4. 전역 변수 업데이트
  updateGlobalState(cartState);

  // 5. UI 업데이트
  updateCartUI(cartState);
  updatePointsDisplay();
  updateStockInfo();
};

// 아이템 수 표시 업데이트
const updateItemCountDisplay = (elements) => {
  if (elements.itemCount) {
    elements.itemCount.textContent = `🛍️ ${itemCount} items in cart`;
  }
};

// 상품별 정보 HTML 생성
const generateProductItemsHTML = () => {
  let html = '';
  const cartItems = cartDisplay.children;

  for (let i = 0; i < cartItems.length; i++) {
    const cartItem = cartItems[i];
    const product = productList.find((p) => p.id === cartItem.id);
    const quantityElement = cartItem.querySelector('.quantity-number');
    const quantity = parseInt(quantityElement.textContent);
    const itemTotal = product.value * quantity;

    html += `
      <div class="flex justify-between text-xs tracking-wide text-gray-400">
        <span>${product.name} x ${quantity}</span>
        <span>₩${itemTotal.toLocaleString()}</span>
      </div>
    `;
  }

  return html;
};

// 할인 정보 HTML 생성
const generateDiscountHTML = (itemDiscounts, finalTotal) => {
  let html = '';

  if (itemCount >= QUANTITY_THRESHOLDS.BULK_PURCHASE) {
    html += `
      <div class="flex justify-between text-sm tracking-wide text-green-400">
        <span class="text-xs">🎉 대량구매 할인 (30개 이상)</span>
        <span class="text-xs">-25%</span>
      </div>
    `;
  } else if (itemDiscounts.length > 0) {
    itemDiscounts.forEach((item) => {
      html += `
        <div class="flex justify-between text-sm tracking-wide text-green-400">
          <span class="text-xs">${item.name} (10개↑)</span>
          <span class="text-xs">-${item.discount}%</span>
        </div>
      `;
    });
  }

  if (isTuesdayDay() && finalTotal > 0) {
    html += `
      <div class="flex justify-between text-sm tracking-wide text-purple-400">
        <span class="text-xs">🌟 화요일 추가 할인</span>
        <span class="text-xs">-10%</span>
      </div>
    `;
  }

  return html;
};

// 요약 상세 정보 업데이트
const updateSummaryDetails = (elements, subtotal, itemDiscounts, finalTotal) => {
  if (!elements.summaryDetails) return;

  elements.summaryDetails.innerHTML = '';

  if (subtotal > 0) {
    // 상품별 정보
    elements.summaryDetails.innerHTML += generateProductItemsHTML();

    // 소계
    elements.summaryDetails.innerHTML += `
      <div class="border-t border-white/10 my-3"></div>
      <div class="flex justify-between text-sm tracking-wide">
        <span>Subtotal</span>
        <span>₩${subtotal.toLocaleString()}</span>
      </div>
    `;

    // 할인 정보
    elements.summaryDetails.innerHTML += generateDiscountHTML(itemDiscounts, finalTotal);

    // 배송 정보
    elements.summaryDetails.innerHTML += `
      <div class="flex justify-between text-sm tracking-wide text-gray-400">
        <span>Shipping</span>
        <span>Free</span>
      </div>
    `;
  }
};

// 총액 표시 업데이트
const updateTotalDisplay = (elements, finalTotal) => {
  const totalDiv = elements.cartTotal.querySelector('.text-2xl');
  if (totalDiv) {
    totalDiv.textContent = `₩${Math.round(finalTotal).toLocaleString()}`;
  }
};

// 할인 정보 표시 업데이트
const updateDiscountInfo = (elements, subtotal, finalTotal, discountRate) => {
  if (!elements.discountInfo) return;

  elements.discountInfo.innerHTML = '';

  if (discountRate > 0 && finalTotal > 0) {
    const savedAmount = subtotal - finalTotal;
    elements.discountInfo.innerHTML = `
      <div class="bg-green-500/20 rounded-lg p-3">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs uppercase tracking-wide text-green-400">총 할인율</span>
          <span class="text-sm font-medium text-green-400">${(discountRate * 100).toFixed(1)}%</span>
        </div>
        <div class="text-2xs text-gray-300">₩${Math.round(savedAmount).toLocaleString()} 할인되었습니다</div>
      </div>
    `;
  }
};

// 화요일 특별 할인 배너 업데이트
const updateTuesdaySpecialBanner = (elements, finalTotal) => {
  if (elements.tuesdaySpecial) {
    if (isTuesdayDay() && finalTotal > 0) {
      elements.tuesdaySpecial.classList.remove('hidden');
    } else {
      elements.tuesdaySpecial.classList.add('hidden');
    }
  }
};

// 장바구니 UI 업데이트
const updateCartUI = (cartState) => {
  const { subtotal, itemDiscounts, totalAmount: finalTotal, discountRate } = cartState;
  const elements = initializeCachedElements();

  updateItemCountDisplay(elements);
  updateSummaryDetails(elements, subtotal, itemDiscounts, finalTotal);
  updateTotalDisplay(elements, finalTotal);
  updateDiscountInfo(elements, subtotal, finalTotal, discountRate);
  updateTuesdaySpecialBanner(elements, finalTotal);
};

// 포인트 표시 업데이트
const updatePointsDisplay = () => {
  const elements = initializeCachedElements();
  if (!elements.loyaltyPoints) return;

  if (cartDisplay.children.length === 0) {
    elements.loyaltyPoints.style.display = 'none';
    return;
  }

  // DOM 요소를 배열 형태로 변환
  const cartItems = Array.from(cartDisplay.children).map((item) => ({
    productId: item.id,
    quantity: parseInt(item.querySelector('.quantity-number').textContent),
  }));

  const { finalPoints, pointsDetail } = calculateAllPoints(totalAmount, cartItems, itemCount);

  if (finalPoints > 0) {
    elements.loyaltyPoints.innerHTML = `
      <div>적립 포인트: <span class="font-bold">${finalPoints}p</span></div>
      <div class="text-2xs opacity-70 mt-1">${pointsDetail.join(', ')}</div>
    `;
    elements.loyaltyPoints.style.display = 'block';
  } else {
    elements.loyaltyPoints.textContent = '적립 포인트: 0p';
    elements.loyaltyPoints.style.display = 'block';
  }
};

// 재고 정보 업데이트
const updateStockInfo = () => {
  const stockMessage = getStockStatusMessage(productList);
  stockInfo.textContent = stockMessage;
};

// 장바구니 내 가격 업데이트
export const updatePricesInCart = () => {
  const cartItems = cartDisplay.children;

  for (let i = 0; i < cartItems.length; i++) {
    const cartItem = cartItems[i];
    const product = productList.find((p) => p.id === cartItem.id);

    if (product) {
      const priceDiv = cartItem.querySelector('.text-lg');
      const nameDiv = cartItem.querySelector('h3');

      if (product.onSale && product.suggestSale) {
        priceDiv.innerHTML = `<span class="line-through text-gray-400">₩${product.originalValue.toLocaleString()}</span> <span class="text-purple-600">₩${product.value.toLocaleString()}</span>`;
        nameDiv.textContent = `⚡💝${product.name}`;
      } else if (product.onSale) {
        priceDiv.innerHTML = `<span class="line-through text-gray-400">₩${product.originalValue.toLocaleString()}</span> <span class="text-red-500">₩${product.value.toLocaleString()}</span>`;
        nameDiv.textContent = `⚡${product.name}`;
      } else if (product.suggestSale) {
        priceDiv.innerHTML = `<span class="line-through text-gray-400">₩${product.originalValue.toLocaleString()}</span> <span class="text-blue-500">₩${product.value.toLocaleString()}</span>`;
        nameDiv.textContent = `💝${product.name}`;
      } else {
        priceDiv.textContent = `₩${product.value.toLocaleString()}`;
        nameDiv.textContent = product.name;
      }
    }
  }

  calculateCart();
};
