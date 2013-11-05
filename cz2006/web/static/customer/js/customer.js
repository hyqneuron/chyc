function id(n) {return document.getElementById(n);}
function ja(o) {alert(JSON.stringify(o));}
function sh(o,n,h){return $(o).find("."+n).html(h);}
function my_fail(data){alert(data.err_msg);}

var loginMgr;
var dataMgr;
var uiMgr;
var cpMgr; // canteen page ui manager

var customer;
var cache_canteens = [];
var canFancyDIVs = [];
var cache_stalls = [];
var stallDIVs = [];
var cache_cart = [];

var tmplCanteenFancy;
var tmplCanDropItem;
var tmplCanteen;
var tmplStall;
var tmplMenuItem;
var tmplCartItem;
var tmplCanButton;
var tmplRemarkEditor;

var canSlideTime=600;
var stallSlideTime=500;

$(document).ready(function(){
    // this function initializes user interface, data and etc
    // Initiaze managers
    dataMgr = new DataManager();
    uiMgr   = new UIManager();
    loginMgr= new LoginManager();
    cpMgr   = new CanPageManager();
    // Initialize data
    dataMgr.InitTemplates();
    dataMgr.InitData();
    // Initialize UI
    uiMgr.InitEvents();
    uiMgr.ShowLogin();
    // check login
    loginMgr.CheckLogin();
    // register error handler
    int_app_error_handler = uiMgr.ErrHandler;
});

// find in array with key=value)
function fia(array, key, value){
    for(i in array)
        if (array[i][key]==value)
            return array[i];
    return null;
}

// Canteen, Stall, and MenuItem classes:
// each is a data entry in our database
// If the corresponding entry is displayed, then each is, at the same time, 
// a DIV of the corresponding entry in the UI

function copykeys(target, tocopy){
    for ( key in tocopy)
        target[key] = tocopy[key];
}

function getRGBAString(color){
    return "rgba("+ color[0]+","+ color[1]+","+ color[2]+",1)";
}
function setColor(target, colorName, color){
    target.css(colorName, getRGBAString(color));
}


function NewCanteenFancy(canobj){
    var res = tmplCanteenFancy.clone();
    copykeys(res, canobj);
    res.Showing = false;
    res.StaContainer = $(res.find(".StallContainer")[0]);
    res.ExpansionBody= res.find(".FancyExpansionBody");
    res.EmptyMsg = res.find(".CanteenEmptyMsg");

    res.Expand = function(){
        res.Showing = true;
        res.ExpansionBody.show();
        //res.ExpansionBody.slideDown(canSlideTime);
    }
    res.Collapse = function(callback){
        //NOTE no need for callback already
        res.Showing = false;
        //res.ExpansionBody.hide();
        for(var i in stallDIVs){
            if(stallDIVs[i].canteen==res.id)
                stallDIVs[i].Collapse();
        }
        if(callback)
            callback();
        /*
        res.ExpansionBody.slideUp(canSlideTime, function(){
            // collapse all stalls
            for(var i in stallDIVs){
                if(stallDIVs[i].canteen==res.id)
                    stallDIVs[i].Collapse();
            }
            if(callback)
                callback();
        });
        */
    }
    res.AddStall = function(sta){
        res.EmptyMsg.remove();
        res.StaContainer.append(sta);
        sta.color = canobj.color;
        setColor(sta.find(".StaName"), "color", canobj.color);
        setColor(sta.find(".StaTogBut"), "color", canobj.color);
        setColor(sta.find(".StaDivider"), "background-color", canobj.color);
        setColor(sta.find(".StaQLength"), "background-color", canobj.color);
    }
    res.click(function(){cpMgr.GotoCanteen(res);});

    //res.ExpansionBody.hide();
    setColor(res.find(".panel-heading"), "background-color", canobj.color);
    res.css("border", "solid 1px "+getRGBAString(canobj.color));
    res.find(".CanName").html(canobj.name);
    res.find(".CanDesc").html(canobj.description);
    return res;
}

function NewCanButton(canobj, color){
    var res = tmplCanButton.clone();
    res.backcolor = color;
    res.hicolor = [Math.floor(color[0]*0.7+76), 
            Math.floor(color[1]*0.7+76), 
            Math.floor(color[2]*0.7+76)];
    res.html(canobj.name);
    setColor(res, "background-color", color);
    res.hover(function(){
        setColor(res, "background-color", res.hicolor);
    },
    function(){
        setColor(res, "background-color", res.backcolor);
    });
    copykeys(res, canobj);
    res.click(function(){
        cpMgr.GotoCanteen(res);
    });
    return res;
}



// class Stall
function NewStall(stobj){
    var res = tmplStall.clone();
    res.MIContainer = $(res.find(".MenuItemContainer")[0]);
    res.MenuItems = null;
    res.Showing=false;
    res.TogBut = res.find(".StaTogBut");

    copykeys(res, stobj);
    res.Toggle = function(){
        if(res.Showing)
            res.Collapse();
        else
            res.Expand();
    }
    res.Expand = function(){
        if(res.Showing)return;
        if(!res.MenuItems){
            int_get_menu_item_install_online({stallid: res.id}, function(data){
                res.MenuItems = [];
                var c = data.content;
                if(c.length>0)
                    res.MIContainer.empty();
                for(i in c){
                    var item = NewMenuItem(c[i]);
                    item.appendTo(res.MIContainer);
                    res.MenuItems.push(item);
                }
                res.MIContainer.slideDown(stallSlideTime);
                res.Showing=true;
            });
        }
        else{
            res.MIContainer.slideDown(stallSlideTime);
            res.Showing=true;
        }
        res.TogBut.addClass("glyphicon-chevron-up");
        res.TogBut.removeClass("glyphicon-chevron-down");
        // if menu isn't loaded, load and build DIVs for them
    };
    res.Collapse=function(callback){
        if(!res.Showing)return;
        res.MIContainer.slideUp(stallSlideTime, callback);
        res.Showing=false;
        res.TogBut.removeClass("glyphicon-chevron-up");
        res.TogBut.addClass("glyphicon-chevron-down");
    };
    res.UpdateQLength = function(){
        int_get_stall_queue_length({stallid:res.id}, function(data){
            var length = data.content.queue_length;
            res.find('.StaQLength').html(length);
        });
    };
    // quick way to update queue length
    setInterval(res.UpdateQLength, 1000*60);
    res.find(".StallHeading").click(function(){cpMgr.ToggleStall(res);});
    res.TogBut.addClass("glyphicon-chevron-down");
    res.MIContainer.hide();
    res.find(".StaName").html(stobj.name);
    res.find(".StaDesc").html(stobj.description);
    res.UpdateQLength();
    return res;
}

// class MenuItem
function NewMenuItem(miobj){
    var res = tmplMenuItem.clone();
    copykeys(res, miobj);
    res.desc = res.find(".MIDesc");
    res.click(function(){uiMgr.AddItem(res);});
    res.mouseenter(function(){
        res.desc.stop();
        res.desc.animate({"margin-top":"-155px",
                         "box-shadow":"0 0 5px 2px rgba(0, 201, 204, 0.7)"},
                          300);
    });
    res.mouseleave(function(){
        res.desc.stop();
        res.desc.animate({"margin-top":"0px",
                         "box-shadow":""}, 300);
    });
    res.find(".MIName").html(miobj.name);
    res.find(".MIPrice").html(" $"+dataMgr.calcMIPrice(miobj));
    res.desc.html(miobj.description);
    var imagediv = res.find(".MIImage");
    if(miobj.img_location){
        imagediv.addClass("MIImageValid");
        imagediv.css("background-image", "url("+miobj.img_location+")");
    }
    else
        imagediv.addClass("MIImageInvalid");
    return res;
}

// class CartItem
// miobj is the corresponding menu_item entry in database, not the DIV
function NewCartItem(ciobj, miobj){
    var res = tmplCartItem.clone();
    // this MI may not contain DIV, but does contain price, name etc
    res.MI = miobj;
    copykeys(res, ciobj);
    // increase quantity
    res.Increment = function(){
        res.quantity++;
        res.find(".CIQuantity").html("x"+res.quantity);
        uiMgr.AdjustTotalPrice();
    };
    // decrease quantity
    res.Decrement = function(){
        res.quantity--;
        if(res.quantity==0)
            uiMgr.RemoveItem(res);
        else
            res.find(".CIQuantity").html("x"+res.quantity);
        uiMgr.AdjustTotalPrice();
    };
    res.Remarks= res.find(".CIRemarks");
    res.UpdateRemarks=function(){
        if(res.remarks)
            res.Remarks.html(res.remarks);
        else
            res.Remarks.html("add remark");
    };
    res.EditRemarks = function(){
        var editor = NewRemarkEditor(res);
        $("body").append(editor);
    };
    res.find(".CIName").html(miobj.name);
    res.find(".CIPrice").html("$"+dataMgr.calcMIPrice(miobj));
    res.find(".CIQuantity").html("x"+ciobj.quantity);
    res.UpdateRemarks();
    res.Remarks.click(res.EditRemarks);
    // init event directly, since CIs don't get hidden and then reattached
    res.find(".CIInc").click(res.Increment);
    res.find(".CIDec").click(res.Decrement);
    return res;
}

function NewRemarkEditor(CIDIV){
    var res = tmplRemarkEditor.clone();
    res.CIDIV = CIDIV;
    res.remarkInput = res.find(".remarkInput");
    res.remarkInput.val(CIDIV.remarks);
    res.find(".remarkBut").click(function(){
        res.CIDIV.remarks = res.remarkInput.val();
        res.CIDIV.UpdateRemarks();
        res.remove();
    });
    return res;
}


// class DataManager
function DataManager(){
    this.CartCanteen = null;
    this.CartCheck = function(citem){
        //TODO we need to give user an alert when adding items from a different canteen
        if(CartCanteen==null)
            alert("");
    };
    this.InitTemplates = function(){
        tmplCanteenFancy=$("#TmplCanteenFancy").clone().attr("id","");
        tmplCanDropItem=$("#TmplCanDropItem"). clone().attr("id","");
        tmplCanteen =  $("#TmplCanteen"). clone().attr("id","");
        tmplStall =    $("#TmplStall").   clone().attr("id","");
        tmplMenuItem = $("#TmplMenuItem").clone().attr("id","");
        tmplCartItem = $("#TmplCartItem").clone().attr("id","");
        tmplCanButton= $("#TmplCanButton").clone().attr("id","");
        tmplRemarkEditor=$("#TmplRemarkEditor").clone().attr("id","");
    };
    // 0: data hasn't arrived; 1: data arrived; 2: DIVs created
    this.can_arrived = 0;
    this.sta_arrived = 0;
    // this function waits for the right time to build DIVs
    this.Delayed= function(){
        if(this.can_arrived==1){
            uiMgr.CreateCanteenDIVs();
            this.can_arrived = 2;
        }
        // canteen divs should have been built before stalls divs can be
        if(this.can_arrived==2 && this.sta_arrived==1){
            uiMgr.CreateStallDIVs();
            this.sta_arrived = 2;
        }
    };
    // this function grabs canteen data and stall data
    // when canteen data arrives, it builds canteens' DIVs (nav button and DIV)
    // when stall data arrives, ot builds stall DIVs without adding them to
    // Canteens
    this.InitData = function(){
        int_get_canteen_activated({}, function(data){
            cache_canteens = data.content;
            dataMgr.can_arrived = 1;
            dataMgr.Delayed();
        });
        int_get_stall_activated({}, function(data){
            cache_stalls = data.content;
            dataMgr.sta_arrived = 1;
            dataMgr.Delayed();
        });
    };
    this.LoadCart = function(){
        cache_cart = [];
        if(customer==null){
            uiMgr.AdjustTotalPrice();
            return;
        }
        int_cus_get_cart({}, function(data){
            // data is in case3
            var entries = data.content;
            var c = [];
            for(i in entries){
                var ci = entries[i].parent;
                ci.MI = entries[i].children[0];
                c.push(ci);
            }
            uiMgr.RedrawCart(c);
            // update UI
        });
    };
    this.SaveCart = function(){
        var cart = [];
        // loop through cache_cart, grab data we need
        for(i in cache_cart)
            cart.push({
                        item: cache_cart[i].item, 
                        quantity: cache_cart[i].quantity,
                        remarks: cache_cart[i].remarks});
        int_cus_set_cart({collection:cart}, function(data){
            uiMgr.Alert("Cart successfully saved");
        });
    }
    this.calcMIPrice = function(mi){
        return parseFloat(mi.price * mi.promotion).toFixed(2);
    };
}

// class LoginManager
function LoginManager(){


    this.DoLogin = function()
    {
        var obj = {
            username: id("loginUsername").value,
            password:id("loginPassword").value,
            domain:"customer"
        };
        int_login(obj, loginMgr.PassLogin);
    };

    this.CheckLogin = function(){
        int_login_check_customer({},loginMgr.PassLogin, function (data){
            // if not logged in, do nothing
        });
    };

    this.isLoggedIn=function(){
        return customer!=null;
    };

    this.PassLogin = function (data)
    {
        customer = data.content;
        uiMgr.ShowCart();
        uiMgr.SetHeaderUser(customer.username);
        uiMgr.SetBalance(customer.balance);
        dataMgr.LoadCart();
    };

    this.LogOut = function()
    {
        int_logout({}, function(d){
            customer=null;
            $("#loginPassword").val("");
            uiMgr.ShowLogin();
        });
    };
}


// class UIManager
function UIManager(){
    // pages
    this.PageLogin = $("#PageLogin");
    this.Home=$("#Home");
    this.panelRight = $("PanelRight");
    this.RightLogin  = $("#RightLogin");
    this.RightCart  = $("#RightCart");
    this.RightSetting=$("#RightSetting");
    this.RightTitle  = $("#RightTitle");
    this.CIContainer =$("#CartItemContainer");
    this.TotalPrice  =$("#TotalPrice");
    this.ButCanteens = $("#ButCanteens");
    this.CanDropList = $("#CanDropList");
    this.Blacker =  $("#Blacker");
    this.BlackMsg = $("#BlackMsg");
    // width of our left panel, adjusted with window size
    this.LeftWidth = 0;

    // functions
    this.HideAll = function(){
        uiMgr.PageLogin.hide();
    };
    // show login page
    this.ShowLogin= function(){
        //this.HideAll();
        uiMgr.RightCart.hide();
        uiMgr.RightSetting.hide();
        uiMgr.RightLogin.show();
        uiMgr.RightTitle.html("Log in");
    };
    this.ShowSettings = function(){
        uiMgr.RightCart.hide();
        uiMgr.RightSetting.show();
        $("#settingHPNo").val(customer.hpnumber);
    };
    this.ShowCart = function(){
        uiMgr.RightSetting.hide();
        //TODO check cart's canteen
        uiMgr.RightLogin.hide();
        uiMgr.RightTitle.html("<span class='CartIcon glyphicon glyphicon-shopping-cart'></span>"+
                    customer.username+"'s Cart <span onclick='uiMgr.ShowSettings()' title='Change user settings' class='UserSettingBut glyphicon glyphicon-cog'></span>");
        uiMgr.RightCart.show();
    };
    this.SaveSettings = function(){
        var pwd = $("#settingPwd").val();
        var hpno = $("#settingHPNo").val();
        int_cus_change_settings({password:pwd, hpnumber: hpno}, function(){
            uiMgr.Alert("Password successfully changed");
            $("#settingPwd").val("");
        });
    };
    // called at initialization
    this.CreateCanteenDIVs = function(){
        fancySetup();
    };
    this.CreateStallDIVs = function(){
        var cache = cache_stalls;
        for( i in cache){
            var stobj = NewStall(cache[i]);
            cache[i] = stobj;
            fia(canFancyDIVs, "id", stobj.canteen).AddStall(stobj);
            stallDIVs.push(stobj);
        }
    };
    this.AddItem = function(mi){
        if(!loginMgr.isLoggedIn())
            return;
        var ci = fia(cache_cart, "item", mi.id);
        if(ci){
            ci.Increment();
            return;
        }
        ciobj = {item: mi.id, quantity: 1, remarks:""}
        ci = NewCartItem(ciobj, mi);
        cache_cart.push(ci);
        this.CIContainer.append(ci);
        this.AdjustTotalPrice();
    }
    this.AdjustTotalPrice = function(){
        var t = 0;
        for(i in cache_cart)
            t += dataMgr.calcMIPrice(cache_cart[i].MI)* cache_cart[i].quantity;
        this.TotalPrice.html("$"+t);
        if(cache_cart.length==0)
            $("#EmptyCartMsg").show();
        else
            $("#EmptyCartMsg").hide();
    }
    this.RemoveItem = function(ci){
        // TODO remove ci
        var i = cache_cart.indexOf(ci);
        cache_cart.splice(i, 1);
        ci.remove();
        this.AdjustTotalPrice();
    }
    // this func is called by dataMgr->LoadCart()
    this.RedrawCart = function(rawdata){
        this.CIContainer.empty();
        for(i in rawdata){
            var ci = NewCartItem(rawdata[i], rawdata[i].MI);
            this.CIContainer.append(ci);
            cache_cart.push(ci);
        }
        this.AdjustTotalPrice();
    }

    this.SetHeaderUser = function (username){
        $("#HeaderUser").html(username);
    };
    this.SetBalance = function(balance){
        $(".RightBalance").html("Your balance: "+"$"+balance);;
    };
    this.WindowResize = function(){
        //FIXME we also need a minimum width
        var win = $(window);
        var width = win.width();
        width = 1024;
        var fullwidth = 724;
        if(width>1024)
            uiMgr.LeftWidth = fullwidth;
        else
            uiMgr.LeftWidth = fullwidth - (1024 - width);
        $(".Home").width(uiMgr.LeftWidth);
        if(cpMgr.InCanteenDIV)
        {
            cpMgr.InCanteenDIV.width(uiMgr.LeftWidth);
            cpMgr.CanPage.css("margin-left", cpMgr.getShiftAmt(cpMgr.InCanteenDIV));
        }
    };
    this.InitEvents= function(){
        $("#loginButLogin").click(loginMgr.DoLogin);
        //$("#BackBut").click(cpMgr.Back);
        $("#LogoutBut").click(loginMgr.LogOut);
        $("#SaveCartBut").click(dataMgr.SaveCart);
        $("#BlackBut").click(function(){uiMgr.Blacker.hide();});
        $(".LoginInput2").keydown(function(e){
            if(e.which==13)
                loginMgr.DoLogin();
        });
        //uiMgr.panelRight.on("click", ".UserSettingBut", uiMgr.ShowSettings);
        //$(".UserSettingBut").click(uiMgr.ShowSettings);
        $("#settingButSaveSettings").click(uiMgr.SaveSettings);
        $("#settingButReturn").click(uiMgr.ShowCart);
        var logo = $("#FancyLogo");
        logo.click(function(){cpMgr.GotoCanteen(logo);});
        $(window).resize(uiMgr.WindowResize);
        uiMgr.WindowResize();
    };
    this.Alert = function(msg){
        //FIXME need better alert box
        //alert(msg);
        //return;
        uiMgr.BlackMsg.html(msg);
        uiMgr.Blacker.show();
    };
    this.ErrHandler = function(data){
        uiMgr.Alert(data.err_msg);
    };
}


// class CanteenPage manager
// kind of a UI manager, but handles all the work for CanPage
function CanPageManager(){
    this.CanPage=     $("#PanelShifter");
    this.BackBut =    $("#BackBut");

    // the canteen and stall being shown
    this.InCanteenDIV = null;
    this.InStallDIV = null;


    // force canteen width = 100, height = 400
    // and fade out stall, change color to header color
    this.ForceDownsize = function(canobj, callback){
        // if it's not canteen div, it's #Home
        // in this case no need to downsize, just do callback
        if(!canobj.id) {
            if(callback)
                callback();
            return;
        }
        // change entire backgrounc color
        setColor(canobj, "background-color", canobj.color);
        // start sliding
        canobj.animate({width:100, height:400}, canSlideTime);
        // fade out expansion body
        canobj.ExpansionBody.animate({opacity:0},canSlideTime, function(){
            // collapse stalls inside
            canobj.Collapse();
            if(callback)
                callback();
        });
    };
    // recover can's size from 100x400 to its natural size
    this.Upsize = function(canobj, callback){
        if(!canobj.id) {
            if(callback)
                callback();
            return;
        }
        var height = canobj.height();
        // save its old height css
        var oldheight = canobj.css("height");
        var oldwidth  = canobj.css("width");
        // change css to obtain natural size
        canobj.css({height:"auto", width: uiMgr.LeftWidth});
        var realh  = canobj.height();
        // recover old css
        canobj.css({height:oldheight, width: oldwidth});
        // animate to real size
        //canobj.css('background-color', "white");
        canobj.animate({height:realh, width: uiMgr.LeftWidth},canSlideTime);
        canobj.ExpansionBody.animate({opacity:1}, canSlideTime, function(){
            canobj.css({height:"auto"});
        });
    };
    this.getShiftAmt=function(target, isback){
        if(!isback)
            return uiMgr.Home.position().left - target.position().left;
        else
            return uiMgr.Home.position().left - target.position().left +
                uiMgr.LeftWidth - 100;
    };
    // step 2 and 3 of GotoCanteen
    this.DoOpenCanteen = function(canobj, isback){
        var targetDIV;
        if(!canobj.id)
            targetDIV = $("#Home");
        else
            targetDIV = fia(canFancyDIVs, "id", canobj.id);
        // shift
        if(isback)
            isback=cpMgr.InCanteenDIV.id? true: false;
        cpMgr.CanPage.animate({"margin-left": cpMgr.getShiftAmt(targetDIV, isback)}, 
                                canSlideTime);
            // expand target canteen
            cpMgr.InCanteenDIV = targetDIV;
            cpMgr.Upsize(targetDIV);
            /*
        function(){
        });
        */
    };

    this.GotoCanteen = function(canobj){
        // if going to current canteen, just return
        if(cpMgr.InCanteenDIV && 
            canobj.id==cpMgr.InCanteenDIV.id)return;
        // 1. Collapse current canteen
        //      reduce height and width simultaneously
        // 2. Shift
        // 3. Expand target canteen's height and width simultaneously
        if(cpMgr.InCanteenDIV)
        {
            if(!canobj.id || (cpMgr.InCanteenDIV.id && canobj.id && 
                cpMgr.InCanteenDIV.id > canobj.id)) {
                cpMgr.ForceDownsize(cpMgr.InCanteenDIV);
                cpMgr.DoOpenCanteen(canobj);
                return;
            }
            cpMgr.ForceDownsize(cpMgr.InCanteenDIV);
            //, function(){
            cpMgr.DoOpenCanteen(canobj, true);
            //});
            return;
        }
        cpMgr.DoOpenCanteen(canobj);
    };
    // show a specific stall
    this.ShowStall  = function(sta){
        // if showing the same, return
        if(sta==cpMgr.InStallDIV)return;
        if(cpMgr.InStallDIV){
            /*
            cpMgr.InStallDIV.Collapse(function(){
                cpMgr.InStallDIV = sta;
                sta.Expand();
                $("html, body").animate({scrollTop:cpMgr.InStallDIV.offset().top-70}, 600);
            });
            return;
            */
        }
        cpMgr.InStallDIV = sta;
        sta.Expand();
    };
    this.ToggleStall = function(sta){
        if(sta.Showing)
            sta.Collapse();
        else
            sta.Expand();
    };
}


var direction = 0;
var colors = [[248, 121, 18], [256, 204, 0], [170, 221, 0], 
              [0, 204, 204], [102, 102, 153], [255, 51, 51]];

// this function builds fancy nav Buttons for canteens
// and fancy canteen DIVs
function fancySetup(){
    var header = $("#FancyHeader");
    var infixer= $(".FancyInFixer");
    var logo = $("#FancyLogo");
    var body = $('body');
    var panelRight=$("#PanelRight");
    var aniTime = 300;
    // add canteen buttons into fancyheader
    for(var i=cache_canteens.length-1; i>=0; i--)
    {
        //ja(cache_canteens[i].rawdata);
        var ci = i%colors.length;
        var canBut = NewCanButton(cache_canteens[i], colors[ci]);
        cache_canteens[i].canBut = canBut;
        cache_canteens[i].color = colors[ci];
        infixer.append(canBut);
    }
    // add canteen divs into canteen container
    canFancyDIVs = [];
    for(var i=0; i<cache_canteens.length; i++){
        var fancyDIV = NewCanteenFancy(cache_canteens[i]);
        cpMgr.CanPage.append(fancyDIV);
        cpMgr.ForceDownsize(fancyDIV);
        canFancyDIVs.push(fancyDIV);
    }
    var CanButs = $(".CanButton");
    var fancyExpand=function(){
        header.stop();
        CanButs.stop();
        panelRight.stop();
        logo.stop();
        if(direction==-1)
        {
        }
        direction = 1;
        CanButs.animate({height:"100px", width:"100px", "line-height":"100px"}, aniTime);
        header.animate({height: "100px"}, aniTime, function(){direction=0;});
        logo.animate({height:"100px", width:"200px", "line-height":"100px",
                    'font-size':"50px"}, aniTime);
        panelRight.animate({"margin-top": 0}, aniTime);
    };
    var fancyCollapse = function(){
        header.stop();
        CanButs.stop();
        panelRight.stop();
        logo.stop();
        if(direction==1)
        {
        }
        direction = -1;
        CanButs.animate({height:"50px", width:"100px", "line-height":"50px"}, aniTime);
        header.animate({height:"50px"}, aniTime, function(){direction=0;});
        logo.animate({height:"50px", width:"150px", "line-height":"50px",
                    'font-size':'30px'}, aniTime);
        panelRight.animate({"margin-top": -50}, aniTime);
    };
    header.mouseenter(function(){
        fancyExpand();
    });
    header.mouseleave(function(){
        if($(window).scrollTop()!=0)
            fancyCollapse();
    });
    $(window).scroll(function(){
        if($(window).scrollTop()==0)
            fancyExpand();
        else
            fancyCollapse();
    });
}
