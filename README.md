# Expense Tracker Application

A modern, optimized expense tracking application built with Next.js, Prisma, and NextAuth.js.

## Features

- **User Authentication**: Secure login, signup, and password management with NextAuth.js
- **Expense Management**: Add, view, filter, and paginate expenses
- **Dashboard**: Visual representation of expense data
- **Security**: Secure password reset flow and protection against common attacks
- **Optimized Performance**: Fast page loads and optimized API calls
- **Mobile Responsive**: Works well on all device sizes

## Performance Optimizations

This application has been highly optimized for performance:

### Authentication Optimizations

- **In-memory Caching**: Successful logins are cached to reduce database queries
- **Selective Database Queries**: Only necessary fields are queried from the database
- **JWT Optimization**: Configured for optimal token expiration 
- **Remember Me Feature**: Extended session duration for user convenience
- **Debug Mode**: Only enabled in development environments
- **Connection Pooling**: Optimized database connection management

### Database Optimizations

- **Indexes**: Added strategic indexes to the Prisma schema:
  - Index on the `email` field in the User model
  - Indexes on `userId`, `date`, and `category` fields in the Expense model
  - Composite index on `userId` and `date` for frequently used queries
- **Query Optimization**: Limit fields selected in queries

### API Performance

- **API Caching**: Implemented a TTL-based caching system for API responses
- **Pagination**: Optimized expense retrieval with pagination
- **Dynamic Filtering**: Efficient filtering on the backend
- **Query Parameters**: Support for sorting, limiting, and filtering data

### Frontend Optimizations

- **Code Splitting**: Lazy loading of expensive components
- **Font Optimization**: Using Next.js font optimization to avoid CORS issues
- **Component Optimization**: Memoized calculations and optimized renders
- **Loading States**: Enhanced UX with skeleton loading patterns
- **Edge Analytics**: Performance monitoring for critical user paths

### Developer Experience

- **Performance Metrics**: Built-in tracking of page loads, API calls, and render times
- **Error Logging**: Comprehensive error tracking
- **Development Helpers**: Better console logging for development

## Forgot Password Flow

The application includes a complete password reset flow:

1. User requests password reset on the login page
2. User receives an email with a secure reset link
3. User creates a new password using the secure token
4. System validates token and updates password securely

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- PostgreSQL or another database supported by Prisma

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/expense-tracker.git
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the project root with:
```
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Push the database schema
```bash
npx prisma db push
```

5. Run the development server
```bash
npm run dev
```

## Performance Measurement

The application includes built-in performance measurement tools:

- **Page Load Tracking**: Monitors how quickly pages render
- **API Response Times**: Tracks the speed of API requests
- **Component Render Time**: Identifies slow-rendering components
- **Web Vitals**: Monitors Core Web Vitals metrics
- **Error Tracking**: Captures and logs errors

## Troubleshooting

### Common Issues

- **Database Connection Issues**: Ensure your database is running and credentials are correct
- **Prisma Client Issues**: Run `npx prisma generate` if you encounter Prisma client errors
- **NextAuth Configuration**: Check that NEXTAUTH_SECRET and NEXTAUTH_URL are correctly set

### Performance Debugging

If experiencing slow performance:

1. Check the performance metrics in the developer console
2. Identify slow API calls using the Network tab
3. Review component render times in React DevTools
4. Ensure database indexes are properly applied 