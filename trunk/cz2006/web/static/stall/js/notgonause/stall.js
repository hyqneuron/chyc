var cache_menu;
var user_info;
var cart_info=new Object();
var cache_processing_queue=[];
var queue_check_timer;
var img_invalid;


function id(n) {return document.getElementById(n);}
function ja(o) {alert(JSON.stringify(o));}
function my_fail(data){alert(data.err_msg);}
function itemid_to_name(id){
    for(entry in cache_menu){
        if(cache_menu[entry].id==id){
            return cache_menu[entry].name;
        }
    }
}   
function is_numeric(input)
{
    return (input - 0) == input && (input+'').replace(/^\s+|\s+$/g, "").length > 0;
}
function cart_item(itemid,quantity,remarks){
    this.itemid=itemid;
    this.quantity=quantity;
    this.remarks=remarks;
}
function cart_entry(cart_item, div)
{
    this.cart_item = cart_item;
    this.cart_div = div;
}

function passLogin(data)
{
    //get user info
    user_info=data.content;

    //UI set up
    $("#loginForm").hide();
    $("#wrapper").show();
    $("#stall-management").hide();
    $("#processing-order").hide();
    $("#take-order").show();
    if(user_info["usertype"]!="M"){
        $("[href='stall-management']").hide();
    }
    $("#userName").html(user_info.username);
    $("#password").val("");

    refresh_menu();

    //processing-order content loading
    int_stall_get_processing_queue({},update_cache_processing_queue);
    queue_check_timer = window.setInterval(function(){int_stall_get_processing_queue({},update_cache_processing_queue)}, 5000);
    
    //stall-management content loading
    //--load stall info page
    display_stall_info();
}

//to add both menu in take-order page and menu-info page
//need to clear both page before call this function if refresh is intended
function load_menu(){
    //take-order page content loading
    int_get_menu_item_install({stallid:user_info["stall"]},function(data){
        cache_menu=data.content;
        display_order_menu();
        //--load menu info page
        display_menu_info();
    });
}

function refresh_menu(){
    $("#menu>.menu-item").remove();
    $("#menu-info>.menu-info-item-display").remove();
    load_menu();
}
function display_order_menu(){
    $.each(cache_menu,function(index,value){
        if(value["is_activated"]){
            var menu_item_temp=$("#menu-item-template").clone().css("display","").attr("id","");
            $(menu_item_temp).find(".menu-item-name")[0].innerHTML=value["name"];
            $(menu_item_temp).find(".menu-item-price")[0].innerHTML="$"+value["price"];
            menu_item_temp.appendTo("#menu").data("menu_item", value);
        }
    });
}
function addOrder(order, beforediv)
{
    var div = $("#processing-order-item-templates").clone().attr("id","");//.appendTo("#processing-order");
    // add queue number into info
    $(div.find(".processing-order-info")).append("<li>Q num:"+order["parent"]["queue_num"]+"</li>");
    // prepare table
    var detailEntry="<table class='processing-order'>"
    for(entry in order["children"]){
        var temp=order["children"][entry];
        detailEntry+="<tr><td>"+itemid_to_name(temp["item"])+"</td><td>"+temp["quantity"]+"</td><td>"+temp["remarks"]+"</td></tr>";
    }
    detailEntry+="</table>"
    // add table into details
    div.find(".processing-order-details").append(detailEntry);
    if(beforediv)
        $(beforediv).before(div);
    else
        div.appendTo("#processing-order");
    div.children(".processing-order-form").data("orderid",order["parent"].id);
    return div;
}
function mylogin()
{
    var obj={username:id("username").value,
        password:id("password").value,
        domain:"stall_user"};
    int_login(obj, passLogin);
}

//precondition: item in cart 
function change_quantity_in_cart(itemid,mode){
    if(mode==1){
        cart_info[itemid].cart_item.quantity+=1;
        cart_info[itemid].cart_div.find(".cart-item-quantity")[0].value=cart_info[itemid].cart_item.quantity;
    }else if(mode==0){
        $(cart_info[itemid].cart_div).remove();
        delete cart_info[itemid]; 
    }else if(mode==-1){
        if(cart_info[itemid].cart_item.quantity==1){
            return;
        }
        cart_info[itemid].cart_item.quantity-=1;
        cart_info[itemid].cart_div.find(".cart-item-quantity")[0].value=cart_info[itemid].cart_item.quantity;
    }
        
}
function menu_item_click(evt)
{
    var item = $(evt.currentTarget).data("menu_item");
    var itemid=item.id;
    if(itemid in cart_info){
        change_quantity_in_cart(itemid,1);
    }else{
        citem = new cart_item(itemid, 1, "");
        var div = $("#cart-item-template").clone().css("display","").attr("id","");
        div.find(".cart-item-quantity")[0].value='1';
        $(div.find(".cart-item-name")[0]).append(item.name);
        $(div.find(".cart-item-price")[0]).append(item.price);
        $(div.find(".plus")[0]).data("itemid",itemid);
        $(div.find(".minus")[0]).data("itemid",itemid);
        $(div.find(".trash")[0]).data("itemid",itemid);
        $(div.find(".cart-item-quantity")[0]).data("itemid",itemid);
        div.appendTo("#cart-items");
        cart_info[itemid]= new cart_entry(citem, div);
    }
}
function clear_order_cart_without_warning(){
    cart_info={};
    $("#cart-items").empty();
}

function clear_order_cart(){
    if(confirm("Clear Order?")){
        clear_order_cart_without_warning();
    }
}

function submit_order(){
    var confirm_msg="Order details:\n";
    var cart_submit_collection=new Array();
    for (cart_entry in cart_info){
        confirm_msg+=itemid_to_name(cart_info[cart_entry].cart_item.itemid);
        cart_submit_collection.push(cart_info[cart_entry].cart_item);
        confirm_msg+="\t"+cart_info[cart_entry].cart_item.quantity;
        confirm_msg+="\t"+cart_info[cart_entry].cart_item.remarks+"\n";
    }
    confirm_msg+="Please confirm the order. Click OK to proceed to payment.\n";

    if(confirm(confirm_msg)){
    //payment need to be implemented here
    //
        var obj={
        customer_barcode: id("barcode").value,//to be change later
            collection:cart_submit_collection};
        int_stall_order_submit(obj,function(data){
                alert("Order Submitted");
                clear_order_cart_without_warning();
                int_stall_get_processing_queue({},update_cache_processing_queue);
        });
    }
}

function update_cache_processing_queue(data){
    ja(data.content);
    for(order_in_cache in cache_processing_queue){
        var found=false;
        for(order in data["content"]){
            if(cache_processing_queue[order_in_cache].parent.id==data["content"][order].parent.id){
                found=true;
            }
        }
        if(!found){
            $(cache_processing_queue[order_in_cache].div).remove();
            cache_processing_queue.splice(order_in_cache,1);
        }
    }

    for(order in data["content"]){
        var found=false;
        for(order_in_cache in cache_processing_queue){
            if(data["content"][order]["parent"].id==cache_processing_queue[order_in_cache]["parent"].id){
                found=true;
            }
        }
        if(!found){
            var divbefore = null;
            var index = 0;
            for(index = 0; index<cache_processing_queue.length; index++)
            {
                if(cache_processing_queue[index].parent.payment_time>= data.content[order].parent.payment_time)
                {
                    divbefore = cache_processing_queue[index].div;
                    break;
                }
            }
            data.content[order].div = addOrder(data.content[order], divbefore);
            cache_processing_queue.splice(index, 0, data.content[order]);
        }                    
    }
}
function display_stall_info(){
    int_get_stall({"stallid":user_info.stall},function(data){
        $("#stall-info-name").val(data["content"]["name"]);
        $("#stall-info-description").val(data["content"]["description"]);
    });
}
function display_menu_info(){
    for(i in cache_menu){
        var menu=cache_menu[i];
        var entry=$("#menu-info-item-display-template").clone().attr("style","").attr("id","");
        var att_to_display=["name","promotion_until","promotion","description"];
        if(!menu["is_activated"]){
            $(entry).css("background-color","grey");
        }
        if(!menu["is_available_online"]){
            $(entry).find(".is_available_online-data")[0].innerHTML="offline";
        }else{
            $(entry).find(".is_available_online-data")[0].innerHTML="online";
        }
        $(entry).find(".price-data")[0].innerHTML="$"+menu["price"];
        for (j in att_to_display){
            att=att_to_display[j];
            $(entry).find("."+att+"-data")[0].innerHTML=menu[att];
        }
        $(entry).data("menuid",menu.id);
        entry.find(".image-data").css("background-image", "url("+menu.img_location+")");
        entry.appendTo("#menu-info").data("menu_item",menu);
    }
}
//blackout the page if control=1
//resume if control=0
function blackout(control){
    if(control==1){
        $("#menu-info").append("<div id='black-out'></div>");
        $("#black-out").css("display","block");
    }else if(control==0){
        $("#black-out").remove();
    }
}


$(document).ready(function(){
    // perform login check
    int_login_check_stall({},passLogin,function (data){
        $("#wrapper").hide();
        $("#loginForm").show();
        $("#loginSubmit").click(mylogin);
    });

    // set up click events
    $("nav").on("click","ul li a",function nav_click(event){
        event.preventDefault();
        var target=$(event.currentTarget).attr("href");
        $("#take-order").hide();
        $("#processing-order").hide();
        $("#stall-management").hide();
        $("#"+target).show();
    });
    $("#sub-nav").on("click","li a",function sub_nav_click(event){
        event.preventDefault();
        var target=$(event.currentTarget).attr("href");
        $("#stall-info").hide();
        $("#menu-info").hide();
        $("#report").hide();
        $("#"+target).show();
    });
    $("#menu").on("click",".menu-item", menu_item_click);

    $("#logout").click(function(event){
        user_info=null;
        int_logout({},function(data){
            $("#wrapper").hide();
            $("#loginForm").show();
            clearInterval(queue_check_timer);
        });
    });
    $("#cancel-order").click(clear_order_cart);
    $("#confirm-order").click(submit_order);
    $("#order-cart").on("click",".plus",function(event){
        change_quantity_in_cart($(event.currentTarget).data("itemid"),1);
    });
    $("#order-cart").on("click",".minus",function(event){
        change_quantity_in_cart($(event.currentTarget).data("itemid"),-1);
    });
    $("#order-cart").on("click",".trash",function(event){
        change_quantity_in_cart($(event.currentTarget).data("itemid"),0);
    });
    $("#order-cart").on("change",".cart-item-quantity",function(event){
        var itemid=$(event.currentTarget).data("itemid");
        if(is_numeric($(event.currentTarget).val())){
            cart_info[itemid].cart_item.quantity=$(event.currentTarget).val()-0;
            cart_info[itemid].cart_div.find(".cart-item-quantity")[0].value=cart_info[itemid].cart_item.quantity;
        }else{
            alert("Invalid input");
        }
    });

    $("#processing-order").on("click",".processing-order-done-btn",function(event) {
        var orderid=$(event.currentTarget).parent().data("orderid");
        int_stall_order_complete({"orderid":orderid},function(data){
            for(var i = 0; i<cache_processing_queue.length; i++){
                if(cache_processing_queue[i].parent.id==data.content.id){
                    $(cache_processing_queue[i].div).remove();
                    cache_processing_queue.splice(i,1);
                    break;
                }
            }
       });
    });
    
    $("#processing-order").on("click",".processing-order-revoke-btn",function(event){
        var orderid=$(event.currentTarget).parent().data("orderid");
    });

    $("#stall-info-submit").click(function(){
        var contentEdit={"name":$("#stall-info-name").attr("value"),"description":$("#stall-info-description").val()}
        int_stall_edit(contentEdit,function(){
            alert("update successfully");
        });
    });
    $("#stall-info-cancel").click(display_stall_info);
    $("#menu-info").on("click",".menu-info-item-display",function (event){
        blackout(1);         
        editWindow=$("#menu-info-item-edit-template").clone().attr("style","","id","").css("z-index",101);

        var menuTar;
        for (menuIndex in cache_menu){
            if (cache_menu[menuIndex].id==$(event.currentTarget).data("menuid")){
                menuTar=cache_menu[menuIndex];
                break;
            }
        }
        editWindow.data("menu_item", menuTar);
        menuTar["is_activated"]=menuTar["is_activated"]?1:0;
        menuTar["is_available"]=menuTar["is_available"]?1:0;
        menuTar["is_available_online"]=menuTar["is_available_online"]?1:0;
        var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
        for (j in att_to_display){
            att=att_to_display[j];
            $($(editWindow).find(".menu-info-edit-"+att)[0]).val(menuTar[att]);
        }
        $($(editWindow).find(".menu-info-edit-submit-btn")).data("itemid",menuTar.id);
        editWindow.find(".fileToUpload").change(uploadChange);
        editWindow.find(".resetUploadBut").click(resetUpload);
        editWindow.find("#itemid").val(menuTar['id']);
        editWindow.find(".image-data").css("background-image", "url("+menuTar.img_location+")");

        editWindow.appendTo("#black-out");
    });
    
    $("#menu-info").on("click","#menu-info-add-btn",function (event){
        blackout(1);         
        editWindow=$("#menu-info-item-edit-template").clone().attr({"style":"","id":"menu-info-item-add",}).css("z-index",101);
        editWindow.appendTo("#black-out");
        $.each($(editWindow).find("[class]"),function(key,value){
            $(value).attr({"id":"menu-info-add"+$(value).attr("class").substring(14),"class":""});
        });
        $(editWindow).on("click","#menu-info-add-cancel-btn",function(event){
            blackout(0);
        });
        
        $(editWindow).on("click","#menu-info-add-submit-btn",function(event){
            var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
            var obj={};
            var editWindow=$(event.currentTarget).parent();
            for (att_index in att_to_display){
                att=att_to_display[att_index];
                obj[att]=$($(editWindow).find("#menu-info-add-"+att)[0]).val();
            }
            obj["is_available"]=obj["is_available"]==1;
            obj["is_available_online"]=obj["is_available_online"]==1;
            obj["is_activated"]=obj["is_activated"]==1;
            obj["promotion_until"]=obj["promotion_until"]==""?null:obj["promotion_until"];
            obj["promotion"]=obj["promotion"]==""?null:obj["promotion"];
            obj["price"]=+obj["price"];
            int_stall_menu_item_add(obj,function(data){
                refresh_menu();
                blackout(0);
            });
        });
        
    });
    $("#menu-info").on("click",".menu-info-edit-cancel-btn",function(event){
        blackout(0);
    });
    $("#menu-info").on("click",".menu-info-edit-submit-btn",function(event){
        var att_to_display=["name","is_activated","price","promotion_until","is_available","promotion","is_available_online","description"]
        var obj={};
        var editWindow=$(event.currentTarget).parent();
        // validate image
        if(img_invalid){
            alert("Image to be uploaded is invalid. If you want to submit the rest of the edited information, you may click the Reset Upload button");
            return;
        }
        // upload image if selected
        var files = editWindow.find(".fileToUpload")[0].files;
        if(files && files[0]){
            uploadImage();
        }
        for (att_index in att_to_display){
            att=att_to_display[att_index];
            obj[att]=$($(editWindow).find(".menu-info-edit-"+att)[0]).val();
        }
        obj["is_available"]=obj["is_available"]==1;
        obj["is_available_online"]=obj["is_available_online"]==1;
        obj["is_activated"]=obj["is_activated"]==1;
        obj["promotion_until"]=obj["promotion_until"]==""?null:obj["promotion_until"];
        obj["itemid"]=$(event.currentTarget).data("itemid");
        int_stall_menu_item_edit(obj,function(data){
            refresh_menu();
            blackout(0);
        });
    });
});

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
function uploadChange(e) {
    if(this.disabled) return alert('File upload not supported!');
    var F = this.files;
    if(F && F[0]) 
        readImage( F[0] );
}
function resetUpload(e){
    var editWindow = $(e.currentTarget.parentElement.parentElement);
    var item = editWindow.data("menu_item");
    editWindow.find(".fileToUpload")[0].files = null;
    // reset image to original
    id("imgForm").reset();
    editWindow.find("#itemid").val(item.id);
    editWindow.find(".image-data").css("background-image", "url("+item.img_location+")");
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
function uploadFailed()
{
}
function uploadCanceled()
{
}
