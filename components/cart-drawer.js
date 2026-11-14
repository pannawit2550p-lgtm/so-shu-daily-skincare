(function(){
  "use strict";
  customElements.define("so-shu-cart-drawer",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;this.dataset.mounted="true";
      this.innerHTML='<dialog class="cart" id="cartDialog" aria-labelledby="cartTitle">'+
        '<div class="cart__panel">'+
          '<header class="cart__head"><div><p class="cart__eyebrow cap">SO-SHU · DAILY SKINCARE</p><h2 id="cartTitle"><span data-i18n="yourBag">Your bag</span> <span id="cartTitleCount">(0)</span></h2></div><button class="cart__close" id="cartClose" type="button" aria-label="Close bag" data-i18n-aria-label="closeBag">×</button></header>'+ 
          '<p class="cart__status" id="cartStatus" role="status" aria-live="polite"></p>'+
          '<label class="cart__search" id="cartSearch"><span class="cart__search-icon" aria-hidden="true"></span><input id="cartSearchInput" type="search" autocomplete="off" placeholder="Search your bag" data-i18n-placeholder="searchBag" aria-label="Search products in your bag" data-i18n-aria-label="searchAria"></label>'+ 
          '<p class="cart__search-empty" id="cartSearchEmpty" hidden data-i18n="noMatches">No matching products</p>'+ 
          '<div class="cart__items" id="cartItems"></div>'+ 
          '<section class="cart__totals" id="cartTotals" aria-label="Order totals" data-i18n-aria-label="orderTotals">'+
            '<div><span data-i18n="subtotal">Subtotal</span><strong id="cartSubtotal">฿0</strong></div>'+ 
            '<div id="cartDiscountRow"><span data-i18n="routineDiscount">Routine set discount</span><strong id="cartDiscount">−฿0</strong></div>'+ 
            '<div class="cart__total"><span data-i18n="total">Total</span><strong id="cartTotal">฿0</strong></div>'+ 
            '<p class="cart__note" data-i18n="cartNote">Inventory is not connected yet. Orders are saved for manual confirmation; payment is not processed here.</p>'+ 
          '</section>'+
          '<button class="cart__checkout" id="cartCheckout" type="button" data-i18n="continueCheckout">Continue to checkout</button>'+ 
          '<form class="checkout" id="checkoutForm" hidden novalidate>'+ 
            '<h3 data-i18n="deliveryDetails">Delivery details</h3><p class="checkout__hint" data-i18n="deliveryHint">We’ll use these details to confirm your order and delivery.</p>'+ 
            '<label><span data-i18n="fullName">Full name</span><input name="name" autocomplete="name" maxlength="120" required aria-describedby="error-name"><small class="checkout__error" id="error-name" data-error-for="name" role="alert"></small></label>'+ 
            '<div class="checkout__row"><label><span data-i18n="email">Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required aria-describedby="error-email"><small class="checkout__error" id="error-email" data-error-for="email" role="alert"></small></label><label><span data-i18n="phone">Phone</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="10" required aria-describedby="error-phone"><small class="checkout__error" id="error-phone" data-error-for="phone" role="alert"></small></label></div>'+ 
            '<label><span data-i18n="address">Address</span><input name="address" autocomplete="street-address" maxlength="500" required aria-describedby="error-address"><small class="checkout__error" id="error-address" data-error-for="address" role="alert"></small></label>'+ 
            '<div class="checkout__row"><label><span data-i18n="province">Province</span><div class="checkout__search-control"><input name="provinceSearch" type="text" list="provinceOptions" autocomplete="address-level1" placeholder="Search province" data-i18n-placeholder="searchProvince" aria-describedby="error-province" aria-controls="provinceOptions"><datalist id="provinceOptions"></datalist><i aria-hidden="true"></i></div><select class="checkout__native-select" name="province" autocomplete="address-level1" required tabindex="-1" aria-hidden="true"><option value="">Select province</option></select><small class="checkout__error" id="error-province" data-error-for="province" role="alert"></small></label><label><span data-i18n="district">District</span><div class="checkout__search-control"><input name="districtSearch" type="text" list="districtOptions" autocomplete="address-level3" placeholder="Select province first" data-i18n-placeholder="selectProvinceFirst" aria-describedby="error-district" aria-controls="districtOptions" disabled><datalist id="districtOptions"></datalist><i aria-hidden="true"></i></div><select class="checkout__native-select" name="district" autocomplete="address-level3" required tabindex="-1" aria-hidden="true"><option value="">Select district</option></select><input name="districtManual" class="checkout__district-manual" autocomplete="address-level3" maxlength="100" placeholder="Enter district" data-i18n-placeholder="enterDistrict" hidden><small class="checkout__error" id="error-district" data-error-for="district" role="alert"></small></label></div>'+ 
            '<label><span data-i18n="postalCode">Postal code</span><input name="postalCode" inputmode="numeric" autocomplete="postal-code" pattern="[0-9]{5}" maxlength="5" required aria-describedby="error-postalCode"><small class="checkout__error" id="error-postalCode" data-error-for="postalCode" role="alert"></small></label>'+ 
            '<label class="checkout__consent"><input name="consent" type="checkbox" required aria-describedby="error-consent"><span><span data-i18n="consent">I agree that SO-SHU may use these details to fulfil this order.</span> <a href="#privacyPolicy" id="privacyPolicyLink" data-i18n="privacyNotice">Privacy notice</a><small class="checkout__error" id="error-consent" data-error-for="consent" role="alert"></small></span></label>'+ 
            '<details class="checkout__policy" id="privacyPolicy"><summary data-i18n="privacyNotice">Privacy notice</summary><p data-i18n="privacyDemo">Demo notice: contact and delivery details are used to follow up on this order request. Replace this text with the brand’s approved PDPA privacy notice before collecting customer information.</p></details>'+ 
            '<p class="cart__note" data-i18n="noPayment">No payment is taken. We’ll confirm stock and payment separately.</p>'+ 
            '<button class="cart__checkout" id="placeOrder" type="submit"><span data-i18n="placeOrder">Place order request</span><span id="checkoutTotal">฿0</span></button>'+ 
            '<button class="checkout__back" id="checkoutBack" type="button" data-i18n="backToBag">Back to bag</button>'+ 
          '</form>'+
          '<section class="cart__confirmation" id="cartConfirmation" aria-live="polite" hidden></section>'+
        '</div>'+
      '</dialog>';
    }
  });
})();
