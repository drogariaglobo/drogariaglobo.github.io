(function () {

    try {
        console.log("[DAG] - Product - Development Script.");
        const middleware = 'https://dev-dag-heroku-middleware.herokuapp.com';
        let PBMproduct = {
            init: () => {
                PBMproduct.setAvailableBodyClass();
                PBMproduct.enableShipping();

                PBMproduct.applyMaskCPF();
                PBMproduct.verifyStatusDiscount(); 
                PBMproduct.getProductData();
                PBMproduct.pbmAllEvents();
                PBMproduct.closeAcceptModal();
                PBMproduct.applySelectedDiscount();
                PBMproduct.removeDiscountApplied();
                PBMproduct.applyDefaultsBuybutton();
            },
            windowOnload: () => {},
            ajaxStop: () => {},
            pbmCurrentProductOn: null,
            pbmSpecData: null,
            pbmTypeField: null,
            routes: {
                prodData: "/api/catalog_system/pub/products/search/?fq=productId:",
                getListDiscounts: `${middleware}/middleware/v1/prices-discounts`,
                getCart: `${middleware}/middleware/v1/cart`,
                changePrice: `${middleware}/middleware/v1/change-price-vtex`
            },
            setAvailableBodyClass: () => {
                function checkVisibleNotify(available) {
                    if (available)
                        $(document.body)
                            .addClass('dag-product-available')
                            .removeClass('dag-product-unavailable');
                    else
                        $(document.body)
                            .addClass('dag-product-unavailable')
                            .removeClass('dag-product-available');
                }

                $(document).on('skuSelected.vtex', function (e, id, sku) {
                    checkVisibleNotify(sku.available);
                });

                checkVisibleNotify(skuJson.available);
            },
            enableShipping: () => {
                if (typeof window.ShippingValue === 'function') window.ShippingValue();
            },
            verifyStatusDiscount: () => {
                if (localStorage.getItem("dagProductRegistered")) {
                    console.info("\n[PBM] - Registro feito. Buscando descontos...\n");
                    $(".pbm-standard-discount").removeClass("standard-discount-on");
                    PBMproduct.consultDiscountIntegrationAfterRegister();
                } else {
                    if (orionLocalStorage.getItem("dagCurrentCart")) {
                        let currentCart = JSON.parse(localStorage.getItem("dagCurrentCart"));
                        let findProduct = currentCart.consultList.find(item => {
                            return item.id == skuJson.productId;
                        });
                        if (findProduct) {
                            $(".product-right__buy-button").hide();
                            $(".dag-product.pbm").removeAttr("style");
                            $(".pbm-standard-discount").removeClass("standard-discount-on");
                            $(".pbm-discount-activated").addClass("discount-activated-on");
                            PBMproduct.pbmCurrentProductOn = true;
                            PBMproduct.lockingDefaultBuyButtons();
                        } else {
                            $(".dag-product.pbm").removeAttr("style");
                            $(".pbm-standard-discount").addClass("standard-discount-on");
                        }
                    }
                }
            },
            // Dados do produto
            getProductData: async () => {
                let respProdData = await PBMproduct.requestProductData();
                PBMproduct.data = respProdData[0];
                PBMproduct.checkingIfHasPBM(PBMproduct.data);
            },
            // Verificando se faz parte do PBM
            checkingIfHasPBM: (prodData) => {
                let id = skuJson.productId;
                if (prodData.productId == id) {
                    if (prodData.productPbmOn && prodData.productPbmOn && prodData.productPbmOn == 'S') {
                        if (!prodData.formattedPrice || !prodData.standardPrice) {
                            console.info("\n[PBM] - Produto sem os preços base.\n");
                            $(".dag-product.pbm").hide();
                            return;
                        }
                        console.info("\n[PBM] - Este produto faz parte do PBM!\n");
                        let comOffer = prodData.items[0].sellers[0].commertialOffer;
    
                        // Salvando todas especificaoes relacionadas ao PBM
                        PBMproduct.pbmSpecData = { 
                            requestHolderId: prodData.requestHolderId[0],
                            productPbmOn: prodData.productPbmOn[0],
                            requestCoupon: prodData.requestCoupon[0],
                            ean: prodData.items[0].ean,
                            eanCombos: JSON.parse(prodData.eanCombos[0]),
                            industryName: prodData.industryName[0],
                            todayTableId: prodData.todayTableId[0],
                            formattedPrice: prodData.formattedPrice[0],
                            standardPrice: prodData.standardPrice[0],
                            listPrice: comOffer.ListPrice.toFixed(2),
                            netPrice: comOffer.PriceWithoutDiscount.toFixed(2),
                            baseListPrice: comOffer.ListPrice.toFixed(2).toString().replace(".", ""), 
                            baseNetPrice: comOffer.PriceWithoutDiscount.toFixed(2).toString().replace(".", ""),
                            discountType: prodData.discountType[0],
                            quantity: comOffer.AvailableQuantity,
                            seller: prodData.items[0].sellers[0].sellerId
                        } // PBMproduct.pbmSpecData.baseNetPrice

                        localStorage.setItem("dagDataProduct", JSON.stringify(PBMproduct.pbmSpecData));
    
                        if (
                            PBMproduct.pbmSpecData.requestHolderId == "M" && 
                            PBMproduct.pbmSpecData.requestCoupon == "O"
                        ) {
                            PBMproduct.pbmTypeField = 1;
                            if (localStorage.getItem("dagUserCPF")) {
                                let cpf = localStorage.getItem("dagUserCPF");
                                $("#pbm-first-rule-cpf").val(cpf);
                            }
                        } else if (
                            PBMproduct.pbmSpecData.requestHolderId == "M" && 
                            PBMproduct.pbmSpecData.requestCoupon == "M"
                        ) {
                            PBMproduct.pbmTypeField = 2;
                            if (localStorage.getItem("dagUserCPF")) {
                                let cpf = localStorage.getItem("dagUserCPF");
                                $("#pbm-second-rule-cpf").val(cpf);
                            }
                            if (localStorage.getItem("dagUserCard")) {
                                let card = localStorage.getItem("dagUserCard");
                                $(".pbm-card-field").val(card);
                            }
                        } else if (
                            PBMproduct.pbmSpecData.requestHolderId == "X" && 
                            PBMproduct.pbmSpecData.requestCoupon == "M"
                        ) {
                            PBMproduct.pbmTypeField = 3;
                            if (localStorage.getItem("dagUserCard")) {
                                let card = localStorage.getItem("dagUserCard");
                                $(".pbm-card-field").val(card);
                            }
                        }
                        
                        if (PBMproduct.pbmCurrentProductOn == true) {
                            $(".pbm-prod-price").text(PBMproduct.pbmSpecData.standardPrice);
                            $(".pbm-prod-discount-activated-text").text(PBMproduct.pbmSpecData.industryName);
                            $(".dag-product.pbm").removeAttr("style");
                            // $(".pbm-standard-discount").addClass("standard-discount-on");
                        } else {
                            $(".pbm-prod-price").text(PBMproduct.pbmSpecData.standardPrice);
                            $(".pbm-prod-discount-activated-text").text(PBMproduct.pbmSpecData.industryName);
                            $(".dag-product.pbm").removeAttr("style");
                            $(".pbm-standard-discount").addClass("standard-discount-on");
                        }

                    } else {
                        // Salvando todas especificaoes relacionadas ao PBM
                        let comOffer = prodData.items[0].sellers[0].commertialOffer;
                        PBMproduct.pbmSpecData = { 
                            ean: prodData.items[0].ean,
                            quantity: comOffer.AvailableQuantity,
                            seller: prodData.items[0].sellers[0].sellerId
                        } 

                        console.info("\n[PBM] - Produto não faz parte do PBM.\n");
                        $(".dag-product.pbm").hide();
                    }
                } 
            },
            pbmAllEvents: () => {
                // Botão Desconto Padrão
                let btnDefaultDiscount = $(".pbm-standard-discount");
                btnDefaultDiscount.on("click", function (e) {
                    e.preventDefault();

                    if (PBMproduct.pbmTypeField == 1) {
                        PBMproduct.pbmFront.showDefaultDiscount.hide()
                        $(".pbm-first-rule").addClass("pbm-first-rule-on");
                    } 
                    else if (PBMproduct.pbmTypeField == 2) {
                        PBMproduct.pbmFront.showDefaultDiscount.hide()
                        $(".pbm-second-rule").addClass("pbm-second-rule-on");
                    } 
                    else if (PBMproduct.pbmTypeField == 3) {
                        PBMproduct.pbmFront.showDefaultDiscount.hide()
                        $(".pbm-third-rule").addClass("pbm-third-rule-on");
                    }

                });

                // Botão remover desconto
                let btnRemoveDiscount = $(".pbm-list-discounts-finded--remove");
                btnRemoveDiscount.on("click", function (e) {
                    e.preventDefault();

                    $(".pbm-cpf-field").val('');
                    if (PBMproduct.pbmTypeField == 1) {
                        PBMproduct.pbmFront.showRules.hideFirstRule();
                    } 
                    else if (PBMproduct.pbmTypeField == 2) {
                        PBMproduct.pbmFront.showRules.hideSecondRule();
                    } 
                    else if (PBMproduct.pbmTypeField == 3) {
                        PBMproduct.pbmFront.showRules.hideThirdRule();
                    }

                    PBMproduct.pbmFront.showListDiscountsPrices.hide();
                    PBMproduct.pbmFront.showDefaultDiscount.show();
                });

                // Consulta desconto
                let pbmAddButton = $(".pbm-add-button");
                pbmAddButton.on("click", function (e) {
                    e.preventDefault();

                    let CPF = null;
                    let CARD = null;
                    if (PBMproduct.pbmTypeField == 1) {
                        CPF = $("#pbm-first-rule-cpf").val();

                        if (CPF.length < 11) { // 14
                            alert("CPF Incompleto. [1]");
                            return;
                        }
                        localStorage.removeItem("dagUserCard");
                        if (localStorage.getItem("dagUserForm")) {
                            let updateForm = JSON.parse(localStorage.getItem("dagUserForm"));
                            updateForm.cardId = "";
                            window.orionLocalStorage.setItem("dagCurrentProductPBM", JSON.stringify(updateForm), 120);
                        }
                        PBMproduct.pbmFront.showRules.hideFirstRule();
                    } 
                    else if (PBMproduct.pbmTypeField == 2) {
                        CPF = $("#pbm-second-rule-cpf").val();
                        CARD = $("#pbm-second-rule-card").val();

                        if (CPF.length < 11) { // 14
                            alert("CPF Incompleto. [2]");
                            return;
                        }
                        if (CARD.length == 0) {
                            alert("O Nº do cartão é obrigatório. [1]");
                            return;
                        }
                        
                        PBMproduct.pbmFront.showRules.hideSecondRule();
                    } 
                    else if (PBMproduct.pbmTypeField == 3) {
                        CARD = $("#pbm-third-rule-card").val();
                        if (CARD.length == 0) {
                            alert("O Nº do cartão é obrigatório. [2]");
                            return;
                        }
                        localStorage.removeItem("dagUserCPF");
                        PBMproduct.pbmFront.showRules.hideThirdRule();
                    }

                    PBMproduct.pbmFront.showLoading.show();

                    // CPF = CPF.replace(/[^\w\s]/g, "");
                    if (CPF) {
                        if (CPF.match(/[^\w\s]/g)) {
                            CPF = CPF.replace(/[^\w\s]/g, "");
                            window.orionLocalStorage.setItem("dagUserCPF", CPF, 120);
                        } else {
                            window.orionLocalStorage.setItem("dagUserCPF", CPF, 120);
                        }
                    }
                    if (CARD) {
                        window.orionLocalStorage.setItem("dagUserCard", CARD, 120);
                    }
                    if (localStorage.getItem("dagUserForm")) {
                        let formFields = JSON.parse(localStorage.getItem("dagUserForm"));
                        if (formFields.holderId != CPF) {
                            formFields.holderId = CPF;
                        }
                        localStorage.setItem("dagUserForm", JSON.stringify(formFields));
                    }

                    let prodInfo = {
                        id: PBMproduct.data.productId,
                        skuId: skuJson.skus[0].sku,
                        packId: 0,
                        EAN: PBMproduct.data.items[0].ean,
                        requestedQuantity: 1,
                        pricesOriginal: {
                            listPrice: PBMproduct.pbmSpecData.listPrice,
                            netPrice: PBMproduct.pbmSpecData.netPrice,
                        },
                        pricesFormatted: {
                            listPrice: PBMproduct.pbmSpecData.baseListPrice,
                            netPrice: PBMproduct.pbmSpecData.baseNetPrice,
                        },
                        discountType: PBMproduct.pbmSpecData.discountType,
                        tableId: PBMproduct.pbmSpecData.todayTableId
                    }

                    window.orionLocalStorage.setItem("dagCurrentProductPBM", JSON.stringify(prodInfo), 120);
                    PBMproduct.consultDiscountIntegration(CPF, CARD, prodInfo);

                });

            },
            // Fazendo consulta
            consultDiscountIntegration: async (CPF, CARD, prodInfo) => {
                // Body da requests
                let bodyRequest = {
                    cpf: CPF,
                    card: CARD,
                    product: prodInfo
                }

                let respConsult = await PBMproduct.requestListDiscounts(bodyRequest);

                // Trativas
                PBMproduct.respConsultDiscountCases(respConsult);
            },
            // Fazendo pós cadastro
            consultDiscountIntegrationAfterRegister: async () => {
                let dataProduct = localStorage.getItem("dagCurrentProductPBM");
                let productToConsult = JSON.parse(dataProduct);

                // Body da requests
                let bodyRequest = {
                    cpf: localStorage.getItem("dagUserCPF") || null,
                    card: localStorage.getItem("dagUserCard") || null,
                    product: productToConsult
                }
                localStorage.removeItem("dagProductRegistered");
                let respConsult = await PBMproduct.requestListDiscounts(bodyRequest);   

                // Trativas
                PBMproduct.respConsultDiscountCases(respConsult);
            },
            respConsultDiscountCases: (respConsult) => {
                // [1] - Aceitar termo de adesão
                if (respConsult.responseCode == "H119" || respConsult.responseCode == "H120") {
                    PBMproduct.pbmFront.showLoading.hide();
                    let info = {
                        url: respConsult.urlTerms,
                        text: respConsult.message
                    }
                    PBMproduct.showAcceptTermsModal(info);
                }
                // [2] - Cadastro do consumidor
                else if (
                    respConsult.responseCode == "Q291" || 
                    respConsult.responseCode == "Q292" || 
                    respConsult.responseCode == "Q293" || 
                    respConsult.responseCode == "Q294" || 
                    respConsult.responseCode == "Q295"
                ) {
                    PBMproduct.pbmFront.showLoading.hide();
                    // Salvando o central number
                    localStorage.setItem("dagCentralNumber", respConsult.centralNumber);
                    swal({
                        title: "Termos aceitos!",
                        text: respConsult.message,
                        icon: "success",
                        closeOnClickOutside: false
                    }).then(() => {
                        window.location.pathname = '/cadastro-programa';
                    });
                }
                else if (respConsult.responseCode == "H127") {
                    PBMproduct.pbmFront.showLoading.hide();
                    swal({
                        title: "Atenção",
                        text: "Este canal não permite adesão. Faça a adesão através do 0800 707 1080 ou www.valemaissaude.com.br.",
                        icon: "warning",
                        closeOnClickOutside: false
                    }).then(() => {
                        window.location.reload();
                    });
                }
                else if (respConsult.responseCode == "N000") {
                    PBMproduct.renderListDiscountsPrices(respConsult.listPrices);

                    PBMproduct.pbmFront.showLoading.hide();
                    PBMproduct.pbmFront.showListDiscountsPrices.show();
                } 
                else if (respConsult.responseCode == "W003") {
                    PBMproduct.renderListDiscountsPrices(respConsult.listPrices);

                    PBMproduct.pbmFront.showLoading.hide();
                    PBMproduct.pbmFront.showListDiscountsPrices.show();
                }
                else if (respConsult.responseCode == "F803") {
                    PBMproduct.pbmFront.showLoading.hide();
                    swal({
                        title: "Atenção",
                        text: respConsult.message,
                        icon: "warning",
                        closeOnClickOutside: false
                    }).then(() => {
                        window.location.reload();
                    });
                } 
                else if (respConsult.responseCode == "Q027") {
                    PBMproduct.pbmFront.showLoading.hide();
                    swal({
                        title: "Atenção",
                        text: respConsult.message,
                        icon: "warning",
                        closeOnClickOutside: false
                    }).then(() => {
                        window.location.reload();
                    });
                }
                else if (respConsult.responseCode == "Q710") {
                    PBMproduct.pbmFront.showLoading.hide();
                    swal({
                        title: "Atenção",
                        text: respConsult.message,
                        icon: "warning",
                        closeOnClickOutside: false
                    }).then(() => {
                        window.location.reload();
                    });
                }
                else if (respConsult.responseCode == "Q542") {
                    PBMproduct.pbmFront.showLoading.hide();
                    swal({
                        title: "Atenção",
                        text: respConsult.message,
                        icon: "warning",
                        closeOnClickOutside: false
                    }).then(() => {
                        window.location.reload();
                    });
                }
                else if (respConsult && respConsult.interplayersError) {
                    PBMproduct.interplayersErrors(respConsult);
                }
            },
            // Montando a lista de desconto
            renderListDiscountsPrices: (listPrices) => {
                let wrapper = $(".pbm-list-discounts-prices-wrapper");
                let wrapperInfo = $(".pbm-list-discounts-finded--value");
                let wrapperCurrentValue = $(".pbm-list-discounts-current-price--value");
                let listElements = '';
                let findDiscount = false;
                listPrices.forEach(function (item) {
                    if (item.discountValue == "0") {
                        findDiscount = true;
                    }
                    let block = `
                        <div class="pbm-list-discounts-prices" data-price="${item.price}" data-price-interger="${item.priceInteger}" data-quantity="${item.quantity}">
                            <span class="pbm-list-discounts-prices--check"></span>
                            <span class="pbm-list-discounts-prices--unity">${item.quantity} UN.</span>
                            <span class="pbm-list-discounts-prices--value">${item.priceFormatted}</span>
                        </div>`;
                    listElements += block;
                });
                if (listPrices.length == 1) {
                    wrapperInfo.text(`${listPrices.length} desconto`);
                } else {
                    wrapperInfo.text(`${listPrices.length} descontos`);
                }
                let vtexValue = $(".skuBestPrice").text();
                wrapperCurrentValue.text(vtexValue);
                wrapper.html(listElements);

                if (findDiscount == true) {
                    $(".pbm-description-title").text("Desconto da loja");
                    $(".pbm-description-text").text("Melhor desconto da loja aplicado.");
                }

                PBMproduct.applySelectFieldsDiscounts();
            },
            applySelectFieldsDiscounts: () => {
                let btnBlockPrices = $(".pbm-list-discounts-prices-wrapper .pbm-list-discounts-prices");
                btnBlockPrices.on("click", function (e) {
                    e.preventDefault();

                    let $t = $(this);
                    $t.siblings().removeClass('price-discount-selected');
                    $t.addClass("price-discount-selected");
                });
            },
            // Aplica o desconto e muda o preço
            applySelectedDiscount: () => {
                // 133.104.070-12
                let btnApplySelectedDiscount = $("#pbm-btn-apply-discount");
                btnApplySelectedDiscount.on("click", async function (e) {
                    e.preventDefault();

                    if (!$(".pbm-list-discounts-prices-wrapper .pbm-list-discounts-prices").is(".price-discount-selected")) {
                        alert("Atenção! Você deve selecionar um produto com desconto.");
                        return;
                    }

                    PBMproduct.pbmFront.showListDiscountsPrices.hide();
                    PBMproduct.pbmFront.showLoading.show();

                    let discountSelected = $(".pbm-list-discounts-prices.price-discount-selected");
                    let selectedPrice = discountSelected.attr("data-price-interger");
                    let selectedProductQtt = discountSelected.attr("data-quantity");
                    let currentProduct = localStorage.getItem("dagCurrentProductPBM");
                    currentProduct = JSON.parse(currentProduct);

                    // Setando a quantidade
                    currentProduct.requestedQuantity = selectedProductQtt;

                    let verifyMaxQtt = $(".pbm-list-discounts-prices").last();
                    verifyMaxQtt = verifyMaxQtt.attr("data-quantity");
                    if (PBMproduct.pbmSpecData.quantity < currentProduct.requestedQuantity) {
                        selectedProductQtt = PBMproduct.pbmSpecData.quantity;
                        currentProduct.requestedQuantity = PBMproduct.pbmSpecData.quantity;
                        alert(`Alerta! A quantidade do produto dentro da loja é menor que a quantidade selecionada. Será adicionado a quantidade disponivel do produto ao seu carrinho. Quantidade: ${PBMproduct.pbmSpecData.quantity}.`);
                    }

                    let listCartProduts = [];
                    if (!orionLocalStorage.getItem("dagCurrentCart")) {
                        listCartProduts.push(currentProduct);
                    } else {
                        let interCart = JSON.parse(localStorage.getItem("dagCurrentCart"));
                        listCartProduts = interCart.consultList;
                        listCartProduts.push(currentProduct);
                    }

                    // Body da request
                    let bodyRequest = {
                        cpf: localStorage.getItem("dagUserCPF") || null,
                        card: localStorage.getItem("dagUserCard") || null,
                        consultList: listCartProduts,
                        tableId: PBMproduct.pbmSpecData.todayTableId,
                        orderFormId: vtexjs.checkout.orderForm.orderFormId,
                        sc: vtexjs.checkout.orderForm.salesChannel
                    }
                    
                    // Resposta API carrinho Interplayers
                    const respCart = await PBMproduct.requestSendProductCart(bodyRequest);

                    // Sucesso ao colocar o produto no carrinho
                    if (respCart.returnCode == "N000" || respCart.returnCode == "W809") {
                        if (listCartProduts.length == 1) {
                            console.log("1 Produto adicionado.");
                            let dataCart = { 
                                cpf: localStorage.getItem("dagUserCPF") || null,
                                card: localStorage.getItem("dagUserCard") || null,
                                consultList: listCartProduts,
                                responseCart: respCart
                            }
                            window.orionLocalStorage.setItem("dagCurrentCart", JSON.stringify(dataCart), 120);
                            window.orionLocalStorage.setItem("dagCurrentProductPBM", JSON.stringify(currentProduct), 120);
                            let dataParam = {
                                id: currentProduct.id,
                                qtt: selectedProductQtt,
                                price: selectedPrice
                            }
                            try {
                                PBMproduct.addProductInCartPBM(dataParam);
                            } catch(e) {
                                console.log("Erro ao adicionar o produto ao carrinho");
                                console.log(e.message);
                                window.location.reload();
                            }
                        } 
                        else if (listCartProduts.length > 1) {
                            let findLimitedProduct = respCart.product.filter(item => {
                                return item.status == 41;
                            });

                            // Cenario: Consumidor atingiu o limite de compra
                            if (findLimitedProduct && findLimitedProduct.length) {
                                console.log("Produto com saldo limite localizado!");
                                let updateListProducts = [];
                                listCartProduts.forEach(item => {
                                    if (parseInt(item.id) != findLimitedProduct[0].id) {
                                        updateListProducts.push(item);
                                    }
                                });
                                let dataCart = { 
                                    cpf: localStorage.getItem("dagUserCPF") || null,
                                    card: localStorage.getItem("dagUserCard") || null,
                                    consultList: updateListProducts,
                                    responseCart: respCart
                                }

                                window.orionLocalStorage.setItem("dagCurrentCart", JSON.stringify(dataCart), 120);
                                window.orionLocalStorage.setItem("dagCurrentProductPBM", JSON.stringify(currentProduct), 120);

                                try {
                                    PBMproduct.addProductInCartDefault(selectedProductQtt);
                                } catch(e) {
                                    console.log("Erro ao adicionar o produto ao carrinho.");
                                    console.log(e.message);
                                    window.location.reload();
                                }

                            } else {
                                // Product Com Combo!
                                if (typeof PBMproduct.pbmSpecData.eanCombos.listCombos == "object") {
                                    console.log("CARRINHO COM DESCONTO COMBO!");
                                    
                                    // Verificando se tem comobo
                                    let findThisProduct = listCartProduts.find(item => {
                                        return parseInt(item.id) != skuJson.productId;
                                    });
                                    
                                    let eanFindeded = PBMproduct.pbmSpecData.eanCombos.listCombos.find(item => {
                                        return item == findThisProduct.EAN;
                                    });

                                    if (eanFindeded) {
    
                                        let findEanRespCart = respCart.product.find(item => {
                                            return item.ean == PBMproduct.pbmSpecData.ean;
                                        });

                                        let newPrice = PBMproduct.pbmSpecData.baseNetPrice - findEanRespCart.discountValue;
                                        let dcValue = findEanRespCart.discountPercentual / 100;

                                        let dataCart = { 
                                            cpf: localStorage.getItem("dagUserCPF") || null,
                                            card: localStorage.getItem("dagUserCard") || null,
                                            consultList: listCartProduts,
                                            responseCart: respCart
                                        }   
        
                                        window.orionLocalStorage.setItem("dagCurrentCart", JSON.stringify(dataCart), 120);
                                        window.orionLocalStorage.setItem("dagCurrentProductPBM", JSON.stringify(currentProduct), 120);
                                        
                                        let dataParam = {
                                            id: currentProduct.id,
                                            qtt: selectedProductQtt,
                                            price: newPrice
                                        }
                                        alert(`Surpresa! Esse produto possui desconto combo, voce ganhará um desconto de ${dcValue}% nele nesta compra.`)
                                        try {
                                            PBMproduct.addProductInCartPBM(dataParam);
                                        } catch(e) {
                                            console.log("Erro ao adicionar o produto ao carrinho");
                                            console.log(e.message);
                                            window.location.reload();
                                        }
                                    } else {
                                        let dataCart = { 
                                            cpf: localStorage.getItem("dagUserCPF") || null,
                                            card: localStorage.getItem("dagUserCard") || null,
                                            consultList: listCartProduts,
                                            responseCart: respCart
                                        }   
        
                                        window.orionLocalStorage.setItem("dagCurrentCart", JSON.stringify(dataCart), 120);
                                        window.orionLocalStorage.setItem("dagCurrentProductPBM", JSON.stringify(currentProduct), 120);
        
                                        let dataParam = {
                                            id: currentProduct.id,
                                            qtt: selectedProductQtt,
                                            price: selectedPrice
                                        }
                                        try {
                                            PBMproduct.addProductInCartPBM(dataParam);
                                        } catch(e) {
                                            console.log("Erro ao adicionar o produto ao carrinho");
                                            console.log(e.message);
                                            window.location.reload();
                                        }
                                    }
                                } 
                                // Carrinho SEM Combo
                                else {
                                    console.log("CARRINHO NORMAL SEM COMBO!");
                                    let dataCart = { 
                                        cpf: localStorage.getItem("dagUserCPF") || null,
                                        card: localStorage.getItem("dagUserCard") || null,
                                        consultList: listCartProduts,
                                        responseCart: respCart
                                    }   
    
                                    window.orionLocalStorage.setItem("dagCurrentCart", JSON.stringify(dataCart), 120);
                                    window.orionLocalStorage.setItem("dagCurrentProductPBM", JSON.stringify(currentProduct), 120);
    
                                    let dataParam = {
                                        id: currentProduct.id,
                                        qtt: selectedProductQtt,
                                        price: selectedPrice
                                    }
                                    try {
                                        PBMproduct.addProductInCartPBM(dataParam);
                                    } catch(e) {
                                        console.log("Erro ao adicionar o produto ao carrinho");
                                        console.log(e.message);
                                        window.location.reload();
                                    }
                                }

                            }

                        }    
                    }
                    else if (respCart.responseCode == "A001" || respCart.responseCode == "QDB6" || respCart.responseCode == "A001" || respCart.responseCode == "F480" || respCart.responseCode == "F475" || respCart.responseCode == "QDB5") {
                        PBMproduct.alertError(respCart);
                    }
                    else {
                        console.log("Erro ao colocar no carrinho");
                        console.log(respCart);
                    }
                });
            },
            organizeDataForCart: (dataItemCart) => {},
            addProductInCartPBM: (dataParam) => {
                let itemToCart = {
                    id: skuJson.skus[0].sku,
                    quantity: dataParam.qtt,
                    seller: '1'
                };

                vtexjs.checkout.addToCart([itemToCart], null).done(function (newOrderForm) {
                    // Verificando se o minicart está vazio
                    if (newOrderForm.items == null || newOrderForm.items.length == 0) {
                        return;
                    }

                    // Iterando os produtos no carrinho
                    let findProduct = newOrderForm.items.find(item => {
                        return item.productId == skuJson.productId;
                    });

                    // Verificando se tem produto com desconto do PBM
                    if (!findProduct || findProduct == undefined) {
                        return;
                    }
                    
                    // Localizando o index (vai na request de change price)
                    let findIndex = newOrderForm.items.findIndex(item => {
                        return item.productId == dataParam.id;
                    });

                    // Mudando o preço
                    $.ajax({
                        type: "POST",
                        url: PBMproduct.routes.changePrice,
                        data: {
                            id: newOrderForm.orderFormId,
                            index: findIndex,
                            price: dataParam.price
                        }
                    }).done(function (data) {
                        PBMproduct.pbmFront.showLoading.hide();
                        PBMproduct.pbmFront.showLoadingComplete.show();
                        setTimeout(function () {
                            PBMproduct.pbmFront.showLoadingComplete.hide();
                            PBMproduct.pbmFront.showDiscountActivated.show();

                            setTimeout(function() {
                                window.location.reload();
                            }, 500);
                        }, 2000);
                    });
                });
            },
            addProductInCartDefault: (qtt) => {
                let itemToCart = {
                    id: skuJson.skus[0].sku,
                    quantity: qtt,
                    seller: '1'
                };
     
                vtexjs.checkout.addToCart([itemToCart], null).done(function (newOrderForm) {
                    PBMproduct.pbmFront.showLoading.hide();
                    PBMproduct.pbmFront.showLoadingComplete.show();
                    setTimeout(function () {
                        PBMproduct.pbmFront.showLoadingComplete.hide();
                        PBMproduct.pbmFront.showDiscountActivated.show();

                        setTimeout(function() {
                            window.location.reload();
                        }, 500);
                    }, 2000);
                });
            },
            addProductInCartCombo: () => {},
            applyDefaultsBuybutton: () => {
                
                let inputQtt = $(".prod-default-buybuttons.qtt");
                let btnMinus = $(".prod-default-buybuttons.minus");
                let btnMore = $(".prod-default-buybuttons.plus");
                let btnAddtoCart = $(".prod-default-buybuttons.addcart");

                setTimeout(function () {
                    if (!PBMproduct.pbmSpecData) {
                        return;
                    }
                    if (PBMproduct.pbmSpecData.quantity == 1) {
                        btnMinus.addClass("minus-limit");
                        btnMore.addClass("more-limit");
                        return;
                    }
                }, 1000);

                // Btn: Minus
                btnMinus.on("click", function (e) {
                    e.preventDefault();

                    if (inputQtt.val() == 1) {
                        $(this).addClass("minus-limit");
                        return;
                    }
                    btnMore.removeClass("more-limit");
                    let currentValue = parseInt(inputQtt.val());
                    currentValue = currentValue - 1;
                    if (currentValue == 1) {
                        $(this).addClass("minus-limit");
                    }
                    inputQtt.val(currentValue);

                });

                // Btn: More
                btnMore.on("click", function (e) {
                    e.preventDefault();
                    
                    btnMinus.removeClass("minus-limit");

                    if (PBMproduct.pbmSpecData.quantity == 1) {
                        btnMinus.addClass("minus-limit");
                        $(this).addClass("more-limit");
                        return;
                    }

                    if (inputQtt.val() == PBMproduct.pbmSpecData.quantity) {
                        $(this).addClass("more-limit");
                        return;
                    }

                    let currentValue = parseInt(inputQtt.val());
                    currentValue = currentValue + 1;

                    if (currentValue == PBMproduct.pbmSpecData.quantity) {
                        $(this).addClass("more-limit");
                    }

                    inputQtt.val(currentValue);
                    
                });

                // Btn: Cart
                btnAddtoCart.on("click", function (e) {
                    e.preventDefault();
                    let itemToAdd = {
                        id: skuJson.skus[0].sku,
                        quantity: parseInt(inputQtt.val()),
                        seller: PBMproduct.pbmSpecData.seller
                    }
                    vtexjs.checkout.addToCart([itemToAdd], null, 1).done(function(orderForm) {
                        $(document.body).addClass("orion-cart-on");
                    });
                });
                
            },
            // Modal Cadastro e Termos
            showAcceptTermsModal: (info) => {
                let iframe = `<iframe src="${info.url}"></iframe>`;
                $(".dag-terms-modal.block-terms-info").html(`<p>${info.text}</p>`);
                $(".dag-terms-modal.block-terms").html($(iframe));
                $(document.body).addClass("term-modal-on");
            },
            closeAcceptModal: () => {
                let btnCloseModal = $("#dag-btn-terms-modal-reload");
                btnCloseModal.on("click", function (e) {
                    e.preventDefault();

                    PBMproduct.makeConsultAgainAfterTerms();
                });
            },
            makeConsultAgainAfterTerms: async () => {
                $(document.body).removeClass("term-modal-on");
                PBMproduct.pbmFront.showLoading.hide();
                PBMproduct.loading();

                let prodInfo = {
                    id: PBMproduct.data.productId,
                    packId: 0,
                    EAN: PBMproduct.data.items[0].ean,
                    requestedQuantity: 1,
                    pricesOriginal: {
                        listPrice: PBMproduct.pbmSpecData.listPrice,
                        netPrice: PBMproduct.pbmSpecData.netPrice,
                    },
                    pricesFormatted: {
                        listPrice: PBMproduct.pbmSpecData.baseListPrice,
                        netPrice: PBMproduct.pbmSpecData.baseNetPrice,
                    },
                    discountType: PBMproduct.pbmSpecData.discountType,
                    tableId: PBMproduct.pbmSpecData.todayTableId
                }

                // Body da requests
                let bodyRequest = {
                    cpf: localStorage.getItem("dagUserCPF") || null,
                    card: localStorage.getItem("dagUserCard") || null,
                    product: prodInfo
                }

                let respConsult = await PBMproduct.requestListDiscounts(bodyRequest);

                if (respConsult.responseCode == "Q291" || respConsult.responseCode == "Q292" || respConsult.responseCode == "Q293" || respConsult.responseCode == "Q294" || respConsult.responseCode == "Q295" || respConsult.responseCode == "H119" || respConsult.responseCode == "H120" || respConsult.responseCode == "Q027") {
                    
                    // Salvando a URL do produto
                    localStorage.setItem("dagUrlProductRegister", window.location.pathname);

                    // Salvando o central number
                    localStorage.setItem("dagCentralNumber", respConsult.centralNumber);
                    swal({
                        title: "Termos aceitos!",
                        text: respConsult.message,
                        icon: "success",
                        closeOnClickOutside: false
                    }).then(() => {
                        window.location.pathname = '/cadastro-programa';
                    });
                } else {
                    console.log("Outro retorno!");
                    console.log(respConsult);
                    console.log(respConsult.responseCode);
                }
            },
            // Remove Desconto e Produto
            removeDiscountApplied: () => {
                // Botão remover desconto e produto ativo atual
                let btnRemoveActivated = $("#pbm-prod-btn-remove-discount");
                btnRemoveActivated.on("click", function (e) {
                    e.preventDefault();

                    PBMproduct.pbmFront.showDiscountActivated.hide();
                    PBMproduct.pbmFront.showLoading.show();
                    
                    vtexjs.checkout.getOrderForm().then(function(orderForm) {
                        let itemsToRemove = [];
                        let dataCart = JSON.parse(localStorage.getItem("dagCurrentCart"));
                        orderForm.items.forEach(item => {
                            dataCart.consultList.forEach((subItem, index) => {
                                if (item.productId == subItem.id) {
                                    itemsToRemove.push({
                                        index: index,
                                        quantity: 0
                                    });
                                }
                            });
                        });

                        return vtexjs.checkout.removeItems(itemsToRemove);
                    }).done(function(newOrderForm) {
                        // Limpando o produto do carrinho do PBM e da navegação
                        PBMproduct.clearDiscountAndCart();
                        setTimeout(function () {
                            PBMproduct.pbmFront.showLoading.hide();
                            PBMproduct.pbmFront.showDefaultDiscount.show();
                            setTimeout(function () {
                                window.location.reload();
                            }, 500);
                        }, 1000);
                    });
                });
            },
            lockingDefaultBuyButtons: () => {
                let wrapper = $(".dag-product.prod-default-buybuttons");
                wrapper.hide();
            },
            // Front functions (Show|Hide PBM elements)
            pbmFront: {
                showDefaultDiscount: {
                    show: function () { // pbmFront.showDefaultDiscount.show();
                        $(".pbm-standard-discount").addClass("standard-discount-on");
                    },
                    hide: function () { 
                        $(".pbm-standard-discount").removeClass("standard-discount-on");
                    }
                },
                showFieldCPF: {
                    show: function () { 
                        $(".pbm-document-field").addClass("document-field-on");
                    },
                    hide: function () { 
                        $(".pbm-document-field").removeClass("document-field-on");
                    }
                },
                showDiscountActivated: {
                    show: function () { 
                        $(".pbm-discount-activated").addClass("discount-activated-on");
                    },
                    hide: function () { 
                        $(".pbm-discount-activated").removeClass("discount-activated-on");
                    }
                },
                showListDiscountsPrices: {
                    show: function () { 
                        $(".pbm-list-discounts").addClass("list-discounts-on");
                    },
                    hide: function () { 
                        $(".pbm-list-discounts").removeClass("list-discounts-on");
                    }
                },
                showLoading: {
                    show: function () {
                        $(".pbm-prod-loader").addClass("pbm-loader-on");
                    },
                    hide: function () {
                        $(".pbm-prod-loader").removeClass("pbm-loader-on");
                    }
                },
                showLoadingComplete: {
                    show: function () { 
                        $(".pbm-prod-discount-applied").addClass("discount-applied-on");
                    },
                    hide: function () { 
                        $(".pbm-prod-discount-applied").removeClass("discount-applied-on");
                    }
                },
                showRules: {
                    showFirstRule: function () { // PBMproduct.pbmFront.showRules.showFirstRule();
                        $(".pbm-first-rule").addClass("pbm-first-rule-on");
                    },
                    hideFirstRule: function () { // PBMproduct.pbmFront.showRules.hideFirstRule();
                        $(".pbm-first-rule").removeClass("pbm-first-rule-on");
                    },
                    showSecondRule: function () { // PBMproduct.pbmFront.showRules.showSecondRule();
                        $(".pbm-second-rule").addClass("pbm-second-rule-on");
                    },
                    hideSecondRule: function () { // PBMproduct.pbmFront.showRules.hideSecondRule();
                        $(".pbm-second-rule").removeClass("pbm-second-rule-on");
                    },
                    showThirdRule: function () { // PBMproduct.pbmFront.showRules.showThirdRule();
                        $(".pbm-third-rule").addClass("pbm-third-rule-on");
                    },
                    hideThirdRule: function () { // PBMproduct.pbmFront.showRules.hideThirdRule();
                        $(".pbm-third-rule").removeClass("pbm-third-rule-on");
                    }
                }
            },
            // Requests
            requestProductData: () => {
                return $.ajax({
                    type: "GET",
                    url: PBMproduct.routes.prodData + skuJson.productId,
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/vnd.vtex.ds.v10+json"
                    }
                });
            },
            requestListDiscounts: (bodyRequest) => {
                return $.ajax({
                    type: "POST",
                    url: PBMproduct.routes.getListDiscounts,
                    data: bodyRequest
                });
            },
            requestSendProductCart: (bodyRequest) => {
                return $.ajax({
                    type: "POST",
                    url: PBMproduct.routes.getCart,
                    data: bodyRequest
                });
            },
            // Trativas de Erros Interplayers
            interplayersErrors: (respConsult) => {
                if (respConsult.responseCode == "Q542") {
                    PBMproduct.alertError(respConsult);
                } else if (respConsult.responseCode == "Q563") {
                    PBMproduct.alertError(respConsult);
                } else if (respConsult.responseCode == "QG43") {
                    PBMproduct.alertError(respConsult);
                }
            },
            alertError: (respConsult) => {
                PBMproduct.pbmFront.showLoading.hide();
                swal({
                    title: "Atenção",
                    text: respConsult.message,
                    icon: "warning",
                    closeOnClickOutside: false
                }).then(() => {
                    window.location.reload();
                });
            },
            // Limpa o carrinho, limpa o desconto atual
            clearDiscountAndCart: () => {
                localStorage.removeItem("dagCurrentCart");
                localStorage.removeItem("dagCurrentCart_expiration");

                localStorage.removeItem("dagCurrentProductPBM");
                localStorage.removeItem("dagCurrentProductPBM_expiration");
            },
            // Mask CPF
            applyMaskCPF: () => {
                // $("#pbm-first-rule-cpf").mask('000.000.000-00', { reverse: true });
                // $("#pbm-second-rule-cpf").mask('000.000.000-00', { reverse: true });
            },
            // Return Index Product In Order Form
            getProductIndexOrderForm: (items) => {
                if (!items) {
                    return false;
                }

                // let prodPBM = PBMproduct.getCurrentProductPBM();
                // if (!prodPBM) {
                //     return false;
                // }
                let cartList = JSON.parse(localStorage.getItem("dagCurrentCart")) || null;
                if (!cartList) {
                    return false;
                }

                // Localizando o index (vai na request de change price)
                let findIndex = items.findIndex(item => {
                    return item.productId == cartList.consultList.id;
                }); 

                if (!isNaN(findIndex)) {
                    if (findIndex == 0) {
                        return "zero"
                    } else {
                        return findIndex.toString();
                    }
                } else {
                    return "false";
                }
            },
            getCurrentProductPBM: () => {
                if (orionLocalStorage.getItem("dagCurrentProductPBM")) {
                    return JSON.parse(localStorage.getItem("dagCurrentProductPBM"));
                } else {
                    return false;
                }
            },
            // Utils
            dateConverterToBrazilTimezone: (isToCallToken) => {
                // Conversor: Adiciona + 30 minutos da data atual para a expiração do token
                let date = new Date();
                if (isToCallToken) {
                    date = new Date(date.getTime() + 30 * 60000);
                }
                var iso = date.getFullYear().toString() + "-";
                iso += (date.getMonth() + 1).toString().padStart(2, '0') + "-";
                iso += date.getDate().toString().padStart(2, '0') + "T";
                iso += date.getHours().toString().padStart(2, '0') + ":";
                iso += date.getMinutes().toString().padStart(2, '0') + ":";
                iso += date.getSeconds().toString().padStart(2, '0');

                return iso;
            },
            // Loader
            loading: () => { 
                swal({ // PBMproduct.loading();
                    icon: "https://drogariaglobo.vteximg.com.br/arquivos/drogariaglobo-loading-modal.gif",
                    title: "Aguarde enquanto processamos as informações...",
                    text: "Por favor não saia ou recarregue a página",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                    showCloseButton: false,
                    showCancelButton: false,
                    buttons: false,
                    closeOnClickOutside: false,
                    didOpen: () => {
                        Swal.showLoading()
                    }
                });
            }
        };

        // Instanciando a funcao
        $(document).ready(PBMproduct.init);
        let windowLoad = function () {
            PBMproduct.windowOnload();
        };
        $(window).load(windowLoad);
        $(document).ajaxStop(PBMproduct.ajaxStop);

    } catch (e) {
        console.log("Erro na instância do [PBMproduct]: ", e);
    }

})();
