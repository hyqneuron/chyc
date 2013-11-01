
// code generated in interface.py, and served directly through 
// interface.interfacejs

// an interface function would look like
// function int_xxx(obj, success_call, error_call=null)
// 2 types of errors may occur when you make these calls
//   a. ajax error (like cannot connect to server or page not found etc.)
//      To intercept ajax error you must override int_ajax_error_handler which
//      is defined later
//   b. app error. That means our backend has reported an err_code!=err_success
// When absolutely no error occurs, success_call is called
// When ajax error occurs, int_ajax_error_handler is called
// When app error occurs, error_call is called. If error_call is unspecified, 
// int_app_error_handler is called. You can override int_app_error_handler to
// use your own default handler, so you don't have to specify error_call
// everytime.
//
// I have supplied you with default error handlers for both errors, and you can
// take a look and write default handlers that integrate with your UI better


// default ajax failure handler
function _int_ajax_failed(xmlhttp, err, info)
{
    switch(xmlhttp.status)
    {
        case 0:
            alert("Cannot connect to server. Please check internet connection");
            break;
        case 404:
            alert("Request sent to an url that does not exist. Programmer error.");
            break;
        default:
            var errstr = "Something went wrong.\nerrtype: "+err+"\n";
            errstr += "info: " +info+"\n";
            errstr += "readyState: "+xmlhttp.readyState+"\n";
            errstr += "status: " + xmlhttp.status;
            alert(errstr);
    };
}

// default app error handler
function _int_app_failed(data) { alert(data.err_msg); }

// error handlers which you can override
var int_ajax_error_handler = _int_ajax_failed;
var int_app_error_handler = _int_app_failed;

// request maker
function _int_caller(req_code, obj, success_call, error_call)
{
    var fail_call = error_call? error_call : int_app_error_handler;
    var msg = {"req_code":req_code, "content": obj};
    $.ajax({
        url:'/interface/request/',
        type:'POST',
        data: JSON.stringify(msg),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function(data){
            if(data.err_code != err_success)
                fail_call(data);
            else success_call(data);
        },
        // when ajax error occurs, this handler is called
        error: int_ajax_error_handler
    });
}


function int_get_canteen_activated(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    _int_caller(1, obj, success_call, error_call);
}

function int_get_menu_item_install(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: stallid
    // return content:An array of menu_item table entries
    _int_caller(2, obj, success_call, error_call);
}

function int_get_menu_item_install_online(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: stallid
    // return content:An array of menu_item table entries
    _int_caller(3, obj, success_call, error_call);
}

function int_get_stall(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: stallid
    _int_caller(4, obj, success_call, error_call);
}

function int_get_stall_activated(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    _int_caller(5, obj, success_call, error_call);
}

function int_get_stall_in_canteen(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: canteenid
    // return content:An array of canteen table entries
    _int_caller(6, obj, success_call, error_call);
}

function int_get_stall_queue_length(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: stallid
    // return content:queue_length: integer representing queue length
    _int_caller(7, obj, success_call, error_call);
}

function int_login(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: username, password, domain
    // return content:a dictionary with attributes of the user being logged in. password is not returned
    _int_caller(8, obj, success_call, error_call);
}

function int_login_check_customer(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // return content:table entry for customer logged in. password is not returned. If user is not logged in, err_no_login code returns
    _int_caller(9, obj, success_call, error_call);
}

function int_login_check_ofs(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // return content:table entry for ofs_user logged in. password is not returned. If user is not logged in, err_no_login code returns
    _int_caller(10, obj, success_call, error_call);
}

function int_login_check_stall(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // return content:table entry for stall_user logged in. password is not returned. If user is not logged in, err_no_login code returns
    _int_caller(11, obj, success_call, error_call);
}

function int_login_payment(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: barcode
    // return content:user entry
    _int_caller(12, obj, success_call, error_call);
}

function int_logout(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    _int_caller(13, obj, success_call, error_call);
}

function int_stall_edit(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // request obj: name and description are optional arguments. When supplied, corresponding fields will be updated accordingly
    _int_caller(14, obj, success_call, error_call);
}

function int_stall_get_all_menu_item(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    // return content:An array of menu_item table entries
    _int_caller(15, obj, success_call, error_call);
}

function int_stall_get_processing_queue(obj, success_call, error_call)
{
    // request type 1. return type 3
    // required args: None
    // return content:parent = entry in order table; children=array of entries in order_item
    _int_caller(16, obj, success_call, error_call);
}

function int_stall_menu_item_add(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: name, description, price, is_available, is_available_online, promotion, promotion_until
    _int_caller(17, obj, success_call, error_call);
}

function int_stall_menu_item_edit(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: itemid
    // request obj: Optional args: name, description, price, is_available, is_available_online, is_activated, promotion, promotion_until
    // return content:return the updated menu_item entry
    _int_caller(18, obj, success_call, error_call);
}

function int_stall_order_complete(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: orderid
    // return content:returns the modified order entry
    _int_caller(19, obj, success_call, error_call);
}

function int_stall_order_revoke(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: orderid, notify
    // return content:returns the modified order entry
    _int_caller(20, obj, success_call, error_call);
}

function int_stall_order_submit(obj, success_call, error_call)
{
    // request type 2. return type 1
    // required args: customer_barcode, collection
    // request obj: collection=An array of {itemid, quantity, remarks}
    _int_caller(21, obj, success_call, error_call);
}

function int_stall_report(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // return content:yearRevenue, yearOrderSize, monthRevenue, monthOrderSize, todayRevenue, todayOrderSize
    _int_caller(22, obj, success_call, error_call);
}

function int_ofs_canteen_add(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: name, description
    // return content:returns the created canteen entry
    _int_caller(23, obj, success_call, error_call);
}

function int_ofs_canteen_edit(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: canteenid
    // request obj: name and description are optional values
    // return content:return the modified canteen entry
    _int_caller(24, obj, success_call, error_call);
}

function int_ofs_canteen_report(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: canteenid
    // return content:yearRevenue, yearOrderSize, monthRevenue, monthOrderSize, todayRevenue, todayOrderSize
    _int_caller(25, obj, success_call, error_call);
}

function int_ofs_canteen_setactivated(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: canteenid, value
    // return content:return the modified canteen entry
    _int_caller(26, obj, success_call, error_call);
}

function int_ofs_customer_add(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: username, barcode, password, usertype
    // return content:return the created customer entry
    _int_caller(27, obj, success_call, error_call);
}

function int_ofs_customer_edit(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: customerid
    // request obj: optional arg: password, is_activated
    // return content:returns the updated customer entry
    _int_caller(28, obj, success_call, error_call);
}

function int_ofs_customer_get(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: customerid
    // return content:return the customer obj
    _int_caller(29, obj, success_call, error_call);
}

function int_ofs_customer_get_activated(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    // return content:return an array of "activated" customer objects
    _int_caller(30, obj, success_call, error_call);
}

function int_ofs_customer_get_all(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    // return content:return an array of customer objects
    _int_caller(31, obj, success_call, error_call);
}

function int_ofs_customer_get_page(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: page_num
    // request obj: page_num is the page index
    // return content:return an array of customer objects on page page_num
    _int_caller(32, obj, success_call, error_call);
}

function int_ofs_customer_getbybarcode(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: customerid
    // return content:return the customer obj
    _int_caller(33, obj, success_call, error_call);
}

function int_ofs_customer_getbyusername(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: customerid
    // return content:return the customer obj
    _int_caller(34, obj, success_call, error_call);
}

function int_ofs_customer_mass_add(obj, success_call, error_call)
{
    // request type 2. return type 1
    // required args: collection
    // request obj: an array of new customer list with ['username','barcode','password','usertype']
    _int_caller(35, obj, success_call, error_call);
}

function int_ofs_customer_mass_deactivate(obj, success_call, error_call)
{
    // request type 2. return type 1
    // required args: collection
    // request obj: an array of {barcode:xxx}
    _int_caller(36, obj, success_call, error_call);
}

function int_ofs_customer_page_count(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // return content:Count the number of customer pages we have. return {page_count: number_of_pages}
    _int_caller(37, obj, success_call, error_call);
}

function int_ofs_customer_topup(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: customerid, value
    // return content:return the customer obj
    _int_caller(38, obj, success_call, error_call);
}

function int_ofs_ofsuser_add(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: username, password, usertype, name
    _int_caller(39, obj, success_call, error_call);
}

function int_ofs_ofsuser_edit(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: ofsuid
    // request obj: optional arg: password, is_activated
    // return content:return the updated ofs_user entry
    _int_caller(40, obj, success_call, error_call);
}

function int_ofs_ofsuser_get(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: ofsuid
    _int_caller(41, obj, success_call, error_call);
}

function int_ofs_ofsuser_get_activated(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    // return content:return an array of "activated" ofs_user objects
    _int_caller(42, obj, success_call, error_call);
}

function int_ofs_ofsuser_get_all(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    // return content:return an array of ofs_user objects
    _int_caller(43, obj, success_call, error_call);
}

function int_ofs_report(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // return content:yearRevenue, yearOrderSize, monthRevenue, monthOrderSize, todayRevenue, todayOrderSize
    _int_caller(44, obj, success_call, error_call);
}

function int_ofs_stall_add(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: name, description, canteen, category, username_prefix
    // request obj: A manager and an operator account will be created, with password=password, and username=username_prefix_{op/mgr}
    // return content:returns creatd stall entry
    _int_caller(45, obj, success_call, error_call);
}

function int_ofs_stall_deactivate(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: stallid
    _int_caller(46, obj, success_call, error_call);
}

function int_ofs_stall_edit(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: name
    // request obj: optional args: description, canteen, category, is_activated
    _int_caller(47, obj, success_call, error_call);
}

function int_ofs_stall_report(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: stallid
    // return content:yearRevenue, yearOrderSize, monthRevenue, monthOrderSize, todayRevenue, todayOrderSize
    _int_caller(48, obj, success_call, error_call);
}

function int_ofs_stall_reset_mgrpwd(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: stallid
    _int_caller(49, obj, success_call, error_call);
}

function int_ofs_stalluser_add(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: username, password, usertype, stall, name
    _int_caller(50, obj, success_call, error_call);
}

function int_ofs_stalluser_edit(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: stalluid
    // request obj: optional arg: password, is_activated
    // return content:returns the updated stall_user entry
    _int_caller(51, obj, success_call, error_call);
}

function int_ofs_stalluser_get(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: stalluid
    _int_caller(52, obj, success_call, error_call);
}

function int_ofs_stalluser_get_activated(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    // return content:return an array of "activated" stall_user objects
    _int_caller(53, obj, success_call, error_call);
}

function int_ofs_stalluser_get_all(obj, success_call, error_call)
{
    // request type 1. return type 2
    // required args: None
    // return content:return an array of stall_user objects
    _int_caller(54, obj, success_call, error_call);
}

function int_cus_change_settings(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: password, hpnumber
    // request obj: change settings for customer logged in
    // return content:return the updated entry of the currently logged-in customer, no password contained
    _int_caller(55, obj, success_call, error_call);
}

function int_cus_get_cart(obj, success_call, error_call)
{
    // request type 1. return type 3
    // required args: None
    // request obj: get cart_items of default customer cart
    // return content:return all cart_item in current customer's default cart, parent is cart_item, children is a single menu_item
    _int_caller(56, obj, success_call, error_call);
}

function int_cus_get_customer(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // request obj: get information of the customer who's been logged in
    // return content:return the entry of the currently logged-in customer
    _int_caller(57, obj, success_call, error_call);
}

function int_cus_pay(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: None
    // request obj: pay for items in cart, and clear cart
    _int_caller(58, obj, success_call, error_call);
}

function int_cus_pay_canteen(obj, success_call, error_call)
{
    // request type 1. return type 1
    // required args: canteenid
    // request obj: pay for items in cart in specific canteen, and clear those items
    _int_caller(59, obj, success_call, error_call);
}

function int_cus_set_cart(obj, success_call, error_call)
{
    // request type 2. return type 2
    // required args: collection
    // request obj: set cart_items of default customer cart, collection is array of cart_item entries
    // return content:return all cart_item in current customer's default cart
    _int_caller(60, obj, success_call, error_call);
}


// errmsgs - error mesage dictionary. key = err_code and value = error message.
// for your reference only, since the proper err_msg is always returned by the server
errmsgs = []; 

err_api = 2;
errmsgs[2]="API parameter error";

err_api_badval = 4;
errmsgs[4]="Bad values supplied in API parameters";

err_barcode_invalid = 20;
errmsgs[20]="The barcode does not correspond to any customer";

err_cannot_revoke = 27;
errmsgs[27]="Order is already completed, and cannot be revoked.";

err_canteen_cannotdeact = 39;
errmsgs[39]="The canteen cannot be deactivated as it still contains active stalls";

err_creating_entry = 21;
errmsgs[21]="Error in creating new table entry. Something wrong in parameters";

err_cus_cart_failed = 40;
errmsgs[40]="Cannot save to cart. Some items are invalid";

err_cus_empty_cart = 41;
errmsgs[41]="Cart is empty. No payment can be made";

err_customer_replicate_barcode = 33;
errmsgs[33]="Trying to register with existing barcode";

err_customer_replicate_username = 32;
errmsgs[32]="Trying to register with existing username";

err_id_notfound = 18;
errmsgs[18]="The id used in the query is invalid.";

err_incorrect_domain = 6;
errmsgs[6]="Please specify correct user domain.";

err_incorrect_login = 7;
errmsgs[7]="The login information you gave was incorrect";

err_insufficient_balance = 28;
errmsgs[28]="Payment failed. Insufficient balance.";

err_invalid_info_submitted = 24;
errmsgs[24]="The information submitted is invalid. Please check";

err_invalid_item_submitted = 23;
errmsgs[23]="The requested order contains invalid items";

err_low_balance = 29;
errmsgs[29]="Payment successful, but customer's balance is low.";

err_mass_creation_failed = 42;
errmsgs[42]="Mass creation failed";

err_mass_deactivate_notfound = 34;
errmsgs[34]="Some of the customers being deactivated do not exist";

err_missing_obj = 25;
errmsgs[25]="There is no such object in database.";

err_no_access_rights = 10;
errmsgs[10]="The user has does not have the access right to this function.";

err_no_login = 5;
errmsgs[5]="You are not logged in";

err_not_implemented = 3;
errmsgs[3]="API not yet implemented.";

err_ofs_login = 9;
errmsgs[9]="You are not logged in as an ofs user.";

err_order_notfound = 19;
errmsgs[19]="The specified order does not exist";

err_payment_allfailed = 30;
errmsgs[30]="";

err_payment_partfailed = 31;
errmsgs[31]="";

err_stall_login = 8;
errmsgs[8]="You are not logged in as a stall user.";

err_stall_managername = 35;
errmsgs[35]="The manager username cannot be used.";

err_stall_mgr_notfound = 38;
errmsgs[38]="The manager account of the stall cannot be found.";

err_stall_notfound = 37;
errmsgs[37]="The specified stall is not found";

err_stall_operatorname = 36;
errmsgs[36]="The operator username cannot be used.";

err_sth_wrong = 26;
errmsgs[26]="something wrong";

err_success = 0;
errmsgs[0]="Operation succeeded.";

err_unknown = 1;
errmsgs[1]="Oops, something went wrong in the server :( debug time";

err_vali_badbarcode = 14;
errmsgs[14]="Invalid barcode";

err_vali_badhpnumber = 17;
errmsgs[17]="Invalid handphone number";

err_vali_badpassword = 16;
errmsgs[16]="Invalid password";

err_vali_badusername = 15;
errmsgs[15]="Invalid username";

err_vali_badval = 13;
errmsgs[13]="Invalid values submitted";

err_vali_notunique = 12;
errmsgs[12]="Certain values not unique in database. This is most likely the name/username/barcode field";

err_vali_null_contained = 11;
errmsgs[11]="Certain values should not be empty";

err_value_incorrect = 22;
errmsgs[22]="Value supplied are of incorrect type";
