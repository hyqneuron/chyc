error_code = -1

def adder(msg):
    global error_code
    error_code += 1
    return (error_code, msg);

# return an error object with modified error message
def err_mod_msg(err, msg):
    return (err[0], msg)

err_success = adder("Operation succeeded.")											

"""
1. API data argument missing
2. API argument type incorrect
3. object does not exist
4. Entry cannot be created
    replicate ***
"""


# unknwo error	#err_code:1
err_unknown = adder("Oops, something went wrong in the server :( debug time")

# api errors	#err_code:2,3,4
err_api = adder("API parameter error")
err_not_implemented = adder("API not yet implemented.")
err_api_badval=adder("Bad values supplied in API parameters")

# login errors	#err_code:5,6,7,8,9,10
err_no_login = adder("You are not logged in")
err_incorrect_domain = adder("Please specify correct user domain.")
err_incorrect_login = adder("The login information you gave was incorrect")
err_stall_login = adder("You are not logged in as a stall user.")
err_ofs_login = adder("You are not logged in as an ofs user.")
err_no_access_rights = adder("The user has does not have the access right to this function.")

# validation error generated in valid*		#err_code:11,12,13,14,15,16,17
err_vali_null_contained = adder("Certain values should not be empty")
err_vali_notunique = adder("Certain values not unique in database. This is most likely the name/username/barcode field")
err_vali_badval = adder("Invalid values submitted")
err_vali_badbarcode = adder("Invalid barcode")
err_vali_badusername = adder("Invalid username")
err_vali_badpassword = adder("Invalid password")
err_vali_badhpnumber = adder("Invalid handphone number")

# data error	#err_code:18,19,20,21,22,23,24,25,26,27
err_id_notfound = adder("The id used in the query is invalid.")
err_order_notfound=adder("The specified order does not exist")
err_barcode_invalid = adder("The barcode does not correspond to any customer")
err_creating_entry = adder("Error in creating new table entry. Something wrong in parameters")
err_value_incorrect = adder("Value supplied are of incorrect type")
err_invalid_item_submitted = adder("The requested order contains invalid items")
err_invalid_info_submitted = adder("The information submitted is invalid. Please check")
err_missing_obj = adder("There is no such object in database.")
err_sth_wrong = adder("something wrong")

err_cannot_revoke=adder("Order is already completed, and cannot be revoked.")
# transaction error		#err_code:28,29
err_insufficient_balance=adder("Payment failed. Insufficient balance.")
err_low_balance = adder("Payment successful, but customer's balance is low.")
# these two errors must have their err msg overwritten		#err_code:30,31
err_payment_allfailed = adder("")
err_payment_partfailed = adder("")

# ofs user control error	#err_code:32,33,34
err_customer_replicate_username=adder("Trying to register with existing username")
err_customer_replicate_barcode=adder("Trying to register with existing barcode")
err_mass_deactivate_notfound=adder("Some of the customers being deactivated do not exist")

# ofs stall creation error		#err_code:35,36,37,38,39,40,41,42
err_stall_managername = adder("The manager username cannot be used.")
err_stall_operatorname = adder("The operator username cannot be used.")
err_stall_notfound = adder("The specified stall is not found")
err_stall_mgr_notfound=adder("The manager account of the stall cannot be found.")
err_canteen_cannotdeact=adder("The canteen cannot be deactivated as it still contains active stalls")

err_cus_cart_failed = adder("Cannot save to cart. Some items are invalid")
err_cus_empty_cart = adder("Cart is empty. No payment can be made")


err_mass_creation_failed = adder("Mass creation failed")


class cams_ex(Exception):
    def __init__(self, errobj, errmsg=None):
        self.err_obj = errobj
        self.err_msg = errmsg
    def getErrMsg(self):
        if self.err_msg:
            return self.err_msg
        else:
            return self.err_obj[1]
