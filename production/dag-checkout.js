$(document).ajaxComplete(function () {
	var cupom = $('#cart-link-coupon-add');
	cupom.trigger('click');
})

function cepFromStorage() {
	const cep = localStorage.getItem('stored-cep');
	if (cep) {
		setTimeout(() => {
			const $openButton = document.querySelector(
				'#shipping-preview-container button#shipping-calculate-link'
			)
			$openButton && $openButton.click();
		}, 3000)

		let done = false;
		const observer = new MutationObserver(() => {
			const $input = document.querySelector('input#ship-postalCode');
			const $sendButton = document.querySelector('button#cart-shipping-calculate');
			if (!done && $input && $sendButton) {
				done = true

				$input.value = cep
				$input.addEventListener('focus', (e) => {
					if ($input.value == '') {
						$input.value = cep
					}
				})

				$input.addEventListener('blur', (e) => {
					if ($input.value == '') {
						$input.value = cep
					}
				})
			}
		})

		observer.observe(document, {
			subtree: true,
			attributes: true,
			characterData: true,
			childList: true
		})
	}
}
cepFromStorage();


// Script Orion
var DagCheckout = {
    init: function () {
        DagCheckout.applyWhenTriggeredTableItems();
        DagCheckout.applyTagInProductsInitPBM();
        // DagCheckout.removePBMproductWhenRemovedCart();
    },
    windowOnload: function () {
        DagCheckout.applyTagInProductsLoadPBM();
    },
    applyWhenTriggeredTableItems: function () {
        $(window).on("attachmentUpdated.vtex", function () {
            // Escondendo qtt
            DagCheckout.applyConfigsInProductPBMlisted();
        })
    },
    applyTagInProductsInitPBM: function () {
        let verify = setInterval(() => {
            if ($(".table.cart-items .product-item td.quantity").length) {
                clearInterval(verify);
                
                // Escondendo qtt
                DagCheckout.applyConfigsInProductPBMlisted();
            }
        }, 50)
    },
    applyTagInProductsLoadPBM: function () {
        // Escondendo qtt
        DagCheckout.applyConfigsInProductPBMlisted();
    },
    applyConfigsInProductPBMlisted: function () {
        if (localStorage.getItem("dagCartPBM")) {
            let prodPBM = JSON.parse(localStorage.getItem("dagCurrentProductPBM"));
            let findSku = vtexjs.checkout.orderForm.items.find(item => {
                return item.productId == prodPBM.id;
            });

            let skuId = findSku.id;
            let skuQtt = findSku.quantity;
            let wrapperItems = $(".table.cart-items .product-item");
            wrapperItems.each(function (index) {
                let $t = $(this);
                if ($t.attr("data-sku") == skuId) {
                    // Info
                    DagCheckout.applyInfoDiscountPBM($t);

                    // Quantidade
                    DagCheckout.lockQuanity($t, skuQtt);

                    // Aply Especial Remove
                    DagCheckout.applyRemoveElement($t, index);
                }
            });

            DagCheckout.applyRemoveEvent();
        }
    },
    applyInfoDiscountPBM: function (thisElement) {
        let wrapper = thisElement.find(".product-name > .brand");
        wrapper.html('<span class="pbm-info-discount">Desconto PBM aplicado</span>')
    },
    lockQuanity: function (thisElement, skuQtt) {
        let block = $(`<span>${skuQtt}</span>`);
        thisElement.find("td.quantity").html(block);
    },
    removePBMproductWhenRemovedCart: function () {
        $(document).on("click", ".item-link-remove", function (e) {
            e.preventDefault();

            if ($(e.target).is(".item-link-remove")) {

                localStorage.removeItem("dagCartPBM");
                localStorage.removeItem("dagCartPBM_expiration");

                localStorage.removeItem("dagCurrentProductPBM");
                localStorage.removeItem("dagCurrentProductPBM_expiration");

                localStorage.removeItem("dagCurrentDiscountActivatedSeted");
                localStorage.removeItem("dagCurrentDiscountActivatedSeted_expiration");
            }
        });
    },
    applyRemoveElement: function (thisElement, ix) {
        let blockRemove = `<button class="mal-checkout-remove-pbm" data-index="${ix}"></button>`;
        thisElement.find(".item-remove").html($(blockRemove));
    },
    applyRemoveEvent: function () {
        let btnRemove = $(".mal-checkout-remove-pbm");
        btnRemove.on("click", function (e) {
            e.preventDefault();

            let $t = $(this);
            let dataIndex = $t.attr("data-index");

            vtexjs.checkout.getOrderForm().then(function(orderForm) {
                let itemsToRemove = [
                    {
                        index: dataIndex,
                        quantity: 0,
                    }
                ]
                return vtexjs.checkout.removeItems(itemsToRemove);
            })
            .done(function(orderForm) {
                localStorage.removeItem("dagCartPBM");
                localStorage.removeItem("dagCartPBM_expiration");

                localStorage.removeItem("dagCurrentProductPBM");
                localStorage.removeItem("dagCurrentProductPBM_expiration");

                localStorage.removeItem("dagCurrentDiscountActivatedSeted");
                localStorage.removeItem("dagCurrentDiscountActivatedSeted_expiration");
            });
        });
    }
}

DagCheckout.init();
let windowLoad = function () {
    DagCheckout.windowOnload();
};
$(window).load(windowLoad);