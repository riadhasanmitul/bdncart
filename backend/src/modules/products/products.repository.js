const { query, getClient } = require('../../shared/config/database');

// Create a category (we'll need this to link products to)
async function createCategory({ name, slug, description, parentId = null }) {
  const sql = `
    INSERT INTO categories (name, slug, description, parent_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(sql, [name, slug, description, parentId]);
  return result.rows[0];
}

async function getCategoryBySlug(slug) {
  const sql = `SELECT * FROM categories WHERE slug = $1`;
  const result = await query(sql, [slug]);
  return result.rows[0];
}

// ─────────────────────────────────────────────────────────────────
// PRODUCT TRANSACTIONS
// ─────────────────────────────────────────────────────────────────

async function createProductWithVariants(productData, variantsData, imagesData) {
  // We MUST use a single client for transactions. If one query fails, we rollback the whole thing.
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Insert base product
    const productSql = `
      INSERT INTO products (seller_id, category_id, name, slug, description, brand, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const productRes = await client.query(productSql, [
      productData.sellerId,
      productData.categoryId,
      productData.name,
      productData.slug,
      productData.description,
      productData.brand || null,
      productData.isPublished || false
    ]);
    const productId = productRes.rows[0].id;

    // 2. Insert variants
    const insertedVariants = [];
    for (const variant of variantsData) {
      const variantSql = `
        INSERT INTO product_variants (product_id, sku, price, stock_quantity, attributes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      const vRes = await client.query(variantSql, [
        productId,
        variant.sku,
        variant.price,
        variant.stockQuantity || 0,
        variant.attributes ? JSON.stringify(variant.attributes) : null
      ]);
      insertedVariants.push(vRes.rows[0].id);
    }

    // 3. Insert images (Optional)
    if (imagesData && imagesData.length > 0) {
      for (let i = 0; i < imagesData.length; i++) {
        const img = imagesData[i];
        const imageSql = `
          INSERT INTO product_images (product_id, variant_id, image_url, is_primary, sort_order)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(imageSql, [
          productId,
          img.variantIndex !== undefined ? insertedVariants[img.variantIndex] : null,
          img.url,
          img.isPrimary || false,
          i
        ]);
      }
    }

    await client.query('COMMIT');
    return productId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateProduct(productId, sellerId, productData, variantData, imageData) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Update base product
    const productSql = `
      UPDATE products 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        brand = COALESCE($3, brand),
        category_id = COALESCE($4, category_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND seller_id = $6
      RETURNING id
    `;
    const productRes = await client.query(productSql, [
      productData.name,
      productData.description,
      productData.brand,
      productData.categoryId,
      productId,
      sellerId
    ]);

    if (productRes.rows.length === 0) {
      throw new Error('Product not found or unauthorized');
    }

    // 2. Update variant (assume updating the first active variant)
    if (variantData) {
      const variantSql = `
        UPDATE product_variants
        SET 
          price = COALESCE($1, price),
          stock_quantity = COALESCE($2, stock_quantity),
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $3
        AND id = (
          SELECT id FROM product_variants WHERE product_id = $3 ORDER BY created_at ASC LIMIT 1
        )
      `;
      await client.query(variantSql, [
        variantData.price,
        variantData.stockQuantity,
        productId
      ]);
    }

    // 3. Update or Insert primary image
    if (imageData && imageData.url) {
      // Check if image exists
      const checkImgSql = `SELECT id FROM product_images WHERE product_id = $1 AND is_primary = true LIMIT 1`;
      const checkImgRes = await client.query(checkImgSql, [productId]);
      
      if (checkImgRes.rows.length > 0) {
        // Update existing primary image
        const imgSql = `
          UPDATE product_images
          SET image_url = $1
          WHERE id = $2
        `;
        await client.query(imgSql, [imageData.url, checkImgRes.rows[0].id]);
      } else {
        // Insert new primary image
        const imgSql = `
          INSERT INTO product_images (product_id, image_url, is_primary)
          VALUES ($1, $2, true)
        `;
        await client.query(imgSql, [productId, imageData.url]);
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteProduct(productId, sellerId) {
  const sql = `
    DELETE FROM products 
    WHERE id = $1 AND seller_id = $2
    RETURNING id
  `;
  const result = await query(sql, [productId, sellerId]);
  return result.rows.length > 0;
}

async function getProductList(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;
  const { categoryId, sellerId, search, minPrice, maxPrice, sort } = filters;
  
  // Base query. Notice we LEFT JOIN variants so we can filter/sort by price.
  let sql = `
    SELECT p.id, p.name, p.slug, p.brand, p.is_published, p.created_at,
           c.name as category_name,
           MIN(v.price) as starting_price,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variants v ON p.id = v.product_id
    WHERE p.is_published = true
  `;
  
  const params = [];
  
  // Dynamic Filters
  if (categoryId) {
    params.push(categoryId);
    sql += ` AND p.category_id = $${params.length}`;
  }

  if (sellerId) {
    params.push(sellerId);
    sql += ` AND p.seller_id = $${params.length}`;
  }
  
  if (search) {
    // ILIKE is PostgreSQL's case-insensitive search
    params.push(`%${search}%`);
    sql += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
  }
  
  // We GROUP BY everything from the products table because we used MIN(v.price)
  sql += ` GROUP BY p.id, c.name`;
  
  // HAVING is used to filter on aggregate functions like MIN()
  const havingClauses = [];
  if (minPrice !== undefined) {
    params.push(minPrice);
    havingClauses.push(`MIN(v.price) >= $${params.length}`);
  }
  if (maxPrice !== undefined) {
    params.push(maxPrice);
    havingClauses.push(`MIN(v.price) <= $${params.length}`);
  }
  if (havingClauses.length > 0) {
    sql += ` HAVING ` + havingClauses.join(' AND ');
  }
  
  // Dynamic Sorting
  if (sort === 'price_asc') {
    sql += ` ORDER BY starting_price ASC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY starting_price DESC`;
  } else {
    // Default sort: newest first
    sql += ` ORDER BY p.created_at DESC`;
  }
  
  // Pagination
  params.push(limit);
  sql += ` LIMIT $${params.length}`;
  params.push(offset);
  sql += ` OFFSET $${params.length}`;

  const result = await query(sql, params);
  
  // Get total count (for pagination frontend)
  // Re-build just the WHERE part for the count query
  let countSql = `SELECT COUNT(DISTINCT p.id) FROM products p WHERE p.is_published = true`;
  const countParams = [];
  
  if (categoryId) {
    countParams.push(categoryId);
    countSql += ` AND p.category_id = $${countParams.length}`;
  }
  
  if (sellerId) {
    countParams.push(sellerId);
    countSql += ` AND p.seller_id = $${countParams.length}`;
  }
  if (search) {
    countParams.push(`%${search}%`);
    countSql += ` AND (p.name ILIKE $${countParams.length} OR p.description ILIKE $${countParams.length})`;
  }
  
  // If price filters are used, we must join variants for the count too
  if (minPrice !== undefined || maxPrice !== undefined) {
    countSql += ` AND EXISTS (SELECT 1 FROM product_variants v2 WHERE v2.product_id = p.id`;
    if (minPrice !== undefined) {
      countParams.push(minPrice);
      countSql += ` AND v2.price >= $${countParams.length}`;
    }
    if (maxPrice !== undefined) {
      countParams.push(maxPrice);
      countSql += ` AND v2.price <= $${countParams.length}`;
    }
    countSql += `)`;
  }
  
  const countResult = await query(countSql, countParams);
  
  return {
    products: result.rows,
    total: parseInt(countResult.rows[0].count)
  };
}

async function getProductBySlug(slug) {
  const productSql = `
    SELECT p.*, c.name as category_name, u.first_name as seller_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.seller_id = u.id
    WHERE p.slug = $1
  `;
  const productResult = await query(productSql, [slug]);
  
  if (productResult.rows.length === 0) return null;
  
  const product = productResult.rows[0];
  
  const variantsSql = `SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true`;
  const variantsResult = await query(variantsSql, [product.id]);
  
  const imagesSql = `SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC`;
  const imagesResult = await query(imagesSql, [product.id]);
  
  product.variants = variantsResult.rows;
  product.images = imagesResult.rows;
  
  return product;
}

async function getAllCategories() {
  const sql = `SELECT * FROM categories ORDER BY name ASC`;
  const result = await query(sql);
  return result.rows;
}

module.exports = {
  createCategory,
  getCategoryBySlug,
  createProductWithVariants,
  updateProduct,
  deleteProduct,
  getProductList,
  getProductBySlug,
  getAllCategories
};
