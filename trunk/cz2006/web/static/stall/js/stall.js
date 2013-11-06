//templates
var tmplCartItem;
var tmplMenuItem;
var tmplProcessingOrderItem;
var tmplMenuInfoItemDisplay;
var tmplMenuInfoItemEdit;
var tmplMenuInfoItemAdd;
var tmplReport;
var tmplBlack;
var tmplAlert;
var tmplConfirm;
var tmplRow;
var tmplCol;

//manager object
var loginMgr;
var dataMgr;
var uiMgr;

//cache
var stallUser;
var cache_menu;
var cache_processing_queue;


var DivMenuItem;
var DivCartItem;
var DivProcessingOrderItem;
var DivMenuInfoItemDisplay;
var DivMenuInfoItemEdit;
var DivMenuInfoItemAdd;

var img_invalid;
var queue_check_timer;


$(document).ready(function(){
    // this function initializes user interface, data and etc
    // Initiaze managers
    uiMgr   = new UIManager();
    loginMgr= new LoginManager();
    uiMgr.InitTemplates();
    uiMgr.InitEvents();

    // check login
    loginMgr.CheckLogin();
});


//helper function
function id(n) {return document.getElementById(n);}
function ja(o) {alert(JSON.stringify(o));}
function my_fail(data){my_alert(data.err_msg);}
function my_alert(message){
    $("body").append(tmplAlert);
    tmplAlert.find(".message").html(message);
    tmplAlert.on("click",".alert-confirm",function(){
        tmplAlert.remove();
    });
}
function my_confirm(message,callbackTrue,callbackFalse){
    $("body").append(tmplConfirm);
    tmplConfirm.find(".confirm-message").html(message);
    tmplConfirm.on("click",".confirm-confirm",function(){
        tmplConfirm.remove();
        callbackTrue();
    });
    tmplConfirm.on("click",".confirm-cancel",function(){
        tmplConfirm.remove();
        callbackFalse();
    });
}

function copykeys(target, tocopy){
    for ( key in tocopy)
        target[key] = tocopy[key];
}
function is_numeric(input)
{
    var nReg = new RegExp("^[1-9][0-9]*$");
    return nReg.test(input+"");
    //return (input - 0) == input && (input+'').replace(/^\s+|\s+$/g, "").length > 0;
}
// find in array with key=value)
function fia(array, key, value){
    for(i in array)
        if (array[i][key]==value)
            return array[i];
    return null;
}


//data class
function NewCartItem(cartItemObj){
    var res=tmplCartItem.clone();
    copykeys(res,cartItemObj);
    if(cartItemObj.promotion==1){
        res.find(".cart-item-name").html(cartItemObj.name);
    }else{
        res.find(".cart-item-name").html(cartItemObj.name+"(P)");
    }
    res.find(".cart-item-price").html("$"+(cartItemObj.price*cartItemObj.promotion).toFixed(2));
    res.quantity=1;
    res.find(".cart-item-quantity").val(res.quantity);
    res.Increment=function(){
        res.quantity+=1/1;
        res.find(".cart-item-quantity").val(res.quantity);
        uiMgr.UpdatePrice();
    }
    res.Decrement=function(){
        if(res.quantity>1){
            res.quantity-=1/1;
            res.find(".cart-item-quantity").val(res.quantity);
        }
        uiMgr.UpdatePrice();
    }
    res.SetQuan=function(quan){
        if(is_numeric(quan)){
            res.quantity=quan;
            res.find(".cart-item-quantity").val(quan);
        }else{
            my_alert("Invalid input");
        }
        uiMgr.UpdatePrice();
    }
    res.Remove=function(){
        uiMgr.RemoveCartItem(res);
        var i=DivCartItem.indexOf(res);
        DivCartItem.splice(i,1);
        uiMgr.UpdatePrice();
    }
    res.find(".plus").click(res.Increment);
    res.find(".minus").click(res.Decrement);
    res.find(".trash").click(res.Remove);
    res.find(".cart-item-quantity").change(function(){
        res.quantity=is_numeric(res.find(".cart-item-quantity").val())?parseInt(res.find(".cart-item-quantity").val()):res.quantity;
        res.SetQuan(res.quantity);
    });
    res.find(".remarks").change(function(){
        res.remarks=res.find(".remarks").val();
    });
    return res;
}
function NewMenuItem(menuItemObj){
    var res=tmplMenuItem.clone();
    copykeys(res,menuItemObj);
    if(menuItemObj.promotion==1){
        res.find(".menu-item-name").html(menuItemObj.name);
    }else{
        res.find(".menu-item-name").html(menuItemObj.name+"(P)");
    }
    res.find(".menu-item-price").html("$"+(menuItemObj.price*menuItemObj.promotion).toFixed(2));

    res.click(function(){
        obj=fia(DivCartItem,"id",menuItemObj.id);
        if(obj==null){
            var c=NewCartItem(menuItemObj);
            DivCartItem.push(c);
            uiMgr.AddCartItem(c);
            uiMgr.UpdatePrice();
        }else{
            obj.Increment();
        }
    });
    return res;

}
function NewProcessingOrderItem(processingOrderItemObj){
    var res=tmplProcessingOrderItem.clone();
    copykeys(res,processingOrderItemObj);
    res.find(".q-num").html("Q num: "+processingOrderItemObj.parent.queue_num);
    var table="";
    for (i in processingOrderItemObj.children){
        var item=processingOrderItemObj.children[i];
        table+="<tr><td>"+fia(cache_menu,"id",item.item).name+"</td><td>"+item.quantity+"</td><td>"+item.remarks+"</td></tr>";
    }
    res.Revoke = function(){
        alert('inside revoke');
        my_confirm("Confirm to revoke this order?",function(){
            var obj;
            my_confirm("Notify customer of the revoke?",function(){
                obj = {orderid: res.parent.id, notify: true};
                int_stall_order_revoke(obj, function(data){
                    res.Remove();
                    my_alert("Order revoked");
                });
            },function(){
                obj = {orderid: res.parent.id, notify: false};
                int_stall_order_revoke(obj, function(data){
                    res.Remove();
                    my_alert("Order revoked");
                });
            });
        },function(){});
    };
    res.Done=function(){
        int_stall_order_complete({"orderid":res.parent.id},function(data){
            res.Remove();
        });
    };
    res.Remove=function(){
        uiMgr.RemoveProcessingOrder(res);
        DivProcessingOrderItem.splice(DivProcessingOrderItem.indexOf(res),1);
    }
    res.find(".processing-order").html(table);
    res.find(".processing-order-done-btn").data("order",res);
    res.find(".processing-order-revoke-btn").click(res.Revoke);
    return res;
}
function NewMenuInfoItemDisplay(menuInfoItemDisplayObj){
    var res=tmplMenuInfoItemDisplay.clone();
    res.rawdata = menuInfoItemDisplayObj;
    copykeys(res,menuInfoItemDisplayObj);
    var att_to_display=["name","promotion_until","promotion","description"];
    if(!menuInfoItemDisplayObj["is_available_online"]){
        $(res).find(".is_available_online-data")[0].innerHTML="offline";
    }else{
        $(res).find(".is_available_online-data")[0].innerHTML="online";
    }
    $(res).find(".price-data")[0].innerHTML="$"+menuInfoItemDisplayObj["price"];
    for (j in att_to_display){
        att=att_to_display[j];
        $(res).find("."+att+"-data")[0].innerHTML=menuInfoItemDisplayObj[att];
    }
    res.Edit = function(){
        //var obj=fia(cache_menu,"id",$(event.currentTarget).data("obj").id);
        DivMenuInfoItemEdit=NewMenuInfoItemEdit(res.rawdata);
        //$(".black-out").empty();
        uiMgr.ShowBlack(DivMenuInfoItemEdit);
        //$("#menu-info").append(tmplBlack);
        //$(".black-out").append(DivMenuInfoItemEdit);
    };
    var url = makeurl(menuInfoItemDisplayObj.img_location);
    res.click(res.Edit);
    res.find(".image-data").css("background-image", makeurl(menuInfoItemDisplayObj.img_location));
    res.data("obj",res);
    return res;
}
function NewMenuInfoItemEdit(menuInfoItemDisplayObj){
    var res=tmplMenuInfoItemEdit.clone();
    copykeys(res,menuInfoItemDisplayObj);
    menuInfoItemDisplayObj["is_activated"]=menuInfoItemDisplayObj["is_activated"]?1:0;
    menuInfoItemDisplayObj["is_available"]=menuInfoItemDisplayObj["is_available"]?1:0;
    menuInfoItemDisplayObj["is_available_online"]=menuInfoItemDisplayObj["is_available_online"]?1:0;
    res.uploadChange=function(e) {
        if(this.disabled) return my_alert('File upload not supported!');
        var F = this.files;
        if(F && F[0]) 
            readImage( F[0] );
    }
    res.resetUpload = function (e){
        var editWindow = $(e.currentTarget.parentElement.parentElement);
        editWindow.find(".fileToUpload")[0].files = null;
        // reset image to original
        id("imgForm").reset();
        editWindow.find("#itemid").val(res.id);
        editWindow.find(".image-data").css("background-image", makeurl(res.img_location));
    }
    res.Cancel = function()
    {
        DivMenuInfoItemEdit=null;
        //$(".black-out").empty();
        //tmplBlack.remove();
        uiMgr.ExitBlack();
    };
    res.find(".menu-info-edit-cancel-btn").click(res.Cancel);
    res.Submit = function(){
        var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
        var obj={};
        // validate image
        var files = res.find(".fileToUpload")[0].files;
        if(files && files[0]){
            if(img_invalid){
                my_alert("Image to be uploaded is invalid. If you want to submit the rest of the edited information, you may click the Reset Upload button");
                return;
            }
            uploadImage(res.find(".imgFormEdit"));
        }
        for (att_index in att_to_display){
            att=att_to_display[att_index];
            obj[att]=res.find(".menu-info-edit-"+att).val();
        }
        obj["is_available"]=obj["is_available"]==1;
        obj["is_available_online"]=obj["is_available_online"]==1;
        obj["is_activated"]=obj["is_activated"]==1;
        obj["promotion_until"]=obj["promotion_until"]==""?null:obj["promotion_until"];
        obj["itemid"]=res.id;
        var canDel=true;
        if(!obj["is_activated"]){
            for(var i in DivProcessingOrderItem){
                for (var j in DivProcessingOrderItem[i].children){
                    if (Number(DivProcessingOrderItem[i].children[j].item)==Number(obj.itemid)){
                        my_alert("Cannot deactivate this menu. Still have order being processing");
                        canDel=false;
                        break;
                    }
                    if(!canDel){
                        break;
                    }
                }
            }
        }
        if(canDel){
            int_stall_menu_item_edit(obj,function(data){
                int_get_menu_item_install({stallid:stallUser["stall"]},function(data){
                    cache_menu=data.content;
                    uiMgr.ReloadMenu();
                });
                $(".black-out").empty();
                uiMgr.ExitBlack();
            });
        }
    };
    res.find(".menu-info-edit-submit-btn").click(res.Submit);
    var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online"]
    for (j in att_to_display){
        att=att_to_display[j];
        $($(res).find(".menu-info-edit-"+att)[0]).val(menuInfoItemDisplayObj[att]);
    }
    res.find(".menu-info-edit-description").html(menuInfoItemDisplayObj["description"]);
    res.find("#itemid").val(menuInfoItemDisplayObj['id']);
    res.find(".fileToUpload").change(res.uploadChange);
    res.find(".resetUploadBut").click(res.resetUpload);
    res.find(".image-data").css("background-image", makeurl(menuInfoItemDisplayObj.img_location));
    return res;
}

function NewMenuInfoItemAdd(){
    var res=tmplMenuInfoItemAdd.clone().attr({"style":"","id":"menu-info-item-add",});
     res.uploadChange=function(e) {
        if(this.disabled) return my_alert('File upload not supported!');
        var F = this.files;
        if(F && F[0]) 
            readImage( F[0] );
    };
    res.find(".fileToUpload").change(res.uploadChange);
    res.resetUpload = function (e){
        var editWindow = $(e.currentTarget.parentElement.parentElement);
        editWindow.find(".fileToUpload")[0].files = null;
        // reset image to original
        id("imgForm").reset();
        // new item has no id, don't set
        // editWindow.find("#itemid").val(res.id);
        editWindow.find(".image-data").css("background-image", makeurl(res.img_location));
    };
    res.Cancel = function(){
        DivMenuInfoItemAdd=null;
        //$(".black-out").empty();
        //tmplBlack.remove();
        uiMgr.ExitBlack();
    };
    res.find(".menu-info-add-cancel-btn").click(res.Cancel);

    res.Submit = function(){
        alert();
        var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
        var obj={};
        // validate image
        var files = res.find(".fileToUpload")[0].files;
        if(files && files[0])
        {
            if(img_invalid){
                my_alert("Image to be uploaded is invalid. If you want to submit the rest of the edited information, you may click the Reset Upload button");
                return;
            }
            var newimgid = Math.floor(Math.random()*10000000);
            // we are uploading image for an item that does not yet exist,
            // so we use a special id to identify its image, so our backend
            // knows which image to use
            // set upload form newimgid
            $("#newitemid").val(newimgid);
            uploadImage(newimgid); // true: this is a new item
            obj["newimgid"]= newimgid;
        }
        //var res=$(event.currentTarget).parent();
        for (att_index in att_to_display){
            att=att_to_display[att_index];
            obj[att]=res.find(".menu-info-add-"+att).val();
        }
        obj["is_available"]=obj["is_available"]==1;
        obj["is_available_online"]=obj["is_available_online"]==1;
        obj["is_activated"]=obj["is_activated"]==1;
        obj["promotion_until"]=obj["promotion_until"]==""?null:obj["promotion_until"];
        obj["promotion"]=obj["promotion"]==""?null:obj["promotion"];
        obj["price"]=+obj["price"];
        int_stall_menu_item_add(obj,function(data){
            /*
            $(".black-out").empty();
            tmplBlack.remove();
            */
            DivMenuInfoItemAdd=null;
            uiMgr.ExitBlack();
            int_get_menu_item_install({stallid:stallUser["stall"]},function(data){
                cache_menu=data.content;
                uiMgr.ReloadMenu();
            });
        });
    };
    res.find(".menu-info-add-submit-btn").click(res.Submit);
    res.find(".menu-info-add-promotion").val("1");
    return res;
}

function NewReport(){
    var res=tmplReport.clone();
    var allItem=null;
    int_stall_get_all_menu_item({},function(data){
        allItem=data.content;
        int_stall_report({},function(data){
            data=data["content"];
            for (key in data){
                var tablelines=new Array();
                var subTotalNumOrder=0;
                var subTotalRevenue=0;
                var subTotal=new Array();
                for ( var i =0;i<data[key].length;i++){
                    res.find("."+key+" thead tr .p"+(i+1)).html(data[key][i].period);
                    res.find("."+key+" tfoot .num-orders .p"+(i+1)).html(data[key][i].order_count);
                    res.find("."+key+" tfoot .revenue .p"+(i+1)).html(data[key][i].revenue);
                    subTotalNumOrder+=data[key][i].order_count;
                    subTotalRevenue+=data[key][i].revenue;
                }
                res.find("."+key+" tfoot .num-orders .total").html(subTotalNumOrder);
                res.find("."+key+" tfoot .revenue .total").html(subTotalRevenue);

                for (var i=0;i<data[key][0].details.length;i++){
                    var newRow=tmplRow.clone();
                    newRow.find("th").html(fia(allItem,"id",data[key][0].details[i].id).name);
                    tablelines.push(newRow);
                    subTotal.push(0);
                }
                for (var i in data[key]){
                    for ( var j in data[key][i].details){
                        var newCol=tmplCol.clone().html(data[key][i].details[j].quantity);
                        if(key=="daily"&&i==9||key=="monthly"&&i==11){
                            newCol.addClass("pthis");
                        }
                        tablelines[j].append(newCol);
                        subTotal[j]+=data[key][i].details[j].quantity;
                    }
                }
                 
                for ( var j=0;j<tablelines.length;j++){
                    var newCol=tmplCol.clone().html(subTotal[j]);
                    tablelines[j].append(newCol);
                    res.find("."+key+" tbody").append(tablelines[j]);
                }
            }
        });
    });
    return res;
}
//manager class
function DataManager(){
   this.Clear=function(){
        //cache
        stallUser=null;
        cache_menu=null;
        cache_processing_queue=null;

        DivMenuItem=null;
        DivCartItem=null;
        DivProcessingOrderItem=null;
        DivMenuInfoItemDisplay=null;
        DivMenuInfoItemEdit=null;
    } 

    this.InitData=function(){

        DivMenuItem=new Array();
        DivCartItem=new Array();
        DivProcessingOrderItem=new Array();
        DivMenuInfoItemDisplay=new Array();
        DivMenuInfoItemEdit={};
        
        $("#user-display").html(stallUser.username);

        int_get_menu_item_install({stallid:stallUser["stall"]},function(data){
            cache_menu=data.content;
            uiMgr.ReloadMenu();
        });
        int_stall_get_processing_queue({},function(data){
            dataMgr.UpdateProcessingQueue(data);
        });
        
        this.LoadStoreInfo();    

    };
    this.LoadStoreInfo=function(){
        int_get_stall({"stallid":stallUser.stall},function(data){
            $("#stall-info-name").val(data["content"]["name"]);
            $("#stall-info-description").val(data["content"]["description"]);
        });
    }
    this.UpdateProcessingQueue=function(data){
        //order in cache but not in the queue on server
        for (var i in DivProcessingOrderItem){
            var itemDiv=DivProcessingOrderItem[i];
            var found=false;
            for (order in data.content){
                var itemServer=data.content[order];
                if (itemDiv.parent.id==itemServer.parent.id){
                    found=true;
                    break;
                }
            }
            if(!found){
                itemDiv.remove();
            }
        }
        //order in the queue on server but not in cache
        for (var order in data.content){
            var itemServer=data.content[order];
            var found=false;
            for (var i in DivProcessingOrderItem){
                var itemDiv=DivProcessingOrderItem[i];
                if (itemDiv.parent.id==itemServer.parent.id){
                    found=true;
                    break;
                }
            }

            if(!found){
                var orderbefore = null;
                for( var index in DivProcessingOrderItem){
                    var itemDiv=DivProcessingOrderItem[index];
                    if(itemDiv.parent.payment_time>=itemServer.parent.payment_time){
                        orderbefore = itemDiv;
                        break;
                    }
                }
                uiMgr.CreateProcessingOrder(itemServer,orderbefore);
            }                    
        }

        cache_processing_queue=data;
    };

   }
function LoginManager(){
    this.DoLogin=function(){
        var obj={
            username:id("username").value,
            password:id("password").value,
            domain:"stall_user"};
        int_login(obj, loginMgr.PassLogin);
    };
    this.CheckLogin=function(){
        int_login_check_stall({}, loginMgr.PassLogin, function(data){
            uiMgr.ShowLogin();
        });
    };
    this.PassLogin=function(data){
        stallUser=data.content;
        // Initialize data
        dataMgr = new DataManager();
        dataMgr.InitData();
        if(stallUser.usertype!="M"){
            $("#stall-management-btn").hide();
        }else{
            $("#stall-management-btn").show();
        }
        // Initialize UI

        uiMgr.ShowTakeOrder();
        //set timer
        queue_check_timer = window.setInterval(function(){int_stall_get_processing_queue({},dataMgr.UpdateProcessingQueue)}, 5000);
    };
    this.Logout=function(){
        int_logout({}, function(d){
            uiMgr.Clear();
            dataMgr.Clear()
            $("#password").val("");
            uiMgr.ShowLogin();
            clearInterval(queue_check_timer);
        });
    };
}
function UIManager(){
    this.InitTemplates=function(){
        tmplCartItem=$("#cart-item-template").clone().attr("id","").show();
        tmplMenuItem=$("#menu-item-template").clone().attr("id","").show();
        tmplProcessingOrderItem=$("#processing-order-item-template").clone().attr("id","").show();
        tmplMenuInfoItemDisplay=$("#menu-info-item-display-template").clone().attr("id","").show();
        tmplMenuInfoItemEdit=$("#menu-info-item-edit-template").clone().attr("id","").show();
        tmplMenuInfoItemAdd=$("#menu-info-item-add-template").clone().attr("id","").show();
        tmplReport=$("#report-template").clone().attr("id","").show();
        tmplBlack=$("#black-out").clone().attr("id","").show();
        tmplAlert=tmplBlack.clone().append($("#alert").clone().attr("id","").show());
        tmplConfirm=tmplBlack.clone().append($("#confirm").clone().attr("id","").show());
        tmplRow=$(".one-row").clone().show();
        tmplCol=$(".one-col").clone().show();
    };


    //pages
    this.PageMain=$("#wrapper");
    this.PageLogin=$("#loginForm");
    this.TakeOrder=$("#take-order");
    this.Menu=$("#menu");
    this.OrderCart=$("#order-cart");
    this.ProcessingOrder=$("#processing-order");
    this.StallManagement=$("#stall-management");
    this.StallInfo=$("#stall-info");
    this.MenuInfo=$("#menu-info");
    this.Report=$("#report");
    
    this.Black
    this.Alert

    this.HideAll=function(){
        this.PageMain.hide();
        this.PageLogin.hide();
        this.TakeOrder.hide();
        this.OrderCart.hide();
        this.ProcessingOrder.hide();
        this.StallManagement.hide();
        this.StallInfo.hide();
        this.MenuInfo.hide();
        this.Report.hide();
    };
    this.ShowLogin=function(){
        this.HideAll();
        this.PageLogin.show();
    };
    this.ShowTakeOrder=function(){
        this.HideAll();
        this.PageMain.show();
        this.TakeOrder.show();
        this.OrderCart.show();
    };
    this.ShowProcessingOrder=function(){
        this.HideAll();
        this.PageMain.show();
        this.ProcessingOrder.show();
    };
    this.ShowStallManagement=function(){
        this.ShowMenuInfo();
    };
    this.ShowStallInfo=function(){
        this.HideAll();
        this.PageMain.show();
        this.StallManagement.show();
        this.StallInfo.show();
    };
    this.ShowMenuInfo=function(){
        this.HideAll();
        this.PageMain.show();
        this.StallManagement.show();
        this.MenuInfo.show();
    };
    this.ShowReport=function(){
        this.HideAll();
        this.PageMain.show();
        this.StallManagement.show();
        this.Report.show();
    };
    this.ClearOrderCart=function(){
        for (var i in DivCartItem){
            DivCartItem[i].remove();
        }
        DivCartItem=new Array();
        this.UpdatePrice();
    };
        
    this.Clear=function(){
        for (var i in DivMenuItem){
            DivMenuItem[i].remove();
        }
        for (var i in DivProcessingOrderItem){
            DivProcessingOrderItem[i].remove();
        }
        for (var i in DivMenuInfoItemDisplay){
            DivMenuInfoItemDisplay[i].remove();
        }
        for (var i in DivMenuInfoItemEdit){
            DivMenuInfoItemEdit[i].remove();
        }
        this.ClearOrderCart();
    };
    this.ReloadMenu=function(){
        for (var i in DivMenuItem){
            DivMenuItem[i].remove();
        }
        for (var i in DivMenuInfoItemDisplay){
            DivMenuInfoItemDisplay[i].remove();
        }
        this.CreateMenuDIVs();
        this.CreateMenuInfoDIVs();
    }
    this.CreateMenuDIVs=function(){
        for (var i in cache_menu){
            DivMenuItem[i]=NewMenuItem(cache_menu[i]);
            if(DivMenuItem[i].is_activated){
                if(!DivMenuItem[i].is_available){
                    DivMenuItem[i].css("background-color","grey");
                    DivMenuItem[i].unbind("click");
                }
                this.Menu.append(DivMenuItem[i]);
            }
                
        }
    };

    this.CreateProcessingOrder=function(order,orderbefore){
        var newProcessingOrder=NewProcessingOrderItem(order);
        DivProcessingOrderItem.push(newProcessingOrder);
        if(orderbefore==null){
            this.ProcessingOrder.append(newProcessingOrder);
        }else{
            orderbefore.before(newProcessingOrder);
        }
    };
    this.CreateMenuInfoDIVs=function(){
        for (var i in cache_menu){
            if(cache_menu[i].is_activated){
                DivMenuInfoItemDisplay[i]=NewMenuInfoItemDisplay(cache_menu[i]);
                this.MenuInfo.append(DivMenuInfoItemDisplay[i]);
            }
        }
    };
    this.AddCartItem=function(obj){
        this.OrderCart.find("#cart-items").prepend(obj);
        this.UpdatePrice();
    };
    this.RemoveCartItem=function(obj){
        obj.remove();
    };
    this.RemoveProcessingOrder=function(order){
        order.remove();
    };
    this.UpdatePrice=function(){
        var price=0;
        for(var i in DivCartItem){
            price+=Number((DivCartItem[i].price*DivCartItem[i].promotion).toFixed(2))*Number(DivCartItem[i].quantity);
        }
        $("#total-price").html("TOTAL: $"+Number(price));
        if(DivCartItem.length==0){
            $("#total-price").hide();
        }else{
            $("#total-price").show();
        }
    };

    this.LoadReport=function(){
        this.Report.empty();
        this.Report.append(NewReport());
    };
    //Init Events
    this.InitEvents=function(){
        // login events
        $("#loginSubmit").click(loginMgr.DoLogin);
        $("#loginReset").click(function(){
            $("#password").val("");
            $("#username").val("");
        });
        $("#logout").click(loginMgr.Logout);
        // nav button events
        $("#take-order-btn").click(function(){
            uiMgr.ShowTakeOrder.call(uiMgr)});
        $("#processing-order-btn").click(function(){
            uiMgr.ShowProcessingOrder.call(uiMgr)});
        $("#stall-management-btn").click(function(){
            uiMgr.ShowStallManagement.call(uiMgr)});
        // buttons inside stall management
        $("#stall-info-btn").click(function(){
            uiMgr.ShowStallInfo.call(uiMgr)});
        $("#menu-info-btn").click(function(){
            uiMgr.ShowMenuInfo.call(uiMgr)});
        $("#report-btn").click(function(){
            uiMgr.LoadReport.call(uiMgr);
            uiMgr.ShowReport.call(uiMgr)
        });
        // buttons inside take order
        $("#cancel-order").click(function(){
            alert();
            my_confirm("Clear Order Cart?",function(){
                uiMgr.ClearOrderCart.call(uiMgr);
            },function(){});
        });
        $("#confirm-order").click(function(){
            if (DivCartItem.length==0){
                my_alert("Empty cart. Cannot submit");
                return;
            }
            var confirm_msg="Order details:<ul>";
            var cart_submit_collection=new Array();
            for (cart_entry in DivCartItem){
                var item=DivCartItem[cart_entry];
                var r=(item.remarks==undefined)?"":item.remarks;
                var itemToPush={itemid:item.id,
                                quantity:item.quantity,
                                remarks:r};
                cart_submit_collection.push(itemToPush);
                confirm_msg+="<li>"+fia(cache_menu,"id",item.id).name;
                confirm_msg+="    |    "+item.quantity;
                confirm_msg+="    |    "+r+"</li>";
            }
            confirm_msg+="</ul>Please confirm the order by scanning the bar code.\n";

            var barcode="";
            $(".black-out").empty();
            $("#take-order").append(tmplBlack);
            $(".black-out").focus();
            var dialog=tmplConfirm.clone();
            dialog.find(".confirm-confirm").remove();
            dialog.find(".confirm-message").html(confirm_msg);
            $(".black-out").append(dialog);

            $(".confirm-cancel").click(function(){
                $(".black-out").empty();
                $(".black-out").remove();
            });

            $(".black-out").keypress(function(event){
                if(event.which==13){
                    var obj={"customer_barcode":barcode, 
                    "collection":cart_submit_collection};

                    int_stall_order_submit(obj,function(data){
                        my_alert("Order Submitted");
                        uiMgr.ClearOrderCart.call(uiMgr);
                        int_stall_get_processing_queue({},dataMgr.UpdateProcessingQueue);
                    });
                    barcode="";
                    $(".black-out").remove();
                    return;
                }
                else if((event.which< 48 || event.which>57) &&
                    (event.which<65 || event.which>90) &&
                    (event.which<97 || event.which>122))
                    return;
                barcode += String.fromCharCode(event.which);
            });
        });
        // buttons for processing order
        this.ProcessingOrder.on("click",".processing-order-done-btn",function(event){
            var tar=$(event.currentTarget).data("order");
            tar.Done();
        });

        // stall info buttons
        $("#stall-info-submit").click(function(){
            var contentEdit={
                    "name":$("#stall-info-name").attr("value"),
                    "description":$("#stall-info-description").val()}
            int_stall_edit(contentEdit,function(){
                my_alert("update successfully");
            });
        });
        $("#stall-info-cancel").click(function(){
            dataMgr.LoadStoreInfo.call(dataMgr)
        });
        
        // menu info buttons
        $("#menu-info-add-btn").click(function(event){
            /*var obj={"img_location":"","name":"","is_activated":"","price":"","id":"",
                    "promotion_until":"","stall":"","is_available":"","promotion":"",
                    "is_available_online":"","description":""};*/
            DivMenuInfoItemAdd=NewMenuInfoItemAdd();
            //$(".black-out").empty();
            //$("#menu-info").append(tmplBlack);
            //$(".black-out").append(DivMenuInfoItemAdd);
            uiMgr.ShowBlack(DivMenuInfoItemAdd);
        });
    };
    this.ShowBlack=function(div){
        newblack = tmplBlack.clone();
        newblack.append(div);
        $("body").append(newblack);
    };
    this.ExitBlack=function(){
        $(".black-out").remove();
    };
}


//TODO should have better place to put the image functions
//image functions
function readImage(fileName) {

    var reader = new FileReader();
    var image  = new Image();

    reader.readAsDataURL(fileName);  
    reader.onload = function(file) {
        image.src    = file.target.result;              // url.createObjectURL(file);
        image.onload = function() {
            var w = this.width,
                h = this.height,
                t = file.type,
                n = file.name,
                s = ~~(file.size/1024) +'KB';
            img_invalid = false;
            $('.imgUploadPreview').css("background-image", "url("+this.src+")");
        };
        image.onerror= function() {
            img_invalid = true;
            my_alert('Invalid file type: '+ file.type);
        };      
    };

}
function uploadImage(form, newimgid)
{
    var xhr = new XMLHttpRequest();
    //var formID = newimgid?"imgFormAdd":"imgFormEdit";
    var fd = new FormData(form);
    xhr.addEventListener("load", uploadComplete, false);
    xhr.addEventListener("error", uploadFailed, false);
    xhr.addEventListener("abort", uploadCanceled, false);
    xhr.open("POST", "/stall/upimg");
    xhr.send(fd);
}
function uploadComplete(evt)
{
    var res = evt.target.responseText;
    if(res){
        my_alert(res);
        return;
    }
    my_alert("Image upload successful");
    // grab new image url and update shit
}
function makeurl(img_location){
    var randn=Math.floor(Math.random()*100000);
    var url = "url('"+img_location+"?"+randn+"')";
    return url;
}
function uploadFailed()
{
}
function uploadCanceled()
{
}
