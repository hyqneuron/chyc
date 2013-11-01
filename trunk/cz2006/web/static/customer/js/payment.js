// convenience functions
function id(n) {return document.getElementById(n);}
function ja(o) {alert(JSON.stringify(o));}
function sh(o,n,h){return $(o).find("."+n).html(h);}
function fia(array, key, value){
    for(i in array)
        if (array[i][key]==value)
            return array[i];
    return null;
}

var tmplCartItem;
var tmplOption;
var tmplCartItem;

var dataMgr;
var loginMgr;
var uiMgr;


// lowercase prefix 'c' means "cache"
var cCanteens;


// Initialize environment when page loads
// we need to determine which canteen we're doing it for
// we can store this info in cookie
$(document).ready(function(){
    // initialize managers
    dataMgr = new DataManager();
    uiMgr = new UIManager();
    loginMgr = new LoginManager();
    // initialize data
    dataMgr.InitTemplates();
    dataMgr.InitData();
    // init UI
    uiMgr.InitEvents();
    // login check
    loginMgr.InitialLoginCheck();
});

function DataManager(){
    this.Cart=[];
    this.InitTemplates = function(){
        tmplOption = $("#optionTMPL").clone().attr("id","");
        tmplCartItem=$("#CartItemTMPL").clone().attr("id","");
    };

    this.getCanteenID=function(){
        var cookie = document.cookie;
        // we prefix id with azxd
        if(cookie.indexOf("azxd")!=0)
            return null;
        // return the part after azxd as ID number
        return parseInt(cookie.substring(4));
    };
    this.setCanteenID=function(id){
        document.cookie = "azxd"+id;
    };
    this.clearCanteenID=function(){
        document.cookie = "";
    };
    this.InitData = function(){
        // grab canteen id from cookie
        var cookie = document.cookie;

    };
    // our cart has n items, each has a parent=cart_item, and a
    // children=[menu_item]
    // we leave the details to dataMgr to handle
    this.getCICount = function(){
        return dataMgr.Cart.length;
    };
    this.getCI = function(idx){
        return dataMgr.Cart[idx].parent;
    };
    this.getMI = function(idx){
        return dataMgr.Cart[idx].children[0];
    };
    this.getMIPrice = function(idx){
        return dataMgr.calcMIPrice(dataMgr.getMI(idx));
    };
    this.calcMIPrice = function(item){
        return parseFloat(item.price * item.promotion).toFixed(2);
    };
}

function LoginManager(){
    this.customer=null;       // the customer we are serving
    this.canteen=null;        // the canteen this payment machine is located
    this.stalls=null;         // the stalls inside our current canteen
    this.barcode="";          // barcode used for login

    // check if cookie has canteen, if yes show customer barcode login
    // else show OFS setting page
    this.InitialLoginCheck = function(){
        var canID = dataMgr.getCanteenID();
        if(canID) {
            // get canteen data and update UI
            loginMgr.InitializeForCanteen(canID);
            uiMgr.ShowLogin();
        }
        else{
            uiMgr.ShowSetting();
            // load all canteens and put in setting page
            int_get_canteen_activated({}, function(data){
                cCanteens = data.content;
                uiMgr.SettingShowCanteens(data.content);
            });
        }
    };
    // when we know which canteen we're working for, call this to grab canteen
    // data, and set up UI
    this.InitializeForCanteen=function(id){
        // if data is cached, just ask UI to update
        if(cCanteens){
            loginMgr.canteen = fia(cCanteens, "id", id);
            uiMgr.InitializeForCanteen(loginMgr.canteen);
            // now grab canteen's stalls
            int_get_stall_in_canteen({canteenid:id}, function(data){
                loginMgr.stalls = data.content;
            });
        }
        // else grab data first, then call this function again
        else{
            int_get_canteen_activated({}, function(data){
                cCanteens = data.content;
                loginMgr.InitializeForCanteen(id);
            });
        }
    };
    this.LoginKeyDown = function(e){
        // if this is not a number, not lower case alphabet, not upper case, we
        // return
        if(e.which==13){
            loginMgr.DoLogin();
            loginMgr.barcode="";
            uiMgr.UpdateBarcode();
            return;
        }
        else if((e.which< 48 || e.which>57) &&
            (e.which<65 || e.which>90) &&
            (e.which<97 || e.which>122))
            return;
        loginMgr.barcode += String.fromCharCode(e.which);
        uiMgr.UpdateBarcode();
    };
    this.DoLogin = function(){
        int_login_payment({barcode: loginMgr.barcode}, loginMgr.PassLogin);
    };
    this.PassLogin=function(data){
        loginMgr.customer=data.content;
        uiMgr.ShowPayment();
        uiMgr.UpdateBalance();
        // grab cart items and show them
        int_cus_get_cart({}, function(data){
            dataMgr.Cart = data.content;
            uiMgr.UpdateCart();
        });
    };
    this.Logout = function(){
        int_logout({}, function(data){
            loginMgr.customer=null;
            dataMgr.Cart=[];
            // clear UI
            uiMgr.ShowLogin();
        });
    };
}
function UIManager(){
    this.PageLogin = $("#PageLogin");
    this.PagePayment = $("#PagePay");
    this.PageSetting = $("#PageSetting");
    this.SettingSelect=$("#SettingSelect");
    this.CIContainer = $("#CartItemContainer");
    this.LoginBarcode= $("#LoginBarcode");

    this.HideAllSinglePage = function(){
        $(".SinglePage").hide();
    };
    this.ShowLogin = function(){
        uiMgr.HideAllSinglePage();
        uiMgr.PageLogin.show().focus();
    };
    this.ShowPayment=function(){
        uiMgr.HideAllSinglePage();
        uiMgr.PagePayment.show();
    };
    this.ShowSetting=function(){
        uiMgr.HideAllSinglePage();
        uiMgr.PageSetting.show();
    };

    this.UpdateBalance = function(){
        $("#PayBalance").html("$"+loginMgr.customer.balance);
    };

    this.UpdateBarcode = function(){
        uiMgr.LoginBarcode.html(loginMgr.barcode);
    };

    this.ClearBarcode= function(){
        loginMgr.barcode="";
        uiMgr.UpdateBarcode();
    };

    // ================payment UI================================
    // redraw the cart table according to content of dataMgr.cart
    this.UpdateCart = function(){
        uiMgr.CIContainer.empty();
        var total = 0;
        $("#PayUser").html(loginMgr.customer.username);
        if(dataMgr.getCICount()==0){
            $("#PayEmptyMsg").show();
            $("#CartTable").hide();
            $("#PayTotalMsg").hide();
            return;
        }
        $("#PayEmptyMsg").hide();
        $("#CartTable").show();
        $("#PayTotalMsg").show();
        for(var i = 0; i<dataMgr.getCICount(); i++){
            // we show an item only if it is in our current canteen
            // that is, if it's stall is inside our canteen
            if(!fia(loginMgr.stalls, "id", dataMgr.getMI(i).stall))
                continue;
            uiMgr.CIContainer.append(NewCartItem(dataMgr.getCI(i), dataMgr.getMI(i)));
            total += dataMgr.getCI(i).quantity* dataMgr.getMIPrice(i);
        }
        $("#PayTotal").html("$"+total);
    };
    this.Pay = function(){
        if(dataMgr.getCICount()==0){
            uiMgr.Alert("You cannot pay as you have no items in this canteen.");
            return;
        }
        // validate that nothing is unavailable
        for(var i = 0; i<dataMgr.getCICount(); i++){
            if(dataMgr.getMI(i).is_available_online==false){
                uiMgr.Alert("Dish "+dataMgr.getMI(i).name+" can only be ordered at the physical stall. Payment cannot proceed.");
                return;
            }
            if(dataMgr.getMI(i).is_available==false){
                uiMgr.Alert("Dish "+dataMgr.getMI(i).name+" is not currently available. Payment cannot proceed.");
                return;
            }
        }
        int_cus_pay_canteen({canteenid: loginMgr.canteen.id}, function(data){
            // succcess
            uiMgr.Alert(data.err_msg);
            loginMgr.Logout();
        }, function(data){
            // partial failure or complete failure
            uiMgr.Alert(data.err_msg);
            loginMgr.Logout();
        });
    };

    // ================settings UI============================

    // show canteens in setting dropdown list
    this.SettingShowCanteens = function(canteens){
        uiMgr.SettingSelect.empty();
        // add an invalid option for confirmation
        uiMgr.SettingSelect.append(NewCanteenOption({id:-1, name:"Please choose a canteen"}));
        for(var i = 0; i<canteens.length; i++){
            uiMgr.SettingSelect.append(NewCanteenOption(canteens[i]));
        }
    };

    // confirm button on setting page. set this machine to the chosen canteen
    this.SettingConfirmCanteen = function(){
        var id = uiMgr.SettingSelect.val();
        // validate user has chosen a canteen option
        if(id==-1){
            uiMgr.Alert("Please choose a valid canteen");
            return;
        }
        dataMgr.setCanteenID(id);
        // ask login mgr to load canteen info
        loginMgr.InitializeForCanteen(id);
        uiMgr.ShowLogin();
    };
    // initialize UI for canteen
    this.InitializeForCanteen=function(canobj){
        $("#LoginCanteenName").html("Payment at "+canobj.name);
        $("#PayCanName").html(canobj.name);
    };
    // this function looks for ctrl-m to reset canteen
    this.keyDownForM = function(e){
        if(e.ctrlKey) {
            dataMgr.clearCanteenID();
            uiMgr.SettingShowCanteens(cCanteens);
            uiMgr.ShowSetting();
        }
    };
    this.Alert=function(msg){
        alert(msg);
    };
    this.InitEvents = function(){
        $("#SettingConfirm").click(this.SettingConfirmCanteen);
        $("#PageLogin").keypress(loginMgr.LoginKeyDown);
        // this handles canteen reset, look for ctrl-m
        $(document).keypress("m", this.keyDownForM);
        // temporary barcode login method
        $("#LoginButClear").click(uiMgr.ClearBarcode);
        $("#LoginButLogin").click(loginMgr.DoLogin);
        // buttons on payment page
        $("#PayButPay").click(uiMgr.Pay);
        $("#PayButLogout").click(loginMgr.Logout);
    };
}

function copykeys(target, tocopy){
    for ( key in tocopy)
        target[key] = tocopy[key];
}

function NewCanteenOption(canobj){
    var res = tmplOption.clone();
    res.val(canobj.id);
    res.html(canobj.name);
    return res;
}

function NewCartItem(ciobj, miobj){
    var res = tmplCartItem.clone();
    res.MI = miobj;
    copykeys(res, ciobj);   
    res.find(".CIName").html(miobj.name);
    res.find(".CIPrice").html("$"+dataMgr.calcMIPrice(miobj));
    res.find(".CIQuantity").html(ciobj.quantity);
    res.find(".CIStall").html(fia(loginMgr.stalls, "id", miobj.stall).name);
    return res;
}
