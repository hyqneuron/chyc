// ofs.js
// Three classes, when clicked, trigger a tab swtich inside #maincontent
// 1. aMain (the thing inside sidebar)
// 2. nav_but (the buttons inside navigation bar on top of #maincontent)
// 3. tab_but (other buttons that appear inside tabs)

var ofs_user; // the ofs user logged in
var canteens_updated = 0; // this value has to be 2 before we can canMgr.DoCanteenUpdate
// data caches
var cache_canteens = [];
var cache_stalls = [];
var cache_cus_page = []; // an array of customers loaded into tab_cus
var cache_page_count = 0;// number of pages
var page_num_prev = 1;
// DIV templates
var tmpl_canteen;
var tmpl_canteen_stall;
var tmpl_stall_info;
var tmpl_stall_menu;
var tmpl_new_stall;
var tmpl_new_canteen;
var tmpl_topup;
var tmpl_cus;
var tmpl_blacker_wait;


var uiMgr;
var cusMgr; //customer UI manager
var canMgr;// canteen UI manager
var dataMgr;
var loginMgr;

// convenience functions
function id(n) {return document.getElementById(n);}
function ja(o) {alert(JSON.stringify(o));}
function sh(o,n,h){return $(o).find("."+n).html(h);}
function my_fail(data){alert(data.err_msg);}

function copykeys(target, tocopy){
    for ( key in tocopy)
        target[key] = tocopy[key];
}

function findInArray(arr, name, value) {
    for(var i = 0; i<arr.length; i++)
        if(arr[i][name]==value)
            return arr[i];
    return false;
}

// when page is finished loading
$(document).ready(function()
{
    // init manager classes
    dataMgr= new DataManager();
    uiMgr =  new UIManager();
    cusMgr=  new CusUIManager();
    canMgr = new CanUIManager();
    loginMgr=new LoginManager();
    // Initialize data
    dataMgr.InitTemplates();
    dataMgr.InitData();
    // Initialize UI
    uiMgr.InitEvents();
    uiMgr.ShowLogin();
    loginMgr.CheckLogin();
    // overwrite default error handlers
    int_ajax_error_handler = uiMgr.AJAXErrorMsg;
    int_app_error_handler  = uiMgr.APIErrorMsg;
});

function DataManager(){
    this.InitData=function(){
        // nothing to do,?
    };
    this.InitTemplates = function(){
        tmpl_canteen = $("#canTMPL").clone().attr("id","");
        tmpl_canteen_stall = $("#canStallTMPL").clone().attr("id","");
        tmpl_stall_info = $("#stallInfoTMPL").clone().attr("id","");
        tmpl_stall_menu = $("#stallMenuTMPL").clone().attr("id","");
        tmpl_new_stall = $("#newStallTMPL").clone().attr("id","");
        tmpl_new_canteen = $("#newCanteenTMPL").clone().attr("id","");
        tmpl_topup = $("#topupTMPL").clone().attr("id","") ;
        tmpl_cus = $("#cusTMPL").clone().attr("id","");
        tmpl_blacker_wait = $("#blackerWaitTMPL").clone().attr("id","");
    };
    this.ValidateFloat = function (amt) {
        return parseFloat(amt);
    };
    this.ValidateUsername = function (username){
        username = username.trim();
        if(!username.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) 
            return false;
        return username;
    };
    this.ValidateBarcode = function (barcode){
        barcode = barcode.trim();
        if(!barcode.match(/^[0-9]+$/)) 
            return false;
        return barcode;
    }
}

function LoginManager(){
    this.DoLogin = function(){
        var obj={username:id("username").value,
            password:id("password").value,
            domain:"ofs_user"};
        int_login(obj, loginMgr.PassLogin);
    };
    this.PassLogin=function(data){
        ofs_user = data.content;
        uiMgr.ShowMain();
        // if user isn't manager, we're going to hide more stuffs, show only topup
        // FIXME more divs need to be labelled as mgrOnly
        // FIXME need to properly initialize UI at this point to prevent content
        // from previous session be shown here. Or maybe we should clear content
        // at logout time
        if(ofs_user.usertype != "M")
            $(".mgrOnly").hide();
        else
        {
            canMgr.UpdateCanteens();
            $(".mgrOnly").show();
            // load customer page information and load page 0
            cusMgr.UpdatePageCount();
        }
    };
    this.CheckLogin=function(){
        int_login_check_ofs({},loginMgr.PassLogin,function (data){
            // if not logged in, do nothing
        });
    };
    this.Logout   =function(){
        int_logout({}, function(data){
            id("username").value = "";
            id("password").value = "";
            $("#page_login").show();
            $("#page_main").hide();
        });
    };
}


function UIManager(){
    this.blacker = $("#blacker");
    // if we are showing "waiting", blacker cannot be closed
    this.BlackerNoExit = false;
    // warning message when exiting dim screen (without completing certain action)
    this.BlackerExitMsg = "";

    this.inputUsername = $("#username");
    this.inputPassword = $("#password");
    this.PageLogin = $("#page_login");
    this.PageMain  = $("#page_main");

    this.ShowTab = function(tabid, grpid){
        if(!tabid)return;
        $(".tab").hide();
        $("#"+tabid).show();
        // change navigation bar
        // set group.open to true
        $(".MenuGroup,.MenuGroupExpand").attr("opened", "false");
        $(".MenuGroupExpand").attr("class", "MenuGroup");
        $("#"+grpid).attr("class", "MenuGroupExpand");
        $("#"+grpid).attr("opened", "true");
    }
    this.Alert = function(msg){
        alert(msg);
    };
    this.Confirm = function(msg){
        return confirm(msg);
    };
    this.APIErrorMsg = function(data){
        uiMgr.Alert(data.err_msg);
    };
    this.AJAXErrorMsg= function(data){
        uiMgr.Alert(data.err_msg);
    };
    // we maintain a stack of blackers, so that a blacker can cover another, and
    // when the one on top exists, the one below will be shown again
    // each element of the stack is simply [div, exitMsg]
    this.blackStack = [];
    this.blackTopDiv = null;
    this.ShowBlacker = function(div){
        // this means exitMsg has to set before calling ShowBlacker
        if(uiMgr.blackerTopDiv)
            uiMgr.blackStack.push([uiMgr.blackerTopDiv, uiMgr.BlackerExitMsg]);
        uiMgr.blacker.empty().append(div).show()
        uiMgr.blackerTopDiv = div;
        uiMgr.blacker.children().click(function(e){return false;});
    };
    this.ExitBlacker = function(){
        // return if blacker is waiting for sth (NoExit), or if no blacker exists
        if(uiMgr.BlackerNoExit) return;
        if(!uiMgr.blackerTopDiv) return;
        // show warning msg first if there is one
        if(uiMgr.BlackerExitMsg ){
            if(!confirm(uiMgr.BlackerExitMsg )) return;
        }
        // clear the current blacker
        uiMgr.blacker.empty();
        // if something in stack, bring it out
        if(uiMgr.blackStack.length)
        {
            var newtop = uiMgr.blackStack[uiMgr.blackStack.length-1];
            uiMgr.blacker.append(newtop[0]);
            uiMgr.blacker.children().click(function(e){return false;});
            uiMgr.blackerTopDiv = newtop[0];
            uiMgr.BlackerExitMsg = newtop[1];
            newtop[0].InitEvents();
            uiMgr.blackStack.splice(uiMgr.blackStack.length-1, 1);
        }
        else
        {
            uiMgr.blackerTopDiv = null;
            uiMgr.BlackerExitMsg = "";
            uiMgr.blacker.hide();
        }
    };
    this.ShowLogin = function(){
        uiMgr.inputUsername.val("");
        uiMgr.inputPassword.val("");
        uiMgr.PageMain.hide();
        uiMgr.PageLogin.show();
    };
    this.ShowMain = function(){
        uiMgr.PageLogin.hide();
        uiMgr.PageMain.show();
    };
    this.InitEvents = function(){
        // attach events
        $("#login_button").click(loginMgr.DoLogin);
        // main buttons
        var buts1 = $(".MenuChild");
        var buts2 = $(".MenuParent");
        var mainbuts = $.merge(buts1, buts2);
        for(var i = 0; i<mainbuts.length; i++)
        {
            //TODO need to fix the click event
            $(mainbuts[i]).click(function(event){
                var tabid = $(event.currentTarget).attr("tab");
                var grpid = $(event.currentTarget).attr("group");
                uiMgr.ShowTab(tabid, grpid);
            });
        }
        // navigation buttons
        $("#navigation").on("click", ".nav_but", function(event){
            uiMgr.ShowTab($(event.currentTarget).attr("tab"));
        });


        // blacker
        $("#blacker").click(function(){uiMgr.ExitBlacker();});

        // tab-specific
        // customer
        $("#cusPageNum").change(cusMgr.PageNumChange);
        $("#cusSelClear").click(function(){cusMgr.UnselectAll();});
        $("#cusSelAll").click(function(){cusMgr.SelectAll();});
        $("#cusSelDeact").click(function(){cusMgr.MassDeactSelected();});
        $("#cusUpdate").click(function(){cusMgr.RefreshCurrentPage();});

        // customer info
        $("#cusInfoButFind").click(cusMgr.FindCusInfo);
        $("#cusInfoSearchUsername").keydown(function(event){cusMgr.CusSearchKeyDown(event, "username")});
        $("#cusInfoSearchBarcode").keydown(function(event){cusMgr.CusSearchKeyDown(event, "barcode")});
        $("#cusInfoButActivate").click(function(){cusMgr.SingleCusToggleActivated();});
        $("#cusInfoButChangePassword").click(function(){cusMgr.SingleCusResetPwd();});
        $("#cusInfoButTopup").click(function(){cusMgr.SingleCusShowTopupWin();});
        $("#cusInfoDisp").hide();

        // customer registration
        $("#cusRegButCreate").click(cusMgr.DoMassReg);
        // customer deregistration
        $("#cusDeButDeactivate").click(cusMgr.DoMassDereg);

        // canteens and stalls
        $("#canRegister").click(canMgr.AddCanteen);
        $("#canUpdate").click(canMgr.UpdateCanteens);

        // temporary log out button
        $("#ButLogout").click(loginMgr.Logout);
    };
}

function CusUIManager(){
    this.pageCountSpan = $("#cusPageCount");
    this.inputPageNum    = $("#cusPageNum");

    this.cusContainer = $("#CustomerDIVContainer");
    // the customer we show in single cus info tab, not a cus DIV
    this.SingleCus = null;
    // selected customers
    this.CusSelection=[];

// if the mass selection was initiated through the customer selection page
var massDeregFromSel = false;

    //=======paging================
    this.UpdatePageCount=function(){
        // grab page count from server and update
        int_ofs_customer_page_count({}, function(data){
            cusMgr.pageCountSpan.html(data.content.page_count);
            cache_page_count = parseInt(data.content.page_count);
            cusMgr.inputPageNum.attr("max",data.content.page_count);
            if(true && data.content.page_count>0)
                cusMgr.LoadPage(1);
        });
    }
    this.PageNumChange=function(){
        // validate value
        var pagenum = parseInt(cusMgr.inputPageNum.val());
        if(!pagenum || pagenum<0 || pagenum>cache_page_count) {
            cusMgr.inputPageNum.val(page_num_prev);
            return;
        }
        page_num_prev = pagenum;
        cusMgr.LoadPage(pagenum);
    };
    this.RefreshCurrentPage = function(){
        cusMgr.LoadPage(page_num_prev);
    }
    this.LoadPage = function (pageNum) {
        pageNum -=1;
        var container = cusMgr.cusContainer;
        // put a loading sign into Container
        // container.empty();
        // clear all tr entries in table
        container.empty();
        $("#cusLoading").show();
        // load data
        int_ofs_customer_get_page({page_num: pageNum}, function(data){
            if(pageNum != page_num_prev-1)return;
            $("#cusLoading").hide();
            var page = data.content;
            cache_cus_page = [];
            for(var i = 0; i<page.length; i++){
                var cdiv = newCustomerDIV(page[i]);
                cache_cus_page.push(cdiv);
                if(cusMgr.isCustomerSelected(page[i])) 
                    cdiv.Highlight();
                container.append(cdiv);
            }
        });
    };

    //============cus selection==================
    this.isCustomerSelected = function(cus) {
        for(var i = 0; i<cusMgr.CusSelection.length; i++) {
            if(cus.id == cusMgr.CusSelection[i].id)
                return true;
        }
        return false;
    };
    this.SelectAll = function(){
        for(var i = 0; i<cache_cus_page.length; i++) 
            cusMgr.AddToSelection(cache_cus_page[i].rawdata);
    };
    this.UnselectAll = function(){
        // remove from tail
        for(var i = cusMgr.CusSelection.length-1; i>=0; i--) 
            cusMgr.RemoveFromSelection(cusMgr.CusSelection[i]);
    };
    this.MassDeactSelected=function(){
        if(cusMgr.CusSelection.length==0)
        {
            uiMgr.Alert("No customer selected");
            return;
        }
        var txt = "";
        for(var i = 0; i<cusMgr.CusSelection.length; i++)
        {
            txt+= cusMgr.CusSelection[i].barcode;
            if(i != cusMgr.CusSelection.length-1)
                txt+="\n";
        }
        $("#cusDeList").val(txt);
        massDeregFromSel = true;
        uiMgr.ShowTab("tab_cus_deactivate", "GroupCus");
    };
    this.RemoveFromSelection = function(cus) {
        for(var i = 0; i<cusMgr.CusSelection.length; i++) 
        {
            if(cus.id == cusMgr.CusSelection[i].id){
                // if this cus is on-page
                var cusonpage = findInArray(cache_cus_page, "id", cus.id);
                if(cusonpage)
                    cusonpage.Unhighlight();
                cusMgr.CusSelection.splice(i, 1);
                break;
            }
        }
        $("#cusSelCount").html(cusMgr.CusSelection.length);
    };
    // cus should be raw data, so CusSelection only contains raw data
    this.AddToSelection = function (cus, force) {
        if(cusMgr.isCustomerSelected(cus))
            return;
        cusMgr.CusSelection.push(cus);
        // definitely on-page, since user cannot select a non-on-page customer
        findInArray(cache_cus_page, "id", cus.id).Highlight();
        $("#cusSelCount").html(cusMgr.CusSelection.length);
    };

    //===============single cus info page===============
    this.FindCusInfo = function () {
        var choice = $("input[name='searchby']:checked").val();
        if(!choice){
            uiMgr.Alert("Please select whether you are searching using username or barcode");
            return;
        }
        if(choice=="username"){
            var username = id("cusInfoSearchUsername").value;
            int_ofs_customer_getbyusername({username:username}, cusMgr.ShowSingleCusData);
        }
        else if(choice=="barcode"){
            var barcode = id("cusInfoSearchBarcode").value;
            int_ofs_customer_getbybarcode({barcode:barcode}, cusMgr.ShowSingleCusData);
        }
        else{
            uiMgr.Alert("invalid choice of search type");
            return;
        }
    };
    // cus is raw data, not DIV
    this.ShowSingleCus = function(cus){
        cusMgr.SingleCus = cus;
        var usertype = cus.usertype == "S"? "Student":
                       cus.usertype == "A"? "Stuff": "Visitor";
        $("#cusInfoUsername").html(cus.username);
        $("#cusInfoBarcode").html(cus.barcode);
        $("#cusInfoUserType").html(cus.usertype);
        $("#cusInfoBalance").html("$"+cus.balance);
        $("#cusInfoActivated").html(cus.is_activated? "Yes":"No");
        var butTex = cus.is_activated? "Deactivate Customer":
                                            "Activate Customer";
        $("#cusInfoDisp").show();
        $("#cusInfoButActivate").val(butTex);
        uiMgr.ShowTab("tab_cus_info", "GroupCus");
    }
    // data is received directly from API
    this.ShowSingleCusData = function (data) {
        cusMgr.ShowSingleCus(data.content);
    };
    this.SingleCusResetPwd = function() {
        if(!cusMgr.SingleCus) return;
        int_ofs_customer_edit
        (
            {customerid: cusMgr.SingleCus.id, password:"password"},
            function(data){
                cusMgr.ShowSingleCus(data.content);
                uiMgr.Alert("Password reset successful.");
            }
        );
    };
    this.SingleCusToggleActivated = function() {
        if(!cusMgr.SingleCus) return;
        var cus = cusMgr.SingleCus;
        var txt = cus.is_activated?"Customer deactivated":"Customer activated";
        int_ofs_customer_edit
        (
            {customerid: cus.id, is_activated:!cus.is_activated},
            function(data){
                cusMgr.ShowSingleCus(data.content);
                cusMgr.RefreshCurrentPage();
                uiMgr.Alert(txt);
            }
        );
    };
    this.SingleCusShowTopupWin = function(){
        if(!cusMgr.SingleCus) return;
        uiMgr.ShowBlacker(newTopupDIV(cusMgr.SingleCus));
    };

    //================mass deregister and mass add==============
    this.DoMassDereg = function(){
        var obj = [];
        // parse content of cusDeList
        var str = $("#cusDeList").val();
        // break into lines
        var list = str.split("\n");
        for(var i = 0; i<list.length; i++){
            var barcode=dataMgr.ValidateBarcode(list[i]);
            if(!barcode){
                uiMgr.Alert("Invalid barcode at line "+(i+1));
                return;
            }
            obj.push({ barcode : barcode });
        }
        obj = {collection: obj};
        int_ofs_customer_mass_deactivate(obj, function(data){
            uiMgr.Alert("Mass deactivation successful");
            $("#cusDeList").val("");
            if(massDeregFromSel){
                cusMgr.UnselectAll();
                cusMgr.RefreshCurrentPage();
                massDeregFromSel = false;
            }
        });
    };
    this.DoMassReg = function() {
        var obj = [];
        // parse content of cusRegList
        var str = $("#cusRegList").val();
        // break into lines
        var list = str.split("\n");
        for(var i = 0; i<list.length; i++){
            var components = list[i].split(/[,]/);
            if(components.length!=2){
                uiMgr.Alert("Invalid data at line "+(i+1));
                return;
            }
            components[0]=dataMgr.ValidateUsername(components[0]);
            components[1]=dataMgr.ValidateBarcode(components[1]);
            if(!components[0] || !components[1]){
                uiMgr.Alert("Invalid username or barcode at line "+(i+1));
                return;
            }
            obj.push({
                username: components[0],
                barcode : components[1],
                usertype: $("input[name=cusRegUserType]:checked").val(),
                password: "password"
            });
        }
        obj = {collection: obj};
        // data has been parsed and validated, now initiate request
        int_ofs_customer_mass_add(obj, function(data){
            uiMgr.Alert("Mass Registration successful");
            $("#cusRegList").val("");
        });
    }
    this.CusSearchKeyDown = function (e, target){
        var code = e.keycode? e.keycode: e.which;
        if(target=="username"){
            //$("#r1").attr("checked",true);
            id("r1").setAttribute("checked", true);
            if(code==13)
                cusMgr.FindCusInfo();
        }
        else if(target=="barcode"){
            //$("#r2").attr("checked",true);
            id("r2").setAttribute("checked", true);
            if(code==13)
                cusMgr.FindCusInfo();
        }
    }
} // class CusUIManager





///////////////////////Canteen UI manager/////////////////////////
function CanUIManager(){
    this.CanContainer = $("#CanteenDIVContainer");
    // send request to update canteens info
    this.UpdateCanteens = function ()
    {
        // grab all canteens and stalls
        int_get_canteen_activated({}, function(data){
            cache_canteens = data.content;
            canteens_updated++;
            canMgr.DoCanteenUpdate();
        });
        int_get_stall_activated({}, function(data){
            cache_stalls = data.content;
            canteens_updated++;
            canMgr.DoCanteenUpdate();
        });
    };
    // actually do the update when data has arrived
    this.DoCanteenUpdate = function ()
    {
        if(canteens_updated<2)return;
        canteens_updated = 0;
        var container = canMgr.CanContainer;
        container.empty();
        for(var i = 0; i<cache_canteens.length; i++)
        {
            var cdiv = newCanteenDIV(cache_canteens[i]);
            container.append(cdiv);
        }
    };
    this.AddCanteen = function(){
        uiMgr.ShowBlacker(newAddCanteenDIV());
    };
} // class CanUIManager
