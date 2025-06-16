// API route for product catalog access
import { NextRequest, NextResponse } from 'next/server';
import { 
  PRICING_CATALOG, 
  ORGANIZED_CATALOG, 
  PRODUCT_CATEGORIES,
  getAllProducts,
  getProductsByCategory,
  searchProducts,
  getPriceByName
} from '@/data/pricing';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const product = searchParams.get('product');

  try {
    switch (action) {
      case 'categories':
        return NextResponse.json({
          success: true,
          categories: PRODUCT_CATEGORIES,
          description: "Categorías disponibles de productos"
        });

      case 'by-category':
        if (!category) {
          return NextResponse.json(
            { error: 'Parámetro category es requerido' },
            { status: 400 }
          );
        }
        
        const categoryKey = category.toUpperCase() as keyof typeof PRODUCT_CATEGORIES;
        if (!(categoryKey in PRODUCT_CATEGORIES)) {
          return NextResponse.json(
            { error: 'Categoría no válida' },
            { status: 400 }
          );
        }

        const categoryProducts = getProductsByCategory(categoryKey);
        return NextResponse.json({
          success: true,
          category: PRODUCT_CATEGORIES[categoryKey],
          products: categoryProducts,
          count: categoryProducts.length
        });

      case 'search':
        if (!search) {
          return NextResponse.json(
            { error: 'Parámetro search es requerido' },
            { status: 400 }
          );
        }

        const searchResults = searchProducts(search);
        return NextResponse.json({
          success: true,
          query: search,
          products: searchResults,
          count: searchResults.length
        });

      case 'price':
        if (!product) {
          return NextResponse.json(
            { error: 'Parámetro product es requerido' },
            { status: 400 }
          );
        }

        const price = getPriceByName(product);
        if (price === 0) {
          return NextResponse.json(
            { error: 'Producto no encontrado' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          product,
          price,
          currency: 'USD'
        });

      case 'organized':
        return NextResponse.json({
          success: true,
          catalog: ORGANIZED_CATALOG,
          totalProducts: getAllProducts().length,
          totalCategories: Object.keys(PRODUCT_CATEGORIES).length
        });

      default:
        // Return all products by default
        const allProducts = getAllProducts();
        return NextResponse.json({
          success: true,
          products: allProducts,
          totalProducts: allProducts.length,
          rawCatalog: PRICING_CATALOG,
          actions: {
            categories: "/api/billing/products?action=categories",
            byCategory: "/api/billing/products?action=by-category&category=HARDWARE_TPV",
            search: "/api/billing/products?action=search&search=hiopos",
            price: "/api/billing/products?action=price&product=HiOffice Lite",
            organized: "/api/billing/products?action=organized"
          }
        });
    }
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST method for batch price lookup
export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();
    
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: 'products debe ser un array de nombres de productos' },
        { status: 400 }
      );
    }

    const results = products.map(productName => {
      const price = getPriceByName(productName);
      return {
        name: productName,
        price,
        found: price > 0
      };
    });

    const totalPrice = results
      .filter(r => r.found)
      .reduce((sum, r) => sum + r.price, 0);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        requested: products.length,
        found: results.filter(r => r.found).length,
        notFound: results.filter(r => !r.found).length,
        totalPrice
      }
    });

  } catch (error) {
    console.error('Error in batch price lookup:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}