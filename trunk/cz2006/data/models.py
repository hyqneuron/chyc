from datetime import *
import json

from django.core import serializers
from django.core.exceptions import ValidationError
from django.db import models, IntegrityError

from web.interface.error import *


#If we serialize an entry directly, Django gives an object that is
#unnecessarily complex. This function simplifies the object, and removes
#attributes that we do not want to show to the front end (e.g. password)
def get_simplified(model, excluded):
    dump = serializers.serialize('json', [model,])
    load = json.loads(dump)[0]
    fields = load['fields']
    fields['id'] = load['pk']
    for ex in excluded:
        fields.pop(ex, None)
    return fields

_err_type = 1
_err_unique=2




class settings(models.Model):
    name        = models.CharField(max_length=20, unique=True)
    string      = models.CharField(max_length=200)
    integer     = models.IntegerField()
    decimal     = models.DecimalField(max_digits=10, decimal_places=2)
    json_excluded=[]
    def __unicode__(self):
        return self.name
    def get_json_dict(self):
        return get_simplified(self, settings.json_excluded)


#======================Classes begin here=================================

class ofs_user(models.Model):
    operator = 'O'
    manager  = 'M' 
    types = ((operator, 'Operator'),(manager, 'Manager'),)
    username    = models.CharField(max_length=20, unique=True)
    password    = models.CharField(max_length=20)
    usertype    = models.CharField(max_length=1, choices=types)
    name        = models.CharField(max_length=40)
    is_activated   = models.BooleanField(default=True)
    json_excluded=['password']
    def get_json_dict(self):
        return get_simplified(self, ofs_user.json_excluded)

class customer(models.Model):
    student = 'S'
    staff = 'A'
    visitor = 'V'
    types = ((student, 'Student'),(staff, 'Staff'),(visitor, 'Visitor'),)

    username    = models.CharField(max_length=20, unique=True)
    barcode     = models.CharField(max_length = 20, unique=True)
    password    = models.CharField(max_length=20, default="xxxx1234")
    usertype    = models.CharField(max_length=7, choices=types, default=student)
    hpnumber    = models.CharField(max_length=20, default="")
    balance     = models.DecimalField(decimal_places=2, max_digits=9, default=0)
    is_activated= models.BooleanField(default=True)
    json_excluded=["password"]
    def __unicode__(self):
        return self.username
    def get_json_dict(self):
        return get_simplified(self, customer.json_excluded)
    def build_cart(self):
        if self.cart_set.exists():
            return
        newcart = cart(customer=self)
        newcart.save()
    def get_default_cart(self):
        return self.cart_set.all()[0]
        

class canteen(models.Model):
    name        = models.CharField(max_length=40, unique=True)
    description = models.CharField(max_length=400)
    is_activated= models.BooleanField(default=True)
    #location = models.CharField(max_length=100)?
    json_excluded=[]
    def __unicode__(self):
        return self.name
    def get_json_dict(self):
        return get_simplified(self, canteen.json_excluded)

    def buildQueueTable(self):
        if len(canteen_queues.objects.filter(canteen=self))!=0:
            raise Exception("This canteen's queue table has been built before")
        for num in range(1, 1000):
            qentry = canteen_queues(canteen=self, queue_num=num, 
                last_time=datetime.now())
            qentry.save()
            if num%10==0:
                print num

class canteen_queues(models.Model):
    """
    the queue logic is found in common.py, get_queue_number and return_queue_number
    """
    canteen      = models.ForeignKey(canteen);
    queue_num    = models.IntegerField();
    customer     = models.ForeignKey(customer, null=True);
    order_count  = models.IntegerField(default=0);
    last_time    = models.DateTimeField();

"""
class category(models.Model):
    name        = models.CharField(max_length=40, unique=True)
    def add(_name):
        newcat = 
"""

class stall(models.Model):
    name        = models.CharField(max_length=40)
    description = models.CharField(max_length=400)
    canteen = models.ForeignKey(canteen)
    category    = models.CharField(max_length=20)
    is_activated= models.BooleanField(default=True)
    username_prefix=models.CharField(max_length=17)
    json_excluded=[]
    def __unicode__(self):
        return canteen.objects.get(id=self.canteen.id).name+":"+self.name
    def get_json_dict(self):
        return get_simplified(self, stall.json_excluded)

class cart(models.Model):
    customer    = models.ForeignKey(customer)
    json_excluded=[]
    def get_json_dict(self):
        return get_simplified(self, cart.json_excluded)

class stall_user(models.Model):
    operator = 'O'
    manager  = 'M' 
    types = ((operator, 'Operator'),(manager, 'Manager'),)
    username    = models.CharField(max_length=20, unique=True)
    password    = models.CharField(max_length=20)
    usertype    = models.CharField(max_length=1, choices=types)
    name        = models.CharField(max_length=40)
    is_activated   = models.BooleanField(default=True)
    stall       = models.ForeignKey(stall)
    json_excluded=['password']

    def __unicode__(self):
        return self.username
    def get_json_dict(self):
        return get_simplified(self, stall_user.json_excluded)
        

class menu_item(models.Model):
    # fields
    stall       = models.ForeignKey(stall)
    name        = models.CharField(max_length=40)
    description = models.CharField(max_length=400)
    price       = models.DecimalField(decimal_places=2, max_digits=5)
    is_available   = models.BooleanField(default=True)
    is_available_online = models.BooleanField(default=False)
    is_activated= models.BooleanField(default=True)
    promotion   = models.DecimalField(decimal_places=2, max_digits=3, default=1.00)
    promotion_until = models.DateTimeField('Promotion expires on', null=True)
    img_location= models.CharField(max_length=100)
    json_excluded=[]

    # printer
    def __unicode__(self):
        return self.name
    def get_json_dict(self):
        return get_simplified(self, menu_item.json_excluded)
        

class cart_item(models.Model):
    # fields
    cart        = models.ForeignKey(cart)
    item        = models.ForeignKey(menu_item)
    quantity    = models.PositiveIntegerField()
    remarks     = models.CharField(max_length=20, null=True)
    json_excluded=[]
    def get_json_dict(self):
        return get_simplified(self, cart_item.json_excluded)


class order(models.Model):
    # fields
    customer    = models.ForeignKey(customer)
    stall       = models.ForeignKey(stall)
    queue_num   = models.IntegerField()
    is_finished    = models.BooleanField(default=False)
    payment_time= models.DateTimeField('Time of payment')
    finish_time = models.DateTimeField('Time when processing was finished.',
                    null=True, default=None)
    json_excluded=[]
    def get_json_dict(self):
        return get_simplified(self, order.json_excluded)

class order_item(models.Model):
    # fields
    order       = models.ForeignKey(order)
    item        = models.ForeignKey(menu_item)
    quantity    = models.PositiveIntegerField()
    remarks     = models.CharField(max_length=20)
    json_excluded=[]
    def get_json_dict(self):
        return get_simplified(self, order_item.json_excluded)
