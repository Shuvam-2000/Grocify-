import Product from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js"; 
import Seller from "../models/seller.model.js";

// add new product
export const addNewProduct = async (req, res) => {
  try {
    const { name, description, price, offerPrice, category } = req.body;

    if (!name || !description || !price || !offerPrice || !category) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const sellerId = req.user?.sellerId;
    if (!sellerId) {
      return res.status(401).json({
        message: "Unauthorized: Seller ID not found",
        success: false,
      });
    }

    const images = req.files;
    if (!images || images.length === 0) {
      return res.status(400).json({
        message: "At least one image is required",
        success: false,
      });
    }

    // Upload all images from buffer
    const imageUrls = await Promise.all(
      images.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });
      })
    );

    const productData = await Product.create({
      name,
      description,
      price,
      offerPrice,
      category,
      image: imageUrls,
      seller: sellerId,
    });

    // Add product ID to seller
    await Seller.findByIdAndUpdate(sellerId, {
      $push: { products: productData._id },
    });

    res.status(201).json({
      message: "Product added successfully",
      success: true,
      product: productData,
    });
  } catch (error) {
    console.error("Product Add Error:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// fetch all products
export const fetchProductList = async (req, res) => {
  try {
    const product = await Product.find({})

    // if no product exists
    if(!product) return res.status(404).json({
        message: "No Product Added Exists",
        success: false
    })

    res.status(200).json({
        message: 'Here are the products avaliable',
        success: true,
        product: product
    })

  } catch (error) {
    console.error("Error", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// fetch product info by Id
export const fetchProductbyId = async (req, res) => {
  try {
    const id = req.params.id

    if(!id) return res.status(404).json({
        message: 'Product Id not Found'
    })

    const productInfo = await Product.findById(id)

    if(!productInfo) return res.status(400).json({
        message: 'Product Info Not Found',
        success: false
    })

    res.status(200).json({
        message: "Product Info Found",
        success: true
    })
  } catch (error) {
    console.error("Error", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// change product in stock
export const changeProductInStock = async (req, res) => {
  try {
    const { id , inStock } = req.body;

    await Product.findByIdAndUpdate(id, { inStock });
    res.status(201).json({
        message: "In Stock Updated",
        success: true
    })
  } catch (error) {
    console.error("Error", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};
