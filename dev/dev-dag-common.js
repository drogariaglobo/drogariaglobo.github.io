(function () {

    try {

        let Common = {
            init: () => {
                Common.applyTotalPriceMinicartHeader();
                Common.applyOrionCart();
                Common.applyClickEventsHeaderComponents();
                // Common.applySlickInHeaderInformations();
                Common.applyStorefrontQuantity();
                Common.applyStorefrontFlags();
                Common.applySlickShelfs();
            },
            windowOnload: () => {},
            ajaxStop: () => { },
            applyOrionCart: () => {
                $.OrionCart({
                    buyButton: {
                        product: {
                            element: ".product-right__addToCart"
                        }
                    },
                    buttons: {
                        menu: {
                            btnOpen: ".header-minicart",
                            infoQtt: ".header-minicart-quantity-value"
                        },
                        close: {
                            apply: true
                        },
                        continue: {
                            apply: true,
                            text: "Continuar Comprando"
                        },
                        closeOverlay: {
                            apply: true
                        },
                        finish: {
                            text: "Finalizar Compra"
                        }
                    },
                    fixHeight: {
                        apply: true,
                        height: 298
                    }
                });
            },
            applyStorefrontFlags: () => {
                let wrapper = $(".dag-shelf-wrapper li[layout]");
                wrapper.each(function () {
                    let $t = $(this);
                    if ($t.find(".flags-seals-green .product_field_31").length) {
                        if ($t.find(".flags-seals-green .product_field_31 li").text().length > 0) {
                            let text = $t.find(".flags-seals-green li").text();
                            $t.find(".flags-seals-green").text(text);
                            $t.find(".flags-seals-green").removeClass("flags-default");
                        }
                    }

                    if ($t.find(".flags-seals-percent").length) {
                        if ($t.find(".flags-seals-percent").text().length > 0) {
                            $t.find(".flags-seals-percent").removeClass("flags-default");
                        }
                    }

                });
            },
            applyTotalPriceMinicartHeader: () => {
                let verify = setInterval(function () {
                    if (vtexjs && vtexjs.checkout && vtexjs.checkout.orderForm) {
                        clearInterval(verify);
                        let of = vtexjs.checkout.orderForm;
                        if (of.value && of.value == 0) {
                            $(".header-minicart-total").text("R$ 0");
                        } else if (of.value && of.value != 0) {
                            let price = of.value / 100;
                            price = price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});
                            $(".header-minicart-total").text(price);
                        }
                    }
                }, 50);

                $(window).on('orderFormUpdated.vtex', function(evt, orderForm) {
                    if (orderForm.value == 0) {
                        $(".header-minicart-total").text("R$ 0");
                    } else if (orderForm.value != null && orderForm.value != 0) {
                        let price = orderForm.value / 100;
                        price = price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'});
                        $(".header-minicart-total").text(price);
                    } 
                })
            },
            applySlickInHeaderInformations: () => {
                let wrapperInfos = $("#dag-header-list-infos");
                wrapperInfos.slick({
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: true,
                    variableWidth: false,
                    autoplay: true,
                    autoplaySpeed: 3000
                });

                wrapperInfos.each(function () {
                    let $t = $(this);
                    $t.find('.slick-arrow').wrapAll("<div class='slick-nav' />");
                });
            },
            applyClickEventsHeaderComponents: () => {

                // Header
                let actionsButtons = $(".middle.actions button");
                actionsButtons.on("click", function (e) {
                    e.preventDefault();

                    let $t = $(this);
                    // $t.siblings("ul").slideToggle("fast");
                    $t.toggleClass("active");
                    $t.siblings("ul").toggleClass("active");
                });

                // Header
                let btnPromootionClose = $("#dag-btn-close-promotion");
                btnPromootionClose.on("click", function (e) {
                    e.preventDefault();

                    $(".dag-header.promotion").hide();
                });

                if ($(window).width() < 991) {
                    let btnInstitucionalTitle = $(".dag-footer.content .list-institutional h3, .dag-footer.content .securitys h3");
                    btnInstitucionalTitle.on("click", function (e) {
                        e.preventDefault();

                        let $t = $(this);
                        $t.toggleClass("rotate");
                        $t.next().slideToggle();
                    })
                }
            },
            applyStorefrontQuantity: () => {
                
                function addEventsInQttButtons () {
                    let btnMinus = $(".dag-storefront-qtt-btn.minus");
                    let btnMore = $(".dag-storefront-qtt-btn.more");
                    let btnCart = $(".dag-storefront-btn-buybutton");
    
                    // Botão dim -
                    btnMinus.on("click", function (e) {
                        e.preventDefault();
    
                        let $t = $(this);
                        let inputQtt = $t.next();
                        if (inputQtt.val() == 1) {
                            return;
                        }
    
                        inputQtt.val(parseInt(inputQtt.val()) - 1)
                    });
    
                    // Botão add +
                    btnMore.on("click", function (e) {
                        e.preventDefault();
    
                        let $t = $(this);
                        let inputQtt = $t.prev();
                        inputQtt.val(parseInt(inputQtt.val()) + 1);
                    });
    
                    // Botão Add cart
                    btnCart.on("click", function (e) {
                        e.preventDefault();
    
                        let $t = $(this);
                        let qttElem = $t.parent().parent().find(".dag-storefront-pbm-quantity");
    
                        let itemToAdd = {
                            id: $(this).attr("sku-id"),
                            quantity: parseInt(qttElem.val()),
                            seller: "1"
                        }
    
                        vtexjs.checkout.addToCart([itemToAdd], null, 1).done(function(orderForm) {
                            $(document.body).addClass("orion-cart-on");
                        });
                    });
                }
                addEventsInQttButtons();

                $(window).on("hashchange", function(e) {
                    if (window.location.hash != "") {
                        setTimeout(function () {
                            addEventsInQttButtons();
                        }, 2000);
                    }
                });
            },
            applySlickShelfs: () => {
                console.log("DDEV DAG COMMON");
                let wrapper = $(".dag-shelf-wrapper > ul");
                wrapper.slick({
                    slidesToShow: 4,
                    slidesToScroll: 4,
                    infinite: true,
                    arrows: true,
                    responsive: [{
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 3,
                            arrows: false
                        }
                    }, {
                        breakpoint: 767,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2,
                            arrows: false
                        }
                    }]
                })

                // let wrapper = $(".dag-shelf.with-slick > div > ul");
                // wrapper.slick({
                //     slidesToShow: 4,
                //     slidesToScroll: 1,
                //     infinite: true,
                //     variableWidth: false,
                //     autoplay: false,
                //     dots: true
                // });
                // wrapperInfos.each(function () {
                //     let $t = $(this);
                //     $t.find('.slick-arrow').wrapAll("<div class='slick-nav' />");
                // });

                // let wrapper = $(".dag-shelf-wrapper > ul");
                // wrapper.slick({
                //     slidesToShow: 4,
                //     slidesToScroll: 4,
                //     // lazyLoad: 'ondemand',
                //     infinite: true,
                //     arrows: true,
                //     dots: true,
                //     responsive: [{
                //         breakpoint: 1024,
                //         settings: {
                //             slidesToShow: 3,
                //             slidesToScroll: 3,
                //             arrows: false
                //         }
                //     }, {
                //         breakpoint: 767,
                //         settings: {
                //             slidesToShow: 2,
                //             slidesToScroll: 2,
                //             arrows: false
                //         }
                //     }]
                // })
            }
        };

        // Instanciando a funcao
        $(document).ready(Common.init);
        let windowLoad = function () {
            Common.windowOnload();
        };
        $(window).load(windowLoad);
        $(document).ajaxStop(Common.ajaxStop);

    } catch (e) {
        console.log("Erro na instância do [Common]: ", e);
    }

})();
