(function () {

    try {
        // 291.476.200-30
        let Register = {
            init: () => {
                Register.getUserInfo();
                Register.applyValidate();
                Register.applyMaksInFields();
                Register.saveFormData();
                Register.applyFixCheckbox();
            },
            windowOnload: () => {},
            ajaxStop: () => {},
            dataUser: {
                id: null // Register.dataUser.id
            },
            getUserInfo: () => {
                if (!localStorage.getItem("dagUserCPF")) {
                    return;
                }

                let cpf = localStorage.getItem("dagUserCPF");
                if (localStorage.getItem("dagUserCard")) {
                    $("#inputCard").val(localStorage.getItem("dagUserCard"));
                }

                $.ajax({
                    type: "GET",
                    url: "/api/dataentities/FU/search?cpf="+cpf+"&_fields=allinfos&an=drogariaglobo",
                    dataType: "json",
                    contentType: "application/json",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/vnd.vtex.ds.v10+json"
                    }
                }).done(function (response) {
                    if (response && response[0]) {
                        Register.dataUser.id = response[0].id;
                        let dataForm = JSON.parse(response[0].allinfos);
                        for (field in dataForm) {
                            if (dataForm[field] != "" && dataForm[field] != null) {

                                $(`input[name="${field}"]`).val(dataForm[field]);

                                if (field == "genre") {
                                    $('select[name="genre"]').val(dataForm[field]);
                                }
                                if (field == "estadoregistro") {
                                    $('select[name="estadoregistro"]').val(dataForm[field]);
                                }
                                if (field == "stateCode") {
                                    $('select[name="stateCode"]').val(dataForm[field]);
                                }
                                if (field == "tiporegistro") {
                                    $('select[name="tiporegistro"]').val(dataForm[field]);
                                }
                                if (field == "addressType") {
                                    $('select[name="addressType"]').val(dataForm[field]);
                                }

                                if (field == "addressType") {
                                    $('select[name="addressType"]').val(dataForm[field]);
                                }
                                
                                if (field == "acceptCalls") {
                                    $('input[name="acceptCalls"]').attr("checked", true)
                                }

                                if (field == "acceptSMS") {
                                    $('input[name="acceptSMS"]').attr("checked", true)
                                }

                                if (field == "acceptEmail") {
                                    $('input[name="acceptEmail"]').attr("checked", true)
                                }

                                if (field == "acceptMail") {
                                    $('input[name="acceptMail"]').attr("checked", true)
                                }

                                if (field == "acceptInformativeMaterial") {
                                    $('input[name="acceptInformativeMaterial"]').attr("checked", true)
                                }
                                
                            }
                        }
                        localStorage.setItem("dagUserForm", JSON.stringify(dataForm));
                    }
                });
            },
            applyMaksInFields: () => {
                // Placeholder
                const pc = { 
                    birthdate: "__/__/____",
                    cpf: "___.___.___-__",
                    cep: "_____-___"
                }

                $("#inputDataNascimento").mask("00/00/0000", { placeholder: pc.birthdate } );
                $("#inputCpf").mask("000.000.000-00", { placeholder: pc.cpf });
                $("#inputCep").mask("00000-000", { placeholder: pc.cep });
            },
            saveFormData: () => {
                if (!localStorage.getItem("dagUserForm")) {
                    return;
                }

                let formFields = JSON.parse(localStorage.getItem("dagUserForm"));
                for (field in formFields) {
                    if (formFields[field] != "" && formFields[field] != null) {
                        $(`input[name="${field}"]`).val(formFields[field]);

                        if (field == "genre") {
                            $('select[name="genre"]').val(formFields[field]);
                        }

                        if (field == "estadoregistro") {
                            $('select[name="estadoregistro"]').val(formFields[field]);
                        }

                        if (field == "stateCode") {
                            $('select[name="stateCode"]').val(formFields[field]);
                        }

                        if (field == "tiporegistro") {
                            $('select[name="tiporegistro"]').val(formFields[field]);
                        }

                        if (field == "addressType") {
                            $('select[name="addressType"]').val(formFields[field]);
                        }
                        
                    }
                }
            },
            applyValidate: () => {
                let form = $("#dag-form-program-register");
                Register.setValidateConfigs(form);
                
                form.on("submit", async function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!localStorage.getItem("dagCentralNumber")) {
                        alert("Central number não localizado, volte de aceite nos termos.");
                        return;
                    }

                    if (form[0].checkValidity()) {
                        Register.loading();
                        
                        let dataForm = form.serializeObject();

                        if (dataForm.holderId.match(/[^\w\s]/g)) {
                            dataForm.holderId = dataForm.holderId.replace(/[^\w\s]/g, "");
                        }

                        let cardNumber = "";
                        if (localStorage.getItem("dagUserCard")) {
                            console.log("Existe Cupom");
                            cardNumber = localStorage.getItem("dagUserCard");
                        }

                        // Organizando dados em geral
                        let extraData = {
                            cardId: dataForm.cardId || "", 
                            cardIdCompany: null,
                            idCompany: null,
                            cardIdOperator: null,
                            idOperator: null,
                            acceptTerm: "S",
                            acceptEmail: (dataForm.acceptEmail && dataForm.acceptEmail == "on") ? "S" : "N",
                            acceptMail: (dataForm.acceptMail && dataForm.acceptMail == "on") ? "S" : "N",
                            acceptSMS: (dataForm.acceptSMS && dataForm.acceptSMS == "on") ? "S" : "N",
                            acceptInformativeMaterial: (dataForm.acceptInformativeMaterial && dataForm.acceptInformativeMaterial == "on") ? "S" : "N",
                            acceptCalls: (dataForm.acceptCalls && dataForm.acceptCalls == "on") ? "S" : "N"
                        }
                        dataForm = { ...dataForm, ...extraData };

                        localStorage.setItem("dagUserForm", JSON.stringify(dataForm));

                        // Organizando dados do master data
                        let dataToMd = {
                            email: dataForm.email,
                            cpf: dataForm.holderId,
                            allinfos: JSON.stringify(dataForm)
                        }

                        // Passando os dados do Médico
                        let dataDoctor = {
                            type: dataForm.tiporegistro,
                            id: dataForm.numeroregistroconselho,
                            stateCode: dataForm.estadoregistro,
                            name: dataForm.nomeprofissional
                        }

                        // Validação se tem um produto consultado
                        if (!orionLocalStorage.getItem("dagCurrentProductPBM")) {
                            swal({
                                title: "Atenção! Consulte pelo menos 1 produto para realizar o seu cadastro.",
                                icon: "warning",
                                closeOnClickOutside: false
                            }).then(() => {
                                console.log(respMD);
                            });
                            return;
                        }

                        // Passando o produto atual
                        let currentProduct = JSON.parse(localStorage.getItem("dagCurrentProductPBM"));
                        let dataProd = {
                            id: currentProduct.id,
                            EAN: currentProduct.EAN,
                            requestQuantity: currentProduct.requestedQuantity
                        }

                        // Preparando o body da request final
                        let dataToInterplayers = {
                            currentCentralNumber: localStorage.getItem("dagCentralNumber"),
                            consumer: dataForm,
                            product: [ dataProd ],
                            healthProfessional: dataDoctor
                        }

                        // Limpando dados não usados
                        delete dataToInterplayers.consumer.tiporegistro;
                        delete dataToInterplayers.consumer.nomeprofissional;
                        delete dataToInterplayers.consumer.numeroregistroconselho;
                        delete dataToInterplayers.consumer.estadoregistro;

                        // Disparo para o MD
                        if (Register.dataUser.id == null) {
                            const respMD = await Register.sendDataToMD(dataToMd);
                            if (!respMD.DocumentId) {
                                swal({
                                    title: "Problemas ao salvar os dados na base de dados.",
                                    icon: "warning",
                                    closeOnClickOutside: false
                                });
                                return;
                            }
                        } else {
                            const respMD = await Register.updateDataToMD(dataToMd);
                            if (!respMD.DocumentId) {
                                swal({
                                    title: "Problemas ao salvar os dados na base de dados.",
                                    icon: "warning",
                                    closeOnClickOutside: false
                                });
                                return;
                            }
                        }

                        // Disparo para Interplayers
                        const respActiveCostumer = await Register.sendDataInterplayers(dataToInterplayers);
                        if (
                            respActiveCostumer.process && 
                            respActiveCostumer.process.error &&
                            respActiveCostumer.process.error[0] &&
                            respActiveCostumer.process.error[0].returnCode
                        ) {
                            Register.showErrorMessages(respActiveCostumer.process.error[0]);
                            return;
                        }

                        if (respActiveCostumer.returnCode == "N000") {
                            // Removendo o Central number e redirecionando de volta pro produto
                            localStorage.removeItem("dagCentralNumber");
                            let urlToProduct = localStorage.getItem("dagUrlProductRegister");
                            localStorage.removeItem("dagUrlProductRegister");

                            // Salvando info para já vir a consulta
                            localStorage.setItem("dagProductRegistered", true);
                            swal({
                                title: "Cadastro realizado com sucesso!",
                                text: "Agora você pode visualizar os descontos dos produtos.",
                                icon: "success",
                                closeOnClickOutside: false
                            }).then(() => {
                                window.location.pathname = urlToProduct;
                            });
                        }
                    }

                });
            },
            setValidateConfigs: (form) => {
                form.validate({ 
                    rules: {
                        holderId: {
                            required: true
                        },
                        cardId: {
                            required: localStorage.getItem("dagUserCard") ? true : false
                        },
                        birthdate: {
                            required: true
                        },
                        name: {
                            required: true
                        },
                        genre: {
                            required: true
                        },
                        postalCode: {
                            required: true
                        },
                        stateCode: {
                            required: true
                        },
                        cityName: {
                            required: true
                        },
                        streetAddress: {
                            required: true
                        },
                        addressNumber: {
                            required: true
                        },
                        cellphone: {
                            required: true
                        },
                        phone: {
                            required: true
                        },
                        email: {
                            required: true
                        },
                        cityRegion: {
                            required: true
                        },
                        addressType: {
                            required: true
                        }
                    }
                });
            },
            sendDataToMD: (dataJson) => {
                const configs = {
                    type: "POST", 
                    url: "https://dev-dag-heroku-middleware.herokuapp.com/middleware/v1/info-user",
                    data: dataJson
                }
                return $.ajax(configs);
            },
            updateDataToMD: (dataJson) => {
                const configs = {
                    type: "PATCH", 
                    url: "https://dev-dag-heroku-middleware.herokuapp.com/middleware/v1/update-info-user",
                    data: dataJson
                }
                return $.ajax(configs);
            },
            sendDataInterplayers: (dataJson) => {
                const configs = {
                    type: "POST",
                    url: "https://dev-dag-heroku-middleware.herokuapp.com/middleware/v1/active-customer",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/vnd.vtex.ds.v10+json",
                    },
                    data: JSON.stringify(dataJson)
                }
                return $.ajax(configs);
            },
            formatBooleanInputsValues: (dataBol) => {
                if (dataBol.acceptEmail == "on") {
                    dataBol.acceptEmail = "S";
                } else {
                    dataBol.acceptEmail = "N";
                }

                if (dataBol.acceptSMS == "on") {
                    dataBol.acceptSMS = "S";
                } else {
                    dataBol.acceptSMS = "N";
                }

                if (dataBol.acceptCalls == "on") {
                    dataBol.acceptCalls = "S";
                } else {
                    dataBol.acceptCalls = "N";
                }

                if (dataBol.acceptInformativeMaterial == "on") {
                    dataBol.acceptInformativeMaterial = "S";
                } else {
                    dataBol.acceptInformativeMaterial = "N";
                }

                if (dataBol.acceptMail == "on") {
                    dataBol.acceptMail = "S";
                } else {
                    dataBol.acceptMail = "N";
                }
            },
            showErrorMessages: (respError) => {
                if (respError.returnCode == "TD14") {
                    swal({
                        title: "Atenção",
                        text: "E-mail já cadastrado para outro usuário do programa, tente outro e-mail.",
                        icon: "warning",
                        closeOnClickOutside: false
                    }).then(() => {
                        $("#inputEmail").val();
                    });
                } else if (respError.returnCode == "Q285") {
                    swal({
                        title: "Atenção",
                        text: "Número da central não localizado é necessario voce aceitar os termos.",
                        icon: "warning",
                        closeOnClickOutside: false
                    });
                }
            },
            applyFixCheckbox: () => {
                $(".form-check input").on("click", function (e) {
                    e.stopPropagation();
                });
                $(".block-button-submit button").on("click", function (e) {
                    e.stopPropagation();
                });
            },
            // Loader
            loading: () => { 
                swal({ // Register.loading();
                    icon: "https://drogariaglobo.vteximg.com.br/arquivos/drogariaglobo-loading-modal.gif",
                    title: "Aguarda, efetuando seu cadastro...",
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
        $(document).ready(Register.init);
        let windowLoad = function () {
            Register.windowOnload();
        };
        $(window).load(windowLoad);
        $(document).ajaxStop(Register.ajaxStop);
        
    } catch (e) {
        console.log("Erro na instância do [Register]: ", e);
    }

})();