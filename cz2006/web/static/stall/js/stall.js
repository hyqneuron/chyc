//templates
var tmplCartItem;
var tmplMenuItem;
var tmplProcessingOrderItem;
var tmplMenuInfoItemDisplay;
var tmplMenuInfoItemEdit;
var tmplReport;

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


    uiMgr.InitEvents();
    // check login
    loginMgr.CheckLogin();

});


//helper function
function id(n) {return document.getElementById(n);}
function ja(o) {alert(JSON.stringify(o));}
function my_fail(data){alert(data.err_msg);}
function copykeys(target, tocopy){
    for ( key in tocopy)
        target[key] = tocopy[key];
}
function is_numeric(input)
{
    return (input - 0) == input && (input+'').replace(/^\s+|\s+$/g, "").length > 0;
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
        if(is_numeric(res.find(".cart-item-quantity").val())){
            res.quantity=quan;
            res.find(".cart-item-quantity").val(res.quantity);
        }else{
            alert("Invalid input");
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
        if(!confirm("Confirm to revoke this order?"))return;
        var notify = confirm("Notify customer of the revoke?");
        var obj = {orderid: res.parent.id, notify: notify};
        int_stall_order_revoke(obj, function(data){
            res.Remove();
            alert("Order revoked");
        });
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
    var url = makeurl(menuInfoItemDisplayObj.img_location);
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
        if(this.disabled) return alert('File upload not supported!');
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
    var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
    for (j in att_to_display){
        att=att_to_display[j];
        $($(res).find(".menu-info-edit-"+att)[0]).val(menuInfoItemDisplayObj[att]);
    }
    res.find("#itemid").val(menuInfoItemDisplayObj['id']);
    res.find(".fileToUpload").change(res.uploadChange);
    res.find(".resetUploadBut").click(res.resetUpload);
    res.find(".image-data").css("background-image", makeurl(menuInfoItemDisplayObj.img_location));
    return res;
}

function NewMenuInfoItemAdd(){
    var res=tmplMenuInfoItemEdit.clone().attr({"style":"","id":"menu-info-item-add",});
    $.each($(res).find("[class]"),function(key,value){
        $(value).attr({"id":"menu-info-add"+$(value).attr("class").substring(14)});
    });
    $(res).find("#menu-info-add-promotion").attr("value",1);
    return res;
}

function NewReport(){
    var res=tmplReport.clone();
    var allItem;
    int_stall_get_all_menu_item({},function(data){
        allItem=data.content;
        int_stall_report({},function(data){
            data=data["content"];
            for (key in data){
                var periodLine="";
                var orderLine="";
                var revenueLine="";
                var tablelines=new Array();
                var subTotalNumOrder=0;
                var subTotalRevenue=0;
                var subTotal=new Array();
                for ( var i =0;i<data[key].length;i++){
                    periodLine+="<th>"+data[key][i].period+"</th>";
                    orderLine+="<td>"+data[key][i].order_count+"</td>";
                    revenueLine+="<td>"+data[key][i].revenue+"</td>";
                    subTotalNumOrder+=data[key][i].order_count;
                    subTotalRevenue+=data[key][i].revenue;
                }
                periodLine+="<th>Total</th>";
                orderLine+="<td>"+subTotalNumOrder+"</td>";
                revenueLine+="<td>"+subTotalRevenue+"</td>";

                for (var i=0;i<data[key][0].details.length;i++){
                    tablelines.push("<tr><th>"+fia(allItem,"id",data[key][0].details[i].id).name+"</th>");
                    subTotal.push(0);
                }
                for (var i in data[key]){
                    for ( var j in data[key][i].details){
                        tablelines[j]+="<td>"+data[key][i].details[j].quantity+"</td>";
                        subTotal[j]+=data[key][i].details[j].quantity;
                    }
                }
                
                for ( var j=0;j<tablelines.length;j++){
                        tablelines[j]+="<td>"+subTotal[j]+"</td></tr>"
                }
                res.find("."+key+" thead tr").append(periodLine);
                res.find("."+key+" .no_orders").append(orderLine);
                res.find("."+key+" .revenue").append(revenueLine);
                res.find("."+key+" tbody").append(tablelines);
            }
        });
    });
    return res;
}
//manager class
function DataManager(){
    this.InitTemplates=function(){
        tmplCartItem=$("#cart-item-template").clone().attr("id","").show();
        tmplMenuItem=$("#menu-item-template").clone().attr("id","").show();
        tmplProcessingOrderItem=$("#processing-order-item-template").clone().attr("id","").show();
        tmplMenuInfoItemDisplay=$("#menu-info-item-display-template").clone().attr("id","").show();
        tmplMenuInfoItemEdit=$("#menu-info-item-edit-template").clone().attr("id","").show();
        tmplReport=$("#report-template").clone().attr("id","").show();
    };

    this.Clear=function(){
        
        //templates
        tmplCartItem=null;
        tmplMenuItem=null;
        tmplProcessingOrderItem=null;
        tmplMenuInfoItemDisplay=null;
        tmplMenuInfoItemEdit=null;

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
        dataMgr.InitTemplates();
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
        this.ShowStallInfo();
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
        $("#loginSubmit").click(loginMgr.DoLogin);
        $("#loginReset").click(function(){
            $("#username").val("");
            $("#password").val("");
        });
        $("#logout").click(loginMgr.Logout);
        $("#take-order-btn").click(function(){
            uiMgr.ShowTakeOrder.call(uiMgr)});
        $("#processing-order-btn").click(function(){
            uiMgr.ShowProcessingOrder.call(uiMgr)});
        $("#stall-management-btn").click(function(){
            uiMgr.ShowStallManagement.call(uiMgr)});
        $("#stall-info-btn").click(function(){
            uiMgr.ShowStallInfo.call(uiMgr)});
        $("#menu-info-btn").click(function(){
            uiMgr.ShowMenuInfo.call(uiMgr)});
        $("#report-btn").click(function(){
            uiMgr.LoadReport.call(uiMgr);
            uiMgr.ShowReport.call(uiMgr)
        });
        $("#cancel-order").click(function(){
            if(confirm("Clear Order Cart?")){
                uiMgr.ClearOrderCart.call(uiMgr);
                
            }
        });
        $("#confirm-order").click(function(){
            if (DivCartItem.length==0){
                alert("Empty cart. Cannot submit");
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
                confirm_msg+="    |    "+r+"<\li>";
            }
            confirm_msg+="</ul>Please confirm the order by scanning the bar code.\n";

            var barcode="";
            $("#take-order").append("<div id='black-out' tabindex='0'></div>");
            $("#black-out").focus();
            $("#black-out").append("<div style='max-width: 500px;padding: 15px;margin: 0 auto;background: white;margin-top: 70px;overflow: auto;'>"+confirm_msg+"</div>");
            $("#black-out").keypress(function(event){
                if(event.which==13){
                    var obj={"customer_barcode":barcode, 
                    "collection":cart_submit_collection};

                    int_stall_order_submit(obj,function(data){
                        alert("Order Submitted");
                        uiMgr.ClearOrderCart.call(uiMgr);
                        int_stall_get_processing_queue({},dataMgr.UpdateProcessingQueue);
                    });
                    barcode="";
                    $("#black-out").remove();
                    return;
                }
                else if((event.which< 48 || event.which>57) &&
                    (event.which<65 || event.which>90) &&
                    (event.which<97 || event.which>122))
                    return;
                barcode += String.fromCharCode(event.which);
            });
        });

        this.ProcessingOrder.on("click",".processing-order-done-btn",function(event){
            var tar=$(event.currentTarget).data("order");
            tar.Done();
        });

        $("#stall-info-submit").click(function(){
            var contentEdit={
                    "name":$("#stall-info-name").attr("value"),
                    "description":$("#stall-info-description").val()}
            int_stall_edit(contentEdit,function(){
                alert("update successfully");
            });
        });
        $("#stall-info-cancel").click(function(){
            dataMgr.LoadStoreInfo.call(dataMgr)
        });
        
        this.MenuInfo.on("click",".menu-info-item-display",function(event){
            var obj=fia(cache_menu,"id",$(event.currentTarget).data("obj").id);
            DivMenuInfoItemEdit=NewMenuInfoItemEdit(obj);
            $("#menu-info").append("<div id='black-out'></div>");
            $("#black-out").css("display","block");
            $("#black-out").append(DivMenuInfoItemEdit);
        });
        this.MenuInfo.on("click",".menu-info-edit-cancel-btn",function(event){
            DivMenuInfoItemEdit=null;
            $("#black-out").remove();
        });
        this.MenuInfo.on("click",".menu-info-edit-submit-btn",function(event){
            var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
            var obj={};
            // validate image
            if(img_invalid){
                alert("Image to be uploaded is invalid. If you want to submit the rest of the edited information, you may click the Reset Upload button");
                return;
            }
            // upload image if selected
            var files = DivMenuInfoItemEdit.find(".fileToUpload")[0].files;
            if(files && files[0]){
                uploadImage();
            }
            for (att_index in att_to_display){
                att=att_to_display[att_index];
                obj[att]=$($(DivMenuInfoItemEdit).find(".menu-info-edit-"+att)[0]).val();
            }
            obj["is_available"]=obj["is_available"]==1;
            obj["is_available_online"]=obj["is_available_online"]==1;
            obj["is_activated"]=obj["is_activated"]==1;
            obj["promotion_until"]=obj["promotion_until"]==""?null:obj["promotion_until"];
            obj["itemid"]=DivMenuInfoItemEdit.id;
            var canDel=true;
            if(!obj["is_activated"]){
                for(var i in DivProcessingOrderItem){
                    for (var j in DivProcessingOrderItem[i].children){
                        if (Number(DivProcessingOrderItem[i].children[j].item)==Number(obj.itemid)){
                            alert("Cannot deactivate this menu. Still have order being processing");
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
                    $("#black-out").remove();
                });
            }
        });
        $("#menu-info-add-btn").click(function(event){
            /*var obj={"img_location":"","name":"","is_activated":"","price":"","id":"",
                    "promotion_until":"","stall":"","is_available":"","promotion":"",
                    "is_available_online":"","description":""};*/
            DivMenuInfoItemAdd=NewMenuInfoItemAdd();
            $("#menu-info").append("<div id='black-out'></div>");
            $("#black-out").css("display","block");
            $("#black-out").append(DivMenuInfoItemAdd);
        });
        this.MenuInfo.on("click","#menu-info-add-cancel-btn",function(event){
            DivMenuInfoItemAdd=null;
            $("#black-out").remove();
        });
    
        this.MenuInfo.on("click","#menu-info-add-submit-btn",function(event){
            var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
            var obj={};
            var res=$(event.currentTarget).parent();
            for (att_index in att_to_display){
                att=att_to_display[att_index];
                obj[att]=$($(res).find("#menu-info-add-"+att)[0]).val();
            }
            obj["is_available"]=obj["is_available"]==1;
            obj["is_available_online"]=obj["is_available_online"]==1;
            obj["is_activated"]=obj["is_activated"]==1;
            obj["promotion_until"]=obj["promotion_until"]==""?null:obj["promotion_until"];
            obj["promotion"]=obj["promotion"]==""?null:obj["promotion"];
            obj["price"]=+obj["price"];
            int_stall_menu_item_add(obj,function(data){
                $("#black-out").remove();
                int_get_menu_item_install({stallid:stallUser["stall"]},function(data){
                    cache_menu=data.content;
                    uiMgr.ReloadMenu();
                });
            });
        });
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
            $('#imgUploadPreview').css("background-image", "url("+this.src+")");
        };
        image.onerror= function() {
            img_invalid = true;
            alert('Invalid file type: '+ file.type);
        };      
    };

}
function uploadImage()
{
    var xhr = new XMLHttpRequest();
    var fd = new FormData(id("imgForm"));
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
        alert(res);
        return;
    }
    alert("Image upload successful");
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
