# Finance Tracker

A comprehensive personal finance and expense tracking application built with Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Features Implemented

### User Authentication
- ✅ User registration and login
- ✅ Secure password hashing with bcrypt
- ✅ Session management using NextAuth.js
- ✅ OTP-based password reset functionality
- ✅ User profile management

### Expense Management
- ✅ Create, read, update, and delete expenses
- ✅ Categorization of expenses
- ✅ Date-based filtering and searching
- ✅ Expense summary and visualization

### User Interface
- ✅ Responsive design with Tailwind CSS
- ✅ Dashboard with expense summaries
- ✅ Navigation with active link highlighting
- ✅ Form validation and error handling
- ✅ User settings page

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- PostgreSQL database
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yashcu/Finance-tracker.git
   cd Finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a .env file in the root directory with the following variables**
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Work Left To Do

### Enhanced Analytics
- [ ] Monthly spending comparison charts
- [ ] Budget tracking and alerts
- [ ] Expense forecasting based on historical data
- [ ] Category-based spending breakdown

### Additional Features
- [ ] Multiple currency support
- [ ] Recurring expenses automation
- [ ] Export expenses to CSV/PDF
- [ ] Dark mode support
- [ ] Mobile app integration

### Technical Improvements
- [ ] Comprehensive test coverage
- [ ] Performance optimization
- [ ] Implementing proper email service for password reset
- [ ] Enhancing security features
- [ ] Implementing rate limiting for API endpoints

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js, bcrypt
- **Styling**: Tailwind CSS, Heroicons

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 