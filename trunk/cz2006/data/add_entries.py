from datetime import *

from django.core.management import call_command

from data.models import *
from web.interface.common import get_queue_number
from web.interface.ofs import ofsBackend

def clearTable(table):
    entries = table.objects.all()
    for i in range(len(entries)-1, -1, -1):
        entries[i].delete()


def rebuildParts(arg, deleted=False):
    # Part: customer related and ofs_user
    # things to clear: customer, cart, cart_item, ofs_user
    if 'u' in arg:
        if not deleted:
            clearTable(customer)
            clearTable(cart)
            clearTable(cart_item)
            clearTable(ofs_user)
        # 2 customers named user1/2
        cus1 = customer(username='user1', barcode='105', password='password',
                        usertype=customer.student, balance=0.0)
        cus2 = customer(username='user2', barcode='106', password='password',
                        usertype=customer.student, balance=0.0)
        cus1.save()
        cus1.build_cart()
        cus2.save()
        cus2.build_cart()

        # 999 test customers
        print "Adding 999 test customers"
        for i in range(1, 1000):
            testcus = customer(username='testuser'+str(i), barcode=str(1000+i), password='password',
                    usertype=customer.student, balance=0.0)
            testcus.save()
            testcus.build_cart()
            if i%10==0:
                print i
        print "999 test customers added"

        # ofs user
        ou1 = ofs_user(username="ofs1", password="password",
            usertype=ofs_user.manager, name="OFS Manager")
        ou2 = ofs_user(username="ofs2", password="password",
            usertype=ofs_user.operator, name="OFS Operator")
        ou1.save()
        ou2.save()
        print "customer, cart, cart_item, ofs_user rebuilt"

    # Part: canteen-related
    # things to clear: canteen, canteen_queues
    if 'c' in arg:
        if not deleted:
            clearTable(canteen)
            clearTable(canteen_queues)
        # canteen
        c1 = canteen(name='Canteen 1', description='Canteen at South Spine')
        c2 = canteen(name='Canteen 2', description='Canteen at North Spine')
        c3 = canteen(name='Canteen 3', description='Canteen at West Spine')
        c4 = canteen(name='Canteen 4', description='Canteen at East Spine')
        c5 = canteen(name='Canteen 5', description='Asian Food Market')
        c6 = canteen(name='Cafeteria', description='Campus Snack Bar')

        # c7 = canteen(name='Can 7', description='some canteen')
        # c8 = canteen(name='Can 8', description='some canteen')
        # c9 = canteen(name='Can 9', description='some canteen')
        c1.save()
        c2.save()
        c3.save()
        c4.save()
        c5.save()
        c6.save()
        # c7.save()
        # c8.save()
        # c9.save()
        
        print "Building queue tables, this may take a while..."
        c1.buildQueueTable()
        c2.buildQueueTable()
        c3.buildQueueTable()
        c4.buildQueueTable()
        c5.buildQueueTable()
        c6.buildQueueTable()
        # c7.buildQueueTable()
        # c8.buildQueueTable()
        # c9.buildQueueTable()
        print "Queue table built"

        print "canteen, canteen_queues rebuilt"

    # Part: stall-related
    # things to clear: stall, stall_user menu_item
    # things to clear: order, order_item
    c1 = canteen.objects.get(id=1)
    c2 = canteen.objects.get(id=2)
    c3 = canteen.objects.get(id=3)
    c4 = canteen.objects.get(id=4)
    c5 = canteen.objects.get(id=5)
    c6 = canteen.objects.get(id=6)
    cus1 = customer.objects.get(username="user1")
    cus2 = customer.objects.get(username="user2")
    if 's' in arg:
        if not deleted:
            clearTable(stall)
            clearTable(stall_user)
            clearTable(menu_item)
            clearTable(order)
            clearTable(order_item)
        # stall
        s1 = stall(name='Xiao Jiang Nan', description='Good Food at LOW Price', 
            canteen=c1, username_prefix="stall1", category="Chinese")
        
        s2 = stall(name='Japanese Delight', description='BEST from Japan', 
            canteen=c1, username_prefix="stall2", category="Japanese")
        
        s3 = stall(name='Korean Euhm-Sheek', description='Traditional Korean Street Food', 
            canteen=c1, username_prefix="stall3", category="Korean")
        
        s4 = stall(name='Happy Chef', description='Fantastic Western Food', 
            canteen=c1, username_prefix="stall4", category="Western")

        s5 = stall(name='Maple Story', description='Original Canadian Food', 
            canteen=c1, username_prefix="stall5", category="Local")

        s6 = stall(name='Veggie Cottage', description='For Vegan and Organic', 
            canteen=c1, username_prefix="stall6", category="Vegetarian")

        s7 = stall(name='Salad Bar', description='Salad for Health Nuts', 
            canteen=c1, username_prefix="stall7", category="Western")

        s8 = stall(name='Brunetti', description='Enjoy your sweet time', 
            canteen=c1, username_prefix="stall8", category="Dessert")

        s9 = stall(name='Yummy Burger', description='Your Personal Favorite', 
            canteen=c2, username_prefix="stall9", category="Western")

        s10 = stall(name='Lao Bei Jing', description='Authentic Northern Chinese Food', 
            canteen=c2, username_prefix="stall10", category="Chinese")

        s11 = stall(name='Fruit Paradise', description='Nothing beats fresh fruit juice that are packed with good nutrients', 
            canteen=c2, username_prefix="stall11", category="Drinks")

        s12 = stall(name='Nakhon Kitchen', description='Good Thai food at affordable prices', 
            canteen=c2, username_prefix="stall12", category="Thai")

        s13 = stall(name='Chikuwa Tei', description='From grab-and-go sushi to yakitori, takoyaki and the Japanese snack foods you should be eating !We pick only the best', 
            canteen=c2, username_prefix="stall13", category="Japanese")

        s14 = stall(name='Cumi Bali', description='Interesting and Exotic Selection of Pan-Indonesian Fare to Satisfy your Taste for Southeast Asian', 
            canteen=c3, username_prefix="stall14", category="Indonesian")

        s15 = stall(name='Moomba', description='Interesting, Delicious, Endearing Australian Food', 
            canteen=c3, username_prefix="stall15", category="Western")

        s16 = stall(name='HoneyMoon', description='Hong Kong style Dessert', 
            canteen=c3, username_prefix="stall16", category="Dessert")

        s17 = stall(name='Thirsty Go Where', description='Freshness is First and Foremost', 
            canteen=c4, username_prefix="stall17", category="Drinks")

        s18 = stall(name='WDS COOKING', description='Every Single Critter to Enjoy from Classic American Food', 
            canteen=c4, username_prefix="stall18", category="Western")

        s19 = stall(name='HoneyMoon', description='Profusion of Exotic Flavours and Fragrances from Thai', 
            canteen=c4, username_prefix="stall19", category="Thai")
        
        s20 = stall(name='Korean Stall', description='Korean Street Food', 
            canteen=c5, username_prefix="stall20", category="Korean")

        s21 = stall(name='Japanese Stall', description='We Serve Variation of Ramen, from the Tonkotsu Ramen of Kyushu to the Miso Ramen of Hokkaido', 
            canteen=c5, username_prefix="stall21", category="Japanese")

        s22 = stall(name='Chinese Stall', description='Traditional Cantonese Dim Sum Delights', 
            canteen=c5, username_prefix="stall22", category="Chinese")


        """
        s1.save()
        s2.save()
        s3.save()
        s4.save()
        s5.save()
        s6.save()
        s7.save()
        s8.save()
        """
        ns1 = {"name":s1.name,"description":s1.description,"category":s1.category,
            "canteen":s1.canteen.id,"username_prefix":s1.username_prefix}
        ns2 = {"name":s2.name,"description":s2.description,"category":s2.category,
            "canteen":s2.canteen.id,"username_prefix":s2.username_prefix}
        ns3 = {"name":s3.name,"description":s3.description,"category":s3.category,
            "canteen":s3.canteen.id,"username_prefix":s3.username_prefix}
        ns4 = {"name":s4.name,"description":s4.description,"category":s4.category,
            "canteen":s4.canteen.id,"username_prefix":s4.username_prefix}
        ns5 = {"name":s5.name,"description":s5.description,"category":s5.category,
            "canteen":s5.canteen.id,"username_prefix":s5.username_prefix}
        ns6 = {"name":s6.name,"description":s6.description,"category":s6.category,
            "canteen":s6.canteen.id,"username_prefix":s6.username_prefix}
        ns7 = {"name":s7.name,"description":s7.description,"category":s7.category,
            "canteen":s7.canteen.id,"username_prefix":s7.username_prefix}
        ns8 = {"name":s8.name,"description":s8.description,"category":s8.category,
            "canteen":s8.canteen.id,"username_prefix":s8.username_prefix}
        ns9 = {"name":s9.name,"description":s9.description,"category":s9.category,
            "canteen":s9.canteen.id,"username_prefix":s9.username_prefix}
        ns10 = {"name":s10.name,"description":s10.description,"category":s10.category,
            "canteen":s10.canteen.id,"username_prefix":s10.username_prefix}
        ns11= {"name":s11.name,"description":s11.description,"category":s11.category,
            "canteen":s11.canteen.id,"username_prefix":s11.username_prefix}
        ns12= {"name":s12.name,"description":s12.description,"category":s12.category,
            "canteen":s12.canteen.id,"username_prefix":s12.username_prefix}
        ns13= {"name":s13.name,"description":s13.description,"category":s13.category,
            "canteen":s13.canteen.id,"username_prefix":s13.username_prefix}
        ns14 = {"name":s14.name,"description":s14.description,"category":s14.category,
            "canteen":s14.canteen.id,"username_prefix":s14.username_prefix}
        ns15 = {"name":s15.name,"description":s15.description,"category":s15.category,
            "canteen":s15.canteen.id,"username_prefix":s15.username_prefix}
        ns16 = {"name":s16.name,"description":s16.description,"category":s16.category,
            "canteen":s16.canteen.id,"username_prefix":s16.username_prefix}
        ns17 = {"name":s17.name,"description":s17.description,"category":s17.category,
            "canteen":s17.canteen.id,"username_prefix":s17.username_prefix}
        ns18 = {"name":s18.name,"description":s18.description,"category":s18.category,
            "canteen":s18.canteen.id,"username_prefix":s18.username_prefix}
        ns19 = {"name":s19.name,"description":s19.description,"category":s19.category,
            "canteen":s19.canteen.id,"username_prefix":s19.username_prefix}
        ns20 = {"name":s20.name,"description":s20.description,"category":s20.category,
            "canteen":s20.canteen.id,"username_prefix":s20.username_prefix}
        ns21 = {"name":s21.name,"description":s21.description,"category":s21.category,
            "canteen":s21.canteen.id,"username_prefix":s21.username_prefix}
        ns22 = {"name":s22.name,"description":s22.description,"category":s22.category,
            "canteen":s22.canteen.id,"username_prefix":s22.username_prefix}
        ofsBackend.int_ofs_stall_add(None, ns1, True)
        ofsBackend.int_ofs_stall_add(None, ns2, True)
        ofsBackend.int_ofs_stall_add(None, ns3, True)
        ofsBackend.int_ofs_stall_add(None, ns4, True)
        ofsBackend.int_ofs_stall_add(None, ns5, True)
        ofsBackend.int_ofs_stall_add(None, ns6, True)
        ofsBackend.int_ofs_stall_add(None, ns7, True)
        ofsBackend.int_ofs_stall_add(None, ns8, True)
        ofsBackend.int_ofs_stall_add(None, ns9, True)
        ofsBackend.int_ofs_stall_add(None, ns10, True)
        ofsBackend.int_ofs_stall_add(None, ns11, True)
        ofsBackend.int_ofs_stall_add(None, ns12, True)
        ofsBackend.int_ofs_stall_add(None, ns13, True)
        ofsBackend.int_ofs_stall_add(None, ns14, True)
        ofsBackend.int_ofs_stall_add(None, ns15, True)
        ofsBackend.int_ofs_stall_add(None, ns16, True)
        ofsBackend.int_ofs_stall_add(None, ns17, True)
        ofsBackend.int_ofs_stall_add(None, ns18, True)
        ofsBackend.int_ofs_stall_add(None, ns19, True)
        ofsBackend.int_ofs_stall_add(None, ns20, True)
        ofsBackend.int_ofs_stall_add(None, ns21, True)
        ofsBackend.int_ofs_stall_add(None, ns22, True)
        
        s1 = stall.objects.get(id=1)
        s2 = stall.objects.get(id=2)
        s3 = stall.objects.get(id=3)
        s4 = stall.objects.get(id=4)
        s5 = stall.objects.get(id=5)
        s6 = stall.objects.get(id=6)
        s7 = stall.objects.get(id=7)
        s8 = stall.objects.get(id=8)

        s9 = stall.objects.get(id=9)
        s10 = stall.objects.get(id=10)
        s11 = stall.objects.get(id=11)
        s12 = stall.objects.get(id=12)
        s13 = stall.objects.get(id=13)
        
        s14 = stall.objects.get(id=14)
        s15 = stall.objects.get(id=15)
        s16 = stall.objects.get(id=16)
                
        s17 = stall.objects.get(id=17)
        s18 = stall.objects.get(id=18)
        s19 = stall.objects.get(id=19)

        s20 = stall.objects.get(id=20)
        s21 = stall.objects.get(id=21)
        s22 = stall.objects.get(id=22)
        """
        s1=ns1
        s2=ns2
        s3=ns3
        s4=ns4
        s5=ns5
        s6=ns6
        s7=ns7
        s8=ns8
        s9=ns9
        s10=ns10
        s11=ns11
        s12=ns12
        s13=ns13
        s14=ns14"""

        """
        # stall user
        su1 = stall_user(username="stall1", password="password",
            usertype=stall_user.manager, name="Stall 1 Manager", stall=s1)
        su2 = stall_user(username="stall2", password="password",
            usertype=stall_user.manager, name="Stall 2 Manager", stall=s2)
        su1.save()
        su2.save()
        """


        # menu item
        m11 = menu_item(stall=s1, name='Curry Beef Fried Rice', price=3.5,
                        description="Marinated ground beef and curry powder add extra flavor to fried rice",
                        img_location="/static/stall/imgs/m11.jpg", is_available_online=True)
        m12 = menu_item(stall=s1, name='Wonton Noodles Soup', price=2.5,
                        description="Steaming hot soup with shrimp wontons and garnished with leafy vegetables",
                        img_location="/static/stall/imgs/m12.jpg", is_available_online=True)
        m13 = menu_item(stall=s1, name='Roast Pork Lo Mein', price=4.0,
                         description="Noodles mixed with stir-fried meat,vegetables and a savory sauce",
                        img_location="/static/stall/imgs/m13.jpg", is_available_online=True)
        m14 = menu_item(stall=s1, name='Sweet & Sour Chicken', price=3.5,
                         description="Chinese-style sweet and sour chicken, stir-fried with bell peppers and pineapple chunks",
                        img_location="/static/stall/imgs/m14.jpg", is_available_online=True)
        m15 = menu_item(stall=s1, name='Chicken Chow Mein', price=3.0,
                         description="Egg noodles with chicken, cabbage, bean sprouts and supreme soy sauce",
                        img_location="/static/stall/imgs/m15.jpg", is_available_online=True)
        m16 = menu_item(stall=s1, name='Xiao Long Bao', price=3.5,
                        description="Delicious steamed bun from the Jiangnan region of China",
                        img_location="/static/stall/imgs/m16.jpg", is_available_online=True)

        m21 = menu_item(stall=s2, name='Ochazuke', price=2.5, description="Hot green tea poured over cooked white rice, with various savory ingredients", img_location="/static/stall/imgs/m21.jpg", is_available_online=True)
        m22 = menu_item(stall=s2, name='Katsudon', price=3.5, description="Donburi topped with deep-fried breaded cutlet of pork", img_location="/static/stall/imgs/m22.jpg", is_available_online=True)
        m23 = menu_item(stall=s2, name='Hiyashi chuka', price=2.5, description="Thin, yellow noodles served cold with a variety of toppings,", img_location="/static/stall/imgs/m23.jpg", is_available_online=True)
        m24 = menu_item(stall=s2, name='Beef Yaki udon', price=4.5, description="Fried udon noodles with beef", img_location="/static/stall/imgs/m24.jpg", is_available_online=True)
        m25 = menu_item(stall=s2, name='Okonomiyaki', price=4.0, description="Pancake with seafood, vegetables and meat are mixed into a batter and grilled", img_location="/static/stall/imgs/m25.jpg", is_available_online=True)
        m26 = menu_item(stall=s2, name='Nikujaga', price=5.5, description="beef and potato stew, flavoured with sweet soy", img_location="/static/stall/imgs/m26.jpg", is_available_online=True)

        m31 = menu_item(stall=s3, name='Bulgogi', price=4.5,
                        description="Shredded beef marinated in soy sauce, sesame oil, garlic, sugar, scallions, and black pepper, cooked on a grill",
                        img_location="/static/stall/imgs/m31.jpg", is_available_online=True)
        m32 = menu_item(stall=s3, name='Kimchi jjigae', price=4.0,
                        description="A soup made with mainly kimchi, pork, and tofu ",
                        img_location="/static/stall/imgs/m32.jpg", is_available_online=True)
        m33 = menu_item(stall=s3, name='Bibimbap', price=4.0,
                        description="Mixed rice topped with seasoned vegetables ",
                        img_location="/static/stall/imgs/m33.jpg", is_available_online=True)
        m34 = menu_item(stall=s3, name='Sundae', price=3.5,
                        description="Korean sausage made with a mixture of boiled sweet rice, oxen or pig's blood, potato noodle, mung bean sprouts",
                        img_location="/static/stall/imgs/m34.jpg", is_available_online=True)
        m35 = menu_item(stall=s3, name='Kimbap', price=3.0,
                        description="Popular snack in Korea",
                        img_location="/static/stall/imgs/m35.jpg", is_available_online=True)
        m36 = menu_item(stall=s3, name='Ddeokbokki', price=3.5,
                        description="A casserole dish which is made with sliced rice cake, seasoned beef, fish cakes, and vegetables",
                        img_location="/static/stall/imgs/m36.jpg", is_available_online=True)

        m41 = menu_item(stall=s4, name='Spicy Potato Wedges', price=3.5,
                        description="Seasoned with spicy herbs and fried till golden brown",
                        img_location="/static/stall/imgs/m41.jpg", is_available_online=True)
        m42 = menu_item(stall=s4, name='Crispy Calamari', price=4.0,
                        description="Crispy squid rings served with salsa sauce",
                        img_location="/static/stall/imgs/m42.jpg", is_available_online=True)
        m43 = menu_item(stall=s4, name='Seafood Bisque', price=4.5,
                        description="Creamy bouillabaisse seafood soup",
                        img_location="/static/stall/imgs/m43.jpg", is_available_online=True)
        m44 = menu_item(stall=s4, name='Chicken Tikka Masala', price=4.5,
                        description="Roasted chunks (tikka) of chicken in a spicy sauce",
                        img_location="/static/stall/imgs/m44.jpg", is_available_online=True)
        m45 = menu_item(stall=s4, name='Chicken Sandwich', price=3.5,
                        img_location="/static/stall/imgs/m45.jpg", is_available_online=True)
        m46 = menu_item(stall=s4, name='Black Pepper Chicken', price=5.5,
                        img_location="/static/stall/imgs/m46.jpg", is_available_online=True)
        m47 = menu_item(stall=s4, name='Grilled Fish with Herb', price=6.5,
                        img_location="/static/stall/imgs/m47.jpg", is_available_online=True)
        
        m51 = menu_item(stall=s5, name='Poutine', price=3.5,
                        description="French fries generously slathered in gravy and cheese curds",
                        img_location="/static/stall/imgs/m51.jpg", is_available_online=True)
        m52 = menu_item(stall=s5, name='Butter Tarts', price=3.5,
                        description="Classic Canadian dessert made with butter, sugar, syrup and eggs and filled in a buttery,pastry shell",
                        img_location="/static/stall/imgs/m52.jpg", is_available_online=True)
        m53 = menu_item(stall=s5, name='Beaver Tail', price=4.5,
                        description="The fried-dough treats are shaped to resemble real beaver tails and are topped with chocolate, candy, and fruit",
                        img_location="/static/stall/imgs/m53.jpg", is_available_online=True)
        m54 = menu_item(stall=s5, name='Donairs', price=6.0,
                        description="Made of spiced ground beef that has been shaped and pressed into a large loaf and then roasted on a spit",
                        img_location="/static/stall/imgs/m54.jpg", is_available_online=True)
        m55 = menu_item(stall=s5, name='Sushi Pizza', price=10.0,
                        description=" Mini pizza-like creation of a fried rice cake topped with raw fish and spicy mayo",
                        img_location="/static/stall/imgs/m55.jpg", is_available_online=True)
        m56 = menu_item(stall=s5, name='Cretons', price=6.5,
                        description="Pork spread containing onions and spices",
                        img_location="/static/stall/imgs/m56.jpg", is_available_online=True)
        m57 = menu_item(stall=s5, name='Rappie Pie', price=5.5,
                        description="Traditional Acadian dish made from shredded potatoes, with meat and onions.",
                        img_location="/static/stall/imgs/m57.jpg", is_available_online=True)
        m58 = menu_item(stall=s5, name='Montreal bagels', price=2.5,
                        img_location="/static/stall/imgs/m58.jpg", is_available_online=True)

        m61 = menu_item(stall=s6, name='Kung Pao Tofu', price=3.5,
                        description="Stir-fried tofu and lots of fresh vegetables",
                        img_location="/static/stall/imgs/m61.jpg", is_available_online=True)
        m62 = menu_item(stall=s6, name='Garden-Fresh Stir-Fry with Seitan', price=4.0,
                        description=" Seitan's toothsome texture and taste make it a perfect vegetarian dish",
                        img_location="/static/stall/imgs/m62.jpg", is_available_online=True)
        m63 = menu_item(stall=s6, name='Basque Vegetable Rice', price=4.0,
                        description="Zucchini, onion, tomatoes and bell peppers stud this paella-inspired rice dish",
                        img_location="/static/stall/imgs/m63.jpg", is_available_online=True)


      
        m71 = menu_item(stall=s7, name='Caesar Salad', price=5.5,img_location="/static/stall/imgs/m71.jpg", is_available_online=True)
        m72 = menu_item(stall=s7, name='Classic Macaroni Salad', price=4.5, img_location="/static/stall/imgs/m72.jpg", is_available_online=True)
        m73 = menu_item(stall=s7, name='Greek Pasta Salad', price=4.5,img_location="/static/stall/imgs/m73.jpg", is_available_online=True)
        m74 = menu_item(stall=s7, name='Broccoli and Tortellini Salad', price=5.5, img_location="/static/stall/imgs/m74.jpg", is_available_online=True)
        m75 = menu_item(stall=s7, name='Egg Salad', price=3.5, img_location="/static/stall/imgs/m75.jpg", is_available_online=True)

        m81 = menu_item(stall=s8, name='Blueberry Grunt', price=4.5,img_location="/static/stall/imgs/m81.jpg", is_available_online=True)
        m82 = menu_item(stall=s8, name='Bananas Foster', price=3.5,img_location="/static/stall/imgs/m82.jpg", is_available_online=True)
        m83 = menu_item(stall=s8, name='New York Cheesecake', price=5.5,  img_location="/static/stall/imgs/m83.jpg", is_available_online=True)
        m84 = menu_item(stall=s8, name='Apple Pie', price=2.5, img_location="/static/stall/imgs/m84.jpg", is_available_online=True)
        m85 = menu_item(stall=s8, name='Black Magic Cake', price=6.0, img_location="/static/stall/imgs/m85.jpg", is_available_online=True)
        m86 = menu_item(stall=s8, name='Frozen Yogurt', price=3.5, img_location="/static/stall/imgs/m86.jpg", is_available_online=True)
        m87 = menu_item(stall=s8, name='Lime Pie', price=4.5, img_location="/static/stall/imgs/m87.jpg", is_available_online=True)
        m88 = menu_item(stall=s8, name='Iced Latte', price=3.5,img_location="/static/stall/imgs/m88.jpg", is_available_online=True)
        m89 = menu_item(stall=s8, name='Iced Earl Grey', price=3.5,img_location="/static/stall/imgs/m89.jpg", is_available_online=True)

        m91 = menu_item(stall=s9, name='Cheese Burger', price=2.5,img_location="/static/stall/imgs/m91.jpg", is_available_online=True)
        m92 = menu_item(stall=s9, name='Spicy Texas Chili Burger', price=3.5,img_location="/static/stall/imgs/m92.jpg", is_available_online=True)
        m93 = menu_item(stall=s9, name='Mega Bite', price=5.0,  img_location="/static/stall/imgs/m93.jpg", is_available_online=True)
        m94 = menu_item(stall=s9, name='Salmon Burger', price=4.5, img_location="/static/stall/imgs/m94.jpg", is_available_online=True)
        m95 = menu_item(stall=s9, name='Teriyaki Burger', price=4.5, img_location="/static/stall/imgs/m95.jpg", is_available_online=True)
        m96 = menu_item(stall=s9, name='Fish Burger', price=4.5, img_location="/static/stall/imgs/m96.jpg", is_available_online=True)
        m97 = menu_item(stall=s9, name='The Matiz', price=4.5, img_location="/static/stall/imgs/m97.jpg", is_available_online=True)
        m98 = menu_item(stall=s9, name='Vienna Sausage Burger', price=3.5,img_location="/static/stall/imgs/m98.jpg", is_available_online=True)

        m101 = menu_item(stall=s10, name='Chive dumplings', price=3.5,img_location="/static/stall/imgs/m101.jpg", is_available_online=True)
        m102 = menu_item(stall=s10, name='Special Zhajiang Noodles', price=3.5,img_location="/static/stall/imgs/m102.jpg", is_available_online=True)
        m103 = menu_item(stall=s10, name='Steamed Siew Mai', price=3.0,  img_location="/static/stall/imgs/m103.jpg", is_available_online=True)
        m104 = menu_item(stall=s10, name='Fried Rice with Egg ', price=2.5, img_location="/static/stall/imgs/m104.jpg", is_available_online=True)
        m105 = menu_item(stall=s10, name='Stir-fried Seasonal Vegetables', price=3.5, img_location="/static/stall/imgs/m105.jpg", is_available_online=True)
        m106 = menu_item(stall=s10, name='Sauteed Diced Chicken', price=4.5, img_location="/static/stall/imgs/m106.jpg", is_available_online=True)

        m111 = menu_item(stall=s11, name='Watermelon Juice', price=1.5,img_location="/static/stall/imgs/m111.jpg", is_available_online=True)
        m112 = menu_item(stall=s11, name='Banana Milkshake', price=2.5,img_location="/static/stall/imgs/m112.jpg", is_available_online=True)
        m113 = menu_item(stall=s11, name='Apple Juice', price=1.5,  img_location="/static/stall/imgs/m113.jpg", is_available_online=True)
        m114 = menu_item(stall=s11, name='Kiwi Juice ', price=1.5, img_location="/static/stall/imgs/m114.jpg", is_available_online=True)
        m115 = menu_item(stall=s11, name='Avocado Coffee Smoothie', price=3.0, img_location="/static/stall/imgs/m115.jpg", is_available_online=True)
        m116 = menu_item(stall=s11, name='Pineapple Juice', price=1.5, img_location="/static/stall/imgs/m116.jpg", is_available_online=True)
        m117 = menu_item(stall=s11, name='Tomato Juice', price=1.5,img_location="/static/stall/imgs/m117.jpg", is_available_online=True)
        m118 = menu_item(stall=s11, name='Orange Juice', price=1.5,img_location="/static/stall/imgs/m118.jpg", is_available_online=True)
        m119 = menu_item(stall=s11, name='Mixed Fruit Juice', price=3.0,  img_location="/static/stall/imgs/m119.jpg", is_available_online=True)
    
        m121 = menu_item(stall=s12, name='Gaeng Pet Mooo', price=3.5,
                         description="Red Curry with Pork",
                         img_location="/static/stall/imgs/m121.jpg", is_available_online=True)
        m122 = menu_item(stall=s12, name='Nam Prik Kapi Pla Too', price=4.5,
                         description="Fried Mackerel with Shrimp Paste Sauce",
                         img_location="/static/stall/imgs/m122.jpg", is_available_online=True)
        m123 = menu_item(stall=s12, name='Tom Yum Gai', price=4.5,
                         description="Hot and Sour Chicken Soup",
                         img_location="/static/stall/imgs/m123.jpg", is_available_online=True)
        m124 = menu_item(stall=s12, name='Por Pia Tod', price=3.5,
                         description="Deep Fried Spring Rolls",
                         img_location="/static/stall/imgs/m124.jpg", is_available_online=True)
        m125 = menu_item(stall=s12, name='Som Tam Polamai', price=3.0,
                         description="Som Tam Fruit Salad",
                         img_location="/static/stall/imgs/m125.jpg", is_available_online=True)

        m131 = menu_item(stall=s13, name='Chicken Balls', price=1.5,
                         description="Gigantic healthy minced meat with vegetables",
                         img_location="/static/stall/imgs/m131.jpg", is_available_online=True)
        m132 = menu_item(stall=s13, name='Mini Harshed Potato', price=0.8,
                         description="Mini yet as delicious as the regular sized",
                         img_location="/static/stall/imgs/m132.jpg", is_available_online=True)
        m133 = menu_item(stall=s13, name='Pork With Asparagus', price=2.5,
                         description="Hand-rolled sliced of pork with few healthy asparagus",
                         img_location="/static/stall/imgs/m133.jpg", is_available_online=True)
        m134 = menu_item(stall=s13, name='Kappa Maki (4 pcs)', price=2.5,
                         description="Cucumber rolls",
                         img_location="/static/stall/imgs/m134.jpg", is_available_online=True)
        m135 = menu_item(stall=s13, name='Unagi (2pcs)', price=2.5,
                         description="Fresh Water Eel",
                         img_location="/static/stall/imgs/m135.jpg", is_available_online=True)
        m136 = menu_item(stall=s13, name='Ebi (2pcs)', price=2.5,
                         description="Shrimp",
                         img_location="/static/stall/imgs/m136.jpg", is_available_online=True)
        m137 = menu_item(stall=s13, name='Amaebi (2pcs)', price=2.8,
                         description="Sweet Shrimp",
                         img_location="/static/stall/imgs/m137.jpg", is_available_online=True)
        m138 = menu_item(stall=s13, name='Maguro (2pcs)', price=2.5,
                         description="Tuna",
                         img_location="/static/stall/imgs/m138.jpg", is_available_online=True)
        m139 = menu_item(stall=s13, name='Sake (2pcs)', price=2.5,
                         description="Salmon",
                         img_location="/static/stall/imgs/m139.jpg", is_available_online=True)
        
        m141 = menu_item(stall=s14, name='Ayam Bakar', price=3.5,
                         description="Charcoal-grilled spiced chicken",
                         img_location="/static/stall/imgs/m141.jpg", is_available_online=True)
        m142 = menu_item(stall=s14, name='Ayam Goreng', price=3.8,
                         description="Deep fried spiced chicken in coconut oil",
                         img_location="/static/stall/imgs/m142.jpg", is_available_online=True)
        m143 = menu_item(stall=s14, name='Ayam Kalasan', price=3.5,
                         description="Fried free-range-chicken with kremes (crispy granules).",
                         img_location="/static/stall/imgs/m143.jpg", is_available_online=True)
        m144 = menu_item(stall=s14, name='Kwetiau Goreng', price=3.0,
                         description="Stir fried flat noodle",
                         img_location="/static/stall/imgs/m144.jpg", is_available_online=True)
        m145 = menu_item(stall=s14, name='Sambal Goreng Teri', price=2.5,
                         description="Spicy salted anchovy with peanuts",
                         img_location="/static/stall/imgs/m145.jpg", is_available_online=True)

        
        m151 = menu_item(stall=s15, name='Grilled Tenderloin Steak', price=5.5,
                         description="Steak grilled to your liking, topped with red wine pepper sauce",
                         img_location="/static/stall/imgs/m151.jpg", is_available_online=True)
        m152 = menu_item(stall=s15, name='Lamb Cutlet', price=6.0,
                         description="Lamb cutlets charbroiled to perfection, topped with minty flavour demi glaze",
                         img_location="/static/stall/imgs/m152.jpg", is_available_online=True)
        m153 = menu_item(stall=s15, name='Masala Fish & Chips', price=5.5,
                         description="Dory fillet coated with an array of aromatic herbs and spices, deep-fried in batter",
                         img_location="/static/stall/imgs/m153.jpg", is_available_online=True)
        m154 = menu_item(stall=s15, name='Crinkle-Cut Fries', price=3.5,
                         description="Fried till golden brown and tossed in cajun powder",
                         img_location="/static/stall/imgs/m154.jpg", is_available_online=True)  
        m155 = menu_item(stall=s15, name='Prawn Salad', price=4.5,
                         description="Crispy lettuce tossed in a creamy garlic sauce",
                         img_location="/static/stall/imgs/m155.jpg", is_available_online=True)

        
        m161 = menu_item(stall=s16, name='Almond Tea', price=3.0,img_location="/static/stall/imgs/m161.jpg", is_available_online=True)
        m162 = menu_item(stall=s16, name='Seame and Walnut Soup', price=3.0,img_location="/static/stall/imgs/m162.jpg", is_available_online=True)
        m163 = menu_item(stall=s16, name='Mango Pomelo', price=3.5,img_location="/static/stall/imgs/m163.jpg", is_available_online=True)
        m164 = menu_item(stall=s16, name='Durian Grass Jelly in Vanilla ', price=4.5,img_location="/static/stall/imgs/m164.jpg", is_available_online=True)
        m165 = menu_item(stall=s16, name='Mixed Fruits Tofu Pudding', price=4.0,img_location="/static/stall/imgs/m165.jpg", is_available_online=True) 


        m11.save()
        m12.save()
        m13.save()
        m14.save()
        m15.save()
        m16.save()
        m21.save()
        m22.save()
        m23.save()
        m24.save()
        m25.save()
        m26.save()
        m31.save()
        m32.save()
        m33.save()
        m34.save()
        m35.save()
        m36.save()
        m41.save()
        m42.save()
        m43.save()
        m44.save()
        m45.save()
        m46.save()
        m47.save()
        m51.save()
        m52.save()
        m53.save()
        m54.save()
        m55.save()
        m56.save()
        m57.save()
        m58.save()
        m61.save()
        m62.save()
        m63.save()
        m71.save()
        m72.save()
        m73.save()
        m74.save()
        m75.save()
        m81.save()
        m82.save()
        m83.save()
        m84.save()
        m85.save()
        m86.save()
        m87.save()
        m88.save()
        m89.save()
        m91.save()
        m92.save()
        m93.save()
        m94.save()
        m95.save()
        m96.save()
        m97.save()
        m98.save()
        m101.save()
        m102.save()
        m103.save()
        m104.save()
        m105.save()
        m106.save()
        m111.save()
        m112.save()
        m113.save()
        m114.save()
        m115.save()
        m116.save()
        m117.save()
        m118.save()
        m119.save()
        m121.save()
        m122.save()
        m123.save()
        m124.save()
        m125.save()
        m131.save()
        m132.save()
        m133.save()
        m134.save()
        m135.save()
        m136.save()       
        m137.save()
        m138.save()
        m139.save()
        m141.save()
        m142.save()
        m143.save()
        m144.save()
        m145.save()
        m151.save()
        m152.save()
        m153.save()
        m154.save()
        m155.save()
        m161.save()
        m162.save()
        m163.save()
        m164.save()
        m165.save()
        
        # order
        order1 = order(customer=cus1, stall = s1, 
            queue_num=get_queue_number(s1.canteen, cus1), 
            payment_time=datetime.now(),total=2.5)
        order2 = order(customer=cus2, stall = s2, 
            queue_num=get_queue_number(s2.canteen, cus2), 
            payment_time=datetime.now(),total=4)
        order1.save()
        order2.save()

        # order item
        oi11 = order_item(order=order1, item=m11, quantity=1, remarks='spicy')
        oi12 = order_item(order=order1, item=m12, quantity=2)
        oi21 = order_item(order=order2, item=m21, quantity=1)
        oi11.save()
        oi12.save()
        oi21.save()

        print "stall, stall_user, menu_item, order, order_item rebuilt"

def rebuildData():
    call_command('flush')
    rebuildParts('ucs', True)
    print "Data rebuild complete"

def rebuildHelp():
    print "Call rebuildData() to delete everything and rebuild everything. This takes a lot of time"
    print "Call rebuildParts(arg) to rebuild part of the database"
    print "  arg is a string that may contain several letters:"
    print "  u: rebuild customer and ofs_user (slow)"
    print "  c: rebuild canteen (super slow)"
    print "  s: rebuild stall, menu_item and orders (fast)"
