
/////=======new classes============
function newCustomerDIV(data)
{
    var res = tmpl_cus.clone(); 
    copykeys(res, data);
    res.rawdata = data;
    res.Select = function() {
        if(cusMgr.isCustomerSelected(res)) 
            cusMgr.RemoveFromSelection(res);
        else 
            cusMgr.AddToSelection(res.rawdata);
    };
    res.Highlight = function(){
        res.addClass("CustomerDIVSelected");
    };
    res.Unhighlight=function(){
        res.removeClass("CustomerDIVSelected");
    };
    res.ShowInSingleCus = function (){
        /*
        int_ofs_customer_getbybarcode({barcode:res.barcode}, cusMgr.ShowTab);
        uiMgr.ShowTab("tab_cus_info", "GroupCus");
        */
        cusMgr.ShowSingleCus(res.rawdata);
        return false;
    };

    // init text information
    sh(res, "CustomerDIVBarcode", data.barcode);
    sh(res, "CustomerDIVUserType", data.usertype=="S"? "Student":
                                   data.usertype=="A"? "Staff":"Visotor");
    sh(res, "CustomerDIVUsername", data.username);
    sh(res, "CustomerDIVBalance", "$"+data.balance);
    sh(res, "CustomerDIVActivated", data.is_activated? "Yes":"No");
    // init events
    res.find(".CustomerDIVBarcode").click(res.ShowInSingleCus);
    res.click(res.Select);
    return res;
}
function newTopupDIV(data)
{
    var res = $(tmpl_topup).clone(); 
    res.rawdata = data;
    res.inputAmt =res.find(".topInputAmt"); 
    copykeys(res, data);
    res.Topup = function(){
        var amt = dataMgr.ValidateFloat(res.inputAmt.val());
        if(!amt || amt<=0 ){
            uiMgr.Alert("invalid topup amount");
            return;
        }
        int_ofs_customer_topup({customerid: res.id, value: amt}, function(data){
            cusMgr.ShowSingleCusData(data);
            cusMgr.RefreshCurrentPage();
            uiMgr.Alert("Topup successful");
            uiMgr.ExitBlacker();
        });
    };
    sh(res, "topBarcodeFill", data.barcode);
    res.find(".topButClose").click(uiMgr.ExitBlacker);
    res.find(".topButTopup").click(res.Topup);
    return res;
}

function newNewStallDIV(data)
{
    var res = $(tmpl_new_stall).clone();
    res.rawdata = data;
    res.inputPref = res.find(".nsdInputPref");
    res.inputName = res.find(".nsdInputName");
    res.inputDesc = res.find(".nsdInputDesc");
    res.inputCate = res.find(".nsdInputCate");
    res.DoReg = function(){
        // validate
        var prefix = res.inputPref.val();
        if(!dataMgr.ValidateUsername(prefix)){
            uiMgr.Alert(prefix+"is not an acceptable prefix");
            return;
        }
        var ignoreDiversity = false;
        var cate = res.inputCate.val()
        for(var i = 0; i<cache_stalls.length; i++){
            if(cate=="")break;
            if(cache_stalls[i].canteen!=res.id)
                continue;
            if(cache_stalls[i].category==cate){
                if(confirm("A stall with the same category already exists in this cantten. Continue?"))
                    break;
                else
                    return;
            }
        }
        // build data
        var obj = {
            name: res.inputName.val(),
            description:res.inputDesc.val(),
            username_prefix: prefix,
            canteen:res.id,
            category: cate
        };
        int_ofs_stall_add(obj, function(data){
            // trigger update in UI
            cache_stalls.push(data.content);
            canteens_updated = 2;
            canMgr.DoCanteenUpdate();
            uiMgr.Alert("Stall added successfully");
            uiMgr.ExitBlacker();
        });
    };
    copykeys(res, data);
    res.find(".nsdButClose").click(uiMgr.ExitBlacker);
    res.find(".nsdButReg").click(res.DoReg);
    return res;
}

function newEditCanteenDIV(data)
{
    return newEditAddCanDIV(data);
}
function newAddCanteenDIV()
{
    return newEditAddCanDIV();
}
function newEditAddCanDIV(data)
{
    var res = $(tmpl_new_canteen).clone();
    res.rawdata = data;
    copykeys(res, data);
    res.inputName = res.find(".ncdInputName");
    res.inputDesc = res.find(".ncdInputDesc");
    res.Register = function(){
        var obj = 
        {
            name : res.inputName.val(),
            description: res.inputDesc.val(),
        };
        // this action may take some time, so use another blacker
        uiMgr.BlackerNoExit = true;
        uiMgr.ShowBlacker(newBlackerWait("This may take a while. Please wait."));
        int_ofs_canteen_add(obj, function(data){
            cache_canteens.push(data.content);
            canteens_updated = 4;
            canMgr.DoCanteenUpdate();
            uiMgr.BlackerNoExit = false;
            uiMgr.ExitBlacker(); // kill waiter
            uiMgr.ExitBlacker(); // kill reg page

            uiMgr.Alert("Canteen registration successful");
        },
        function(data){
            // if registration failed, allow blacker to be closed
            uiMgr.BlackerNoExit = false;
            uiMgr.APIErrorMsg(data);
        });
    };
    res.Edit = function(){
        var obj = 
        {
            canteenid: res.id,
            name : res.inputName.val(),
            description: res.inputDesc.val(),
        };
        int_ofs_canteen_edit(obj, function(data){
            var edited = data.content;
            var orig = findInArray(cache_canteens, "id", edited.id);
            orig.name = edited.name;
            orig.description = edited.description;
            orig.is_activated= edited.is_activated;
            canteens_updated = 4;
            canMgr.DoCanteenUpdate();
            uiMgr.Alert("Canteen information editing successful");
            uiMgr.ExitBlacker();
        });
    };
    res.InitEvents = function(){
        res.find(".ncdButClose").click(uiMgr.ExitBlacker);
        if(res.type=="new")
            res.find(".ncdButReg").click(res.Register);
        else
            res.find(".ncdButReg").click(res.Edit);

    };
    if(!data)
        res.type="new";
    else
    {
        res.type="edit";
        res.find(".NewCanDIVHeader").html(data.name);
        res.find(".ncdInputName").val(data.name);
        res.find(".ncdInputDesc").val(data.description);
        res.find(".ncdButReg").val("Confirm edit");
    }
    res.InitEvents();
    return res;
}


function newCanteenDIV(data)
{
    var res = $(tmpl_canteen).clone();
    copykeys(res, data);
    res.rawdata = data;
    res.Deactivate = function(){
        var obj = {
            canteenid: res.id,
            value: false
        };
        int_ofs_canteen_setactivated(obj, function(data){
            canMgr.UpdateCanteens();
            uiMgr.Alert("Canteen is now deactivated");
        });
    };
    res.AddStall = function(){
        uiMgr.ShowBlacker(newNewStallDIV(res.rawdata));
    };
    res.ShowEdit = function(){
        uiMgr.ShowBlacker(newEditCanteenDIV(res.rawdata));
    };
    sh(res, "CanteenDIVHeader", data.name);
    sh(res, "CanteenDIVDesc", data.description);
    // button events
    res.find(".cdButEdit").click(res.ShowEdit);
    res.find(".cdButDeact").click(res.Deactivate);
    res.find(".cdButAddst").click(res.AddStall);

    // build the stall entries
    var stalls = [];
    for(var i = 0; i<cache_stalls.length; i++) {
        if(cache_stalls[i].canteen==data.id)
            stalls.push(cache_stalls[i]);
    }
    if (stalls.length==0) return res;
    for(var i = 0; i<stalls.length; i++)
        res.find(".CanteenDIVStalls").append(newCanteenStallDIV(stalls[i]));
    return res;
}

function newStallMenuDIV(data)
{
    var res = tmpl_stall_menu.clone();
    res.rawdata = data;
    copykeys(res, data);
    sh(res, "StallMenuName", data.name);
    sh(res, "StallMenuDesc", data.description);
    sh(res, "StallMenuPrice", "$"+data.price);
    return res;
}
function newCanteenStallDIV(data)
{
    var res = tmpl_canteen_stall.clone();
    res.rawdata = data;
    copykeys(res, data);
    res.rawdata = data; // we use this for new elements that need it
    res.ShowInfo = function(){
        uiMgr.ShowBlacker(newStallInfoDIV(res.rawdata));
    };
    sh(res, "CanteenStallName", data.name).click(res.ShowInfo);
    sh(res, "CanteenStallCategory", data.category);
    sh(res, "CanteenStallDesc", data.description);
    return res;
}
function newStallInfoDIV(data)
{
    var res = tmpl_stall_info.clone();
    res.rawdata = data;
    copykeys(res, data);
    res.Deregister = function(){
        var stall=res.rawdata;
        if(!confirm("Deregister this stall from canteen?"))
            return;
        int_ofs_stall_deactivate({stallid: stall.id}, function(data){
            var index = 0;
            cache_stalls.splice(cache_stalls.indexOf(stall),1);
            canteens_updated = 2;
            canMgr.DoCanteenUpdate();
            uiMgr.Alert("The stall has been deactivated");
            uiMgr.ExitBlacker();
        });
    };
    res.ResetPwd = function(){
        if(!uiMgr.Confirm("Reset the manager's password?"))
            return;
        int_ofs_stall_reset_mgrpwd({stallid:res.id}, function(data){
            uiMgr.Alert("Manager password reset successful");
        });
    };
    sh(res, "sidNameFill", data.name);
    sh(res, "sidDescFill", data.description);
    sh(res, "sidCateFill", data.category);
    sh(res, "sidPrefFill", data.username_prefix);
    // grab menu for this stall
    int_get_menu_item_install({stallid: data.id}, function(data){
        // remove loading label
        res.find(".menuLoading").remove();
        // fill menu items
        var cont = data.content;
        var container = res.find(".sidMenuContainer");
        for(var i =0; i<cont.length; i++){
            container.append(newStallMenuDIV(cont[i]));
        }
    });
    // bind button action
    res.find(".sidButClose").click(function(e){uiMgr.ExitBlacker();});
    res.find(".sidButResetPwd").click(res.ResetPwd);
    res.find(".sidButDereg").click(res.Deregister);
    return res;
}

function findMultipleInArray(arr, key, value){
    var res = [];
    for(var i = 0; i<arr.length; i++)
        if(arr[i][key]==value)
            res.push(arr[i]);
    return res;
}
function toStr(order_count, revenue){
    return order_count+"<br />$"+parseFloat(revenue).toFixed(2);
}
// this is a collapsible entry in TableMonthly or TableDaily
// key is either "monthly" or "daily"
// allcanteens is obtained using int_ofs_canteen_get_all
// idx is the index to allcanteens
// allstalls is obtained using int_ofs_stall_get_all
// alldata is obtained using int_ofs_report
function newReportEntry(key, allcanteens, idx, allstalls, alldata){
    var res;
    var pCount;
    if(key=="monthly"){
        res = tmpl_mentry.clone();
        pCount=12;
    }
    else if(key=="daily"){
        res = tmpl_dentry.clone();
        pCount=10;
    }
    // class for stall entries that belong to this canteen
    res.childrenClass="ReportEntry"+key+"For"+idx;
    // copykeys(res, allcanteens);
    // get canteen and stalls
    var canobj = allcanteens[idx];
    // stall obj, not report data
    var stallobjs = findMultipleInArray(allstalls, "canteen", canobj.id);
    // report data
    var stalls = [];
    for(var i = 0; i<stallobjs.length; i++)
        stalls.push(findInArray(alldata, "stall", stallobjs[i].id));
    // calculate stall totals
    var stallTR = []; // total revenue
    var stallTO = []; // total order count
    for(var i = 0; i<stalls.length; i++){
        stallTR.push(repMgr.SumStallTotal(stalls[i], key, "revenue"));
        stallTO.push(repMgr.SumStallTotal(stalls[i], key, "order_count"));
    }
    // calculate canteen stats
    var canStats = repMgr.SumForCanteen(stalls, key);

    // fill in first and last
    res.find(".First").html(canobj.name);
    var total = canStats[canStats.length-1];
    res.find(".Last").html(toStr(total.order_count, total.revenue));
    // fill in periods
    for( var i = 0; i<pCount; i++){
        var str;
        if(canStats.length==1)
            str = toStr(0,0);
        else
            str = toStr(canStats[i].order_count, canStats[i].revenue);
        res.find(".P"+(i+1)).html(str);
    }

    // now, build one entry for each stall
    // if no stall in this canteen, then append tmpl_can_empty
    res.detailsShown = false;
    res.Toggle = function(){
        if(res.detailsShown){
            res.details.find(".DetailContent").slideUp(400, function(){
                res.details.hide();
            });
            res.detailsShown = false;
        }
        else{
            res.details.show();
            res.details.find(".DetailContent").slideDown();
            res.detailsShown = true;
        }
    };
    res.click(res.Toggle);
    res.details = tmpl_can_details.clone().hide();
    res.details.find(".DetailContent").hide();
    res.details.find(".ReportCanteenName").html(canobj.name);
    // if it's empty, we simply return
    if(stalls.length==0)
        return [res, res.details];
    // if it's not, we hide empty message, and show stall table
    res.hasStall = true;
    res.details.find(".ReportCanEmptyMsg").hide();
    res.stalltable=res.details.find(".ReportStallContainer");
    res.stalltable.show();
    // set inner header
    res.stalltable.find(".RCH").append($(key=="monthly"?"#HeadRowMonthly":"#HeadRowDaily").clone());
    // set inner body
    var ibody = res.stalltable.find(".RCB");
    for(var i = 0; i<stalls.length; i++){
        var stentry=newReportStallEntry(key, stalls[i], stallobjs[i].name, 
                                        stallTR[i], stallTO[i]);
        ibody.append(stentry);
    }
    return [res, res.details];
}

function newReportStallEntry(key, stall, stallname, TR, TO){
    var res;
    var pCount;
    if(key=="monthly"){
        res = tmpl_mentry.clone();
        pCount=12;
    }
    else if(key=="daily"){
        res = tmpl_dentry.clone();
        pCount=10;
    }
    res.addClass("StallEntry");
    // fill in first and last
    res.find(".First").html(stallname).addClass("tmp1");
    res.find(".Last").html(toStr(TO, TR)).addClass("tmp1");
    // fill in periods
    for( var i = 0; i<pCount; i++){
        var str = toStr(stall[key][i].order_count, stall[key][i].revenue);
        res.find(".P"+(i+1)).html(str).addClass("tmp1");
    }
    return res;
}

function newBlackerWait(msg)
{
    var res = tmpl_blacker_wait.clone();
    if(msg)
        res.html(msg);
    return res;
}
