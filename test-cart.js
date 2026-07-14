async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john.doe@example.com', password: 'Password123!' })
    });
    const loginData = await res.json();
    const token = loginData.data.accessToken;
    
    const prodRes = await fetch('http://localhost:3000/api/v1/products/apple-iphone-15-pro-95654');
    const prodData = await prodRes.json();
    console.log("Product:", prodData.data.product.variants);
    const variantId = prodData.data.product.variants[0].id;
    console.log("Variant ID:", variantId);
    
    const cartRes = await fetch('http://localhost:3000/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ variantId, quantity: 1 })
    });
    const cartData = await cartRes.json();
    console.log("Cart Response:", cartData);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
