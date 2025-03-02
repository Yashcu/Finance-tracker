import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// In-memory results cache with TTL
const CACHE_TTL = 30000; // 30 seconds
const cache = new Map<string, { data: any; timestamp: number; userId: string }>();

// Clear expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60000); // Clean up every minute

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const category = url.searchParams.get('category');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const order = url.searchParams.get('order') || 'desc';
    
    // Create cache key based on query params and user ID
    const cacheKey = `expenses-${session.user.id}-${page}-${limit}-${category}-${startDate}-${endDate}-${sortBy}-${order}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData && cachedData.userId === session.user.id && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      return NextResponse.json(cachedData.data);
    }

    // Build where clause based on filters
    const where: any = { userId: session.user.id };
    
    if (category) {
      where.category = category;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Fetch count for pagination
    const totalCount = await prisma.expense.count({ where });
    
    // Order by dynamic field
    const orderBy: any = {};
    orderBy[sortBy] = order;

    // Paginate results
    const expenses = await prisma.expense.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // Prepare response with pagination metadata
    const result = {
      data: expenses,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
    
    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      userId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { amount, category, description, date } = await req.json();

    if (!amount || !category || !description || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
        userId: session.user.id
      }
    });

    // Invalidate cache for this user
    for (const [key, value] of cache.entries()) {
      if (value.userId === session.user.id) {
        cache.delete(key);
      }
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
} 