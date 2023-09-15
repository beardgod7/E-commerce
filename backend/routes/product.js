const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../database/models/product");
const Order = require("../database/models/order");
const Shop = require("../database/models/shop");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");

// create product
router.post(
  "/create-product",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }
        
      
        const imagesLinks = [];
      
        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
          });
      
          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }
        const productData = {
          name: req.body.name,
          shopId:req.body.shopId,
          description: req.body.description,
          category: req.body.category,
          discountPrice: req.body.discountPrice,
          stock: req.body.stock,
          images: imagesLinks,
          shop: {
            address: shop.address,
            phoneNumber: shop.phoneNumber,
            email: shop.email,
            name: shop.name,
            reviews: shop.reviews 
          }
        }
        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);


// get all products of a shop
router.get(
    "/get-all-products-shop/:id",
    catchAsyncErrors(async (req, res, next) => {
      try {
        const products = await Product.find({ shopId: req.params.id });
  
        res.status(201).json({
          success: true,
          products,
        });
      } catch (error) {
        return next(new ErrorHandler(error, 400));
      }
    })
  );

// Route to get products by name
router.get(
  "/get-products-by-name/:name",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const productName = req.params.name;

      // Search for products with a similar name using regular expression
      const products = await Product.find({
        name: { $regex: new RegExp(productName, "i") }, // "i" for case-insensitive
      });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);  

//search product by categories
router.get(
  "/get-products-by-category/:category",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const category = req.params.category;

      // Search for products with a similar category using regular expression
      const products = await Product.find({category});

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);  


  // delete product of a shop
  router.delete(
    "/delete-shop-product/:id",
    isSeller,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const product = await Product.findById(req.params.id);
  
        if (!product) {
          return next(new ErrorHandler("Product is not found with this id", 404));
        }    
  
        for (let i = 0; 1 < product.images.length; i++) {
          const result = await cloudinary.v2.uploader.destroy(
            product.images[i].public_id
          );
        }
      
        await product.remove();
  
        res.status(201).json({
          success: true,
          message: "Product Deleted successfully!",
        });
      } catch (error) {
        return next(new ErrorHandler(error, 400));
      }
    })
  );
  
  // get all products
  router.get(
    "/get-all-products",
    catchAsyncErrors(async (req, res, next) => {
      try {
        const products = await Product.find().sort({ createdAt: -1 });
  
        res.status(201).json({
          success: true,
          products,
        });
      } catch (error) {
        return next(new ErrorHandler(error, 400));
      }
    })
  );
// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);  
module.exports = router;
