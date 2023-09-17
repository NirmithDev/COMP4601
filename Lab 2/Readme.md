1. A way to search for products. You must support the ability to search by name. You must also support the ability to search for all products or only products that are in stock. It
   should be possible to specify both a name search parameter and an all/in-stock search.

   DONE

2. A way to create a new product by accepting a JSON string containing the name, price, x/y/z dimensions, and initial stock quantity of the product.

   DONE (Fixed edge cases)

3. A way to retrieve and view a specific product (i.e., by ID), which must show all of that product's associated information. The server should support the client requesting either
   JSON or HTML representations.

   In progress

4. A way to add a review for a specific product. For now, a review for a product can simply be a rating from 1-10.

   DONE

5. A way to retrieve and view only the REVIEWS for a specific product. The server should support the client requesting either JSON or HTML representations.
   DONE

## Lab 2

1. All of your server’s data is now stored in a database
2. The previous functionality from lab #1 still works
3. You can create orders successfully and the database is appropriately updated
4. Your server rejects orders that are not valid due to:
   a. Missing the purchaser’s name
   b. Product does not exist
   c. Product does not have enough stock
5. You can view the list of orders that exist on the server
6. You can view specific orders and see products that were part of the order

### Code Suggestions

1. for Orders implement a form to add said product to the order collection
2. Maybe use session tokens
